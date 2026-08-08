import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   Bespoke, fully static visuals for "Dimensionality Reduction and Manifold
   Learning". No GSAP timeline, motion isn't the point for either figure, the
   shape of the data and the direction of the fitted line is. Theme comes
   entirely from CSS vars (.viz / .dark .viz in index.css), matching the
   pattern used by ConvexNonConvexDiagram in optimization-fundamentals.
---------------------------------------------------------------------------- */

/* ===========================================================================
   1. PCA AXIS DIAGRAM — the worked 10-point example from the post. Real data,
   real mean, real PC1/PC2 directions from the verified eigendecomposition
   (eigenvalues 1.284 and 0.049, PC1 = [0.6779, 0.7352]). Coordinates below are
   the data points and vectors run through a single linear scale + y-flip, so
   the angles on screen match the actual computed directions exactly.
=========================================================================== */

const DATA: [number, number][] = [
  [2.5, 2.4], [0.5, 0.7], [2.2, 2.9], [1.9, 2.2], [3.1, 3.0],
  [2.3, 2.7], [2.0, 1.6], [1.0, 1.1], [1.5, 1.6], [1.1, 0.9],
];
const MEAN: [number, number] = [1.81, 1.91];
const PC1: [number, number] = [0.6779, 0.7352];
const PC2: [number, number] = [-0.7352, 0.6779];

const SCALE = 90;
const OX = 120;
const OY = 380;

function toPx([x, y]: [number, number]): [number, number] {
  return [OX + x * SCALE, OY - y * SCALE];
}

function alongPc(dir: [number, number], s: number): [number, number] {
  return [MEAN[0] + s * dir[0], MEAN[1] + s * dir[1]];
}

export const PcaAxisDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => {
  const dots = DATA.map(toPx);
  const [meanX, meanY] = toPx(MEAN);
  const [pc1AX, pc1AY] = toPx(alongPc(PC1, -1.7));
  const [pc1BX, pc1BY] = toPx(alongPc(PC1, 1.7));
  const [pc2AX, pc2AY] = toPx(alongPc(PC2, -0.4));
  const [pc2BX, pc2BY] = toPx(alongPc(PC2, 0.4));
  const [pc2LabelX, pc2LabelY] = toPx(alongPc(PC2, -0.85));

  return (
    <motion.figure
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay }}
      className="mx-auto mb-8 max-w-2xl"
    >
      <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
        <svg viewBox="0 0 620 440" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="pca-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="viz-arrow-blue" />
            </marker>
            <marker id="pca-arrow-ghost" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="viz-arrow-ink" opacity={0.5} />
            </marker>
          </defs>

          <rect x={30} y={60} width={560} height={320} rx={12} className="viz-panel" />
          <text x={310} y={36} className="viz-phase" textAnchor="middle">
            TEN POINTS, CENTERED, THEN ROTATED ONTO PC1 / PC2
          </text>

          {/* PC2, the low-variance direction, drawn first so PC1 sits on top */}
          <line x1={pc2AX} y1={pc2AY} x2={pc2BX} y2={pc2BY} className="viz-pull" markerEnd="url(#pca-arrow-ghost)" />
          <text x={pc2LabelX} y={pc2LabelY} className="viz-label-sm" textAnchor="start">PC2</text>

          {/* PC1, the direction of maximum variance */}
          <line x1={pc1AX} y1={pc1AY} x2={pc1BX} y2={pc1BY} className="viz-blue" markerEnd="url(#pca-arrow)" />
          <text x={pc1BX + 8} y={pc1BY - 8} className="viz-label" textAnchor="start">PC1</text>

          {/* data points */}
          {dots.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={6} className="viz-cell" />
          ))}

          {/* mean marker */}
          <circle cx={meanX} cy={meanY} r={5} fill="none" className="viz-warn" />
          <text x={meanX + 40} y={meanY + 10} className="viz-label-sm" textAnchor="start">mean</text>

          <text x={310} y={415} className="viz-label-sm" textAnchor="middle">
            PC1 explains 96.3% of the variance, PC2 the remaining 3.7%
          </text>
        </svg>
      </div>
      <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
        {caption}
      </figcaption>
    </motion.figure>
  );
};

/* ===========================================================================
   2. LINEAR VS CURVED MANIFOLD — a straight cloud where a straight line is
   the honest summary, next to a curved arc where the same straight line cuts
   across the shape and pulls far-apart points close together. Illustrative
   only (no numeric claim is made about these specific coordinates in the
   post prose), same two-panel layout as ConvexNonConvexDiagram.
=========================================================================== */

const LEFT_PTS: [number, number][] = [
  [80, 158], [120, 169], [160, 202], [200, 213],
  [240, 246], [280, 257], [320, 290], [360, 301],
];

const ARC_CENTER: [number, number] = [680, 260];
const ARC_RX = 150;
const ARC_RY = 100;
const ARC_THETAS = [10, 45, 80, 115, 150, 185, 220];

function onArc(thetaDeg: number): [number, number] {
  const rad = (thetaDeg * Math.PI) / 180;
  return [ARC_CENTER[0] + ARC_RX * Math.cos(rad), ARC_CENTER[1] + ARC_RY * Math.sin(rad)];
}

export const ManifoldFlattenDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => {
  const rightPts = ARC_THETAS.map(onArc);
  const [arcStartX, arcStartY] = rightPts[0];
  const [arcEndX, arcEndY] = rightPts[rightPts.length - 1];

  return (
    <motion.figure
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay }}
      className="mx-auto mb-8 max-w-3xl"
    >
      <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
        <svg viewBox="0 0 900 440" preserveAspectRatio="xMidYMid meet">
          <text x={220} y={30} className="viz-phase" textAnchor="middle">LINEAR STRUCTURE</text>
          <text x={680} y={30} className="viz-phase" textAnchor="middle">CURVED MANIFOLD</text>

          <rect x={30} y={60} width={380} height={330} rx={12} className="viz-panel" />
          <rect x={490} y={60} width={380} height={330} rx={12} className="viz-panel" />

          {/* left: straight cloud, a straight line is the honest fit */}
          <line x1={62} y1={150} x2={378} y2={310} className="viz-blue" />
          {LEFT_PTS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={6} className="viz-cell" />
          ))}
          <text x={220} y={418} className="viz-label-sm" textAnchor="middle">
            A straight line captures nearly all the spread in the data.
          </text>

          {/* right: curved arc, the straight chord folds distant points together */}
          <path
            d={`M ${arcStartX} ${arcStartY} A ${ARC_RX} ${ARC_RY} 0 1 1 ${arcEndX} ${arcEndY}`}
            fill="none"
            className="viz-thin"
            strokeDasharray="5 4"
          />
          <line x1={arcStartX} y1={arcStartY} x2={arcEndX} y2={arcEndY} className="viz-warn" />
          {rightPts.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={6} className="viz-cell" />
          ))}
          <text x={680} y={418} className="viz-label-sm" textAnchor="middle">
            PCA's straight best fit line pulls points that are far apart along the curve close together.
          </text>
        </svg>
      </div>
      <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
        {caption}
      </figcaption>
    </motion.figure>
  );
};
