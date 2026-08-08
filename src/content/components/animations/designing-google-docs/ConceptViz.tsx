import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animation for the Designing Google Docs case study.
   Theme comes entirely from CSS vars (.viz / .dark .viz in index.css), so the
   same SVG reads black+blue in light mode and white+blue in dark mode.
   Plays once when scrolled into view; a replay button restarts.
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
  caption, viewBox, maxW = "max-w-3xl", setup,
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
   INSERT CONVERGENCE — two editors insert different characters at the same
   position in the same document at the same time. Left lane inserts "B" at
   index 1, right lane inserts "X" at index 1, starting from the shared text
   "AC". Applied naively and in different orders, the two clients would drift
   apart. A sequencer assigns each op a version, transforms the later one
   against the earlier one (same index, so the tie-break shifts the later
   insert one position to the right), and both clients land on "ABXC".
=========================================================================== */
function setupInsertConvergence(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const xA = 230;
  const xB = 670;
  const xC = 450;

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `gd-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", xC, 28, "viz-phase", "middle");

  const userA = mkText(svg, "User A", xA, 60, "viz-label", "middle") as SVGTextElement;
  const userB = mkText(svg, "User B", xB, 60, "viz-label", "middle") as SVGTextElement;

  function opLine(x: number) {
    const l = mk(svg, "line", { x1: x, y1: 72, x2: x, y2: 132, class: "viz-stroke", "marker-end": `url(#gd-${uid})`, opacity: 0 }) as SVGLineElement;
    const len = 60;
    l.style.strokeDasharray = String(len);
    return { l, len };
  }
  const opArrowA = opLine(xA);
  const opArrowB = opLine(xB);

  const opBoxA = mk(svg, "rect", { x: xA - 100, y: 134, width: 200, height: 56, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const opLblA = mkText(svg, 'insert "B" at index 1', xA, 167, "viz-label-sm", "middle") as SVGTextElement;
  const opBoxB = mk(svg, "rect", { x: xB - 100, y: 134, width: 200, height: 56, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const opLblB = mkText(svg, 'insert "X" at index 1', xB, 167, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([opLblA, opLblB], { opacity: 0 });

  function localLine(x: number) {
    const l = mk(svg, "line", { x1: x, y1: 190, x2: x, y2: 248, class: "viz-stroke", "marker-end": `url(#gd-${uid})`, opacity: 0 }) as SVGLineElement;
    const len = 58;
    l.style.strokeDasharray = String(len);
    return { l, len };
  }
  const localArrowA = localLine(xA);
  const localArrowB = localLine(xB);

  const localBoxA = mk(svg, "rect", { x: xA - 100, y: 250, width: 200, height: 64, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const localCaptionA = mkText(svg, "optimistic local copy", xA, 272, "viz-label-sm", "middle") as SVGTextElement;
  const localTextA = mkText(svg, "AC → ABC", xA, 298, "viz-node-lbl", "middle") as SVGTextElement;
  const localFinalA = mkText(svg, "→ ABXC", xA, 298, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set([localCaptionA, localTextA], { opacity: 0 });
  gsap.set(localFinalA, { opacity: 0 });

  const localBoxB = mk(svg, "rect", { x: xB - 100, y: 250, width: 200, height: 64, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const localCaptionB = mkText(svg, "optimistic local copy", xB, 272, "viz-label-sm", "middle") as SVGTextElement;
  const localTextB = mkText(svg, "AC → AXC", xB, 298, "viz-node-lbl", "middle") as SVGTextElement;
  const localFinalB = mkText(svg, "→ ABXC", xB, 298, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set([localCaptionB, localTextB], { opacity: 0 });
  gsap.set(localFinalB, { opacity: 0 });

  const ringA = mk(svg, "rect", { x: xA - 106, y: 244, width: 212, height: 76, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const ringB = mk(svg, "rect", { x: xB - 106, y: 244, width: 212, height: 76, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;

  const convergeA = mk(svg, "line", { x1: xA, y1: 314, x2: 390, y2: 364, class: "viz-stroke", "marker-end": `url(#gd-${uid})`, opacity: 0 }) as SVGLineElement;
  const convergeALen = Math.hypot(390 - xA, 364 - 314);
  convergeA.style.strokeDasharray = String(convergeALen);
  const convergeB = mk(svg, "line", { x1: xB, y1: 314, x2: 510, y2: 364, class: "viz-stroke", "marker-end": `url(#gd-${uid})`, opacity: 0 }) as SVGLineElement;
  const convergeBLen = Math.hypot(510 - xB, 364 - 314);
  convergeB.style.strokeDasharray = String(convergeBLen);

  const seqBox = mk(svg, "rect", { x: xC - 110, y: 364, width: 220, height: 80, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const seqLbl = mkText(svg, "Sequencer", xC, 392, "viz-label", "middle") as SVGTextElement;
  const seqSub = mkText(svg, "A's op → v1, B's op → v2", xC, 418, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([seqLbl, seqSub], { opacity: 0 });

  const seqToTransform = mk(svg, "line", { x1: xC, y1: 444, x2: xC, y2: 484, class: "viz-stroke", "marker-end": `url(#gd-${uid})`, opacity: 0 }) as SVGLineElement;
  const seqToTransformLen = 40;
  seqToTransform.style.strokeDasharray = String(seqToTransformLen);

  const transformBox = mk(svg, "rect", { x: xC - 110, y: 484, width: 220, height: 100, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const transformLbl = mkText(svg, "Transform", xC, 510, "viz-label", "middle") as SVGTextElement;
  const transformSub1 = mkText(svg, "same index, tie-break: A first", xC, 533, "viz-label-sm", "middle") as SVGTextElement;
  const transformSub2 = mkText(svg, "B's insert shifts index 1 → 2", xC, 556, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([transformLbl, transformSub1, transformSub2], { opacity: 0 });

  const transformToFinal = mk(svg, "line", { x1: xC, y1: 584, x2: xC, y2: 624, class: "viz-stroke", "marker-end": `url(#gd-${uid})`, opacity: 0 }) as SVGLineElement;
  const transformToFinalLen = 40;
  transformToFinal.style.strokeDasharray = String(transformToFinalLen);

  const finalBox = mk(svg, "rect", { x: xC - 80, y: 624, width: 160, height: 96, rx: 8, class: "viz-panel", opacity: 0 }) as SVGRectElement;
  const finalRing = mk(svg, "rect", { x: xC - 86, y: 618, width: 172, height: 108, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const finalLbl = mkText(svg, "Canonical document", xC, 650, "viz-label-sm", "middle") as SVGTextElement;
  const finalText = mkText(svg, "A B X C", xC, 678, "viz-phase", "middle") as SVGTextElement;
  const finalNote = mkText(svg, "same on every client", xC, 700, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([finalLbl, finalText, finalNote], { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([userA, userB], { opacity: 0 });
    opArrowA.l.style.strokeDashoffset = String(opArrowA.len);
    opArrowB.l.style.strokeDashoffset = String(opArrowB.len);
    localArrowA.l.style.strokeDashoffset = String(localArrowA.len);
    localArrowB.l.style.strokeDashoffset = String(localArrowB.len);
    convergeA.style.strokeDashoffset = String(convergeALen);
    convergeB.style.strokeDashoffset = String(convergeBLen);
    seqToTransform.style.strokeDashoffset = String(seqToTransformLen);
    transformToFinal.style.strokeDashoffset = String(transformToFinalLen);

    gsap.set([opArrowA.l, opArrowB.l, opBoxA, opLblA, opBoxB, opLblB], { opacity: 0 });
    gsap.set([localArrowA.l, localArrowB.l, localBoxA, localBoxB, localCaptionA, localCaptionB, localTextA, localTextB], { opacity: 0 });
    gsap.set([localFinalA, localFinalB, ringA, ringB], { opacity: 0 });
    gsap.set([convergeA, convergeB, seqBox, seqLbl, seqSub], { opacity: 0 });
    gsap.set([seqToTransform, transformBox, transformLbl, transformSub1, transformSub2], { opacity: 0 });
    gsap.set([transformToFinal, finalBox, finalRing, finalLbl, finalText, finalNote], { opacity: 0 });
    gsap.set(localTextA, { opacity: 1 });
    gsap.set(localTextB, { opacity: 1 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Both editors start from the same document, “AC”"; });
    tl.to([userA, userB], { opacity: 1, duration: 0.35, stagger: 0.1 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "They type at the exact same moment, at the same position"; });
    tl.to([opArrowA.l, opArrowB.l], { opacity: 1, duration: 0.05 }, "<");
    tl.to([opArrowA.l, opArrowB.l], { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([opBoxA, opLblA, opBoxB, opLblB], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Each client applies its own edit locally, without waiting"; });
    tl.to([localArrowA.l, localArrowB.l], { opacity: 1, duration: 0.05 }, "<");
    tl.to([localArrowA.l, localArrowB.l], { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([localBoxA, localBoxB, localCaptionA, localCaptionB], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Both operations reach a single sequencer for this document"; });
    tl.to([convergeA, convergeB], { opacity: 1, duration: 0.05 }, "<");
    tl.to([convergeA, convergeB], { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
    tl.to([seqBox, seqLbl], { opacity: 1, duration: 0.3 }, "<0.15");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "It assigns a version to each op in arrival order"; });
    tl.to(seqSub, { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Same index, so transformation shifts B's insert to make room for A's"; });
    tl.to(seqToTransform, { opacity: 1, duration: 0.05 }, "<");
    tl.to(seqToTransform, { strokeDashoffset: 0, duration: 0.25, ease: "none" }, "<");
    tl.to([transformBox, transformLbl, transformSub1], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(transformSub2, { opacity: 1, duration: 0.3 }, "+=0.2");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Both clients replay the transformed ops and land on the same text"; });
    tl.to(transformToFinal, { opacity: 1, duration: 0.05 }, "<");
    tl.to(transformToFinal, { strokeDashoffset: 0, duration: 0.25, ease: "none" }, "<");
    tl.to([finalBox, finalLbl, finalText, finalNote], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(localTextA, { opacity: 0, duration: 0.3 }, "<0.1");
    tl.to(localTextB, { opacity: 0, duration: 0.3 }, "<0.1");
    tl.to([localFinalA, localFinalB], { opacity: 1, duration: 0.3 }, "<0.05");
    tl.to([ringA, ringB, finalRing], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to([ringA, ringB, finalRing], { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });

    tl.timeScale(rate);
  };

  let rate = 1;
  play();

  return {
    play,
    pause: () => tl?.pause(),
    resume: () => tl?.play(),
    setRate: (r) => { rate = r; tl?.timeScale(r); },
    cleanup: () => tl?.kill(),
  };
}

export const InsertConvergenceDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 760" maxW="max-w-2xl" delay={delay} setup={setupInsertConvergence} />
);
