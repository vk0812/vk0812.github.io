import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   Bespoke visuals for "Generalization and the Bias-Variance Trade-off".
   Both figures here are fully static, hand-coded SVG, no GSAP. The shapes of
   two curves are the entire point, motion doesn't add anything a reader
   can't already get from the lines themselves. Theme comes entirely from the
   .viz / .dark .viz CSS vars in index.css, same pattern as every other
   bespoke figure on the site.
---------------------------------------------------------------------------- */

/* ===========================================================================
   1. ERROR VS MODEL COMPLEXITY — training error falls monotonically, validation
   error falls then rises, and the point where validation error bottoms out
   marks the handoff from underfitting to overfitting.
=========================================================================== */
export const ComplexityErrorCurveDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="mx-auto mb-8 max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
      <svg viewBox="0 0 900 460" preserveAspectRatio="xMidYMid meet">
        {/* axes */}
        <line x1={90} y1={60} x2={90} y2={360} className="viz-thin" />
        <line x1={90} y1={360} x2={830} y2={360} className="viz-thin" />

        {/* sweet spot guide */}
        <line x1={380} y1={360} x2={380} y2={145} className="viz-baseline" />

        {/* region labels */}
        <text x={200} y={130} className="viz-label-sm" textAnchor="middle">UNDERFITTING</text>
        <text x={650} y={130} className="viz-label-sm" textAnchor="middle">OVERFITTING</text>

        {/* training error, monotonic decrease */}
        <path
          d="M100,300 C220,230 300,160 400,120 C550,95 700,75 820,65"
          fill="none"
          className="viz-stroke"
        />
        {/* validation error, decreases then rises */}
        <path
          d="M100,320 C220,240 300,175 380,155 C460,140 520,160 600,210 C680,260 750,290 820,300"
          fill="none"
          className="viz-blue"
        />

        {/* validation minimum marker */}
        <circle cx={380} cy={155} r={5} className="viz-cell" />

        {/* legend */}
        <line x1={110} y1={80} x2={140} y2={80} className="viz-stroke" />
        <text x={148} y={84} className="viz-label-sm">Training error</text>
        <line x1={110} y1={104} x2={140} y2={104} className="viz-blue" />
        <text x={148} y={108} className="viz-label-sm">Validation error</text>

        {/* axis captions */}
        <text x={100} y={395} className="viz-label-sm">low</text>
        <text x={380} y={395} className="viz-label-sm" textAnchor="middle">sweet spot</text>
        <text x={820} y={395} className="viz-label-sm" textAnchor="end">high</text>
        <text x={460} y={430} className="viz-label" textAnchor="middle">Model complexity</text>
        <text x={40} y={210} className="viz-label" textAnchor="middle" transform="rotate(-90 40 210)">Error</text>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);

/* ===========================================================================
   2. LEARNING CURVE — train and validation error against training set size.
   Training error rises slightly and flattens, validation error falls and
   flattens, and the gap between them narrows as more data arrives.
=========================================================================== */
export const LearningCurveDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="mx-auto mb-8 max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
      <svg viewBox="0 0 900 460" preserveAspectRatio="xMidYMid meet">
        {/* axes */}
        <line x1={90} y1={60} x2={90} y2={360} className="viz-thin" />
        <line x1={90} y1={360} x2={830} y2={360} className="viz-thin" />

        {/* training error, rises slightly and flattens */}
        <path
          d="M100,90 C200,110 300,140 420,155 C550,165 700,170 820,172"
          fill="none"
          className="viz-stroke"
        />
        {/* validation error, falls and flattens */}
        <path
          d="M100,340 C220,260 320,205 420,190 C550,182 700,177 820,178"
          fill="none"
          className="viz-blue"
        />

        {/* legend */}
        <line x1={640} y1={95} x2={670} y2={95} className="viz-stroke" />
        <text x={678} y={99} className="viz-label-sm">Training error</text>
        <line x1={640} y1={119} x2={670} y2={119} className="viz-blue" />
        <text x={678} y={123} className="viz-label-sm">Validation error</text>

        {/* axis captions */}
        <text x={650} y={395} className="viz-label-sm" textAnchor="middle">gap narrows as training set size grows</text>
        <text x={460} y={430} className="viz-label" textAnchor="middle">Training set size</text>
        <text x={40} y={210} className="viz-label" textAnchor="middle" transform="rotate(-90 40 210)">Error</text>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);
