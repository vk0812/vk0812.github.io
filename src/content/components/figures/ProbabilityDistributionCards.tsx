import { motion } from "framer-motion";

export type ProbabilityDistributionKind =
  | "bernoulli"
  | "categorical"
  | "gaussian"
  | "poisson";

export interface ProbabilityDistributionSpec {
  kind: ProbabilityDistributionKind;
  name: string;
  description: string;
  example: string;
}

const Plot = ({ kind }: { kind: ProbabilityDistributionKind }) => {
  const bars =
    kind === "bernoulli"
      ? [
          { x: 42, y: 50, width: 30, height: 30 },
          { x: 108, y: 25, width: 30, height: 55 },
        ]
      : kind === "categorical"
      ? [
          { x: 28, y: 56, width: 24, height: 24 },
          { x: 64, y: 36, width: 24, height: 44 },
          { x: 100, y: 18, width: 24, height: 62 },
          { x: 136, y: 63, width: 24, height: 17 },
        ]
      : [
          { x: 34, y: 67, width: 18, height: 13 },
          { x: 58, y: 43, width: 18, height: 37 },
          { x: 82, y: 23, width: 18, height: 57 },
          { x: 106, y: 35, width: 18, height: 45 },
          { x: 130, y: 58, width: 18, height: 22 },
        ];

  return (
    <svg
      viewBox="0 0 180 96"
      preserveAspectRatio="none"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`${kind} distribution sketch`}
    >
      <line x1="18" y1="80" x2="164" y2="80" className="viz-thin" />
      <line x1="18" y1="14" x2="18" y2="80" className="viz-thin" />
      {kind === "gaussian" ? (
        <motion.path
          d="M20 79 C45 78 54 67 67 45 C78 26 88 17 91 17 C96 17 105 27 115 46 C128 68 139 78 162 79"
          className="viz-blue"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      ) : (
        bars.map((bar, index) => (
          <motion.rect
            key={`${kind}-${bar.x}`}
            {...bar}
            rx="3"
            className="viz-cell"
            initial={{ opacity: 0, scaleY: 0 }}
            whileInView={{ opacity: 0.85, scaleY: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
            style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
          />
        ))
      )}
    </svg>
  );
};

export const ProbabilityDistributionCards = ({
  items,
  caption,
  delay = 0,
}: {
  items: ProbabilityDistributionSpec[];
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
    <div className="viz grid gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <motion.div
          key={item.name}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.35, delay: index * 0.08 }}
          className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5"
        >
          <div className="mb-3 h-24 overflow-hidden rounded-xl border border-border/60 bg-card/60 px-2 py-1">
            <Plot kind={item.kind} />
          </div>
          <h3 className="font-sans text-sm font-semibold text-foreground">{item.name}</h3>
          <p className="mt-1 font-serif text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
          <p className="mt-3 font-mono text-xs text-foreground/80">{item.example}</p>
        </motion.div>
      ))}
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);
