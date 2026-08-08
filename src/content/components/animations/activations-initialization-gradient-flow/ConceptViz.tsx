import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   Bespoke visuals for "Activations, Initialization, and Gradient Flow".
   Both are fully static, hand-coded SVG bar charts, no GSAP timelines,
   following the same pattern as GradientMagnitudeChart in the recurrent
   networks post. Every number plotted here comes from a real numpy run
   (see the post's code blocks), nothing is invented.

   ActivationDerivativeChart - sigmoid' and tanh' at increasing |z|, the
                               numeric picture of saturation.
   GradientFlowDepthChart    - rms gradient magnitude at checkpoint layers
                               going backward through a 15-layer ReLU MLP,
                               Xavier-scaled weights next to He-scaled ones.
---------------------------------------------------------------------------- */

const DERIVATIVE_POINTS: { z: string; sigmoid: number; tanh: number }[] = [
  { z: "0", sigmoid: 0.25, tanh: 1.0 },
  { z: "1", sigmoid: 0.19661, tanh: 0.41997 },
  { z: "2", sigmoid: 0.10499, tanh: 0.07065 },
  { z: "4", sigmoid: 0.01766, tanh: 0.00134 },
  { z: "6", sigmoid: 0.00247, tanh: 0.00002 },
];

export const ActivationDerivativeChart = ({ caption, delay = 0 }: { caption: string; delay?: number }) => {
  const baseline = 300;
  const maxHeight = 220;
  const groupWidth = 120;
  const startX = 110;

  return (
    <motion.figure
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay }}
      className="mx-auto mb-8 max-w-2xl"
    >
      <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
        <svg viewBox="0 0 700 350" preserveAspectRatio="xMidYMid meet">
          <text x={350} y={24} className="viz-label-sm" textAnchor="middle">
            derivative collapses toward zero as |z| grows, sigmoid and tanh both saturate
          </text>

          <line x1={40} y1={baseline} x2={660} y2={baseline} className="viz-thin" />

          {/* legend */}
          <rect x={220} y={44} width={14} height={14} rx={2} className="viz-box" />
          <text x={240} y={55} className="viz-label-sm">sigmoid&apos;(z)</text>
          <rect x={340} y={44} width={14} height={14} rx={2} className="viz-panel-warn" />
          <text x={360} y={55} className="viz-label-sm">tanh&apos;(z)</text>

          {DERIVATIVE_POINTS.map((p, i) => {
            const cx = startX + i * groupWidth;
            const hSig = p.sigmoid * maxHeight;
            const hTanh = p.tanh * maxHeight;
            return (
              <g key={p.z}>
                <rect x={cx - 30} y={baseline - hSig} width={20} height={hSig} rx={3} className="viz-box" />
                <text x={cx - 20} y={baseline - hSig - 10} className="viz-label-sm" textAnchor="middle">
                  {p.sigmoid.toFixed(3)}
                </text>
                <rect x={cx + 10} y={baseline - hTanh} width={20} height={hTanh} rx={3} className="viz-panel-warn" />
                <text x={cx + 20} y={baseline - hTanh - 10} className="viz-label-sm" textAnchor="middle">
                  {p.tanh.toFixed(3)}
                </text>
                <text x={cx} y={baseline + 24} className="viz-node-lbl" textAnchor="middle">{`z=${p.z}`}</text>
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

const GRADIENT_FLOW_POINTS: { layer: string; xavier: number; he: number }[] = [
  { layer: "0", xavier: 1.00186, he: 0.998 },
  { layer: "3", xavier: 0.35106, he: 1.0229 },
  { layer: "6", xavier: 0.12057, he: 0.92991 },
  { layer: "9", xavier: 0.04058, he: 0.99521 },
  { layer: "12", xavier: 0.0144, he: 0.90371 },
  { layer: "15", xavier: 0.00523, he: 0.89255 },
];

export const GradientFlowDepthChart = ({ caption, delay = 0 }: { caption: string; delay?: number }) => {
  const baseline = 300;
  const maxHeight = 210;
  const groupWidth = 108;
  const startX = 96;

  return (
    <motion.figure
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay }}
      className="mx-auto mb-8 max-w-3xl"
    >
      <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
        <svg viewBox="0 0 760 360" preserveAspectRatio="xMidYMid meet">
          <text x={380} y={24} className="viz-label-sm" textAnchor="middle">
            rms gradient magnitude walking backward through a 15-layer ReLU network
          </text>

          <line x1={30} y1={baseline} x2={730} y2={baseline} className="viz-thin" />

          {/* legend */}
          <rect x={230} y={44} width={14} height={14} rx={2} className="viz-panel-warn" />
          <text x={250} y={55} className="viz-label-sm">Xavier scale (1/sqrt(fan_in))</text>
          <rect x={470} y={44} width={14} height={14} rx={2} className="viz-box" />
          <text x={490} y={55} className="viz-label-sm">He scale (sqrt(2/fan_in))</text>

          {GRADIENT_FLOW_POINTS.map((p, i) => {
            const cx = startX + i * groupWidth;
            const hXavier = Math.max(p.xavier * maxHeight, 2);
            const hHe = p.he * maxHeight;
            return (
              <g key={p.layer}>
                <rect x={cx - 25} y={baseline - hXavier} width={18} height={hXavier} rx={3} className="viz-panel-warn" />
                <text x={cx - 16} y={baseline - hXavier - 10} className="viz-label-sm" textAnchor="middle">
                  {p.xavier.toFixed(3)}
                </text>
                <rect x={cx + 7} y={baseline - hHe} width={18} height={hHe} rx={3} className="viz-box" />
                <text x={cx + 16} y={baseline - hHe - 10} className="viz-label-sm" textAnchor="middle">
                  {p.he.toFixed(3)}
                </text>
                <text x={cx} y={baseline + 22} className="viz-node-lbl" textAnchor="middle">{`L${p.layer}`}</text>
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
