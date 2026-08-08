import { motion } from "framer-motion";

/* ===========================================================================
   KnnVoteDiagram
   A fully static (no GSAP) hand-coded SVG scatter plot for the worked k=3
   example in the nearest-neighbors post. Six labeled training points plus a
   query point, with the three Euclidean-nearest neighbors ringed and joined
   to the query by a distance line. Two classes are told apart by shape and
   fill (filled circle vs hollow circle) rather than hue, so the figure reads
   the same in both themes without borrowing the warning color for a class
   that isn't a problem state.
   All coordinates below were verified offline with
   scripts/check-svg-layout.py against the same viewBox, no overlaps.
=========================================================================== */

interface PointSpec {
  id: string;
  cx: number;
  cy: number;
  cls: "blue" | "red";
  labelX: number;
  labelY: number;
  selected?: boolean;
}

const POINTS: PointSpec[] = [
  { id: "A", cx: 287.5, cy: 337.5, cls: "red", labelX: 317.5, labelY: 371.5, selected: true },
  { id: "B", cx: 430, cy: 100, cls: "red", labelX: 430, labelY: 66 },
  { id: "C", cx: 240, cy: 480, cls: "red", labelX: 240, labelY: 516 },
  { id: "D", cx: 335, cy: 147.5, cls: "blue", labelX: 369, labelY: 139.5, selected: true },
  { id: "E", cx: 97.5, cy: 480, cls: "blue", labelX: 57.5, labelY: 480 },
  { id: "F", cx: 145, cy: 242.5, cls: "blue", labelX: 103, labelY: 228.5, selected: true },
];

const QUERY = { cx: 240, cy: 290 };

const EDGES: { to: string; x1: number; y1: number; x2: number; y2: number; distLabelX: number; distLabelY: number; dist: string }[] = [
  { to: "A", x1: 257.68, y1: 307.68, x2: 269.82, y2: 319.82, distLabelX: 244, distLabelY: 333.5, dist: "1.41" },
  { to: "F", x1: 217.64, y1: 278.82, x2: 167.36, y2: 253.68, distLabelX: 205, distLabelY: 241.2, dist: "2.24" },
  { to: "D", x1: 253.87, y1: 269.2, x2: 321.13, y2: 168.3, distLabelX: 310.8, distLabelY: 234.3, dist: "3.61" },
];

const R = 10;

export const KnnVoteDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8 mx-auto max-w-xl viz"
  >
    <div className="rounded-lg border border-border bg-card p-3 sm:p-5 shadow-sm">
      <svg viewBox="0 0 480 540" className="w-full h-auto">
        {/* legend */}
        <circle cx={26} cy={20} r={7} className="viz-box" />
        <text x={40} y={24} className="viz-label-sm">Class Blue (filled)</text>
        <circle cx={186} cy={20} r={7} className="viz-stroke" />
        <text x={200} y={24} className="viz-label-sm">Class Red (hollow)</text>

        {/* distance lines to the three nearest neighbors */}
        {EDGES.map((e) => (
          <g key={e.to}>
            <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} className="viz-blue" />
            <text x={e.distLabelX} y={e.distLabelY} textAnchor="middle" className="viz-label-sm">
              {e.dist}
            </text>
          </g>
        ))}

        {/* highlight rings around the 3 selected neighbors */}
        {POINTS.filter((p) => p.selected).map((p) => (
          <circle
            key={`ring-${p.id}`}
            cx={p.cx}
            cy={p.cy}
            r={R + 7}
            fill="none"
            className="viz-blue"
            strokeDasharray="4 3"
          />
        ))}

        {/* data points */}
        {POINTS.map((p) => (
          <g key={p.id}>
            <circle cx={p.cx} cy={p.cy} r={R} className={p.cls === "blue" ? "viz-box" : "viz-stroke"} />
            <text x={p.labelX} y={p.labelY} textAnchor="middle" className="viz-label-sm">
              {p.id}
            </text>
          </g>
        ))}

        {/* query point */}
        <rect x={QUERY.cx - 9} y={QUERY.cy - 9} width={18} height={18} transform={`rotate(45 ${QUERY.cx} ${QUERY.cy})`} className="viz-panel" />
        <text x={240} y={242} textAnchor="middle" className="viz-label">
          Q
        </text>
      </svg>
    </div>
    {caption && (
      <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">
        {caption}
      </figcaption>
    )}
  </motion.figure>
);
