import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke GSAP scene for shared tokenization across modalities. Theme comes
   entirely from CSS vars (.viz / .dark .viz in index.css), matching every
   other bespoke animation on the site. Plays once when scrolled into view,
   a replay button restarts it. All coordinates were verified offline with
   scripts/check-svg-layout.py before being written here.
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
  caption, viewBox, maxW = "max-w-2xl", setup,
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
   PATCH TOKEN FLOW — a photo gets cut into a 3x3 grid of patches, a caption
   is already a sequence of word tokens, and both kinds of tokens land in one
   shared sequence feeding one shared transformer. Layout verified offline
   with scripts/check-svg-layout.py (image grid frame lines and the persistent
   dashed slot outlines are structural backdrops, not boxes a moving token is
   meant to avoid, so they were excluded from that check's box set on purpose,
   the same way earlier diagrams on this site exclude an intentional nesting).
=========================================================================== */

interface PatchSpec { id: string; x: number; y: number; cx: number; cy: number }
interface SlotSpec { id: string; x: number; y: number; cx: number; cy: number }

const PATCH_SIZE = 80;
const GRID_X = 55;
const GRID_Y = 80;
const PATCHES: PatchSpec[] = [0, 1, 2].flatMap((r) =>
  [0, 1, 2].map((c) => {
    const x = GRID_X + c * PATCH_SIZE;
    const y = GRID_Y + r * PATCH_SIZE;
    return { id: `p-${r}-${c}`, x, y, cx: x + PATCH_SIZE / 2, cy: y + PATCH_SIZE / 2 };
  })
);

const CAPTION_WORDS = ["dog", "on", "beach"];
const CAP_Y = 80;
const CAP_W = 70;
const CAP_H = 40;
const CAP_GAP = 20;
const CAPTION_BOXES = CAPTION_WORDS.map((word, i) => {
  const x = 620 + i * (CAP_W + CAP_GAP);
  return { word, x, y: CAP_Y, cx: x + CAP_W / 2, cy: CAP_Y + CAP_H / 2 };
});

const SLOT_W = 56;
const SLOT_H = 50;
const SLOT_GAP = 10;
const SLOT_Y = 480;
const SLOT_COUNT = PATCHES.length + CAPTION_WORDS.length; // 12
const ROW_WIDTH = SLOT_COUNT * SLOT_W + (SLOT_COUNT - 1) * SLOT_GAP;
const SLOT_START_X = (900 - ROW_WIDTH) / 2;
const SLOTS: SlotSpec[] = Array.from({ length: SLOT_COUNT }, (_, i) => {
  const x = SLOT_START_X + i * (SLOT_W + SLOT_GAP);
  return { id: `slot-${i}`, x, y: SLOT_Y, cx: x + SLOT_W / 2, cy: SLOT_Y + SLOT_H / 2 };
});

const TRANSFORMER = { x: 300, y: 610, w: 300, h: 70 };

function setupPatchTokenFlow(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const phase = mkText(svg, "", 450, 20, "viz-phase", "middle");

  // Static frame lines around the photo grid, stay in place the whole time,
  // so the grid's shape is still visible once its patches fly out as tokens.
  const gridRight = GRID_X + PATCH_SIZE * 3;
  const gridBottom = GRID_Y + PATCH_SIZE * 3;
  mk(svg, "rect", { x: GRID_X, y: GRID_Y, width: PATCH_SIZE * 3, height: PATCH_SIZE * 3, class: "viz-thin", fill: "none" });
  mk(svg, "line", { x1: GRID_X + PATCH_SIZE, y1: GRID_Y, x2: GRID_X + PATCH_SIZE, y2: gridBottom, class: "viz-thin" });
  mk(svg, "line", { x1: GRID_X + PATCH_SIZE * 2, y1: GRID_Y, x2: GRID_X + PATCH_SIZE * 2, y2: gridBottom, class: "viz-thin" });
  mk(svg, "line", { x1: GRID_X, y1: GRID_Y + PATCH_SIZE, x2: gridRight, y2: GRID_Y + PATCH_SIZE, class: "viz-thin" });
  mk(svg, "line", { x1: GRID_X, y1: GRID_Y + PATCH_SIZE * 2, x2: gridRight, y2: GRID_Y + PATCH_SIZE * 2, class: "viz-thin" });

  const photoLabel = mkText(svg, "Photo, a dog on a beach", 175, 48, "viz-label-sm", "middle") as SVGTextElement;
  const captionLabel = mkText(svg, "Caption, dog on beach", 745, 48, "viz-label-sm", "middle") as SVGTextElement;
  const sequenceLabel = mkText(svg, "Shared token sequence", 450, 444, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([photoLabel, captionLabel, sequenceLabel], { opacity: 0 });

  // moving patch tokens (start filling their grid cell, end docked in a slot)
  const patchRects = PATCHES.map((p) =>
    mk(svg, "rect", { x: p.x, y: p.y, width: PATCH_SIZE, height: PATCH_SIZE, class: "viz-img", opacity: 0 }) as SVGRectElement
  );

  // moving caption tokens (start as a word chip, end docked in a slot, word stays readable throughout)
  const capRects = CAPTION_BOXES.map((c) =>
    mk(svg, "rect", { x: c.x, y: c.y, width: CAP_W, height: CAP_H, rx: 4, class: "viz-txt", opacity: 0 }) as SVGRectElement
  );
  const capTexts = CAPTION_BOXES.map((c) =>
    mkText(svg, c.word, c.cx, c.cy + 4, "viz-node-lbl", "middle") as SVGTextElement
  );
  gsap.set(capTexts, { opacity: 0 });

  // persistent (empty) slot outlines for the shared sequence
  const slotOutlines = SLOTS.map((s) =>
    mk(svg, "rect", { x: s.x, y: s.y, width: SLOT_W, height: SLOT_H, rx: 4, class: "viz-thin", "stroke-dasharray": "4 3", fill: "none", opacity: 0 }) as SVGRectElement
  );

  // final docked size/position inside each slot
  const dockRect = (s: SlotSpec) => ({ x: s.x + 4, y: s.y + 6, width: SLOT_W - 8, height: SLOT_H - 12 });

  const transformerBox = mk(svg, "rect", {
    x: TRANSFORMER.x, y: TRANSFORMER.y, width: TRANSFORMER.w, height: TRANSFORMER.h, rx: 8, class: "viz-panel", opacity: 0,
  }) as SVGRectElement;
  const transformerLabel = mkText(
    svg, "Shared transformer", TRANSFORMER.x + TRANSFORMER.w / 2, TRANSFORMER.y + TRANSFORMER.h / 2 + 5, "viz-node-lbl", "middle"
  ) as SVGTextElement;
  gsap.set(transformerLabel, { opacity: 0 });

  const arrowId = `mm-arrow-${uid}`;
  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: arrowId, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  type FunnelLine = { el: SVGLineElement; len: number };
  const makeFunnel = (x1: number, y1: number, x2: number, y2: number, withArrow: boolean): FunnelLine => {
    const el = mk(svg, "line", {
      x1, y1, x2, y2, class: "viz-thin", opacity: 0, ...(withArrow ? { markerEnd: `url(#${arrowId})` } : {}),
    }) as SVGLineElement;
    const len = Math.hypot(x2 - x1, y2 - y1);
    el.style.strokeDasharray = String(len);
    return { el, len };
  };
  const funnelLeft = makeFunnel(SLOTS[0].x, SLOT_Y + SLOT_H, TRANSFORMER.x, TRANSFORMER.y, false);
  const funnelRight = makeFunnel(SLOTS[SLOT_COUNT - 1].x + SLOT_W, SLOT_Y + SLOT_H, TRANSFORMER.x + TRANSFORMER.w, TRANSFORMER.y, false);
  const funnelCenter = makeFunnel(450, SLOT_Y + SLOT_H, TRANSFORMER.x + TRANSFORMER.w / 2, TRANSFORMER.y, true);
  const funnels = [funnelLeft, funnelRight, funnelCenter];

  const resetFunnel = (f: FunnelLine) => {
    gsap.set(f.el, { opacity: 0 });
    f.el.style.strokeDashoffset = String(f.len);
  };

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([photoLabel, captionLabel, sequenceLabel, transformerLabel, transformerBox], { opacity: 0 });
    PATCHES.forEach((p, i) => gsap.set(patchRects[i], { opacity: 0, attr: { x: p.x, y: p.y, width: PATCH_SIZE, height: PATCH_SIZE } }));
    CAPTION_BOXES.forEach((c, i) => {
      gsap.set(capRects[i], { opacity: 0, attr: { x: c.x, y: c.y, width: CAP_W, height: CAP_H } });
      gsap.set(capTexts[i], { opacity: 0, attr: { x: c.cx, y: c.cy + 4 } });
    });
    gsap.set(slotOutlines, { opacity: 0 });
    funnels.forEach(resetFunnel);

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Start with one photo and its caption, a dog on a beach"; });
    tl.to(photoLabel, { opacity: 1, duration: 0.3 }, "<");
    tl.to(captionLabel, { opacity: 1, duration: 0.3 }, "<");
    tl.to(patchRects, { opacity: 1, duration: 0.3, stagger: 0.03 }, "<0.1");
    tl.to(capRects, { opacity: 1, duration: 0.3, stagger: 0.05 }, "<");
    tl.to(capTexts, { opacity: 1, duration: 0.3, stagger: 0.05 }, "<");
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Every patch and every word is about to fill one slot in a single shared sequence"; });
    tl.to(sequenceLabel, { opacity: 1, duration: 0.3 }, "<");
    tl.to(slotOutlines, { opacity: 1, duration: 0.35, stagger: 0.02 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Each patch flattens and gets projected into a vector, exactly like a word token"; });
    patchRects.forEach((el, i) => {
      const d = dockRect(SLOTS[i]);
      tl.to(el, { attr: d, duration: 0.5, ease: "power2.inOut" }, i === 0 ? "<0.1" : "<0.06");
    });
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "The caption's words join that same sequence, right after the image tokens"; });
    capRects.forEach((el, i) => {
      const target = SLOTS[PATCHES.length + i];
      const d = dockRect(target);
      tl.to(el, { attr: d, duration: 0.5, ease: "power2.inOut" }, i === 0 ? "<0.1" : "<0.08");
      tl.to(capTexts[i], { attr: { x: target.cx, y: target.cy + 4 }, duration: 0.5, ease: "power2.inOut" }, "<");
    });
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "One shared transformer now processes every token together, image or text"; });
    tl.to(transformerBox, { opacity: 1, duration: 0.35 }, "<");
    tl.to(transformerLabel, { opacity: 1, duration: 0.35 }, "<");
    funnels.forEach((f, i) => {
      tl.to(f.el, { opacity: 0.7, duration: 0.05 }, i === 0 ? "<0.1" : "<0.06");
      tl.to(f.el, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
    });

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

export const PatchTokenFlowDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 700" maxW="max-w-3xl" delay={delay} setup={setupPatchTokenFlow} />
);
