import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   PredictionsTable — a static reference table for a small set of actual vs.
   predicted values, with a per-row extra column (absolute error, absolute
   percentage error, whatever the surrounding worked example needs) and a
   footer row of summary statistics. Same config-driven, no-gsap shape as
   RankedListDiagram, just generic enough to cover any regression-style
   worked example instead of one tied to DCG specifically.
---------------------------------------------------------------------------- */

export interface PredictionRow {
  label: string;
  actual: number;
  predicted: number;
  extra: string;
  note?: string;
}

export interface PredictionStat {
  label: string;
  value: string;
}

export const PredictionsTable = ({
  rows,
  extraHeader,
  stats,
  caption,
  delay = 0,
}: {
  rows: PredictionRow[];
  extraHeader: string;
  stats: PredictionStat[];
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
    <div className="rounded-2xl border border-border bg-muted/20 overflow-hidden">
      <div className="grid grid-cols-4 gap-2 px-4 sm:px-6 py-2.5 border-b border-border/50 bg-muted/30">
        <span className="font-sans text-xs font-semibold text-muted-foreground">Point</span>
        <span className="font-sans text-xs font-semibold text-muted-foreground">Actual</span>
        <span className="font-sans text-xs font-semibold text-muted-foreground">Predicted</span>
        <span className="font-sans text-xs font-semibold text-muted-foreground">{extraHeader}</span>
      </div>
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`grid grid-cols-4 gap-2 px-4 sm:px-6 py-2.5 ${
            i !== rows.length - 1 ? "border-b border-border/30" : ""
          }`}
        >
          <span className="font-sans text-sm text-foreground">{row.label}</span>
          <span className="font-mono text-sm text-foreground">{row.actual}</span>
          <span className="font-mono text-sm text-foreground">{row.predicted}</span>
          <span className={`font-mono text-sm ${row.note ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-foreground"}`}>
            {row.extra}
            {row.note && <span className="block font-sans text-[11px] font-normal text-muted-foreground">{row.note}</span>}
          </span>
        </div>
      ))}
      <div className="flex flex-wrap gap-x-6 gap-y-1.5 px-4 sm:px-6 py-3 bg-muted/30">
        {stats.map((stat) => (
          <span key={stat.label} className="font-mono text-sm font-semibold text-foreground">
            {stat.label} = {stat.value}
          </span>
        ))}
      </div>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);
