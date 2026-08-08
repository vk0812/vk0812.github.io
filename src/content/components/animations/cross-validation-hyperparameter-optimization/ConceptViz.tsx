import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   KFoldSplitDiagram — a static grid of ten toy samples split into five
   folds, showing exactly which two indices are held out as validation in
   each row (scikit-learn's KFold(n_splits=5, shuffle=False) on np.arange(10)).
   Plain Tailwind boxes, not hand-coded SVG, so spacing can't get cramped.
---------------------------------------------------------------------------- */

export interface KFoldRow {
  fold: number;
  valIndices: number[];
}

const Cell = ({ isVal }: { isVal: boolean }) => (
  <div
    className={`flex-1 aspect-square rounded-md border flex items-center justify-center font-mono text-[10px] sm:text-xs ${
      isVal
        ? "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-blue-950/40 dark:text-blue-300"
        : "border-border bg-background text-muted-foreground"
    }`}
  />
);

export const KFoldSplitDiagram = ({
  rows,
  sampleCount,
  delay = 0,
  caption,
}: {
  rows: KFoldRow[];
  sampleCount: number;
  delay?: number;
  caption?: string;
}) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8"
  >
    <div className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5 flex flex-col gap-2.5">
      {rows.map((row) => (
        <div key={row.fold} className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] sm:text-xs text-muted-foreground w-14 shrink-0">
            fold {row.fold}
          </span>
          <div className="flex flex-1 gap-1 sm:gap-1.5">
            {Array.from({ length: sampleCount }, (_, i) => (
              <Cell key={i} isVal={row.valIndices.includes(i)} />
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4 pt-1.5 mt-1 border-t border-border">
        <span className="flex items-center gap-1.5 font-sans text-[11px] text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-sm border border-blue-400 bg-blue-50 dark:border-blue-500/60 dark:bg-blue-950/40" />
          validation
        </span>
        <span className="flex items-center gap-1.5 font-sans text-[11px] text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-sm border border-border bg-background" />
          training
        </span>
      </div>
    </div>
    {caption && (
      <figcaption className="mt-2 text-center font-sans text-xs text-muted-foreground">{caption}</figcaption>
    )}
  </motion.figure>
);

/* ----------------------------------------------------------------------------
   SuccessiveHalvingDiagram — a funnel of candidate configurations getting
   pruned round by round while the training budget given to survivors grows.
   Plain Tailwind boxes shrinking in count and growing in budget label per
   row, static (fade-in only), no hand-coded SVG coordinates to keep clean.
---------------------------------------------------------------------------- */

export interface HalvingRound {
  label: string;
  budget: string;
  survivors: number;
  eliminated: number;
}

export const SuccessiveHalvingDiagram = ({
  rounds,
  delay = 0,
  caption,
}: {
  rounds: HalvingRound[];
  delay?: number;
  caption?: string;
}) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8"
  >
    <div className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5 flex flex-col gap-3">
      {rounds.map((round, ri) => (
        <div key={round.label} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between font-sans text-[11px] sm:text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{round.label}</span>
            <span>budget per candidate, {round.budget}</span>
          </div>
          <div className="flex gap-1.5 sm:gap-2 justify-center">
            {Array.from({ length: round.survivors }, (_, i) => (
              <div
                key={`s-${i}`}
                className="h-8 sm:h-9 flex-1 max-w-[3.5rem] rounded-md border border-blue-400 bg-blue-50 dark:border-blue-500/60 dark:bg-blue-950/40"
              />
            ))}
            {Array.from({ length: round.eliminated }, (_, i) => (
              <div
                key={`e-${i}`}
                className="h-8 sm:h-9 flex-1 max-w-[3.5rem] rounded-md border border-dashed border-border bg-background opacity-40"
              />
            ))}
          </div>
          {ri < rounds.length - 1 && (
            <p className="text-center font-sans text-[10px] sm:text-[11px] text-muted-foreground">
              {round.eliminated} dropped, {round.survivors} advance with a bigger budget
            </p>
          )}
        </div>
      ))}
      <div className="flex items-center gap-4 pt-1.5 mt-1 border-t border-border">
        <span className="flex items-center gap-1.5 font-sans text-[11px] text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-sm border border-blue-400 bg-blue-50 dark:border-blue-500/60 dark:bg-blue-950/40" />
          advances
        </span>
        <span className="flex items-center gap-1.5 font-sans text-[11px] text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-border bg-background opacity-40" />
          eliminated
        </span>
      </div>
    </div>
    {caption && (
      <figcaption className="mt-2 text-center font-sans text-xs text-muted-foreground">{caption}</figcaption>
    )}
  </motion.figure>
);
