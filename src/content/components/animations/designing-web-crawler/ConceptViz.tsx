import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animations for the web crawler case study.
   Theme comes entirely from CSS vars (.viz / .dark .viz in index.css), so the
   same SVG reads black+blue in light mode and white+blue in dark mode.
   Each animation plays once when scrolled into view; a replay button restarts.
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

/* ===========================================================================
   Shared figure wrapper: framer-motion entrance + in-view trigger + replay
=========================================================================== */
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
   FRONTIER POLITENESS — priority front queue feeds two per-host back queues,
   each pacing itself independently. A fast host's queue unlocks quickly, a
   slower host's queue stays locked longer, and neither blocks the other.
=========================================================================== */
function setupFrontierPoliteness(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `fp-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 24, "viz-phase", "middle");

  // Front queue
  mk(svg, "rect", { x: 340, y: 70, width: 220, height: 72, rx: 14, class: "viz-box" });
  mkText(svg, "URL Frontier", 450, 100, "viz-node-lbl", "middle");
  mkText(svg, "priority order", 450, 122, "viz-label-sm", "middle");

  const arrowA = mk(svg, "line", {
    x1: 390, y1: 142, x2: 230, y2: 204, class: "viz-stroke", "marker-end": `url(#fp-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenA = Math.hypot(390 - 230, 204 - 142);
  arrowA.style.strokeDasharray = String(lenA);

  const arrowB = mk(svg, "line", {
    x1: 510, y1: 142, x2: 670, y2: 204, class: "viz-stroke", "marker-end": `url(#fp-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenB = Math.hypot(670 - 510, 204 - 142);
  arrowB.style.strokeDasharray = String(lenB);

  function buildLane(x: number, host: string, delayLabel: string) {
    const backBox = mk(svg, "rect", { x: x - 100, y: 204, width: 200, height: 96, rx: 14, class: "viz-box", opacity: 0 }) as SVGRectElement;
    const hostLbl = mkText(svg, host, x, 232, "viz-node-lbl", "middle") as SVGTextElement;
    const delayLbl = mkText(svg, delayLabel, x, 256, "viz-label-sm", "middle") as SVGTextElement;
    const lockLbl = mkText(svg, "locked", x, 282, "viz-warn-lbl", "middle") as SVGTextElement;
    const readyLbl = mkText(svg, "ready", x, 282, "viz-label", "middle") as SVGTextElement;
    const lockRing = mk(svg, "rect", { x: x - 106, y: 198, width: 212, height: 108, rx: 18, class: "viz-warn", fill: "none", opacity: 0 }) as SVGRectElement;
    const readyRing = mk(svg, "rect", { x: x - 106, y: 198, width: 212, height: 108, rx: 18, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;

    const dropArrow = mk(svg, "line", {
      x1: x, y1: 300, x2: x, y2: 390, class: "viz-stroke", "marker-end": `url(#fp-${uid})`, opacity: 0,
    }) as SVGLineElement;
    const lenDrop = 90;
    dropArrow.style.strokeDasharray = String(lenDrop);

    const fetchBox = mk(svg, "rect", { x: x - 75, y: 390, width: 150, height: 60, rx: 12, class: "viz-panel", opacity: 0 }) as SVGRectElement;
    const fetchLbl = mkText(svg, "Fetch Worker", x, 414, "viz-node-lbl", "middle") as SVGTextElement;
    const fetchedLbl = mkText(svg, "one page fetched", x, 436, "viz-label-sm", "middle") as SVGTextElement;

    return { backBox, hostLbl, delayLbl, lockLbl, readyLbl, lockRing, readyRing, dropArrow, lenDrop, fetchBox, fetchLbl, fetchedLbl };
  }

  const laneA = buildLane(230, "example.com", "crawl-delay 2s");
  const laneB = buildLane(670, "news.example", "crawl-delay 5s");

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([arrowA, arrowB], { opacity: 0 });
    arrowA.style.strokeDashoffset = String(lenA);
    arrowB.style.strokeDashoffset = String(lenB);
    [laneA, laneB].forEach((l) => {
      gsap.set([l.backBox, l.hostLbl, l.delayLbl], { opacity: 0 });
      gsap.set(l.lockLbl, { opacity: 0 });
      gsap.set(l.readyLbl, { opacity: 0 });
      gsap.set([l.lockRing, l.readyRing], { opacity: 0 });
      gsap.set([l.fetchBox, l.fetchLbl, l.fetchedLbl], { opacity: 0 });
      l.dropArrow.style.strokeDashoffset = String(l.lenDrop);
      gsap.set(l.dropArrow, { opacity: 0 });
    });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Every discovered URL waits in one shared frontier, ranked by priority"; });
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "The frontier routes each URL into its own host's back queue"; });
    tl.to(arrowA, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowA, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
    tl.to(arrowB, { opacity: 1, duration: 0.05 }, "<0.1");
    tl.to(arrowB, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
    tl.to([laneA.backBox, laneA.hostLbl, laneA.delayLbl, laneB.backBox, laneB.hostLbl, laneB.delayLbl], { opacity: 1, duration: 0.3 }, "<0.15");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Each back queue is locked until its own crawl delay has passed"; });
    tl.to([laneA.lockLbl, laneA.lockRing, laneB.lockLbl, laneB.lockRing], { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.7 });

    tl.add(() => { phase.textContent = "example.com's 2 second delay elapses first, so its queue releases a fetch" });
    tl.to(laneA.lockRing, { opacity: 0, duration: 0.3 }, "<");
    tl.to(laneA.lockLbl, { opacity: 0, duration: 0.2 }, "<");
    tl.to(laneA.readyLbl, { opacity: 1, duration: 0.2 }, "<0.1");
    tl.to(laneA.readyRing, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(laneA.dropArrow, { opacity: 1, duration: 0.05 }, "<");
    tl.to(laneA.dropArrow, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([laneA.fetchBox, laneA.fetchLbl, laneA.fetchedLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.7 });

    tl.add(() => { phase.textContent = "news.example is still inside its own longer 5 second window" });
    tl.to({}, { duration: 0.9 });

    tl.add(() => { phase.textContent = "Once that timer catches up, news.example's queue releases too" });
    tl.to(laneB.lockRing, { opacity: 0, duration: 0.3 }, "<");
    tl.to(laneB.lockLbl, { opacity: 0, duration: 0.2 }, "<");
    tl.to(laneB.readyLbl, { opacity: 1, duration: 0.2 }, "<0.1");
    tl.to(laneB.readyRing, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(laneB.dropArrow, { opacity: 1, duration: 0.05 }, "<");
    tl.to(laneB.dropArrow, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([laneB.fetchBox, laneB.fetchLbl, laneB.fetchedLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Each host paces itself. A slow host never slows down a fast one"; });
    tl.to([laneA.readyRing, laneB.readyRing], { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });

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

export const FrontierPolitenessDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 500" maxW="max-w-2xl" delay={delay} setup={setupFrontierPoliteness} />
);

/* ===========================================================================
   INDEPENDENT RETRY — a fetch that keeps timing out backs off and retries on
   its own lane, while a second, already-fetched page keeps moving through
   parsing, extraction, and re-enqueueing on a completely independent lane.
   Neither lane waits for the other, because a queue sits between the stages.
=========================================================================== */
function setupIndependentRetry(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `ir-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 24, "viz-phase", "middle");

  mkText(svg, "Fetch Worker, page X", 230, 60, "viz-label", "middle");
  mkText(svg, "Already fetched, page Y", 670, 60, "viz-label", "middle");

  function arrow(x: number, y1: number, y2: number) {
    const ln = mk(svg, "line", {
      x1: x, y1, x2: x, y2, class: "viz-stroke", "marker-end": `url(#ir-${uid})`, opacity: 0,
    }) as SVGLineElement;
    const len = y2 - y1;
    ln.style.strokeDasharray = String(len);
    return { ln, len };
  }

  const arrowA1 = arrow(230, 72, 150);
  const boxA1 = mk(svg, "rect", { x: 155, y: 150, width: 150, height: 70, rx: 12, class: "viz-panel-warn", opacity: 0 }) as SVGRectElement;
  mkText(svg, "Attempt 1", 230, 178, "viz-node-lbl", "middle");
  const a1Status = mkText(svg, "timeout", 230, 200, "viz-warn-lbl", "middle") as SVGTextElement;

  const arrowA2 = arrow(230, 220, 298);
  const boxA2 = mk(svg, "rect", { x: 155, y: 298, width: 150, height: 70, rx: 12, class: "viz-panel", opacity: 0 }) as SVGRectElement;
  mkText(svg, "Backing off", 230, 326, "viz-node-lbl", "middle");
  mkText(svg, "wait 2 seconds", 230, 348, "viz-label-sm", "middle");

  const arrowA3 = arrow(230, 368, 446);
  const boxA3 = mk(svg, "rect", { x: 155, y: 446, width: 150, height: 70, rx: 12, class: "viz-panel-warn", opacity: 0 }) as SVGRectElement;
  mkText(svg, "Attempt 2", 230, 474, "viz-node-lbl", "middle");
  const a2Status = mkText(svg, "timeout", 230, 496, "viz-warn-lbl", "middle") as SVGTextElement;

  const dlqRing = mk(svg, "rect", { x: 149, y: 440, width: 162, height: 82, rx: 16, class: "viz-warn", fill: "none", opacity: 0 }) as SVGRectElement;
  const dlqLbl = mkText(svg, "sent to dead letter queue", 230, 546, "viz-warn-lbl", "middle") as SVGTextElement;

  const arrowB1 = arrow(670, 72, 150);
  const boxB1 = mk(svg, "rect", { x: 595, y: 150, width: 150, height: 70, rx: 12, class: "viz-box", opacity: 0 }) as SVGRectElement;
  mkText(svg, "Parser", 670, 178, "viz-node-lbl", "middle");
  mkText(svg, "extracting text", 670, 200, "viz-label-sm", "middle");

  const arrowB2 = arrow(670, 220, 298);
  const boxB2 = mk(svg, "rect", { x: 595, y: 298, width: 150, height: 70, rx: 12, class: "viz-box", opacity: 0 }) as SVGRectElement;
  mkText(svg, "Link Extractor", 670, 326, "viz-node-lbl", "middle");
  mkText(svg, "new URLs found", 670, 348, "viz-label-sm", "middle");

  const arrowB3 = arrow(670, 368, 446);
  const boxB3 = mk(svg, "rect", { x: 595, y: 446, width: 150, height: 70, rx: 12, class: "viz-panel", opacity: 0 }) as SVGRectElement;
  mkText(svg, "Re-enqueued", 670, 474, "viz-node-lbl", "middle");
  mkText(svg, "back to the frontier", 670, 496, "viz-label-sm", "middle");
  const readyRingB = mk(svg, "rect", { x: 589, y: 440, width: 162, height: 82, rx: 16, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    [arrowA1, arrowA2, arrowA3, arrowB1, arrowB2, arrowB3].forEach(({ ln, len }) => {
      gsap.set(ln, { opacity: 0 });
      ln.style.strokeDashoffset = String(len);
    });
    gsap.set([boxA1, boxA2, boxA3, boxB1, boxB2, boxB3, dlqRing, dlqLbl, readyRingB], { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Two stages of the same pipeline run at the same time"; });
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Page X's fetch worker tries once, page Y is already parsing"; });
    tl.to(arrowA1.ln, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowA1.ln, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(boxA1, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(arrowB1.ln, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowB1.ln, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(boxB1, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Attempt 1 times out and backs off, while parsing moves straight to link extraction"; });
    tl.to(a1Status, { opacity: 1, duration: 0.2 }, "<");
    tl.to(arrowA2.ln, { opacity: 1, duration: 0.05 }, "<0.15");
    tl.to(arrowA2.ln, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(boxA2, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(arrowB2.ln, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowB2.ln, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(boxB2, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.7 });

    tl.add(() => { phase.textContent = "Attempt 2 also times out, while page Y is already back in the frontier"; });
    tl.to(arrowA3.ln, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowA3.ln, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(boxA3, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(a2Status, { opacity: 1, duration: 0.2 }, "<0.1");
    tl.to(arrowB3.ln, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowB3.ln, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(boxB3, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(readyRingB, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Page X has exhausted its retries and moves to the dead letter queue"; });
    tl.to([dlqRing, dlqLbl], { opacity: 1, duration: 0.3 }, "<");
    tl.to(dlqRing, { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });

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

export const IndependentRetryDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 580" maxW="max-w-2xl" delay={delay} setup={setupIndependentRetry} />
);
