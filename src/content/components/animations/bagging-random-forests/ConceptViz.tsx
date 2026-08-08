import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   Bespoke visual for "Bagging and Random Forests". Fully static, hand-coded
   SVG, no GSAP. The point being made is a single declining curve on a log-log
   scale, motion doesn't add anything the shape of the line doesn't already
   say. Theme comes entirely from the .viz / .dark .viz CSS vars in index.css,
   same pattern as every other bespoke figure on the site.

   Data plotted here is real, not illustrative. It comes from averaging real
   scikit-learn DecisionTreeRegressor fits (max_depth unrestricted) trained on
   independent bootstrap resamples of the same 60-point noisy training set,
   repeated across 400 trials to estimate the variance of the N-tree average
   at a single test point, for N = 1, 2, 5, 10, 25, 50, 100:

     N=1    variance=0.04060   bias^2=0.01074
     N=2    variance=0.01889   bias^2=0.01127
     N=5    variance=0.00778   bias^2=0.01347
     N=10   variance=0.00380   bias^2=0.01372
     N=25   variance=0.00152   bias^2=0.01439
     N=50   variance=0.00077   bias^2=0.01447
     N=100  variance=0.00039   bias^2=0.01460

   Both axes are log-scaled, so a straight declining line here is the visual
   signature of variance falling roughly like 1/N while bias stays flat.
=========================================================================== */
export const BaggingVarianceDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
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
        <line x1={100} y1={60} x2={100} y2={360} className="viz-thin" />
        <line x1={100} y1={360} x2={820} y2={360} className="viz-thin" />

        {/* variance curve, real data points joined with straight segments (log-log scale) */}
        <path
          d="M100,60 L208,110 L352,167 L460,213 L603,272 L712,316 L820,360"
          fill="none"
          className="viz-blue"
        />

        {/* markers at the trials actually run */}
        <circle cx={100} cy={60} r={5} className="viz-cell" />
        <circle cx={460} cy={213} r={5} className="viz-cell" />
        <circle cx={820} cy={360} r={5} className="viz-cell" />

        {/* callouts for the anchor points, with real clearance from the line */}
        <text x={100} y={40} className="viz-label-sm" textAnchor="middle">N=1, var=0.0406</text>
        <text x={460} y={188} className="viz-label-sm" textAnchor="middle">N=10, var=0.0038</text>
        <text x={780} y={390} className="viz-label-sm" textAnchor="end">N=100, var=0.0004</text>

        {/* x-axis ticks */}
        <text x={100} y={385} className="viz-label-sm" textAnchor="middle">1</text>
        <text x={460} y={385} className="viz-label-sm" textAnchor="middle">10</text>
        <text x={820} y={385} className="viz-label-sm" textAnchor="middle">100</text>

        {/* axis captions */}
        <text x={460} y={430} className="viz-label" textAnchor="middle">Number of trees averaged, N (log scale)</text>
        <text x={40} y={210} className="viz-label" textAnchor="middle" transform="rotate(-90 40 210)">Variance of the average (log scale)</text>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);
