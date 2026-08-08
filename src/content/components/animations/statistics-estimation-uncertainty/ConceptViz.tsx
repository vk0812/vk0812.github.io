import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   SamplingDistributionNarrowing — a fully static SVG (no GSAP timeline) that
   shows how the sampling distribution of an estimator concentrates around
   the true parameter as sample size grows. Three overlaid bell curves at
   n = 10, 50, 200, all centered on the same true parameter, each curve
   narrower and taller than the last. A staggered pathLength reveal on
   scroll is the only motion, matching the "static unless motion is the
   point" convention for this post.
---------------------------------------------------------------------------- */

const CURVES = [
  {
    label: "n = 10",
    note: "wide, unreliable",
    path: "M40 228 C160 224 240 195 300 190 C360 195 440 224 560 228",
    opacity: 0.55,
    width: 1.6,
  },
  {
    label: "n = 50",
    note: "tighter",
    path: "M150 229 C210 215 260 145 300 130 C340 145 390 215 450 229",
    opacity: 0.8,
    width: 2,
  },
  {
    label: "n = 200",
    note: "concentrated near the truth",
    path: "M250 229 C270 200 285 75 300 55 C315 75 330 200 350 229",
    opacity: 1,
    width: 2.4,
  },
];

export const SamplingDistributionNarrowing = ({
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
    className="not-prose my-8 viz"
  >
    <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
      <svg viewBox="0 0 600 260" role="img" aria-label="Sampling distributions for n = 10, 50, and 200, narrowing around the true parameter">
        <line x1="40" y1="232" x2="560" y2="232" className="viz-thin" />
        <line x1="300" y1="40" x2="300" y2="232" className="viz-thin" strokeDasharray="4 4" />
        <text x="300" y="26" textAnchor="middle" className="viz-label-sm">
          true parameter
        </text>
        {CURVES.map((curve, index) => (
          <motion.path
            key={curve.label}
            d={curve.path}
            className="viz-blue"
            style={{ strokeWidth: curve.width }}
            opacity={curve.opacity}
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, delay: index * 0.15, ease: "easeOut" }}
          />
        ))}
      </svg>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {CURVES.map((curve) => (
          <div key={curve.label} className="flex items-center gap-2">
            <span
              className="inline-block h-[3px] w-5 rounded-full"
              style={{ backgroundColor: "var(--v-blue)", opacity: curve.opacity }}
            />
            <span className="font-mono text-xs text-foreground/80">{curve.label}</span>
            <span className="font-serif text-xs text-muted-foreground">{curve.note}</span>
          </div>
        ))}
      </div>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);
