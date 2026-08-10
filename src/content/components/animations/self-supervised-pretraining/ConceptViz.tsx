import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke visual for "Self-Supervised Pretraining".

   RepresentationCollapseDiagram animates the one mechanism in this post where
   motion genuinely carries the idea better than a static picture: six inputs
   start out with six distinct embeddings, then training nudges them forward.
   The left panel has nothing stopping it from mapping every input to nearly
   the same point (representation collapse), the right panel keeps the
   embeddings spread using the stop-gradient plus momentum target encoder
   trick described in the post. Fixed, hand-picked coordinates throughout,
   this isn't a claim about any real dataset, just a schematic of the failure
   mode and the fix. Theme comes entirely from CSS vars (.viz / .dark .viz in
   index.css), same pattern as every other bespoke animation on the site.
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
   Six fixed points per panel. Left panel interpolates toward a shared
   centroid over two training steps (collapse). Right panel gets small,
   bounded jitter each step that never trends toward a single point (the
   stop-gradient plus momentum target encoder keeping the spread alive).
   Coordinates verified by hand, panel rects are x 30-410 / 490-870, y
   106-436, every stage keeps every point at least 25 units inside its
   panel's edges.
=========================================================================== */
const LEFT_START: [number, number][] = [
  [90, 192], [170, 152], [250, 212], [330, 172], [360, 302], [130, 352],
];
const LEFT_STEP1: [number, number][] = [
  [142.8, 207.2], [190.8, 183.2], [238.8, 219.2], [286.8, 195.2], [304.8, 273.2], [166.8, 303.2],
];
const LEFT_STEP2: [number, number][] = [
  [202.2, 224.3], [214.2, 218.3], [226.2, 227.3], [238.2, 221.3], [242.7, 240.8], [208.2, 248.3],
];
const LEFT_FINAL: [number, number][] = [
  [218.0, 228.9], [220.4, 227.7], [222.8, 229.5], [225.2, 228.3], [226.1, 232.2], [219.2, 233.6],
];
const CENTROID: [number, number] = [222, 230];

const RIGHT_START: [number, number][] = [
  [550, 192], [630, 152], [710, 212], [790, 172], [820, 302], [590, 352],
];
const RIGHT_STEP1: [number, number][] = [
  [564, 182], [620, 164], [720, 200], [778, 182], [828, 312], [582, 342],
];
const RIGHT_STEP2: [number, number][] = [
  [558, 190], [628, 158], [712, 206], [784, 174], [822, 304], [588, 350],
];
const RIGHT_FINAL: [number, number][] = [
  [552, 188], [626, 156], [716, 202], [788, 178], [818, 300], [592, 346],
];

function setupCollapseDiagram(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const narration = mkText(svg, "", 450, 24, "viz-phase", "middle");

  mk(svg, "rect", { x: 30, y: 106, width: 380, height: 330, rx: 12, class: "viz-panel" });
  mk(svg, "rect", { x: 490, y: 106, width: 380, height: 330, rx: 12, class: "viz-panel" });

  mkText(svg, "NO SAFEGUARD", 220, 70, "viz-label", "middle");
  mkText(svg, "STOP-GRADIENT + MOMENTUM TARGET", 680, 70, "viz-label", "middle");

  const leftDots = LEFT_START.map(([x, y]) =>
    mk(svg, "circle", { cx: x, cy: y, r: 7, class: "viz-cell" }) as SVGCircleElement
  );
  const rightDots = RIGHT_START.map(([x, y]) =>
    mk(svg, "circle", { cx: x, cy: y, r: 7, class: "viz-cell" }) as SVGCircleElement
  );

  const ring = mk(svg, "circle", {
    cx: CENTROID[0], cy: CENTROID[1], r: 55, class: "viz-warn", "stroke-dasharray": "6 5",
  }) as SVGCircleElement;
  gsap.set(ring, { opacity: 0 });

  const leftRecap = mkText(svg, "", 220, 472, "viz-warn-lbl", "middle");
  const rightRecap = mkText(svg, "", 680, 472, "viz-label-sm", "middle");
  gsap.set([leftRecap, rightRecap], { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  let rate = 1;

  const setDots = (dots: SVGCircleElement[], coords: [number, number][], onUpdate?: () => void) => {
    coords.forEach(([x, y], i) => gsap.set(dots[i], { attr: { cx: x, cy: y } }));
    onUpdate?.();
  };

  const tweenDots = (dots: SVGCircleElement[], coords: [number, number][], duration: number, pos: string) => {
    dots.forEach((dot, i) => {
      const [x, y] = coords[i];
      tl!.to(dot, { attr: { cx: x, cy: y }, duration, ease: "power2.inOut" }, i === 0 ? pos : "<");
    });
  };

  const play = () => {
    tl?.kill();
    narration.textContent = "";
    setDots(leftDots, LEFT_START);
    setDots(rightDots, RIGHT_START);
    gsap.set(ring, { opacity: 0 });
    gsap.set([leftRecap, rightRecap], { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => {
      narration.textContent = "Six different inputs start with six different embeddings";
    });
    tl.to({}, { duration: 0.9 });

    tl.add(() => {
      narration.textContent = "One gradient step nudges every embedding toward lower loss";
    });
    tweenDots(leftDots, LEFT_STEP1, 0.9, "<");
    tweenDots(rightDots, RIGHT_STEP1, 0.9, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => {
      narration.textContent = "Loss keeps dropping in both panels, but for different reasons";
    });
    tweenDots(leftDots, LEFT_STEP2, 1.0, "<");
    tweenDots(rightDots, RIGHT_STEP2, 1.0, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => {
      narration.textContent = "Left collapses to nearly one point, right keeps six distinguishable ones";
    });
    tweenDots(leftDots, LEFT_FINAL, 0.8, "<");
    tweenDots(rightDots, RIGHT_FINAL, 0.8, "<");
    tl.to(ring, { opacity: 1, duration: 0.4 }, ">-0.2");
    tl.to([leftRecap, rightRecap], { opacity: 1, duration: 0.4 }, "<");
    tl.add(() => {
      leftRecap.textContent = "COLLAPSED, LOSS FELL FOR THE WRONG REASON";
      rightRecap.textContent = "STAYED SPREAD, SIX INPUTS STILL SIX POINTS";
    }, "<");

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

export const RepresentationCollapseDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 500" maxW="max-w-3xl" delay={delay} setup={setupCollapseDiagram} />
);
