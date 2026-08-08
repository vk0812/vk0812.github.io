import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   Bespoke visual for "Regularized Linear Models". Fully static, hand-coded
   SVG, no GSAP. Coordinates come directly from a real Ridge and Lasso fit
   (see the post's worked example, same synthetic dataset) swept across a
   log-spaced grid of penalty strengths, so every polyline point is a real
   fitted coefficient rather than an illustration. Theme comes entirely from
   the .viz / .dark .viz CSS vars in index.css, same pattern as every other
   bespoke figure on the site.
=========================================================================== */
export const RegularizationPathDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="mx-auto mb-8 max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
      <svg viewBox="0 0 900 460" preserveAspectRatio="xMidYMid meet">
        {/* panel titles */}
        <text x={265} y={40} className="viz-label" textAnchor="middle">RIDGE</text>
        <text x={635} y={40} className="viz-label" textAnchor="middle">LASSO</text>

        {/* left panel axes */}
        <line x1={100} y1={60} x2={100} y2={340} className="viz-thin" />
        <line x1={100} y1={340} x2={430} y2={340} className="viz-thin" />
        {/* right panel axes */}
        <line x1={470} y1={60} x2={470} y2={340} className="viz-thin" />
        <line x1={470} y1={340} x2={800} y2={340} className="viz-thin" />

        {/* zero lines */}
        <line x1={100} y1={321.7} x2={430} y2={321.7} className="viz-baseline" />
        <line x1={470} y1={321.7} x2={800} y2={321.7} className="viz-baseline" />

        {/* ---- RIDGE panel: three coefficients shrink smoothly, none reach zero ---- */}
        <polyline points="100.0,78.2 114.3,78.3 128.7,78.4 143.0,78.5 157.4,78.6 171.7,78.8 186.1,79.2 200.4,79.7 214.8,80.4 229.1,81.5 243.5,83.1 257.8,85.5 272.2,88.9 286.5,93.9 300.9,100.8 315.2,110.4 329.6,123.2 343.9,139.5 358.3,159.2 372.6,181.6 387.0,205.3 401.3,228.7 415.7,250.0 430.0,268.3" className="viz-stroke" />
        <polyline points="100.0,209.9 114.3,209.9 128.7,210.0 143.0,210.0 157.4,210.0 171.7,210.1 186.1,210.2 200.4,210.4 214.8,210.6 229.1,210.9 243.5,211.4 257.8,212.2 272.2,213.2 286.5,214.8 300.9,217.0 315.2,220.1 329.6,224.5 343.9,230.2 358.3,237.7 372.6,246.8 387.0,257.2 401.3,268.4 415.7,279.4 430.0,289.3" className="viz-blue" />
        <polyline points="100.0,320.7 114.3,320.7 128.7,320.7 143.0,320.7 157.4,320.7 171.7,320.7 186.1,320.7 200.4,320.7 214.8,320.7 229.1,320.7 243.5,320.7 257.8,320.6 272.2,320.6 286.5,320.5 300.9,320.4 315.2,320.3 329.6,320.2 343.9,320.0 358.3,319.8 372.6,319.7 387.0,319.6 401.3,319.7 415.7,319.9 430.0,320.2" className="viz-warn" />

        {/* ---- LASSO panel: same three coefficients, but each hits exactly zero at a different penalty strength ---- */}
        <polyline points="470.0,78.4 484.3,78.5 498.7,78.6 513.0,78.8 527.4,79.0 541.7,79.4 556.1,80.0 570.4,80.8 584.8,81.9 599.1,83.5 613.5,85.7 627.8,88.9 642.2,93.3 656.5,98.0 670.9,104.7 685.2,114.2 699.6,127.6 713.9,146.7 728.3,173.7 742.6,212.2 757.0,266.7 771.3,321.7 785.7,321.7 800.0,321.7" className="viz-stroke" />
        <polyline points="470.0,210.1 484.3,210.2 498.7,210.3 513.0,210.5 527.4,210.7 541.7,211.1 556.1,211.6 570.4,212.3 584.8,213.3 599.1,214.8 613.5,216.9 627.8,219.8 642.2,223.9 656.5,228.1 670.9,234.1 685.2,242.7 699.6,254.8 713.9,272.0 728.3,296.4 742.6,321.7 757.0,321.7 771.3,321.7 785.7,321.7 800.0,321.7" className="viz-blue" />
        <polyline points="470.0,320.9 484.3,321.0 498.7,321.1 513.0,321.3 527.4,321.5 541.7,321.7 556.1,321.7 570.4,321.7 584.8,321.7 599.1,321.7 613.5,321.7 627.8,321.7 642.2,321.7 656.5,321.7 670.9,321.7 685.2,321.7 699.6,321.7 713.9,321.7 728.3,321.7 742.6,321.7 757.0,321.7 771.3,321.7 785.7,321.7 800.0,321.7" className="viz-warn" />

        {/* markers where each lasso coefficient first hits exactly zero */}
        <circle cx={541.7} cy={321.7} r={4.5} className="viz-cell diag" />
        <circle cx={742.6} cy={321.7} r={4.5} className="viz-cell diag" />
        <circle cx={771.3} cy={321.7} r={4.5} className="viz-cell diag" />

        {/* legend */}
        <line x1={110} y1={385} x2={140} y2={385} className="viz-stroke" />
        <text x={148} y={389} className="viz-label-sm">strong signal (true effect 4)</text>
        <line x1={110} y1={405} x2={140} y2={405} className="viz-blue" />
        <text x={148} y={409} className="viz-label-sm">moderate signal (true effect 2)</text>
        <line x1={480} y1={385} x2={510} y2={385} className="viz-warn" />
        <text x={518} y={389} className="viz-label-sm">noise (true effect 0)</text>

        {/* axis captions */}
        <text x={265} y={430} className="viz-label" textAnchor="middle">Penalty strength (log scale, increasing)</text>
        <text x={635} y={430} className="viz-label" textAnchor="middle">Penalty strength (log scale, increasing)</text>
        <text x={40} y={200} className="viz-label" textAnchor="middle" transform="rotate(-90 40 200)">Coefficient value</text>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);
