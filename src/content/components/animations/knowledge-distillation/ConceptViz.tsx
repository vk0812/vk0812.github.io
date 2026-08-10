import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke GSAP animation for "Knowledge Distillation".
   Theme comes entirely from CSS vars (.viz / .dark .viz in index.css), so the
   same SVG reads correctly in both themes. Plays once when scrolled into
   view, replay/speed controls copied verbatim from the url-shortener
   reference implementation (VizFigure, mk, mkText).

   TEMPERATURE RESHAPE — the one mechanism on this post where motion is
   genuinely clearer than a static bar chart. Watching probability mass
   redistribute across classes as temperature rises is the whole point.

   Real softmax numbers, verified with Node before wiring in (logits
   [4.6, 2.1, 1.0, 0.3, -1.0] for classes dog/wolf/fox/cat/horse):
     T=1  88.8, 7.3, 2.4, 1.2, 0.3
     T=2  61.4, 17.6, 10.2, 7.2, 3.7
     T=4  39.5, 21.2, 16.1, 13.5, 9.8
     T=8  29.0, 21.2, 18.5, 16.9, 14.4
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

type BarSpec = { name: string; values: number[] }; // one value per temperature step

const TEMPS = [1, 2, 4, 8];
const BARS: BarSpec[] = [
  { name: "dog", values: [88.8, 61.4, 39.5, 29.0] },
  { name: "wolf", values: [7.3, 17.6, 21.2, 21.2] },
  { name: "fox", values: [2.4, 10.2, 16.1, 18.5] },
  { name: "cat", values: [1.2, 7.2, 13.5, 16.9] },
  { name: "horse", values: [0.3, 3.7, 9.8, 14.4] },
];

const BASELINE_Y = 340;
const MAX_BAR_H = 230;
const BAR_W = 70;
const CENTERS = [180, 340, 500, 660, 820];
const TRACK_X0 = 180;
const TRACK_X1 = 820;
const TRACK_Y = 405;

function heightOf(pct: number) {
  return (pct / 100) * MAX_BAR_H;
}

function setupTemperatureReshape(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const phase = mkText(svg, "", 450, 26, "viz-phase", "middle");
  const tLabel = mkText(svg, "T = 1.0", 450, 62, "viz-num", "middle") as SVGTextElement;

  // baseline
  mk(svg, "line", { x1: 130, y1: BASELINE_Y, x2: 870, y2: BASELINE_Y, class: "viz-thin" });

  type Bar = {
    rect: SVGRectElement;
    label: SVGTextElement;
    proxy: { v: number };
  };

  const bars: Bar[] = BARS.map((b, i) => {
    const x = CENTERS[i];
    const startPct = b.values[0];
    const h = heightOf(startPct);
    const rect = mk(svg, "rect", {
      x: x - BAR_W / 2,
      y: BASELINE_Y - h,
      width: BAR_W,
      height: h,
      rx: 6,
      class: b.name === "dog" ? "viz-bar-pos" : "viz-box",
    }) as SVGRectElement;
    const label = mkText(svg, `${startPct.toFixed(1)}%`, x, BASELINE_Y - h - 12, "viz-label-sm", "middle") as SVGTextElement;
    mkText(svg, b.name, x, BASELINE_Y + 26, "viz-label", "middle");
    return { rect, label, proxy: { v: startPct } };
  });

  // temperature slider track
  mk(svg, "line", { x1: TRACK_X0, y1: TRACK_Y, x2: TRACK_X1, y2: TRACK_Y, class: "viz-thin" });
  TEMPS.forEach((t, i) => {
    const x = TRACK_X0 + (i / (TEMPS.length - 1)) * (TRACK_X1 - TRACK_X0);
    mk(svg, "line", { x1: x, y1: TRACK_Y - 5, x2: x, y2: TRACK_Y + 5, class: "viz-thin" });
    mkText(svg, String(t), x, TRACK_Y + 24, "viz-label-sm", "middle");
  });
  const marker = mk(svg, "circle", { cx: TRACK_X0, cy: TRACK_Y, r: 7, class: "viz-bar-pos" }) as SVGCircleElement;

  const applyBar = (bar: Bar) => {
    const h = heightOf(bar.proxy.v);
    bar.rect.setAttribute("y", String(BASELINE_Y - h));
    bar.rect.setAttribute("height", String(h));
    bar.label.setAttribute("y", String(BASELINE_Y - h - 12));
    bar.label.textContent = `${bar.proxy.v.toFixed(1)}%`;
  };

  const notes = [
    "At temperature 1, the teacher's softmax is sharp, almost all mass sits on the correct class",
    "Raising the temperature starts softening the distribution",
    "The runner-up classes now carry real, comparable probability mass",
    "At temperature 8, wolf, fox, and cat all read as plausible, this is the dark knowledge a hard label alone never carries",
  ];

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    bars.forEach((bar, i) => {
      bar.proxy.v = BARS[i].values[0];
      applyBar(bar);
    });
    tLabel.textContent = "T = 1.0";
    marker.setAttribute("cx", String(TRACK_X0));

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = notes[0]; });
    tl.to({}, { duration: 0.9 });

    for (let step = 1; step < TEMPS.length; step++) {
      const t = TEMPS[step];
      const x = TRACK_X0 + (step / (TEMPS.length - 1)) * (TRACK_X1 - TRACK_X0);
      tl.add(() => { phase.textContent = notes[step]; });
      tl.to(marker, { attr: { cx: x }, duration: 0.6, ease: "power1.inOut" }, "<");
      tl.add(() => { tLabel.textContent = `T = ${t}.0`; }, "<0.3");
      bars.forEach((bar, i) => {
        const toVal = BARS[i].values[step];
        tl.to(bar.proxy, {
          v: toVal,
          duration: 0.6,
          ease: "power1.inOut",
          onUpdate: () => applyBar(bar),
        }, "<");
      });
      tl.to({}, { duration: 0.7 });
    }

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

export const TemperatureReshapeDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 460" maxW="max-w-2xl" delay={delay} setup={setupTemperatureReshape} />
);
