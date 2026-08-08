import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animations for the "Designing ChatGPT" case study.
   Theme comes entirely from CSS vars (.viz / .dark .viz in index.css), so the
   same SVG reads black+blue in light mode and white+blue in dark mode.
   Each animation plays once when scrolled into view; a replay button restarts.
---------------------------------------------------------------------------- */

const NS = "http://www.w3.org/2000/svg";
type Api = {
  play: () => void; // (re)build timeline from scratch and play
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
   TOKEN LATENCY RACE — time to first token vs total response time.
   Two bars start at the same instant. The top one (first token) finishes
   almost immediately. The bottom one (full generation) keeps growing long
   after the reader has already started reading the reply.
=========================================================================== */
function setupTokenLatencyRace(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const TRACK_X = 80;
  const TRACK_W = 720;
  const TTFT_W = 120; // 80 -> 200
  const TOTAL_W = 720; // 80 -> 800

  const phase = mkText(svg, "", 450, 26, "viz-phase", "middle");
  const sentLbl = mkText(svg, "Request sent", TRACK_X, 66, "viz-label-sm", "start");

  mkText(svg, "Time to first token", TRACK_X, 88, "viz-label-sm", "start");
  const trackA = mk(svg, "rect", { x: TRACK_X, y: 96, width: TRACK_W, height: 12, rx: 6, class: "viz-panel" });
  const fillA = mk(svg, "rect", { x: TRACK_X, y: 96, width: 0, height: 12, rx: 6, class: "viz-bar-pos" });
  const labelA = mkText(svg, "First token, about 300 ms", TRACK_X + TTFT_W, 148, "viz-label-sm", "middle");
  gsap.set(labelA, { opacity: 0 });
  const dotA = mk(svg, "circle", { cx: TRACK_X + TTFT_W, cy: 102, r: 6, class: "viz-bar-pos" });
  gsap.set(dotA, { opacity: 0 });

  mkText(svg, "Total response time", TRACK_X, 188, "viz-label-sm", "start");
  const trackB = mk(svg, "rect", { x: TRACK_X, y: 196, width: TRACK_W, height: 12, rx: 6, class: "viz-panel" });
  const fillB = mk(svg, "rect", { x: TRACK_X, y: 196, width: 0, height: 12, rx: 6, class: "viz-box" });
  const labelB = mkText(svg, "Response complete, about 4.2 s", TRACK_X + TOTAL_W, 244, "viz-label-sm", "middle");
  gsap.set(labelB, { opacity: 0 });

  const ticks: SVGRectElement[] = [];
  for (let i = 0; i < 7; i++) {
    const tx = TRACK_X + 90 + i * 90;
    const tick = mk(svg, "rect", { x: tx, y: 196, width: 3, height: 12, class: "viz-thin", opacity: 0 }) as SVGRectElement;
    ticks.push(tick);
  }

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([sentLbl], { opacity: 1 });
    gsap.set(fillA, { attr: { width: 0 } });
    gsap.set(fillB, { attr: { width: 0 } });
    gsap.set([labelA, labelB, dotA], { opacity: 0 });
    gsap.set(ticks, { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "A prompt is sent, both clocks start at the same instant"; });
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "The model reads the whole prompt at once, then produces one token"; });
    tl.to(fillA, { attr: { width: TTFT_W }, duration: 0.6, ease: "power1.out" }, "<");
    tl.to(fillB, { attr: { width: 90 }, duration: 0.6, ease: "none" }, "<");
    tl.to(dotA, { opacity: 1, duration: 0.2 }, ">-0.1");
    tl.to(labelA, { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "That first token is what makes the reply feel instant"; });
    tl.to({}, { duration: 0.7 });

    tl.add(() => { phase.textContent = "Meanwhile the reply keeps streaming, one token at a time, for seconds more"; });
    ticks.forEach((tick, i) => {
      tl.to(tick, { opacity: 0.7, duration: 0.05 }, i === 0 ? "<" : "<0.32");
      tl.to(fillB, { attr: { width: 90 + (i + 1) * 90 }, duration: 0.32, ease: "none" }, "<");
    });
    tl.to(labelB, { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Total time is fourteen times longer, but nobody is still staring at a blank screen"; });

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

export const TokenLatencyRaceDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 280" maxW="max-w-2xl" delay={delay} setup={setupTokenLatencyRace} />
);

/* ===========================================================================
   CONTINUOUS BATCHING — the same four GPU slots under static batching
   (a finished sequence leaves its slot idle until the whole batch drains)
   versus continuous batching (a finished sequence's slot is immediately
   handed to a waiting request).
=========================================================================== */
type SlotGroup = {
  activeBox: SVGRectElement; activeL1: SVGTextElement; activeL2: SVGTextElement;
  nextBox: SVGRectElement; nextL1: SVGTextElement; nextL2: SVGTextElement; nextRing: SVGRectElement;
};

function buildSlot(svg: SVGSVGElement, x: number, y: number, w: number, h: number, activeLabel: string, nextLabel: string, nextStyle: "idle" | "fresh"): SlotGroup {
  const activeBox = mk(svg, "rect", { x, y, width: w, height: h, rx: 10, class: "viz-box" }) as SVGRectElement;
  const activeL1 = mkText(svg, activeLabel, x + w / 2, y + h / 2 - 4, "viz-node-lbl", "middle") as SVGTextElement;
  const activeL2 = mkText(svg, "decoding", x + w / 2, y + h / 2 + 14, "viz-label-sm", "middle") as SVGTextElement;

  const nextBox = mk(svg, "rect", { x, y, width: w, height: h, rx: 10, class: nextStyle === "idle" ? "viz-panel" : "viz-box", opacity: 0 }) as SVGRectElement;
  const nextRing = mk(svg, "rect", { x: x - 4, y: y - 4, width: w + 8, height: h + 8, rx: 13, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const nextL1 = mkText(svg, nextStyle === "idle" ? "idle slot" : nextLabel, x + w / 2, y + h / 2 - 4, nextStyle === "idle" ? "viz-label-sm" : "viz-node-lbl", "middle") as SVGTextElement;
  nextL1.setAttribute("opacity", "0");
  const nextL2 = mkText(svg, nextStyle === "idle" ? "GPU capacity wasted" : "just admitted", x + w / 2, y + h / 2 + 14, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([nextBox, nextL1, nextL2, nextRing], { opacity: 0 });

  return { activeBox, activeL1, activeL2, nextBox, nextL1, nextL2, nextRing };
}

function setupContinuousBatching(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const phase = mkText(svg, "", 450, 24, "viz-phase", "middle");

  const LX = 225, RX = 675;
  const BW = 150, BH = 50;
  const ys = [90, 160, 230, 300];

  mkText(svg, "Static batching", LX, 58, "viz-label", "middle");
  mkText(svg, "Continuous batching", RX, 58, "viz-label", "middle");

  const staticSlots = [
    buildSlot(svg, LX - BW / 2, ys[0], BW, BH, "Request A", "", "idle"),
    buildSlot(svg, LX - BW / 2, ys[1], BW, BH, "Request B", "", "idle"),
    buildSlot(svg, LX - BW / 2, ys[2], BW, BH, "Request C", "", "idle"),
    buildSlot(svg, LX - BW / 2, ys[3], BW, BH, "Request D", "", "idle"),
  ];
  const contSlots = [
    buildSlot(svg, RX - BW / 2, ys[0], BW, BH, "Request A", "Request E", "fresh"),
    buildSlot(svg, RX - BW / 2, ys[1], BW, BH, "Request B", "", "idle"),
    buildSlot(svg, RX - BW / 2, ys[2], BW, BH, "Request C", "Request F", "fresh"),
    buildSlot(svg, RX - BW / 2, ys[3], BW, BH, "Request D", "", "idle"),
  ];

  const queueBoxL = mk(svg, "rect", { x: LX - BW / 2, y: 378, width: BW, height: 50, rx: 10, class: "viz-panel" });
  mkText(svg, "Waiting queue", LX, 398, "viz-label-sm", "middle");
  const queueTextL = mkText(svg, "E, F stuck waiting", LX, 416, "viz-warn-lbl", "middle") as SVGTextElement;

  const queueBoxR = mk(svg, "rect", { x: RX - BW / 2, y: 378, width: BW, height: 50, rx: 10, class: "viz-panel" });
  mkText(svg, "Waiting queue", RX, 398, "viz-label-sm", "middle");
  const queueTextR = mkText(svg, "empty, backfilled fast", RX, 416, "viz-label-sm", "middle") as SVGTextElement;

  const utilL = mkText(svg, "2 of 4 slots working", LX, 460, "viz-warn-lbl", "middle") as SVGTextElement;
  const utilR = mkText(svg, "4 of 4 slots working", RX, 460, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set([queueTextL, utilL, utilR], { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    [...staticSlots, ...contSlots].forEach((s) => {
      gsap.set(s.activeBox, { opacity: 1 });
      gsap.set([s.activeL1, s.activeL2], { opacity: 1 });
      gsap.set([s.nextBox, s.nextL1, s.nextL2, s.nextRing], { opacity: 0 });
    });
    gsap.set([queueTextL, utilL, utilR], { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Four requests fill the same four GPU slots on both sides"; });
    tl.to({}, { duration: 0.7 });

    tl.add(() => { phase.textContent = "Request A and Request C are short, they finish decoding first"; });
    tl.to([staticSlots[0].activeBox, staticSlots[0].activeL1, staticSlots[0].activeL2,
           staticSlots[2].activeBox, staticSlots[2].activeL1, staticSlots[2].activeL2,
           contSlots[0].activeBox, contSlots[0].activeL1, contSlots[0].activeL2,
           contSlots[2].activeBox, contSlots[2].activeL1, contSlots[2].activeL2],
      { opacity: 0, duration: 0.4 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Static batching waits for the whole batch, so those slots just sit idle"; });
    tl.to([staticSlots[0].nextBox, staticSlots[0].nextL1, staticSlots[0].nextL2,
           staticSlots[2].nextBox, staticSlots[2].nextL1, staticSlots[2].nextL2],
      { opacity: 1, duration: 0.4 }, "<");
    tl.to(queueTextL, { opacity: 1, duration: 0.3 }, "<0.2");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Continuous batching admits Request E and Request F into those same freed slots right away"; });
    tl.to([contSlots[0].nextBox, contSlots[0].nextL1, contSlots[0].nextL2,
           contSlots[2].nextBox, contSlots[2].nextL1, contSlots[2].nextL2],
      { opacity: 1, duration: 0.4 }, "<");
    tl.to([contSlots[0].nextRing, contSlots[2].nextRing], { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to([contSlots[0].nextRing, contSlots[2].nextRing], { opacity: 0, duration: 0.6 }, ">0.2");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Same hardware, same moment, one side wastes capacity and the other keeps every slot busy"; });
    tl.to([utilL, utilR], { opacity: 1, duration: 0.3 }, "<");

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

export const ContinuousBatchingDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 500" maxW="max-w-3xl" delay={delay} setup={setupContinuousBatching} />
);

/* ===========================================================================
   PAGED KV CACHE — a sequence's logical key-value cache blocks land on
   whichever free fixed-size physical GPU memory slots exist, wherever they
   sit, instead of needing one contiguous run of memory.
=========================================================================== */
function setupPagedKvCache(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const phase = mkText(svg, "", 450, 24, "viz-phase", "middle");

  const slotCenters = [100, 200, 300, 400, 500, 600, 700, 800];
  const PW = 90, PH = 60, PY = 300;
  const occupiedByOther = [1, 3, 6];
  const claimOrder = [0, 2, 4, 7]; // physical slot indices claimed by this sequence's blocks 0..3
  const freeIdle = [5];

  const physBoxes = slotCenters.map((cx, i) => {
    const x = cx - PW / 2;
    const isOther = occupiedByOther.includes(i);
    const box = mk(svg, "rect", { x, y: PY, width: PW, height: PH, rx: 8, class: isOther ? "viz-panel" : "viz-stroke" }) as SVGRectElement;
    mkText(svg, `Slot ${i}`, cx, PY + 22, "viz-label-sm", "middle");
    const status = mkText(svg, isOther ? "in use" : "free", cx, PY + 42, "viz-label-sm", "middle") as SVGTextElement;
    return { box, status, cx, isOther };
  });

  const LW = 96, LY = 84, LH = 60;
  const logicalBoxes = claimOrder.map((slotIdx, blockIdx) => {
    const cx = slotCenters[slotIdx];
    const x = cx - LW / 2;
    const box = mk(svg, "rect", { x, y: LY, width: LW, height: LH, rx: 8, class: "viz-box" }) as SVGRectElement;
    const lbl = mkText(svg, `Block ${blockIdx}`, cx, LY + LH / 2 + 5, "viz-node-lbl", "middle") as SVGTextElement;
    return { box, lbl, cx, blockIdx, slotIdx };
  });

  const connectors = logicalBoxes.map((lb) => {
    const line = mk(svg, "line", { x1: lb.cx, y1: LY + LH, x2: lb.cx, y2: PY, class: "viz-stroke", opacity: 0 }) as SVGLineElement;
    const len = PY - (LY + LH);
    line.style.strokeDasharray = String(len);
    return { line, len };
  });

  const finalNote = mkText(svg, "Four non-contiguous slots, and nothing had to move to fit them", 450, 405, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set(finalNote, { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set(logicalBoxes.map((l) => [l.box, l.lbl]).flat(), { opacity: 0 });
    connectors.forEach((c) => {
      gsap.set(c.line, { opacity: 0 });
      c.line.style.strokeDashoffset = String(c.len);
    });
    gsap.set(finalNote, { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "This sequence's key-value cache grows one fixed-size block at a time"; });
    logicalBoxes.forEach((l, i) => {
      tl.to([l.box, l.lbl], { opacity: 1, duration: 0.3 }, i === 0 ? "<" : "<0.15");
    });
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Other sequences already hold part of GPU memory, scattered across it"; });
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Each block claims whatever free slot exists, no matter where it sits"; });
    connectors.forEach((c, i) => {
      const lb = logicalBoxes[i];
      const ph = physBoxes[lb.slotIdx];
      tl.to(c.line, { opacity: 1, duration: 0.05 }, i === 0 ? "<" : "<0.3");
      tl.to(c.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
      tl.add(() => {
        ph.box.setAttribute("class", "viz-box");
        ph.status.textContent = `Block ${lb.blockIdx}`;
      }, ">-0.05");
    });
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Non-contiguous placement, but the sequence still gets exactly the memory it needs"; });
    tl.to(finalNote, { opacity: 1, duration: 0.3 }, "<");

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

export const PagedKvCacheDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 440" maxW="max-w-3xl" delay={delay} setup={setupPagedKvCache} />
);
