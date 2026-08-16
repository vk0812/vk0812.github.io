import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animation for the "Message Queues" post. Same shell as
   animations/url-shortener/ConceptViz.tsx, theme comes entirely from CSS vars
   (.viz / .dark .viz in index.css), plays once when scrolled into view.
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
   QUEUE FLOW — a producer drops jobs onto a queue and moves on, two idle
   workers pull jobs off the front of it whenever they have capacity. Motion
   is the point here, three job tokens actually travel from the producer into
   the queue and from the queue out to whichever worker is free.
=========================================================================== */
function setupQueueFlow(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `qf-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });
  const markerBlue = mk(defs, "marker", {
    id: `qfb-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(markerBlue, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-blue" });

  const phase = mkText(svg, "", 450, 24, "viz-phase", "middle");

  mk(svg, "rect", { x: 360, y: 36, width: 180, height: 54, rx: 8, class: "viz-box" });
  mkText(svg, "Producer", 450, 68, "viz-node-lbl", "middle");

  const arrow1 = mk(svg, "line", {
    x1: 450, y1: 90, x2: 450, y2: 144, class: "viz-stroke", "marker-end": `url(#qf-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const len1 = 54;
  arrow1.style.strokeDasharray = String(len1);

  const queueBox = mk(svg, "rect", { x: 350, y: 146, width: 200, height: 70, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const queueLbl = mkText(svg, "Message queue", 450, 170, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(queueLbl, { opacity: 0 });

  // three job tokens, resting slots inside the queue box
  const slotX = [405, 450, 495];
  const slotY = 196;
  const tokens = slotX.map((x) =>
    mk(svg, "circle", { cx: x, cy: slotY, r: 7, class: "viz-cell", opacity: 0 }) as SVGCircleElement
  );

  const arrowA = mk(svg, "line", {
    x1: 410, y1: 216, x2: 280, y2: 278, class: "viz-blue", "marker-end": `url(#qfb-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenA = Math.hypot(410 - 280, 278 - 216);
  arrowA.style.strokeDasharray = String(lenA);

  const arrowB = mk(svg, "line", {
    x1: 490, y1: 216, x2: 620, y2: 278, class: "viz-blue", "marker-end": `url(#qfb-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenB = Math.hypot(620 - 490, 278 - 216);
  arrowB.style.strokeDasharray = String(lenB);

  const workerABox = mk(svg, "rect", { x: 180, y: 280, width: 200, height: 60, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const workerARing = mk(svg, "rect", { x: 174, y: 274, width: 212, height: 72, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const workerALbl1 = mkText(svg, "Worker 1", 280, 302, "viz-node-lbl", "middle") as SVGTextElement;
  const workerALbl2 = mkText(svg, "pulls when free", 280, 320, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([workerALbl1, workerALbl2], { opacity: 0 });

  const workerBBox = mk(svg, "rect", { x: 520, y: 280, width: 200, height: 60, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const workerBRing = mk(svg, "rect", { x: 514, y: 274, width: 212, height: 72, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const workerBLbl1 = mkText(svg, "Worker 2", 620, 302, "viz-node-lbl", "middle") as SVGTextElement;
  const workerBLbl2 = mkText(svg, "pulls when free", 620, 320, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([workerBLbl1, workerBLbl2], { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([arrow1, queueBox, queueLbl, arrowA, arrowB, workerABox, workerARing, workerALbl1, workerALbl2,
      workerBBox, workerBRing, workerBLbl1, workerBLbl2], { opacity: 0 });
    arrow1.style.strokeDashoffset = String(len1);
    arrowA.style.strokeDashoffset = String(lenA);
    arrowB.style.strokeDashoffset = String(lenB);
    tokens.forEach((t) => gsap.set(t, { opacity: 0, x: 0, y: 0 }));

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "A client upload arrives at the API server"; });
    tl.to({}, { duration: 0.35 });

    tl.add(() => { phase.textContent = "The server enqueues a job and responds right away"; });
    tl.to(arrow1, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow1, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([queueBox, queueLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(tokens[0], { opacity: 1, duration: 0.25 }, ">-0.05");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "More jobs arrive while workers are still busy elsewhere"; });
    tl.to(tokens[1], { opacity: 1, duration: 0.25 }, "<");
    tl.to(tokens[2], { opacity: 1, duration: 0.25 }, "<0.15");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Idle workers pull jobs off the front of the queue"; });
    tl.to(arrowA, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowA, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(arrowB, { opacity: 1, duration: 0.05 }, "<0.1");
    tl.to(arrowB, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([workerABox, workerBBox], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to([workerALbl1, workerALbl2, workerBLbl1, workerBLbl2], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(tokens[0], { x: 280 - slotX[0], y: 290 - slotY, opacity: 0, duration: 0.5, ease: "power1.in" }, ">0.1");
    tl.to(tokens[1], { x: 620 - slotX[1], y: 290 - slotY, opacity: 0, duration: 0.5, ease: "power1.in" }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Producer and consumer never talk directly, only through the queue"; });
    tl.to([workerARing, workerBRing], { opacity: 1, duration: 0.3 }, "<");
    tl.to([workerARing, workerBRing], { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });

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

export const QueueFlowDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 380" maxW="max-w-2xl" delay={delay} setup={setupQueueFlow} />
);
