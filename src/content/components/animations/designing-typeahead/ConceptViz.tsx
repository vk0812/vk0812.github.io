import { motion } from "framer-motion";
import type { ReactNode } from "react";

const NODE = "fill-[var(--v-blue-soft)] stroke-[var(--v-ink)]";
const NODE_TEXT = "fill-[var(--v-ink)] font-mono text-[18px] font-semibold";
const LABEL = "fill-[var(--v-ink)] font-sans text-[13px]";
const MUTED = "fill-[var(--v-ink)] opacity-60 font-sans text-[12px]";
const LINE = "stroke-[var(--v-ink)] opacity-70";

const Arrow = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} className={LINE} strokeWidth="2" markerEnd="url(#typeahead-arrow)" />
);

const Box = ({
  x,
  y,
  label,
  width = 64,
  height = 42,
  className = NODE,
}: {
  x: number;
  y: number;
  label: string;
  width?: number;
  height?: number;
  className?: string;
}) => (
  <g>
    <rect x={x - width / 2} y={y - height / 2} width={width} height={height} rx="14" className={className} strokeWidth="1.5" />
    <text x={x} y={y + 6} textAnchor="middle" className={NODE_TEXT}>{label}</text>
  </g>
);

const Frame = ({
  caption,
  children,
  viewBox = "0 0 900 560",
  maxW = "max-w-3xl",
}: {
  caption: string;
  children: ReactNode;
  viewBox?: string;
  maxW?: string;
}) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4 }}
    className={`not-prose my-10 mx-auto ${maxW}`}
  >
    <div className="viz rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
      <svg viewBox={viewBox} className="w-full h-auto" role="img" aria-label={caption}>
        <defs>
          <marker id="typeahead-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-[var(--v-ink)]" />
          </marker>
        </defs>
        {children}
      </svg>
    </div>
    <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">{caption}</figcaption>
  </motion.figure>
);

export const TrieStructureDiagram = ({ caption }: { caption: string }) => (
  <Frame caption={caption} viewBox="0 0 900 740">
    <text x="450" y="28" textAnchor="middle" className="viz-phase">Shared prefixes live on shared paths</text>

    <Box x={450} y={78} label="root" width={98} />
    <Arrow x1={450} y1={99} x2={450} y2={135} />
    <Box x={450} y={158} label="C" />
    <Arrow x1={450} y1={179} x2={450} y2={215} />
    <Box x={450} y={238} label="A" />

    <Arrow x1={430} y1={258} x2={320} y2={307} />
    <Arrow x1={470} y1={258} x2={600} y2={307} />
    <Box x={320} y={330} label="P" />
    <Box x={600} y={330} label="T" />

    <Arrow x1={320} y1={351} x2={220} y2={397} />
    <Arrow x1={320} y1={351} x2={420} y2={397} />
    <Box x={220} y={420} label="T" />
    <Box x={420} y={420} label="A" />

    <Arrow x1={220} y1={441} x2={220} y2={487} />
    <Box x={220} y={510} label="I" />
    <Arrow x1={420} y1={441} x2={360} y2={487} />
    <Arrow x1={420} y1={441} x2={500} y2={487} />
    <Box x={360} y={510} label="I" />
    <Box x={500} y={510} label="L" />

    <Arrow x1={220} y1={531} x2={220} y2={577} />
    <Arrow x1={360} y1={531} x2={360} y2={577} />
    <Box x={220} y={600} label="O" />
    <Box x={360} y={600} label="N" />

    <Arrow x1={220} y1={621} x2={220} y2={642} />
    <Box x={220} y={655} label="N" />

    <text x={220} y={714} textAnchor="middle" className={MUTED}>CAPTION</text>
    <text x={360} y={714} textAnchor="middle" className={MUTED}>CAPTAIN</text>
    <text x={500} y={548} textAnchor="middle" className={MUTED}>CAPITAL</text>
    <text x={600} y={390} textAnchor="middle" className={MUTED}>CAT</text>
  </Frame>
);

export const TrieTopKDiagram = ({ caption }: { caption: string }) => (
  <Frame caption={caption} viewBox="0 0 900 520">
    <text x="450" y="28" textAnchor="middle" className="viz-phase">The cap node stores references, not full strings</text>

    <Box x={130} y={130} label="cap" width={92} height={48} />
    <text x={130} y={176} textAnchor="middle" className={MUTED}>prefix node</text>

    <Arrow x1={176} y1={130} x2={292} y2={130} />
    <rect x="280" y="100" width="300" height="60" rx="12" className="viz-panel" strokeWidth="1.5" />
    <text x="430" y="126" textAnchor="middle" className={LABEL}>top-K references</text>
    <text x="430" y="146" textAnchor="middle" className={MUTED}>[terminal n] [terminal l] [terminal n]</text>

    <text x="130" y="260" textAnchor="middle" className={LABEL}>parent pointers rebuild the word</text>
    <Box x={250} y={330} label="n" width={54} className="viz-box" />
    <Box x={250} y={400} label="l" width={54} className="viz-box" />
    <Box x={250} y={470} label="n" width={54} className="viz-box" />

    <Arrow x1={410} y1={160} x2={250} y2={307} />
    <Arrow x1={410} y1={160} x2={250} y2={377} />
    <Arrow x1={410} y1={160} x2={250} y2={447} />

    <rect x="390" y="282" width="390" height="64" rx="12" className="viz-box" />
    <text x="585" y="310" textAnchor="middle" className={LABEL}>terminal n → ... → c a p → CAPTION</text>
    <text x="585" y="330" textAnchor="middle" className={MUTED}>walk parent links from terminal node</text>
    <rect x="390" y="352" width="390" height="64" rx="12" className="viz-box" />
    <text x="585" y="380" textAnchor="middle" className={LABEL}>terminal l → ... → c a p → CAPITAL</text>
    <rect x="390" y="422" width="390" height="64" rx="12" className="viz-box" />
    <text x="585" y="450" textAnchor="middle" className={LABEL}>terminal n → ... → c a p → CAPTAIN</text>

    <line x1="277" y1="330" x2="390" y2="314" className="viz-pull" />
    <line x1="277" y1="400" x2="390" y2="384" className="viz-pull" />
    <line x1="277" y1="470" x2="390" y2="454" className="viz-pull" />
  </Frame>
);

export const TrieSerializationDiagram = ({ caption }: { caption: string }) => (
  <Frame caption={caption} viewBox="0 0 900 560">
    <text x="450" y="28" textAnchor="middle" className="viz-phase">Serialize the tree, then rebuild it after a restart</text>

    <Box x={450} y={92} label="root" width={98} />
    <Arrow x1={450} y1={113} x2={450} y2={158} />
    <Box x={450} y={182} label="C" />
    <Arrow x1={430} y1={203} x2={310} y2={252} />
    <Arrow x1={470} y1={203} x2={590} y2={252} />
    <Box x={310} y={275} label="A" />
    <Box x={590} y={275} label="O" />
    <Arrow x1={310} y1={296} x2={240} y2={345} />
    <Arrow x1={310} y1={296} x2={380} y2={345} />
    <Arrow x1={590} y1={296} x2={590} y2={345} />
    <Box x={240} y={368} label="R" />
    <Box x={380} y={368} label="P" />
    <Box x={590} y={368} label="D" />
    <Arrow x1={240} y1={389} x2={240} y2={430} />
    <Box x={240} y={453} label="T" />

    <line x1="70" y1="470" x2="830" y2="470" className="viz-thin" />
    {["C2", "A2", "R1", "T", "P", "O1", "D"].map((token, index) => {
      const x = 120 + index * 110;
      return (
        <g key={token}>
          <rect x={x - 35} y="485" width="70" height="28" rx="8" className="viz-panel" strokeWidth="1.2" />
          <text x={x} y="504" textAnchor="middle" className="viz-node-lbl">{token}</text>
        </g>
      );
    })}
    <text x="450" y="542" textAnchor="middle" className={MUTED}>child counts make the serialized stream unambiguous</text>
  </Frame>
);
