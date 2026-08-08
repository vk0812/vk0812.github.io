import { motion } from "framer-motion";

/**
 * Static, hand-coded SVG figures for the logistic regression / GLM post.
 * No GSAP timeline, no controls, entrance is a plain fade handled by the
 * motion.figure wrapper, matching the "fully static" pattern for a curve or
 * labeled plot that IconArchitectureDiagram can't express.
 */

const SIGMOID_PATH =
  "M 40.0 189.6 L 49.3 189.4 L 58.7 189.1 L 68.0 188.6 L 77.3 187.9 L 86.7 186.9 L 96.0 185.5 L 105.3 183.3 L 114.7 180.3 L 124.0 175.9 L 133.3 169.7 L 142.7 161.4 L 152.0 150.6 L 161.3 137.3 L 170.7 121.8 L 180.0 105.0 L 189.3 88.2 L 198.7 72.7 L 208.0 59.4 L 217.3 48.6 L 226.7 40.3 L 236.0 34.1 L 245.3 29.7 L 254.7 26.7 L 264.0 24.5 L 273.3 23.1 L 282.7 22.1 L 292.0 21.4 L 301.3 20.9 L 310.7 20.6 L 320.0 20.4";

export const SigmoidThresholdDiagram = ({
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
    className="not-prose my-8"
  >
    <div className="viz rounded-2xl border border-border bg-muted/20 p-4 sm:p-6">
      <svg viewBox="0 0 360 220" role="img" aria-label="Sigmoid curve with two decision thresholds marked">
        {/* axes */}
        <line x1="40" y1="20" x2="40" y2="190" className="viz-thin" />
        <line x1="40" y1="190" x2="320" y2="190" className="viz-thin" />
        <text x="18" y="24" className="viz-label-sm">1.0</text>
        <text x="18" y="194" className="viz-label-sm">0.0</text>
        <text x="170" y="212" className="viz-label-sm" textAnchor="middle">z (log-odds, w&#183;x + b)</text>

        {/* sigmoid curve */}
        <path d={SIGMOID_PATH} className="viz-blue" fill="none" />

        {/* default threshold at 0.5 */}
        <line x1="40" y1="105" x2="320" y2="105" className="viz-baseline" />
        <text x="238" y="122" className="viz-label-sm">0.5 default cutoff</text>

        {/* raised threshold at 0.8 for a cost-asymmetric case like fraud review */}
        <line x1="40" y1="54" x2="320" y2="54" className="viz-warn" strokeDasharray="6 4" />
        <text x="48" y="42" className="viz-warn-lbl">0.8 fraud-review cutoff</text>

        <circle cx="180" cy="105" r="3.5" className="viz-arrow-blue" />
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);

interface ReliabilityPoint {
  predicted: number;
  observed: number;
}

const RELIABILITY_POINTS: ReliabilityPoint[] = [
  { predicted: 0.1, observed: 0.09 },
  { predicted: 0.3, observed: 0.27 },
  { predicted: 0.5, observed: 0.53 },
  { predicted: 0.7, observed: 0.61 },
  { predicted: 0.9, observed: 0.72 },
];

const px = (v: number) => 40 + v * 160;
const py = (v: number) => 190 - v * 160;

export const ReliabilityDiagram = ({
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
    className="not-prose my-8"
  >
    <div className="viz rounded-2xl border border-border bg-muted/20 p-4 sm:p-6">
      <svg viewBox="0 0 240 220" role="img" aria-label="Reliability diagram comparing predicted probability to observed frequency">
        <line x1="40" y1="20" x2="40" y2="190" className="viz-thin" />
        <line x1="40" y1="190" x2="200" y2="190" className="viz-thin" />
        <text x="14" y="194" className="viz-label-sm">0</text>
        <text x="14" y="24" className="viz-label-sm">1</text>
        <text x="36" y="205" className="viz-label-sm">0</text>
        <text x="192" y="205" className="viz-label-sm">1</text>
        <text x="120" y="212" className="viz-label-sm" textAnchor="middle">predicted probability</text>
        <text x="10" y="108" className="viz-label-sm" transform="rotate(-90 10 108)" textAnchor="middle">observed frequency</text>

        {/* perfect calibration reference */}
        <line x1="40" y1="190" x2="200" y2="30" className="viz-baseline" />

        {/* observed curve */}
        <path
          d={`M ${RELIABILITY_POINTS.map((pt) => `${px(pt.predicted)} ${py(pt.observed)}`).join(" L ")}`}
          className="viz-warn"
          fill="none"
        />
        {RELIABILITY_POINTS.map((pt) => (
          <circle
            key={pt.predicted}
            cx={px(pt.predicted)}
            cy={py(pt.observed)}
            r="3.5"
            className="viz-arrow-warn"
          />
        ))}
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);
