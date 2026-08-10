import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke animation for the "Profiling and accelerating training" post.
   Theme comes entirely from CSS vars (.viz / .dark .viz in index.css), so the
   same SVG reads black+blue in light mode and white+blue in dark mode.
   Plays once when scrolled into view, a replay button restarts it.
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
   PIPELINE STALL TIMELINE, same wall-clock stretch, two training loops.
   Row A has no prefetching, so the GPU lane goes idle every step while the
   CPU lane prepares the next batch. Row B prefetches, so the CPU lane works
   on the next batch while the GPU lane stays busy on the current one, and
   the GPU idle segments never appear at all. A shared playhead sweeps both
   rows at once to make the "same amount of time" comparison concrete.
=========================================================================== */
const X0 = 160;
const STEP_W = 230;
const IDLE_W = 126; // GPU idle width per step in the no-prefetch row (illustrative, ~55%)
const BUSY_W = STEP_W - IDLE_W; // GPU busy width per step in the no-prefetch row (~45%)
const STEPS = 3;

function setupPipelineStallTimeline(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const phase = mkText(svg, "", 505, 26, "viz-phase", "middle");

  // Legend
  mk(svg, "rect", { x: 330, y: 64, width: 14, height: 14, class: "viz-bar-pos" });
  mkText(svg, "Busy", 350, 75, "viz-label-sm", "start");
  mk(svg, "rect", { x: 470, y: 64, width: 14, height: 14, class: "viz-bar-neg" });
  mkText(svg, "Idle, waiting on data", 490, 75, "viz-label-sm", "start");

  // Row A, without prefetching
  mkText(svg, "Without prefetching, GPU stalls", 505, 128, "viz-node-lbl", "middle");
  mk(svg, "rect", { x: X0, y: 160, width: STEP_W * STEPS, height: 34, rx: 4, class: "viz-panel" });
  mk(svg, "rect", { x: X0, y: 208, width: STEP_W * STEPS, height: 34, rx: 4, class: "viz-panel" });
  mkText(svg, "CPU", 128, 182, "viz-label-sm", "end");
  mkText(svg, "GPU", 128, 230, "viz-label-sm", "end");

  // Row B, with prefetching
  mkText(svg, "With prefetching, GPU stays busy", 505, 298, "viz-node-lbl", "middle");
  mk(svg, "rect", { x: X0, y: 330, width: STEP_W * STEPS, height: 34, rx: 4, class: "viz-panel" });
  mk(svg, "rect", { x: X0, y: 378, width: STEP_W * STEPS, height: 34, rx: 4, class: "viz-panel" });
  mkText(svg, "CPU", 128, 352, "viz-label-sm", "end");
  mkText(svg, "GPU", 128, 400, "viz-label-sm", "end");

  type StepEls = {
    cpuA: SVGRectElement;
    idleA: SVGRectElement;
    busyA: SVGRectElement;
    cpuB: SVGRectElement;
    gpuB: SVGRectElement;
  };

  const steps: StepEls[] = [];
  for (let i = 0; i < STEPS; i++) {
    const start = X0 + i * STEP_W;
    const cpuA = mk(svg, "rect", {
      x: start, y: 160, width: IDLE_W, height: 34, rx: 4, class: "viz-bar-pos", opacity: 0,
    }) as SVGRectElement;
    const idleA = mk(svg, "rect", {
      x: start, y: 208, width: IDLE_W, height: 34, rx: 4, class: "viz-bar-neg", opacity: 0,
    }) as SVGRectElement;
    const busyA = mk(svg, "rect", {
      x: start + IDLE_W, y: 208, width: BUSY_W, height: 34, rx: 4, class: "viz-bar-pos", opacity: 0,
    }) as SVGRectElement;
    const cpuB = mk(svg, "rect", {
      x: start, y: 330, width: STEP_W, height: 34, rx: 4, class: "viz-bar-pos", opacity: 0,
    }) as SVGRectElement;
    const gpuB = mk(svg, "rect", {
      x: start, y: 378, width: STEP_W, height: 34, rx: 4, class: "viz-bar-pos", opacity: 0,
    }) as SVGRectElement;
    steps.push({ cpuA, idleA, busyA, cpuB, gpuB });
  }

  // Shared playhead, spans both rows, moved by translating its own x
  const playhead = mk(svg, "g", {}) as SVGGElement;
  mk(playhead, "line", { x1: 0, y1: 148, x2: 0, y2: 420, class: "viz-warn" });
  gsap.set(playhead, { x: 0 });

  let tl: gsap.core.Timeline | null = null;
  let rate = 1;

  const resetScene = () => {
    steps.forEach((s) => {
      gsap.set([s.cpuA, s.idleA, s.busyA, s.cpuB, s.gpuB], { opacity: 0 });
    });
    gsap.set(playhead, { x: 0 });
  };

  const play = () => {
    tl?.kill();
    phase.textContent = "";
    resetScene();

    tl = gsap.timeline();

    steps.forEach((s, i) => {
      const start = X0 + i * STEP_W;

      tl!.add(() => { phase.textContent = `Step ${i + 1}. The CPU pipeline starts preparing a batch.`; });
      tl!.to([s.cpuA, s.cpuB], { opacity: 1, duration: 0.3 }, "<0.05");
      tl!.to({}, { duration: 0.35 });

      tl!.add(() => { phase.textContent = "Without prefetching, the GPU just waits."; });
      tl!.to(s.idleA, { opacity: 1, duration: 0.25 }, "<");
      tl!.to(s.gpuB, { opacity: 1, duration: 0.25 }, "<");
      tl!.to(playhead, { x: start + IDLE_W - X0, duration: 0.5, ease: "none" }, "<");
      tl!.to({}, { duration: 0.3 });

      tl!.add(() => { phase.textContent = "With prefetching, the GPU was already busy."; });
      tl!.to(s.busyA, { opacity: 1, duration: 0.3 }, "<");
      tl!.to(playhead, { x: start + STEP_W - X0, duration: 0.5, ease: "none" }, "<");
      tl!.to({}, { duration: 0.35 });
    });

    tl.add(() => { phase.textContent = "Same wall clock time, very different amount of GPU work got done."; });
    tl.to({}, { duration: 0.8 });

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

export const PipelineStallTimelineDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 480" maxW="max-w-3xl" delay={delay} setup={setupPipelineStallTimeline} />
);
