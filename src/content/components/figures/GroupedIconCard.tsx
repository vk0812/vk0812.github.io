import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

/* ----------------------------------------------------------------------------
   GroupedIconCard — a condensed "here's what's inside this box" card. A
   colored header names the whole, a grid of icon + label tiles names the
   parts. Static (fade-in only), for when a post needs to show a component's
   internal breakdown without a full architecture diagram.
---------------------------------------------------------------------------- */

export interface GroupedIconItem {
  icon: LucideIcon;
  label: string;
}

const HEADER_STYLES: Record<string, string> = {
  teal: "bg-teal-600 dark:bg-teal-700",
  blue: "bg-blue-600 dark:bg-blue-700",
  violet: "bg-violet-600 dark:bg-violet-700",
  slate: "bg-slate-600 dark:bg-slate-700",
};

export const GroupedIconCard = ({
  title,
  items,
  color = "teal",
  delay = 0,
}: {
  title: string;
  items: GroupedIconItem[];
  color?: keyof typeof HEADER_STYLES;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8 mx-auto max-w-md rounded-2xl border border-border overflow-hidden shadow-sm"
  >
    <div className={`${HEADER_STYLES[color]} px-5 py-3 text-center`}>
      <span className="font-sans text-base font-semibold text-white">{title}</span>
    </div>
    <div className="grid grid-cols-2 gap-3 p-4 bg-muted/20">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-3"
          >
            <Icon className="h-5 w-5 shrink-0 text-foreground/70" strokeWidth={1.75} />
            <span className="font-sans text-sm font-medium text-foreground">{item.label}</span>
          </div>
        );
      })}
    </div>
  </motion.div>
);
