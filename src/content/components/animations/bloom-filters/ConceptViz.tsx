import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animation for "Bloom Filters". Same shell as
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
   BIT ARRAY, a 10-bit Bloom filter with 3 hash functions. Inserting "milk"
   lights up the three bits its hashes point to. Querying "milk" again checks
   those same bits and finds them all set. Querying "proxy" checks a bit that
   was never set and rules it out immediately.

   Positions are computed with a real, deterministic hash (FNV-1a salted per
   hash-function index, mod 10), not hand-picked, verified offline with
   node -e before wiring the numbers in below:
     insert("milk")  -> bits 5, 6, 7   (all three get set to 1)
     query("milk")   -> bits 5, 6, 7   (all read 1, so "probably in set")
     query("proxy")  -> bits 8, 7, 6   (bit 8 reads 0, so "definitely not")
   "milk" and "proxy" happen to share two of their three bits (6 and 7), a
   real near-miss that shows why false positives are possible, bit 8 is the
   one bit that breaks the tie and rules "proxy" out for good.
=========================================================================== */
function setupBitArray(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const phase = mkText(svg, "", 450, 24, "viz-phase", "middle");

  const M = 10;
  const cellW = 54;
  const gap = 10;
  const startX = 135;
  const cellY = 64;
  const cellH = 54;

  type Cell = {
    text0: SVGTextElement;
    text1: SVGTextElement;
    ring: SVGRectElement;
  };
  const cells: Cell[] = [];

  for (let i = 0; i < M; i++) {
    const x = startX + i * (cellW + gap);
    const cx = x + cellW / 2;

    mk(svg, "rect", { x, y: cellY, width: cellW, height: cellH, rx: 8, class: "viz-box" });

    const text0 = mkText(svg, "0", cx, cellY + 34, "viz-node-lbl", "middle") as SVGTextElement;
    const text1 = mkText(svg, "1", cx, cellY + 34, "viz-node-lbl", "middle") as SVGTextElement;
    gsap.set(text1, { opacity: 0 });

    // bit 8 is the one bit that only ever gets checked and found unset, ring
    // it in warn from the start, every other ring is the "set" blue.
    const ringClass = i === 8 ? "viz-warn" : "viz-blue";
    const ring = mk(svg, "rect", {
      x: x - 4, y: cellY - 4, width: cellW + 8, height: cellH + 8, rx: 12, class: ringClass, opacity: 0,
    }) as SVGRectElement;

    mkText(svg, String(i), cx, cellY + cellH + 27, "viz-label-sm", "middle");

    cells.push({ text0, text1, ring });
  }

  // verdict badge, reused for both the positive and the negative query
  const badge = mk(svg, "rect", { x: 300, y: 195, width: 300, height: 70, rx: 12, class: "viz-panel", opacity: 0 }) as SVGRectElement;
  const badgeRingBlue = mk(svg, "rect", { x: 294, y: 189, width: 312, height: 82, rx: 16, class: "viz-blue", opacity: 0 }) as SVGRectElement;
  const badgeRingWarn = mk(svg, "rect", { x: 294, y: 189, width: 312, height: 82, rx: 16, class: "viz-warn", opacity: 0 }) as SVGRectElement;
  const badgeWord = mkText(svg, "", 450, 222, "viz-label-sm", "middle") as SVGTextElement;
  const badgeVerdict = mkText(svg, "", 450, 248, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set([badgeWord, badgeVerdict], { opacity: 0 });

  const insertCells = [5, 6, 7].map((i) => cells[i]);
  const missCell = cells[8];

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    cells.forEach((c) => {
      gsap.set(c.text0, { opacity: 1 });
      gsap.set(c.text1, { opacity: 0 });
      gsap.set(c.ring, { opacity: 0 });
    });
    gsap.set([badge, badgeRingBlue, badgeRingWarn, badgeWord, badgeVerdict], { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "A bit array of 10 bits starts with every bit at 0"; });
    tl.to({}, { duration: 1.0 });

    tl.add(() => { phase.textContent = "Inserting \"milk\" sets bits 5, 6, and 7 to 1"; });
    tl.to(insertCells.map((c) => c.text0), { opacity: 0, duration: 0.25, stagger: 0.08 }, "<0.2");
    tl.to(insertCells.map((c) => c.text1), { opacity: 1, duration: 0.25, stagger: 0.08 }, "<");
    tl.to(insertCells.map((c) => c.ring), { opacity: 1, duration: 0.3, stagger: 0.08 }, "<");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Querying \"milk\" checks the same three bits again"; });
    tl.to(insertCells.map((c) => c.ring), { opacity: 0.35, duration: 0.25, yoyo: true, repeat: 1, stagger: 0.1 }, "<0.2");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "All three bits are still 1, so \"milk\" is probably in the set"; });
    tl.to(badge, { opacity: 1, duration: 0.3 }, "<");
    tl.add(() => {
      badgeWord.textContent = "\"milk\"";
      badgeVerdict.textContent = "MAYBE PRESENT";
    });
    tl.to([badgeWord, badgeVerdict], { opacity: 1, duration: 0.3 }, "<");
    tl.to(badgeRingBlue, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.9 });

    tl.add(() => { phase.textContent = "Now querying a different key, \"proxy\""; });
    tl.to([badge, badgeRingBlue, badgeWord, badgeVerdict], { opacity: 0, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.3 });

    tl.add(() => { phase.textContent = "The first hash function for \"proxy\" points to bit 8"; });
    tl.to(missCell.ring, { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Bit 8 is still 0, so \"proxy\" is definitely not in the set"; });
    tl.to(badge, { opacity: 1, duration: 0.3 }, "<");
    tl.add(() => {
      badgeWord.textContent = "\"proxy\"";
      badgeVerdict.textContent = "DEFINITELY NOT PRESENT";
    });
    tl.to([badgeWord, badgeVerdict], { opacity: 1, duration: 0.3 }, "<");
    tl.to(badgeRingWarn, { opacity: 1, duration: 0.3 }, "<0.1");

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

export const BitArrayDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 300" maxW="max-w-2xl" delay={delay} setup={setupBitArray} />
);
