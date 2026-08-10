import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke animation for the Distributed Training post.
   Ring all-reduce, one gradient chunk moving around a 4-worker ring through
   the reduce-scatter phase (accumulating a running sum hop by hop) and then
   the all-gather phase (the finished sum copied the rest of the way around).
   Theme comes entirely from CSS vars (.viz / .dark .viz in index.css), so the
   same SVG reads correctly in both light and dark mode.
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
   RING ALL-REDUCE, one gradient chunk's trip around a 4-worker ring.
   Reduce-scatter (3 hops): the chunk accumulates each worker's own local
   value as it travels clockwise. All-gather (3 more hops): the finished sum
   is copied the rest of the way around so every worker ends up holding it.
   Values are fixed and verified by hand, 3 + 5 + 2 + 4 = 14. Node boxes and
   edge coordinates below were checked offline with scripts/check-svg-layout.py
   against this exact layout, zero collisions.
=========================================================================== */
function setupRingAllReduce(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const arrowInk = mk(defs, "marker", {
    id: `ra-ink-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(arrowInk, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });
  const arrowBlue = mk(defs, "marker", {
    id: `ra-blue-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(arrowBlue, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-blue" });

  const phase = mkText(svg, "", 450, 26, "viz-phase", "middle");

  // Workers arranged as a ring: top, right, bottom, left.
  const LOCAL = [3, 5, 2, 4]; // W0..W3 local values, 3 + 5 + 2 + 4 = 14
  const centers = [
    { x: 450, y: 110 }, // W0 top
    { x: 660, y: 320 }, // W1 right
    { x: 450, y: 530 }, // W2 bottom
    { x: 240, y: 320 }, // W3 left
  ];
  const BW = 160, BH = 90;

  type Worker = { ring: SVGRectElement; valueText: SVGTextElement };

  const workers: Worker[] = centers.map((c, i) => {
    const ring = mk(svg, "rect", {
      x: c.x - BW / 2 - 6, y: c.y - BH / 2 - 6, width: BW + 12, height: BH + 12,
      rx: 14, class: "viz-blue", fill: "none", opacity: 0,
    }) as SVGRectElement;
    mk(svg, "rect", { x: c.x - BW / 2, y: c.y - BH / 2, width: BW, height: BH, rx: 10, class: "viz-box" });
    mkText(svg, `Worker ${i}`, c.x, c.y - 12, "viz-node-lbl", "middle");
    const valueText = mkText(svg, `chunk = ${LOCAL[i]}`, c.x, c.y + 18, "viz-label", "middle") as SVGTextElement;
    return { ring, valueText };
  });

  // Ring edges, clipped to box boundary. Coordinates verified offline, see
  // the comment block above.
  const edgePoints: [{ x: number; y: number }, { x: number; y: number }][] = [
    [{ x: 495, y: 155 }, { x: 615, y: 275 }], // W0 -> W1
    [{ x: 615, y: 365 }, { x: 495, y: 485 }], // W1 -> W2
    [{ x: 405, y: 485 }, { x: 285, y: 365 }], // W2 -> W3
    [{ x: 285, y: 275 }, { x: 405, y: 155 }], // W3 -> W0
  ];

  type Edge = { glow: SVGLineElement; len: number };

  const edges: Edge[] = edgePoints.map(([p1, p2]) => {
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    mk(svg, "line", {
      x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, class: "viz-stroke",
      "stroke-dasharray": "4 4", "marker-end": `url(#ra-ink-${uid})`,
    });
    const glow = mk(svg, "line", {
      x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, class: "viz-blue",
      "marker-end": `url(#ra-blue-${uid})`, opacity: 0,
    }) as SVGLineElement;
    glow.style.strokeDasharray = String(len);
    return { glow, len };
  });

  // Hop order around the ring: reduce-scatter uses edges 0,1,2, all-gather
  // continues around the same ring using edges 3,0,1.
  const hopOrder = [0, 1, 2, 3, 0, 1];
  const arrivalWorker = [1, 2, 3, 0, 1, 2];
  const runningValue = [8, 10, 14, 14, 14, 14];
  const isFinal = [false, false, true, true, true, true];
  const hopNote = [
    "Worker 1 adds its own local value, running sum is 8",
    "Worker 2 adds its own local value, running sum is 10",
    "Worker 3 adds the last piece, this chunk is now fully summed at 14",
    "Reduce-scatter is done, all-gather begins, the sum copies back to worker 0",
    "The finished sum copies on to worker 1",
    "The finished sum copies on to worker 2, every worker now holds it",
  ];

  let tl: gsap.core.Timeline | null = null;

  const play = () => {
    tl?.kill();
    phase.textContent = "";
    workers.forEach((w, i) => {
      gsap.set(w.ring, { opacity: 0 });
      w.valueText.textContent = `chunk = ${LOCAL[i]}`;
    });
    edges.forEach((e) => {
      gsap.set(e.glow, { opacity: 0 });
      e.glow.style.strokeDashoffset = String(e.len);
    });

    tl = gsap.timeline();

    tl.add(() => {
      phase.textContent = "Four workers, each starts with its own local gradient chunk";
    });
    tl.to(workers[0].ring, { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.6 });
    tl.to(workers[0].ring, { opacity: 0, duration: 0.4 }, ">");

    hopOrder.forEach((edgeIdx, hop) => {
      const e = edges[edgeIdx];
      const w = workers[arrivalWorker[hop]];
      tl.add(() => {
        phase.textContent = hopNote[hop];
        gsap.set(e.glow, { strokeDashoffset: e.len, opacity: 0 });
      }, ">0.1");
      tl.to(e.glow, { opacity: 1, duration: 0.05 }, "<");
      tl.to(e.glow, { strokeDashoffset: 0, duration: 0.45, ease: "none" }, "<");
      tl.add(() => {
        w.valueText.textContent = `chunk = ${runningValue[hop]}`;
      }, ">-0.05");
      tl.to(w.ring, { opacity: 1, duration: 0.3 }, "<");
      if (!isFinal[hop]) {
        tl.to(w.ring, { opacity: 0, duration: 0.4 }, ">0.3");
      }
      tl.to(e.glow, { opacity: 0, duration: 0.3 }, ">0.15");
      tl.to({}, { duration: 0.35 });
    });

    tl.add(() => {
      phase.textContent = "All four workers now hold the same fully summed chunk";
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

export const RingAllReduceDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 610" maxW="max-w-2xl" delay={delay} setup={setupRingAllReduce} />
);
