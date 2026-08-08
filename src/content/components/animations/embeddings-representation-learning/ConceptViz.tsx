import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   Bespoke, fully static visual for "Embeddings and Representation Learning".
   No GSAP timeline, the geometry of the three toy vectors is the whole point,
   not motion. Theme comes entirely from CSS vars (.viz / .dark .viz in
   index.css), matching the pattern used by PcaAxisDiagram in
   dimensionality-reduction-manifold-learning.

   The three points below are the exact toy embeddings from the post's worked
   example, verified with NumPy:
     query = [4.0, 0.5]              norm 4.03
     close = [1.0, 0.15]  (small norm, nearly same direction as query)
     far   = [3.6, 3.4]   (big norm, a noticeably different direction)
   cosine(query, close) = 0.9997   dot = 4.08    euclidean = 3.02
   cosine(query, far)   = 0.8066   dot = 16.10   euclidean = 2.93
   Pixel placement below is a schematic 2D layout chosen for readable label
   spacing, not a literal to-scale plot of those coordinates.
---------------------------------------------------------------------------- */

const QUERY: [number, number] = [510, 410];
const CLOSE: [number, number] = [210, 445];
const FAR: [number, number] = [470, 120];

export const EmbeddingSimilarityScatter = ({
  caption,
  delay = 0,
}: {
  caption: string;
  delay?: number;
}) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="mx-auto mb-8 max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
      <svg viewBox="0 0 720 500" preserveAspectRatio="xMidYMid meet">
        <rect x={20} y={40} width={680} height={430} rx={12} className="viz-panel" />
        <text x={360} y={28} className="viz-phase" textAnchor="middle">
          ONE QUERY, TWO CANDIDATES, THREE METRICS
        </text>

        {/* distance lines, drawn first so points sit on top */}
        <line
          x1={QUERY[0]} y1={QUERY[1]} x2={CLOSE[0]} y2={CLOSE[1]}
          className="viz-thin" strokeDasharray="6 4"
        />
        <line
          x1={QUERY[0]} y1={QUERY[1]} x2={FAR[0]} y2={FAR[1]}
          className="viz-thin" strokeDasharray="6 4"
        />

        {/* metric readouts, one per candidate line */}
        <text x={360} y={402} className="viz-label-sm" textAnchor="middle">
          cos 0.9997 &middot; dot 4.08 &middot; euclidean 3.02
        </text>
        <text x={615} y={264} className="viz-label-sm" textAnchor="middle">
          cos 0.8066 &middot; dot 16.10
        </text>
        <text x={615} y={278} className="viz-label-sm" textAnchor="middle">
          euclidean 2.93
        </text>

        {/* points */}
        <circle cx={CLOSE[0]} cy={CLOSE[1]} r={6} className="viz-cell" />
        <circle cx={FAR[0]} cy={FAR[1]} r={6} className="viz-cell" />
        <circle cx={QUERY[0]} cy={QUERY[1]} r={8} className="viz-cell" />
        <circle cx={QUERY[0]} cy={QUERY[1]} r={14} fill="none" className="viz-blue" />

        {/* point labels */}
        <text x={105} y={444} className="viz-label" textAnchor="middle">close</text>
        <text x={105} y={462} className="viz-label-sm" textAnchor="middle">small norm 1.01, same direction as query</text>

        <text x={572} y={122} className="viz-label" textAnchor="middle">far</text>
        <text x={572} y={140} className="viz-label-sm" textAnchor="middle">big norm 4.95, different direction</text>

        <text x={603} y={412} className="viz-label" textAnchor="middle">query</text>
        <text x={603} y={430} className="viz-label-sm" textAnchor="middle">norm 4.03</text>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);
