import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   NormAxisDiagram — static side-by-side comparison of the exact axis batch
   norm and layer norm each reduce over, using the same 4x3 toy matrix worked
   out in the post's numpy example. Plain Tailwind grid cells, no SVG, no
   GSAP, matches the worked numbers exactly.
---------------------------------------------------------------------------- */

const MATRIX = [
  [1, 2, 3],
  [2, 4, 6],
  [3, 6, 9],
  [4, 8, 12],
];

const Cell = ({
  value,
  highlighted,
}: {
  value: number;
  highlighted: boolean;
}) => (
  <div
    className={`flex items-center justify-center rounded-md border px-2 py-1.5 font-mono text-xs sm:text-sm ${
      highlighted
        ? "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-blue-950/40 dark:text-blue-300"
        : "border-border bg-background text-foreground"
    }`}
  >
    {value}
  </div>
);

const Grid = ({ axis }: { axis: "batch" | "feature" }) => (
  <div className="grid grid-cols-3 gap-1.5">
    {MATRIX.map((row, r) =>
      row.map((value, c) => (
        <Cell
          key={`${r}-${c}`}
          value={value}
          highlighted={axis === "batch" ? c === 0 : r === 0}
        />
      ))
    )}
  </div>
);

const Panel = ({
  title,
  axis,
  note,
}: {
  title: string;
  axis: "batch" | "feature";
  note: string;
}) => (
  <div className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5 flex flex-col gap-3">
    <p className="font-sans text-sm font-semibold text-foreground text-center">{title}</p>
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center justify-center text-[10px] font-sans text-muted-foreground w-6 shrink-0 leading-tight text-center">
        <span>N</span>
        <span className="mt-1">rows</span>
      </div>
      <Grid axis={axis} />
    </div>
    <p className="text-center text-[11px] font-sans text-muted-foreground">C columns (features)</p>
    <p className="font-sans text-xs text-muted-foreground text-center leading-snug">{note}</p>
  </div>
);

export const NormAxisDiagram = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8 grid sm:grid-cols-2 gap-4"
  >
    <Panel
      title="Batch norm, mean and variance over the column"
      axis="batch"
      note="One mean and variance per feature, computed down all 4 examples in the batch."
    />
    <Panel
      title="Layer norm, mean and variance over the row"
      axis="feature"
      note="One mean and variance per example, computed across that example's 3 features only."
    />
  </motion.div>
);
