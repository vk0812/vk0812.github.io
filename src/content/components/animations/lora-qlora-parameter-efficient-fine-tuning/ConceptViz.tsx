import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   MatrixDecompositionDiagram — a fully static, hand-coded SVG showing the
   structural fact at the heart of LoRA, a full weight update decomposed into
   the product of two much skinnier matrices. No GSAP timeline, no controls,
   just a fade-in wrapper, since the shapes themselves are the whole point and
   nothing about them changes over time. Theme comes from the existing
   Tailwind semantic classes (bg-background, border-border, text-foreground)
   the same way animations/designing-messenger/ConceptViz.tsx uses them.
---------------------------------------------------------------------------- */

interface MatrixBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  emphasis?: boolean;
}

const MatrixBox = ({ x, y, width, height, label, emphasis = false }: MatrixBoxProps) => (
  <g>
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={8}
      className={emphasis ? "fill-blue-50 dark:fill-blue-950/30 stroke-blue-400 dark:stroke-blue-500/60" : "fill-background stroke-foreground/60"}
      strokeWidth={1.5}
    />
    <text
      x={x + width / 2}
      y={y + height / 2 + 5}
      textAnchor="middle"
      className={emphasis ? "fill-blue-700 dark:fill-blue-300 font-serif text-base font-semibold" : "fill-foreground font-serif text-base font-semibold"}
    >
      {label}
    </text>
  </g>
);

const OpGlyph = ({ x, y, children }: { x: number; y: number; children: string }) => (
  <text x={x} y={y + 6} textAnchor="middle" className="fill-muted-foreground font-sans text-lg">
    {children}
  </text>
);

const BelowLabel = ({ x, y, children, muted = false }: { x: number; y: number; children: string; muted?: boolean }) => (
  <text
    x={x}
    y={y}
    textAnchor="middle"
    className={muted ? "fill-muted-foreground font-sans text-[11px]" : "fill-foreground font-sans text-[11px] font-medium"}
  >
    {children}
  </text>
);

export const MatrixDecompositionDiagram = ({ caption, delay = 0 }: { caption?: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8 mx-auto max-w-3xl"
  >
    <div className="rounded-lg border border-border bg-card p-3 sm:p-6 shadow-sm">
      <svg viewBox="0 0 860 320" className="w-full h-auto">
        {/* W0, frozen pretrained matrix */}
        <MatrixBox x={30} y={70} width={170} height={160} label="W₀" />
        <BelowLabel x={115} y={257}>d × d</BelowLabel>
        <BelowLabel x={115} y={282} muted>frozen, no gradients</BelowLabel>

        <OpGlyph x={235} y={160}>+</OpGlyph>

        {/* B, tall skinny matrix, d rows by r columns */}
        <MatrixBox x={270} y={70} width={55} height={160} label="B" emphasis />
        <BelowLabel x={297} y={257}>d × r</BelowLabel>
        <BelowLabel x={297} y={282} muted>trainable</BelowLabel>

        <OpGlyph x={355} y={160}>×</OpGlyph>

        {/* A, short wide matrix, r rows by d columns */}
        <MatrixBox x={385} y={137} width={190} height={46} label="A" emphasis />
        <BelowLabel x={480} y={218}>r × d</BelowLabel>
        <BelowLabel x={480} y={243} muted>trainable</BelowLabel>

        <OpGlyph x={605} y={160}>=</OpGlyph>

        {/* Delta W, the low rank update, same shape as W0 */}
        <MatrixBox x={635} y={70} width={170} height={160} label="ΔW = BA" emphasis />
        <BelowLabel x={720} y={257}>d × d, rank r</BelowLabel>
        <BelowLabel x={720} y={282} muted>added on top of W₀</BelowLabel>
      </svg>
    </div>
    {caption && (
      <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">
        {caption}
      </figcaption>
    )}
  </motion.figure>
);
