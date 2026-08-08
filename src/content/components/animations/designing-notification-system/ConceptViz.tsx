import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animations for the notification-system case study.
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
   INTENT FAN-OUT — one product event becomes one channel-independent
   notification intent, then fans out into four channel-specific queues.
=========================================================================== */
function setupIntentFanout(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `if-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 24, "viz-phase", "middle");

  mk(svg, "rect", { x: 350, y: 60, width: 200, height: 50, rx: 8, class: "viz-box" });
  mkText(svg, "Order Shipped Event", 450, 90, "viz-node-lbl", "middle");

  const arrow1 = mk(svg, "line", {
    x1: 450, y1: 110, x2: 450, y2: 164, class: "viz-stroke", "marker-end": `url(#if-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const len1 = 54;
  arrow1.style.strokeDasharray = String(len1);

  const intentBox = mk(svg, "rect", { x: 355, y: 164, width: 190, height: 70, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const intentLbl1 = mkText(svg, "Notification Intent", 450, 193, "viz-node-lbl", "middle") as SVGTextElement;
  const intentLbl2 = mkText(svg, "channel independent", 450, 214, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([intentLbl1, intentLbl2], { opacity: 0 });

  const arrow2 = mk(svg, "line", {
    x1: 450, y1: 234, x2: 450, y2: 282, class: "viz-stroke", "marker-end": `url(#if-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const len2 = 48;
  arrow2.style.strokeDasharray = String(len2);

  const lanes = [
    { x: 90, label: "Push Queue" },
    { x: 330, label: "Email Queue" },
    { x: 570, label: "SMS Queue" },
    { x: 810, label: "In-App Queue" },
  ];

  type Lane = { arrow: SVGLineElement; len: number; box: SVGRectElement; ring: SVGRectElement; lbl: SVGTextElement };
  const laneEls: Lane[] = lanes.map(({ x, label }) => {
    const len = Math.hypot(x - 450, 346 - 282);
    const arrow = mk(svg, "line", {
      x1: 450, y1: 282, x2: x, y2: 346, class: "viz-stroke", "marker-end": `url(#if-${uid})`, opacity: 0,
    }) as SVGLineElement;
    arrow.style.strokeDasharray = String(len);
    const box = mk(svg, "rect", { x: x - 75, y: 346, width: 150, height: 50, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
    const ring = mk(svg, "rect", { x: x - 81, y: 340, width: 162, height: 62, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
    const lbl = mkText(svg, label, x, 376, "viz-node-lbl", "middle") as SVGTextElement;
    gsap.set([box, ring, lbl], { opacity: 0 });
    return { arrow, len, box, ring, lbl };
  });

  const finalLbl = mkText(svg, "One event, four independent delivery paths", 450, 452, "viz-label", "middle") as SVGTextElement;
  gsap.set(finalLbl, { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([intentBox, intentLbl1, intentLbl2], { opacity: 0 });
    gsap.set(arrow1, { opacity: 0 });
    arrow1.style.strokeDashoffset = String(len1);
    gsap.set(arrow2, { opacity: 0 });
    arrow2.style.strokeDashoffset = String(len2);
    laneEls.forEach((l) => {
      gsap.set([l.box, l.ring, l.lbl], { opacity: 0 });
      gsap.set(l.arrow, { opacity: 0 });
      l.arrow.style.strokeDashoffset = String(l.len);
    });
    gsap.set(finalLbl, { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "A product service reports that an order shipped"; });
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "The platform turns it into one channel-independent notification intent"; });
    tl.to(arrow1, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow1, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([intentBox, intentLbl1, intentLbl2], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "That single intent fans out into one queue per channel"; });
    tl.to(arrow2, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow2, { strokeDashoffset: 0, duration: 0.25, ease: "none" }, "<");
    laneEls.forEach((l, i) => {
      tl.to(l.arrow, { opacity: 1, duration: 0.05 }, i === 0 ? "<0.1" : "<0.08");
      tl.to(l.arrow, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
      tl.to([l.box, l.lbl], { opacity: 1, duration: 0.3 }, "<0.1");
    });
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Each channel now has its own queue, its own workers, and its own failure domain"; });
    tl.to(laneEls.map((l) => l.ring), { opacity: 1, duration: 0.3, stagger: 0.08 }, "<");
    tl.to(finalLbl, { opacity: 1, duration: 0.3 }, ">0.1");
    tl.to(laneEls.map((l) => l.ring), { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });

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

export const IntentFanoutDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 480" maxW="max-w-2xl" delay={delay} setup={setupIntentFanout} />
);

/* ===========================================================================
   PREFERENCE GATE — two notifications hit the same category and quiet-hours
   checks. The transactional one bypasses quiet hours, the promotional one
   gets held, same clock, different policy.
=========================================================================== */
function setupPreferenceGate(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `pg-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 26, "viz-phase", "middle");

  const lanes = [
    { x: 230, name: "Password Reset", outcome: "Delivered now", warn: false },
    { x: 670, name: "Flash Sale Promo", outcome: "Held til 8 AM", warn: true },
  ];

  type Lane = {
    nameText: SVGTextElement;
    arrow1: SVGLineElement; len1: number;
    catBox: SVGRectElement; catLbl: SVGTextElement;
    arrow2: SVGLineElement; len2: number;
    headSpan: SVGTSpanElement; tailSpan: SVGTSpanElement;
    arrow3: SVGLineElement; len3: number;
    outBox: SVGRectElement; outRing: SVGRectElement; outLbl: SVGTextElement;
  };

  const laneEls: Lane[] = lanes.map(({ x, name, outcome, warn }) => {
    const nameText = mkText(svg, name, x, 60, "viz-label", "middle") as SVGTextElement;

    const arrow1 = mk(svg, "line", {
      x1: x, y1: 72, x2: x, y2: 138, class: "viz-stroke", "marker-end": `url(#pg-${uid})`, opacity: 0,
    }) as SVGLineElement;
    const len1 = 66;
    arrow1.style.strokeDasharray = String(len1);

    const catBox = mk(svg, "rect", { x: x - 75, y: 140, width: 150, height: 56, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
    const catLbl = mkText(svg, "Category Check", x, 173, "viz-node-lbl", "middle") as SVGTextElement;
    gsap.set(catLbl, { opacity: 0 });

    const arrow2 = mk(svg, "line", {
      x1: x, y1: 196, x2: x, y2: 258, class: "viz-stroke", "marker-end": `url(#pg-${uid})`, opacity: 0,
    }) as SVGLineElement;
    const len2 = 62;
    arrow2.style.strokeDasharray = String(len2);

    const revealEl = mk(svg, "text", { x, y: 278, class: "viz-label", "text-anchor": "middle" });
    const headSpan = mk(revealEl, "tspan", { class: "viz-node-lbl" }) as SVGTSpanElement;
    headSpan.textContent = "10:14 PM";
    const tailSpan = mk(revealEl, "tspan", { class: "viz-label-sm" }) as SVGTSpanElement;
    tailSpan.textContent = " local time";
    gsap.set(revealEl, { opacity: 0 });

    const arrow3 = mk(svg, "line", {
      x1: x, y1: 292, x2: x, y2: 335, class: "viz-stroke", "marker-end": `url(#pg-${uid})`, opacity: 0,
    }) as SVGLineElement;
    const len3 = 43;
    arrow3.style.strokeDasharray = String(len3);

    const outRing = mk(svg, "rect", {
      x: x - 75, y: 335, width: 150, height: 56, rx: 12, class: warn ? "viz-warn" : "viz-blue", fill: "none", opacity: 0,
    }) as SVGRectElement;
    const outBox = mk(svg, "rect", { x: x - 70, y: 340, width: 140, height: 46, rx: 8, class: "viz-panel", opacity: 0 }) as SVGRectElement;
    const outLbl = mkText(svg, outcome, x, 368, warn ? "viz-warn-lbl" : "viz-node-lbl", "middle") as SVGTextElement;
    gsap.set(outLbl, { opacity: 0 });

    return { nameText, arrow1, len1, catBox, catLbl, arrow2, len2, headSpan, tailSpan, arrow3, len3, outBox, outRing, outLbl };
  });

  const connectLine = mk(svg, "line", {
    x1: lanes[0].x + 75, y1: 363, x2: lanes[1].x - 75, y2: 363, class: "viz-thin", opacity: 0,
  }) as SVGLineElement;
  const connectLen = lanes[1].x - 75 - (lanes[0].x + 75);
  connectLine.style.strokeDasharray = String(connectLen);
  const connectLbl = mkText(svg, "SAME CLOCK, DIFFERENT POLICY", 450, 343, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set(connectLbl, { opacity: 0 });

  gsap.set([laneEls[0].nameText, laneEls[1].nameText], { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([laneEls[0].nameText, laneEls[1].nameText], { opacity: 0 });
    laneEls.forEach((l) => {
      gsap.set([l.arrow1, l.arrow2, l.arrow3], { opacity: 0 });
      l.arrow1.style.strokeDashoffset = String(l.len1);
      l.arrow2.style.strokeDashoffset = String(l.len2);
      l.arrow3.style.strokeDashoffset = String(l.len3);
      gsap.set([l.catBox, l.catLbl], { opacity: 0 });
      gsap.set(l.headSpan.parentElement!, { opacity: 0 });
      gsap.set([l.outBox, l.outRing, l.outLbl], { opacity: 0 });
    });
    connectLine.style.strokeDashoffset = String(connectLen);
    gsap.set(connectLine, { opacity: 0 });
    gsap.set(connectLbl, { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "A password reset and a flash-sale promo both request delivery"; });
    tl.to([laneEls[0].nameText, laneEls[1].nameText], { opacity: 1, duration: 0.35, stagger: 0.1 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Both pass the category and opt-out check"; });
    laneEls.forEach((l, i) => {
      tl.to(l.arrow1, { opacity: 1, duration: 0.05 }, i === 0 ? "<" : "<0.1");
      tl.to(l.arrow1, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
      tl.to([l.catBox, l.catLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    });
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "The quiet-hours check reveals it is 10:14 PM local time for both"; });
    laneEls.forEach((l, i) => {
      tl.to(l.arrow2, { opacity: 1, duration: 0.05 }, i === 0 ? "<" : "<0.1");
      tl.to(l.arrow2, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
      tl.to(l.headSpan.parentElement!, { opacity: 1, duration: 0.3 }, "<0.1");
    });
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Transactional bypasses quiet hours, promotional respects them"; });
    laneEls.forEach((l, i) => {
      tl.to(l.arrow3, { opacity: 1, duration: 0.05 }, i === 0 ? "<" : "<0.1");
      tl.to(l.arrow3, { strokeDashoffset: 0, duration: 0.25, ease: "none" }, "<");
      tl.to([l.outBox, l.outLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    });
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Same clock, different outcome, because policy looked at the category first"; });
    tl.to([laneEls[0].outRing, laneEls[1].outRing], { opacity: 1, duration: 0.3 }, "<");
    tl.to(connectLine, { opacity: 1, duration: 0.05 }, "<");
    tl.to(connectLine, { strokeDashoffset: 0, duration: 0.4, ease: "none" }, "<");
    tl.to(connectLbl, { opacity: 1, duration: 0.3 }, "<0.2");

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

export const PreferenceGateDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 400" maxW="max-w-2xl" delay={delay} setup={setupPreferenceGate} />
);

/* ===========================================================================
   RETRY BACKOFF — three failed delivery attempts, a growing wait between
   each, then an expiry check routes the message to a dead-letter queue
   instead of trying a fourth time.
=========================================================================== */
function setupRetryBackoff(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `rb-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });
  const markerWarn = mk(defs, "marker", {
    id: `rbw-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(markerWarn, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-warn" });

  const phase = mkText(svg, "", 450, 24, "viz-phase", "middle");

  const attemptXs = [150, 450, 750];
  const attemptTimes = ["t=0s", "t=1.2s", "t=3.6s"];

  type Attempt = { box: SVGRectElement; ring: SVGRectElement; lbl1: SVGTextElement; lbl2: SVGTextElement };
  const attempts: Attempt[] = attemptXs.map((x, i) => {
    const box = mk(svg, "rect", { x: x - 70, y: 140, width: 140, height: 60, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
    const ring = mk(svg, "rect", { x: x - 76, y: 134, width: 152, height: 72, rx: 12, class: "viz-warn", fill: "none", opacity: 0 }) as SVGRectElement;
    const lbl1 = mkText(svg, `Attempt ${i + 1}`, x, 168, "viz-node-lbl", "middle") as SVGTextElement;
    const lbl2 = mkText(svg, attemptTimes[i], x, 188, "viz-label-sm", "middle") as SVGTextElement;
    gsap.set([box, ring, lbl1, lbl2], { opacity: 0 });
    return { box, ring, lbl1, lbl2 };
  });

  const waitLabels = ["wait ~1s + jitter", "wait ~2s + jitter"];
  type Wait = { arrow: SVGLineElement; len: number; lbl: SVGTextElement };
  const waits: Wait[] = [0, 1].map((i) => {
    const x1 = attemptXs[i] + 70;
    const x2 = attemptXs[i + 1] - 70;
    const arrow = mk(svg, "line", {
      x1, y1: 170, x2, y2: 170, class: "viz-stroke", "marker-end": `url(#rb-${uid})`, opacity: 0,
    }) as SVGLineElement;
    const len = x2 - x1;
    arrow.style.strokeDasharray = String(len);
    const lbl = mkText(svg, waitLabels[i], (x1 + x2) / 2, 139, "viz-label-sm", "middle") as SVGTextElement;
    gsap.set(lbl, { opacity: 0 });
    return { arrow, len, lbl };
  });

  const dropArrow = mk(svg, "line", {
    x1: 750, y1: 200, x2: 750, y2: 300, class: "viz-warn", "marker-end": `url(#rbw-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const dropLen = 100;
  dropArrow.style.strokeDasharray = String(dropLen);

  const expiryLbl = mkText(svg, "expires_at already passed", 750, 254, "viz-warn-lbl", "middle") as SVGTextElement;
  gsap.set(expiryLbl, { opacity: 0 });

  const dlqBox = mk(svg, "rect", { x: 610, y: 300, width: 140, height: 60, rx: 8, class: "viz-panel-warn", opacity: 0 }) as SVGRectElement;
  const dlqLbl1 = mkText(svg, "Dead Letter Queue", 680, 328, "viz-warn-lbl", "middle") as SVGTextElement;
  const dlqLbl2 = mkText(svg, "no fourth attempt", 680, 348, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([dlqBox, dlqLbl1, dlqLbl2], { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    attempts.forEach((a) => gsap.set([a.box, a.ring, a.lbl1, a.lbl2], { opacity: 0 }));
    waits.forEach((w) => {
      gsap.set([w.arrow, w.lbl], { opacity: 0 });
      w.arrow.style.strokeDashoffset = String(w.len);
    });
    gsap.set(dropArrow, { opacity: 0 });
    dropArrow.style.strokeDashoffset = String(dropLen);
    gsap.set(expiryLbl, { opacity: 0 });
    gsap.set([dlqBox, dlqLbl1, dlqLbl2], { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "The first delivery attempt fails"; });
    tl.to([attempts[0].box, attempts[0].lbl1, attempts[0].lbl2], { opacity: 1, duration: 0.35 }, "<");
    tl.to(attempts[0].ring, { opacity: 1, duration: 0.3 }, ">0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "It waits about a second, plus a little jitter, then tries again"; });
    tl.to(waits[0].arrow, { opacity: 1, duration: 0.05 }, "<");
    tl.to(waits[0].arrow, { strokeDashoffset: 0, duration: 0.6, ease: "none" }, "<");
    tl.to(waits[0].lbl, { opacity: 1, duration: 0.3 }, "<0.2");
    tl.to([attempts[1].box, attempts[1].lbl1, attempts[1].lbl2], { opacity: 1, duration: 0.35 }, ">");
    tl.to(attempts[1].ring, { opacity: 1, duration: 0.3 }, ">0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "The second attempt fails too, so the wait roughly doubles"; });
    tl.to(waits[1].arrow, { opacity: 1, duration: 0.05 }, "<");
    tl.to(waits[1].arrow, { strokeDashoffset: 0, duration: 0.9, ease: "none" }, "<");
    tl.to(waits[1].lbl, { opacity: 1, duration: 0.3 }, "<0.2");
    tl.to([attempts[2].box, attempts[2].lbl1, attempts[2].lbl2], { opacity: 1, duration: 0.35 }, ">");
    tl.to(attempts[2].ring, { opacity: 1, duration: 0.3 }, ">0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "The third attempt fails, and the message has now expired"; });
    tl.to(dropArrow, { opacity: 1, duration: 0.05 }, "<");
    tl.to(dropArrow, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
    tl.to(expiryLbl, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "It moves to the dead-letter queue instead of a fourth attempt"; });
    tl.to([dlqBox, dlqLbl1, dlqLbl2], { opacity: 1, duration: 0.35 }, "<");

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

export const RetryBackoffDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 390" maxW="max-w-2xl" delay={delay} setup={setupRetryBackoff} />
);
