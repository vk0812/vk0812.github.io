import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   Bespoke visuals for "Optimizers and Learning-Rate Schedules". Both pieces
   here are fully static, no GSAP, matching the site's preference for a plain
   hand-coded SVG (wrapped in a fade-in) whenever the shape of the thing, not
   its motion, is the point. Theme comes entirely from CSS vars (.viz /
   .dark .viz in index.css).
---------------------------------------------------------------------------- */

/* ===========================================================================
   1. OPTIMIZER TRAJECTORIES — SGD vs SGD+momentum vs Adam on the same
   ill-conditioned bowl f(x, y) = x^2 + 10y^2, starting at (4, 4). All three
   paths are real, computed with numpy (15 steps each), not hand-drawn:
     SGD          lr=0.08                          final loss ≈ 0.0856
     Momentum     lr=0.06, beta=0.3                 final loss ≈ 0.0378
     Adam         lr=0.3, beta1=0.9, beta2=0.999    final loss ≈ 0.0062
   Adam's per-parameter normalization is what makes its path look like a
   straight diagonal line instead of a zigzag, it rescales the steep and
   flat directions to look equally steep, which is the entire point.
=========================================================================== */
export const OptimizerTrajectoryDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="mx-auto mb-8 max-w-4xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
      <svg viewBox="0 0 1020 460" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="olrs-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="viz-arrow-blue" />
          </marker>
        </defs>

        <text x={175} y={36} className="viz-phase" textAnchor="middle">SGD</text>
        <text x={505} y={36} className="viz-phase" textAnchor="middle">SGD + MOMENTUM</text>
        <text x={835} y={36} className="viz-phase" textAnchor="middle">ADAM</text>

        <rect x={20} y={58} width={310} height={327} rx={12} className="viz-panel" />
        <rect x={350} y={58} width={310} height={327} rx={12} className="viz-panel" />
        <rect x={680} y={58} width={310} height={327} rx={12} className="viz-panel" />

        {/* elongated-bowl contours, shared shape across all three panels since
            it's the same loss surface, only the optimizer differs */}
        {[
          [175, 235],
          [505, 235],
          [835, 235],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <ellipse cx={cx} cy={cy} rx={110} ry={34} className="viz-thin" />
            <ellipse cx={cx} cy={cy} rx={80} ry={25} className="viz-thin" />
            <ellipse cx={cx} cy={cy} rx={55} ry={16} className="viz-thin" />
            <ellipse cx={cx} cy={cy} rx={30} ry={9} className="viz-thin" />
            <circle cx={cx} cy={cy} r={4} className="viz-cell" />
          </g>
        ))}

        {/* SGD, lr=0.08, zigzags hard across the steep axis */}
        <path
          d="M271.0,139.0 L255.6,292.6 L242.7,200.4 L231.9,255.7 L222.8,222.6 L215.1,242.5 L208.7,230.5 L203.3,237.7 L198.8,233.4 L195.0,236.0 L191.8,234.4 L189.1,235.3 L186.8,234.8 L185.0,235.1 L183.4,234.9 L182.0,235.0"
          fill="none"
          className="viz-blue"
          markerEnd="url(#olrs-arrow)"
        />
        <circle cx={271.0} cy={139.0} r={6} className="viz-cell" />

        {/* Momentum, lr=0.06 beta=0.3, damps the zigzag but still overshoots once */}
        <path
          d="M601.0,139.0 L589.5,254.2 L575.9,265.7 L563.3,232.3 L552.5,225.5 L543.6,234.9 L536.3,237.8 L530.3,235.3 L525.5,234.2 L521.6,234.8 L518.4,235.2 L515.9,235.1 L513.8,234.9 L512.1,235.0 L510.8,235.0 L509.7,235.0"
          fill="none"
          className="viz-blue"
          markerEnd="url(#olrs-arrow)"
        />
        <circle cx={601.0} cy={139.0} r={6} className="viz-cell" />

        {/* Adam, lr=0.3, near-diagonal because per-parameter scaling makes both axes look equally steep */}
        <path
          d="M931.0,139.0 L923.8,146.2 L916.6,153.4 L909.5,160.5 L902.4,167.6 L895.4,174.6 L888.5,181.5 L881.7,188.3 L875.0,195.0 L868.6,201.4 L862.3,207.7 L856.3,213.7 L850.6,219.4 L845.2,224.8 L840.2,229.8 L835.6,234.4"
          fill="none"
          className="viz-blue"
          markerEnd="url(#olrs-arrow)"
        />
        <circle cx={931.0} cy={139.0} r={6} className="viz-cell" />

        <text x={175} y={406} className="viz-label-sm" textAnchor="middle">15 steps, final loss ≈ 0.086</text>
        <text x={505} y={406} className="viz-label-sm" textAnchor="middle">15 steps, final loss ≈ 0.038</text>
        <text x={835} y={406} className="viz-label-sm" textAnchor="middle">15 steps, final loss ≈ 0.006</text>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);

/* ===========================================================================
   2. LEARNING RATE SCHEDULES — step decay vs plain cosine decay vs
   warmup-then-cosine, all starting from a normalized peak lr of 1.0 over
   100 steps. Curves computed directly from their formulas:
     step decay      lr = 1.0 * 0.5^floor(t / 25)
     cosine decay    lr = 0.5 * (1 + cos(pi * t / 100))
     warmup+cosine   linear 0 -> 1 over the first 10 steps, then cosine decay
=========================================================================== */
export const LrScheduleDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="mx-auto mb-8 max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
      <svg viewBox="0 0 900 420" preserveAspectRatio="xMidYMid meet">
        {/* legend */}
        <line x1={600} y1={16} x2={630} y2={16} className="viz-stroke" />
        <text x={638} y={20} className="viz-label-sm" textAnchor="start">step decay</text>
        <line x1={600} y1={34} x2={630} y2={34} className="viz-blue" />
        <text x={638} y={38} className="viz-label-sm" textAnchor="start">cosine decay</text>
        <line x1={600} y1={52} x2={630} y2={52} className="viz-baseline" />
        <text x={638} y={56} className="viz-label-sm" textAnchor="start">warmup + cosine</text>

        {/* axes */}
        <line x1={70} y1={360} x2={840} y2={360} className="viz-stroke" />
        <line x1={70} y1={70} x2={70} y2={360} className="viz-stroke" />

        {/* gridlines + x ticks */}
        {[0, 25, 50, 75, 100].map((t) => {
          const x = 70 + (840 - 70) * (t / 100);
          return (
            <g key={t}>
              <line x1={x} y1={70} x2={x} y2={360} className="viz-thin" />
              <text x={x} y={382} className="viz-label-sm" textAnchor="middle">{t}</text>
            </g>
          );
        })}
        <text x={455} y={408} className="viz-label-sm" textAnchor="middle">training step</text>

        {/* y ticks */}
        {[0, 0.5, 1.0].map((v) => {
          const y = 360 - (360 - 70) * v;
          return (
            <text key={v} x={56} y={y + 4} className="viz-label-sm" textAnchor="end">{v.toFixed(1)}</text>
          );
        })}
        <text x={26} y={215} className="viz-label-sm" textAnchor="middle" transform="rotate(-90 26 215)">learning rate</text>

        {/* step decay, sharp drops every 25 steps */}
        <path
          d="M70.0,70.0 L262.5,70.0 L262.5,215.0 L455.0,215.0 L455.0,287.5 L647.5,287.5 L647.5,323.8 L840.0,323.8 L840.0,341.9"
          fill="none"
          className="viz-stroke"
        />

        {/* plain cosine decay, smooth from peak to zero */}
        <path
          d="M70.0,70.0 L85.4,70.3 L100.8,71.1 L116.2,72.6 L131.6,74.6 L147.0,77.1 L162.4,80.2 L177.8,83.8 L193.2,87.9 L208.6,92.6 L224.0,97.7 L239.4,103.3 L254.8,109.3 L270.2,115.7 L285.6,122.6 L301.0,129.8 L316.4,137.3 L331.8,145.1 L347.2,153.3 L362.6,161.6 L378.0,170.2 L393.4,178.9 L408.8,187.8 L424.2,196.8 L439.6,205.9 L455.0,215.0 L470.4,224.1 L485.8,233.2 L501.2,242.2 L516.6,251.1 L532.0,259.8 L547.4,268.4 L562.8,276.7 L578.2,284.9 L593.6,292.7 L609.0,300.2 L624.4,307.4 L639.8,314.3 L655.2,320.7 L670.6,326.7 L686.0,332.3 L701.4,337.4 L716.8,342.1 L732.2,346.2 L747.6,349.8 L763.0,352.9 L778.4,355.4 L793.8,357.4 L809.2,358.9 L824.6,359.7 L840.0,360.0"
          fill="none"
          className="viz-blue"
        />

        {/* warmup for the first 10 steps, then cosine decay from the peak */}
        <path
          d="M70.0,360.0 L85.4,302.0 L100.8,244.0 L116.2,186.0 L131.6,128.0 L147.0,70.0 L162.4,70.4 L177.8,71.4 L193.2,73.2 L208.6,75.6 L224.0,78.7 L239.4,82.5 L254.8,87.0 L270.2,92.0 L285.6,97.7 L301.0,103.9 L316.4,110.7 L331.8,118.0 L347.2,125.7 L362.6,133.9 L378.0,142.5 L393.4,151.4 L408.8,160.7 L424.2,170.2 L439.6,179.9 L455.0,189.8 L470.4,199.8 L485.8,209.9 L501.2,220.1 L516.6,230.2 L532.0,240.2 L547.4,250.1 L562.8,259.8 L578.2,269.3 L593.6,278.6 L609.0,287.5 L624.4,296.1 L639.8,304.3 L655.2,312.0 L670.6,319.3 L686.0,326.1 L701.4,332.3 L716.8,338.0 L732.2,343.0 L747.6,347.5 L763.0,351.3 L778.4,354.4 L793.8,356.8 L809.2,358.6 L824.6,359.6 L840.0,360.0"
          fill="none"
          className="viz-baseline"
        />
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);
