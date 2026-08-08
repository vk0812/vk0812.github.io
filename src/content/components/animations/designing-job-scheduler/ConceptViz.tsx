import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke concept animations for "Designing a Distributed Job Scheduler".
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

/* Draws a straight line with a self-drawing dash reveal, returns helpers to
   reset and redraw it (some edges in these stories fire more than once). */
function makeLine(svg: SVGSVGElement, x1: number, y1: number, x2: number, y2: number, markerId: string) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const line = mk(svg, "line", {
    x1, y1, x2, y2, class: "viz-stroke", "marker-end": `url(#${markerId})`, opacity: 0,
  }) as SVGLineElement;
  line.style.strokeDasharray = String(len);
  line.style.strokeDashoffset = String(len);
  return { line, len };
}

/* ===========================================================================
   JOB LIFECYCLE — scheduled -> queued -> running -> (fail -> backoff ->
   requeue) -> running -> success. One job, one retry, one eventual success.
=========================================================================== */
function setupJobLifecycle(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `jl-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 28, "viz-phase", "middle");

  // Boxes: scheduled, queued, running, success (top row) + backoff (below running)
  const scheduledBox = mk(svg, "rect", { x: 55, y: 135, width: 150, height: 70, rx: 12, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const scheduledLbl = mkText(svg, "Scheduled", 130, 165, "viz-label", "middle");
  const scheduledSub = mkText(svg, "job due 10:00:00", 130, 188, "viz-label-sm", "middle");

  const queuedBox = mk(svg, "rect", { x: 275, y: 135, width: 150, height: 70, rx: 12, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const queuedLbl = mkText(svg, "Queued", 350, 165, "viz-label", "middle");
  const queuedSub = mkText(svg, "execution queue", 350, 188, "viz-label-sm", "middle");
  const queuedRing = mk(svg, "rect", { x: 269, y: 129, width: 162, height: 82, rx: 16, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;

  const runningBox = mk(svg, "rect", { x: 495, y: 135, width: 150, height: 70, rx: 12, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const runningLbl = mkText(svg, "Running", 570, 165, "viz-label", "middle");
  const runningSub = mkText(svg, "attempt 1", 570, 188, "viz-label-sm", "middle") as SVGTextElement;
  const runningRing = mk(svg, "rect", { x: 489, y: 129, width: 162, height: 82, rx: 16, class: "viz-warn", fill: "none", opacity: 0 }) as SVGRectElement;

  const successBox = mk(svg, "rect", { x: 715, y: 135, width: 150, height: 70, rx: 12, class: "viz-panel", opacity: 0 }) as SVGRectElement;
  const successLbl = mkText(svg, "Success", 790, 165, "viz-label", "middle");
  const successSub = mkText(svg, "attempt 2", 790, 188, "viz-label-sm", "middle") as SVGTextElement;
  const successRing = mk(svg, "rect", { x: 709, y: 129, width: 162, height: 82, rx: 16, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;

  const backoffBox = mk(svg, "rect", { x: 495, y: 305, width: 150, height: 70, rx: 12, class: "viz-panel", opacity: 0 }) as SVGRectElement;
  const backoffLbl = mkText(svg, "Backoff", 570, 335, "viz-label", "middle");
  const backoffSub = mkText(svg, "attempt 1 failed", 570, 358, "viz-warn-lbl", "middle");

  // Edges
  const eSchQueued = makeLine(svg, 205, 170, 275, 170, `jl-${uid}`);
  const eQueuedRunning = makeLine(svg, 425, 170, 495, 170, `jl-${uid}`);
  const eRunningBackoff = makeLine(svg, 570, 205, 570, 305, `jl-${uid}`);
  const eBackoffQueued = makeLine(svg, 495, 340, 350, 205, `jl-${uid}`);
  const eRunningSuccess = makeLine(svg, 645, 170, 715, 170, `jl-${uid}`);

  const allNodes = [scheduledBox, scheduledLbl, scheduledSub, queuedBox, queuedLbl, queuedSub, runningBox, runningLbl, runningSub, successBox, successLbl, successSub, backoffBox, backoffLbl, backoffSub];
  const allRings = [queuedRing, runningRing, successRing];
  const allEdges = [eSchQueued, eQueuedRunning, eRunningBackoff, eBackoffQueued, eRunningSuccess];

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set(allNodes, { opacity: 0 });
    gsap.set(allRings, { opacity: 0 });
    allEdges.forEach((e) => {
      gsap.set(e.line, { opacity: 0 });
      e.line.style.strokeDashoffset = String(e.len);
    });
    runningSub.textContent = "attempt 1";
    successSub.textContent = "attempt 2";

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "The scheduler finds a due job"; });
    tl.to(scheduledBox, { opacity: 1, duration: 0.35 }, "<");
    tl.to([scheduledLbl, scheduledSub], { opacity: 1, duration: 0.35 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "It's handed to the durable execution queue"; });
    tl.to(eSchQueued.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(eSchQueued.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([queuedBox, queuedLbl, queuedSub], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "A worker leases it and starts attempt 1"; });
    tl.to(eQueuedRunning.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(eQueuedRunning.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([runningBox, runningLbl, runningSub], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "The handler throws, attempt 1 fails"; });
    tl.to(runningRing, { opacity: 1, duration: 0.25 }, "<");
    tl.to(runningRing, { opacity: 0, duration: 0.4 }, ">0.15");
    tl.to(eRunningBackoff.line, { opacity: 1, duration: 0.05 }, "<-0.3");
    tl.to(eRunningBackoff.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([backoffBox, backoffLbl, backoffSub], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "After a short backoff, it's requeued as attempt 2"; });
    tl.to(eBackoffQueued.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(eBackoffQueued.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(queuedRing, { opacity: 1, duration: 0.25 }, "<0.1");
    tl.to(queuedRing, { opacity: 0, duration: 0.4 }, ">0.15");
    tl.to({}, { duration: 0.4 });

    tl.add(() => {
      phase.textContent = "Attempt 2 runs and succeeds";
      runningSub.textContent = "attempt 2";
    });
    tl.set(eQueuedRunning.line, { opacity: 0 });
    tl.set(eQueuedRunning.line, { strokeDashoffset: eQueuedRunning.len });
    tl.to(eQueuedRunning.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(eQueuedRunning.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to({}, { duration: 0.3 });
    tl.to(eRunningSuccess.line, { opacity: 1, duration: 0.05 }, ">");
    tl.to(eRunningSuccess.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([successBox, successLbl, successSub], { opacity: 1, duration: 0.35 }, "<0.1");
    tl.to(successRing, { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to(successRing, { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });

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

export const JobLifecycleDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 420" maxW="max-w-3xl" delay={delay} setup={setupJobLifecycle} />
);

/* ===========================================================================
   LEASE RECLAIM — worker A leases a run and crashes silently, the lease
   expires unrenewed, worker B claims the same run and finishes it.
=========================================================================== */
function setupLeaseReclaim(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `lr-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 28, "viz-phase", "middle");

  const runBox = mk(svg, "rect", { x: 340, y: 70, width: 220, height: 80, rx: 12, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const runLbl = mkText(svg, "Run 4821", 450, 100, "viz-label", "middle");
  const runSub = mkText(svg, "unclaimed", 450, 123, "viz-label-sm", "middle") as SVGTextElement;
  const runRing = mk(svg, "rect", { x: 332, y: 62, width: 236, height: 96, rx: 16, class: "viz-warn", fill: "none", opacity: 0 }) as SVGRectElement;
  const runRingOk = mk(svg, "rect", { x: 332, y: 62, width: 236, height: 96, rx: 16, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;

  const workerABox = mk(svg, "rect", { x: 135, y: 255, width: 190, height: 90, rx: 12, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const workerALbl = mkText(svg, "Worker A", 230, 288, "viz-label", "middle");
  const workerASub = mkText(svg, "", 230, 311, "viz-label-sm", "middle") as SVGTextElement;
  const workerARing = mk(svg, "rect", { x: 127, y: 247, width: 206, height: 106, rx: 16, class: "viz-warn", fill: "none", opacity: 0 }) as SVGRectElement;

  const workerBBox = mk(svg, "rect", { x: 575, y: 255, width: 190, height: 90, rx: 12, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const workerBLbl = mkText(svg, "Worker B", 670, 288, "viz-label", "middle");
  const workerBSub = mkText(svg, "", 670, 311, "viz-label-sm", "middle") as SVGTextElement;
  const workerBRing = mk(svg, "rect", { x: 567, y: 247, width: 206, height: 106, rx: 16, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;

  const eClaimA = makeLine(svg, 390, 150, 230, 255, `lr-${uid}`);
  const eClaimB = makeLine(svg, 530, 150, 650, 255, `lr-${uid}`);
  const eSuccessB = makeLine(svg, 690, 255, 570, 150, `lr-${uid}`);

  const allNodes = [runBox, runLbl, runSub, workerABox, workerALbl, workerASub, workerBBox, workerBLbl, workerBSub];
  const allRings = [runRing, runRingOk, workerARing, workerBRing];
  const allEdges = [eClaimA, eClaimB, eSuccessB];

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set(allNodes, { opacity: 0 });
    gsap.set(allRings, { opacity: 0 });
    allEdges.forEach((e) => {
      gsap.set(e.line, { opacity: 0 });
      e.line.style.strokeDashoffset = String(e.len);
    });
    runSub.textContent = "unclaimed";
    workerASub.textContent = "";
    workerBSub.textContent = "";

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Run 4821 is waiting to be leased"; });
    tl.to(runBox, { opacity: 1, duration: 0.35 }, "<");
    tl.to([runLbl, runSub], { opacity: 1, duration: 0.35 }, "<");
    tl.to(workerABox, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to([workerALbl], { opacity: 1, duration: 0.3 }, "<");
    tl.to(workerBBox, { opacity: 1, duration: 0.3 }, "<");
    tl.to([workerBLbl], { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Worker A leases it, expiring in 30 seconds unless renewed"; });
    tl.to(eClaimA.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(eClaimA.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.add(() => {
      runSub.textContent = "owner: A, expires 10:05:30";
      workerASub.textContent = "leased, heartbeating";
    }, "<0.1");
    tl.to(workerASub, { opacity: 1, duration: 0.01 }, "<");
    tl.to({}, { duration: 0.6 });

    tl.add(() => {
      phase.textContent = "Worker A crashes. Its heartbeats stop";
      workerASub.textContent = "no heartbeat";
    });
    tl.to(workerARing, { opacity: 1, duration: 0.3 }, "<");
    tl.to(workerABox, { opacity: 0.45, duration: 0.4 }, "<");
    tl.to({}, { duration: 0.6 });

    tl.add(() => {
      phase.textContent = "The lease expires without a renewal";
      runSub.textContent = "lease expired";
    });
    tl.to(runRing, { opacity: 1, duration: 0.3 }, "<");
    tl.to(runRing, { opacity: 0.3, duration: 0.5, yoyo: true, repeat: 1 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => {
      phase.textContent = "Worker B claims the same run and starts a new attempt";
      runSub.textContent = "owner: B, expires 10:12:00";
      workerBSub.textContent = "leased, heartbeating";
    });
    tl.to(eClaimB.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(eClaimB.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(workerBSub, { opacity: 1, duration: 0.01 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => {
      phase.textContent = "The run completes exactly once, even though a worker died holding it";
      runSub.textContent = "succeeded";
    });
    tl.to(eSuccessB.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(eSuccessB.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(workerBRing, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(runRingOk, { opacity: 1, duration: 0.3 }, "<");
    tl.to(runRingOk, { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });

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

export const LeaseReclaimDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 380" maxW="max-w-3xl" delay={delay} setup={setupLeaseReclaim} />
);

/* ===========================================================================
   DAG RELEASE — extract feeds two independent tasks, load only unlocks once
   both of them (not just one) report success.
=========================================================================== */
function setupDagRelease(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `dg-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 28, "viz-phase", "middle");

  const extractBox = mk(svg, "rect", { x: 360, y: 70, width: 180, height: 80, rx: 12, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const extractLbl = mkText(svg, "Extract", 450, 103, "viz-label", "middle");
  const extractSub = mkText(svg, "", 450, 126, "viz-label-sm", "middle") as SVGTextElement;

  const transformBox = mk(svg, "rect", { x: 160, y: 240, width: 180, height: 80, rx: 12, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const transformLbl = mkText(svg, "Transform", 250, 273, "viz-label", "middle");
  const transformSub = mkText(svg, "locked", 250, 296, "viz-warn-lbl", "middle") as SVGTextElement;

  const validateBox = mk(svg, "rect", { x: 560, y: 240, width: 180, height: 80, rx: 12, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const validateLbl = mkText(svg, "Validate", 650, 273, "viz-label", "middle");
  const validateSub = mkText(svg, "locked", 650, 296, "viz-warn-lbl", "middle") as SVGTextElement;

  const loadBox = mk(svg, "rect", { x: 360, y: 390, width: 180, height: 80, rx: 12, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const loadLbl = mkText(svg, "Load", 450, 423, "viz-label", "middle");
  const loadSub = mkText(svg, "locked", 450, 446, "viz-warn-lbl", "middle") as SVGTextElement;

  const ringT = mk(svg, "rect", { x: 152, y: 232, width: 196, height: 96, rx: 16, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const ringV = mk(svg, "rect", { x: 552, y: 232, width: 196, height: 96, rx: 16, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const ringL = mk(svg, "rect", { x: 352, y: 382, width: 196, height: 96, rx: 16, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;

  const eExtractTransform = makeLine(svg, 400, 150, 250, 240, `dg-${uid}`);
  const eExtractValidate = makeLine(svg, 500, 150, 650, 240, `dg-${uid}`);
  const eTransformLoad = makeLine(svg, 250, 320, 400, 390, `dg-${uid}`);
  const eValidateLoad = makeLine(svg, 650, 320, 500, 390, `dg-${uid}`);

  const allNodes = [extractBox, extractLbl, extractSub, transformBox, transformLbl, transformSub, validateBox, validateLbl, validateSub, loadBox, loadLbl, loadSub];
  const allRings = [ringT, ringV, ringL];
  const allEdges = [eExtractTransform, eExtractValidate, eTransformLoad, eValidateLoad];

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set(allNodes, { opacity: 0 });
    gsap.set(allRings, { opacity: 0 });
    allEdges.forEach((e) => {
      gsap.set(e.line, { opacity: 0 });
      e.line.style.strokeDashoffset = String(e.len);
    });
    extractSub.textContent = "running";
    transformSub.textContent = "locked";
    validateSub.textContent = "locked";
    loadSub.textContent = "locked";

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Extract runs first, everything downstream is still locked"; });
    tl.to(extractBox, { opacity: 1, duration: 0.35 }, "<");
    tl.to([extractLbl, extractSub], { opacity: 1, duration: 0.35 }, "<");
    tl.to([transformBox, validateBox, loadBox], { opacity: 0.55, duration: 0.35 }, "<0.1");
    tl.to([transformLbl, transformSub, validateLbl, validateSub, loadLbl, loadSub], { opacity: 1, duration: 0.35 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => {
      phase.textContent = "Extract succeeds, releasing transform and validate together";
      extractSub.textContent = "done";
    });
    tl.to(eExtractTransform.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(eExtractTransform.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(eExtractValidate.line, { opacity: 1, duration: 0.05 }, "<0.05");
    tl.to(eExtractValidate.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([transformBox, validateBox], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.add(() => {
      transformSub.textContent = "running";
      validateSub.textContent = "running";
    }, "<");
    tl.to([ringT, ringV], { opacity: 1, duration: 0.3 }, "<");
    tl.to([ringT, ringV], { opacity: 0, duration: 0.4 }, ">0.2");
    tl.to({}, { duration: 0.6 });

    tl.add(() => {
      phase.textContent = "Transform finishes, but validate is still running, so load stays locked";
      transformSub.textContent = "done";
    });
    tl.to({}, { duration: 0.6 });

    tl.add(() => {
      phase.textContent = "Validate finishes too, now both prerequisites are satisfied";
      validateSub.textContent = "done";
    });
    tl.to({}, { duration: 0.5 });

    tl.add(() => {
      phase.textContent = "Load unlocks only now, and finally runs";
      loadSub.textContent = "running";
    });
    tl.to(eTransformLoad.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(eTransformLoad.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(eValidateLoad.line, { opacity: 1, duration: 0.05 }, "<0.05");
    tl.to(eValidateLoad.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(loadBox, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(ringL, { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to(ringL, { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });

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

export const DagReleaseDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 500" maxW="max-w-3xl" delay={delay} setup={setupDagRelease} />
);
