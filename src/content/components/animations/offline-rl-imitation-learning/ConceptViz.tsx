import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke visual for "Offline reinforcement learning and imitation learning".
   DistributionShiftDiagram narrates the post's core failure mode for behavior
   cloning end to end, a translucent band shows the states the fixed dataset
   actually covers, a dashed line self-draws the expert's recorded trajectory
   inside that band, and a solid line self-draws the learned policy's own
   path, first overlapping the expert exactly, then drifting outside the band
   as small errors compound. Motion is the point here, the drift over time is
   literally what "compounding error" means. Theme comes entirely from CSS
   vars (.viz / .dark .viz in index.css) via the shared semantic classes, so
   it reads correctly in both themes.
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
function mkText(root: Element, str: string, x: number, y: number, cls = "viz-label", anchor = "middle") {
  const t = mk(root, "text", { x, y, class: cls, "text-anchor": anchor });
  t.textContent = str;
  return t;
}

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
   DISTRIBUTION SHIFT — a fixed dataset covers a band of states around the
   expert's demonstrated path. The expert's own trajectory (dashed, ink)
   stays inside that band by definition. The learned policy (solid) starts
   by matching the expert exactly, then a small error nudges it outside the
   band, and the gap keeps growing for the rest of the trajectory. Every
   point below was checked with a Node script against the expert curve's own
   bezier formula, so the drift is geometrically real, not eyeballed.
=========================================================================== */
const EXPERT_PTS: [number, number][] = [
  [60, 300], [90, 284.01], [120, 269.02], [150, 254.95], [180, 241.76],
  [210, 229.38], [240, 217.74], [270, 206.79], [300, 196.48], [330, 186.74],
  [360, 177.5], [390, 168.72], [420, 160.32], [450, 152.25], [480, 144.46],
  [510, 136.88], [540, 129.44], [570, 122.09], [600, 114.78], [630, 107.44], [660, 100],
];
// First 8 points (t = 0 to 0.35) are identical to the expert, offset 0.
const POLICY_A_PTS: [number, number][] = EXPERT_PTS.slice(0, 8);
// From t = 0.35 onward the policy drifts below the expert's path.
const POLICY_B_PTS: [number, number][] = [
  [270, 206.79], [300, 197.97], [330, 191.24], [360, 186.12], [390, 182.37],
  [420, 179.83], [450, 178.37], [480, 177.89], [510, 178.27], [540, 179.41],
  [570, 181.24], [600, 183.67], [630, 186.62], [660, 190],
];
const BAND_D =
  "M 60,270 L 90,254.01 L 120,239.02 L 150,224.95 L 180,211.76 L 210,199.38 L 240,187.74 L 270,176.79 " +
  "L 300,166.48 L 330,156.74 L 360,147.5 L 390,138.72 L 420,130.32 L 450,122.25 L 480,114.46 L 510,106.88 " +
  "L 540,99.44 L 570,92.09 L 600,84.78 L 630,77.44 L 660,70 " +
  "L 660,130 L 630,137.44 L 600,144.78 L 570,152.09 L 540,159.44 L 510,166.88 L 480,174.46 L 450,182.25 " +
  "L 420,190.32 L 390,198.72 L 360,207.5 L 330,216.74 L 300,226.48 L 270,236.79 L 240,247.74 L 210,259.38 " +
  "L 180,271.76 L 150,284.95 L 120,299.02 L 90,314.01 L 60,330 Z";

function ptsToD(pts: [number, number][]) {
  return "M " + pts.map((p, i) => (i === 0 ? "" : "L ") + p[0] + "," + p[1]).join(" ");
}

function setupDistributionShift(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const phase = mkText(svg, "", 360, 24, "viz-phase");

  const band = mk(svg, "path", { d: BAND_D, class: "viz-panel" });
  gsap.set(band, { opacity: 0 });

  const expertLine = mk(svg, "path", { d: ptsToD(EXPERT_PTS), class: "viz-stroke" }) as SVGPathElement;
  const expertLen = expertLine.getTotalLength();
  expertLine.style.strokeDasharray = String(expertLen);
  gsap.set(expertLine, { opacity: 0 });

  const policyA = mk(svg, "path", { d: ptsToD(POLICY_A_PTS), class: "viz-blue" }) as SVGPathElement;
  const policyALen = policyA.getTotalLength();
  policyA.style.strokeDasharray = String(policyALen);
  gsap.set(policyA, { opacity: 0 });

  const policyB = mk(svg, "path", { d: ptsToD(POLICY_B_PTS), class: "viz-warn" }) as SVGPathElement;
  const policyBLen = policyB.getTotalLength();
  policyB.style.strokeDasharray = String(policyBLen);
  gsap.set(policyB, { opacity: 0 });

  // Legend, two rows below the chart. Swatches match each element's own class.
  const legendCoverage = mk(svg, "rect", { x: 380, y: 344, width: 30, height: 14, rx: 3, class: "viz-panel" });
  const legendCoverageLbl = mkText(svg, "training data coverage", 418, 355, "viz-label-sm", "start");
  const legendExpert = mk(svg, "line", { x1: 10, y1: 351, x2: 40, y2: 351, class: "viz-stroke" });
  const legendExpertLbl = mkText(svg, "expert demonstrations", 48, 355, "viz-label-sm", "start");
  const legendOn = mk(svg, "line", { x1: 10, y1: 375, x2: 40, y2: 375, class: "viz-blue" });
  const legendOnLbl = mkText(svg, "learned policy, on distribution", 48, 379, "viz-label-sm", "start");
  const legendOff = mk(svg, "line", { x1: 380, y1: 375, x2: 410, y2: 375, class: "viz-warn" });
  const legendOffLbl = mkText(svg, "learned policy, off distribution", 418, 379, "viz-label-sm", "start");
  const legendGroups = [
    [legendCoverage, legendCoverageLbl],
    [legendExpert, legendExpertLbl],
    [legendOn, legendOnLbl],
    [legendOff, legendOffLbl],
  ];
  legendGroups.forEach(([el, lbl]) => gsap.set([el, lbl], { opacity: 0 }));

  let tl: gsap.core.Timeline | null = null;
  let rate = 1;

  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set(band, { opacity: 0 });
    gsap.set(expertLine, { opacity: 0, strokeDashoffset: expertLen });
    gsap.set(policyA, { opacity: 0, strokeDashoffset: policyALen });
    gsap.set(policyB, { opacity: 0, strokeDashoffset: policyBLen });
    legendGroups.forEach(([el, lbl]) => gsap.set([el, lbl], { opacity: 0 }));

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "The fixed dataset only covers a band of states around the expert's path."; });
    tl.to(band, { opacity: 1, duration: 0.4 }, "<");
    tl.to([legendCoverage, legendCoverageLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "This line is the expert trajectory, exactly what the dataset recorded."; });
    tl.set(expertLine, { opacity: 1 }, "<");
    tl.to(expertLine, { strokeDashoffset: 0, duration: 0.6, ease: "none" }, "<");
    tl.to([legendExpert, legendExpertLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "The learned policy copies the expert almost exactly at first."; });
    tl.set(policyA, { opacity: 1 }, "<");
    tl.to(policyA, { strokeDashoffset: 0, duration: 0.4, ease: "none" }, "<");
    tl.to([legendOn, legendOnLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "A small error nudges it outside the band, and each new mistake compounds the last."; });
    tl.set(policyB, { opacity: 1 }, "<");
    tl.to(policyB, { strokeDashoffset: 0, duration: 0.7, ease: "none" }, "<");
    tl.to([legendOff, legendOffLbl], { opacity: 1, duration: 0.3 }, "<0.2");
    tl.to({}, { duration: 0.5 });

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

export const DistributionShiftDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 720 400" maxW="max-w-2xl" delay={delay} setup={setupDistributionShift} />
);
