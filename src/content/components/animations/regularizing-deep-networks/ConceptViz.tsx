import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   Bespoke static (no GSAP) visuals for "Regularizing Deep Networks". Both
   pieces are plain SVG JSX, no play/pause controls, since nothing here needs
   motion to read clearly, a network diagram and a line chart are both fully
   understood at a glance. Same .viz theming convention as the rest of the
   site (colors via class, not literal fills, so both themes stay correct).
---------------------------------------------------------------------------- */

/* ===========================================================================
   DROPOUT MASK DIAGRAM — a tiny 3-4-1 network shown twice. Left panel is a
   single training step, two of the four hidden units are zeroed out for this
   step and every connection through them is gone. Right panel is inference
   time, every unit is back, and the outgoing weights are the ones that get
   scaled down instead.
=========================================================================== */

const LEFT_INPUTS = [140, 210, 280];
const LEFT_HIDDEN = [100, 170, 240, 310];
const LEFT_DROPPED = new Set([1, 3]); // indices into LEFT_HIDDEN
const LEFT_OUT_Y = 205;

const RIGHT_SHIFT = 500;

function NetworkPanel({
  shiftX,
  dropped,
  titleLines,
  captionLines,
}: {
  shiftX: number;
  dropped: Set<number>;
  titleLines: string[];
  captionLines: string[];
}) {
  const inX = 90 + shiftX;
  const hidX = 220 + shiftX;
  const outX = 350 + shiftX;

  const activeHidden = LEFT_HIDDEN.map((y, i) => ({ y, i })).filter(({ i }) => !dropped.has(i));

  return (
    <g>
      {titleLines.map((line, i) => (
        <text key={i} x={inX + 130} y={40 + i * 16} textAnchor="middle" className="viz-label-sm">
          {line}
        </text>
      ))}

      {/* input -> hidden edges, only to active hidden units */}
      {LEFT_INPUTS.map((iy) =>
        activeHidden.map(({ y: hy, i: hi }) => (
          <line
            key={`i${iy}-h${hi}`}
            x1={inX + 16}
            y1={iy}
            x2={hidX - 16}
            y2={hy}
            className="viz-thin"
            strokeWidth={1}
          />
        ))
      )}

      {/* faint stubs into the dropped hidden units, to show the connection is gone, not just the node */}
      {LEFT_INPUTS.map((iy) =>
        LEFT_HIDDEN.map((hy, hi) =>
          dropped.has(hi) ? (
            <line
              key={`dstub-i${iy}-h${hi}`}
              x1={inX + 16}
              y1={iy}
              x2={hidX - 16}
              y2={hy}
              className="viz-thin"
              strokeWidth={1}
              strokeDasharray="2 5"
              opacity={0.25}
            />
          ) : null
        )
      )}

      {/* hidden -> output edges, only from active hidden units */}
      {activeHidden.map(({ y: hy, i: hi }) => (
        <line
          key={`h${hi}-out`}
          x1={hidX + 16}
          y1={hy}
          x2={outX - 16}
          y2={LEFT_OUT_Y}
          className="viz-blue"
          strokeWidth={1.5}
        />
      ))}
      {LEFT_HIDDEN.map((hy, hi) =>
        dropped.has(hi) ? (
          <line
            key={`dstub-h${hi}-out`}
            x1={hidX + 16}
            y1={hy}
            x2={outX - 16}
            y2={LEFT_OUT_Y}
            className="viz-thin"
            strokeWidth={1}
            strokeDasharray="2 5"
            opacity={0.25}
          />
        ) : null
      )}

      {/* input nodes */}
      {LEFT_INPUTS.map((y, i) => (
        <circle key={`in${i}`} cx={inX} cy={y} r={16} className="viz-box" />
      ))}

      {/* hidden nodes, active vs dropped */}
      {LEFT_HIDDEN.map((y, i) =>
        dropped.has(i) ? (
          <circle
            key={`h${i}`}
            cx={hidX}
            cy={y}
            r={16}
            className="viz-panel-warn"
            strokeDasharray="3 3"
            opacity={0.55}
          />
        ) : (
          <circle key={`h${i}`} cx={hidX} cy={y} r={16} className="viz-box" />
        )
      )}

      {/* output node */}
      <circle cx={outX} cy={LEFT_OUT_Y} r={16} className="viz-box" />

      {captionLines.map((line, i) => (
        <text key={i} x={inX + 130} y={372 + i * 20} textAnchor="middle" className="viz-label-sm">
          {line}
        </text>
      ))}
    </g>
  );
}

export const DropoutMaskDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8 mx-auto max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 sm:p-5 shadow-sm">
      <svg viewBox="0 0 960 420" className="w-full h-auto">
        <line x1={480} y1={60} x2={480} y2={400} className="viz-thin" strokeDasharray="4 6" />
        <NetworkPanel
          shiftX={0}
          dropped={LEFT_DROPPED}
          titleLines={["Training step"]}
          captionLines={["Two of four hidden units zeroed", "this step, their connections drop too"]}
        />
        <NetworkPanel
          shiftX={RIGHT_SHIFT}
          dropped={new Set()}
          titleLines={["Inference"]}
          captionLines={["Every unit is active,", "outgoing weights scaled by keep probability"]}
        />
      </svg>
    </div>
    {caption && (
      <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">
        {caption}
      </figcaption>
    )}
  </motion.figure>
);

/* ===========================================================================
   REGULARIZATION LOSS CURVE DIAGRAM — real train/val MSE curves from the
   worked dropout example in the post, plain vs p=0.3 dropout, plotted as a
   static line chart. Coordinates are pre-computed from the actual numbers
   (see the post's Python block), not illustrative fakes.
=========================================================================== */

const NO_TRAIN =
  "70.0,151.7 86.4,314.2 102.9,370.8 119.3,376.8 135.8,378.7 152.2,379.4 168.6,379.7 185.1,379.9 201.5,380.0 218.0,380.0 234.4,380.0 250.9,380.0 267.3,380.0 283.7,380.0 300.2,380.0 316.6,380.0 333.1,380.0 349.5,380.0 365.9,380.0 382.4,380.0 398.8,380.0 415.3,380.0 431.7,380.0 448.1,380.0 464.6,380.0 481.0,380.0 497.5,380.0 513.9,380.0 530.4,380.0 546.8,380.0 563.2,380.0 579.7,380.0 596.1,380.0 612.6,380.0 629.0,380.0 645.4,380.0 661.9,380.0 678.3,380.0 694.8,380.0 711.2,380.0 727.6,380.0 744.1,380.0 760.5,380.0 777.0,380.0 793.4,380.0 809.8,380.0 826.3,380.0 842.7,380.0 859.2,380.0 875.6,380.0 890.0,380.0";
const NO_VAL =
  "70.0,85.0 86.4,212.0 102.9,172.3 119.3,156.4 135.8,154.3 152.2,152.6 168.6,157.7 185.1,153.0 201.5,154.6 218.0,155.0 234.4,154.5 250.9,154.6 267.3,154.9 283.7,154.7 300.2,154.7 316.6,154.7 333.1,154.7 349.5,154.7 365.9,154.7 382.4,154.7 398.8,154.7 415.3,154.7 431.7,154.7 448.1,154.7 464.6,154.7 481.0,154.7 497.5,154.7 513.9,154.7 530.4,154.7 546.8,154.7 563.2,154.7 579.7,154.7 596.1,154.7 612.6,154.7 629.0,154.7 645.4,154.7 661.9,154.7 678.3,154.7 694.8,154.7 711.2,154.7 727.6,154.7 744.1,154.7 760.5,154.7 777.0,154.7 793.4,154.7 809.8,154.7 826.3,154.7 842.7,154.7 859.2,154.7 875.6,154.7 890.0,154.7";
const YES_TRAIN =
  "70.0,147.5 86.4,282.1 102.9,337.1 119.3,357.1 135.8,367.6 152.2,365.8 168.6,366.1 185.1,371.0 201.5,372.8 218.0,371.3 234.4,373.2 250.9,371.2 267.3,368.7 283.7,375.6 300.2,367.0 316.6,376.3 333.1,375.8 349.5,362.4 365.9,377.6 382.4,374.7 398.8,374.1 415.3,375.3 431.7,376.0 448.1,376.0 464.6,378.2 481.0,371.7 497.5,372.2 513.9,374.6 530.4,372.0 546.8,377.1 563.2,376.4 579.7,374.0 596.1,376.5 612.6,373.8 629.0,377.4 645.4,374.9 661.9,375.8 678.3,376.9 694.8,372.7 711.2,375.4 727.6,370.0 744.1,375.8 760.5,373.7 777.0,373.4 793.4,371.7 809.8,376.2 826.3,375.9 842.7,376.8 859.2,370.3 875.6,376.1 890.0,373.1";
const YES_VAL =
  "70.0,81.7 86.4,198.5 102.9,212.9 119.3,197.0 135.8,185.6 152.2,187.7 168.6,184.6 185.1,187.1 201.5,185.4 218.0,186.2 234.4,184.0 250.9,197.3 267.3,176.2 283.7,178.5 300.2,184.2 316.6,176.6 333.1,180.6 349.5,175.8 365.9,183.9 382.4,189.5 398.8,182.6 415.3,181.8 431.7,186.8 448.1,193.4 464.6,178.5 481.0,187.3 497.5,190.5 513.9,176.0 530.4,183.4 546.8,187.0 563.2,185.2 579.7,184.5 596.1,177.2 612.6,185.0 629.0,185.8 645.4,182.9 661.9,180.3 678.3,181.8 694.8,186.5 711.2,184.3 727.6,184.0 744.1,189.8 760.5,182.1 777.0,181.9 793.4,169.5 809.8,185.9 826.3,190.3 842.7,190.2 859.2,187.5 875.6,184.8 890.0,184.9";

export const RegularizationLossCurveDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8 mx-auto max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 sm:p-5 shadow-sm">
      <svg viewBox="0 0 960 460" className="w-full h-auto">
        {/* legend, top row, above the plot's own top edge (70) so nothing overlaps the early curve peaks */}
        <line x1={110} y1={20} x2={140} y2={20} className="viz-warn" strokeWidth={2} />
        <text x={148} y={24} className="viz-label-sm">no dropout, val</text>
        <line x1={330} y1={20} x2={360} y2={20} className="viz-thin" strokeWidth={1.5} strokeDasharray="4 4" />
        <text x={368} y={24} className="viz-label-sm">no dropout, train</text>
        <line x1={570} y1={20} x2={600} y2={20} className="viz-blue" strokeWidth={2} />
        <text x={608} y={24} className="viz-label-sm">dropout p=0.3, val</text>
        <line x1={790} y1={20} x2={820} y2={20} className="viz-thin" strokeWidth={1.5} strokeDasharray="4 4" />
        <text x={828} y={24} className="viz-label-sm">dropout p=0.3, train</text>

        {/* axes */}
        <line x1={70} y1={380} x2={890} y2={380} className="viz-stroke" strokeWidth={1.5} />
        <line x1={70} y1={70} x2={70} y2={380} className="viz-stroke" strokeWidth={1.5} />

        {/* gridlines and y ticks, loss 0 / 0.5 / 1.0 */}
        <line x1={70} y1={273.1} x2={890} y2={273.1} className="viz-thin" strokeDasharray="2 6" opacity={0.5} />
        <line x1={70} y1={166.2} x2={890} y2={166.2} className="viz-thin" strokeDasharray="2 6" opacity={0.5} />
        <text x={58} y={384} textAnchor="end" className="viz-label-sm">0.0</text>
        <text x={58} y={277} textAnchor="end" className="viz-label-sm">0.5</text>
        <text x={58} y={170} textAnchor="end" className="viz-label-sm">1.0</text>
        <text x={30} y={225} textAnchor="middle" className="viz-label-sm" transform="rotate(-90 30 225)">MSE loss</text>

        {/* irreducible noise floor, variance 0.3^2 = 0.09 */}
        <line x1={70} y1={360.8} x2={890} y2={360.8} className="viz-thin" strokeDasharray="1 4" opacity={0.6} />
        <text x={895} y={364} className="viz-label-sm">noise floor 0.09</text>

        {/* x ticks */}
        <text x={70} y={400} textAnchor="middle" className="viz-label-sm">1</text>
        <text x={478.9} y={400} textAnchor="middle" className="viz-label-sm">200</text>
        <text x={890} y={400} textAnchor="middle" className="viz-label-sm">400</text>
        <text x={480} y={420} textAnchor="middle" className="viz-label-sm">Epoch</text>

        {/* curves */}
        <polyline points={NO_TRAIN} fill="none" className="viz-thin" strokeWidth={1.5} strokeDasharray="4 4" />
        <polyline points={NO_VAL} fill="none" className="viz-warn" strokeWidth={2} />
        <polyline points={YES_TRAIN} fill="none" className="viz-thin" strokeWidth={1.5} strokeDasharray="4 4" />
        <polyline points={YES_VAL} fill="none" className="viz-blue" strokeWidth={2} />
      </svg>
    </div>
    {caption && (
      <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">
        {caption}
      </figcaption>
    )}
  </motion.figure>
);
