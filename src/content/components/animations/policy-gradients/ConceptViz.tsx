import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   Bespoke visual for "Policy Gradients".
   ProbabilityPushDiagram is fully static (no GSAP), in the spirit of
   contrastive-learning's PullPushDiagram, two small panels showing the one
   mechanical fact the whole post rests on: a good return raises the
   log-probability of the action that produced it, a bad return lowers it.
   Theme comes entirely from CSS vars (.viz / .dark .viz in index.css) via
   the shared semantic classes, so it reads correctly in both themes.
---------------------------------------------------------------------------- */

export const ProbabilityPushDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="mx-auto mb-8 max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 sm:p-5 shadow-sm">
      <svg viewBox="0 0 640 330" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="pg-up-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="viz-arrow-blue" />
          </marker>
          <marker id="pg-down-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="viz-arrow-warn" />
          </marker>
        </defs>

        <line x1={320} y1={45} x2={320} y2={318} className="viz-thin" strokeDasharray="4 4" />

        {/* Left panel, good return */}
        <text x={160} y={26} className="viz-phase" textAnchor="middle">GOOD RETURN, PUSH UP</text>
        <text x={160} y={110} className="viz-label-sm" textAnchor="middle">return = +8</text>
        <line x1={137.5} y1={185} x2={182.5} y2={147.5} className="viz-blue" markerEnd="url(#pg-up-arrow)" />
        <rect x={120} y={185} width={35} height={45} rx={4} className="viz-panel" />
        <rect x={165} y={147.5} width={35} height={82.5} rx={4} className="viz-bar-pos" />
        <text x={137.5} y={260} className="viz-label-sm" textAnchor="middle">0.30</text>
        <text x={182.5} y={260} className="viz-label-sm" textAnchor="middle">0.55</text>
        <text x={160} y={285} className="viz-label" textAnchor="middle">buy</text>
        <text x={160} y={310} className="viz-label-sm" textAnchor="middle">probability rises</text>

        {/* Right panel, bad return */}
        <text x={480} y={26} className="viz-phase" textAnchor="middle">BAD RETURN, PUSH DOWN</text>
        <text x={480} y={110} className="viz-label-sm" textAnchor="middle">return = -5</text>
        <line x1={457.5} y1={192.5} x2={502.5} y2={218} className="viz-warn" markerEnd="url(#pg-down-arrow)" />
        <rect x={440} y={192.5} width={35} height={37.5} rx={4} className="viz-panel" />
        <rect x={485} y={218} width={35} height={12} rx={4} className="viz-bar-neg" />
        <text x={457.5} y={260} className="viz-label-sm" textAnchor="middle">0.25</text>
        <text x={502.5} y={260} className="viz-label-sm" textAnchor="middle">0.08</text>
        <text x={480} y={285} className="viz-label" textAnchor="middle">sell</text>
        <text x={480} y={310} className="viz-label-sm" textAnchor="middle">probability falls</text>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);
