import { motion } from "framer-motion";

export interface EntropyDistributionSpec {
  name: string;
  probs: number[];
  entropyBits: number;
  note: string;
}

const BAR_AREA_WIDTH = 144;
const BAR_AREA_HEIGHT = 66;
const BASELINE_Y = 80;

const Plot = ({ probs }: { probs: number[] }) => {
  const gap = 8;
  const barWidth = (BAR_AREA_WIDTH - gap * (probs.length - 1)) / probs.length;
  const maxProb = Math.max(...probs);

  return (
    <svg viewBox="0 0 180 96" role="img" aria-label="probability bars">
      <line x1="18" y1={BASELINE_Y} x2="164" y2={BASELINE_Y} className="viz-thin" />
      <line x1="18" y1="14" x2="18" y2={BASELINE_Y} className="viz-thin" />
      {probs.map((p, index) => {
        const height = (p / maxProb) * BAR_AREA_HEIGHT;
        const x = 18 + index * (barWidth + gap);
        const y = BASELINE_Y - height;
        return (
          <motion.rect
            key={`bar-${index}`}
            x={x}
            y={y}
            width={barWidth}
            height={height}
            rx="3"
            className="viz-cell"
            initial={{ opacity: 0, scaleY: 0 }}
            whileInView={{ opacity: 0.85, scaleY: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
            style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
          />
        );
      })}
    </svg>
  );
};

export const EntropyDistributionCards = ({
  items,
  caption,
  delay = 0,
}: {
  items: EntropyDistributionSpec[];
  caption: string;
  delay?: number;
}) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8"
  >
    <div className="viz grid gap-3 sm:grid-cols-3">
      {items.map((item, index) => (
        <motion.div
          key={item.name}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.35, delay: index * 0.08 }}
          className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5"
        >
          <div className="mb-3 h-24 rounded-xl border border-border/60 bg-card/60 px-2 py-1">
            <Plot probs={item.probs} />
          </div>
          <h3 className="font-sans text-sm font-semibold text-foreground">{item.name}</h3>
          <p className="mt-1 font-mono text-xs text-foreground/80">
            H = {item.entropyBits.toFixed(3)} bits
          </p>
          <p className="mt-2 font-serif text-sm leading-relaxed text-muted-foreground">
            {item.note}
          </p>
        </motion.div>
      ))}
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);
