import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke GSAP animation for "Mixture of experts and sparse models".
   Theme comes entirely from CSS vars (.viz / .dark .viz in index.css), so the
   same SVG reads correctly in both themes. Plays once when scrolled into
   view, replay/speed controls copied verbatim from the reference
   implementation (VizFigure, mk, mkText).

   TOKEN ROUTING AND CAPACITY OVERFLOW — the one mechanism in this post where
   watching it happen beats reading about it. Four tokens ("The", "cat",
   "sat", "down") each pick a top-1 expert from a 4-expert layer. Expert 1's
   capacity is 2 tokens for this batch. "The" and "cat" both want Expert 1
   and fill it. "sat" wants Expert 2, plenty of room. "down" also wants
   Expert 1, but it's already full, so it skips the layer and passes
   straight through the residual stream instead.

   Router logits and softmax used for this worked example (verified with
   Python before wiring in), over experts [E1, E2, E3, E4]:
     "The"  logits [ 2.0,  0.5, -1.0,  0.2] -> probs [0.695, 0.155, 0.035, 0.115] -> top-1 E1
     "cat"  logits [ 1.8,  0.3,  0.9, -0.5] -> probs [0.578, 0.129, 0.235, 0.058] -> top-1 E1
     "sat"  logits [ 0.4,  2.1,  0.2, -0.3] -> probs [0.128, 0.703, 0.105, 0.064] -> top-1 E2
     "down" logits [ 1.5, -0.2,  0.1,  0.6] -> probs [0.545, 0.100, 0.134, 0.221] -> top-1 E1 (overflow)
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
  caption, viewBox, maxW = "max-w-3xl", delay, setup,
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
      transition={{ duration: 0.35, delay }}
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

type TokBox = { id: string; label: string; x: number; cy: number; cx: number; rect: SVGRectElement; ring: SVGRectElement };
type ExpBox = {
  id: string;
  cx: number;
  x: number;
  pips: SVGRectElement[];
  counter: SVGTextElement;
  fullRing: SVGRectElement;
  filled: number;
};

const TOK_Y = 60;
const TOK_H = 60;
const TOK_W = 110;
const TOK_CY = TOK_Y + TOK_H / 2; // 90
const TOKENS = [
  { id: "the", label: "The", cx: 160 },
  { id: "cat", label: "cat", cx: 360 },
  { id: "sat", label: "sat", cx: 560 },
  { id: "down", label: "down", cx: 760 },
];

const EXP_Y = 260;
const EXP_H = 90;
const EXP_W = 130;
const EXP_CY = EXP_Y + EXP_H / 2; // 305
const EXPERTS = [
  { id: "e1", label: "Expert 1", cx: 260 },
  { id: "e2", label: "Expert 2", cx: 460 },
  { id: "e3", label: "Expert 3", cx: 660 },
  { id: "e4", label: "Expert 4", cx: 860 },
];

const SKIP_X = 675;
const SKIP_Y = 425;
const SKIP_W = 170;
const SKIP_H = 70;
const SKIP_CX = SKIP_X + SKIP_W / 2; // 760
const SKIP_CY = SKIP_Y + SKIP_H / 2; // 460

function drawLine(
  svg: SVGSVGElement,
  x1: number, y1: number, x2: number, y2: number,
  cls: string, markerId: string
) {
  const ln = mk(svg, "line", {
    x1, y1, x2, y2, class: cls, "marker-end": `url(#${markerId})`, opacity: 0,
  }) as SVGLineElement;
  const len = Math.hypot(x2 - x1, y2 - y1);
  ln.style.strokeDasharray = String(len);
  ln.style.strokeDashoffset = String(len);
  return ln;
}

function setupTokenRouting(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const markerBlue = mk(defs, "marker", {
    id: `moe-blue-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(markerBlue, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-blue" });
  const markerWarn = mk(defs, "marker", {
    id: `moe-warn-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(markerWarn, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-warn" });

  const phase = mkText(svg, "", 485, 22, "viz-phase", "middle");

  mkText(svg, "TOKENS", 20, TOK_CY - 4, "viz-label-sm", "start");
  mkText(svg, "EXPERTS", 20, EXP_CY - 4, "viz-label-sm", "start");
  mkText(svg, "capacity 2 each", 20, EXP_CY + 14, "viz-label-sm", "start");

  const tokens: TokBox[] = TOKENS.map((t) => {
    const ring = mk(svg, "rect", {
      x: t.cx - TOK_W / 2 - 4, y: TOK_Y - 4, width: TOK_W + 8, height: TOK_H + 8, rx: 12,
      class: "viz-warn", fill: "none", opacity: 0,
    }) as SVGRectElement;
    const rect = mk(svg, "rect", {
      x: t.cx - TOK_W / 2, y: TOK_Y, width: TOK_W, height: TOK_H, rx: 10, class: "viz-box",
    }) as SVGRectElement;
    mkText(svg, t.label, t.cx, TOK_CY + 5, "viz-node-lbl", "middle");
    return { id: t.id, label: t.label, x: t.cx - TOK_W / 2, cx: t.cx, cy: TOK_CY, rect, ring };
  });

  const experts: ExpBox[] = EXPERTS.map((e) => {
    mk(svg, "rect", {
      x: e.cx - EXP_W / 2, y: EXP_Y, width: EXP_W, height: EXP_H, rx: 10, class: "viz-box",
    });
    const fullRing = mk(svg, "rect", {
      x: e.cx - EXP_W / 2 - 4, y: EXP_Y - 4, width: EXP_W + 8, height: EXP_H + 8, rx: 12,
      class: "viz-warn", fill: "none", opacity: 0,
    }) as SVGRectElement;
    mkText(svg, e.label, e.cx, EXP_CY - 22, "viz-node-lbl", "middle");
    const pipY = EXP_CY + 2;
    const pips: SVGRectElement[] = [0, 1].map((slot) => {
      const px = e.cx - 20 + slot * 32;
      mk(svg, "rect", { x: px - 10, y: pipY, width: 20, height: 20, rx: 4, class: "viz-thin", fill: "none" });
      const fill = mk(svg, "rect", { x: px - 10, y: pipY, width: 20, height: 20, rx: 4, class: "viz-blue", opacity: 0 }) as SVGRectElement;
      return fill;
    });
    const counter = mkText(svg, "0 / 2", e.cx, EXP_CY + 40, "viz-label-sm", "middle") as SVGTextElement;
    return { id: e.id, cx: e.cx, x: e.cx - EXP_W / 2, pips, counter, fullRing, filled: 0 };
  });

  mk(svg, "rect", { x: SKIP_X, y: SKIP_Y, width: SKIP_W, height: SKIP_H, rx: 10, class: "viz-panel" });
  mkText(svg, "skips this layer", SKIP_CX, SKIP_CY - 4, "viz-label-sm", "middle");
  mkText(svg, "residual passthrough", SKIP_CX, SKIP_CY + 14, "viz-label-sm", "middle");

  const byId = <T extends { id: string }>(arr: T[], id: string) => arr.find((a) => a.id === id) as T;

  const lineThe = drawLine(svg, 160, TOK_Y + TOK_H, 235, EXP_Y, "viz-blue", `moe-blue-${uid}`);
  const lineCat = drawLine(svg, 360, TOK_Y + TOK_H, 285, EXP_Y, "viz-blue", `moe-blue-${uid}`);
  const lineSat = drawLine(svg, 560, TOK_Y + TOK_H, 460, EXP_Y, "viz-blue", `moe-blue-${uid}`);
  const lineDown = drawLine(svg, 760, TOK_Y + TOK_H, 760, SKIP_Y, "viz-warn", `moe-warn-${uid}`);

  const fillPip = (exp: ExpBox) => {
    const pip = exp.pips[exp.filled];
    if (pip) gsap.set(pip, { opacity: 1 });
    exp.filled += 1;
    exp.counter.textContent = `${exp.filled} / 2`;
  };

  const resetAll = () => {
    tokens.forEach((t) => gsap.set(t.ring, { opacity: 0 }));
    experts.forEach((e) => {
      e.filled = 0;
      e.counter.textContent = "0 / 2";
      e.pips.forEach((p) => gsap.set(p, { opacity: 0 }));
      gsap.set(e.fullRing, { opacity: 0 });
    });
    [lineThe, lineCat, lineSat, lineDown].forEach((ln) => {
      const len = Math.hypot(
        Number(ln.getAttribute("x2")) - Number(ln.getAttribute("x1")),
        Number(ln.getAttribute("y2")) - Number(ln.getAttribute("y1"))
      );
      gsap.set(ln, { opacity: 0, strokeDashoffset: len });
    });
    phase.textContent = "";
  };

  const e1 = byId(experts, "e1");
  const e2 = byId(experts, "e2");
  const tokThe = byId(tokens, "the");
  const tokCat = byId(tokens, "cat");
  const tokSat = byId(tokens, "sat");
  const tokDown = byId(tokens, "down");

  const draw = (ln: SVGLineElement, at: string) => {
    const len = Math.hypot(
      Number(ln.getAttribute("x2")) - Number(ln.getAttribute("x1")),
      Number(ln.getAttribute("y2")) - Number(ln.getAttribute("y1"))
    );
    tl!.to(ln, { strokeDashoffset: 0, opacity: 1, duration: 0.45, ease: "none" }, at);
  };

  let tl: gsap.core.Timeline | null = null;
  let rate = 1;

  const play = () => {
    tl?.kill();
    resetAll();
    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "4 tokens arrive. Each expert can hold 2 tokens this batch."; });
    tl.to({}, { duration: 1.0 });

    tl.add(() => { phase.textContent = '"The" picks Expert 1, its top choice from the softmax.'; gsap.set(tokThe.ring, { opacity: 1 }); });
    draw(lineThe, "<");
    tl.add(() => fillPip(e1), ">-0.05");
    tl.to({}, { duration: 0.8 });
    tl.to(tokThe.ring, { opacity: 0, duration: 0.3 });

    tl.add(() => { phase.textContent = '"cat" also picks Expert 1. That fills its last open slot.'; gsap.set(tokCat.ring, { opacity: 1 }); });
    draw(lineCat, "<");
    tl.add(() => { fillPip(e1); gsap.to(e1.fullRing, { opacity: 1, duration: 0.3 }); }, ">-0.05");
    tl.to({}, { duration: 0.9 });
    tl.to(tokCat.ring, { opacity: 0, duration: 0.3 });

    tl.add(() => { phase.textContent = '"sat" picks Expert 2. Plenty of room there.'; gsap.set(tokSat.ring, { opacity: 1 }); });
    draw(lineSat, "<");
    tl.add(() => fillPip(e2), ">-0.05");
    tl.to({}, { duration: 0.8 });
    tl.to(tokSat.ring, { opacity: 0, duration: 0.3 });

    tl.add(() => {
      phase.textContent = '"down" wants Expert 1 too, but it is already full.';
      gsap.set(tokDown.ring, { opacity: 1 });
    });
    tl.to({}, { duration: 0.9 });
    tl.add(() => { phase.textContent = '"down" skips this layer and passes straight through the residual stream.'; });
    draw(lineDown, "<");
    tl.to({}, { duration: 1.0 });

    tl.add(() => { phase.textContent = "Experts 3 and 4 sat idle, exactly the imbalance a load-balancing loss fixes."; });
    tl.to({}, { duration: 1.2 });

    tl.timeScale(rate);
  };

  return {
    play,
    pause: () => tl?.pause(),
    resume: () => tl?.play(),
    setRate: (r) => { rate = r; tl?.timeScale(r); },
    cleanup: () => tl?.kill(),
  };
}

export const TokenRoutingOverflowDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 970 520" maxW="max-w-3xl" delay={delay} setup={setupTokenRouting} />
);
