import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

/* ----------------------------------------------------------------------------
   ReplicationDiagram — a side-by-side comparison of two replication
   strategies (e.g. leader-follower vs quorum). Built with plain flex boxes,
   not hand-coded SVG, specifically so spacing can't get cramped the way a
   custom-coordinate SVG timeline can. Static (fade-in only).
---------------------------------------------------------------------------- */

export interface ReplicationPanel {
  title: string;
  writeLabel: string;
  fanLabel: string;
  nodes: string[];
  highlightNodes?: number[];
  note: string;
}

const Box = ({ label, highlighted = false }: { label: string; highlighted?: boolean }) => (
  <div
    className={`flex-1 rounded-lg border px-3 py-2.5 text-center font-sans text-xs sm:text-sm font-medium ${
      highlighted
        ? "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-blue-950/40 dark:text-blue-300"
        : "border-border bg-background text-foreground"
    }`}
  >
    {label}
  </div>
);

const Panel = ({ panel }: { panel: ReplicationPanel }) => (
  <div className="rounded-2xl border border-border bg-muted/20 p-5 flex flex-col items-center gap-3">
    <p className="font-sans text-sm font-semibold text-foreground text-center">{panel.title}</p>

    <Box label={panel.writeLabel} />

    <div className="flex flex-col items-center gap-1 text-muted-foreground">
      <ArrowDown className="h-4 w-4" strokeWidth={2} />
      <span className="font-sans text-[11px] tracking-wide">{panel.fanLabel}</span>
      <ArrowDown className="h-4 w-4" strokeWidth={2} />
    </div>

    <div className="flex w-full gap-2">
      {panel.nodes.map((n, i) => (
        <Box key={n} label={n} highlighted={panel.highlightNodes?.includes(i)} />
      ))}
    </div>

    <p className="font-sans text-xs text-muted-foreground text-center leading-snug mt-1">{panel.note}</p>
  </div>
);

export const ReplicationDiagram = ({
  panels,
  delay = 0,
}: {
  panels: [ReplicationPanel, ReplicationPanel];
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
