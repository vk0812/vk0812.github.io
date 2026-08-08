import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   Bespoke visuals for "Support Vector Machines and Kernel Methods".
   Both figures are fully static, hand-coded SVG, no GSAP. Motion isn't the
   point here, the shape of the boundary and the margin is, so each is a plain
   scene wrapped in a fade-in, matching the "static diagram in
   animations/<slug>" pattern used for optimization-fundamentals and
   generalization-bias-variance. Theme comes entirely from CSS vars
   (.viz / .dark .viz in index.css), so the same SVG reads correctly in light
   and dark mode.
---------------------------------------------------------------------------- */

/* ===========================================================================
   1. MAXIMUM-MARGIN BOUNDARY — the six-point toy dataset from the post's
   worked example (verified with scikit-learn's SVC(kernel="linear")).
   w = [0.6, 0.2], b = -3.6, margin width = sqrt(10) ≈ 3.1623, support
   vectors are the two points sitting exactly on the margin lines. Every
   coordinate below is a fixed linear map from that data space into pixel
   space, computed once and hardcoded, not eyeballed.
=========================================================================== */
export const MaxMarginDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="mx-auto mb-8 max-w-2xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
      <svg viewBox="0 0 560 480" preserveAspectRatio="xMidYMid meet">
        <text x={280} y={40} className="viz-phase" textAnchor="middle">MAXIMUM-MARGIN BOUNDARY</text>

        <rect x={15} y={15} width={530} height={445} rx={12} className="viz-panel" />

        {/* margin band lines (dashed), parallel to the boundary, offset by
            margin/2 along the normal, passing exactly through the two
            support vectors */}
        <line x1={255} y1={390} x2={150} y2={90} className="viz-blue" strokeDasharray="6 5" />
        <line x1={430} y1={390} x2={325} y2={90} className="viz-blue" strokeDasharray="6 5" />

        {/* decision boundary, solid */}
        <line x1={342.5} y1={390} x2={237.5} y2={90} className="viz-stroke" />

        {/* class -1 points, hollow/panel-fill circles */}
        <circle cx={158.8} cy={315} r={7} className="viz-panel" />
        <circle cx={211.2} cy={315} r={7} className="viz-panel" />
        <circle cx={211.2} cy={265} r={7} className="viz-panel" />

        {/* class +1 points, filled blue circles */}
        <circle cx={368.8} cy={215} r={7} className="viz-cell" />
        <circle cx={421.2} cy={165} r={7} className="viz-cell" />
        <circle cx={421.2} cy={265} r={7} className="viz-cell" />

        {/* support vector rings, around (3,4) and (6,5) */}
        <circle cx={211.2} cy={265} r={13} className="viz-blue" />
        <circle cx={368.8} cy={215} r={13} className="viz-blue" />

        {/* legend row, well clear of the plot area above it */}
        <circle cx={48} cy={424} r={9} fill="none" className="viz-blue" />
        <text x={64} y={428} className="viz-label-sm">support vector (on the margin)</text>

        <circle cx={244} cy={424} r={6} className="viz-panel" />
        <text x={258} y={428} className="viz-label-sm">class -1</text>

        <circle cx={408} cy={424} r={6} className="viz-cell" />
        <text x={422} y={428} className="viz-label-sm">class +1</text>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);

/* ===========================================================================
   2. LINEAR VS RBF KERNEL BOUNDARY — a toy dataset where one class forms a
   tight inner cluster and the other class forms a ring around it. No single
   straight line can separate a ring from what it surrounds, a straight
   attempt is shown misclassifying several ring points. A closed curve (what
   an RBF kernel effectively produces) separates both classes perfectly.
   Panel geometry deliberately matches ConvexNonConvexDiagram's layout
   (two 380x340 panels) for visual consistency with the rest of the site.
=========================================================================== */
export const KernelBoundaryDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="mx-auto mb-8 max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
      <svg viewBox="0 0 900 440" preserveAspectRatio="xMidYMid meet">
        <text x={220} y={36} className="viz-phase" textAnchor="middle">LINEAR KERNEL</text>
        <text x={680} y={36} className="viz-phase" textAnchor="middle">RBF KERNEL</text>

        <rect x={30} y={60} width={380} height={340} rx={12} className="viz-panel" />
        <rect x={490} y={60} width={380} height={340} rx={12} className="viz-panel" />

        {/* ---------------- LEFT: straight line attempt ---------------- */}
        <g>
          <line x1={30} y1={340} x2={410} y2={260} className="viz-stroke" />

          {/* inner cluster, class A */}
          <circle cx={220} cy={230} r={6} className="viz-cell" />
          <circle cx={242} cy={240} r={6} className="viz-cell" />
          <circle cx={200} cy={244} r={6} className="viz-cell" />
          <circle cx={228} cy={206} r={6} className="viz-cell" />
          <circle cx={196} cy={222} r={6} className="viz-cell" />
          <circle cx={234} cy={254} r={6} className="viz-cell" />

          {/* outer ring, class B, correctly separated (opposite side of the
              line from the inner cluster) */}
          <circle cx={279.7} cy={320.0} r={6} className="viz-panel" />
          <circle cx={198.5} cy={335.8} r={6} className="viz-panel" />

          {/* outer ring, class B, misclassified (ends up on the same side
              as the inner cluster), marked with a warn ring */}
          <circle cx={325.8} cy={251.5} r={6} className="viz-panel" />
          <circle cx={325.8} cy={251.5} r={11} fill="none" className="viz-warn" />
          <circle cx={130.0} cy={289.7} r={6} className="viz-panel" />
          <circle cx={130.0} cy={289.7} r={11} fill="none" className="viz-warn" />
          <circle cx={114.2} cy={208.5} r={6} className="viz-panel" />
          <circle cx={114.2} cy={208.5} r={11} fill="none" className="viz-warn" />
          <circle cx={160.3} cy={140.0} r={6} className="viz-panel" />
          <circle cx={160.3} cy={140.0} r={11} fill="none" className="viz-warn" />
          <circle cx={241.5} cy={124.2} r={6} className="viz-panel" />
          <circle cx={241.5} cy={124.2} r={11} fill="none" className="viz-warn" />
          <circle cx={310.0} cy={170.3} r={6} className="viz-panel" />
          <circle cx={310.0} cy={170.3} r={11} fill="none" className="viz-warn" />

          <text x={220} y={385} className="viz-label-sm" textAnchor="middle">
            A ring can't be cut from what it surrounds with one straight line.
          </text>
        </g>

        {/* ---------------- RIGHT: closed curve, perfect separation ---------------- */}
        <g>
          <circle cx={680} cy={230} r={75} fill="none" className="viz-stroke" />

          {/* inner cluster, class A, same relative layout */}
          <circle cx={680} cy={230} r={6} className="viz-cell" />
          <circle cx={702} cy={240} r={6} className="viz-cell" />
          <circle cx={660} cy={244} r={6} className="viz-cell" />
          <circle cx={688} cy={206} r={6} className="viz-cell" />
          <circle cx={656} cy={222} r={6} className="viz-cell" />
          <circle cx={694} cy={254} r={6} className="viz-cell" />

          {/* outer ring, class B, all correctly separated */}
          <circle cx={785.8} cy={251.5} r={6} className="viz-panel" />
          <circle cx={739.7} cy={320.0} r={6} className="viz-panel" />
          <circle cx={658.5} cy={335.8} r={6} className="viz-panel" />
          <circle cx={590.0} cy={289.7} r={6} className="viz-panel" />
          <circle cx={574.2} cy={208.5} r={6} className="viz-panel" />
          <circle cx={620.3} cy={140.0} r={6} className="viz-panel" />
          <circle cx={701.5} cy={124.2} r={6} className="viz-panel" />
          <circle cx={770.0} cy={170.3} r={6} className="viz-panel" />

          <text x={680} y={385} className="viz-label-sm" textAnchor="middle">
            A closed curve, the kernel trick's real effect, separates both classes cleanly.
          </text>
        </g>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);
