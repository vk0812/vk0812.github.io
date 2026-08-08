import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke visuals for "Optimization Fundamentals".
   Theme comes entirely from CSS vars (.viz / .dark .viz in index.css), so the
   same SVG reads black+blue in light mode and white+blue in dark mode.
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
   1. CONVEX VS NON-CONVEX — fully static, no GSAP. Motion isn't the point
   here, the shape of the two surfaces is, so this is a plain hand-coded SVG
   wrapped in a fade-in, matching the "static diagram in animations/<slug>"
   pattern for a bespoke, non-reusable figure.
=========================================================================== */
export const ConvexNonConvexDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="mx-auto mb-8 max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
      <svg viewBox="0 0 900 440" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="ofq-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="viz-arrow-blue" />
          </marker>
        </defs>

        {/* panel titles */}
        <text x={220} y={36} className="viz-phase" textAnchor="middle">CONVEX</text>
        <text x={680} y={36} className="viz-phase" textAnchor="middle">NON-CONVEX</text>

        {/* panel frames */}
        <rect x={30} y={60} width={380} height={340} rx={12} className="viz-panel" />
        <rect x={490} y={60} width={380} height={340} rx={12} className="viz-panel" />

        {/* ---------------- LEFT: convex bowl, one basin ---------------- */}
        <g>
          <circle cx={220} cy={230} r={130} className="viz-thin" />
          <circle cx={220} cy={230} r={100} className="viz-thin" />
          <circle cx={220} cy={230} r={70} className="viz-thin" />
          <circle cx={220} cy={230} r={40} className="viz-thin" />
          <circle cx={220} cy={230} r={5} className="viz-cell" />

          <path d="M100,120 Q150,150 195,205" fill="none" className="viz-pull" markerEnd="url(#ofq-arrow)" />
          <path d="M340,340 Q290,300 245,255" fill="none" className="viz-pull" markerEnd="url(#ofq-arrow)" />

          <text x={220} y={385} className="viz-label-sm" textAnchor="middle">
            Every path curves into the same central minimum.
          </text>
        </g>

        {/* ---------------- RIGHT: two basins plus a saddle ---------------- */}
        <g>
          <circle cx={600} cy={205} r={75} className="viz-thin" />
          <circle cx={600} cy={205} r={52} className="viz-thin" />
          <circle cx={600} cy={205} r={30} className="viz-thin" />
          <circle cx={600} cy={205} r={4} className="viz-cell" />
          <text x={600} y={222} className="viz-label-sm" textAnchor="middle">min</text>

          <circle cx={760} cy={255} r={68} className="viz-thin" />
          <circle cx={760} cy={255} r={46} className="viz-thin" />
          <circle cx={760} cy={255} r={26} className="viz-thin" />
          <circle cx={760} cy={255} r={4} className="viz-cell" />
          <text x={760} y={272} className="viz-label-sm" textAnchor="middle">min</text>

          <rect x={674} y={224} width={12} height={12} rx={2} className="viz-warn" transform="rotate(45 680 230)" />
          <text x={680} y={308} className="viz-warn-lbl" textAnchor="middle">saddle</text>

          <path d="M500,140 Q550,155 618,188" fill="none" className="viz-pull" markerEnd="url(#ofq-arrow)" />
          <path d="M860,320 Q800,300 742,268" fill="none" className="viz-pull" markerEnd="url(#ofq-arrow)" />

          <text x={680} y={385} className="viz-label-sm" textAnchor="middle">
            Different starting points can land in different minima.
          </text>
        </g>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);

/* ===========================================================================
   Shared VizFigure wrapper for the GSAP piece below.
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
   2. VANILLA GD VS MOMENTUM — motion is genuinely the point here, watching
   the vanilla path bounce wall to wall across the steep direction while the
   momentum path glides through is the clearest way to make the difference
   land. Both trajectories below are real, computed from gradient descent on
   f(x, y) = x^2 + 10y^2 starting at (4, 4), lr = 0.08 for vanilla and
   lr = 0.06, beta = 0.3 for momentum, verified by hand before wiring in.
   Vanilla's path length over 14 steps is about 16.9 units, momentum's is
   about 9.5, roughly half, for a bigger step toward the minimum.
=========================================================================== */
const GD_PTS: [number, number][] = [
  [4.0, 4.0], [3.36, -2.4], [2.822, 1.44], [2.371, -0.864], [1.991, 0.518],
  [1.673, -0.311], [1.405, 0.187], [1.18, -0.112], [0.992, 0.067], [0.833, -0.04],
  [0.7, 0.024], [0.588, -0.015], [0.494, 0.009], [0.415, -0.005], [0.348, 0.003],
];
const MOM_PTS: [number, number][] = [
  [4.0, 4.0], [3.52, -0.8], [2.954, -1.28], [2.429, 0.112], [1.98, 0.395],
  [1.608, 0.006], [1.303, -0.118], [1.056, -0.014], [0.855, 0.034], [0.692, 0.007],
  [0.56, -0.009], [0.453, -0.003], [0.367, 0.003], [0.297, 0.001], [0.24, -0.001],
];
const SCALE = 32;

function toPx(pt: [number, number], cx: number, cy: number): [number, number] {
  return [cx + SCALE * pt[0], cy - SCALE * pt[1]];
}

function setupGdMomentum(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const leftC: [number, number] = [250, 250];
  const rightC: [number, number] = [690, 250];

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `gm-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-blue" });

  const phase = mkText(svg, "", 470, 28, "viz-phase", "middle");

  mkText(svg, "VANILLA GRADIENT DESCENT", 250, 52, "viz-label-sm", "middle");
  mkText(svg, "MOMENTUM", 690, 52, "viz-label-sm", "middle");

  mk(svg, "rect", { x: 40, y: 70, width: 420, height: 360, rx: 12, class: "viz-panel" });
  mk(svg, "rect", { x: 480, y: 70, width: 420, height: 360, rx: 12, class: "viz-panel" });

  // decorative elongated-bowl contours (flat direction horizontal, steep vertical)
  const ringSpecs: [number, number][] = [[180, 56], [130, 40], [85, 26], [45, 14]];
  [leftC, rightC].forEach(([cx, cy]) => {
    ringSpecs.forEach(([rx, ry]) => {
      mk(svg, "ellipse", { cx, cy, rx, ry, class: "viz-thin" });
    });
    mk(svg, "circle", { cx, cy, r: 4, class: "viz-cell" });
  });

  function buildPath(pts: [number, number][], cx: number, cy: number) {
    const px = pts.map((p) => toPx(p, cx, cy));
    const d = px.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
    const path = mk(svg, "path", { d, fill: "none", class: "viz-blue", "marker-end": `url(#gm-${uid})`, opacity: 0 }) as SVGPathElement;
    const startDot = mk(svg, "circle", { cx: px[0][0], cy: px[0][1], r: 6, class: "viz-cell", opacity: 0 }) as SVGCircleElement;
    return { path, startDot };
  }

  const gd = buildPath(GD_PTS, leftC[0], leftC[1]);
  const mom = buildPath(MOM_PTS, rightC[0], rightC[1]);

  const recapGd = mkText(svg, "", leftC[0], 452, "viz-label-sm", "middle");
  const recapMom = mkText(svg, "", rightC[0], 452, "viz-label-sm", "middle");
  gsap.set([recapGd, recapMom], { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  let rate = 1;

  const play = () => {
    tl?.kill();
    phase.textContent = "";
    [gd, mom].forEach(({ path, startDot }) => {
      const len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
      gsap.set(path, { opacity: 1 });
      gsap.set(startDot, { opacity: 0 });
    });
    gsap.set([recapGd, recapMom], { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Same ill-conditioned bowl, flat in one direction, steep in the other"; });
    tl.to([gd.startDot, mom.startDot], { opacity: 1, duration: 0.3, stagger: 0.1 }, "<");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Vanilla gradient descent overshoots the steep direction and zigzags"; });
    tl.to(gd.path, { strokeDashoffset: 0, duration: 2.0, ease: "none" }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Momentum carries velocity through, the same steps land a smoother path"; });
    tl.to(mom.path, { strokeDashoffset: 0, duration: 1.4, ease: "none" }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => {
      phase.textContent = "Same 14 steps, momentum's path is roughly half as long";
      recapGd.textContent = "path length ≈ 16.9";
      recapMom.textContent = "path length ≈ 9.5";
    });
    tl.to([recapGd, recapMom], { opacity: 1, duration: 0.3, stagger: 0.1 }, "<");

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

export const GdMomentumDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 940 480" maxW="max-w-3xl" delay={delay} setup={setupGdMomentum} />
);
