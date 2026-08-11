import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   Bespoke visual for "Multi-Armed Bandits".
   StrategyComparisonPanels lays epsilon-greedy, upper confidence bound, and
   Thompson sampling side by side. Three small panels, plain Tailwind divs,
   fade-in only, no GSAP and no hand-coded SVG coordinates, following the
   same shape as figures/ReplicationDiagram and figures/BlockOrderDiagram
   but with three columns instead of two (those components are typed to a
   fixed 2-panel tuple, so this post gets its own small variant here rather
   than editing a shared figure).
---------------------------------------------------------------------------- */

export interface StrategyPanel {
  title: string;
  rule: string;
  note: string;
}

const RuleBox = ({ label }: { label: string }) => (
  <div className="w-full rounded-lg border border-blue-400 bg-blue-50 px-3 py-2.5 text-center font-sans text-xs sm:text-sm font-medium text-blue-700 dark:border-blue-500/60 dark:bg-blue-950/40 dark:text-blue-300">
    {label}
  </div>
);

const Panel = ({ panel }: { panel: StrategyPanel }) => (
  <div className="rounded-2xl border border-border bg-muted/20 p-5 flex flex-col items-center gap-3">
    <p className="font-sans text-sm font-semibold text-foreground text-center">{panel.title}</p>
    <RuleBox label={panel.rule} />
    <p className="font-sans text-xs text-muted-foreground text-center leading-snug mt-1">{panel.note}</p>
  </div>
);

export const StrategyComparisonPanels = ({
  panels,
  delay = 0,
}: {
  panels: [StrategyPanel, StrategyPanel, StrategyPanel];
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8 grid sm:grid-cols-3 gap-4"
  >
    <Panel panel={panels[0]} />
    <Panel panel={panels[1]} />
    <Panel panel={panels[2]} />
  </motion.div>
);
