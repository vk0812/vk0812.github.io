import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

/* ----------------------------------------------------------------------------
   Bespoke visuals for "Transformer Language Models in Detail". Both pieces
   are fully static, no GSAP, since the mechanisms they show (a fixed rotation
   angle per position, a fixed head-grouping arrangement) are structural
   facts rather than a process that plays out over time. Theming for
   HeadSharingDiagram uses plain Tailwind (border-border, bg-muted/20, the
   blue-400/500 highlight pair already used by ReplicationDiagram and
   BlockOrderDiagram). RotaryRotationDiagram is a hand-coded static SVG, so it
   follows the site's static-SVG pattern instead, plain <line>/<circle>/<text>
   with Tailwind foreground/blue classes and a motion.figure fade-in wrapper,
   no .viz CSS-var classes and no play controls.
---------------------------------------------------------------------------- */

/* ===========================================================================
   HEAD SHARING — side-by-side comparison of how many query heads share one
   key-value head, across plain multi-head attention, grouped-query attention,
   and multi-query attention. Pure flexbox, no manual coordinates, so there is
   no collision risk the way a hand-coded SVG would have.
=========================================================================== */
export interface HeadSharingGroup {
  queryLabels: string[];
  kvLabel: string;
}

export interface HeadSharingPanel {
  title: string;
  groups: HeadSharingGroup[];
  note: string;
}

const HeadChip = ({ label, tone }: { label: string; tone: "query" | "kv" }) => (
  <div
    className={`rounded-md border px-2 py-1 text-center font-mono text-[10px] sm:text-[11px] font-medium ${
      tone === "kv"
        ? "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-blue-950/40 dark:text-blue-300"
        : "border-border bg-background text-foreground"
    }`}
  >
    {label}
  </div>
);

const GroupBox = ({ group }: { group: HeadSharingGroup }) => (
  <div className="rounded-lg border border-dashed border-muted-foreground/40 p-2 flex flex-col items-center gap-1.5">
    <div className="flex flex-wrap justify-center gap-1">
      {group.queryLabels.map((q) => (
        <HeadChip key={q} label={q} tone="query" />
      ))}
    </div>
    <ArrowDown className="h-3 w-3 text-muted-foreground" strokeWidth={2} />
    <HeadChip label={group.kvLabel} tone="kv" />
  </div>
);

const SharingPanel = ({ panel }: { panel: HeadSharingPanel }) => (
  <div className="rounded-2xl border border-border bg-muted/20 p-4 flex flex-col items-center gap-3">
    <p className="font-sans text-sm font-semibold text-foreground text-center">{panel.title}</p>
    <div className="flex flex-wrap justify-center gap-2">
      {panel.groups.map((g, i) => (
        <GroupBox key={i} group={g} />
      ))}
    </div>
    <p className="font-sans text-xs text-muted-foreground text-center leading-snug mt-1">{panel.note}</p>
  </div>
);

export const HeadSharingDiagram = ({
  panels,
  delay = 0,
}: {
  panels: HeadSharingPanel[];
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8 grid sm:grid-cols-3 gap-4"
  >
    {panels.map((p) => (
      <SharingPanel key={p.title} panel={p} />
    ))}
  </motion.div>
);

/* ===========================================================================
   ROTARY ROTATION — a static illustration of the one fact that matters about
   rotary position embeddings, the same vector gets rotated by a bigger angle
   the further out its token sits, magnitude never changes. Coordinates were
   verified with scripts/check-svg-layout.py before shipping (label boxes and
   the three radial vectors, zero overlaps).
=========================================================================== */
export const RotaryRotationDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8 mx-auto max-w-2xl"
  >
    <div className="rounded-lg border border-border bg-card p-3 sm:p-5 shadow-sm">
      <svg viewBox="0 0 640 420" className="w-full h-auto">
        <defs>
          <marker id="rope-ink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="fill-foreground/70" />
          </marker>
          <marker id="rope-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="fill-blue-500 dark:fill-blue-400" />
          </marker>
        </defs>

        {/* reference circle, constant magnitude for every rotated vector */}
        <circle cx="260" cy="260" r="120" fill="none" className="stroke-muted-foreground/30" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="260" cy="260" r="3" className="fill-foreground/60" />

        {/* position 0, no rotation */}
        <line x1="260" y1="260" x2="380" y2="260" className="stroke-foreground/70" strokeWidth="2" markerEnd="url(#rope-ink)" />
        <text x="440" y="264" className="fill-foreground/80 font-sans text-[11px]">position 0, no rotation</text>

        {/* position 4 */}
        <line x1="260" y1="260" x2="358.3" y2="191.2" className="stroke-blue-500 dark:stroke-blue-400" strokeWidth="2" markerEnd="url(#rope-blue)" />
        <text x="408" y="159" className="fill-blue-600 dark:fill-blue-400 font-sans text-[11px]">position 4, rotated further</text>

        {/* position 8 */}
        <line x1="260" y1="260" x2="301.0" y2="147.2" className="stroke-blue-500 dark:stroke-blue-400" strokeWidth="2.5" markerEnd="url(#rope-blue)" />
        <text x="325" y="95" className="fill-blue-600 dark:fill-blue-400 font-sans text-[11px]">position 8, rotated furthest</text>
      </svg>
    </div>
    {caption && (
      <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">
        {caption}
      </figcaption>
    )}
  </motion.figure>
);
