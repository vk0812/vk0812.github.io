import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animations for the metrics monitoring case study.
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
   CARDINALITY EXPLOSION, one label with no natural bound turns a metric
   with a couple thousand safe combinations into hundreds of millions of
   distinct series. Twelve services x forty endpoints x five status codes is
   2,400 series (12*40*5=2400). Adding a raw user id averaging fifty
   thousand distinct values multiplies that by 50,000 to 120,000,000
   (2,400*50,000=120,000,000). The odometer below ticks through that exact
   arithmetic, nothing is faked.
=========================================================================== */
function setupCardinalityExplosion(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `ce-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 28, "viz-phase", "middle");

  const title = mkText(svg, "Metric: http_requests_total", 450, 64, "viz-label", "middle");

  const arrow1 = mk(svg, "line", {
    x1: 450, y1: 76, x2: 450, y2: 118, class: "viz-stroke",
    "marker-end": `url(#ce-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const len1 = 42;
  arrow1.style.strokeDasharray = String(len1);

  const labelBox = mk(svg, "rect", { x: 240, y: 118, width: 420, height: 118, rx: 12, class: "viz-box", opacity: 0 });
  const line1 = mkText(svg, "service (12 values)", 450, 151, "viz-label", "middle");
  const line2 = mkText(svg, "endpoint (40 values)", 450, 173, "viz-label", "middle");
  const line3 = mkText(svg, "status (5 values)", 450, 195, "viz-label", "middle");
  const line4 = mkText(svg, "+ user_id (unbounded)", 450, 217, "viz-warn-lbl", "middle");
  gsap.set([line1, line2, line3, line4], { opacity: 0 });

  const arrow2 = mk(svg, "line", {
    x1: 450, y1: 236, x2: 450, y2: 296, class: "viz-stroke",
    "marker-end": `url(#ce-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const len2 = 60;
  arrow2.style.strokeDasharray = String(len2);

  const countBox = mk(svg, "rect", { x: 300, y: 296, width: 300, height: 100, rx: 12, class: "viz-box", opacity: 0 });
  const countRing = mk(svg, "rect", { x: 290, y: 286, width: 320, height: 120, rx: 16, class: "viz-warn", fill: "none", opacity: 0 });
  const countNumber = mkText(svg, "2,400", 450, 344, "viz-num", "middle") as SVGTextElement;
  const countSub = mkText(svg, "series, still manageable", 450, 376, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([countNumber, countSub], { opacity: 0 });

  const COLS = 8, ROWS = 5;
  const dots: SVGRectElement[] = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const d = mk(svg, "rect", {
      x: 130 + col * 88, y: 440 + row * 24, width: 14, height: 14, rx: 3,
      class: "viz-bar-neg", opacity: 0,
    }) as SVGRectElement;
    dots.push(d);
  }
  gsap.set(dots, { opacity: 0, scale: 0.5, transformOrigin: "center" });

  const warnLabel = mkText(
    svg,
    "One unbounded label turned 2,400 series into 120,000,000.",
    450,
    600,
    "viz-warn-lbl",
    "middle"
  );

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set(title, { opacity: 0 });
    gsap.set(arrow1, { opacity: 0 });
    arrow1.style.strokeDashoffset = String(len1);
    gsap.set(labelBox, { opacity: 0 });
    gsap.set([line1, line2, line3, line4], { opacity: 0 });
    gsap.set(arrow2, { opacity: 0 });
    arrow2.style.strokeDashoffset = String(len2);
    gsap.set(countBox, { opacity: 0 });
    gsap.set(countRing, { opacity: 0 });
    gsap.set([countNumber, countSub], { opacity: 0 });
    countNumber.textContent = "2,400";
    countSub.textContent = "series, still manageable";
    gsap.set(dots, { opacity: 0, scale: 0.5 });
    gsap.set(warnLabel, { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "A metric with three ordinary labels"; });
    tl.to(title, { opacity: 1, duration: 0.35 }, "<");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Multiply the label cardinalities together"; });
    tl.to(arrow1, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow1, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(labelBox, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to([line1, line2, line3], { opacity: 1, duration: 0.3, stagger: 0.12 }, "<0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Twelve services, forty endpoints, five status codes, 2,400 series total"; });
    tl.to(arrow2, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow2, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(countBox, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to([countNumber, countSub], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Now add one label with no natural limit, like a raw user id"; });
    tl.to(line4, { opacity: 1, duration: 0.35 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Every distinct value of that label is a brand new series"; });
    const counter = { v: 2400 };
    tl.to(counter, {
      v: 120000000,
      duration: 1.4,
      ease: "power2.in",
      onUpdate: () => { countNumber.textContent = Math.round(counter.v).toLocaleString(); },
    }, "<");
    tl.add(() => { countSub.textContent = "series, and climbing"; }, "<0.3");
    tl.to(dots, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.018 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => {
      phase.textContent = "One unbounded label just turned a manageable metric into an operational emergency";
      countSub.textContent = "series, and still growing";
    });
    tl.to(countRing, { opacity: 1, duration: 0.3 }, "<");
    tl.to(warnLabel, { opacity: 1, duration: 0.35 }, "<0.1");
    tl.to(countRing, { opacity: 0.25, duration: 0.6, yoyo: true, repeat: 3 });

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

export const CardinalityExplosionDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 640" maxW="max-w-2xl" delay={delay} setup={setupCardinalityExplosion} />
);

/* ===========================================================================
   BLOCK COMPACTION + DOWNSAMPLE, raw samples land in a write-ahead log,
   accumulate in an in-memory head block, flush into small immutable blocks,
   get merged by a background compactor into one bigger block, and finally
   shrink into a coarser downsampled copy for the warm tier.
=========================================================================== */
function setupBlockCompaction(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `bc-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 28, "viz-phase", "middle");
  const title = mkText(svg, "Samples arriving every ten seconds", 450, 55, "viz-label", "middle");

  const arrowTitle = mk(svg, "line", {
    x1: 450, y1: 66, x2: 450, y2: 100, class: "viz-stroke", "marker-end": `url(#bc-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenTitle = 34;
  arrowTitle.style.strokeDasharray = String(lenTitle);

  const walBox = mk(svg, "rect", { x: 340, y: 100, width: 220, height: 70, rx: 10, class: "viz-box", opacity: 0 });
  const walLbl = mkText(svg, "Write-ahead log", 450, 130, "viz-node-lbl", "middle");
  const walSub = mkText(svg, "durable before it is acked", 450, 150, "viz-label-sm", "middle");
  gsap.set([walLbl, walSub], { opacity: 0 });

  const arrowWalHead = mk(svg, "line", {
    x1: 450, y1: 170, x2: 450, y2: 200, class: "viz-stroke", "marker-end": `url(#bc-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenWalHead = 30;
  arrowWalHead.style.strokeDasharray = String(lenWalHead);

  const headBox = mk(svg, "rect", { x: 310, y: 200, width: 280, height: 90, rx: 10, class: "viz-box", opacity: 0 });
  const headLbl = mkText(svg, "In-memory head block", 450, 232, "viz-node-lbl", "middle");
  const headSub = mkText(svg, "this shard's current window", 450, 254, "viz-label-sm", "middle");
  gsap.set([headLbl, headSub], { opacity: 0 });
  mk(svg, "rect", { x: 330, y: 262, width: 240, height: 10, rx: 5, class: "viz-panel" });
  const fillBar = mk(svg, "rect", { x: 330, y: 262, width: 4, height: 10, rx: 5, class: "viz-bar-pos", opacity: 0 }) as SVGRectElement;

  type Block = { g: SVGGElement; rect: SVGRectElement; lbl: SVGTextElement; sub: SVGTextElement };
  const makeBlock = (cx: number, name: string, sub: string): Block => {
    const g = mk(svg, "g", { opacity: 0 }) as SVGGElement;
    const rect = mk(g, "rect", { x: cx - 70, y: 320, width: 140, height: 60, rx: 10, class: "viz-box" }) as SVGRectElement;
    const lbl = mkText(g, name, cx, 348, "viz-node-lbl", "middle") as SVGTextElement;
    const sb = mkText(g, sub, cx, 366, "viz-label-sm", "middle") as SVGTextElement;
    return { g, rect, lbl, sub: sb };
  };
  const blockA = makeBlock(250, "Block A", "flushed, 2h window");
  const blockB = makeBlock(450, "Block B", "flushed, 2h window");
  const blockC = makeBlock(650, "Block C", "flushed, 2h window");

  const ringB = mk(svg, "rect", { x: 368, y: 308, width: 164, height: 84, rx: 14, class: "viz-blue", fill: "none", opacity: 0 });

  const headToBlocks: { line: SVGLineElement; len: number }[] = [250, 450, 650].map((tx) => {
    const line = mk(svg, "line", {
      x1: 450, y1: 290, x2: tx, y2: 320, class: "viz-stroke", "marker-end": `url(#bc-${uid})`, opacity: 0,
    }) as SVGLineElement;
    const len = Math.hypot(tx - 450, 320 - 290);
    line.style.strokeDasharray = String(len);
    return { line, len };
  });

  const arrowBD = mk(svg, "line", {
    x1: 450, y1: 380, x2: 450, y2: 410, class: "viz-stroke", "marker-end": `url(#bc-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenBD = 30;
  arrowBD.style.strokeDasharray = String(lenBD);

  const downBox = mk(svg, "rect", { x: 370, y: 410, width: 160, height: 60, rx: 10, class: "viz-panel", opacity: 0 });
  const downLbl = mkText(svg, "Downsampled block", 450, 438, "viz-node-lbl", "middle");
  const downSub = mkText(svg, "5 minute rollup, warm tier", 450, 456, "viz-label-sm", "middle");
  gsap.set([downLbl, downSub], { opacity: 0 });

  const finalLabel = mkText(
    svg,
    "Raw samples become one compacted block, then a lighter downsampled copy for long-range queries.",
    450,
    510,
    "viz-label-sm",
    "middle"
  );

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set(title, { opacity: 0 });
    gsap.set(arrowTitle, { opacity: 0 });
    arrowTitle.style.strokeDashoffset = String(lenTitle);
    gsap.set(walBox, { opacity: 0 });
    gsap.set([walLbl, walSub], { opacity: 0 });
    gsap.set(arrowWalHead, { opacity: 0 });
    arrowWalHead.style.strokeDashoffset = String(lenWalHead);
    gsap.set(headBox, { opacity: 0 });
    gsap.set([headLbl, headSub], { opacity: 0 });
    gsap.set(fillBar, { opacity: 0, attr: { width: 4 } });
    headToBlocks.forEach(({ line, len }) => { gsap.set(line, { opacity: 0 }); line.style.strokeDashoffset = String(len); });
    [blockA, blockB, blockC].forEach((b) => gsap.set(b.g, { opacity: 0, x: 0, y: 0, scale: 1, transformOrigin: "center" }));
    blockA.lbl.textContent = "Block A"; blockA.sub.textContent = "flushed, 2h window";
    blockB.lbl.textContent = "Block B"; blockB.sub.textContent = "flushed, 2h window";
    blockC.lbl.textContent = "Block C"; blockC.sub.textContent = "flushed, 2h window";
    gsap.set(ringB, { opacity: 0 });
    gsap.set(arrowBD, { opacity: 0 });
    arrowBD.style.strokeDashoffset = String(lenBD);
    gsap.set(downBox, { opacity: 0 });
    gsap.set([downLbl, downSub], { opacity: 0 });
    gsap.set(finalLabel, { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Every write lands in a write-ahead log before it is acknowledged"; });
    tl.to(title, { opacity: 1, duration: 0.3 }, "<");
    tl.to(arrowTitle, { opacity: 1, duration: 0.05 }, "<0.1");
    tl.to(arrowTitle, { strokeDashoffset: 0, duration: 0.25, ease: "none" }, "<");
    tl.to(walBox, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to([walLbl, walSub], { opacity: 1, duration: 0.3 }, "<0.05");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Samples also accumulate in an in-memory head block for this shard"; });
    tl.to(arrowWalHead, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowWalHead, { strokeDashoffset: 0, duration: 0.25, ease: "none" }, "<");
    tl.to(headBox, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to([headLbl, headSub], { opacity: 1, duration: 0.3 }, "<0.05");
    tl.to(fillBar, { opacity: 1, attr: { width: 240 }, duration: 0.9, ease: "none" }, "<0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Once the window closes, the head block flushes to an immutable block on disk"; });
    headToBlocks.forEach(({ line }, i) => {
      tl.to(line, { opacity: 1, duration: 0.05 }, i === 0 ? "<" : "<0.12");
      tl.to(line, { strokeDashoffset: 0, duration: 0.25, ease: "none" }, "<");
    });
    tl.to([blockA.g, blockB.g, blockC.g], { opacity: 1, duration: 0.35, stagger: 0.15 }, "<0.1");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "A background compactor merges the small blocks into one bigger block"; });
    tl.to(blockA.g, { x: 200, scale: 0.7, opacity: 0, duration: 0.6, ease: "power1.in" }, "<");
    tl.to(blockC.g, { x: -200, scale: 0.7, opacity: 0, duration: 0.6, ease: "power1.in" }, "<");
    tl.add(() => {
      blockB.lbl.textContent = "Compacted block";
      blockB.sub.textContent = "one file instead of three";
    }, "<0.3");
    tl.to(ringB, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(ringB, { opacity: 0, duration: 0.5 }, ">0.3");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Older blocks shrink into a coarser downsampled copy for the warm tier"; });
    tl.to(arrowBD, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowBD, { strokeDashoffset: 0, duration: 0.25, ease: "none" }, "<");
    tl.to(downBox, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to([downLbl, downSub], { opacity: 1, duration: 0.3 }, "<0.05");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "The raw block stays small on disk. The rollup stays cheap to scan for months."; });
    tl.to(finalLabel, { opacity: 1, duration: 0.35 }, "<");

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

export const BlockCompactionDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 560" maxW="max-w-2xl" delay={delay} setup={setupBlockCompaction} />
);

/* ===========================================================================
   PENDING -> FIRING, an alert rule evaluates on a fixed schedule. One bad
   evaluation alone only moves the rule to pending. It takes three straight
   violating evaluations before the rule actually fires and a notification
   goes out, so a single noisy sample never pages anyone by itself.
=========================================================================== */
function setupAlertState(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const phase = mkText(svg, "", 450, 28, "viz-phase", "middle");

  const makeStateBox = (cx: number, name: string) => {
    mk(svg, "rect", { x: cx - 90, y: 80, width: 180, height: 60, rx: 12, class: "viz-box" });
    mkText(svg, name, cx, 116, "viz-node-lbl", "middle");
  };
  makeStateBox(200, "Inactive");
  makeStateBox(450, "Pending");
  makeStateBox(700, "Firing");

  const inactiveRing = mk(svg, "rect", { x: 100, y: 74, width: 200, height: 72, rx: 16, class: "viz-thin", opacity: 0 }) as SVGRectElement;
  const pendingRing = mk(svg, "rect", { x: 350, y: 74, width: 200, height: 72, rx: 16, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const firingRing = mk(svg, "rect", { x: 600, y: 74, width: 200, height: 72, rx: 16, class: "viz-warn", fill: "none", opacity: 0 }) as SVGRectElement;

  const centers = [110, 205, 300, 395, 490, 585, 680, 775];
  type Tick = { ok: SVGCircleElement; warn: SVGCircleElement };
  const ticks: Tick[] = centers.map((cx, i) => {
    const ok = mk(svg, "circle", { cx, cy: 280, r: 12, class: "viz-bar-pos", opacity: 0 }) as SVGCircleElement;
    const warn = mk(svg, "circle", { cx, cy: 280, r: 12, class: "viz-bar-neg", opacity: 0 }) as SVGCircleElement;
    mkText(svg, `t${i}`, cx, 308, "viz-label-sm", "middle");
    return { ok, warn };
  });

  const notifyLabel = mkText(svg, "Notification sent", 700, 358, "viz-warn-lbl", "middle");

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([inactiveRing, pendingRing, firingRing], { opacity: 0 });
    ticks.forEach((t) => gsap.set([t.ok, t.warn], { opacity: 0 }));
    gsap.set(notifyLabel, { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "The rule evaluates on a fixed schedule, one check per tick"; });
    tl.to(ticks.map((t) => t.ok), { opacity: 1, duration: 0.3, stagger: 0.05 }, "<");
    tl.to(inactiveRing, { opacity: 1, duration: 0.3 }, "<0.2");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "A single bad sample flips the rule to pending"; });
    tl.to(ticks[2].ok, { opacity: 0, duration: 0.2 }, "<");
    tl.to(ticks[2].warn, { opacity: 1, duration: 0.2 }, "<");
    tl.to(inactiveRing, { opacity: 0, duration: 0.25 }, "<");
    tl.to(pendingRing, { opacity: 1, duration: 0.25 }, "<0.1");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "One good sample brings it right back down, that was just noise"; });
    tl.to(pendingRing, { opacity: 0, duration: 0.25 }, "<");
    tl.to(inactiveRing, { opacity: 1, duration: 0.25 }, "<0.1");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "This time the condition holds for three straight evaluations"; });
    tl.to(ticks[5].ok, { opacity: 0, duration: 0.2 }, "<");
    tl.to(ticks[5].warn, { opacity: 1, duration: 0.2 }, "<");
    tl.to(inactiveRing, { opacity: 0, duration: 0.25 }, "<");
    tl.to(pendingRing, { opacity: 1, duration: 0.25 }, "<0.1");
    tl.to({}, { duration: 0.5 });

    tl.to(ticks[6].ok, { opacity: 0, duration: 0.2 }, "+=0.3");
    tl.to(ticks[6].warn, { opacity: 1, duration: 0.2 }, "<");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Three in a row, only now does the rule actually fire"; });
    tl.to(ticks[7].ok, { opacity: 0, duration: 0.2 }, "<");
    tl.to(ticks[7].warn, { opacity: 1, duration: 0.2 }, "<");
    tl.to(pendingRing, { opacity: 0, duration: 0.25 }, "<");
    tl.to(firingRing, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Firing means someone actually gets paged"; });
    tl.to(notifyLabel, { opacity: 1, duration: 0.3 }, "<");
    tl.to(firingRing, { opacity: 0.3, duration: 0.5, yoyo: true, repeat: 3 });

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

export const AlertPendingFiringDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 400" maxW="max-w-2xl" delay={delay} setup={setupAlertState} />
);
