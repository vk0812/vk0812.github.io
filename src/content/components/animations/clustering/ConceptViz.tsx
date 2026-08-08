import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke visuals for "Clustering".
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
   1. CLUSTER SHAPE COMPARISON — fully static, no GSAP. Same 28-point synthetic
   dataset (two parallel diagonal streaks, generated with numpy, seed 7) shown
   twice. Left panel is the real result of running Lloyd's algorithm (k=2)
   to convergence from centroids seeded at each streak's own mean, still
   winds up cutting perpendicular across both streaks, 14 of 28 points land
   on the "wrong" side of that straight boundary relative to which streak
   they actually belong to. Right panel colors the same points by the streak
   they actually came from, the shape a density-based method recovers,
   verified by checking the max within-streak nearest-neighbor gap (about
   35.9 units) stays below the min cross-streak gap (about 41.1 units), so a
   distance threshold in between separates them correctly.
=========================================================================== */
type ShapePoint = { x: number; y: number; trueG: 0 | 1; kmG: 0 | 1 };

const SHAPE_POINTS: ShapePoint[] = [
  { x: 60.0, y: 139.0, trueG: 0, kmG: 0 },
  { x: 80.9, y: 159.1, trueG: 0, kmG: 0 },
  { x: 98.1, y: 167.4, trueG: 0, kmG: 0 },
  { x: 115.1, y: 188.2, trueG: 0, kmG: 0 },
  { x: 136.5, y: 199.0, trueG: 0, kmG: 0 },
  { x: 153.9, y: 218.6, trueG: 0, kmG: 0 },
  { x: 177.9, y: 233.3, trueG: 0, kmG: 0 },
  { x: 203.0, y: 257.1, trueG: 0, kmG: 1 },
  { x: 214.8, y: 269.7, trueG: 0, kmG: 1 },
  { x: 233.9, y: 293.3, trueG: 0, kmG: 1 },
  { x: 258.2, y: 309.8, trueG: 0, kmG: 1 },
  { x: 277.3, y: 325.3, trueG: 0, kmG: 1 },
  { x: 295.8, y: 332.4, trueG: 0, kmG: 1 },
  { x: 311.0, y: 357.8, trueG: 0, kmG: 1 },
  { x: 93.8, y: 99.9, trueG: 1, kmG: 0 },
  { x: 114.1, y: 122.4, trueG: 1, kmG: 0 },
  { x: 126.7, y: 144.9, trueG: 1, kmG: 0 },
  { x: 150.8, y: 149.5, trueG: 1, kmG: 0 },
  { x: 168.3, y: 176.8, trueG: 1, kmG: 0 },
  { x: 188.6, y: 190.6, trueG: 1, kmG: 0 },
  { x: 216.2, y: 204.4, trueG: 1, kmG: 0 },
  { x: 227.9, y: 232.6, trueG: 1, kmG: 1 },
  { x: 250.8, y: 244.3, trueG: 1, kmG: 1 },
  { x: 274.3, y: 253.0, trueG: 1, kmG: 1 },
  { x: 287.7, y: 275.4, trueG: 1, kmG: 1 },
  { x: 309.3, y: 294.6, trueG: 1, kmG: 1 },
  { x: 329.9, y: 308.3, trueG: 1, kmG: 1 },
  { x: 349.3, y: 329.0, trueG: 1, kmG: 1 },
];

// k-means centroids at convergence (data coords c1=[147.47,137.44], c2=[310.69,279.43])
// mapped into the same panel coordinates as the points above.
const KM_C1 = { x: 134.4, y: 170.9 };
const KM_C2 = { x: 273.1, y: 291.6 };
// perpendicular bisector between the two centroids, extended to span the panel.
const KM_BOUNDARY = { x1: 59.3, y1: 397.2, x2: 348.2, y2: 65.4 };

function ShapePanel({ offsetX, mode }: { offsetX: number; mode: "kmeans" | "dbscan" }) {
  return (
    <g transform={`translate(${offsetX}, 0)`}>
      {mode === "kmeans" && (
        <>
          <line
            x1={KM_BOUNDARY.x1}
            y1={KM_BOUNDARY.y1}
            x2={KM_BOUNDARY.x2}
            y2={KM_BOUNDARY.y2}
            className="viz-warn"
            strokeDasharray="6 5"
          />
          <path d={`M${KM_C1.x - 11},${KM_C1.y} L${KM_C1.x},${KM_C1.y - 11} L${KM_C1.x + 11},${KM_C1.y} L${KM_C1.x},${KM_C1.y + 11} Z`} className="viz-blue" />
          <path d={`M${KM_C2.x - 11},${KM_C2.y} L${KM_C2.x},${KM_C2.y - 11} L${KM_C2.x + 11},${KM_C2.y} L${KM_C2.x},${KM_C2.y + 11} Z`} className="viz-stroke" />
        </>
      )}
      {SHAPE_POINTS.map((p, i) => {
        const group = mode === "kmeans" ? p.kmG : p.trueG;
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={7}
            className={group === 0 ? "viz-cell" : "viz-ghost"}
          />
        );
      })}
    </g>
  );
}

export const ClusterShapeComparison = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="mx-auto mb-8 max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
      <svg viewBox="0 0 900 460" preserveAspectRatio="xMidYMid meet">
        <text x={220} y={36} className="viz-phase" textAnchor="middle">K-MEANS (k = 2)</text>
        <text x={680} y={36} className="viz-phase" textAnchor="middle">DENSITY-BASED (DBSCAN)</text>

        <rect x={30} y={60} width={380} height={340} rx={12} className="viz-panel" />
        <rect x={490} y={60} width={380} height={340} rx={12} className="viz-panel" />

        <ShapePanel offsetX={0} mode="kmeans" />
        <ShapePanel offsetX={460} mode="dbscan" />

        <text x={220} y={430} className="viz-label-sm" textAnchor="middle">
          Straight centroid boundary slices across both streaks, 14 of 28 points end up mislabeled
        </text>
        <text x={680} y={430} className="viz-label-sm" textAnchor="middle">
          Same two streaks, colored by which chain of nearby points each one belongs to
        </text>
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
   2. K-MEANS ITERATION LOOP — motion is genuinely the point here, watching
   the points swap color as the centroids relocate is the clearest way to
   show assign-then-update as a repeating loop rather than a static picture.
   Six points, two centroids seeded at two of the points themselves (the
   naive "pick k random points" init), run through numpy to real convergence.
   Iteration 1: assign labels [0,0,1,1,0,1], new centroids (1.167, 1.467) and
   (7.333, 9.0). Iteration 2: same assignment comes back unchanged, so the
   loop stops. Final within-cluster sum of squares is 15.98, verified by hand
   and with numpy.
=========================================================================== */
const KM_POINTS: { x: number; y: number; label: 0 | 1 }[] = [
  { x: 154, y: 343.3, label: 0 },
  { x: 191, y: 349.0, label: 0 },
  { x: 450, y: 173.3, label: 1 },
  { x: 672, y: 173.3, label: 1 },
  { x: 154, y: 383.0, label: 0 },
  { x: 746, y: 88.3, label: 1 },
];
const KM_C1_START = { x: 154, y: 343.3 };
const KM_C2_START = { x: 450, y: 173.3 };
const KM_C1_END = { x: 166.3, y: 358.4 };
const KM_C2_END = { x: 622.7, y: 145.0 };

function diamondPath(cx: number, cy: number, r = 13) {
  return `M${cx - r},${cy} L${cx},${cy - r} L${cx + r},${cy} L${cx},${cy + r} Z`;
}

function setupKMeansIteration(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const phase = mkText(svg, "", 450, 24, "viz-phase", "middle");
  mk(svg, "rect", { x: 20, y: 55, width: 860, height: 380, rx: 12, class: "viz-panel" });

  const dots = KM_POINTS.map((p) =>
    mk(svg, "circle", { cx: p.x, cy: p.y, r: 9, class: "viz-thin" }) as SVGCircleElement
  );

  const c1 = mk(svg, "path", { d: diamondPath(KM_C1_START.x, KM_C1_START.y), class: "viz-blue" }) as SVGPathElement;
  const c2 = mk(svg, "path", { d: diamondPath(KM_C2_START.x, KM_C2_START.y), class: "viz-stroke" }) as SVGPathElement;

  const recap = mkText(svg, "", 450, 460, "viz-label-sm", "middle");
  gsap.set(recap, { opacity: 0 });

  const cur1 = { x: KM_C1_START.x, y: KM_C1_START.y };
  const cur2 = { x: KM_C2_START.x, y: KM_C2_START.y };

  let tl: gsap.core.Timeline | null = null;
  let rate = 1;

  const setDots = (labels: (0 | 1)[]) => {
    dots.forEach((d, i) => d.setAttribute("class", labels[i] === 0 ? "viz-cell" : "viz-ghost"));
  };
  const resetDots = () => {
    dots.forEach((d) => d.setAttribute("class", "viz-thin"));
  };

  const play = () => {
    tl?.kill();
    phase.textContent = "";
    resetDots();
    cur1.x = KM_C1_START.x; cur1.y = KM_C1_START.y;
    cur2.x = KM_C2_START.x; cur2.y = KM_C2_START.y;
    gsap.set(c1, { attr: { d: diamondPath(cur1.x, cur1.y) } });
    gsap.set(c2, { attr: { d: diamondPath(cur2.x, cur2.y) } });
    gsap.set(recap, { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => {
      phase.textContent = "Two centroids seeded at two of the six points";
    });
    tl.to({}, { duration: 0.9 });

    tl.add(() => {
      phase.textContent = "Assign, each point joins its nearest centroid";
      setDots(KM_POINTS.map((p) => p.label));
    });
    tl.to({}, { duration: 1.0 });

    tl.add(() => {
      phase.textContent = "Update, move each centroid to the mean of its assigned points";
    });
    tl.to(cur1, {
      x: KM_C1_END.x, y: KM_C1_END.y, duration: 1.1, ease: "power2.inOut",
      onUpdate: () => c1.setAttribute("d", diamondPath(cur1.x, cur1.y)),
    }, "<");
    tl.to(cur2, {
      x: KM_C2_END.x, y: KM_C2_END.y, duration: 1.1, ease: "power2.inOut",
      onUpdate: () => c2.setAttribute("d", diamondPath(cur2.x, cur2.y)),
    }, "<");
    tl.to({}, { duration: 0.6 });

    tl.add(() => {
      phase.textContent = "Iteration 2, reassign, no point changes color";
    });
    tl.to(dots, { scale: 1.35, duration: 0.25, stagger: 0.03, transformOrigin: "center", yoyo: true, repeat: 1 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => {
      phase.textContent = "Centroids stop moving, the loop has converged";
      recap.textContent = "final within-cluster sum of squares ≈ 15.98";
    });
    tl.to(recap, { opacity: 1, duration: 0.3 }, "<");

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

export const KMeansIterationDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 480" maxW="max-w-3xl" delay={delay} setup={setupKMeansIteration} />
);
