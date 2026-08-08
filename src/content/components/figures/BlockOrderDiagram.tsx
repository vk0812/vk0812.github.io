import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

/* ----------------------------------------------------------------------------
   BlockOrderDiagram — a side-by-side comparison of two ordered pipelines,
   each a vertical stack of named steps with an arrow between consecutive
   steps. Generic and data-driven (title, steps, an optional highlighted
   step, a closing note), so it's a figures/ component rather than something
   tied to one post. Plain Tailwind, fade-in only, no GSAP.
---------------------------------------------------------------------------- */

export interface BlockOrderPanel {
  title: string;
  steps: string[];
  highlightSteps?: number[];
  note: string;
}

const Step = ({ label, highlighted }: { label: string; highlighted: boolean }) => (
  <div
    className={`w-full rounded-lg border px-3 py-2 text-center font-sans text-xs sm:text-sm font-medium ${
      highlighted
        ? "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-blue-950/40 dark:text-blue-300"
        : "border-border bg-background text-foreground"
    }`}
  >
    {label}
  </div>
);

const Panel = ({ panel }: { panel: BlockOrderPanel }) => (
  <div className="rounded-2xl border border-border bg-muted/20 p-5 flex flex-col items-center gap-2">
    <p className="font-sans text-sm font-semibold text-foreground text-center mb-1">{panel.title}</p>
    {panel.steps.map((step, i) => (
      <div key={step} className="w-full flex flex-col items-center gap-2">
        <Step label={step} highlighted={!!panel.highlightSteps?.includes(i)} />
        {i !== panel.steps.length - 1 && (
          <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
        )}
      </div>
    ))}
    <p className="font-sans text-xs text-muted-foreground text-center leading-snug mt-2">{panel.note}</p>
  </div>
);

export const BlockOrderDiagram = ({
  panels,
  delay = 0,
}: {
  panels: [BlockOrderPanel, BlockOrderPanel];
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8 grid sm:grid-cols-2 gap-4"
  >
    <Panel panel={panels[0]} />
    <Panel panel={panels[1]} />
  </motion.div>
);
