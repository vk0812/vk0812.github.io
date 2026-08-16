import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   Blueprint concept visual for "CAP Theorem". Same shell as
   animations/designing-messenger/ConceptViz.tsx's MessageAckChainDiagram,
   theme comes entirely from CSS vars (.viz / .dark .viz in index.css). This
   is a fully static figure (no GSAP timeline, no play controls), a plain
   labeled SVG triangle, since nothing here needs to move to make its point.
---------------------------------------------------------------------------- */

/* ===========================================================================
   CAP TRIANGLE — Consistency, Availability, and Partition tolerance at the
   three corners. Each edge names the pair of properties a system keeps when
   it gives up the property at the opposite corner.
=========================================================================== */
export const CapTriangleDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8 mx-auto max-w-2xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 sm:p-5 shadow-sm">
      <svg viewBox="0 0 800 620" className="w-full h-auto">
        <polygon points="400,120 160,500 640,500" className="viz-panel" />

        {/* mid-edge tradeoff labels, inside the triangle, clear of every stroke */}
        <text x="320" y="323" textAnchor="middle" className="viz-node-lbl">CA</text>
        <text x="320" y="341" textAnchor="middle" className="viz-label-sm">single node</text>

        <text x="480" y="323" textAnchor="middle" className="viz-node-lbl">CP</text>
        <text x="480" y="341" textAnchor="middle" className="viz-label-sm">blocks on split</text>

        <text x="400" y="447" textAnchor="middle" className="viz-node-lbl">AP</text>
        <text x="400" y="465" textAnchor="middle" className="viz-label-sm">always answers</text>

        {/* corner boxes, one per property */}
        <rect x="290" y="30" width="220" height="60" rx="10" className="viz-box" />
        <text x="400" y="55" textAnchor="middle" className="viz-node-lbl">Consistency</text>
        <text x="400" y="75" textAnchor="middle" className="viz-label-sm">(C)</text>

        <rect x="50" y="530" width="220" height="60" rx="10" className="viz-box" />
        <text x="160" y="555" textAnchor="middle" className="viz-node-lbl">Availability</text>
        <text x="160" y="575" textAnchor="middle" className="viz-label-sm">(A)</text>

        <rect x="530" y="530" width="220" height="60" rx="10" className="viz-box" />
        <text x="640" y="555" textAnchor="middle" className="viz-node-lbl">Partition tolerance</text>
        <text x="640" y="575" textAnchor="middle" className="viz-label-sm">(P)</text>
      </svg>
    </div>
    {caption && (
      <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">
        {caption}
      </figcaption>
    )}
  </motion.figure>
);
