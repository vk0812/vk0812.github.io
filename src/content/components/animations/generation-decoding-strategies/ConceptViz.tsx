import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke visuals for "Generation and Decoding Strategies".

   TemperatureReshapeDiagram and TopKToppCutoffDiagram are fully static bar
   charts (no GSAP), in the spirit of policy-gradients' ProbabilityPushDiagram,
   showing exactly the numbers the surrounding prose already walks through.

   BeamSearchTreeDiagram and SpeculativeDecodeDiagram are the two mechanisms
   in this post where the motion itself is the point, a tree that branches
   and gets pruned, and a draft-then-verify sequence that accepts or rejects
   token by token, so those two get real GSAP timelines using the same
   VizFigure/Api pattern as every other bespoke animation on the site.
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
function mkText(root: Element, str: string, x: number, y: number, cls = "viz-label", anchor = "middle") {
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
  delay?: number; // accepted for API parity; not used for in-view entrance
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
   TEMPERATURE RESHAPE — static bar chart, before/after dividing the same
   logits (2.0, 1.0, 0.7, 0.3) by temperature 1 versus 0.5. Numbers match the
   worked example in the surrounding prose exactly.
=========================================================================== */
export const TemperatureReshapeDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="mx-auto mb-8 max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 sm:p-5 shadow-sm">
      <svg viewBox="0 0 680 300" preserveAspectRatio="xMidYMid meet">
        <line x1={340} y1={45} x2={340} y2={285} className="viz-thin" strokeDasharray="4 4" />

        <text x={170} y={26} className="viz-phase" textAnchor="middle">TEMPERATURE = 1, ORIGINAL</text>
        <rect x={94} y={127.5} width={26} height={82.5} rx={4} className="viz-box" />
        <rect x={136} y={180} width={26} height={30} rx={4} className="viz-box" />
        <rect x={178} y={187.5} width={26} height={22.5} rx={4} className="viz-box" />
        <rect x={220} y={195} width={26} height={15} rx={4} className="viz-box" />
        <text x={107} y={240} className="viz-label-sm" textAnchor="middle">0.55</text>
        <text x={149} y={240} className="viz-label-sm" textAnchor="middle">0.20</text>
        <text x={191} y={240} className="viz-label-sm" textAnchor="middle">0.15</text>
        <text x={233} y={240} className="viz-label-sm" textAnchor="middle">0.10</text>
        <text x={107} y={268} className="viz-label" textAnchor="middle">mat</text>
        <text x={149} y={268} className="viz-label" textAnchor="middle">floor</text>
        <text x={191} y={268} className="viz-label" textAnchor="middle">roof</text>
        <text x={233} y={268} className="viz-label" textAnchor="middle">moon</text>

        <text x={510} y={26} className="viz-phase" textAnchor="middle">TEMPERATURE = 0.5, SHARPER</text>
        <rect x={434} y={90} width={26} height={120} rx={4} className="viz-box" />
        <rect x={476} y={193.5} width={26} height={16.5} rx={4} className="viz-box" />
        <rect x={518} y={201} width={26} height={9} rx={4} className="viz-box" />
        <rect x={560} y={205.5} width={26} height={4.5} rx={4} className="viz-box" />
        <text x={447} y={240} className="viz-label-sm" textAnchor="middle">0.80</text>
        <text x={489} y={240} className="viz-label-sm" textAnchor="middle">0.11</text>
        <text x={531} y={240} className="viz-label-sm" textAnchor="middle">0.06</text>
        <text x={573} y={240} className="viz-label-sm" textAnchor="middle">0.03</text>
        <text x={447} y={268} className="viz-label" textAnchor="middle">mat</text>
        <text x={489} y={268} className="viz-label" textAnchor="middle">floor</text>
        <text x={531} y={268} className="viz-label" textAnchor="middle">roof</text>
        <text x={573} y={268} className="viz-label" textAnchor="middle">moon</text>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);

/* ===========================================================================
   TOP-K / TOP-P CUTOFF — the same six sorted candidates (0.40, 0.25, 0.15,
   0.10, 0.06, 0.04), shown twice with a different survivor set each time.
   Top-k with k=3 always keeps a fixed count. Top-p with p=0.9 keeps however
   many tokens it takes to cross 90% cumulative probability, four here.
=========================================================================== */
export const TopKToppCutoffDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="mx-auto mb-8 max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 sm:p-5 shadow-sm">
      <svg viewBox="0 0 760 300" preserveAspectRatio="xMidYMid meet">
        <line x1={180} y1={40} x2={180} y2={290} className="viz-thin" strokeDasharray="4 4" />
        <line x1={600} y1={40} x2={600} y2={290} className="viz-thin" strokeDasharray="4 4" />

        <text x={180} y={26} className="viz-phase" textAnchor="middle">TOP-K, K = 3</text>
        <text x={192} y={55} className="viz-label-sm" textAnchor="start">keeps 3 of 6</text>
        <rect x={17} y={100} width={26} height={120} rx={4} className="viz-bar-pos" />
        <rect x={77} y={145} width={26} height={75} rx={4} className="viz-bar-pos" />
        <rect x={137} y={175} width={26} height={45} rx={4} className="viz-bar-pos" />
        <rect x={197} y={190} width={26} height={30} rx={4} className="viz-panel" />
        <rect x={257} y={202} width={26} height={18} rx={4} className="viz-panel" />
        <rect x={317} y={208} width={26} height={12} rx={4} className="viz-panel" />
        <text x={30} y={245} className="viz-label-sm" textAnchor="middle">0.40</text>
        <text x={90} y={245} className="viz-label-sm" textAnchor="middle">0.25</text>
        <text x={150} y={245} className="viz-label-sm" textAnchor="middle">0.15</text>
        <text x={210} y={245} className="viz-label-sm" textAnchor="middle">0.10</text>
        <text x={270} y={245} className="viz-label-sm" textAnchor="middle">0.06</text>
        <text x={330} y={245} className="viz-label-sm" textAnchor="middle">0.04</text>
        <text x={30} y={270} className="viz-label" textAnchor="middle">mat</text>
        <text x={90} y={270} className="viz-label" textAnchor="middle">rug</text>
        <text x={150} y={270} className="viz-label" textAnchor="middle">floor</text>
        <text x={210} y={270} className="viz-label" textAnchor="middle">carpet</text>
        <text x={270} y={270} className="viz-label" textAnchor="middle">roof</text>
        <text x={330} y={270} className="viz-label" textAnchor="middle">moon</text>

        <text x={540} y={26} className="viz-phase" textAnchor="middle">TOP-P, P = 0.9</text>
        <text x={608} y={55} className="viz-label-sm" textAnchor="start">keeps 4 of 6</text>
        <rect x={377} y={100} width={26} height={120} rx={4} className="viz-bar-pos" />
        <rect x={437} y={145} width={26} height={75} rx={4} className="viz-bar-pos" />
        <rect x={497} y={175} width={26} height={45} rx={4} className="viz-bar-pos" />
        <rect x={557} y={190} width={26} height={30} rx={4} className="viz-bar-pos" />
        <rect x={617} y={202} width={26} height={18} rx={4} className="viz-panel" />
        <rect x={677} y={208} width={26} height={12} rx={4} className="viz-panel" />
        <text x={390} y={245} className="viz-label-sm" textAnchor="middle">0.40</text>
        <text x={450} y={245} className="viz-label-sm" textAnchor="middle">0.25</text>
        <text x={510} y={245} className="viz-label-sm" textAnchor="middle">0.15</text>
        <text x={570} y={245} className="viz-label-sm" textAnchor="middle">0.10</text>
        <text x={630} y={245} className="viz-label-sm" textAnchor="middle">0.06</text>
        <text x={690} y={245} className="viz-label-sm" textAnchor="middle">0.04</text>
        <text x={390} y={270} className="viz-label" textAnchor="middle">mat</text>
        <text x={450} y={270} className="viz-label" textAnchor="middle">rug</text>
        <text x={510} y={270} className="viz-label" textAnchor="middle">floor</text>
        <text x={570} y={270} className="viz-label" textAnchor="middle">carpet</text>
        <text x={630} y={270} className="viz-label" textAnchor="middle">roof</text>
        <text x={690} y={270} className="viz-label" textAnchor="middle">moon</text>
      </svg>
    </div>
    <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
      {caption}
    </figcaption>
  </motion.figure>
);

/* ===========================================================================
   BEAM SEARCH TREE — beam width 2. Root branches into 3 candidates, prune to
   the top 2 cumulative scores, branch those 2 into 3 each, prune to the top 2
   again. Every score is a real running sum (root -0.2/-0.5/-1.2, then adding
   each child's own log-probability), verified by hand before wiring in.
=========================================================================== */
type BeamNode = { id: string; x: number; y: number; w: number; h: number; label: string; score?: string };

const BEAM_ROOT: BeamNode = { id: "root", x: 290, y: 45, w: 140, h: 40, label: "The weather" };
const BEAM_L1: BeamNode[] = [
  { id: "is", x: 135, y: 170, w: 90, h: 40, label: "is", score: "-0.2" },
  { id: "was", x: 315, y: 170, w: 90, h: 40, label: "was", score: "-0.5" },
  { id: "will", x: 495, y: 170, w: 90, h: 40, label: "will", score: "-1.2" },
];
const BEAM_L2: BeamNode[] = [
  { id: "sunny", x: 45, y: 320, w: 90, h: 40, label: "sunny", score: "-0.5" },
  { id: "cold", x: 151, y: 320, w: 90, h: 40, label: "cold", score: "-1.1" },
  { id: "great", x: 257, y: 320, w: 90, h: 40, label: "great", score: "-1.7" },
  { id: "nice", x: 363, y: 320, w: 90, h: 40, label: "nice", score: "-0.9" },
  { id: "terrible", x: 469, y: 320, w: 90, h: 40, label: "terrible", score: "-1.5" },
  { id: "cloudy", x: 575, y: 320, w: 90, h: 40, label: "cloudy", score: "-1.1" },
];
const BEAM_L1_EDGES = [
  { from: "is", to: "root" }, { from: "was", to: "root" }, { from: "will", to: "root" },
];
const BEAM_L2_EDGES = [
  { from: "sunny", to: "is" }, { from: "cold", to: "is" }, { from: "great", to: "is" },
  { from: "nice", to: "was" }, { from: "terrible", to: "was" }, { from: "cloudy", to: "was" },
];
const BEAM_L2_PRUNED = new Set(["cold", "great", "terrible", "cloudy"]);

function centerOf(n: BeamNode) {
  return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
}

function setupBeamSearch(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `beam-arrow-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 360, 18, "viz-phase");

  const rootC = centerOf(BEAM_ROOT);
  mk(svg, "rect", { x: BEAM_ROOT.x, y: BEAM_ROOT.y, width: BEAM_ROOT.w, height: BEAM_ROOT.h, rx: 8, class: "viz-box" });
  mkText(svg, BEAM_ROOT.label, rootC.x, rootC.y + 5, "viz-node-lbl");

  function buildEdge(fromNode: BeamNode, toNode: BeamNode) {
    const a = centerOf(fromNode);
    const b = centerOf(toNode);
    // shrink each end back toward the box edge so the arrow doesn't start/end inside the text
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;
    const x1 = a.x + ux * (fromNode.h / 2 + 2);
    const y1 = a.y + uy * (fromNode.h / 2 + 2);
    const x2 = b.x - ux * (toNode.h / 2 + 6);
    const y2 = b.y - uy * (toNode.h / 2 + 6);
    const ln = mk(svg, "line", {
      x1, y1, x2, y2, class: "viz-arrow-ink viz-stroke", "marker-end": `url(#beam-arrow-${uid})`,
    }) as SVGLineElement;
    const l = Math.hypot(x2 - x1, y2 - y1);
    ln.style.strokeDasharray = String(l);
    return { ln, len: l };
  }

  const l1Edges = BEAM_L1_EDGES.map((e) => {
    const child = BEAM_L1.find((n) => n.id === e.from)!;
    return { node: e.from, ...buildEdge(BEAM_ROOT, child) };
  });
  const l2Edges = BEAM_L2_EDGES.map((e) => {
    const parent = BEAM_L1.find((n) => n.id === e.to)!;
    const child = BEAM_L2.find((n) => n.id === e.from)!;
    return { node: e.from, ...buildEdge(parent, child) };
  });

  const l1Els = BEAM_L1.map((n) => {
    const c = centerOf(n);
    const rect = mk(svg, "rect", { x: n.x, y: n.y, width: n.w, height: n.h, rx: 8, class: "viz-box" }) as SVGRectElement;
    const label = mkText(svg, n.label, c.x, c.y - 2, "viz-node-lbl");
    const score = mkText(svg, `score ${n.score}`, c.x, c.y + 14, "viz-label-sm");
    return { id: n.id, rect, label, score, group: [rect, label, score] };
  });
  const l2Els = BEAM_L2.map((n) => {
    const c = centerOf(n);
    const rect = mk(svg, "rect", { x: n.x, y: n.y, width: n.w, height: n.h, rx: 8, class: "viz-box" }) as SVGRectElement;
    const label = mkText(svg, n.label, c.x, c.y - 2, "viz-node-lbl");
    const score = mkText(svg, `score ${n.score}`, c.x, c.y + 14, "viz-label-sm");
    return { id: n.id, rect, label, score, group: [rect, label, score] };
  });

  let tl: gsap.core.Timeline | null = null;
  let rate = 1;

  const play = () => {
    tl?.kill();
    phase.textContent = "";
    l1Edges.forEach(({ ln, len }) => gsap.set(ln, { opacity: 0, strokeDashoffset: len }));
    l2Edges.forEach(({ ln, len }) => gsap.set(ln, { opacity: 0, strokeDashoffset: len }));
    [...l1Els, ...l2Els].forEach((n) => { gsap.set(n.group, { opacity: 0 }); n.rect.setAttribute("class", "viz-box"); });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Start from the current beam, one sequence so far."; });
    tl.to({}, { duration: 0.7 });

    tl.add(() => { phase.textContent = "Expand it into every candidate next token."; });
    l1Edges.forEach(({ ln, len }, i) => tl.to(ln, { opacity: 1, strokeDashoffset: 0, duration: 0.35, ease: "none" }, i === 0 ? "<" : "<0.1"));
    l1Els.forEach((n, i) => tl.to(n.group, { opacity: 1, duration: 0.3 }, i === 0 ? "<0.1" : "<0.05"));
    tl.to({}, { duration: 0.7 });

    tl.add(() => { phase.textContent = "Beam width 2, keep the top 2 cumulative scores, is and was, prune will."; });
    const willEl = l1Els.find((n) => n.id === "will")!;
    tl.to(willEl.group, { opacity: 0.35, duration: 0.4 }, "<");
    tl.add(() => willEl.rect.setAttribute("class", "viz-panel"));
    const willEdge = l1Edges.find((e) => e.node === "will")!;
    tl.to(willEdge.ln, { opacity: 0.25, duration: 0.4 }, "<");
    tl.to({}, { duration: 0.7 });

    tl.add(() => { phase.textContent = "Expand each surviving beam again, is and was each get 3 children."; });
    l2Edges.forEach(({ ln, len }, i) => tl.to(ln, { opacity: 1, strokeDashoffset: 0, duration: 0.35, ease: "none" }, i === 0 ? "<" : "<0.08"));
    l2Els.forEach((n, i) => tl.to(n.group, { opacity: 1, duration: 0.3 }, i === 0 ? "<0.1" : "<0.04"));
    tl.to({}, { duration: 0.7 });

    tl.add(() => { phase.textContent = "Keep the new top 2 cumulative scores, prune the other 4."; });
    l2Els.forEach((n) => {
      if (BEAM_L2_PRUNED.has(n.id)) {
        tl.to(n.group, { opacity: 0.35, duration: 0.4 }, "<");
        tl.add(() => n.rect.setAttribute("class", "viz-panel"));
        const edge = l2Edges.find((e) => e.node === n.id)!;
        tl.to(edge.ln, { opacity: 0.25, duration: 0.4 }, "<");
      }
    });
    tl.to({}, { duration: 0.7 });

    tl.add(() => { phase.textContent = "is sunny wins at -0.5, was nice is the runner-up at -0.9."; });
    tl.to({}, { duration: 0.4 });

    tl.timeScale(rate);
  };

  play();

  return {
    play,
    pause: () => tl?.pause(),
    resume: () => tl?.play(),
    setRate: (r) => { rate = r; tl?.timeScale(r); },
    cleanup: () => tl?.kill(),
  };
}

export const BeamSearchTreeDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 720 400" maxW="max-w-2xl" delay={delay} setup={setupBeamSearch} />
);

/* ===========================================================================
   SPECULATIVE DECODE — a fast draft model proposes 4 tokens in a row, the
   target model verifies all 4 in a single forward pass, the first mismatch
   gets rejected and resampled, everything after it is discarded.
=========================================================================== */
function setupSpeculativeDecode(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const phase = mkText(svg, "", 400, 20, "viz-phase");

  mk(svg, "rect", { x: 40, y: 70, width: 200, height: 44, rx: 8, class: "viz-panel" });
  mkText(svg, "The capital of", 140, 88, "viz-label-sm");
  mkText(svg, "France is", 140, 104, "viz-label-sm");

  const draftWords = ["Paris", "which", "is", "big"];
  const draftX = [260, 386, 512, 638];
  const draftBoxes = draftWords.map((w, i) => {
    const rect = mk(svg, "rect", { x: draftX[i], y: 70, width: 110, height: 44, rx: 8, class: "viz-panel" }) as SVGRectElement;
    const label = mkText(svg, w, draftX[i] + 55, 96, "viz-node-lbl");
    gsap.set([rect, label], { opacity: 0 });
    return { rect, label, cx: draftX[i] + 55 };
  });

  const groupHighlight = mk(svg, "rect", {
    x: 250, y: 60, width: 508, height: 64, rx: 10, class: "viz-blue", fill: "none", "stroke-dasharray": "6 4",
  }) as SVGRectElement;
  gsap.set(groupHighlight, { opacity: 0 });

  const annWords = ["accepted", "accepted", "rejected", "discarded"];
  const annEls = annWords.map((w, i) => {
    const t = mkText(svg, w, draftX[i] + 55, 148, "viz-label-sm");
    gsap.set(t, { opacity: 0 });
    return t;
  });

  const bridge = mkText(svg, "the accepted prefix becomes the new context", 400, 213, "viz-label-sm");
  gsap.set(bridge, { opacity: 0 });

  const recapWords = ["Paris", "which", "known"];
  const recapX = [260, 386, 512];
  const recapBoxes = recapWords.map((w, i) => {
    const rect = mk(svg, "rect", { x: recapX[i], y: 240, width: 110, height: 44, rx: 8, class: "viz-box" }) as SVGRectElement;
    const label = mkText(svg, w, recapX[i] + 55, 266, "viz-node-lbl");
    gsap.set([rect, label], { opacity: 0 });
    return { rect, label };
  });
  const recapNote = mkText(svg, "3 tokens from 1 verification pass plus 1 resample", 400, 308, "viz-label-sm");
  gsap.set(recapNote, { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  let rate = 1;

  const play = () => {
    tl?.kill();
    phase.textContent = "";
    draftBoxes.forEach((b) => { gsap.set([b.rect, b.label], { opacity: 0 }); b.rect.setAttribute("class", "viz-panel"); });
    gsap.set(groupHighlight, { opacity: 0 });
    annEls.forEach((t) => gsap.set(t, { opacity: 0 }));
    gsap.set(bridge, { opacity: 0 });
    recapBoxes.forEach((b) => gsap.set([b.rect, b.label], { opacity: 0 }));
    gsap.set(recapNote, { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "A small draft model guesses several tokens ahead, quickly."; });
    draftBoxes.forEach((b, i) => tl.to([b.rect, b.label], { opacity: 1, duration: 0.25 }, i === 0 ? "<" : "<0.15"));
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "The target model checks all 4 positions in one forward pass."; });
    tl.to(groupHighlight, { opacity: 1, duration: 0.4 }, "<");
    tl.to({}, { duration: 0.7 });

    tl.add(() => {
      phase.textContent = "Accept while the draft agrees, reject and resample at the first mismatch.";
      draftBoxes[0].rect.setAttribute("class", "viz-box");
      draftBoxes[1].rect.setAttribute("class", "viz-box");
      draftBoxes[2].rect.setAttribute("class", "viz-panel-warn");
      draftBoxes[3].rect.setAttribute("class", "viz-panel");
    });
    annEls.forEach((t, i) => tl.to(t, { opacity: 1, duration: 0.3 }, i === 0 ? "<" : "<0.1"));
    tl.to([draftBoxes[3].rect, draftBoxes[3].label], { opacity: 0.35, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.7 });

    tl.add(() => { phase.textContent = "The rejected slot gets a fresh sample, everything after it is thrown away."; });
    tl.to(bridge, { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Net result, 3 verified tokens from 1 target pass instead of 3."; });
    recapBoxes.forEach((b, i) => tl.to([b.rect, b.label], { opacity: 1, duration: 0.3 }, i === 0 ? "<" : "<0.1"));
    tl.to(recapNote, { opacity: 1, duration: 0.3 }, "<0.2");
    tl.to({}, { duration: 0.4 });

    tl.timeScale(rate);
  };

  play();

  return {
    play,
    pause: () => tl?.pause(),
    resume: () => tl?.play(),
    setRate: (r) => { rate = r; tl?.timeScale(r); },
    cleanup: () => tl?.kill(),
  };
}

export const SpeculativeDecodeDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 800 330" maxW="max-w-2xl" delay={delay} setup={setupSpeculativeDecode} />
);
