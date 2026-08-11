import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   Bespoke visual for "Supervised Fine-Tuning".
   LossMaskDiagram is a fully static (no GSAP, no play controls) reproduction
   of a rendered chat template split into its token chunks, with a bracket
   over the system and user turns labeled "context" (masked, no gradient) and
   a second bracket over the assistant's own content and end token labeled
   "target" (unmasked, loss computed here). Nothing here needs motion, the
   whole point is a single frame the reader can study. Built as plain SVG
   JSX inside a .viz wrapper so it themes correctly via the existing
   semantic classes in src/index.css.
---------------------------------------------------------------------------- */

interface Chip {
  id: string;
  x: number;
  width: number;
  text: string;
  masked: boolean;
}

const CHIPS: Chip[] = [
  { id: "sys-tag", x: 20, width: 95, text: "<|system|>", masked: true },
  { id: "sys-content", x: 123, width: 235, text: "You are a helpful assistant.", masked: true },
  { id: "user-tag", x: 366, width: 85, text: "<|user|>", masked: true },
  { id: "user-content", x: 459, width: 120, text: "What's 2 + 2?", masked: true },
  { id: "asst-tag", x: 587, width: 120, text: "<|assistant|>", masked: true },
  { id: "asst-content", x: 715, width: 100, text: "2 + 2 = 4.", masked: false },
  { id: "end-tag", x: 823, width: 80, text: "<|end|>", masked: false },
];

const CHIP_Y = 110;
const CHIP_H = 56;

export const LossMaskDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8 mx-auto max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 sm:p-5 shadow-sm">
      <svg viewBox="0 0 940 340" preserveAspectRatio="xMidYMid meet" className="w-full h-auto">
        {/* context bracket, spans the system and user turns plus the assistant role tag */}
        <line x1={20} y1={82} x2={707} y2={82} className="viz-thin" />
        <line x1={20} y1={82} x2={20} y2={95} className="viz-thin" />
        <line x1={707} y1={82} x2={707} y2={95} className="viz-thin" />
        <text x={363.5} y={64} textAnchor="middle" className="viz-label-sm">
          given to the model as context
        </text>

        {/* target bracket, spans only the assistant's own content and its end token */}
        <line x1={715} y1={82} x2={903} y2={82} className="viz-blue" />
        <line x1={715} y1={82} x2={715} y2={95} className="viz-blue" />
        <line x1={903} y1={82} x2={903} y2={95} className="viz-blue" />
        <text x={809} y={64} textAnchor="middle" className="viz-label">
          the model's own words
        </text>

        {/* token chips */}
        {CHIPS.map((chip) => (
          <g key={chip.id}>
            <rect
              x={chip.x}
              y={CHIP_Y}
              width={chip.width}
              height={CHIP_H}
              rx={8}
              className={chip.masked ? "viz-panel" : "viz-box"}
            />
            <text
              x={chip.x + chip.width / 2}
              y={CHIP_Y + CHIP_H / 2 + 5}
              textAnchor="middle"
              className={chip.masked ? "viz-label-sm" : "viz-node-lbl"}
            >
              {chip.text}
            </text>
          </g>
        ))}

        {/* group labels below the chip row */}
        <text x={363.5} y={204} textAnchor="middle" className="viz-label-sm">
          masked, no gradient flows
        </text>
        <text x={809} y={204} textAnchor="middle" className="viz-num-pos">
          loss computed here
        </text>
      </svg>
    </div>
    {caption && (
      <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">
        {caption}
      </figcaption>
    )}
  </motion.figure>
);
