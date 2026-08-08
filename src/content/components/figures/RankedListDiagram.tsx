import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   RankedListDiagram — a static reference table for a small ranked list of
   graded relevance labels, building up to a DCG / NDCG number. Same
   config-driven, no-gsap shape as ApiEndpointsTable and SchemaCards in
   StaticCards.tsx, just laid out as a row-per-rank table instead of stacked
   cards, since the point here is comparing the same five columns across rows.
---------------------------------------------------------------------------- */

export interface RankedItem {
  rank: number;
  label: string;
  relevance: number;
  discount: number;
  gain: number;
}

export const RankedListDiagram = ({
  items,
  dcg,
  idcg,
  ndcg,
  caption,
  delay = 0,
}: {
  items: RankedItem[];
  dcg: number;
  idcg: number;
  ndcg: number;
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
      <div className="grid grid-cols-5 gap-2 px-4 sm:px-6 py-2.5 border-b border-border/50 bg-muted/30">
        <span className="font-sans text-xs font-semibold text-muted-foreground">Rank</span>
        <span className="font-sans text-xs font-semibold text-muted-foreground">Item</span>
        <span className="font-sans text-xs font-semibold text-muted-foreground">Relevance</span>
        <span className="font-sans text-xs font-semibold text-muted-foreground">Discount</span>
        <span className="font-sans text-xs font-semibold text-muted-foreground">Gain</span>
      </div>
      {items.map((item, i) => (
        <div
          key={item.rank}
          className={`grid grid-cols-5 gap-2 px-4 sm:px-6 py-2.5 ${
            i !== items.length - 1 ? "border-b border-border/30" : ""
          }`}
        >
          <span className="font-mono text-sm text-foreground">{item.rank}</span>
          <span className="font-sans text-sm text-foreground">{item.label}</span>
          <span className="font-mono text-sm text-foreground">{item.relevance}</span>
          <span className="font-mono text-sm text-muted-foreground">{item.discount.toFixed(3)}</span>
          <span className="font-mono text-sm text-foreground">{item.gain.toFixed(3)}</span>
        </div>
      ))}
      <div className="grid grid-cols-3 gap-2 px-4 sm:px-6 py-3 bg-muted/30">
        <span className="font-mono text-sm font-semibold text-foreground">DCG = {dcg.toFixed(3)}</span>
        <span className="font-mono text-sm font-semibold text-foreground">IDCG = {idcg.toFixed(3)}</span>
        <span className="font-mono text-sm font-semibold text-foreground">NDCG = {ndcg.toFixed(3)}</span>
      </div>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);
