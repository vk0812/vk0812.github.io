import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   Bespoke visuals for "Loss Functions and Objective Design". Both figures are
   fully static, hand-coded SVG, no GSAP, matching the pattern used for
   generalization-bias-variance's curve pair. The shape of the curves is the
   entire point, motion wouldn't add anything. Point coordinates were derived
   from the actual loss formulas (see the post's verification script), not
   eyeballed. Theme comes entirely from the .viz / .dark .viz CSS vars.
---------------------------------------------------------------------------- */

/* ===========================================================================
   1. CROSS-ENTROPY VS FOCAL LOSS, plotted against the probability the model
   assigned to the true class. Cross-entropy stays steep across the whole
   range, focal loss (gamma=2) collapses toward zero once the model is
   already confident, which is the "stop spending gradient on easy examples"
   behavior in one picture.
=========================================================================== */
export const CrossEntropyFocalCurveDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
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

        {/* cross-entropy, -log(p) */}
        <polyline
          points="127.0,79.2 145.0,116.4 163.1,142.9 181.1,163.6 199.1,180.5 217.1,194.9 235.2,207.3 253.2,218.3 271.2,228.1 289.2,237.0 307.3,245.1 325.3,252.6 343.3,259.5 361.3,265.9 379.4,272.0 397.4,277.6 415.4,283.0 433.4,288.0 451.5,292.8 469.5,297.4 487.5,301.7 505.5,305.9 523.6,309.9 541.6,313.7 559.6,317.4 577.6,320.9 595.7,324.3 613.7,327.6 631.7,330.8 649.7,333.8 667.8,336.8 685.8,339.7 703.8,342.5 721.8,345.2 739.9,347.8 757.9,350.4 775.9,352.9 793.9,355.3 812.0,357.7 830.0,360.0"
          className="viz-warn"
        />
        {/* focal loss, gamma=2, -(1-p)^2 log(p) */}
        <polyline
          points="127.0,106.5 145.0,151.2 163.1,183.7 181.1,209.0 199.1,229.5 217.1,246.7 235.2,261.3 253.2,273.9 271.2,284.8 289.2,294.3 307.3,302.7 325.3,310.0 343.3,316.5 361.3,322.3 379.4,327.4 397.4,331.8 415.4,335.8 433.4,339.3 451.5,342.4 469.5,345.1 487.5,347.5 505.5,349.6 523.6,351.4 541.6,353.0 559.6,354.3 577.6,355.5 595.7,356.4 613.7,357.2 631.7,357.9 649.7,358.4 667.8,358.9 685.8,359.2 703.8,359.5 721.8,359.7 739.9,359.8 757.9,359.9 775.9,360.0 793.9,360.0 812.0,360.0 830.0,360.0"
          className="viz-blue"
        />

        {/* legend */}
        <line x1={620} y1={90} x2={650} y2={90} className="viz-warn" />
        <text x={658} y={94} className="viz-label-sm">Cross-entropy</text>
        <line x1={620} y1={114} x2={650} y2={114} className="viz-blue" />
        <text x={658} y={118} className="viz-label-sm">Focal loss (gamma=2)</text>

        {/* axis captions */}
        <text x={100} y={395} className="viz-label-sm">p = 0.05 (very wrong)</text>
        <text x={820} y={395} className="viz-label-sm" textAnchor="end">p = 1.0 (certain, correct)</text>
        <text x={460} y={430} className="viz-label" textAnchor="middle">Predicted probability of the true class</text>
        <text x={40} y={210} className="viz-label" textAnchor="middle" transform="rotate(-90 40 210)">Loss</text>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);

/* ===========================================================================
   2. MSE VS MAE VS HUBER, plotted against the residual (prediction minus
   actual). MSE curves upward quadratically and runs off the top of the chart
   for a large residual, exactly the behavior that lets one outlier dominate
   a mean squared error. MAE grows linearly and stays flat-sloped everywhere.
   Huber (delta=2) matches MSE near zero and switches to linear growth past
   the delta threshold, the hybrid the post argues for.
=========================================================================== */
export const RobustLossCurveDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
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
        <line x1={460} y1={60} x2={460} y2={360} className="viz-thin" />

        {/* MSE, e^2, clips off the top of the chart past |e| ~ 4.2 */}
        <polyline
          points="90.0,60.0 105.4,60.0 120.8,60.0 136.2,60.0 151.7,60.0 167.1,60.0 182.5,60.0 197.9,60.0 213.3,93.3 228.8,125.6 244.2,155.8 259.6,184.0 275.0,210.0 290.4,234.0 305.8,255.8 321.2,275.6 336.7,293.3 352.1,309.0 367.5,322.5 382.9,334.0 398.3,343.3 413.8,350.6 429.2,355.8 444.6,359.0 460.0,360.0 475.4,359.0 490.8,355.8 506.2,350.6 521.7,343.3 537.1,334.0 552.5,322.5 567.9,309.0 583.3,293.3 598.8,275.6 614.2,255.8 629.6,234.0 645.0,210.0 660.4,184.0 675.8,155.8 691.2,125.6 706.7,93.3 722.1,60.0 737.5,60.0 752.9,60.0 768.3,60.0 783.8,60.0 799.2,60.0 814.6,60.0 830.0,60.0"
          className="viz-warn"
        />
        {/* MAE, |e| */}
        <polyline
          points="90.0,260.0 105.4,264.2 120.8,268.3 136.2,272.5 151.7,276.7 167.1,280.8 182.5,285.0 197.9,289.2 213.3,293.3 228.8,297.5 244.2,301.7 259.6,305.8 275.0,310.0 290.4,314.2 305.8,318.3 321.2,322.5 336.7,326.7 352.1,330.8 367.5,335.0 382.9,339.2 398.3,343.3 413.8,347.5 429.2,351.7 444.6,355.8 460.0,360.0 475.4,355.8 490.8,351.7 506.2,347.5 521.7,343.3 537.1,339.2 552.5,335.0 567.9,330.8 583.3,326.7 598.8,322.5 614.2,318.3 629.6,314.2 645.0,310.0 660.4,305.8 675.8,301.7 691.2,297.5 706.7,293.3 722.1,289.2 737.5,285.0 752.9,280.8 768.3,276.7 783.8,272.5 799.2,268.3 814.6,264.2 830.0,260.0"
          className="viz-stroke"
        />
        {/* Huber, delta=2 */}
        <polyline
          points="90.0,193.3 105.4,201.7 120.8,210.0 136.2,218.3 151.7,226.7 167.1,235.0 182.5,243.3 197.9,251.7 213.3,260.0 228.8,268.3 244.2,276.7 259.6,285.0 275.0,293.3 290.4,301.7 305.8,310.0 321.2,318.3 336.7,326.7 352.1,334.5 367.5,341.2 382.9,347.0 398.3,351.7 413.8,355.3 429.2,357.9 444.6,359.5 460.0,360.0 475.4,359.5 490.8,357.9 506.2,355.3 521.7,351.7 537.1,347.0 552.5,341.2 567.9,334.5 583.3,326.7 598.8,318.3 614.2,310.0 629.6,301.7 645.0,293.3 660.4,285.0 675.8,276.7 691.2,268.3 706.7,260.0 722.1,251.7 737.5,243.3 752.9,235.0 768.3,226.7 783.8,218.3 799.2,210.0 814.6,201.7 830.0,193.3"
          className="viz-blue"
        />

        {/* legend */}
        <line x1={600} y1={90} x2={630} y2={90} className="viz-warn" />
        <text x={638} y={94} className="viz-label-sm">MSE (quadratic)</text>
        <line x1={600} y1={114} x2={630} y2={114} className="viz-stroke" />
        <text x={638} y={118} className="viz-label-sm">MAE (linear)</text>
        <line x1={600} y1={138} x2={630} y2={138} className="viz-blue" />
        <text x={638} y={142} className="viz-label-sm">Huber (delta=2)</text>

        {/* axis captions */}
        <text x={100} y={395} className="viz-label-sm">large negative residual</text>
        <text x={460} y={395} className="viz-label-sm" textAnchor="middle">residual = 0</text>
        <text x={820} y={395} className="viz-label-sm" textAnchor="end">large positive residual</text>
        <text x={460} y={430} className="viz-label" textAnchor="middle">Residual (prediction minus actual)</text>
        <text x={40} y={210} className="viz-label" textAnchor="middle" transform="rotate(-90 40 210)">Loss</text>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);
