import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   Fully static (no GSAP, no play controls) reproduction of the 2-2-1 worked
   example's forward and backward pass. Built as plain SVG JSX rather than a
   GSAP timeline, the same way MessageAckChainDiagram in
   animations/designing-messenger/ConceptViz.tsx is, because it needs curved,
   directional connectors (forward straight and blue, backward curved and
   orange) rather than IconArchitectureDiagram's plain unlabeled dashed lines.
   Every number on the diagram comes straight out of the verified NumPy run
   in the worked example section above it.
---------------------------------------------------------------------------- */

interface NeuronBoxSpec {
  x: number;
  y: number;
  w: number;
  h: number;
  tone: "input" | "hidden" | "output";
  lines: string[];
}

const toneClass: Record<NeuronBoxSpec["tone"], string> = {
  input: "border-border bg-background",
  hidden: "border-blue-400/60 dark:border-blue-300/50 bg-blue-500/5",
  output: "border-orange-400/60 dark:border-orange-300/50 bg-orange-500/5",
};

const NeuronBox = ({ x, y, w, h, tone, lines }: NeuronBoxSpec) => (
  <foreignObject x={x} y={y} width={w} height={h}>
    <div
      // eslint-disable-next-line react/no-unknown-property
      xmlns="http://www.w3.org/1999/xhtml"
      className={`h-full w-full rounded-xl border shadow-sm flex flex-col items-center justify-center gap-0.5 px-2 ${toneClass[tone]}`}
    >
      {lines.map((l, i) => (
        <p
          key={i}
          className={
            i === 0
              ? "font-sans text-[12px] sm:text-[13px] font-semibold text-foreground"
              : "font-mono text-[10px] sm:text-[11px] text-muted-foreground"
          }
        >
          {l}
        </p>
      ))}
    </div>
  </foreignObject>
);

export const ForwardBackwardPassDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8 mx-auto max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 sm:p-5 shadow-sm">
      <svg viewBox="0 0 900 560" className="w-full h-auto">
        <defs>
          <marker id="nn-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="viz-arrow-blue" />
          </marker>
          <marker id="nn-warn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="viz-arrow-warn" />
          </marker>
        </defs>

        <text x="30" y="26" className="viz-phase">Forward pass (blue) and backward pass (orange)</text>

        {/* forward edges, straight, solid blue, fully connected input to hidden and hidden to output */}
        <line x1="170" y1="115" x2="390" y2="87.5" className="viz-blue" markerEnd="url(#nn-blue)" />
        <line x1="170" y1="115" x2="390" y2="397.5" className="viz-blue" markerEnd="url(#nn-blue)" />
        <line x1="170" y1="395" x2="390" y2="87.5" className="viz-blue" markerEnd="url(#nn-blue)" />
        <line x1="170" y1="395" x2="390" y2="397.5" className="viz-blue" markerEnd="url(#nn-blue)" />
        <line x1="530" y1="87.5" x2="740" y2="242.5" className="viz-blue" markerEnd="url(#nn-blue)" />
        <line x1="530" y1="397.5" x2="740" y2="242.5" className="viz-blue" markerEnd="url(#nn-blue)" />

        {/* backward edges, curved, dashed orange, gradient flowing from output back to the hidden layer */}
        <path
          d="M790,195 Q625,10 460,40"
          fill="none"
          className="viz-warn"
          strokeDasharray="7 5"
          markerEnd="url(#nn-warn)"
        />
        <path
          d="M790,290 Q625,520 460,445"
          fill="none"
          className="viz-warn"
          strokeDasharray="7 5"
          markerEnd="url(#nn-warn)"
        />

        <NeuronBox x={30} y={70} w={140} h={90} tone="input" lines={["x1", "0.05"]} />
        <NeuronBox x={30} y={350} w={140} h={90} tone="input" lines={["x2", "0.10"]} />
        <NeuronBox x={390} y={40} w={140} h={95} tone="hidden" lines={["h1", "a = 0.5933", "delta = 0.0134"]} />
        <NeuronBox x={390} y={350} w={140} h={95} tone="hidden" lines={["h2", "a = 0.5969", "delta = 0.0150"]} />
        <NeuronBox x={740} y={195} w={140} h={95} tone="output" lines={["y_hat", "a = 0.7514", "delta = 0.1385"]} />

        <text x="30" y="205" className="viz-label-sm">target y = 0.01, loss = 0.2748</text>
        <text x="390" y="230" className="viz-label-sm" fill="var(--v-blue)">forward, W1 then W2, sigmoid at each layer</text>
        <text x="390" y="250" className="viz-label-sm" fill="var(--v-warn)">backward, delta2 through W2 gives delta1</text>
      </svg>
    </div>
    {caption && (
      <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">
        {caption}
      </figcaption>
    )}
  </motion.figure>
);
