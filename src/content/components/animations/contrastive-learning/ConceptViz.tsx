import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke visuals for "Contrastive Learning".
   Theme comes entirely from CSS vars (.viz / .dark .viz in index.css), colors
   are applied through the shared semantic classes (viz-img, viz-txt, viz-pull,
   viz-push, viz-cell, viz-box, viz-blue, viz-panel, viz-label...) so the whole
   set of figures reads correctly in both themes with nothing hardcoded.
---------------------------------------------------------------------------- */

const NS = "http://www.w3.org/2000/svg";
type Api = {
  play: () => void;
  pause: () => void;
  resume: () => void;
  setRate: (r: number) => void;
  cleanup: () => void;
};

function mk(root: Element, tag: string, attrs: Record<string, string | number> = {}) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  root.appendChild(n);
  return n;
}
function mkText(root: Element, str: string, x: number, y: number, cls = "viz-label", anchor = "start") {
  const t = mk(root, "text", { x, y, class: cls, "text-anchor": anchor });
  t.textContent = str;
  return t;
}

const CTRL = "font-mono text-xs tracking-widest h-8 px-3 inline-flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors rounded";
const CTRL_ON = "font-mono text-xs tracking-widest h-8 px-3 inline-flex items-center justify-center border border-foreground bg-foreground text-background rounded";

function VizFigure({
  caption, viewBox, maxW = "max-w-2xl", setup,
}: {
  caption: string;
  viewBox: string;
  maxW?: string;
  delay?: number;
  setup: (svg: SVGSVGElement) => Api;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const apiRef = useRef<Api | null>(null);
  const rateRef = useRef(1);
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);

  const doPlay = () => {
    const api = apiRef.current;
    if (!api) return;
    api.play();
    api.setRate(rateRef.current);
    setPlaying(true);
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const api = setup(svg);
    apiRef.current = api;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { doPlay(); io.disconnect(); } }),
      { threshold: 0.25 }
    );
    io.observe(svg);
    return () => { io.disconnect(); api.cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup]);

  const togglePlay = () => {
    const api = apiRef.current;
    if (!api) return;
    if (playing) { api.pause(); setPlaying(false); }
    else { api.resume(); setPlaying(true); }
  };
  const pickRate = (r: number) => {
    rateRef.current = r;
    setRate(r);
    apiRef.current?.setRate(r);
  };

  return (
    <motion.figure
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className={`mb-8 mx-auto ${maxW}`}
    >
      <div className="viz rounded-lg border border-border bg-card p-3 sm:p-5 shadow-sm">
        <svg ref={svgRef} viewBox={viewBox} preserveAspectRatio="xMidYMid meet" />
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button onClick={togglePlay} className={CTRL} style={{ minWidth: "5.5rem" }}>
            {playing ? "❚❚ PAUSE" : "▶ PLAY"}
          </button>
          <button onClick={doPlay} className={CTRL}>↻ REPLAY</button>
          <span className="w-px h-5 bg-border mx-1" aria-hidden />
          {[0.5, 1, 2].map((r) => (
            <button key={r} onClick={() => pickRate(r)} className={rate === r ? CTRL_ON : CTRL}>
              {r}×
            </button>
          ))}
        </div>
      </div>
      {caption && (
        <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">
          {caption}
        </figcaption>
      )}
    </motion.figure>
  );
}

/* ===========================================================================
   PULL / PUSH — the two operations contrastive learning ever does. Fully
   static (no GSAP), the geometry itself is the whole point, not motion.
=========================================================================== */
export const PullPushDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="mx-auto mb-8 max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 sm:p-5 shadow-sm">
      <svg viewBox="0 0 640 250" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="cl-pull-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="viz-arrow-blue" />
          </marker>
          <marker id="cl-push-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="viz-arrow-warn" />
          </marker>
        </defs>

        <line x1={320} y1={45} x2={320} y2={200} className="viz-thin" strokeDasharray="4 4" />

        {/* Pull panel */}
        <text x={160} y={26} className="viz-phase" textAnchor="middle">PULL, MATCHING PAIR</text>
        <path d="M122,128 Q140,112 148,108" fill="none" className="viz-pull" markerEnd="url(#cl-pull-arrow)" />
        <path d="M198,128 Q180,112 172,108" fill="none" className="viz-pull" markerEnd="url(#cl-pull-arrow)" />
        <rect x={92} y={138} width={16} height={16} rx={3} className="viz-img" />
        <circle cx={220} cy={150} r={8} className="viz-txt" />
        <text x={100} y={185} className="viz-label-sm" textAnchor="middle">image</text>
        <text x={220} y={185} className="viz-label-sm" textAnchor="middle">caption</text>
        <text x={160} y={215} className="viz-label-sm" textAnchor="middle">same meaning, pulled together</text>

        {/* Push panel */}
        <text x={480} y={26} className="viz-phase" textAnchor="middle">PUSH, NON-MATCHING PAIR</text>
        <path d="M402,128 Q385,112 376,108" fill="none" className="viz-push" markerEnd="url(#cl-push-arrow)" />
        <path d="M558,128 Q575,112 584,108" fill="none" className="viz-push" markerEnd="url(#cl-push-arrow)" />
        <rect x={412} y={138} width={16} height={16} rx={3} className="viz-img" />
        <circle cx={540} cy={150} r={8} className="viz-txt" />
        <text x={420} y={185} className="viz-label-sm" textAnchor="middle">image</text>
        <text x={540} y={185} className="viz-label-sm" textAnchor="middle">caption</text>
        <text x={480} y={215} className="viz-label-sm" textAnchor="middle">different meaning, pushed apart</text>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);

/* ===========================================================================
   SIMILARITY MATRIX — the single most important visual in the post. A real
   4x4 grid using the exact diagonal values from the prose (0.92, 0.94, 0.93
   for dog, lake, car, plus 0.95 for cat), GSAP reveals the diagonal lighting
   up and the rest dimming down, which is literally what training does.
=========================================================================== */
const LABELS = ["dog", "lake", "car", "cat"];
const VALUES = [
  [0.92, 0.18, 0.11, 0.24],
  [0.15, 0.94, 0.09, 0.05],
  [0.10, 0.08, 0.93, 0.13],
  [0.20, 0.06, 0.14, 0.95],
];

const GRID_X = 190;
const GRID_Y = 150;
const CELL_W = 96;
const CELL_H = 76;
const GAP = 8;
const colX = (j: number) => GRID_X + j * (CELL_W + GAP) + CELL_W / 2;
const rowY = (i: number) => GRID_Y + i * (CELL_H + GAP) + CELL_H / 2;

function setupSimilarityMatrix(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const phase = mkText(svg, "", 320, 30, "viz-phase", "middle");
  mkText(svg, "CAPTIONS", 394, 85, "viz-label-sm", "middle");
  mkText(svg, "IMAGES", 60, 115, "viz-label-sm", "middle");

  const colLabels = LABELS.map((l, j) => {
    const t = mkText(svg, l, colX(j), 115, "viz-label", "middle") as SVGTextElement;
    gsap.set(t, { opacity: 0 });
    return t;
  });
  const rowLabels = LABELS.map((l, i) => {
    const t = mkText(svg, l, GRID_X - 30, rowY(i) + 4, "viz-label", "end") as SVGTextElement;
    gsap.set(t, { opacity: 0 });
    return t;
  });

  type Cell = { rect: SVGRectElement; text: SVGTextElement; overlay?: SVGRectElement; ring?: SVGRectElement };
  const cells: Cell[][] = [];
  for (let i = 0; i < 4; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < 4; j++) {
      const x = GRID_X + j * (CELL_W + GAP);
      const y = GRID_Y + i * (CELL_H + GAP);
      const rect = mk(svg, "rect", { x, y, width: CELL_W, height: CELL_H, rx: 8, class: "viz-panel", opacity: 0 }) as SVGRectElement;
      const isDiag = i === j;
      const text = mkText(svg, VALUES[i][j].toFixed(2), colX(j), rowY(i) + 5, isDiag ? "viz-num" : "viz-label", "middle") as SVGTextElement;
      gsap.set([rect, text], { opacity: 0 });
      let overlay: SVGRectElement | undefined;
      let ring: SVGRectElement | undefined;
      if (isDiag) {
        overlay = mk(svg, "rect", { x, y, width: CELL_W, height: CELL_H, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
        ring = mk(svg, "rect", { x: x - 4, y: y - 4, width: CELL_W + 8, height: CELL_H + 8, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
        // keep the number readable on top of the overlay
        svg.appendChild(text);
      }
      row.push({ rect, text, overlay, ring });
    }
    cells.push(row);
  }

  mkText(svg, "rows are images, columns are captions", 394, 500, "viz-label-sm", "middle");
  mkText(svg, "the diagonal is the true match for every row", 394, 520, "viz-label-sm", "middle");

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([...colLabels, ...rowLabels], { opacity: 0 });
    cells.forEach((row) =>
      row.forEach((c) => {
        gsap.set([c.rect, c.text], { opacity: 0 });
        if (c.overlay) gsap.set(c.overlay, { opacity: 0 });
        if (c.ring) gsap.set(c.ring, { opacity: 0 });
      })
    );

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Every image gets compared against every caption in the batch"; });
    tl.to([...colLabels, ...rowLabels], { opacity: 1, duration: 0.4, stagger: 0.03 }, "<");
    cells.forEach((row, i) =>
      row.forEach((c, j) => {
        tl.to([c.rect, c.text], { opacity: 1, duration: 0.3 }, `<${(i * 4 + j) * 0.02}`);
      })
    );
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Training pushes the true match on each row up"; });
    cells.forEach((row, i) => {
      const c = row[i];
      if (!c.overlay || !c.ring) return;
      tl.to(c.overlay, { opacity: 1, duration: 0.35 }, i === 0 ? "<" : "<0.1");
      tl.to(c.ring, { opacity: 1, duration: 0.35 }, "<");
    });
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "...and every other pairing down, until the diagonal is all that's bright"; });
    cells.forEach((row, i) =>
      row.forEach((c, j) => {
        if (i === j) return;
        tl.to(c.text, { opacity: 0.35, duration: 0.4 }, i === 0 && j === 1 ? "<" : "<0.02");
      })
    );
    cells.forEach((row, i) => {
      const c = row[i];
      if (c.ring) tl.to(c.ring, { opacity: 0.4, duration: 0.5, yoyo: true, repeat: 3 }, "<");
    });

    tl.timeScale(rate);
  };

  let rate = 1;
  play();

  return {
    play,
    pause: () => tl?.pause(),
    resume: () => tl?.play(),
    setRate: (r) => { rate = r; tl?.timeScale(r); },
    cleanup: () => tl?.kill(),
  };
}

export const SimilarityMatrixDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 640 540" maxW="max-w-2xl" delay={delay} setup={setupSimilarityMatrix} />
);

/* ===========================================================================
   EMBEDDING CLUSTERS — after training, points group by meaning. Static
   fade-in, three labeled clusters built from the post's running example
   (dog, mountain lake, cat), squares mark image points, circles mark
   caption points.
=========================================================================== */
const CLUSTERS: {
  id: string;
  label: string;
  cx: number;
  cy: number;
  image: [number, number];
  caption: [number, number];
  labelY: number;
}[] = [
  { id: "dog", label: "dog", cx: 150, cy: 190, image: [135, 180], caption: [168, 200], labelY: 288 },
  { id: "mountain", label: "mountain", cx: 480, cy: 140, image: [462, 128], caption: [498, 152], labelY: 238 },
  { id: "cat", label: "cat", cx: 330, cy: 290, image: [312, 278], caption: [348, 302], labelY: 388 },
];

export const EmbeddingClusterDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.5, delay }}
    className="mx-auto mb-8 max-w-2xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 sm:p-5 shadow-sm">
      <svg viewBox="0 0 640 460" preserveAspectRatio="xMidYMid meet">
        <text x={320} y={26} className="viz-phase" textAnchor="middle">
          EMBEDDING SPACE AFTER TRAINING
        </text>

        {CLUSTERS.map((c) => (
          <g key={c.id}>
            <circle cx={c.cx} cy={c.cy} r={70} fill="none" className="viz-thin" strokeDasharray="5 5" />
            <rect x={c.image[0] - 6} y={c.image[1] - 6} width={12} height={12} rx={3} className="viz-img" />
            <circle cx={c.caption[0]} cy={c.caption[1]} r={6} className="viz-txt" />
            <text x={c.cx} y={c.labelY} className="viz-label" textAnchor="middle">
              {c.label}
            </text>
          </g>
        ))}

        <text x={320} y={430} className="viz-label-sm" textAnchor="middle">
          squares are image embeddings, circles are caption embeddings
        </text>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);
