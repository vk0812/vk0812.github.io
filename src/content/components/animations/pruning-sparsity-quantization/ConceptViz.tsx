import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke visuals for "Pruning, Sparsity, and Quantization".

   PruningPatternGrid is fully static, plain Tailwind divs, no gsap. Two
   weight matrices at the exact same sparsity read clearly without any
   motion, so it stays static on purpose.

   MagnitudeThresholdSweep is the one place motion actually earns its keep.
   A threshold sweeps upward and individual weights cross below it and get
   zeroed one group at a time, which is a mechanism about something changing
   over a sweep, not just a multi-step process, so it gets a real timeline.
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

const CTRL =
  "font-mono text-xs tracking-widest h-8 px-3 inline-flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors rounded";
const CTRL_ON =
  "font-mono text-xs tracking-widest h-8 px-3 inline-flex items-center justify-center border border-foreground bg-foreground text-background rounded";

function VizFigure({
  caption,
  viewBox,
  maxW = "max-w-3xl",
  delay,
  setup,
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
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            doPlay();
            io.disconnect();
          }
        }),
      { threshold: 0.25 }
    );
    io.observe(svg);
    return () => {
      io.disconnect();
      api.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup]);

  const togglePlay = () => {
    const api = apiRef.current;
    if (!api) return;
    if (playing) {
      api.pause();
      setPlaying(false);
    } else {
      api.resume();
      setPlaying(true);
    }
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
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay }}
      className={`not-prose my-10 mx-auto ${maxW}`}
    >
      <div className="viz rounded-lg border border-border bg-card p-3 sm:p-5 shadow-sm">
        <svg ref={svgRef} viewBox={viewBox} preserveAspectRatio="xMidYMid meet" />
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button onClick={togglePlay} className={CTRL} style={{ minWidth: "5.5rem" }}>
            {playing ? "PAUSE" : "PLAY"}
          </button>
          <button onClick={doPlay} className={CTRL}>
            REPLAY
          </button>
          <span className="w-px h-5 bg-border mx-1" aria-hidden />
          {[0.5, 1, 2].map((r) => (
            <button key={r} onClick={() => pickRate(r)} className={rate === r ? CTRL_ON : CTRL}>
              {r}x
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
   PRUNING PATTERN GRID, static, no gsap, no play controls. Two 6 by 8 weight
   matrices, both at exactly 25 percent sparsity (12 of 48 weights zeroed).
   The left one zeros two whole columns, the right one zeros 12 scattered
   individual weights. Same sparsity, completely different shape.
=========================================================================== */

const GRID_ROWS = 6;
const GRID_COLS = 8;
const STRUCTURED_ZERO_COLS = new Set([2, 5]);
const UNSTRUCTURED_ZERO_CELLS = new Set([
  "0-1", "0-6", "1-3", "1-7", "2-0", "2-4",
  "3-2", "3-6", "4-1", "4-5", "5-3", "5-7",
]);

function PruningGridPanel({
  title,
  note,
  isZeroed,
}: {
  title: string;
  note: string;
  isZeroed: (row: number, col: number) => boolean;
}) {
  const cells: { row: number; col: number; zeroed: boolean }[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      cells.push({ row, col, zeroed: isZeroed(row, col) });
    }
  }
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="font-sans text-xs sm:text-sm font-semibold text-foreground">{title}</p>
      <div className="grid w-full max-w-[260px] grid-cols-8 gap-1.5">
        {cells.map(({ row, col, zeroed }) => (
          <div
            key={`${row}-${col}`}
            className={
              zeroed
                ? "aspect-square rounded-sm border border-dashed border-muted-foreground/40"
                : "aspect-square rounded-sm bg-foreground/70"
            }
          />
        ))}
      </div>
      <p className="max-w-[260px] text-center font-sans text-[11px] leading-snug text-muted-foreground sm:text-xs">
        {note}
      </p>
    </div>
  );
}

export const PruningPatternGrid = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-10"
  >
    <div className="rounded-2xl border border-border bg-muted/20 p-6 sm:p-10">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <PruningGridPanel
          title="Structured pruning"
          note="Two of eight columns zeroed completely, 25 percent sparsity, whole channels removed at once."
          isZeroed={(row, col) => STRUCTURED_ZERO_COLS.has(col)}
        />
        <PruningGridPanel
          title="Unstructured pruning"
          note="12 individual weights zeroed, the same 25 percent sparsity, scattered with no shape to it."
          isZeroed={(row, col) => UNSTRUCTURED_ZERO_CELLS.has(`${row}-${col}`)}
        />
      </div>
    </div>
    {caption && (
      <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
        {caption}
      </figcaption>
    )}
  </motion.figure>
);

/* ===========================================================================
   MAGNITUDE THRESHOLD SWEEP, the one gsap piece. 36 weights sit in a fixed
   grid, each shaded by its own magnitude. A threshold gauge on the right
   sweeps up from 0 toward 1, and every weight whose magnitude falls below
   the current threshold gets struck out the moment the sweep passes it.

   The 36 magnitudes and the exact set of weights that newly cross each
   threshold step were computed and verified by hand (a small Node script
   filtering the same array against each threshold), not eyeballed, so the
   sparsity percentages shown always match the weights actually struck out.
=========================================================================== */

const MAGNITUDES = [
  0.57, 0.51, 0.89, 0.68, 0.74, 0.67,
  0.52, 0.16, 0.07, 0.23, 0.29, 0.97,
  0.69, 0.66, 0.36, 0.26, 0.12, 0.87,
  0.83, 0.82, 0.45, 0.29, 0.82, 0.06,
  0.75, 0.94, 0.78, 0.13, 0.34, 0.64,
  0.07, 0.28, 0.50, 0.75, 0.28, 0.51,
];

const SWEEP_COLS = 6;
const CELL = 50;
const GAP = 12;
const GRID_X0 = 60;
const GRID_Y0 = 110;
const cellX = (col: number) => GRID_X0 + col * (CELL + GAP);
const cellY = (row: number) => GRID_Y0 + row * (CELL + GAP);
const GRID_RIGHT = cellX(SWEEP_COLS - 1) + CELL;
const GRID_BOTTOM = cellY(SWEEP_COLS - 1) + CELL;

const SWEEP_STEPS: { threshold: number; newlyPruned: number[]; totalPruned: number; pct: number }[] = [
  { threshold: 0.05, newlyPruned: [], totalPruned: 0, pct: 0 },
  { threshold: 0.15, newlyPruned: [8, 16, 23, 27, 30], totalPruned: 5, pct: 14 },
  { threshold: 0.30, newlyPruned: [7, 9, 10, 15, 21, 31, 34], totalPruned: 12, pct: 33 },
  { threshold: 0.50, newlyPruned: [14, 20, 28], totalPruned: 15, pct: 42 },
  { threshold: 0.70, newlyPruned: [0, 1, 3, 5, 6, 12, 13, 29, 32, 35], totalPruned: 25, pct: 69 },
];

const GAUGE_X = 480;
const GAUGE_TOP = GRID_Y0;
const GAUGE_BOTTOM = GRID_BOTTOM;
const GAUGE_H = GAUGE_BOTTOM - GAUGE_TOP;
const GAUGE_W = 46;

function setupMagnitudeSweep(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const phase = mkText(svg, "", 340, 20, "viz-phase", "middle");

  const rects: SVGRectElement[] = [];
  const strikes: SVGGElement[] = [];
  MAGNITUDES.forEach((m, i) => {
    const row = Math.floor(i / SWEEP_COLS);
    const col = i % SWEEP_COLS;
    const x = cellX(col);
    const y = cellY(row);
    const rect = mk(svg, "rect", { x, y, width: CELL, height: CELL, rx: 4, class: "viz-box" }) as SVGRectElement;
    rect.style.fillOpacity = String(0.15 + m * 0.75);
    rects.push(rect);

    const strike = mk(svg, "g", { opacity: 0 }) as SVGGElement;
    mk(strike, "line", { x1: x + 7, y1: y + 7, x2: x + CELL - 7, y2: y + CELL - 7, class: "viz-thin", "stroke-width": 2 });
    mk(strike, "line", { x1: x + CELL - 7, y1: y + 7, x2: x + 7, y2: y + CELL - 7, class: "viz-thin", "stroke-width": 2 });
    strikes.push(strike);
  });

  mk(svg, "rect", { x: GAUGE_X, y: GAUGE_TOP, width: GAUGE_W, height: GAUGE_H, class: "viz-thin" });

  const gaugeFill = mk(svg, "rect", {
    x: GAUGE_X, y: GAUGE_BOTTOM, width: GAUGE_W, height: 0, class: "viz-panel",
  }) as SVGRectElement;

  const thresholdLabel = mkText(svg, "threshold = 0.00", GAUGE_X + GAUGE_W / 2, GAUGE_TOP - 36, "viz-label-sm", "middle");
  const sparsityLabel = mkText(
    svg,
    "36 weights, 0 pruned, 0% sparsity",
    GRID_X0 + (GRID_RIGHT - GRID_X0) / 2,
    GRID_BOTTOM + 40,
    "viz-label-sm",
    "middle"
  );

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    rects.forEach((r) => gsap.set(r, { opacity: 1 }));
    strikes.forEach((s) => gsap.set(s, { opacity: 0 }));
    gsap.set(gaugeFill, { attr: { y: GAUGE_BOTTOM, height: 0 } });
    thresholdLabel.textContent = "threshold = 0.00";
    sparsityLabel.textContent = "36 weights, 0 pruned, 0% sparsity";

    tl = gsap.timeline();
    tl.add(() => {
      phase.textContent = "Every weight starts in, the threshold sweeps up from zero";
    });
    tl.to({}, { duration: 0.5 });

    SWEEP_STEPS.forEach((step) => {
      tl!.add(() => {
        thresholdLabel.textContent = `threshold = ${step.threshold.toFixed(2)}`;
        sparsityLabel.textContent = `36 weights, ${step.totalPruned} pruned, ${step.pct}% sparsity`;
        phase.textContent =
          step.newlyPruned.length === 0
            ? `Threshold ${step.threshold.toFixed(2)}, nothing this small yet`
            : `Threshold ${step.threshold.toFixed(2)}, ${step.newlyPruned.length} more weight${
                step.newlyPruned.length === 1 ? "" : "s"
              } drop below it`;
      });
      tl!.to(
        gaugeFill,
        {
          attr: { y: GAUGE_BOTTOM - step.threshold * GAUGE_H, height: step.threshold * GAUGE_H },
          duration: 0.5,
          ease: "power1.inOut",
        },
        "<"
      );
      step.newlyPruned.forEach((i, j) => {
        tl!.to(rects[i], { opacity: 0.3, duration: 0.3 }, j === 0 ? "<0.1" : "<0.06");
        tl!.to(strikes[i], { opacity: 1, duration: 0.3 }, "<");
      });
      tl!.to({}, { duration: 0.6 });
    });

    tl.add(() => {
      phase.textContent = "25 of 36 weights are exactly zero now, the rest are untouched";
    });
  };

  return {
    play,
    pause: () => tl?.pause(),
    resume: () => tl?.play(),
    setRate: (r) => tl?.timeScale(r),
    cleanup: () => tl?.kill(),
  };
}

export const MagnitudeThresholdSweep = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 680 560" maxW="max-w-3xl" delay={delay} setup={setupMagnitudeSweep} />
);
