import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke GSAP animation for "Curriculum Learning, Sampling, and Hard-Example
   Mining". A curriculum's whole point is that the sampled pool of examples
   changes shape over training, so a single static picture can't show it, it
   needs to move. This shows a fixed difficulty histogram (easy examples on
   the left, hard on the right) with a moving threshold that starts covering
   only the easiest slice and sweeps rightward, activating each difficulty
   band as it passes, until the full range is included.

   Same VizFigure/mk/mkText boilerplate as the other bespoke animations on
   this site (see animations/url-shortener/ConceptViz.tsx). Theming is CSS
   vars only, via .viz-* classes, no literal colors.
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
   CURRICULUM SLIDE — a fixed difficulty histogram, a threshold that sweeps
   from easy to hard over training, activating each band as it passes.
   Bin heights are an illustrative bell shape (most examples sit at middling
   difficulty, with fewer at the extremes), not a claim about any one real
   dataset's distribution.
=========================================================================== */
const BASE_Y = 320;
const BINS = [
  { x: 148, h: 70 },
  { x: 225, h: 95 },
  { x: 302, h: 115 },
  { x: 378, h: 130 },
  { x: 455, h: 138 },
  { x: 532, h: 130 },
  { x: 609, h: 115 },
  { x: 686, h: 95 },
  { x: 762, h: 70 },
];
const BAR_W = 44;

function setupCurriculumSlide(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const phase = mkText(svg, "", 450, 28, "viz-phase", "middle");

  mk(svg, "line", { x1: 110, y1: BASE_Y, x2: 800, y2: BASE_Y, class: "viz-stroke" });
  mkText(svg, "easy", 148, 352, "viz-label-sm", "middle");
  mkText(svg, "hard", 762, 352, "viz-label-sm", "middle");
  mkText(svg, "training difficulty", 455, 392, "viz-label-sm", "middle");

  const activeBars = BINS.map((b) => {
    mk(svg, "rect", {
      x: b.x - BAR_W / 2, y: BASE_Y - b.h, width: BAR_W, height: b.h, class: "viz-ghost",
    });
    return mk(svg, "rect", {
      x: b.x - BAR_W / 2, y: BASE_Y - b.h, width: BAR_W, height: b.h, class: "viz-cell", opacity: 0,
    }) as SVGRectElement;
  });

  const threshold = mk(svg, "line", {
    x1: BINS[0].x, y1: 160, x2: BINS[0].x, y2: BASE_Y, class: "viz-blue",
  }) as SVGLineElement;
  threshold.style.strokeDasharray = "6 5";
  const thresholdLbl = mkText(svg, "sampling window", BINS[0].x, 122, "viz-label-sm", "middle") as SVGTextElement;

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    activeBars.forEach((b) => gsap.set(b, { opacity: 0 }));
    threshold.setAttribute("x1", String(BINS[0].x));
    threshold.setAttribute("x2", String(BINS[0].x));
    thresholdLbl.setAttribute("x", String(BINS[0].x));

    const moveWindow = (fromIdx: number, toIdx: number, duration: number) => {
      const state = { x: BINS[fromIdx].x };
      tl!.to(state, {
        x: BINS[toIdx].x,
        duration,
        ease: "power1.inOut",
        onUpdate: () => {
          threshold.setAttribute("x1", String(state.x));
          threshold.setAttribute("x2", String(state.x));
          thresholdLbl.setAttribute("x", String(state.x));
          BINS.forEach((b, i) => {
            if (b.x <= state.x + 1) gsap.set(activeBars[i], { opacity: 1 });
          });
        },
      }, ">");
    };

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Step 0, the sampling window only covers the easiest slice of the data"; });
    tl.to(activeBars[0], { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.6 });

    moveWindow(0, 4, 1.6);

    tl.add(() => { phase.textContent = "Step 5,000, the window has grown to include mid-difficulty examples"; });
    tl.to({}, { duration: 0.6 });

    moveWindow(4, 8, 1.6);

    tl.add(() => { phase.textContent = "Step 10,000, the full difficulty range is in play, hardest examples included"; });
    tl.to({}, { duration: 0.8 });

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

export const CurriculumSlideDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 440" maxW="max-w-2xl" delay={delay} setup={setupCurriculumSlide} />
);
