import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   Bespoke visuals for "Model Interpretability and Explainability". Both
   figures here are fully static, hand-coded SVG, no GSAP. The numbers behind
   each one come straight from the worked example in the post (a random forest
   and a linear model fit on the same tiny synthetic house-price dataset), so
   the bar lengths are the real computed values, not illustrative stand-ins.
---------------------------------------------------------------------------- */

/* ===========================================================================
   1. PERMUTATION IMPORTANCE — how much test R^2 drops when one feature is
   shuffled and every other feature is left alone. Size dominates almost
   completely, distance has a small real effect, bedrooms and age barely
   move the needle.
=========================================================================== */
type ImportanceRow = { label: string; value: number };

const IMPORTANCE_ROWS: ImportanceRow[] = [
  { label: "size", value: 1.8634 },
  { label: "distance", value: 0.0365 },
  { label: "bedrooms", value: 0.0061 },
  { label: "age", value: 0.0025 },
];

const IMPORTANCE_MAX_WIDTH = 460;
const IMPORTANCE_MAX_VALUE = IMPORTANCE_ROWS[0].value;

export const FeatureImportanceBars = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="mx-auto mb-8 max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
      <svg viewBox="0 0 900 400" preserveAspectRatio="xMidYMid meet">
        <line x1={260} y1={55} x2={260} y2={365} className="viz-thin" />

        {IMPORTANCE_ROWS.map((row, i) => {
          const y = 75 + i * 80;
          const width = (row.value / IMPORTANCE_MAX_VALUE) * IMPORTANCE_MAX_WIDTH;
          return (
            <g key={row.label}>
              <text x={20} y={y + 20} className="viz-label">{row.label}</text>
              <rect x={260} y={y} width={Math.max(width, 0)} height={30} className="viz-bar-pos" />
              <text x={740} y={y + 20} className="viz-label-sm">{row.value.toFixed(4)}</text>
            </g>
          );
        })}

        <text x={490} y={390} className="viz-label-sm" textAnchor="middle">
          drop in test R2 when the feature's values are shuffled
        </text>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);

/* ===========================================================================
   2. ADDITIVE CONTRIBUTION CHART — a single prediction decomposed into a
   baseline (the average predicted price across training data) plus one
   signed contribution per feature. For a linear model with independent
   features this decomposition is exact, it's the same number a Shapley
   value would produce, not an approximation.
=========================================================================== */
type ContributionRow = { label: string; value: number };

const CONTRIBUTION_ROWS: ContributionRow[] = [
  { label: "size", value: -231.257 },
  { label: "bedrooms", value: -19.413 },
  { label: "age", value: 0.102 },
  { label: "distance", value: -0.688 },
];

const CONTRIB_CENTER_X = 450;
const CONTRIB_MAX_HALF_WIDTH = 350;
const CONTRIB_MAX_ABS = 231.257;

export const ShapContributionDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="mx-auto mb-8 max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
      <svg viewBox="0 0 900 420" preserveAspectRatio="xMidYMid meet">
        <text x={450} y={30} className="viz-label" textAnchor="middle">
          baseline (average predicted price) = $436.9k
        </text>

        <line x1={CONTRIB_CENTER_X} y1={55} x2={CONTRIB_CENTER_X} y2={365} className="viz-baseline" />

        {CONTRIBUTION_ROWS.map((row, i) => {
          const y = 75 + i * 80;
          const width = (Math.abs(row.value) / CONTRIB_MAX_ABS) * CONTRIB_MAX_HALF_WIDTH;
          const x = row.value >= 0 ? CONTRIB_CENTER_X : CONTRIB_CENTER_X - width;
          const cls = row.value >= 0 ? "viz-bar-pos" : "viz-bar-neg";
          const sign = row.value >= 0 ? "+" : "";
          return (
            <g key={row.label}>
              <text x={20} y={y + 20} className="viz-label">{row.label}</text>
              <rect x={x} y={y} width={Math.max(width, 0)} height={30} className={cls} />
              <text x={760} y={y + 20} className="viz-label-sm">{`${sign}${row.value.toFixed(2)}k`}</text>
            </g>
          );
        })}

        <text x={450} y={405} className="viz-label" textAnchor="middle">
          baseline + all four contributions = predicted price of $185.6k
        </text>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);
