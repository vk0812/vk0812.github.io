import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animations for the Change Data Capture / Outbox post.
   Theme comes entirely from CSS vars (.viz / .dark .viz in index.css), so the
   same SVG reads black+blue in light mode and white+blue in dark mode.
   Each animation plays once when scrolled into view; a replay button restarts.
---------------------------------------------------------------------------- */

const NS = "http://www.w3.org/2000/svg";
type Api = {
  play: () => void;       // (re)build timeline from scratch and play
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
  delay?: number; // accepted for API parity; not used for in-view entrance
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
   DUAL WRITE vs OUTBOX — a write to the database and a publish to Kafka are
   two separate systems. Left lane shows the crash that leaves them
   disagreeing. Right lane shows the fix, one local transaction that either
   commits both rows or neither.
=========================================================================== */
function setupDualWriteOutbox(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `dw-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });
  const markerWarn = mk(defs, "marker", {
    id: `dwwarn-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(markerWarn, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-warn" });

  const phase = mkText(svg, "", 450, 26, "viz-phase", "middle");

  const LX = 190, RX = 680;

  // ---- Left lane: dual write ----
  const titleL = mkText(svg, "Dual write", LX, 50, "viz-label-sm", "middle");
  const orderL = mkText(svg, "Order Service", LX, 82, "viz-label", "middle");

  const arrow1L = mk(svg, "line", { x1: LX, y1: 94, x2: LX, y2: 140, class: "viz-stroke", "marker-end": `url(#dw-${uid})`, opacity: 0 }) as SVGLineElement;
  const len1L = 46;
  arrow1L.style.strokeDasharray = String(len1L);

  const arrow2a = mk(svg, "line", { x1: LX, y1: 140, x2: 100, y2: 192, class: "viz-stroke", "marker-end": `url(#dw-${uid})`, opacity: 0 }) as SVGLineElement;
  const len2a = Math.hypot(LX - 100, 192 - 140);
  arrow2a.style.strokeDasharray = String(len2a);

  const arrow2b = mk(svg, "line", { x1: LX, y1: 140, x2: 280, y2: 192, class: "viz-stroke", "marker-end": `url(#dwwarn-${uid})`, opacity: 0 }) as SVGLineElement;
  const len2b = Math.hypot(280 - LX, 192 - 140);
  arrow2b.style.strokeDasharray = String(len2b);

  const dbBox = mk(svg, "rect", { x: 35, y: 194, width: 130, height: 60, rx: 8, class: "viz-thin", opacity: 0 }) as SVGRectElement;
  const dbLbl1 = mkText(svg, "orders DB", 100, 220, "viz-node-lbl", "middle");
  const dbLbl2 = mkText(svg, "row committed", 100, 240, "viz-label-sm", "middle");
  gsap.set([dbLbl1, dbLbl2], { opacity: 0 });
  const dbRing = mk(svg, "rect", { x: 29, y: 188, width: 142, height: 72, rx: 12, class: "viz-blue", opacity: 0 }) as SVGRectElement;

  const kafkaBox = mk(svg, "rect", { x: 215, y: 194, width: 130, height: 60, rx: 8, class: "viz-thin", opacity: 0 }) as SVGRectElement;
  const kafkaLbl1 = mkText(svg, "Kafka", 280, 220, "viz-node-lbl", "middle");
  const kafkaLbl2 = mkText(svg, "publish pending", 280, 240, "viz-label-sm", "middle");
  gsap.set([kafkaLbl1, kafkaLbl2], { opacity: 0 });

  const crashMark = mkText(svg, "✕ CRASH", 250, 158, "viz-warn-lbl", "middle");
  gsap.set(crashMark, { opacity: 0 });

  const ghost1 = mkText(svg, "Ghost order", LX, 300, "viz-warn-lbl", "middle");
  const ghost2 = mkText(svg, "DB has it, Kafka never did", LX, 320, "viz-label-sm", "middle");
  gsap.set([ghost1, ghost2], { opacity: 0 });
  gsap.set([titleL, orderL], { opacity: 0 });

  // ---- Right lane: outbox ----
  const titleR = mkText(svg, "Outbox pattern", RX, 50, "viz-label-sm", "middle");
  const orderR = mkText(svg, "Order Service", RX, 82, "viz-label", "middle");

  const arrow1R = mk(svg, "line", { x1: RX, y1: 94, x2: RX, y2: 140, class: "viz-stroke", "marker-end": `url(#dw-${uid})`, opacity: 0 }) as SVGLineElement;
  const len1R = 46;
  arrow1R.style.strokeDasharray = String(len1R);

  const txnBox = mk(svg, "rect", { x: 580, y: 142, width: 200, height: 90, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const txnHdr = mkText(svg, "ONE transaction", RX, 164, "viz-node-lbl", "middle");
  const txnRow1 = mkText(svg, "orders row", RX, 188, "viz-label-sm", "middle");
  const txnRow2 = mkText(svg, "outbox row", RX, 208, "viz-label-sm", "middle");
  gsap.set([txnHdr, txnRow1, txnRow2], { opacity: 0 });

  const arrow2R = mk(svg, "line", { x1: RX, y1: 234, x2: RX, y2: 278, class: "viz-stroke", "marker-end": `url(#dw-${uid})`, opacity: 0 }) as SVGLineElement;
  const len2R = 46;
  arrow2R.style.strokeDasharray = String(len2R);

  const relayBox = mk(svg, "rect", { x: 610, y: 280, width: 140, height: 54, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const relayLbl = mkText(svg, "Relay", RX, 310, "viz-node-lbl", "middle");
  gsap.set(relayLbl, { opacity: 0 });

  const arrow3R = mk(svg, "line", { x1: RX, y1: 336, x2: RX, y2: 380, class: "viz-stroke", "marker-end": `url(#dw-${uid})`, opacity: 0 }) as SVGLineElement;
  const len3R = 46;
  arrow3R.style.strokeDasharray = String(len3R);

  const kafkaBox2 = mk(svg, "rect", { x: 610, y: 382, width: 140, height: 54, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const kafkaLbl3 = mkText(svg, "Kafka", RX, 412, "viz-node-lbl", "middle");
  gsap.set(kafkaLbl3, { opacity: 0 });
  const kafkaRing2 = mk(svg, "rect", { x: 604, y: 376, width: 152, height: 66, rx: 12, class: "viz-blue", opacity: 0 }) as SVGRectElement;

  const final1 = mkText(svg, "Both committed", RX, 480, "viz-node-lbl", "middle");
  const final2 = mkText(svg, "or neither did", RX, 500, "viz-label-sm", "middle");
  gsap.set([final1, final2], { opacity: 0 });
  gsap.set([titleR, orderR], { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([titleL, orderL, titleR, orderR], { opacity: 0 });
    gsap.set([arrow1L, arrow2a, arrow2b], { opacity: 0 });
    arrow1L.style.strokeDashoffset = String(len1L);
    arrow2a.style.strokeDashoffset = String(len2a);
    arrow2b.style.strokeDashoffset = String(len2b);
    gsap.set(dbBox, { opacity: 0 });
    dbBox.setAttribute("class", "viz-thin");
    gsap.set([dbLbl1, dbLbl2, dbRing], { opacity: 0 });
    gsap.set(kafkaBox, { opacity: 0 });
    kafkaBox.setAttribute("class", "viz-thin");
    gsap.set([kafkaLbl1, kafkaLbl2, crashMark, ghost1, ghost2], { opacity: 0 });
    kafkaLbl2.textContent = "publish pending";

    gsap.set([arrow1R, arrow2R, arrow3R], { opacity: 0 });
    arrow1R.style.strokeDashoffset = String(len1R);
    arrow2R.style.strokeDashoffset = String(len2R);
    arrow3R.style.strokeDashoffset = String(len3R);
    gsap.set([txnBox, txnHdr, txnRow1, txnRow2], { opacity: 0 });
    gsap.set([relayBox, relayLbl, kafkaBox2, kafkaLbl3, kafkaRing2, final1, final2], { opacity: 0 });

    tl = gsap.timeline();

    // Left lane: the dual write fails
    tl.add(() => { phase.textContent = "An order is placed"; });
    tl.to(titleL, { opacity: 1, duration: 0.3 }, "<");
    tl.to(orderL, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "The service writes to its own database, then tries to publish to Kafka"; });
    tl.to(arrow1L, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow1L, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to({}, { duration: 0.2 });
    tl.to([arrow2a, arrow2b], { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow2a, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(arrow2b, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([dbBox, kafkaBox], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.3 });

    tl.add(() => { phase.textContent = "The database commit succeeds"; });
    tl.add(() => { dbBox.setAttribute("class", "viz-box"); });
    tl.to([dbLbl1, dbLbl2], { opacity: 1, duration: 0.3 }, "<");
    tl.to(dbRing, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Then the process crashes before the Kafka publish goes out"; });
    tl.to(crashMark, { opacity: 1, duration: 0.3 }, "<");
    tl.add(() => { kafkaBox.setAttribute("class", "viz-panel-warn"); kafkaLbl2.textContent = "never published"; });
    tl.to([kafkaLbl1, kafkaLbl2], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "The two systems disagree forever"; });
    tl.to([ghost1, ghost2], { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.6 });

    // Right lane: the outbox fix
    tl.add(() => { phase.textContent = "Same order, written the outbox way"; });
    tl.to(titleR, { opacity: 1, duration: 0.3 }, "<");
    tl.to(orderR, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.3 });

    tl.add(() => { phase.textContent = "The business row and an outbox row commit in one local transaction"; });
    tl.to(arrow1R, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow1R, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(txnBox, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(txnHdr, { opacity: 1, duration: 0.25 }, "<0.1");
    tl.to([txnRow1, txnRow2], { opacity: 1, duration: 0.3 }, "<0.15");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "A relay reads the outbox row and forwards it to Kafka"; });
    tl.to(arrow2R, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow2R, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([relayBox, relayLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.3 });
    tl.to(arrow3R, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow3R, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([kafkaBox2, kafkaLbl3], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(kafkaRing2, { opacity: 1, duration: 0.3 }, "<0.15");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Both committed together, or neither did, there is no disagreement possible"; });
    tl.to([final1, final2], { opacity: 1, duration: 0.3 }, "<");

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

export const DualWriteOutboxDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 520" maxW="max-w-2xl" delay={delay} setup={setupDualWriteOutbox} />
);

/* ===========================================================================
   WRITE-AHEAD LOG — a change is appended to the log before the data page is
   touched. A crash strikes before the page flush finishes. On restart, the
   log is replayed and the page becomes consistent again.
=========================================================================== */
function setupWal(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `wal-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });
  const markerBlue = mk(defs, "marker", {
    id: `walblue-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(markerBlue, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-blue" });

  const CX = 450;
  const phase = mkText(svg, "", CX, 26, "viz-phase", "middle");
  const changeTxt = mkText(svg, "UPDATE row 42: qty 5 -> 3", CX, 58, "viz-label", "middle");
  gsap.set(changeTxt, { opacity: 0 });

  const arrow1 = mk(svg, "line", { x1: CX, y1: 70, x2: CX, y2: 116, class: "viz-stroke", "marker-end": `url(#wal-${uid})`, opacity: 0 }) as SVGLineElement;
  const len1 = 46;
  arrow1.style.strokeDasharray = String(len1);

  const logLabel = mkText(svg, "Write-ahead log (on disk)", CX, 150, "viz-label-sm", "middle");
  gsap.set(logLabel, { opacity: 0 });

  const cellY = 170, cellH = 50;
  const cellW = 70;
  const cellXs = [255, 335, 415, 495, 575];
  const cells = cellXs.map((x, i) => {
    const r = mk(svg, "rect", { x, y: cellY, width: cellW, height: cellH, rx: 8, class: i < 4 ? "viz-panel" : "viz-thin" }) as SVGRectElement;
    return r;
  });
  gsap.set(cells[4], { opacity: 1 });
  const newCellLbl = mkText(svg, "row 42", cellXs[4] + cellW / 2, cellY + cellH / 2 + 4, "viz-label-sm", "middle");
  gsap.set(newCellLbl, { opacity: 0 });

  const arrow2 = mk(svg, "line", { x1: CX, y1: 220, x2: CX, y2: 266, class: "viz-stroke", "marker-end": `url(#wal-${uid})`, opacity: 0 }) as SVGLineElement;
  const len2 = 46;
  arrow2.style.strokeDasharray = String(len2);

  const replayLbl = mkText(svg, "replay", 500, 243, "viz-node-lbl", "start");
  gsap.set(replayLbl, { opacity: 0 });

  const pageBox = mk(svg, "rect", { x: 340, y: 268, width: 220, height: 80, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const pageRing = mk(svg, "rect", { x: 334, y: 262, width: 232, height: 92, rx: 12, class: "viz-blue", opacity: 0 }) as SVGRectElement;
  const pageLbl1 = mkText(svg, "Data page: row 42", CX, 296, "viz-node-lbl", "middle");
  const pageVal = mkText(svg, "qty: 5", CX, 320, "viz-label", "middle");
  gsap.set([pageLbl1, pageVal], { opacity: 0 });

  const crashLbl = mkText(svg, "✕ CRASH before the page flushes", CX, 388, "viz-warn-lbl", "middle");
  gsap.set(crashLbl, { opacity: 0 });

  const final1 = mkText(svg, "Consistent again", CX, 420, "viz-node-lbl", "middle");
  gsap.set(final1, { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set(changeTxt, { opacity: 0 });
    gsap.set([arrow1, arrow2], { opacity: 0 });
    arrow1.style.strokeDashoffset = String(len1);
    arrow2.style.strokeDashoffset = String(len2);
    arrow2.setAttribute("class", "viz-stroke");
    arrow2.setAttribute("marker-end", `url(#wal-${uid})`);
    gsap.set(logLabel, { opacity: 0 });
    cells[4].setAttribute("class", "viz-thin");
    gsap.set(newCellLbl, { opacity: 0 });
    gsap.set(replayLbl, { opacity: 0 });
    gsap.set([pageBox, pageRing, pageLbl1, pageVal], { opacity: 0 });
    pageVal.textContent = "qty: 5";
    gsap.set([crashLbl, final1], { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "A transaction wants to update a row"; });
    tl.to(changeTxt, { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "The change is appended to the log first, write-ahead"; });
    tl.to(arrow1, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow1, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(logLabel, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.3 });
    tl.add(() => { cells[4].setAttribute("class", "viz-box"); });
    tl.to(newCellLbl, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Commit forces an fsync, the log record is durable"; });
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Only then does the data page itself get updated"; });
    tl.to(arrow2, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow2, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([pageBox, pageLbl1, pageVal], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "A crash strikes before that page flush completes"; });
    tl.to(crashLbl, { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "On restart, the database replays the log from that point"; });
    arrow2.style.strokeDashoffset = String(len2);
    tl.set(arrow2, { opacity: 0 });
    tl.add(() => { arrow2.setAttribute("class", "viz-blue"); arrow2.setAttribute("marker-end", `url(#walblue-${uid})`); });
    tl.to(arrow2, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow2, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
    tl.to(replayLbl, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.3 });

    tl.add(() => { phase.textContent = "The page is brought back in line with what the log says happened"; });
    tl.add(() => { pageVal.textContent = "qty: 3"; });
    tl.to(pageRing, { opacity: 1, duration: 0.3 }, "<");
    tl.to(final1, { opacity: 1, duration: 0.3 }, "<0.15");

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

export const WriteAheadLogDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 440" maxW="max-w-2xl" delay={delay} setup={setupWal} />
);

/* ===========================================================================
   CDC TAILING THE LOG — a connector tails the transaction log, its read
   offset advances past each committed record, and a committed outbox row
   turns into a message dropped into a Kafka topic partition for consumers.
=========================================================================== */
function setupCdcTailing(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `cdc-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 24, "viz-phase", "middle");

  // Log cells
  const logLabel = mkText(svg, "Transaction log", 190, 95, "viz-label-sm", "middle");
  const cellY = 115, cellH = 60, cellW = 52;
  const cellXs = [40, 102, 164, 226, 288];
  const cells = cellXs.map((x, i) => mk(svg, "rect", { x, y: cellY, width: cellW, height: cellH, rx: 6, class: i < 4 ? "viz-panel" : "viz-thin" }) as SVGRectElement);

  // Offset pointer (a small tick that slides from the first cell to the new one)
  const pointerG = mk(svg, "g", {}) as SVGGElement;
  const pointerTri = mk(pointerG, "path", { d: `M${cellXs[0] + cellW / 2 - 6},198 L${cellXs[0] + cellW / 2 + 6},198 L${cellXs[0] + cellW / 2},210 Z`, class: "viz-arrow-blue" });
  const offsetLabel = mkText(svg, "connector offset", 190, 228, "viz-label-sm", "middle");

  // Connector box
  const connBox = mk(svg, "rect", { x: 380, y: 115, width: 160, height: 60, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const connLbl1 = mkText(svg, "CDC Connector", 460, 140, "viz-node-lbl", "middle");
  const connLbl2 = mkText(svg, "e.g. Debezium", 460, 160, "viz-label-sm", "middle");
  gsap.set([connLbl1, connLbl2], { opacity: 0 });

  const arrow1 = mk(svg, "line", { x1: 342, y1: 145, x2: 378, y2: 145, class: "viz-stroke", "marker-end": `url(#cdc-${uid})`, opacity: 0 }) as SVGLineElement;
  const len1 = 36;
  arrow1.style.strokeDasharray = String(len1);

  const arrow2 = mk(svg, "line", { x1: 542, y1: 145, x2: 598, y2: 145, class: "viz-stroke", "marker-end": `url(#cdc-${uid})`, opacity: 0 }) as SVGLineElement;
  const len2 = 56;
  arrow2.style.strokeDasharray = String(len2);

  // Kafka partition
  const partLabel = mkText(svg, "Kafka topic partition 0", 650, 45, "viz-label-sm", "middle");
  const partBox = mk(svg, "rect", { x: 600, y: 75, width: 100, height: 300, rx: 8, class: "viz-panel", opacity: 0 }) as SVGRectElement;
  const msgYs = [90, 138, 186, 234];
  const msgs = msgYs.map((y) => mk(svg, "rect", { x: 610, y, width: 80, height: 40, rx: 6, class: "viz-panel", opacity: 0 }) as SVGRectElement);

  const newMsgG = mk(svg, "g", {}) as SVGGElement;
  const newMsg = mk(newMsgG, "rect", { x: 610, y: 282, width: 80, height: 40, rx: 6, class: "viz-box" }) as SVGRectElement;
  const newMsgLbl = mkText(newMsgG, "order.placed", 650, 306, "viz-label-sm", "middle");
  gsap.set(newMsgG, { opacity: 0 });

  // Consumers
  const consBox = mk(svg, "rect", { x: 740, y: 170, width: 140, height: 90, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const consLbl1 = mkText(svg, "Consumers", 810, 196, "viz-node-lbl", "middle");
  const consLbl2 = mkText(svg, "billing", 810, 216, "viz-label-sm", "middle");
  const consLbl3 = mkText(svg, "inventory, analytics", 810, 234, "viz-label-sm", "middle");
  gsap.set([consLbl1, consLbl2, consLbl3], { opacity: 0 });

  const arrow3 = mk(svg, "line", { x1: 702, y1: 215, x2: 738, y2: 215, class: "viz-stroke", "marker-end": `url(#cdc-${uid})`, opacity: 0 }) as SVGLineElement;
  const len3 = 36;
  arrow3.style.strokeDasharray = String(len3);

  const final1 = mkText(svg, "Exact commit order preserved", 450, 460, "viz-node-lbl", "middle");
  const final2 = mkText(svg, "near-zero load on the database", 450, 480, "viz-label-sm", "middle");
  gsap.set([final1, final2], { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    cells[4].setAttribute("class", "viz-thin");
    gsap.set(pointerG, { x: 0 });
    gsap.set([connBox, connLbl1, connLbl2], { opacity: 0 });
    gsap.set([arrow1, arrow2, arrow3], { opacity: 0 });
    arrow1.style.strokeDashoffset = String(len1);
    arrow2.style.strokeDashoffset = String(len2);
    arrow3.style.strokeDashoffset = String(len3);
    gsap.set(partBox, { opacity: 0 });
    gsap.set(msgs, { opacity: 0 });
    gsap.set(newMsgG, { opacity: 0, x: 0, y: -140 });
    gsap.set([consBox, consLbl1, consLbl2, consLbl3, final1, final2], { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Committed transactions keep appending to the log"; });
    tl.to({}, { duration: 0.3 });
    tl.to(partBox, { opacity: 1, duration: 0.3 }, "<");
    tl.to(msgs, { opacity: 1, duration: 0.3, stagger: 0.08 }, "<0.1");
    tl.to({}, { duration: 0.3 });

    tl.add(() => { phase.textContent = "A connector attaches to the log and reads it from an offset"; });
    tl.to(connBox, { opacity: 1, duration: 0.3 }, "<");
    tl.to([connLbl1, connLbl2], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(arrow1, { opacity: 1, duration: 0.05 }, "<0.1");
    tl.to(arrow1, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "An outbox row commits, the offset advances to catch it"; });
    tl.add(() => { cells[4].setAttribute("class", "viz-box"); });
    tl.to(pointerG, { x: cellXs[4] - cellXs[0], duration: 0.6, ease: "power1.inOut" }, "<");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "It is turned into a message and handed to Kafka"; });
    tl.to(arrow2, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow2, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(newMsgG, { opacity: 1, duration: 0.05 }, "<0.1");
    tl.to(newMsgG, { y: 0, duration: 0.4, ease: "power2.in" }, "<");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Downstream consumers read the partition, in the order it was written"; });
    tl.to(arrow3, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow3, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(consBox, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to([consLbl1, consLbl2, consLbl3], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Milliseconds of lag, no extra queries against the database"; });
    tl.to([final1, final2], { opacity: 1, duration: 0.3 }, "<");

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

export const CdcTailingLogDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 500" maxW="max-w-2xl" delay={delay} setup={setupCdcTailing} />
);
