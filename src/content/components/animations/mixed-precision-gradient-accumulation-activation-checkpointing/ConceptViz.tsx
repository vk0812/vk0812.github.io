import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke visuals for the mixed precision / gradient accumulation /
   activation checkpointing post.

   ActivationRecomputeDiagram is the one bespoke GSAP piece, it narrates the
   part of activation checkpointing that is genuinely about motion, a value
   getting computed, thrown away, and reappearing later through a different
   path (a short forward replay) instead of having stayed in memory the whole
   time. Theme comes entirely from CSS vars (.viz / .dark .viz in index.css).

   MemoryBreakdownBars is a static, non-GSAP stacked bar built from plain
   Tailwind divs (same pattern as NormAxisDiagram and ReplicationDiagram
   elsewhere in this codebase), showing where training memory actually goes.
---------------------------------------------------------------------------- */

const NS = "http://www.w3.org/2000/svg";
type Api = {
  play: () => void;
  pause: () => void;
  resume: () => void;
  setRate: (r: number) => void;
  cleanup: () => void;
};

function mk(root: Element, tag: string, attrs: Record<string, string | number> = {}) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  root.appendChild(n);
  return n;
}
function mkText(root: Element, str: string, x: number, y: number, cls = "viz-label", anchor = "start") {
  const t = mk(root, "text", { x, y, class: cls, "text-anchor": anchor });
  t.textContent = str;
  return t;
}

/* ===========================================================================
   Shared figure wrapper: framer-motion entrance + in-view trigger + replay
=========================================================================== */
const CTRL = "font-mono text-xs tracking-widest h-8 px-3 inline-flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors rounded";
const CTRL_ON = "font-mono text-xs tracking-widest h-8 px-3 inline-flex items-center justify-center border border-foreground bg-foreground text-background rounded";

function VizFigure({
  caption, viewBox, maxW = "max-w-2xl", setup,
}: {
  caption: string;
  viewBox: string;
  maxW?: string;
  delay?: number;
  setup: (svg: SVGSVGElement) => Api;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const apiRef = useRef<Api | null>(null);
  const rateRef = useRef(1);
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);

  const doPlay = () => {
    const api = apiRef.current;
    if (!api) return;
    api.play();
    api.setRate(rateRef.current);
    setPlaying(true);
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const api = setup(svg);
    apiRef.current = api;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { doPlay(); io.disconnect(); } }),
      { threshold: 0.25 }
    );
    io.observe(svg);
    return () => { io.disconnect(); api.cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup]);

  const togglePlay = () => {
    const api = apiRef.current;
    if (!api) return;
    if (playing) { api.pause(); setPlaying(false); }
    else { api.resume(); setPlaying(true); }
  };
  const pickRate = (r: number) => {
    rateRef.current = r;
    setRate(r);
    apiRef.current?.setRate(r);
  };

  return (
    <motion.figure
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className={`mb-8 mx-auto ${maxW}`}
    >
      <div className="viz rounded-lg border border-border bg-card p-3 sm:p-5 shadow-sm">
        <svg ref={svgRef} viewBox={viewBox} preserveAspectRatio="xMidYMid meet" />
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button onClick={togglePlay} className={CTRL} style={{ minWidth: "5.5rem" }}>
            {playing ? "❚❚ PAUSE" : "▶ PLAY"}
          </button>
          <button onClick={doPlay} className={CTRL}>↻ REPLAY</button>
          <span className="w-px h-5 bg-border mx-1" aria-hidden />
          {[0.5, 1, 2].map((r) => (
            <button key={r} onClick={() => pickRate(r)} className={rate === r ? CTRL_ON : CTRL}>
              {r}×
            </button>
          ))}
        </div>
      </div>
      {caption && (
        <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">
          {caption}
        </figcaption>
      )}
    </motion.figure>
  );
}

/* ===========================================================================
   ACTIVATION RECOMPUTE — three layers stacked vertically. Layer 1 and Layer 3
   keep their activations in memory. Layer 2's activation is produced, then
   dropped. When the backward pass reaches layer 2 it has nothing to work
   with, so a short forward replay from layer 1's stored activation rebuilds
   it just in time, before backward continues on toward the input.

   Coordinates verified with scripts/check-svg-layout.py against a scratch
   JSON mirroring these exact boxes and edges, zero collisions.
=========================================================================== */
function setupActivationRecompute(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const mkMarker = (id: string, cls: string) => {
    const m = mk(defs, "marker", {
      id, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
    });
    mk(m, "path", { d: "M0,0 L10,5 L0,10 z", class: cls });
  };
  mkMarker(`ar-fwd-${uid}`, "viz-arrow-ink");
  mkMarker(`ar-bwd-${uid}`, "viz-arrow-blue");
  mkMarker(`ar-re-${uid}`, "viz-arrow-warn");

  const phase = mkText(svg, "", 320, 42, "viz-phase", "middle");

  type Layer = { cx: number; cy: number; name: string; sub: string };
  const layers: Layer[] = [
    { cx: 320, cy: 145, name: "Layer 1", sub: "checkpoint" },
    { cx: 320, cy: 365, name: "Layer 2", sub: "" },
    { cx: 320, cy: 585, name: "Layer 3", sub: "output" },
  ];

  const layerBoxes = layers.map((l) => {
    mk(svg, "rect", { x: l.cx - 70, y: l.cy - 35, width: 140, height: 70, rx: 10, class: "viz-box" });
    mkText(svg, l.name, l.cx, l.cy - 4, "viz-node-lbl", "middle");
    if (l.sub) mkText(svg, l.sub, l.cx, l.cy + 14, "viz-label-sm", "middle");
    return l;
  });

  // activation slots: a faint outlined placeholder always present, a solid
  // fill on top that fades in and out to show whether the activation is
  // currently held in memory.
  const actCx = 535;
  const actFills = layerBoxes.map((l) => {
    mk(svg, "rect", { x: actCx - 55, y: l.cy - 30, width: 110, height: 60, rx: 8, class: "viz-ghost viz-thin" });
    const fill = mk(svg, "rect", { x: actCx - 55, y: l.cy - 30, width: 110, height: 60, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
    mkText(svg, "activation", actCx, l.cy - 4, "viz-label-sm", "middle");
    return fill;
  });

  const selfDraw = (x1: number, y1: number, x2: number, y2: number, cls: string, marker: string) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const ln = mk(svg, "line", { x1, y1, x2, y2, class: cls, "marker-end": `url(#${marker})`, opacity: 0 }) as SVGLineElement;
    ln.style.strokeDasharray = String(len);
    ln.style.strokeDashoffset = String(len);
    return { el: ln, len };
  };

  const hA = selfDraw(390, 145, 480, 145, "viz-stroke", `ar-fwd-${uid}`);
  const hB = selfDraw(390, 365, 480, 365, "viz-stroke", `ar-fwd-${uid}`);
  const hC = selfDraw(390, 585, 480, 585, "viz-stroke", `ar-fwd-${uid}`);
  const fwdAB = selfDraw(320, 180, 320, 330, "viz-stroke", `ar-fwd-${uid}`);
  const fwdBC = selfDraw(320, 400, 320, 550, "viz-stroke", `ar-fwd-${uid}`);
  const bwdCB = selfDraw(360, 550, 360, 400, "viz-blue", `ar-bwd-${uid}`);
  const bwdBA = selfDraw(360, 330, 360, 180, "viz-blue", `ar-bwd-${uid}`);
  const recompute = selfDraw(535, 175, 535, 335, "viz-warn", `ar-re-${uid}`);

  let tl: gsap.core.Timeline | null = null;
  let rateRef = 1;

  const draw = (line: { el: SVGLineElement; len: number }, at: string | number) =>
    tl!.fromTo(line.el, { strokeDashoffset: line.len, opacity: 1 }, { strokeDashoffset: 0, duration: 0.4, ease: "none" }, at);

  const play = () => {
    tl?.kill();
    [hA, hB, hC, fwdAB, fwdBC, bwdCB, bwdBA, recompute].forEach((l) =>
      gsap.set(l.el, { strokeDashoffset: l.len, opacity: 0 })
    );
    actFills.forEach((f) => gsap.set(f, { opacity: 0 }));

    tl = gsap.timeline();
    tl.add(() => { phase.textContent = "Forward pass, layer 1 runs and its activation is a checkpoint kept in memory."; }, 0);
    draw(hA, "<");
    tl.to(actFills[0], { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Layer 2 runs. Its activation is produced, then dropped to save memory."; }, ">");
    draw(fwdAB, "<");
    draw(hB, ">-0.1");
    tl.to(actFills[1], { opacity: 1, duration: 0.25 }, ">-0.1");
    tl.to({}, { duration: 0.4 });
    tl.to(actFills[1], { opacity: 0, duration: 0.35 }, ">");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Layer 3 runs and produces the output, needed right away for backward, so it stays."; }, ">");
    draw(fwdBC, "<");
    draw(hC, ">-0.1");
    tl.to(actFills[2], { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Backward starts at the output and heads toward layer 2 next."; }, ">");
    draw(bwdCB, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Layer 2's activation is gone, so replay the forward step from layer 1 to rebuild it."; }, ">");
    draw(recompute, "<");
    tl.to(actFills[1], { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "With the activation back, backward finishes and reaches layer 1, a checkpoint already in memory."; }, ">");
    draw(bwdBA, "<");
    tl.to({}, { duration: 0.7 });

    tl.add(() => { phase.textContent = "One dropped activation, one short recompute, a lot less memory held at once."; }, ">");
    tl.to({}, { duration: 0.8 });

    tl.timeScale(rateRef);
  };

  return {
    play,
    pause: () => tl?.pause(),
    resume: () => tl?.play(),
    setRate: (r: number) => { rateRef = r; tl?.timeScale(r); },
    cleanup: () => tl?.kill(),
  };
}

export const ActivationRecomputeDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 700 660" maxW="max-w-xl" delay={delay} setup={setupActivationRecompute} />
);

/* ===========================================================================
   MEMORY BREAKDOWN — static stacked bar, plain Tailwind divs, no SVG and no
   GSAP. Fixed per-parameter costs (weights, gradients, optimizer state) use
   the true 6:2:8 byte ratio for mixed-precision Adam training. Activations
   are drawn as a separate, larger, differently-styled segment on purpose,
   they scale with batch size and sequence length instead of parameter count,
   which is exactly why they are the one category checkpointing can shrink.
=========================================================================== */
type MemorySegment = { label: string; note: string; pct: number; className: string };

const SEGMENTS: MemorySegment[] = [
  { label: "Model weights", note: "6 bytes / parameter (fp16 copy + fp32 master copy)", pct: 18.75, className: "bg-blue-400 dark:bg-blue-500/70" },
  { label: "Gradients", note: "2 bytes / parameter (fp16)", pct: 6.25, className: "bg-purple-400 dark:bg-purple-500/70" },
  { label: "Optimizer state", note: "8 bytes / parameter (fp32 Adam momentum + variance)", pct: 25, className: "bg-amber-400 dark:bg-amber-500/70" },
  { label: "Activations", note: "grows with batch size, sequence length, and depth, not a fixed per-parameter cost", pct: 50, className: "bg-rose-400 dark:bg-rose-500/70" },
];

export const MemoryBreakdownBars = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8 rounded-2xl border border-border bg-muted/20 p-5 sm:p-6"
  >
    <div className="flex w-full h-8 sm:h-9 rounded-lg overflow-hidden border border-border/60">
      {SEGMENTS.map((s) => (
        <div key={s.label} className={s.className} style={{ width: `${s.pct}%` }} title={s.label} />
      ))}
    </div>
    <div className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-3">
      {SEGMENTS.map((s) => (
        <div key={s.label} className="flex items-start gap-2.5">
          <span className={`mt-1 h-2.5 w-2.5 rounded-sm shrink-0 ${s.className}`} />
          <p className="font-sans text-xs sm:text-sm text-foreground leading-snug">
            <span className="font-semibold">{s.label}.</span>{" "}
            <span className="text-muted-foreground">{s.note}</span>
          </p>
        </div>
      ))}
    </div>
  </motion.div>
);
