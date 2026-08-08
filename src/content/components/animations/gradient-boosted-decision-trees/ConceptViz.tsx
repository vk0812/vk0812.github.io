import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke visual for "Gradient-Boosted Decision Trees".
   Theme comes entirely from CSS vars (.viz / .dark .viz in index.css).
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
   Shared VizFigure wrapper.
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
   RESIDUAL BOOSTING DIAGRAM, motion is genuinely the point, watching the
   same six points get walked toward their targets round by round is the
   clearest way to show a sequence of weak trees compounding into a strong
   fit. All numbers below come from an actual hand-verified run, a depth-1
   stump fit on residuals each round, learning rate 0.5, six points
   x = [1..6], y = [5, 7, 6, 10, 9, 13].
   F0 = mean(y) = 8.3333, SSE0 = 43.3333
   round 1 stump: x<=3.5 -> -2.3333, else -> 2.3333, SSE1 = 18.8333
   round 2 stump: x<=5.5 -> -0.7,    else -> 3.5,    SSE2 = 7.8083
   round 3 stump: x<=3.5 -> -0.8167, else -> 0.8167, SSE3 = 4.8071
=========================================================================== */
const XS = [150, 270, 390, 510, 630, 750];
// actual y pixel positions (fixed targets), mapped from y = [5,7,6,10,9,13]
const ACTUAL_PY = [348, 284, 316, 188, 220, 92];
// F (prediction) pixel positions per round, per point
const F_PY: number[][] = [
  [241.33, 241.33, 241.33, 241.33, 241.33, 241.33], // round 0, flat mean
  [278.67, 278.67, 278.67, 204.0, 204.0, 204.0],     // round 1
  [289.87, 289.87, 289.87, 215.2, 215.2, 148.0],     // round 2
  [302.93, 302.93, 302.93, 202.13, 202.13, 134.93],  // round 3
];
const SSE = [43.33, 18.83, 7.81, 4.81];

function setupResidualBoosting(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const phase = mkText(svg, "", 450, 28, "viz-phase", "middle");

  // plot frame
  mk(svg, "rect", { x: 60, y: 50, width: 780, height: 340, rx: 12, class: "viz-panel" });

  // x tick labels
  XS.forEach((x, i) => {
    mkText(svg, `x=${i + 1}`, x, 402, "viz-label-sm", "middle");
  });

  // actual-value dots (fixed)
  XS.forEach((x, i) => {
    mk(svg, "circle", { cx: x, cy: ACTUAL_PY[i], r: 6, class: "viz-cell" });
  });

  // prediction markers (small horizontal segments) + residual verticals
  const markers = XS.map((x, i) =>
    mk(svg, "line", {
      x1: x - 15, x2: x + 15, y1: F_PY[0][i], y2: F_PY[0][i], class: "viz-blue", "stroke-width": 3,
    }) as SVGLineElement
  );
  const residuals = XS.map((x, i) =>
    mk(svg, "line", {
      x1: x, x2: x, y1: F_PY[0][i], y2: ACTUAL_PY[i], class: "viz-warn", "stroke-dasharray": "5 4", opacity: 0,
    }) as SVGLineElement
  );
  gsap.set(markers, { opacity: 0 });

  const recap = mkText(svg, "", 450, 430, "viz-label-sm", "middle");

  // legend row
  mk(svg, "circle", { cx: 130, cy: 468, r: 5, class: "viz-cell" });
  mkText(svg, "actual value", 145, 472, "viz-label-sm", "start");
  mk(svg, "line", { x1: 340, x2: 370, y1: 468, y2: 468, class: "viz-blue", "stroke-width": 3 });
  mkText(svg, "current prediction", 378, 472, "viz-label-sm", "start");
  mk(svg, "line", { x1: 610, x2: 610, y1: 460, y2: 476, class: "viz-warn", "stroke-dasharray": "3 3" });
  mkText(svg, "residual", 620, 472, "viz-label-sm", "start");

  let tl: gsap.core.Timeline | null = null;
  let rate = 1;

  const play = () => {
    tl?.kill();
    phase.textContent = "";
    recap.textContent = "";
    gsap.set(markers, { opacity: 0, attr: { y1: F_PY[0][0], y2: F_PY[0][0] } });
    markers.forEach((m, i) => gsap.set(m, { attr: { y1: F_PY[0][i], y2: F_PY[0][i] } }));
    residuals.forEach((r, i) => gsap.set(r, { opacity: 0, attr: { y1: F_PY[0][i], y2: ACTUAL_PY[i] } }));

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Start every ensemble from one flat prediction, the training mean"; });
    tl.to(markers, { opacity: 1, duration: 0.3, stagger: 0.05 }, "<");
    tl.to(residuals, { opacity: 1, duration: 0.3, stagger: 0.05 }, "<");
    tl.add(() => { recap.textContent = `SSE ≈ ${SSE[0]}`; }, "<");
    tl.to({}, { duration: 0.8 });

    for (let round = 1; round <= 3; round++) {
      tl.add(() => {
        phase.textContent =
          round === 1
            ? "Tree 1 fits the residuals, splitting the points into two groups"
            : round === 2
            ? "Tree 2 fits what's left over, splitting further"
            : "Tree 3 fits the remaining residuals, one more small correction";
      });
      markers.forEach((m, i) => {
        tl!.to(m, { attr: { y1: F_PY[round][i], y2: F_PY[round][i] } }, "<");
      });
      residuals.forEach((r, i) => {
        tl!.to(r, { attr: { y1: F_PY[round][i] } }, "<");
      });
      tl.add(() => { recap.textContent = `SSE ≈ ${SSE[round - 1]} → ${SSE[round]}`; }, "<0.4");
      tl.to({}, { duration: 0.9 });
    }

    tl.add(() => {
      phase.textContent = "Each tree is small and weak alone, shrinkage keeps every step modest, the sum does the work";
    });

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

export const ResidualBoostingDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 500" maxW="max-w-3xl" delay={delay} setup={setupResidualBoosting} />
);
