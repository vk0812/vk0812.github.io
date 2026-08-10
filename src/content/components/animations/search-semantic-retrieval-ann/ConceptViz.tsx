import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke GSAP scene for approximate nearest neighbor search. Theme comes
   entirely from CSS vars (.viz / .dark .viz in index.css), matching every
   other bespoke animation on the site. Plays once when scrolled into view,
   a replay button restarts it.
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
   APPROXIMATE NEAREST NEIGHBOR SEARCH — a query compares itself against a
   handful of cluster centroids, skips every cluster but the nearest one,
   then compares directly only against the small number of vectors inside
   that one cluster. All coordinates were verified offline with
   scripts/check-svg-layout.py (the four large dashed cluster regions were
   excluded from that check's box set on purpose, a point or centroid sitting
   inside its own cluster's dashed boundary is the intended shape here, not a
   collision). The distances between the query and every centroid or point
   below are real Euclidean distances between the coordinates used in the
   scene, verified with node -e, not staged to look right.
=========================================================================== */
interface ClusterSpec {
  id: string;
  cx: number;
  cy: number;
  labelY: number;
  points: [number, number][];
}

const CLUSTERS: ClusterSpec[] = [
  { id: "A", cx: 190, cy: 225, labelY: 125, points: [[160, 200], [215, 190], [155, 255], [220, 250]] },
  { id: "B", cx: 690, cy: 215, labelY: 115, points: [[660, 185], [720, 195], [665, 245], [725, 240]] },
  { id: "C", cx: 230, cy: 455, labelY: 355, points: [[200, 430], [260, 425], [205, 485], [260, 480]] },
  { id: "D", cx: 670, cy: 445, labelY: 345, points: [[640, 410], [705, 420], [650, 480], [700, 475]] },
];
const CLUSTER_R = 70;
const QUERY = { x: 450, y: 335 };
// Nearest centroid to QUERY (Euclidean distance, verified offline):
// A ~= 282.3, B ~= 268.3, C ~= 250.6, D ~= 246.0. D wins.
const WINNER = "D";
// Nearest stored vector to QUERY inside cluster D:
// (640,410) ~= 204.3, (705,420) ~= 268.8, (650,480) ~= 247.0, (700,475) ~= 286.5.
const WINNER_POINT_IDX = 0;

function clipPoint(from: { x: number; y: number }, to: { x: number; y: number }, r: number) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  return { x: from.x + (dx / dist) * r, y: from.y + (dy / dist) * r };
}

type Line = { el: SVGLineElement; len: number };

function setupAnnNarrowing(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const phase = mkText(svg, "", 450, 22, "viz-phase", "middle");

  // legend
  mk(svg, "circle", { cx: 130, cy: 64, r: 6, class: "viz-box" });
  mkText(svg, "stored vector", 146, 68, "viz-label-sm", "start");
  mk(svg, "rect", { x: 380, y: 57, width: 14, height: 14, rx: 2, class: "viz-panel" });
  mkText(svg, "cluster centroid", 402, 68, "viz-label-sm", "start");
  mk(svg, "rect", { x: 633, y: 57, width: 14, height: 14, class: "viz-panel", transform: "rotate(45 640 64)" });
  mkText(svg, "query point", 656, 68, "viz-label-sm", "start");

  type ClusterEls = {
    circle: SVGCircleElement;
    ring: SVGCircleElement;
    centroid: SVGRectElement;
    label: SVGTextElement;
    points: SVGCircleElement[];
  };

  const clusterEls: Record<string, ClusterEls> = {};
  CLUSTERS.forEach((c) => {
    const circle = mk(svg, "circle", {
      cx: c.cx, cy: c.cy, r: CLUSTER_R, class: "viz-thin", "stroke-dasharray": "5 4", opacity: 0,
    }) as SVGCircleElement;
    const ring = mk(svg, "circle", {
      cx: c.cx, cy: c.cy, r: CLUSTER_R + 8, class: "viz-blue", "stroke-dasharray": "4 3", opacity: 0,
    }) as SVGCircleElement;
    const centroid = mk(svg, "rect", {
      x: c.cx - 7, y: c.cy - 7, width: 14, height: 14, rx: 2, class: "viz-panel", opacity: 0,
    }) as SVGRectElement;
    const label = mkText(svg, `Cluster ${c.id}`, c.cx, c.labelY, "viz-label-sm", "middle") as SVGTextElement;
    gsap.set(label, { opacity: 0 });
    const points = c.points.map(([px, py]) =>
      mk(svg, "circle", { cx: px, cy: py, r: 6, class: "viz-box", opacity: 0 }) as SVGCircleElement
    );
    clusterEls[c.id] = { circle, ring, centroid, label, points };
  });

  // query marker
  const queryEl = mk(svg, "rect", {
    x: QUERY.x - 8, y: QUERY.y - 8, width: 16, height: 16, class: "viz-panel",
    transform: `rotate(45 ${QUERY.x} ${QUERY.y})`, opacity: 0,
  }) as SVGRectElement;
  const queryLbl = mkText(svg, "Q", QUERY.x, 295, "viz-label", "middle") as SVGTextElement;
  gsap.set(queryLbl, { opacity: 0 });

  // query -> centroid lines
  const centroidLines: Record<string, Line> = {};
  CLUSTERS.forEach((c) => {
    const p1 = clipPoint(QUERY, { x: c.cx, y: c.cy }, 10);
    const p2 = clipPoint({ x: c.cx, y: c.cy }, QUERY, 10);
    const el = mk(svg, "line", {
      x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, class: "viz-blue", opacity: 0,
    }) as SVGLineElement;
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    el.style.strokeDasharray = String(len);
    centroidLines[c.id] = { el, len };
  });

  // query -> winner cluster's stored vectors
  const winner = CLUSTERS.find((c) => c.id === WINNER)!;
  const pointLines: Line[] = winner.points.map(([px, py]) => {
    const p1 = clipPoint(QUERY, { x: px, y: py }, 10);
    const p2 = clipPoint({ x: px, y: py }, QUERY, 8);
    const el = mk(svg, "line", {
      x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, class: "viz-blue", opacity: 0,
    }) as SVGLineElement;
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    el.style.strokeDasharray = String(len);
    return { el, len };
  });
  const [winX, winY] = winner.points[WINNER_POINT_IDX];
  const winnerPointRing = mk(svg, "circle", {
    cx: winX, cy: winY, r: 13, class: "viz-blue", "stroke-dasharray": "4 3", opacity: 0,
  }) as SVGCircleElement;

  const resetLine = (l: Line) => {
    gsap.set(l.el, { opacity: 0 });
    l.el.style.strokeDashoffset = String(l.len);
  };

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    Object.values(clusterEls).forEach((c) => {
      gsap.set([c.circle, c.centroid, ...c.points], { opacity: 0 });
      gsap.set(c.label, { opacity: 0 });
      gsap.set(c.ring, { opacity: 0 });
    });
    gsap.set(queryEl, { opacity: 0 });
    gsap.set(queryLbl, { opacity: 0 });
    Object.values(centroidLines).forEach(resetLine);
    pointLines.forEach(resetLine);
    gsap.set(winnerPointRing, { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "A large set of stored vectors gets grouped into clusters ahead of time"; });
    CLUSTERS.forEach((c, i) => {
      const els = clusterEls[c.id];
      tl.to(els.circle, { opacity: 1, duration: 0.3 }, i === 0 ? "<" : "<0.08");
      tl.to(els.centroid, { opacity: 1, duration: 0.3 }, "<");
      tl.to(els.points, { opacity: 1, duration: 0.3, stagger: 0.04 }, "<");
      tl.to(els.label, { opacity: 1, duration: 0.3 }, "<");
    });
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "A new query only has to compare itself against the cluster centroids first"; });
    tl.to(queryEl, { opacity: 1, duration: 0.3 }, "<");
    tl.to(queryLbl, { opacity: 1, duration: 0.3 }, "<");
    Object.values(centroidLines).forEach((l, i) => {
      tl.to(l.el, { opacity: 1, duration: 0.05 }, i === 0 ? "<0.1" : "<0.12");
      tl.to(l.el, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
    });
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "The nearest centroid wins, so every other cluster gets skipped entirely"; });
    tl.to(clusterEls[WINNER].ring, { opacity: 1, duration: 0.3 }, "<");
    CLUSTERS.filter((c) => c.id !== WINNER).forEach((c) => {
      const els = clusterEls[c.id];
      tl.to([els.circle, els.centroid, ...els.points, els.label], { opacity: 0.15, duration: 0.4 }, "<");
      tl.to(centroidLines[c.id].el, { opacity: 0.15, duration: 0.4 }, "<");
    });
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Only the vectors inside that one cluster get compared directly against the query"; });
    tl.to(centroidLines[WINNER].el, { opacity: 0.4, duration: 0.3 }, "<");
    pointLines.forEach((l) => {
      tl.to(l.el, { opacity: 1, duration: 0.05 }, "<0.1");
      tl.to(l.el, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    });
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "That closest vector is the approximate answer, found by touching a small fraction of the index"; });
    pointLines.forEach((l, i) => {
      if (i === WINNER_POINT_IDX) return;
      tl.to(l.el, { opacity: 0.3, duration: 0.4 }, "<");
    });
    tl.to(winnerPointRing, { opacity: 1, duration: 0.3 }, "<");

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

export const AnnNarrowingDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 580" maxW="max-w-2xl" delay={delay} setup={setupAnnNarrowing} />
);
