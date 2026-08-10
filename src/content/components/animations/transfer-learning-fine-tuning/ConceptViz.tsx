import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke GSAP visual for "Transfer Learning and Fine-Tuning".
   Catastrophic forgetting is the one mechanism in this post where motion
   actually earns its keep over a static chart, watching task A's curve slide
   down while task B's curve climbs, in sync, step by step, makes the "shared
   weights, no protection for the old task" point land in a way a finished
   static chart doesn't. Coordinates are precomputed offline (see the post's
   verification notes) from two simple, clearly-labeled illustrative curves,
   not a claimed benchmark result. Theme comes entirely from the .viz / .dark
   .viz CSS vars in index.css, same convention as every other bespoke figure.
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
   CATASTROPHIC FORGETTING — two accuracy curves against fine-tuning steps on
   a new task. Task A (the original task) starts high and slides down. Task B
   (the new task) starts at chance level and climbs. Both curves self-draw in
   four synchronized segments, narrated step by step, so the crossing point
   and the widening gap read as something that happens over time rather than
   a finished chart to stare at.

   Curve values come from two illustrative closed-form curves, not a real
   experiment:
     accA(t) = 40 + 51 * exp(-t/300)   (91% -> ~42%)
     accB(t) = 93 - 43 * exp(-t/250)   (50% -> ~92%)
   Coordinates were sampled every 50 steps from t=0 to t=1000, mapped with
   px(t) = 70 + 0.82*t and py(acc) = 400 - 3.10*acc, and verified offline
   before being hardcoded here.
=========================================================================== */
type Seg = { d: string; len: number };

const A_SEGS: Seg[] = [
  { d: "M70.0,117.9 L111.0,142.2 L152.0,162.7 L193.0,180.1", len: 138.0 },
  { d: "M193.0,180.1 L234.0,194.8 L275.0,207.3 L316.0,217.8 L357.0,226.8 L398.0,234.3", len: 212.4 },
  { d: "M398.0,234.3 L439.0,240.7 L480.0,246.1 L521.0,250.7 L562.0,254.6 L603.0,257.9 L644.0,260.7", len: 247.5 },
  { d: "M644.0,260.7 L685.0,263.0 L726.0,265.0 L767.0,266.7 L808.0,268.1 L849.0,269.3 L890.0,270.4", len: 246.2 },
];
const B_SEGS: Seg[] = [
  { d: "M70.0,245.0 L111.0,220.8 L152.0,201.1 L193.0,184.9", len: 137.2 },
  { d: "M193.0,184.9 L234.0,171.6 L275.0,160.7 L316.0,151.8 L357.0,144.6 L398.0,138.6", len: 210.5 },
  { d: "M398.0,138.6 L439.0,133.7 L480.0,129.7 L521.0,126.5 L562.0,123.8 L603.0,121.6 L644.0,119.8", len: 246.8 },
  { d: "M644.0,119.8 L685.0,118.3 L726.0,117.1 L767.0,116.1 L808.0,115.3 L849.0,114.7 L890.0,114.1", len: 246.1 },
];

const NOTES = [
  "Fine-tuning starts, barely any change yet on either task.",
  "By around step 150, task B already matches task A, and task A keeps falling.",
  "More steps help task B and keep costing task A, nothing protects it.",
  "By step 1000, task B is near its ceiling, task A has lost about half its accuracy.",
];

function setupCatastrophicForgetting(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const phase = mkText(svg, "", 480, 20, "viz-phase", "middle");

  // legend
  mk(svg, "line", { x1: 150, y1: 50, x2: 180, y2: 50, class: "viz-warn", "stroke-width": 2.5 });
  mkText(svg, "Task A, the original task", 188, 54, "viz-label-sm");
  mk(svg, "line", { x1: 520, y1: 50, x2: 550, y2: 50, class: "viz-blue", "stroke-width": 2.5 });
  mkText(svg, "Task B, the new task being fine-tuned", 558, 54, "viz-label-sm");

  // axes
  mk(svg, "line", { x1: 70, y1: 90, x2: 70, y2: 400, class: "viz-stroke", "stroke-width": 1.5 });
  mk(svg, "line", { x1: 70, y1: 400, x2: 890, y2: 400, class: "viz-stroke", "stroke-width": 1.5 });

  // y gridline + ticks
  mk(svg, "line", { x1: 70, y1: 245, x2: 890, y2: 245, class: "viz-thin", "stroke-dasharray": "2 6", opacity: 0.5 });
  mkText(svg, "100", 58, 94, "viz-label-sm", "end");
  mkText(svg, "50", 58, 249, "viz-label-sm", "end");
  mkText(svg, "0", 58, 404, "viz-label-sm", "end");
  const yTitle = mk(svg, "text", { x: 34, y: 245, class: "viz-label", "text-anchor": "middle", transform: "rotate(-90 34 245)" });
  yTitle.textContent = "Accuracy";

  // x ticks
  mkText(svg, "0", 70, 420, "viz-label-sm", "middle");
  mkText(svg, "500", 480, 420, "viz-label-sm", "middle");
  mkText(svg, "1000", 890, 420, "viz-label-sm", "middle");
  mkText(svg, "Fine-tuning steps on the new task", 480, 445, "viz-label", "middle");

  const aPaths = A_SEGS.map((s) => {
    const p = mk(svg, "path", { d: s.d, fill: "none", class: "viz-warn", "stroke-width": 2.5, opacity: 0 }) as SVGPathElement;
    p.style.strokeDasharray = String(s.len);
    return { el: p, len: s.len };
  });
  const bPaths = B_SEGS.map((s) => {
    const p = mk(svg, "path", { d: s.d, fill: "none", class: "viz-blue", "stroke-width": 2.5, opacity: 0 }) as SVGPathElement;
    p.style.strokeDasharray = String(s.len);
    return { el: p, len: s.len };
  });

  const ringA = mk(svg, "circle", { cx: 890, cy: 270.4, r: 7, class: "viz-warn", fill: "none", "stroke-width": 2, opacity: 0 }) as SVGCircleElement;
  const ringB = mk(svg, "circle", { cx: 890, cy: 114.1, r: 7, class: "viz-blue", fill: "none", "stroke-width": 2, opacity: 0 }) as SVGCircleElement;

  let tl: gsap.core.Timeline | null = null;
  let rate = 1;

  const play = () => {
    tl?.kill();
    phase.textContent = "";
    [...aPaths, ...bPaths].forEach(({ el, len }) => {
      gsap.set(el, { opacity: 0 });
      el.style.strokeDashoffset = String(len);
    });
    gsap.set([ringA, ringB], { opacity: 0 });

    tl = gsap.timeline();

    aPaths.forEach((segA, i) => {
      const segB = bPaths[i];
      tl!.add(() => { phase.textContent = NOTES[i]; }, i === 0 ? 0 : ">");
      tl!.to(segA.el, { opacity: 1, duration: 0.05 }, "<");
      tl!.to(segA.el, { strokeDashoffset: 0, duration: 0.6, ease: "none" }, "<");
      tl!.to(segB.el, { opacity: 1, duration: 0.05 }, "<");
      tl!.to(segB.el, { strokeDashoffset: 0, duration: 0.6, ease: "none" }, "<");
      tl!.to({}, { duration: 0.35 });
    });

    tl.to([ringA, ringB], { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to([ringA, ringB], { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 3 });

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

export const CatastrophicForgettingDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 480" maxW="max-w-3xl" delay={delay} setup={setupCatastrophicForgetting} />
);
