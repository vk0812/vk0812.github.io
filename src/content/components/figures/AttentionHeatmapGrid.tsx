import { Fragment } from "react";
import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   AttentionHeatmapGrid — a generic row-labeled x column-labeled heatmap for
   any NxN weight matrix (attention weights, similarity scores, and so on).
   Config-driven off a values matrix, not tied to one post's narrative, so it
   lives in figures/ rather than a bespoke animations/<slug> file. Static
   (fade-in only), color intensity comes from discrete Tailwind bucket
   classes (light/dark pairs) rather than inline rgba, so it stays theme-safe.
---------------------------------------------------------------------------- */

export interface AttentionHeatmapSpec {
  rowLabels: string[];
  colLabels: string[];
  values: number[][]; // roughly 0..1, e.g. row-normalized attention weights
  decimals?: number;
}

function bucketClass(v: number): string {
  if (v >= 0.5) return "bg-blue-300 dark:bg-blue-800/60";
  if (v >= 0.3) return "bg-blue-200 dark:bg-blue-900/50";
  if (v >= 0.15) return "bg-blue-100 dark:bg-blue-900/30";
  if (v >= 0.05) return "bg-blue-50 dark:bg-blue-950/30";
  return "bg-muted/20";
}

export const AttentionHeatmapGrid = ({
  heatmap,
  caption,
  delay = 0,
}: {
  heatmap: AttentionHeatmapSpec;
  caption: string;
  delay?: number;
}) => {
  const { rowLabels, colLabels, values, decimals = 2 } = heatmap;

  return (
    <motion.figure
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay }}
      className="not-prose my-8"
    >
      <div className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-6 overflow-x-auto">
        <div
          className="grid gap-1.5 sm:gap-2 min-w-[420px]"
          style={{ gridTemplateColumns: `88px repeat(${colLabels.length}, 1fr)` }}
        >
          <div />
          {colLabels.map((c) => (
            <div
              key={c}
              className="flex items-end justify-center pb-1 font-sans text-[11px] sm:text-xs font-semibold text-muted-foreground text-center"
            >
              {c}
            </div>
          ))}
          {rowLabels.map((r, i) => (
            <Fragment key={r}>
              <div className="flex items-center font-sans text-[11px] sm:text-xs font-semibold text-muted-foreground">
                {r}
              </div>
              {values[i].map((v, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`flex items-center justify-center rounded-lg py-3 font-mono text-xs sm:text-sm font-semibold text-foreground ${bucketClass(v)}`}
                >
                  {v.toFixed(decimals)}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
      <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
        {caption}
      </figcaption>
    </motion.figure>
  );
};
