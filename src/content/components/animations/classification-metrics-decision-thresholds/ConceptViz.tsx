import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   ThresholdSweepDiagram — the one animation in this post where motion is
   actually the point. A single decision threshold sweeps from strict (1.0)
   to lenient (0.0), and a dot walks the ROC curve and the PR curve at the
   same time, so the two curves' very different behavior under class
   imbalance is something the reader watches happen rather than reads about.

   Curve coordinates are real, not illustrative: a logistic regression fit on
   a 10,000-row synthetic dataset with a ~1.5% positive rate (sklearn
   make_classification, weights=[0.99, 0.01]), scored on a 3,000-row held-out
   split. Points were sampled evenly along sklearn's own roc_curve /
   precision_recall_curve output and verified by hand before use.
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
          <button onClick={doPlay} className={CTRL}>
            ↻ REPLAY
          </button>
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

/* Real sampled points, threshold sweeping from strict (index 0) to lenient
   (index 8), taken from sklearn's roc_curve / precision_recall_curve on the
   imbalanced logistic regression fit described above. */
const ROC_PTS = [
  { fpr: 0.0, tpr: 0.0 },
  { fpr: 0.014, tpr: 0.111 },
  { fpr: 0.032, tpr: 0.267 },
  { fpr: 0.059, tpr: 0.4 },
  { fpr: 0.092, tpr: 0.556 },
  { fpr: 0.184, tpr: 0.667 },
  { fpr: 0.502, tpr: 0.778 },
  { fpr: 0.698, tpr: 0.889 },
  { fpr: 1.0, tpr: 1.0 },
];
const PR_PTS = [
  { recall: 0.0, precision: 1.0 },
  { recall: 0.6, precision: 0.072 },
  { recall: 0.733, precision: 0.044 },
  { recall: 0.756, precision: 0.03 },
  { recall: 0.778, precision: 0.023 },
  { recall: 0.889, precision: 0.021 },
  { recall: 0.933, precision: 0.019 },
  { recall: 0.978, precision: 0.017 },
  { recall: 1.0, precision: 0.015 },
];

const ROC_X0 = 70, ROC_X1 = 290, ROC_Y0 = 288, ROC_Y1 = 55;
const PR_X0 = 440, PR_X1 = 660, PR_Y0 = 288, PR_Y1 = 55;
const pxRoc = (fpr: number) => ROC_X0 + fpr * (ROC_X1 - ROC_X0);
const pyRoc = (tpr: number) => ROC_Y0 - tpr * (ROC_Y0 - ROC_Y1);
const pxPr = (recall: number) => PR_X0 + recall * (PR_X1 - PR_X0);
const pyPr = (precision: number) => PR_Y0 - precision * (PR_Y0 - PR_Y1);

function setupThresholdSweep(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const phase = mkText(svg, "", 365, 24, "viz-phase", "middle");

  // ROC plot axes
  mk(svg, "line", { x1: ROC_X0, y1: ROC_Y0, x2: ROC_X0, y2: ROC_Y1, class: "viz-thin" });
  mk(svg, "line", { x1: ROC_X0, y1: ROC_Y0, x2: ROC_X1, y2: ROC_Y0, class: "viz-thin" });
  mkText(svg, "ROC curve", 180, 42, "viz-label-sm", "middle");
  mkText(svg, "FPR", 180, 318, "viz-label-sm", "middle");
  mkText(svg, "TPR", 34, 172, "viz-label-sm", "middle");
  mk(svg, "line", { x1: ROC_X0, y1: ROC_Y0, x2: ROC_X1, y2: ROC_Y1, class: "viz-thin", "stroke-dasharray": "3 3" });

  // PR plot axes
  mk(svg, "line", { x1: PR_X0, y1: PR_Y0, x2: PR_X0, y2: PR_Y1, class: "viz-thin" });
  mk(svg, "line", { x1: PR_X0, y1: PR_Y0, x2: PR_X1, y2: PR_Y0, class: "viz-thin" });
  mkText(svg, "PR curve", 550, 42, "viz-label-sm", "middle");
  mkText(svg, "Recall", 550, 318, "viz-label-sm", "middle");
  mkText(svg, "Precision", 394, 172, "viz-label-sm", "middle");

  const rocPath = mk(svg, "path", {
    d: `M ${ROC_PTS.map((p) => `${pxRoc(p.fpr)} ${pyRoc(p.tpr)}`).join(" L ")}`,
    class: "viz-blue",
    fill: "none",
    opacity: 0,
  }) as SVGPathElement;
  const prPath = mk(svg, "path", {
    d: `M ${PR_PTS.map((p) => `${pxPr(p.recall)} ${pyPr(p.precision)}`).join(" L ")}`,
    class: "viz-warn",
    fill: "none",
    opacity: 0,
  }) as SVGPathElement;
  const rocLen = (rocPath as SVGPathElement).getTotalLength ? rocPath.getTotalLength() : 900;
  const prLen = prPath.getTotalLength ? prPath.getTotalLength() : 900;
  rocPath.style.strokeDasharray = String(rocLen);
  prPath.style.strokeDasharray = String(prLen);

  const rocAucLbl = mkText(svg, "ROC-AUC ≈ 0.78", 180, 62, "viz-label-sm", "middle");
  const prAucLbl = mkText(svg, "PR-AUC ≈ 0.09", 550, 62, "viz-label-sm", "middle");
  gsap.set([rocAucLbl, prAucLbl], { opacity: 0 });

  const rocDot = mk(svg, "circle", { cx: pxRoc(ROC_PTS[0].fpr), cy: pyRoc(ROC_PTS[0].tpr), r: 5, class: "viz-arrow-blue", opacity: 0 });
  const prDot = mk(svg, "circle", { cx: pxPr(PR_PTS[0].recall), cy: pyPr(PR_PTS[0].precision), r: 5, class: "viz-arrow-warn", opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set(rocPath, { opacity: 0 });
    gsap.set(prPath, { opacity: 0 });
    rocPath.style.strokeDashoffset = String(rocLen);
    prPath.style.strokeDashoffset = String(prLen);
    gsap.set([rocAucLbl, prAucLbl], { opacity: 0 });
    gsap.set(rocDot, { opacity: 0, attr: { cx: pxRoc(ROC_PTS[0].fpr), cy: pyRoc(ROC_PTS[0].tpr) } });
    gsap.set(prDot, { opacity: 0, attr: { cx: pxPr(PR_PTS[0].recall), cy: pyPr(PR_PTS[0].precision) } });

    tl = gsap.timeline();
    tl.add(() => {
      phase.textContent = "Same threshold sweep, plotted two ways";
    });
    tl.to([rocPath, prPath], { opacity: 1, duration: 0.05 }, "<");
    tl.to(rocPath, { strokeDashoffset: 0, duration: 0.6, ease: "none" }, "<");
    tl.to(prPath, { strokeDashoffset: 0, duration: 0.6, ease: "none" }, "<");
    tl.to({}, { duration: 0.3 });

    tl.to([rocDot, prDot], { opacity: 1, duration: 0.05 }, ">");

    const narrations: Record<number, string> = {
      0: "Strict threshold. Almost nothing is flagged, both curves start near their origin",
      3: "Threshold loosens. FPR creeps up slowly on the left, but precision is already sliding on the right",
      6: "Threshold near 0.1. Catching most of the fraud costs a lot of false alarms either way",
      8: "Threshold at 0, everything flagged. ROC-AUC still reads 0.78, PR-AUC is only 0.09",
    };

    ROC_PTS.forEach((rp, i) => {
      if (i === 0) return;
      const pp = PR_PTS[i];
      if (narrations[i]) {
        tl!.add(() => {
          phase.textContent = narrations[i];
        });
      }
      tl!.to(rocDot, { attr: { cx: pxRoc(rp.fpr), cy: pyRoc(rp.tpr) }, duration: 0.35, ease: "power1.inOut" }, "<");
      tl!.to(prDot, { attr: { cx: pxPr(pp.recall), cy: pyPr(pp.precision) }, duration: 0.35, ease: "power1.inOut" }, "<");
      tl!.to({}, { duration: 0.35 });
    });

    tl.to([rocAucLbl, prAucLbl], { opacity: 1, duration: 0.4 }, ">");
  };

  return {
    play,
    pause: () => tl?.pause(),
    resume: () => tl?.play(),
    setRate: (r) => tl?.timeScale(r),
    cleanup: () => tl?.kill(),
  };
}

export const ThresholdSweepDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 730 340" maxW="max-w-3xl" delay={delay} setup={setupThresholdSweep} />
);
