import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   Bespoke visual for "Decision Trees". Fully static, hand-coded SVG, no GSAP,
   same pattern as ComplexityErrorCurveDiagram in the generalization post. A
   single root split into two leaves is the entire worked example from the
   post, drawing it once removes any doubt about which numbers belong to
   which node. Theme comes entirely from the .viz / .dark .viz CSS vars.
---------------------------------------------------------------------------- */

export const DecisionTreeDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="mx-auto mb-8 max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
      <svg viewBox="0 0 900 460" preserveAspectRatio="xMidYMid meet">
        {/* edges, drawn first so boxes sit on top of the line ends */}
        <line x1={450} y1={140} x2={220} y2={295} className="viz-stroke" />
        <line x1={450} y1={140} x2={680} y2={295} className="viz-stroke" />

        {/* edge labels, clear of both lines */}
        <text x={295} y={215} className="viz-label-sm" textAnchor="middle">hours studied &#8804; 3.5</text>
        <text x={610} y={215} className="viz-label-sm" textAnchor="middle">hours studied &gt; 3.5</text>

        {/* root node */}
        <rect x={340} y={40} width={220} height={100} rx={8} className="viz-box" />
        <text x={450} y={65} className="viz-node-lbl" textAnchor="middle">All 8 students</text>
        <text x={450} y={88} className="viz-label-sm" textAnchor="middle">4 pass, 4 fail</text>
        <text x={450} y={107} className="viz-label-sm" textAnchor="middle">entropy = 1.000</text>
        <text x={450} y={125} className="viz-label-sm" textAnchor="middle">gini = 0.500</text>

        {/* left leaf, pure */}
        <rect x={70} y={300} width={260} height={130} rx={8} className="viz-box" />
        <text x={200} y={324} className="viz-node-lbl" textAnchor="middle">3 students, 3 fail</text>
        <text x={200} y={347} className="viz-label-sm" textAnchor="middle">entropy = 0.000</text>
        <text x={200} y={366} className="viz-label-sm" textAnchor="middle">gini = 0.000</text>
        <text x={200} y={385} className="viz-label-sm" textAnchor="middle">pure leaf, predict fail</text>
        <text x={200} y={404} className="viz-label-sm" textAnchor="middle">no further split needed</text>

        {/* right leaf, mixed */}
        <rect x={530} y={300} width={300} height={130} rx={8} className="viz-box" />
        <text x={680} y={324} className="viz-node-lbl" textAnchor="middle">5 students, 4 pass, 1 fail</text>
        <text x={680} y={347} className="viz-label-sm" textAnchor="middle">entropy = 0.722</text>
        <text x={680} y={366} className="viz-label-sm" textAnchor="middle">gini = 0.320</text>
        <text x={680} y={385} className="viz-label-sm" textAnchor="middle">still mixed, a deeper tree</text>
        <text x={680} y={404} className="viz-label-sm" textAnchor="middle">could split this again</text>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);
