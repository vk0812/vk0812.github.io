import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animations for the Ad Click Aggregator case study.
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
   LATE CLICK WINDOW — a click delayed by a retry still lands in the
   tumbling window its event time says it belongs to, as long as it beats
   the grace period. A click delayed past the grace period is routed to a
   separate late-events path instead of silently corrupting a closed window.
=========================================================================== */
function setupLateClickWindow(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `lc-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-blue" });

  const phase = mkText(svg, "", 470, 26, "viz-phase", "middle");

  type Win = { g: SVGGElement; ring: SVGRectElement; count: SVGTextElement; base: number };
  function makeWindow(x: number, w: number, title: string, range: string, base: number): Win {
    const g = mk(svg, "g") as SVGGElement;
    const ring = mk(g, "rect", { x: x - 6, y: 294, width: w + 12, height: 112, rx: 14, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
    mk(g, "rect", { x, y: 300, width: w, height: 100, rx: 12, class: "viz-box" });
    mkText(g, title, x + w / 2, 336, "viz-label", "middle");
    mkText(g, range, x + w / 2, 360, "viz-label-sm", "middle");
    const count = mkText(g, `${base} clicks`, x + w / 2, 384, "viz-label-sm", "middle") as SVGTextElement;
    return { g, ring, count, base };
  }

  const winA = makeWindow(60, 150, "Window A", "10:00 to 10:01", 42);
  const winB = makeWindow(270, 150, "Window B", "10:01 to 10:02", 58);
  const winC = makeWindow(480, 150, "Window C", "10:02 to 10:03", 31);

  const lateG = mk(svg, "g") as SVGGElement;
  const lateRing = mk(lateG, "rect", { x: 694, y: 294, width: 202, height: 112, rx: 14, class: "viz-warn", fill: "none", opacity: 0 }) as SVGRectElement;
  mk(lateG, "rect", { x: 700, y: 300, width: 190, height: 100, rx: 12, class: "viz-panel-warn" });
  mkText(lateG, "Late Events", 795, 336, "viz-label", "middle");
  mkText(lateG, "past the grace period", 795, 360, "viz-label-sm", "middle");
  const lateCount = mkText(lateG, "0 clicks", 795, 384, "viz-label-sm", "middle") as SVGTextElement;

  const allBoxes = [winA.g, winB.g, winC.g, lateG];
  gsap.set(allBoxes, { opacity: 0 });

  const graceLine = mk(svg, "line", {
    x1: 660, y1: 300, x2: 660, y2: 400, class: "viz-thin", "stroke-dasharray": "4 4", opacity: 0,
  }) as SVGLineElement;
  const graceLabel = mkText(svg, "Window A stays open until 10:03", 660, 249, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set(graceLabel, { opacity: 0 });

  // Token 1: the late-but-still-in-time click.
  const t1 = mk(svg, "g") as SVGGElement;
  mkText(t1, "Click, event time 10:00:58", 0, -8, "viz-node-lbl", "middle");
  const t1line2 = mkText(t1, "arrives 10:00:59", 0, 14, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set(t1, { opacity: 0, x: 135, y: 110 });

  const driftLine = mk(svg, "line", {
    x1: 135, y1: 110, x2: 555, y2: 110, class: "viz-stroke", "marker-end": `url(#lc-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const driftLen = 555 - 135;
  driftLine.style.strokeDasharray = String(driftLen);

  // Token 2: the click that misses the grace period entirely.
  const t2 = mk(svg, "g") as SVGGElement;
  mkText(t2, "Click, event time 10:00:59", 0, -8, "viz-node-lbl", "middle");
  const t2line2 = mkText(t2, "arrives 10:03:40", 0, 14, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set(t2, { opacity: 0, x: 795, y: 110 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set(allBoxes, { opacity: 0 });
    gsap.set([winA.ring, winB.ring, winC.ring, lateRing], { opacity: 0 });
    gsap.set([graceLine, graceLabel], { opacity: 0 });
    gsap.set(t1, { opacity: 0, x: 135, y: 110, scale: 1 });
    gsap.set(t2, { opacity: 0, x: 795, y: 110, scale: 1 });
    gsap.set(driftLine, { opacity: 0 });
    driftLine.style.strokeDashoffset = String(driftLen);
    t1line2.textContent = "arrives 10:00:59";
    winA.count.textContent = `${winA.base} clicks`;
    lateCount.textContent = "0 clicks";

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Tumbling one-minute windows group clicks by event time"; });
    tl.to(allBoxes, { opacity: 1, duration: 0.4, stagger: 0.08 }, "<");
    tl.to({}, { duration: 0.7 });

    tl.add(() => { phase.textContent = "A click happens at 10:00:58, inside Window A's range"; });
    tl.to(t1, { opacity: 1, duration: 0.35 }, "<");
    tl.to({}, { duration: 0.7 });

    tl.add(() => { phase.textContent = "A network retry delays it, it doesn't arrive until 10:02:20"; });
    tl.to(driftLine, { opacity: 1, duration: 0.05 }, "<");
    tl.to(driftLine, { strokeDashoffset: 0, duration: 0.5, ease: "none" }, "<");
    tl.to(t1, { x: 555, duration: 0.5, ease: "none" }, "<");
    tl.add(() => { t1line2.textContent = "arrives 10:02:20"; }, ">-0.05");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Window A doesn't finalize until a grace period ends at 10:03"; });
    tl.to([graceLine, graceLabel], { opacity: 1, duration: 0.35 }, "<");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "10:02:20 beats that deadline, so it still counts in Window A"; });
    tl.to(t1, { x: 135, y: 350, scale: 0.01, duration: 0.55, ease: "power1.in" }, "<");
    tl.add(() => {
      winA.count.textContent = `${winA.base + 1} clicks`;
    }, ">-0.05");
    tl.to(winA.ring, { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to(winA.ring, { opacity: 0, duration: 0.6 }, ">0.2");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "A click that arrives after 10:03 misses the window entirely"; });
    tl.to(t2, { opacity: 1, duration: 0.35 }, "<");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "It's routed to a late-events path instead of a closed window"; });
    tl.to(t2, { x: 795, y: 350, scale: 0.01, duration: 0.55, ease: "power1.in" }, "<");
    tl.add(() => {
      lateCount.textContent = "1 click";
    }, ">-0.05");
    tl.to(lateRing, { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to(lateRing, { opacity: 0, duration: 0.6 }, ">0.2");

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

export const LateClickWindowDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 940 440" maxW="max-w-3xl" delay={delay} setup={setupLateClickWindow} />
);

/* ===========================================================================
   HOT AD SALTING — every click for one viral ad hashing to a single
   partition overloads it while three others sit idle. Salting the key
   spreads the same ad across four partitions, each keeps a partial count,
   and a second stage sums the partials back into one true total.
=========================================================================== */
function setupHotAdSalting(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const markerBlue = mk(defs, "marker", {
    id: `ha-b-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(markerBlue, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-blue" });
  const markerWarn = mk(defs, "marker", {
    id: `ha-w-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(markerWarn, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-warn" });
  const markerInk = mk(defs, "marker", {
    id: `ha-i-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(markerInk, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 470, 26, "viz-phase", "middle");

  mk(svg, "rect", { x: 370, y: 60, width: 200, height: 80, rx: 12, class: "viz-box" });
  mkText(svg, "Clicks for Ad 42", 470, 96, "viz-label", "middle");
  mkText(svg, "one very popular ad", 470, 120, "viz-label-sm", "middle");

  type Part = { g: SVGGElement; ring: SVGRectElement; keyLbl: SVGTextElement; statusLbl: SVGTextElement; countLbl: SVGTextElement; cx: number };
  function makePartition(x: number, cx: number, label: string): Part {
    const g = mk(svg, "g") as SVGGElement;
    const ring = mk(g, "rect", { x: x - 6, y: 204, width: 152, height: 112, rx: 14, class: "viz-warn", fill: "none", opacity: 0 }) as SVGRectElement;
    mk(g, "rect", { x, y: 210, width: 140, height: 100, rx: 12, class: "viz-panel" });
    mkText(g, label, cx, 236, "viz-label", "middle");
    const keyLbl = mkText(g, "ad_42", cx, 260, "viz-label-sm", "middle") as SVGTextElement;
    const statusLbl = mkText(g, "idle", cx, 284, "viz-label-sm", "middle") as SVGTextElement;
    const countLbl = mkText(g, "", cx, 284, "viz-label-sm", "middle") as SVGTextElement;
    gsap.set(countLbl, { opacity: 0 });
    return { g, ring, keyLbl, statusLbl, countLbl, cx };
  }

  const p0 = makePartition(130, 200, "Partition 0");
  const p1 = makePartition(310, 380, "Partition 1");
  const p2 = makePartition(490, 560, "Partition 2");
  const p3 = makePartition(670, 740, "Partition 3");
  const parts = [p0, p1, p2, p3];

  function fanArrow(toCx: number, cls: string, mid: string) {
    const l = mk(svg, "line", {
      x1: 470, y1: 140, x2: toCx, y2: 210, class: cls, "marker-end": `url(#${mid})`, opacity: 0,
    }) as SVGLineElement;
    const len = Math.hypot(toCx - 470, 210 - 140);
    l.style.strokeDasharray = String(len);
    return { l, len };
  }
  const fan0 = fanArrow(200, "viz-warn", `ha-w-${uid}`);
  const fan1 = fanArrow(380, "viz-stroke", `ha-b-${uid}`);
  const fan2 = fanArrow(560, "viz-stroke", `ha-b-${uid}`);
  const fan3 = fanArrow(740, "viz-stroke", `ha-b-${uid}`);
  const fans = [fan0, fan1, fan2, fan3];

  mk(svg, "rect", { x: 370, y: 410, width: 200, height: 90, rx: 12, class: "viz-box" });
  mkText(svg, "Second Stage", 470, 442, "viz-label", "middle");
  mkText(svg, "sums the 4 partials", 470, 465, "viz-label-sm", "middle");
  const mergeTotal = mkText(svg, "", 470, 486, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set(mergeTotal, { opacity: 0 });
  const mergeRing = mk(svg, "rect", { x: 364, y: 404, width: 212, height: 102, rx: 16, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;

  function mergeArrow(fromCx: number) {
    const l = mk(svg, "line", {
      x1: fromCx, y1: 310, x2: 470, y2: 410, class: "viz-stroke", "marker-end": `url(#ha-i-${uid})`, opacity: 0,
    }) as SVGLineElement;
    const len = Math.hypot(470 - fromCx, 410 - 310);
    l.style.strokeDasharray = String(len);
    return { l, len };
  }
  const merges = parts.map((p) => mergeArrow(p.cx));

  const partials = [340, 355, 298, 312];

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    fans.forEach(({ l, len }) => { gsap.set(l, { opacity: 0 }); l.style.strokeDashoffset = String(len); });
    merges.forEach(({ l, len }) => { gsap.set(l, { opacity: 0 }); l.style.strokeDashoffset = String(len); });
    parts.forEach((p) => {
      gsap.set(p.ring, { opacity: 0 });
      p.keyLbl.textContent = "ad_42";
      p.statusLbl.textContent = "idle";
      gsap.set(p.statusLbl, { opacity: 1 });
      gsap.set(p.countLbl, { opacity: 0 });
    });
    gsap.set(mergeRing, { opacity: 0 });
    gsap.set(mergeTotal, { opacity: 0 });
    mergeTotal.textContent = "";

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Every click for one viral ad hashes to the same partition key"; });
    tl.to(fan0.l, { opacity: 1, duration: 0.05 }, "<");
    tl.to(fan0.l, { strokeDashoffset: 0, duration: 0.4, ease: "none" }, "<");
    tl.add(() => { p0.statusLbl.textContent = "overloaded"; }, "<0.2");
    tl.to(p0.ring, { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.7 });

    tl.add(() => { phase.textContent = "Salting appends a random suffix, spreading the ad across four partitions"; });
    tl.to(p0.ring, { opacity: 0, duration: 0.3 }, "<");
    tl.add(() => {
      p0.statusLbl.textContent = "active";
      p1.statusLbl.textContent = "active";
      p2.statusLbl.textContent = "active";
      p3.statusLbl.textContent = "active";
      p0.keyLbl.textContent = "ad_42#0";
      p1.keyLbl.textContent = "ad_42#1";
      p2.keyLbl.textContent = "ad_42#2";
      p3.keyLbl.textContent = "ad_42#3";
    }, "<");
    [fan1, fan2, fan3].forEach((f, i) => {
      tl.to(f.l, { opacity: 1, duration: 0.05 }, i === 0 ? "<0.1" : "<0.08");
      tl.to(f.l, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
    });
    tl.to({}, { duration: 0.7 });

    tl.add(() => { phase.textContent = "Each partition keeps its own partial count for the window"; });
    parts.forEach((p, i) => {
      tl.add(() => {
        p.statusLbl.textContent = "";
        p.countLbl.textContent = `${partials[i]} clicks`;
      }, i === 0 ? "<" : "<0.05");
      tl.to(p.countLbl, { opacity: 1, duration: 0.3 }, "<");
    });
    tl.to({}, { duration: 0.7 });

    tl.add(() => { phase.textContent = "A second stage adds the four partial counts into one true total"; });
    merges.forEach(({ l, len }, i) => {
      tl.to(l, { opacity: 1, duration: 0.05 }, i === 0 ? "<" : "<0.08");
      tl.to(l, { strokeDashoffset: 0, duration: 0.4, ease: "none" }, "<");
    });
    const total = partials.reduce((a, b) => a + b, 0);
    tl.add(() => { mergeTotal.textContent = `= ${total.toLocaleString()} clicks`; }, ">-0.1");
    tl.to(mergeTotal, { opacity: 1, duration: 0.3 }, "<");
    tl.to(mergeRing, { opacity: 1, duration: 0.3 }, "<");
    tl.to(mergeRing, { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });

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

export const HotAdSaltingDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 940 540" maxW="max-w-3xl" delay={delay} setup={setupHotAdSalting} />
);
