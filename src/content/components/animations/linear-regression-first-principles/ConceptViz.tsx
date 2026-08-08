import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   A fully static (no GSAP, no play controls) scatter-plot figure for
   "Linear Regression from First Principles". Five points, the fitted OLS
   line, and a residual segment dropped from each point to the line. Same
   shell as MessageAckChainDiagram in animations/designing-messenger, plain
   SVG JSX, theming via the .viz CSS classes so it holds up in both themes.
---------------------------------------------------------------------------- */

interface FitPoint {
  x: number;
  y: number;
  yHat: number;
}

// The five worked-example points and their fitted values, y_hat = 1.3 + 0.9x.
const POINTS: FitPoint[] = [
  { x: 1, y: 2, yHat: 2.2 },
  { x: 2, y: 3, yHat: 3.1 },
  { x: 3, y: 5, yHat: 4.0 },
  { x: 4, y: 4, yHat: 4.9 },
  { x: 5, y: 6, yHat: 5.8 },
];

// x in [0.5, 5.5] -> pixel [80, 560], y in [1, 7] -> pixel [380, 60] (inverted).
const px = (xv: number) => 80 + ((xv - 0.5) / 5) * 480;
const py = (yv: number) => 380 - ((yv - 1) / 6) * 320;

const LINE_X0 = 0.5;
const LINE_X1 = 5.5;
const LINE_Y0 = 1.3 + 0.9 * LINE_X0;
const LINE_Y1 = 1.3 + 0.9 * LINE_X1;

export const RegressionFitDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8 mx-auto max-w-2xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 sm:p-5 shadow-sm">
      <svg viewBox="0 0 640 460" className="w-full h-auto">
        {/* axes */}
        <line x1="80" y1="400" x2="600" y2="400" className="viz-stroke" />
        <line x1="80" y1="400" x2="80" y2="40" className="viz-stroke" />
        <text x="340" y="440" textAnchor="middle" className="viz-label-sm">x</text>
        <text x="34" y="220" textAnchor="middle" className="viz-label-sm">y</text>

        {/* residual segments, drawn first so points and the line sit on top */}
        {POINTS.map((p, i) => (
          <line
            key={`resid-${i}`}
            x1={px(p.x)}
            y1={py(p.y)}
            x2={px(p.x)}
            y2={py(p.yHat)}
            className="viz-warn"
            strokeDasharray="4 4"
          />
        ))}

        {/* fitted line, y_hat = 1.3 + 0.9x */}
        <line x1={px(LINE_X0)} y1={py(LINE_Y0)} x2={px(LINE_X1)} y2={py(LINE_Y1)} className="viz-blue" />
        <text x={px(4.6)} y={py(1.3 + 0.9 * 4.6) - 14} textAnchor="middle" className="viz-label-sm">
          y = 1.3 + 0.9x
        </text>

        {/* observed points */}
        {POINTS.map((p, i) => (
          <circle key={`pt-${i}`} cx={px(p.x)} cy={py(p.y)} r={6} className="viz-box" />
        ))}

        {/* x-axis ticks */}
        {[1, 2, 3, 4, 5].map((xv) => (
          <text key={`xt-${xv}`} x={px(xv)} y={418} textAnchor="middle" className="viz-label-sm">
            {xv}
          </text>
        ))}
        {/* y-axis ticks */}
        {[2, 3, 4, 5, 6].map((yv) => (
          <text key={`yt-${yv}`} x={64} y={py(yv) + 4} textAnchor="end" className="viz-label-sm">
            {yv}
          </text>
        ))}
      </svg>
    </div>
    {caption && (
      <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">
        {caption}
      </figcaption>
    )}
  </motion.figure>
);
