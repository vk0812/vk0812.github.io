import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke GSAP scene for the "lost in the middle" positional effect. Theme
   comes entirely from CSS vars (.viz / .dark .viz in index.css), matching
   every other bespoke animation on the site. Plays once when scrolled into
   view, a replay button restarts it.
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
  delay?: number; // accepted for API parity; not used for in-view entrance
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
   LOST IN THE MIDDLE. Five retrieved chunks sit in a prompt's context
   window in a fixed order. A dashed highlight ring moves left to right
   across the chunks while a reliability bar grows under each one, tall at
   the start and end, short in the middle. All coordinates were verified
   offline with scripts/check-svg-layout.py. The outer container rect
   intentionally contains the five chunk boxes, and each chunk box
   intentionally contains its own "Chunk N" label, the same nesting the ANN
   diagram already has with its dashed cluster boundaries, so the container
   box and the inside-chunk labels were excluded from the checked box/label
   set for that reason. The highlight ring is excluded for the same reason,
   it is drawn to surround whichever chunk box it currently points at.
=========================================================================== */

const CENTERS = [140, 295, 450, 605, 760];
const POSITION_LABELS = ["Start", "Early", "Middle", "Late", "End"];
const BAR_HEIGHTS = [110, 65, 30, 65, 110]; // illustrative shape only, not a benchmark figure
const VALUE_TEXTS = ["high", "medium", "low", "medium", "high"];
const BASELINE_Y = 450;
const CHUNK_Y = 163;
const CHUNK_W = 110;
const CHUNK_H = 60;
const BAR_W = 30;
const RING_W = CHUNK_W + 16;
const RING_H = CHUNK_H + 16;
const RING_Y = CHUNK_Y - 8;

function setupLostInMiddle(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const phase = mkText(svg, "", 450, 24, "viz-phase", "middle");

  // legend
  mk(svg, "rect", { x: 640, y: 46, width: 14, height: 14, rx: 2, class: "viz-box" });
  mkText(svg, "retrieved chunk", 660, 57, "viz-label-sm", "start");
  mk(svg, "rect", { x: 640, y: 68, width: 14, height: 14, rx: 2, class: "viz-blue", "stroke-dasharray": "3 3" });
  mkText(svg, "currently read", 660, 79, "viz-label-sm", "start");

  // outer container (intentionally overlaps the chunk boxes it holds)
  mk(svg, "rect", { x: 60, y: 148, width: 780, height: 90, rx: 6, class: "viz-panel" });
  mkText(svg, "Prompt context window, chunks in the order they were placed", 450, 118, "viz-label", "middle");

  const chunkBoxes: SVGRectElement[] = [];
  const chunkInnerLabels: SVGTextElement[] = [];
  const posLabels: SVGTextElement[] = [];
  CENTERS.forEach((cx, i) => {
    const box = mk(svg, "rect", {
      x: cx - CHUNK_W / 2, y: CHUNK_Y, width: CHUNK_W, height: CHUNK_H, rx: 4, class: "viz-box", opacity: 0,
    }) as SVGRectElement;
    const inner = mkText(svg, `Chunk ${i + 1}`, cx, CHUNK_Y + 34, "viz-label-sm", "middle") as SVGTextElement;
    gsap.set(inner, { opacity: 0 });
    const pos = mkText(svg, POSITION_LABELS[i], cx, 268, "viz-label-sm", "middle") as SVGTextElement;
    gsap.set(pos, { opacity: 0 });
    chunkBoxes.push(box);
    chunkInnerLabels.push(inner);
    posLabels.push(pos);
  });

  const barTitle = mkText(svg, "How reliably the model uses each position", 450, 308, "viz-label", "middle") as SVGTextElement;
  gsap.set(barTitle, { opacity: 0 });

  const baseline = mk(svg, "line", { x1: 100, y1: BASELINE_Y, x2: 800, y2: BASELINE_Y, class: "viz-baseline", opacity: 0 });

  const bars: SVGRectElement[] = [];
  const valueLabels: SVGTextElement[] = [];
  CENTERS.forEach((cx, i) => {
    const bar = mk(svg, "rect", {
      x: cx - BAR_W / 2, y: BASELINE_Y, width: BAR_W, height: 0,
      class: i === 2 ? "viz-bar-neg" : "viz-bar-pos", opacity: 0,
    }) as SVGRectElement;
    const val = mkText(svg, VALUE_TEXTS[i], cx, 488, "viz-label-sm", "middle") as SVGTextElement;
    gsap.set(val, { opacity: 0 });
    bars.push(bar);
    valueLabels.push(val);
  });

  const ring = mk(svg, "rect", {
    x: CENTERS[0] - RING_W / 2, y: RING_Y, width: RING_W, height: RING_H, rx: 8,
    class: "viz-blue", "stroke-dasharray": "5 4", opacity: 0,
  }) as SVGRectElement;

  const narrations = [
    "A chunk placed at the very start of the prompt tends to get used reliably",
    "Reliability starts to drop for a chunk placed a little further in",
    "Chunks buried in the middle of a long prompt are the ones models use least reliably",
    "Reliability recovers again as a chunk gets closer to the end",
    "The last chunk, right before the question, tends to get used reliably too",
  ];

  let tl: gsap.core.Timeline | null = null;
  let rate = 1;

  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set(chunkBoxes, { opacity: 0 });
    gsap.set(chunkInnerLabels, { opacity: 0 });
    gsap.set(posLabels, { opacity: 0 });
    gsap.set(barTitle, { opacity: 0 });
    gsap.set(baseline, { opacity: 0 });
    bars.forEach((bar) => gsap.set(bar, { attr: { height: 0, y: BASELINE_Y }, opacity: 0 }));
    gsap.set(valueLabels, { opacity: 0 });
    gsap.set(ring, { opacity: 0, attr: { x: CENTERS[0] - RING_W / 2 } });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "A generation prompt lays out five retrieved chunks in the order they were placed"; });
    chunkBoxes.forEach((box, i) => {
      tl.to(box, { opacity: 1, duration: 0.3 }, i === 0 ? "<" : "<0.1");
      tl.to(chunkInnerLabels[i], { opacity: 1, duration: 0.3 }, "<");
      tl.to(posLabels[i], { opacity: 1, duration: 0.3 }, "<");
    });
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Position in the prompt changes how reliably the model actually uses each chunk"; });
    tl.to(barTitle, { opacity: 1, duration: 0.3 }, "<");
    tl.to(baseline, { opacity: 1, duration: 0.3 }, "<");
    tl.to(ring, { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.3 });

    CENTERS.forEach((cx, i) => {
      tl.add(() => { phase.textContent = narrations[i]; });
      if (i > 0) {
        tl.to(ring, { attr: { x: cx - RING_W / 2 }, duration: 0.45, ease: "power2.inOut" }, "<");
      }
      tl.to(bars[i], { opacity: 1, duration: 0.05 }, "<0.1");
      tl.to(bars[i], {
        attr: { height: BAR_HEIGHTS[i], y: BASELINE_Y - BAR_HEIGHTS[i] },
        duration: 0.45, ease: "power2.out",
      }, "<");
      tl.to(valueLabels[i], { opacity: 1, duration: 0.3 }, "<0.2");
      tl.to({}, { duration: 0.4 });
    });

    tl.add(() => { phase.textContent = "Position, not just relevance, shapes how much a model actually uses a chunk"; });

    tl.timeScale(rate);
  };

  play();

  return {
    play,
    pause: () => tl?.pause(),
    resume: () => tl?.play(),
    setRate: (r) => { rate = r; tl?.timeScale(r); },
    cleanup: () => tl?.kill(),
  };
}

export const LostInMiddleDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 500" maxW="max-w-2xl" delay={delay} setup={setupLostInMiddle} />
);
