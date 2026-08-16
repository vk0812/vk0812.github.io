import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animation for "Redundancy and Replication". Same shell as
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
   SYNC VS ASYNC TIMING — two lanes on the same clock. The synchronous lane
   only reaches a client ack after the replica confirms, three hops deep.
   The asynchronous lane acks the client immediately, then keeps replicating
   in the background, the warn-colored segment marks the window where a
   primary failure would lose that unreplicated write.
=========================================================================== */
const SYNC_Y = 130;
const ASYNC_Y = 330;

function setupSyncAsyncTiming(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const inkMarker = mk(defs, "marker", {
    id: `sa-ink-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(inkMarker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });
  const blueMarker = mk(defs, "marker", {
    id: `sa-blue-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(blueMarker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-blue" });
  const warnMarker = mk(defs, "marker", {
    id: `sa-warn-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(warnMarker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-warn" });

  const phase = mkText(svg, "", 450, 26, "viz-phase", "middle");

  mkText(svg, "Synchronous replication", 450, 90, "viz-node-lbl", "middle");
  mkText(svg, "Asynchronous replication", 450, 290, "viz-node-lbl", "middle");

  // sync lane, three sequential segments
  const syncA = mk(svg, "line", { x1: 150, y1: SYNC_Y, x2: 350, y2: SYNC_Y, class: "viz-stroke", "marker-end": `url(#sa-ink-${uid})`, opacity: 0 }) as SVGLineElement;
  const syncALen = 200; syncA.style.strokeDasharray = String(syncALen);
  const syncB = mk(svg, "line", { x1: 350, y1: SYNC_Y, x2: 580, y2: SYNC_Y, class: "viz-stroke", "marker-end": `url(#sa-ink-${uid})`, opacity: 0 }) as SVGLineElement;
  const syncBLen = 230; syncB.style.strokeDasharray = String(syncBLen);
  const syncC = mk(svg, "line", { x1: 580, y1: SYNC_Y, x2: 790, y2: SYNC_Y, class: "viz-blue", "marker-end": `url(#sa-blue-${uid})`, opacity: 0 }) as SVGLineElement;
  const syncCLen = 210; syncC.style.strokeDasharray = String(syncCLen);

  const syncWriteDot = mk(svg, "circle", { cx: 150, cy: SYNC_Y, r: 5, class: "viz-box", opacity: 0 }) as SVGCircleElement;
  const syncWriteLbl = mkText(svg, "Write", 150, 162, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set(syncWriteLbl, { opacity: 0 });

  const syncForwardDot = mk(svg, "circle", { cx: 350, cy: SYNC_Y, r: 5, class: "viz-box", opacity: 0 }) as SVGCircleElement;
  const syncForwardLbl = mkText(svg, "Forwarded to replica", 350, 162, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set(syncForwardLbl, { opacity: 0 });

  const syncReplicaAckDot = mk(svg, "circle", { cx: 580, cy: SYNC_Y, r: 5, class: "viz-box", opacity: 0 }) as SVGCircleElement;
  const syncReplicaAckLbl = mkText(svg, "Replica acknowledges", 580, 162, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set(syncReplicaAckLbl, { opacity: 0 });

  const syncClientRing = mk(svg, "circle", { cx: 790, cy: SYNC_Y, r: 9, class: "viz-blue", fill: "none", opacity: 0 }) as SVGCircleElement;
  const syncClientDot = mk(svg, "circle", { cx: 790, cy: SYNC_Y, r: 5, class: "viz-bar-pos", opacity: 0 }) as SVGCircleElement;
  const syncClientLbl = mkText(svg, "Client acked", 790, 162, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(syncClientLbl, { opacity: 0 });

  // async lane, two sequential segments (second one is the risk window)
  const asyncA = mk(svg, "line", { x1: 150, y1: ASYNC_Y, x2: 280, y2: ASYNC_Y, class: "viz-blue", "marker-end": `url(#sa-blue-${uid})`, opacity: 0 }) as SVGLineElement;
  const asyncALen = 130; asyncA.style.strokeDasharray = String(asyncALen);
  const asyncB = mk(svg, "line", { x1: 280, y1: ASYNC_Y, x2: 650, y2: ASYNC_Y, class: "viz-warn", "marker-end": `url(#sa-warn-${uid})`, opacity: 0 }) as SVGLineElement;
  const asyncBLen = 370; asyncB.style.strokeDasharray = String(asyncBLen);

  const asyncWriteDot = mk(svg, "circle", { cx: 150, cy: ASYNC_Y, r: 5, class: "viz-box", opacity: 0 }) as SVGCircleElement;
  const asyncWriteLbl = mkText(svg, "Write", 150, 362, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set(asyncWriteLbl, { opacity: 0 });

  const asyncClientRing = mk(svg, "circle", { cx: 280, cy: ASYNC_Y, r: 9, class: "viz-blue", fill: "none", opacity: 0 }) as SVGCircleElement;
  const asyncClientDot = mk(svg, "circle", { cx: 280, cy: ASYNC_Y, r: 5, class: "viz-bar-pos", opacity: 0 }) as SVGCircleElement;
  const asyncClientLbl = mkText(svg, "Client acked, fast", 280, 362, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(asyncClientLbl, { opacity: 0 });

  const asyncReplicatedDot = mk(svg, "circle", { cx: 650, cy: ASYNC_Y, r: 5, class: "viz-bar-pos", opacity: 0 }) as SVGCircleElement;
  const asyncReplicatedLbl = mkText(svg, "Replicated to replica", 650, 362, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set(asyncReplicatedLbl, { opacity: 0 });

  const riskLbl = mkText(svg, "Unreplicated data is lost here", 465, 400, "viz-warn-lbl", "middle") as SVGTextElement;
  gsap.set(riskLbl, { opacity: 0 });

  const allDots = [syncWriteDot, syncForwardDot, syncReplicaAckDot, syncClientDot, asyncWriteDot, asyncClientDot, asyncReplicatedDot];
  const allLbls = [syncWriteLbl, syncForwardLbl, syncReplicaAckLbl, syncClientLbl, asyncWriteLbl, asyncClientLbl, asyncReplicatedLbl];
  const allSegs = [syncA, syncB, syncC, asyncA, asyncB];
  const allSegLens = [syncALen, syncBLen, syncCLen, asyncALen, asyncBLen];
  const allRings = [syncClientRing, asyncClientRing];

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([...allDots, ...allLbls, ...allSegs, ...allRings, riskLbl], { opacity: 0 });
    allSegs.forEach((seg, i) => { seg.style.strokeDashoffset = String(allSegLens[i]); });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "A write arrives at the primary in both cases"; });
    tl.to([syncWriteDot, asyncWriteDot], { opacity: 1, duration: 0.3 }, "<");
    tl.to([syncWriteLbl, asyncWriteLbl], { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Synchronous replication forwards the write toward the replica"; });
    tl.to(syncA, { opacity: 1, duration: 0.05 }, "<");
    tl.to(syncA, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
    tl.to([syncForwardDot, syncForwardLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "The replica confirms receipt before anything is acknowledged"; });
    tl.to(syncB, { opacity: 1, duration: 0.05 }, "<");
    tl.to(syncB, { strokeDashoffset: 0, duration: 0.4, ease: "none" }, "<");
    tl.to([syncReplicaAckDot, syncReplicaAckLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Only now does the client get its ack, three hops later"; });
    tl.to(syncC, { opacity: 1, duration: 0.05 }, "<");
    tl.to(syncC, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
    tl.to([syncClientDot, syncClientLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(syncClientRing, { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Asynchronous replication acks the client immediately"; });
    tl.to(asyncA, { opacity: 1, duration: 0.05 }, "<");
    tl.to(asyncA, { strokeDashoffset: 0, duration: 0.2, ease: "none" }, "<");
    tl.to([asyncClientDot, asyncClientLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(asyncClientRing, { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "The replica catches up afterward, in the background"; });
    tl.to(asyncB, { opacity: 1, duration: 0.05 }, "<");
    tl.to(asyncB, { strokeDashoffset: 0, duration: 0.5, ease: "none" }, "<");
    tl.to([asyncReplicatedDot, asyncReplicatedLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(riskLbl, { opacity: 1, duration: 0.3 }, "<0.2");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Synchronous trades speed for safety, asynchronous trades safety for speed"; });
    tl.to(allRings, { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 3 });

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

export const SyncAsyncTimingDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 440" maxW="max-w-2xl" delay={delay} setup={setupSyncAsyncTiming} />
);
