import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke visual for "Group Relative Policy Optimization".
   GroupAdvantageDiagram narrates the post's running example end to end,
   sample four completions for the same prompt, reveal their rewards, draw
   the group mean as a baseline, then fork each completion's reward into a
   positive or negative advantage relative to that mean. Motion is the point
   here, the fork above/below the mean is literally what the algorithm does.
   Theme comes entirely from CSS vars (.viz / .dark .viz in index.css) via
   the shared semantic classes, so it reads correctly in both themes.
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
   GROUP ADVANTAGE — the 7 x 6 example. Four completions (42, 43, 40, 41),
   rewards [1, 0, 0, 0], group mean 0.25, advantages [+0.75, -0.25, -0.25,
   -0.25]. Every number matches the post's prose exactly.
=========================================================================== */
const ANSWERS = [
  { text: "42", reward: 1.0, colX: 135 },
  { text: "43", reward: 0.0, colX: 285 },
  { text: "40", reward: 0.0, colX: 435 },
  { text: "41", reward: 0.0, colX: 585 },
];
const MEAN = 0.25;
const SCALE = 145; // px per 1.0 reward unit
const BASELINE_Y = 405;
const barTopY = (reward: number) => BASELINE_Y - reward * SCALE;
const MEAN_Y = barTopY(MEAN);

function setupGroupAdvantage(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: "grpo-arrow", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 360, 18, "viz-phase");

  // Prompt box
  mk(svg, "rect", { x: 270, y: 50, width: 180, height: 40, rx: 8, class: "viz-panel" });
  mkText(svg, "7 × 6 = ?", 360, 75, "viz-label");

  // Arrows from prompt to each answer box
  const arrows = ANSWERS.map((a) => {
    const ln = mk(svg, "line", {
      x1: 360, y1: 90, x2: a.colX, y2: 143,
      class: "viz-arrow-ink", "marker-end": "url(#grpo-arrow)",
    }) as SVGLineElement;
    const len = Math.hypot(a.colX - 360, 143 - 90);
    ln.style.strokeDasharray = String(len);
    gsap.set(ln, { opacity: 0 });
    return { ln, len };
  });

  // Answer boxes + labels
  ANSWERS.forEach((a) => {
    mk(svg, "rect", { x: a.colX - 45, y: 143, width: 90, height: 44, rx: 8, class: "viz-box" });
    mkText(svg, a.text, a.colX, 170, "viz-num");
  });

  // Reward / advantage badges (text swaps in place between phases)
  const badges = ANSWERS.map((a) =>
    mkText(svg, "", a.colX, 229, "viz-label-sm") as SVGTextElement
  );
  badges.forEach((b) => gsap.set(b, { opacity: 0 }));

  // Bars (reward height), one per answer
  const bars = ANSWERS.map((a) => {
    const r = mk(svg, "rect", {
      x: a.colX - 25, y: BASELINE_Y, width: 50, height: 0, rx: 4, class: "viz-panel",
    }) as SVGRectElement;
    return r;
  });

  // Advantage overlays, drawn on top of the bars once the mean is known
  const overlays = ANSWERS.map((a, i) => {
    const el =
      i === 0
        ? (mk(svg, "rect", { x: a.colX - 25, y: barTopY(a.reward), width: 50, height: 0, rx: 4, class: "viz-blue" }) as SVGRectElement)
        : (mk(svg, "rect", { x: a.colX - 25, y: MEAN_Y, width: 50, height: 0, rx: 4, class: "viz-warn" }) as SVGRectElement);
    gsap.set(el, { opacity: 0 });
    return el;
  });

  // Mean line
  const meanLine = mk(svg, "line", {
    x1: 106, y1: MEAN_Y, x2: 614, y2: MEAN_Y, class: "viz-thin",
  }) as SVGLineElement;
  meanLine.setAttribute("stroke-dasharray", "5 5");
  gsap.set(meanLine, { opacity: 0 });
  const meanLabel = mkText(svg, "mean reward = 0.25", 360, 337, "viz-label-sm");
  gsap.set(meanLabel, { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  let rate = 1;

  const play = () => {
    tl?.kill();
    phase.textContent = "";
    arrows.forEach(({ ln, len }) => gsap.set(ln, { opacity: 1, strokeDashoffset: len }));
    badges.forEach((b) => gsap.set(b, { opacity: 0 }));
    bars.forEach((b) => gsap.set(b, { attr: { height: 0, y: BASELINE_Y } }));
    overlays.forEach((o, i) =>
      gsap.set(o, { opacity: 0, attr: i === 0 ? { height: 0, y: barTopY(ANSWERS[0].reward) } : { height: 0, y: MEAN_Y } })
    );
    gsap.set(meanLine, { opacity: 0 });
    gsap.set(meanLabel, { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Sample the current policy four times for the same prompt."; });
    arrows.forEach(({ ln, len }, i) => {
      tl.to(ln, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, i === 0 ? "<" : "<0.08");
    });
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Score each completion, 1 if correct, 0 if wrong."; });
    ANSWERS.forEach((a, i) => {
      badges[i].textContent = `reward = ${a.reward.toFixed(1)}`;
      tl.to(badges[i], { opacity: 1, duration: 0.3 }, i === 0 ? "<" : "<0.05");
    });
    tl.to(bars[0], { attr: { y: barTopY(ANSWERS[0].reward), height: SCALE * ANSWERS[0].reward }, duration: 0.5 }, "<");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "The group mean, 0.25, becomes the baseline. No critic network needed."; });
    tl.to(meanLine, { opacity: 1, duration: 0.4 }, "<");
    tl.to(meanLabel, { opacity: 1, duration: 0.4 }, "<0.1");
    tl.to({}, { duration: 0.6 });

    tl.add(() => {
      phase.textContent = "Answers above the mean get a positive advantage, answers below get a negative one.";
      badges[0].textContent = "advantage = +0.75";
      for (let i = 1; i < 4; i++) badges[i].textContent = "advantage = -0.25";
    });
    tl.to(overlays[0], { opacity: 1, attr: { height: MEAN_Y - barTopY(ANSWERS[0].reward) }, duration: 0.5 }, "<");
    for (let i = 1; i < 4; i++) {
      tl.to(overlays[i], { opacity: 1, attr: { height: BASELINE_Y - MEAN_Y }, duration: 0.5 }, i === 1 ? "<" : "<0.05");
    }
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

export const GroupAdvantageDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 720 430" maxW="max-w-2xl" delay={delay} setup={setupGroupAdvantage} />
);
