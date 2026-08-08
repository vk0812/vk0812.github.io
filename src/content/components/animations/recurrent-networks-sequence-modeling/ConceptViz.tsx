import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   Bespoke visuals for "Recurrent Networks and Sequence Modeling". All three
   are fully static, hand-coded SVG, no GSAP timelines, matching the site's
   default of preferring a static diagram over motion when motion isn't
   itself the point. Theme comes entirely from the .viz / .dark .viz CSS vars
   in index.css, same pattern as every other bespoke figure on the site.

   UnrolledRNNDiagram    - the recurrence unrolled across five timesteps,
                           the same three weight matrices reused every step.
   LSTMCellDiagram       - the cell state "conveyor belt" plus the three
                           gates that read and write it.
   GradientMagnitudeChart - the actual ||dh5/dh_k|| numbers from the post's
                           worked example, computed with numpy, not invented.
---------------------------------------------------------------------------- */

export const UnrolledRNNDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="mx-auto mb-8 max-w-4xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
      <svg viewBox="0 0 900 350" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="rnn-arrow-ink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="viz-arrow-ink" />
          </marker>
        </defs>

        <text x={450} y={20} className="viz-label-sm" textAnchor="middle">
          same weight matrices W_xh, W_hh, W_hy reused at every single timestep
        </text>

        {/* outputs y1..y5 */}
        {[224, 368, 512, 656, 800].map((cx, i) => (
          <g key={`y${i}`}>
            <rect x={cx - 30} y={52} width={60} height={36} rx={6} className="viz-panel" />
            <text x={cx} y={75} className="viz-node-lbl" textAnchor="middle">{`y${i + 1}`}</text>
          </g>
        ))}

        {/* hidden states h0..h5 */}
        {[80, 224, 368, 512, 656, 800].map((cx, i) => (
          <g key={`h${i}`}>
            <rect x={cx - 35} y={153} width={70} height={44} rx={7} className="viz-box" />
            <text x={cx} y={180} className="viz-node-lbl" textAnchor="middle">{`h${i}`}</text>
          </g>
        ))}

        {/* inputs x1..x5 */}
        {[224, 368, 512, 656, 800].map((cx, i) => (
          <g key={`x${i}`}>
            <rect x={cx - 30} y={262} width={60} height={36} rx={6} className="viz-panel" />
            <text x={cx} y={285} className="viz-node-lbl" textAnchor="middle">{`x${i + 1}`}</text>
          </g>
        ))}

        {/* horizontal recurrence arrows, h(t-1) -> h(t), each labeled W_hh */}
        {[[115, 189], [259, 333], [403, 477], [547, 621], [691, 765]].map(([x1, x2], i) => (
          <g key={`hh${i}`}>
            <line x1={x1} y1={175} x2={x2} y2={175} className="viz-stroke" markerEnd="url(#rnn-arrow-ink)" />
            <text x={(x1 + x2) / 2} y={157} className="viz-label-sm" textAnchor="middle">W_hh</text>
          </g>
        ))}

        {/* input arrows x_t -> h_t */}
        {[224, 368, 512, 656, 800].map((cx, i) => (
          <line key={`xh${i}`} x1={cx} y1={262} x2={cx} y2={197} className="viz-stroke" markerEnd="url(#rnn-arrow-ink)" />
        ))}

        {/* output arrows h_t -> y_t */}
        {[224, 368, 512, 656, 800].map((cx, i) => (
          <line key={`hy${i}`} x1={cx} y1={153} x2={cx} y2={88} className="viz-stroke" markerEnd="url(#rnn-arrow-ink)" />
        ))}
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);

export const LSTMCellDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="mx-auto mb-8 max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
      <svg viewBox="0 0 900 380" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="lstm-arrow-ink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="viz-arrow-ink" />
          </marker>
          <marker id="lstm-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="viz-arrow-blue" />
          </marker>
        </defs>

        <text x={450} y={20} className="viz-label-sm" textAnchor="middle">
          the cell state runs across the top like a conveyor belt, gates decide what leaves and what's added
        </text>

        {/* cell state belt */}
        <rect x={55} y={50} width={70} height={40} rx={6} className="viz-panel" />
        <text x={90} y={75} className="viz-node-lbl" textAnchor="middle">C(t-1)</text>
        <line x1={125} y1={70} x2={615} y2={70} className="viz-blue" markerEnd="url(#lstm-arrow-blue)" />
        <rect x={615} y={50} width={70} height={40} rx={6} className="viz-panel" />
        <text x={650} y={75} className="viz-node-lbl" textAnchor="middle">C(t)</text>

        <circle cx={280} cy={70} r={10} className="viz-cell" />
        <text x={280} y={75} className="viz-warn-lbl" textAnchor="middle">x</text>
        <circle cx={460} cy={70} r={10} className="viz-cell" />
        <text x={460} y={75} className="viz-node-lbl" textAnchor="middle">+</text>

        {/* gate boxes */}
        <rect x={215} y={195} width={130} height={50} rx={7} className="viz-box" />
        <text x={280} y={216} className="viz-node-lbl" textAnchor="middle">Forget gate</text>
        <text x={280} y={234} className="viz-label-sm" textAnchor="middle">f(t) = sigmoid(...)</text>

        <rect x={395} y={195} width={130} height={50} rx={7} className="viz-box" />
        <text x={460} y={216} className="viz-node-lbl" textAnchor="middle">Input gate</text>
        <text x={460} y={234} className="viz-label-sm" textAnchor="middle">i(t), candidate C~(t)</text>

        <rect x={635} y={195} width={130} height={50} rx={7} className="viz-box" />
        <text x={700} y={216} className="viz-node-lbl" textAnchor="middle">Output gate</text>
        <text x={700} y={234} className="viz-label-sm" textAnchor="middle">o(t) = sigmoid(...)</text>

        {/* gate arrows up to the belt */}
        <line x1={280} y1={195} x2={280} y2={80} className="viz-stroke" markerEnd="url(#lstm-arrow-ink)" />
        <line x1={460} y1={195} x2={460} y2={80} className="viz-stroke" markerEnd="url(#lstm-arrow-ink)" />

        {/* cell state read into the output gate, then down to h_t */}
        <line x1={650} y1={90} x2={700} y2={195} className="viz-stroke" markerEnd="url(#lstm-arrow-ink)" />
        <line x1={700} y1={245} x2={670} y2={320} className="viz-stroke" markerEnd="url(#lstm-arrow-ink)" />

        {/* previous hidden state + current input feeding every gate */}
        <rect x={360} y={320} width={200} height={40} rx={6} className="viz-panel" />
        <text x={460} y={344} className="viz-node-lbl" textAnchor="middle">[h(t-1), x(t)]</text>

        <line x1={400} y1={320} x2={280} y2={245} className="viz-stroke" markerEnd="url(#lstm-arrow-ink)" />
        <line x1={460} y1={320} x2={460} y2={245} className="viz-stroke" markerEnd="url(#lstm-arrow-ink)" />
        <line x1={520} y1={320} x2={700} y2={245} className="viz-stroke" markerEnd="url(#lstm-arrow-ink)" />

        {/* hidden state output */}
        <rect x={625} y={320} width={90} height={40} rx={6} className="viz-panel" />
        <text x={670} y={344} className="viz-node-lbl" textAnchor="middle">h(t)</text>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);

/* Real values from the post's numpy example: ||dh5/dh_k|| for k = 5..0,
   the norm of the accumulated Jacobian product going backward through
   backpropagation through time. Verified with node/numpy, not invented. */
const GRADIENT_MAGNITUDES: { k: number; value: number }[] = [
  { k: 5, value: 1.0 },
  { k: 4, value: 0.5936 },
  { k: 3, value: 0.355 },
  { k: 2, value: 0.1431 },
  { k: 1, value: 0.0716 },
  { k: 0, value: 0.0365 },
];

export const GradientMagnitudeChart = ({ caption, delay = 0 }: { caption: string; delay?: number }) => {
  const baseline = 280;
  const maxHeight = 180;
  const xs = [70, 170, 270, 370, 470, 570];

  return (
    <motion.figure
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay }}
      className="mx-auto mb-8 max-w-2xl"
    >
      <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
        <svg viewBox="0 0 700 340" preserveAspectRatio="xMidYMid meet">
          <text x={350} y={22} className="viz-label-sm" textAnchor="middle">
            gradient magnitude ||dh5 / dh_k|| shrinks going backward through time
          </text>

          <line x1={40} y1={baseline} x2={640} y2={baseline} className="viz-thin" />

          {GRADIENT_MAGNITUDES.map((g, i) => {
            const cx = xs[i];
            const h = g.value * maxHeight;
            const yTop = baseline - h;
            return (
              <g key={g.k}>
                <rect x={cx - 30} y={yTop} width={60} height={h} rx={4} className="viz-box" />
                <text x={cx} y={yTop - 14} className="viz-node-lbl" textAnchor="middle">{g.value.toFixed(3)}</text>
                <text x={cx} y={baseline + 22} className="viz-label-sm" textAnchor="middle">{`k=${g.k}`}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
        {caption}
      </figcaption>
    </motion.figure>
  );
};
