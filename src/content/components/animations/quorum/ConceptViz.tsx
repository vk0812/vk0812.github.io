import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animation for "Quorum". Same shell as
   animations/url-shortener/ConceptViz.tsx, theme comes entirely from CSS vars
   (.viz / .dark .viz in index.css), plays once when scrolled into view.
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
  caption, viewBox, maxW = "max-w-3xl", setup,
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
   QUORUM OVERLAP — five replicas, a write that reaches W = 3 of them, a read
   that reaches R = 3 of them, and the guaranteed overlap (nodes 2 and 3) that
   proves W + R > N always hands a read at least one node with the latest
   write. Structure and motion are the point here, so this stays a live
   build-up rather than a static figure.
=========================================================================== */
function setupQuorumOverlap(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `qo-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 24, "viz-phase", "middle");

  const NODE_Y = 190;
  const NODE_W = 120;
  const NODE_H = 70;
  const centers = [150, 300, 450, 600, 750];

  const nodeBoxes = centers.map((cx, i) => {
    const box = mk(svg, "rect", {
      x: cx - NODE_W / 2, y: NODE_Y, width: NODE_W, height: NODE_H, rx: 8, class: "viz-box", opacity: 0,
    }) as SVGRectElement;
    const lbl = mkText(svg, `Node ${i + 1}`, cx, NODE_Y + NODE_H / 2 + 4, "viz-node-lbl", "middle") as SVGTextElement;
    gsap.set(lbl, { opacity: 0 });
    return { box, lbl, cx };
  });

  // write ring (blue, inner) on nodes 1, 2, 3
  const writeRingIdx = [0, 1, 2];
  const writeRings = writeRingIdx.map((i) => {
    const cx = centers[i];
    return mk(svg, "rect", {
      x: cx - NODE_W / 2 - 6, y: NODE_Y - 6, width: NODE_W + 12, height: NODE_H + 12, rx: 14, class: "viz-blue", opacity: 0,
    }) as SVGRectElement;
  });

  // read ring (warn, outer) on nodes 2, 3, 4
  const readRingIdx = [1, 2, 3];
  const readRings = readRingIdx.map((i) => {
    const cx = centers[i];
    return mk(svg, "rect", {
      x: cx - NODE_W / 2 - 12, y: NODE_Y - 12, width: NODE_W + 24, height: NODE_H + 24, rx: 18, class: "viz-warn", opacity: 0,
    }) as SVGRectElement;
  });

  // overlap nodes (both rings): index 1, 2 -> Node 2, Node 3
  const overlapWriteRings = [writeRings[1], writeRings[2]];
  const overlapReadRings = [readRings[0], readRings[1]];

  const writeBox = mk(svg, "rect", { x: 190, y: 54, width: 220, height: 50, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const writeLbl = mkText(svg, "Write (W = 3)", 300, 84, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(writeLbl, { opacity: 0 });

  const readBox = mk(svg, "rect", { x: 340, y: 300, width: 220, height: 50, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const readLbl = mkText(svg, "Read (R = 3)", 450, 330, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(readLbl, { opacity: 0 });

  type Arrow = { line: SVGLineElement; len: number };
  const mkArrow = (x1: number, y1: number, x2: number, y2: number): Arrow => {
    const line = mk(svg, "line", {
      x1, y1, x2, y2, class: "viz-stroke", "marker-end": `url(#qo-${uid})`, opacity: 0,
    }) as SVGLineElement;
    const len = Math.hypot(x2 - x1, y2 - y1);
    line.style.strokeDasharray = String(len);
    return { line, len };
  };

  const writeArrows: Arrow[] = [
    mkArrow(190, 104, 150, 190),
    mkArrow(300, 104, 300, 190),
    mkArrow(410, 104, 450, 190),
  ];
  const readArrows: Arrow[] = [
    mkArrow(340, 300, 300, 260),
    mkArrow(450, 300, 450, 260),
    mkArrow(560, 300, 600, 260),
  ];

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    nodeBoxes.forEach(({ box, lbl }) => gsap.set([box, lbl], { opacity: 0 }));
    [...writeRings, ...readRings].forEach((r) => gsap.set(r, { opacity: 0 }));
    gsap.set([writeBox, writeLbl, readBox, readLbl], { opacity: 0 });
    [...writeArrows, ...readArrows].forEach((a) => {
      gsap.set(a.line, { opacity: 0 });
      a.line.style.strokeDashoffset = String(a.len);
    });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Five replicas hold the same key"; });
    tl.to(
      nodeBoxes.flatMap(({ box, lbl }) => [box, lbl]),
      { opacity: 1, duration: 0.3, stagger: 0.06 },
      "<"
    );
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "A write must reach W = 3 nodes before it is acknowledged"; });
    tl.to([writeBox, writeLbl], { opacity: 1, duration: 0.3 }, "<");
    writeArrows.forEach((a, i) => {
      tl.to(a.line, { opacity: 1, duration: 0.05 }, i === 0 ? "<0.15" : "<0.08");
      tl.to(a.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    });
    tl.to(writeRings, { opacity: 1, duration: 0.3, stagger: 0.08 }, "<0.15");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "A read queries R = 3 nodes and waits for their responses"; });
    tl.to([readBox, readLbl], { opacity: 1, duration: 0.3 }, "<");
    readArrows.forEach((a, i) => {
      tl.to(a.line, { opacity: 1, duration: 0.05 }, i === 0 ? "<0.15" : "<0.08");
      tl.to(a.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    });
    tl.to(readRings, { opacity: 1, duration: 0.3, stagger: 0.08 }, "<0.15");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Nodes 2 and 3 are in both sets, the guaranteed overlap"; });
    tl.to([...overlapWriteRings, ...overlapReadRings], { opacity: 0.35, duration: 0.4, yoyo: true, repeat: 3 }, "<");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Every read is guaranteed to touch a node with the latest write"; });

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

export const QuorumOverlapDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 400" maxW="max-w-2xl" delay={delay} setup={setupQuorumOverlap} />
);
