import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   ConfusionMatrixGrid — a static 2x2 confusion matrix (predicted columns,
   actual rows) plus a derived-metrics strip underneath. Config-driven off a
   single {tp, fp, fn, tn} spec so any binary worked example can reuse it
   instead of hand-building a table per post. No gsap, same "fade up once in
   view" entrance as the rest of the site's figures.
---------------------------------------------------------------------------- */

export interface ConfusionMatrixSpec {
  positiveLabel: string;
  negativeLabel: string;
  tp: number;
  fp: number;
  fn: number;
  tn: number;
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

export const ConfusionMatrixGrid = ({
  matrix,
  caption,
  delay = 0,
}: {
  matrix: ConfusionMatrixSpec;
  caption: string;
  delay?: number;
}) => {
  const { positiveLabel, negativeLabel, tp, fp, fn, tn } = matrix;
  const total = tp + fp + fn + tn;
  const accuracy = (tp + tn) / total;
  const precision = tp / (tp + fp);
  const recall = tp / (tp + fn);
  const specificity = tn / (tn + fp);
  const f1 = (2 * precision * recall) / (precision + recall);

  const cellBase =
    "flex flex-col items-center justify-center gap-1 rounded-xl py-4 sm:py-5";
  const correctCell =
    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300";
  const errorCell = "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300";

  return (
    <motion.figure
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay }}
      className="not-prose my-8"
    >
      <div className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-6">
        <div className="grid grid-cols-[80px_1fr_1fr] sm:grid-cols-[110px_1fr_1fr] gap-2 sm:gap-3">
          <div />
          <div className="flex items-end justify-center pb-1 font-sans text-xs sm:text-sm font-semibold text-muted-foreground text-center">
            Predicted {positiveLabel}
          </div>
          <div className="flex items-end justify-center pb-1 font-sans text-xs sm:text-sm font-semibold text-muted-foreground text-center">
            Predicted {negativeLabel}
          </div>

          <div className="flex items-center justify-center font-sans text-xs sm:text-sm font-semibold text-muted-foreground text-center">
            Actual {positiveLabel}
          </div>
          <div className={`${cellBase} ${correctCell}`}>
            <span className="font-mono text-xl sm:text-2xl font-bold">{tp}</span>
            <span className="font-sans text-[11px] sm:text-xs">True Positive</span>
          </div>
          <div className={`${cellBase} ${errorCell}`}>
            <span className="font-mono text-xl sm:text-2xl font-bold">{fn}</span>
            <span className="font-sans text-[11px] sm:text-xs">False Negative</span>
          </div>

          <div className="flex items-center justify-center font-sans text-xs sm:text-sm font-semibold text-muted-foreground text-center">
            Actual {negativeLabel}
          </div>
          <div className={`${cellBase} ${errorCell}`}>
            <span className="font-mono text-xl sm:text-2xl font-bold">{fp}</span>
            <span className="font-sans text-[11px] sm:text-xs">False Positive</span>
          </div>
          <div className={`${cellBase} ${correctCell}`}>
            <span className="font-mono text-xl sm:text-2xl font-bold">{tn}</span>
            <span className="font-sans text-[11px] sm:text-xs">True Negative</span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/50 pt-4 justify-center">
          <span className="font-mono text-sm font-semibold text-foreground">Accuracy = {pct(accuracy)}</span>
          <span className="font-mono text-sm font-semibold text-foreground">Precision = {pct(precision)}</span>
          <span className="font-mono text-sm font-semibold text-foreground">Recall = {pct(recall)}</span>
          <span className="font-mono text-sm font-semibold text-foreground">Specificity = {pct(specificity)}</span>
          <span className="font-mono text-sm font-semibold text-foreground">F1 = {pct(f1)}</span>
        </div>
      </div>
      <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
        {caption}
      </figcaption>
    </motion.figure>
  );
};
