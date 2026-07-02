import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animations for the Contrastive Learning post.
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
  setMode?: (m: string) => void; // switch variant (for mode-tabbed figures)
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
  caption, viewBox, maxW = "max-w-3xl", setup, modes,
}: {
  caption: string;
  viewBox: string;
  maxW?: string;
  delay?: number; // accepted for API parity; not used for in-view entrance
  setup: (svg: SVGSVGElement) => Api;
  modes?: { key: string; label: string }[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const apiRef = useRef<Api | null>(null);
  const rateRef = useRef(1);
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState(modes?.[0]?.key ?? "");

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
  const pickMode = (m: string) => {
    const api = apiRef.current;
    if (!api?.setMode) return;
    setMode(m);
    api.setMode(m);
    doPlay();
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
        {modes && (
          <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
            {modes.map((m) => (
              <button key={m.key} onClick={() => pickMode(m.key)} className={mode === m.key ? CTRL_ON : CTRL}>
                {m.label}
              </button>
            ))}
          </div>
        )}
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
   1) PULL & PUSH — the core idea
=========================================================================== */
function setupPullPush(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `push-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-warn" });

  // panel + phase label
  mk(svg, "rect", { x: 30, y: 58, width: 700, height: 250, rx: 8, class: "viz-panel" });
  mkText(svg, "EMBEDDING SPACE", 30, 44, "viz-label-sm");
  const phase = mkText(svg, "", 380, 44, "viz-phase", "middle");

  // legend
  mk(svg, "rect", { x: 470, y: 326, width: 18, height: 18, rx: 2, class: "viz-img" });
  mkText(svg, "image", 496, 340, "viz-label-sm");
  mk(svg, "circle", { cx: 575, cy: 335, r: 10, class: "viz-txt" });
  mkText(svg, "caption", 592, 340, "viz-label-sm");

  // nodes
  type Node = { g: SVGGElement };
  const makeNode = (isImg: boolean, label: string): Node => {
    const g = mk(svg, "g") as SVGGElement;
    if (isImg) mk(g, "rect", { x: -15, y: -15, width: 30, height: 30, rx: 3, class: "viz-img" });
    else mk(g, "circle", { cx: 0, cy: 0, r: 16, class: "viz-txt" });
    mkText(g, label, 0, 4, "viz-node-lbl", "middle");
    return { g };
  };
  // [catImg, catTxt, dogImg, dogTxt]
  const catImg = makeNode(true, "cat"), catTxt = makeNode(false, "cat");
  const dogImg = makeNode(true, "dog"), dogTxt = makeNode(false, "dog");

  // pull lines (under nodes ideally, but fine on top with low opacity)
  const pullCat = mk(svg, "line", { class: "viz-pull", opacity: 0 });
  const pullDog = mk(svg, "line", { class: "viz-pull", opacity: 0 });

  // push arrows (diverging) + label
  const pushL = mk(svg, "line", { class: "viz-push", "marker-end": `url(#push-${uid})`, opacity: 0 });
  const pushR = mk(svg, "line", { class: "viz-push", "marker-end": `url(#push-${uid})`, opacity: 0 });
  const pushLbl = mkText(svg, "push", 380, 250, "viz-warn-lbl", "middle");
  pushLbl.setAttribute("opacity", "0");

  // positions
  const START = { catImg: [250, 130], catTxt: [525, 215], dogImg: [470, 120], dogTxt: [295, 180] };
  const PULL  = { catImg: [322, 188], catTxt: [354, 206], dogImg: [415, 188], dogTxt: [447, 206] };
  const PUSH  = { catImg: [250, 188], catTxt: [282, 206], dogImg: [500, 188], dogTxt: [532, 206] };
  const setLine = (ln: Element, a: number[], b: number[]) =>
    gsap.set(ln, { attr: { x1: a[0], y1: a[1], x2: b[0], y2: b[1] } });

  // initial state at build time (scattered + hidden) so nothing piles at origin
  const place0 = () => {
    gsap.set(catImg.g, { x: START.catImg[0], y: START.catImg[1] });
    gsap.set(catTxt.g, { x: START.catTxt[0], y: START.catTxt[1] });
    gsap.set(dogImg.g, { x: START.dogImg[0], y: START.dogImg[1] });
    gsap.set(dogTxt.g, { x: START.dogTxt[0], y: START.dogTxt[1] });
    gsap.set([catImg.g, catTxt.g, dogImg.g, dogTxt.g], { opacity: 0 });
  };
  place0();

  let tl: gsap.core.Timeline | null = null;
  const place = (p: typeof START) => {
    gsap.set(catImg.g, { x: p.catImg[0], y: p.catImg[1] });
    gsap.set(catTxt.g, { x: p.catTxt[0], y: p.catTxt[1] });
    gsap.set(dogImg.g, { x: p.dogImg[0], y: p.dogImg[1] });
    gsap.set(dogTxt.g, { x: p.dogTxt[0], y: p.dogTxt[1] });
  };

  const play = () => {
    tl?.kill();
    place(START);
    gsap.set([catImg.g, catTxt.g, dogImg.g, dogTxt.g], { opacity: 0, scale: 0.8, transformOrigin: "center" });
    gsap.set([pullCat, pullDog, pushL, pushR, pushLbl], { opacity: 0 });
    setLine(pullCat, START.catImg, START.catTxt);
    setLine(pullDog, START.dogImg, START.dogTxt);
    phase.textContent = "";

    tl = gsap.timeline();
    tl.add(() => (phase.textContent = "a scattered batch"));
    tl.to([catImg.g, catTxt.g, dogImg.g, dogTxt.g], { opacity: 1, scale: 1, duration: 0.4, stagger: 0.1, ease: "back.out(1.7)" });
    tl.to({}, { duration: 0.7 });

    // PULL
    tl.add(() => (phase.textContent = "PULL — each image toward its own caption"));
    tl.to([pullCat, pullDog], { opacity: 0.65, duration: 0.3 });
    tl.to(catImg.g, { x: PULL.catImg[0], y: PULL.catImg[1], duration: 1, ease: "power2.inOut" }, "<");
    tl.to(catTxt.g, { x: PULL.catTxt[0], y: PULL.catTxt[1], duration: 1, ease: "power2.inOut" }, "<");
    tl.to(dogImg.g, { x: PULL.dogImg[0], y: PULL.dogImg[1], duration: 1, ease: "power2.inOut" }, "<");
    tl.to(dogTxt.g, { x: PULL.dogTxt[0], y: PULL.dogTxt[1], duration: 1, ease: "power2.inOut" }, "<");
    tl.to(pullCat, { attr: { x1: PULL.catImg[0], y1: PULL.catImg[1], x2: PULL.catTxt[0], y2: PULL.catTxt[1] }, duration: 1, ease: "power2.inOut" }, "<");
    tl.to(pullDog, { attr: { x1: PULL.dogImg[0], y1: PULL.dogImg[1], x2: PULL.dogTxt[0], y2: PULL.dogTxt[1] }, duration: 1, ease: "power2.inOut" }, "<");
    tl.to({}, { duration: 0.7 });

    // PUSH
    tl.add(() => (phase.textContent = "PUSH — different concepts apart"));
    setLine(pushL, [372, 150], [300, 150]);
    setLine(pushR, [408, 150], [480, 150]);
    tl.to([pushL, pushR, pushLbl], { opacity: 1, duration: 0.3 });
    tl.to(catImg.g, { x: PUSH.catImg[0], y: PUSH.catImg[1], duration: 1, ease: "power2.inOut" }, "<");
    tl.to(catTxt.g, { x: PUSH.catTxt[0], y: PUSH.catTxt[1], duration: 1, ease: "power2.inOut" }, "<");
    tl.to(dogImg.g, { x: PUSH.dogImg[0], y: PUSH.dogImg[1], duration: 1, ease: "power2.inOut" }, "<");
    tl.to(dogTxt.g, { x: PUSH.dogTxt[0], y: PUSH.dogTxt[1], duration: 1, ease: "power2.inOut" }, "<");
    tl.to(pullCat, { attr: { x1: PUSH.catImg[0], y1: PUSH.catImg[1], x2: PUSH.catTxt[0], y2: PUSH.catTxt[1] }, duration: 1, ease: "power2.inOut" }, "<");
    tl.to(pullDog, { attr: { x1: PUSH.dogImg[0], y1: PUSH.dogImg[1], x2: PUSH.dogTxt[0], y2: PUSH.dogTxt[1] }, duration: 1, ease: "power2.inOut" }, "<");
    tl.to([pushL, pushR, pushLbl], { opacity: 0, duration: 0.4 }, ">-0.1");
    tl.to({}, { duration: 0.4 });
    tl.add(() => (phase.textContent = "two clean clusters — that's the whole idea"));
  };

  return {
    play,
    pause: () => tl?.pause(),
    resume: () => tl?.play(),
    setRate: (r: number) => tl?.timeScale(r),
    cleanup: () => tl?.kill(),
  };
}

/* ===========================================================================
   2) CONTRASTIVE TRAINING — similarity matrix derived from a live embedding
=========================================================================== */
function setupTraining(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const N = 5;
  const WORDS = ["cat", "dog", "car", "sea", "sun"];
  const STEPS = 12;

  // seeded rng for a good-looking scatter
  let seed = 11;
  const rng = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  const PANEL = { x: 470, y: 120, w: 470, h: 380 };
  const PCX = PANEL.x + PANEL.w / 2, PCY = PANEL.y + PANEL.h / 2, R = 130;
  const centers = WORDS.map((_, c) => {
    const a = (c / N) * Math.PI * 2 - Math.PI / 2;
    return [PCX + R * Math.cos(a), PCY + R * Math.sin(a)];
  });
  const target = (c: number, isImg: boolean) => [centers[c][0] + (isImg ? -15 : 15), centers[c][1] + (isImg ? -8 : 10)];
  const starts: number[][] = [];
  for (let n = 0; n < 2 * N; n++) starts.push([PANEL.x + 40 + rng() * (PANEL.w - 80), PANEL.y + 40 + rng() * (PANEL.h - 80)]);

  const ease = (x: number) => 1 - Math.pow(1 - x, 2.2);
  const posAt = (step: number, n: number) => {
    const c = n % N, isImg = n < N, f = ease(step / STEPS);
    const s = starts[n], t = target(c, isImg);
    return [s[0] + (t[0] - s[0]) * f, s[1] + (t[1] - s[1]) * f];
  };
  const SIGMA = 78;
  const simMatrix = (step: number) => {
    const img = Array.from({ length: N }, (_, i) => posAt(step, i));
    const txt = Array.from({ length: N }, (_, j) => posAt(step, N + j));
    const S: number[][] = [];
    for (let i = 0; i < N; i++) { S[i] = []; for (let j = 0; j < N; j++) { const d = Math.hypot(img[i][0] - txt[j][0], img[i][1] - txt[j][1]); S[i][j] = Math.exp(-(d * d) / (SIGMA * SIGMA)); } }
    return S;
  };
  const lossAt = (step: number) => {
    const S = simMatrix(step); let L = 0;
    for (let i = 0; i < N; i++) { const row = S[i].reduce((a, b) => a + b, 0); L += -Math.log(Math.max(S[i][i], 1e-6) / Math.max(row, 1e-6)); }
    return L / N;
  };

  // ---- LEFT: matrix ----
  const MAT = { x: 95, y: 165, cell: 46, gap: 6 };
  const mx = (j: number) => MAT.x + j * (MAT.cell + MAT.gap);
  const my = (i: number) => MAT.y + i * (MAT.cell + MAT.gap);
  const MW = N * MAT.cell + (N - 1) * MAT.gap;
  mkText(svg, "SIMILARITY MATRIX", MAT.x, MAT.y - 62, "viz-label").setAttribute("font-weight", "700");
  mkText(svg, "texts →", MAT.x + MW / 2, MAT.y - 38, "viz-label-sm", "middle");
  const yl = mkText(svg, "images ↓", MAT.x - 52, MAT.y + MW / 2, "viz-label-sm", "middle");
  yl.setAttribute("transform", `rotate(-90 ${MAT.x - 52} ${MAT.y + MW / 2})`);
  for (let k = 0; k < N; k++) {
    mkText(svg, WORDS[k], mx(k) + MAT.cell / 2, MAT.y - 12, "viz-label-sm", "middle");
    mkText(svg, WORDS[k], MAT.x - 12, my(k) + MAT.cell / 2 + 4, "viz-label-sm", "middle");
  }
  const cells: Element[][] = [];
  for (let i = 0; i < N; i++) {
    cells[i] = [];
    for (let j = 0; j < N; j++) {
      const diag = i === j;
      cells[i][j] = mk(svg, "rect", {
        x: mx(j), y: my(i), width: MAT.cell, height: MAT.cell, rx: 3,
        class: diag ? "viz-cell diag" : "viz-cell", "fill-opacity": 0,
      });
    }
  }
  mkText(svg, "loss", MAT.x, my(N - 1) + MAT.cell + 40, "viz-label-sm");
  const lossText = mkText(svg, "—", MAT.x + 42, my(N - 1) + MAT.cell + 40, "viz-label");
  lossText.setAttribute("font-weight", "700");
  mkText(svg, "diagonal = true matches", MAT.x, my(N - 1) + MAT.cell + 62, "viz-warn-lbl");

  // ---- RIGHT: embedding ----
  mk(svg, "rect", { x: PANEL.x, y: PANEL.y, width: PANEL.w, height: PANEL.h, rx: 8, class: "viz-panel" });
  mkText(svg, "EMBEDDING SPACE", PANEL.x, PANEL.y - 12, "viz-label").setAttribute("font-weight", "700");
  const stepText = mkText(svg, `step 0 / ${STEPS}`, PANEL.x + PANEL.w, PANEL.y - 12, "viz-label-sm", "end");

  const pulls: Element[] = [];
  for (let c = 0; c < N; c++) pulls.push(mk(svg, "line", { class: "viz-pull", opacity: 0 }));
  const nodes: SVGGElement[] = [];
  for (let n = 0; n < 2 * N; n++) {
    const g = mk(svg, "g") as SVGGElement;
    if (n < N) mk(g, "rect", { x: -15, y: -13, width: 30, height: 26, rx: 3, class: "viz-img" });
    else mk(g, "circle", { cx: 0, cy: 0, r: 15, class: "viz-txt" });
    mkText(g, WORDS[n % N], 0, 4, "viz-node-lbl", "middle").setAttribute("font-size", "10");
    nodes.push(g);
  }
  // legend
  mk(svg, "rect", { x: PANEL.x + 8, y: PANEL.y + PANEL.h - 26, width: 16, height: 14, rx: 2, class: "viz-img" });
  mkText(svg, "image", PANEL.x + 30, PANEL.y + PANEL.h - 14, "viz-label-sm");
  mk(svg, "circle", { cx: PANEL.x + 108, cy: PANEL.y + PANEL.h - 18, r: 9, class: "viz-txt" });
  mkText(svg, "caption", PANEL.x + 124, PANEL.y + PANEL.h - 14, "viz-label-sm");

  const phase = mkText(svg, "", (PANEL.x + MAT.x) / 2 + 80, 70, "viz-phase", "middle");

  const setCells = (step: number, instant: boolean, tl?: gsap.core.Timeline) => {
    const S = simMatrix(step);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const v = (S[i][j] * (i === j ? 1 : 0.82)).toFixed(3);
      if (instant) gsap.set(cells[i][j], { attr: { "fill-opacity": v } });
      else tl!.to(cells[i][j], { attr: { "fill-opacity": v }, duration: 0.45, ease: "power1.inOut" }, "<");
    }
  };
  const placeInstant = (step: number) => {
    for (let n = 0; n < 2 * N; n++) { const p = posAt(step, n); gsap.set(nodes[n], { x: p[0], y: p[1] }); }
    for (let c = 0; c < N; c++) { const a = posAt(step, c), b = posAt(step, N + c); gsap.set(pulls[c], { attr: { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, opacity: step === 0 ? 0 : 0.5 }); }
    setCells(step, true);
    stepText.textContent = `step ${step} / ${STEPS}`;
    lossText.textContent = lossAt(step).toFixed(3);
  };

  placeInstant(0); // initial scattered state at build time (no flash before play)

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    placeInstant(0);
    phase.textContent = "";
    tl = gsap.timeline();
    tl.add(() => (phase.textContent = "randomly initialized — the model knows nothing"));
    tl.to(pulls, { opacity: 0.5, duration: 0.3 });
    tl.to({}, { duration: 0.35 });
    tl.add(() => (phase.textContent = "PULL pairs together · PUSH the rest apart"));

    const dur = 0.5;
    for (let s = 1; s <= STEPS; s++) {
      for (let n = 0; n < 2 * N; n++) { const p = posAt(s, n); tl.to(nodes[n], { x: p[0], y: p[1], duration: dur, ease: "power2.inOut" }, n === 0 ? ">" : "<"); }
      for (let c = 0; c < N; c++) { const a = posAt(s, c), b = posAt(s, N + c); tl.to(pulls[c], { attr: { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, duration: dur, ease: "power2.inOut" }, "<"); }
      setCells(s, false, tl);
      tl.add(() => { stepText.textContent = `step ${s} / ${STEPS}`; lossText.textContent = lossAt(s).toFixed(3); }, "<");
      if (s === 5) { tl.add(() => (phase.textContent = "diagonal brightens, off-diagonal fades, loss drops")); tl.to({}, { duration: 0.6 }); }
    }
    tl.to({}, { duration: 0.4 });
    tl.add(() => (phase.textContent = "clusters = concepts · nearness = meaning"));
  };

  return {
    play,
    pause: () => tl?.pause(),
    resume: () => tl?.play(),
    setRate: (r: number) => tl?.timeScale(r),
    cleanup: () => tl?.kill(),
  };
}

/* ===========================================================================
   3) GRPO — group sampling → baseline → advantages  (numerical walkthrough)
=========================================================================== */
function setupGrpoAdvantage(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const mkMarker = (id: string, cls: string) => {
    const m = mk(defs, "marker", { id: `${id}-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6.5, markerHeight: 6.5, orient: "auto-start-reverse" });
    mk(m, "path", { d: "M0,0 L10,5 L0,10 z", class: cls });
  };
  mkMarker("ink", "viz-arrow-ink");
  mkMarker("blue", "viz-arrow-blue");
  mkMarker("warn", "viz-arrow-warn");

  const ANS = ["42", "43", "40", "41"];
  const REW = [1, 0, 0, 0];
  const MEAN = REW.reduce((a, b) => a + b, 0) / REW.length; // 0.25
  const ADV = REW.map((r) => r - MEAN);                     // +0.75, -0.25 x3
  const cols = [165, 375, 585, 795];

  // prompt
  const promptY = 28;
  mk(svg, "rect", { x: 370, y: promptY, width: 200, height: 48, rx: 6, class: "viz-box" });
  mkText(svg, "“7 × 6 = ?”", 470, promptY + 30, "viz-num", "middle");

  // chart geometry: reward 0..1 maps to y
  const yR = (r: number) => 430 - r * 150;     // r=1 -> 280, r=0 -> 430
  const baseY = yR(MEAN);                       // baseline at 0.25

  // per-answer: sample arrow, answer box, reward chip, advantage bar, update arrow
  const ansBox: Element[] = [], rewChip: Element[] = [], sampleArr: Element[] = [];
  const advBar: Element[] = [], advLbl: Element[] = [], updArr: Element[] = [], updLbl: Element[] = [];
  cols.forEach((cx, i) => {
    const a = mk(svg, "line", { x1: 470, y1: promptY + 48, x2: cx, y2: 118, class: "viz-thin", "marker-end": `url(#ink-${uid})`, opacity: 0 });
    sampleArr.push(a);
    const box = mk(svg, "rect", { x: cx - 55, y: 120, width: 110, height: 44, rx: 5, class: "viz-box", opacity: 0 });
    ansBox.push(box);
  });
  // answer labels (separate so we can fade them in with the box)
  const ansLbl = cols.map((cx, i) => {
    const t = mkText(svg, ANS[i], cx, 148, "viz-num", "middle"); t.setAttribute("opacity", "0"); return t;
  });

  cols.forEach((cx, i) => {
    const chip = mkText(svg, `r = ${REW[i].toFixed(0)}`, cx, 200, "viz-label-sm", "middle");
    chip.setAttribute("opacity", "0"); rewChip.push(chip);
    const bar = mk(svg, "rect", { x: cx - 26, y: baseY, width: 52, height: 0, rx: 2, class: ADV[i] >= 0 ? "viz-bar-pos" : "viz-bar-neg", opacity: 0 });
    advBar.push(bar);
    const al = mkText(svg, `${ADV[i] > 0 ? "+" : ""}${ADV[i].toFixed(2)}`, cx, baseY, ADV[i] >= 0 ? "viz-num-pos" : "viz-num-neg", "middle");
    al.setAttribute("opacity", "0"); advLbl.push(al);
    // update arrow (drawn later): up for positive, down for negative
    const ua = mk(svg, "line", { x1: cx + 48, y1: 142, x2: cx + 48, y2: 142, class: ADV[i] >= 0 ? "viz-up" : "viz-down", "marker-end": `url(#${ADV[i] >= 0 ? "blue" : "warn"}-${uid})`, opacity: 0 });
    updArr.push(ua);
    const ul = mkText(svg, ADV[i] >= 0 ? "↑ prob" : "↓ prob", cx + 62, 138, ADV[i] >= 0 ? "viz-num-pos" : "viz-num-neg", "start");
    ul.setAttribute("opacity", "0"); ul.setAttribute("font-size", "11"); updLbl.push(ul);
  });

  // axis + baseline
  mk(svg, "line", { x1: 90, y1: 280, x2: 90, y2: 430, class: "viz-thin" });
  mkText(svg, "1.0", 78, 284, "viz-label-sm", "end");
  mkText(svg, "0.0", 78, 434, "viz-label-sm", "end");
  const baseline = mk(svg, "line", { x1: 90, y1: baseY, x2: 860, y2: baseY, class: "viz-baseline", opacity: 0 });
  const baseLbl = mkText(svg, "group mean = 0.25  (the baseline — no critic needed)", 96, baseY - 8, "viz-label-sm", "start");
  baseLbl.setAttribute("opacity", "0");

  const phase = mkText(svg, "", 450, 500, "viz-phase", "middle");

  // hide the duplicate loop labels by collecting them: easier — clear & rebuild not needed; set all <text> with opacity already 0
  let tl: gsap.core.Timeline | null = null;
  const reset = () => {
    gsap.set([...sampleArr, ...ansBox, ...ansLbl, ...rewChip, ...advBar, ...advLbl, ...updArr, ...updLbl, baseline, baseLbl], { opacity: 0 });
    gsap.set(advBar, { attr: { height: 0, y: baseY } });
    gsap.set(updArr, { attr: { y2: 142 } });
    phase.textContent = "";
  };

  const play = () => {
    tl?.kill();
    reset();
    tl = gsap.timeline();
    tl.add(() => (phase.textContent = "Ask the same question G = 4 times"));
    // sample group
    tl.to(sampleArr, { opacity: 1, duration: 0.3, stagger: 0.12 });
    tl.to(ansBox, { opacity: 1, duration: 0.3, stagger: 0.12 }, "<");
    tl.to(ansLbl, { opacity: 1, duration: 0.3, stagger: 0.12 }, "<");
    tl.to({}, { duration: 0.4 });
    // rewards
    tl.add(() => (phase.textContent = "Score each with a rule-based reward (1 = correct)"));
    tl.to(rewChip, { opacity: 1, duration: 0.3, stagger: 0.1 });
    tl.to({}, { duration: 0.5 });
    // baseline
    tl.add(() => (phase.textContent = "The group MEAN is the baseline — that's the trick"));
    tl.fromTo(baseline, { attr: { x2: 90 }, opacity: 1 }, { attr: { x2: 860 }, duration: 0.7, ease: "power1.out" });
    tl.to(baseLbl, { opacity: 1, duration: 0.3 }, "<0.2");
    tl.to({}, { duration: 0.6 });
    // advantages = reward - mean -> bars grow from baseline
    tl.add(() => (phase.textContent = "Advantage = reward − mean   (above = good, below = bad)"));
    cols.forEach((_, i) => {
      const top = yR(REW[i]);
      const h = Math.abs(top - baseY);
      const y = Math.min(top, baseY);
      tl!.fromTo(advBar[i], { opacity: 1, attr: { y: baseY, height: 0 } }, { attr: { y, height: h }, duration: 0.5, ease: "power2.out" }, i === 0 ? ">" : "<");
      tl!.to(advLbl[i], { opacity: 1, attr: { y: ADV[i] >= 0 ? y - 8 : y + h + 16 }, duration: 0.4 }, "<");
    });
    tl.to({}, { duration: 0.7 });
    // update
    tl.add(() => (phase.textContent = "Push the winner up, the losers down — then repeat"));
    cols.forEach((_, i) => {
      const up = ADV[i] >= 0;
      tl!.fromTo(updArr[i], { opacity: 1, attr: { y1: 142, y2: 142 } }, { attr: { y1: up ? 156 : 128, y2: up ? 124 : 160 }, duration: 0.4, ease: "back.out(2)" }, i === 0 ? ">" : "<");
      tl!.to(updLbl[i], { opacity: 1, duration: 0.3 }, "<");
    });
  };

  return {
    play,
    pause: () => tl?.pause(),
    resume: () => tl?.play(),
    setRate: (r: number) => tl?.timeScale(r),
    cleanup: () => tl?.kill(),
  };
}

/* ===========================================================================
   4) LOAD BALANCER — round-robin distribution + health-check failover
=========================================================================== */
function setupLoadBalancer(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const CLIENT: [number, number] = [110, 235];
  const LB: [number, number] = [375, 236];
  const SX = 690, SW = 150, SH = 52;
  const sTop = [55, 160, 265, 370];
  const sCY = sTop.map((y) => y + SH / 2);   // [81,186,291,396]
  const SDOT_X = SX + SW / 2;                 // 765 (dot lands at server center x)

  // phase text
  const phase = mkText(svg, "", 460, 30, "viz-phase", "middle");

  // client cluster
  mkText(svg, "CLIENTS", CLIENT[0], CLIENT[1] - 46, "viz-label-sm", "middle");
  [-22, 0, 22].forEach((dy) => mk(svg, "circle", { cx: CLIENT[0], cy: CLIENT[1] + dy, r: 10, class: "viz-txt" }));

  // connectors: client -> LB, LB -> each server (drawn faint, under everything)
  mk(svg, "line", { x1: CLIENT[0] + 26, y1: CLIENT[1], x2: 300, y2: LB[1], class: "viz-thin" });
  const sLink = sCY.map((cy) =>
    mk(svg, "line", { x1: 450, y1: LB[1], x2: SX, y2: cy, class: "viz-thin" })
  );

  // load balancer box
  mk(svg, "rect", { x: 300, y: 200, width: 150, height: 72, rx: 8, class: "viz-box" });
  mkText(svg, "LOAD", 375, 230, "viz-node-lbl", "middle");
  mkText(svg, "BALANCER", 375, 248, "viz-node-lbl", "middle");

  // server boxes + labels + count chips + down indicators
  const sBox: Element[] = [], sDown: Element[] = [], sX1: Element[] = [], sX2: Element[] = [], sDownLbl: Element[] = [];
  const countText: Element[] = [];
  sTop.forEach((y, i) => {
    sBox.push(mk(svg, "rect", { x: SX, y, width: SW, height: SH, rx: 6, class: "viz-box" }));
    mkText(svg, `SERVER 0${i + 1}`, SDOT_X, y + SH / 2 + 4, "viz-node-lbl", "middle");
    // running count chip to the right
    const c = mkText(svg, "0", SX + SW + 18, y + SH / 2 + 5, "viz-num", "middle");
    countText.push(c);
    // down overlay (warn outline + ✕ + label), hidden initially
    sDown.push(mk(svg, "rect", { x: SX, y, width: SW, height: SH, rx: 6, class: "viz-warn", opacity: 0 }));
    sX1.push(mk(svg, "line", { x1: SX + 12, y1: y + 12, x2: SX + 32, y2: y + SH - 12, class: "viz-warn", opacity: 0 }));
    sX2.push(mk(svg, "line", { x1: SX + 12, y1: y + SH - 12, x2: SX + 32, y2: y + 12, class: "viz-warn", opacity: 0 }));
    const dl = mkText(svg, "DOWN", SX + SW + 18, y + SH / 2 + 5, "viz-warn-lbl", "middle");
    dl.setAttribute("opacity", "0");
    sDownLbl.push(dl);
  });
  mkText(svg, "handled", SX + SW + 18, sTop[0] - 14, "viz-label-sm", "middle");

  // request dots (one per request, used once)
  const TOTAL = 14;
  const dots: Element[] = [];
  for (let i = 0; i < TOTAL; i++)
    dots.push(mk(svg, "circle", { cx: 0, cy: 0, r: 5, class: "viz-bar-pos", opacity: 0 }));

  const counts = [0, 0, 0, 0];

  let tl: gsap.core.Timeline | null = null;
  const reset = () => {
    gsap.set(dots, { opacity: 0, x: CLIENT[0], y: CLIENT[1] });
    gsap.set([...sDown, ...sX1, ...sX2, ...sDownLbl], { opacity: 0 });
    gsap.set(sBox, { opacity: 1 });
    gsap.set(sLink, { opacity: 0.5 });
    counts.forEach((_, i) => { counts[i] = 0; countText[i].textContent = "0"; });
    countText.forEach((c) => gsap.set(c, { opacity: 1 }));
    phase.textContent = "";
  };
  gsap.set(dots, { x: CLIENT[0], y: CLIENT[1], opacity: 0 }); // build-time placement

  const sendReq = (i: number, s: number, t: number) => {
    const d = dots[i];
    tl!.set(d, { x: CLIENT[0], y: CLIENT[1], opacity: 0 }, t);
    tl!.to(d, { opacity: 1, duration: 0.12 }, t);
    tl!.to(d, { x: LB[0], y: LB[1], duration: 0.38, ease: "power1.in" }, t);
    tl!.to(d, { x: SDOT_X, y: sCY[s], duration: 0.5, ease: "power1.out" }, t + 0.38);
    tl!.to(d, { opacity: 0, duration: 0.14 }, t + 0.86);
    tl!.add(() => { counts[s]++; countText[s].textContent = String(counts[s]); }, t + 0.86);
    tl!.fromTo(sBox[s], { scale: 1, transformOrigin: "center" }, { scale: 1.06, duration: 0.14, yoyo: true, repeat: 1 }, t + 0.86);
  };

  const play = () => {
    tl?.kill();
    reset();
    tl = gsap.timeline();

    tl.add(() => (phase.textContent = "requests arrive at the load balancer"));
    tl.to({}, { duration: 0.3 });

    // PHASE: round robin across all 4
    tl.add(() => (phase.textContent = "round robin — each server gets an equal turn"));
    let t = tl.duration();
    const order1 = [0, 1, 2, 3, 0, 1, 2, 3];
    order1.forEach((s, k) => sendReq(k, s, t + k * 0.42));
    tl.to({}, { duration: 0.5 }, t + order1.length * 0.42 + 0.4);

    // PHASE: server 4 fails health check
    tl.add(() => (phase.textContent = "Server 04 fails its health check"));
    tl.to(sBox[3], { opacity: 0.28, duration: 0.4 });
    tl.to([sDown[3], sX1[3], sX2[3], sDownLbl[3]], { opacity: 1, duration: 0.4 }, "<");
    tl.to(countText[3], { opacity: 0.3, duration: 0.4 }, "<");
    tl.fromTo(sDown[3], { scale: 1, transformOrigin: "center" }, { scale: 1.08, duration: 0.2, yoyo: true, repeat: 3 }, "<");
    tl.to({}, { duration: 0.6 });

    // PHASE: drop from rotation, reroute
    tl.add(() => (phase.textContent = "dropped from rotation — traffic reroutes to the healthy three"));
    tl.to(sLink[3], { opacity: 0.1, duration: 0.4 });
    t = tl.duration();
    const order2 = [0, 1, 2, 0, 1, 2];
    order2.forEach((s, k) => sendReq(8 + k, s, t + k * 0.42));
    tl.to({}, { duration: 0.5 }, t + order2.length * 0.42 + 0.4);

    tl.add(() => (phase.textContent = "one server died — nobody noticed"));
  };

  return {
    play,
    pause: () => tl?.pause(),
    resume: () => tl?.play(),
    setRate: (r: number) => tl?.timeScale(r),
    cleanup: () => tl?.kill(),
  };
}

/* ===========================================================================
   5) LB ALGORITHMS — mode-tabbed: same fleet, five routing strategies
=========================================================================== */
function setupLbAlgorithms(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const clientCY = [110, 235, 360];
  const CL_X = 95;
  const LB: [number, number] = [405, 236];
  const SX = 720, SW = 150, SH = 54;
  const sTop = [48, 158, 268, 378];
  const sCY = sTop.map((y) => y + SH / 2); // [75,185,295,405]
  const SDOT_X = SX + SW / 2;              // 795

  const phase = mkText(svg, "", 470, 28, "viz-phase", "middle");

  // clients (A/B/C) with optional IP sublabels
  const ipLbl: Element[] = [];
  const clientNames = ["A", "B", "C"];
  const clientIPs = ["10.0.0.11", "10.0.0.27", "10.0.0.43"];
  clientCY.forEach((cy, i) => {
    mk(svg, "circle", { cx: CL_X, cy, r: 16, class: "viz-txt" });
    mkText(svg, clientNames[i], CL_X, cy + 4, "viz-node-lbl", "middle");
    const ip = mkText(svg, clientIPs[i], CL_X, cy + 34, "viz-label-sm", "middle");
    ip.setAttribute("opacity", "0");
    ipLbl.push(ip);
    mk(svg, "line", { x1: CL_X + 18, y1: cy, x2: 330, y2: LB[1], class: "viz-thin" });
  });
  mkText(svg, "CLIENTS", CL_X, clientCY[0] - 38, "viz-label-sm", "middle");

  // load balancer
  mk(svg, "rect", { x: 330, y: 200, width: 150, height: 72, rx: 8, class: "viz-box" });
  mkText(svg, "LOAD", 405, 230, "viz-node-lbl", "middle");
  mkText(svg, "BALANCER", 405, 248, "viz-node-lbl", "middle");

  // servers: box, name, stat line, count chip
  const sBox: Element[] = [], statTxt: Element[] = [], countText: Element[] = [];
  const sLink: Element[] = [];
  sTop.forEach((y, i) => {
    sLink.push(mk(svg, "line", { x1: 480, y1: LB[1], x2: SX, y2: sCY[i], class: "viz-thin" }));
    sBox.push(mk(svg, "rect", { x: SX, y, width: SW, height: SH, rx: 6, class: "viz-box" }));
    mkText(svg, `SERVER 0${i + 1}`, SDOT_X, y + 22, "viz-node-lbl", "middle");
    statTxt.push(mkText(svg, "", SDOT_X, y + 40, "viz-label-sm", "middle"));
    countText.push(mkText(svg, "0", SX + SW + 24, y + SH / 2 + 5, "viz-num", "middle"));
  });
  mkText(svg, "handled", SX + SW + 24, sTop[0] - 14, "viz-label-sm", "middle");

  // request dots
  const dots: Element[] = [];
  for (let i = 0; i < 8; i++) dots.push(mk(svg, "circle", { cx: 0, cy: 0, r: 5, class: "viz-bar-pos", opacity: 0 }));

  // ---- build honest routing plans per mode ----
  type Step = { from: number; to: number; stats: string[] };
  type Plan = { phase: string; initStats: string[]; showIP: boolean; steps: Step[] };

  const buildPlan = (m: string): Plan => {
    if (m === "wrr") {
      const w = ["w=1", "w=1", "w=2", "w=4"];
      const order = [3, 2, 3, 1, 3, 2, 3, 0];
      return { phase: "Weighted Round Robin — capacity weights set the share (w=4 takes 4×)", initStats: w, showIP: false, steps: order.map((to, i) => ({ from: i % 3, to, stats: w })) };
    }
    if (m === "lc") {
      const act = [5, 2, 8, 3];
      const steps: Step[] = [];
      for (let i = 0; i < 8; i++) {
        let to = 0; for (let s = 1; s < 4; s++) if (act[s] < act[to]) to = s;
        act[to]++;
        steps.push({ from: i % 3, to, stats: act.map((a) => `act ${a}`) });
      }
      return { phase: "Least Connections — each request goes to the fewest active now", initStats: [5, 2, 8, 3].map((a) => `act ${a}`), showIP: false, steps };
    }
    if (m === "lrt") {
      const ms = [120, 40, 200, 80];
      const steps: Step[] = [];
      for (let i = 0; i < 8; i++) {
        let to = 0; for (let s = 1; s < 4; s++) if (ms[s] < ms[to]) to = s;
        ms[to] += 30;
        steps.push({ from: i % 3, to, stats: ms.map((v) => `${v}ms`) });
      }
      return { phase: "Least Response Time — pick the fastest; load nudges latency up, so it spreads", initStats: [120, 40, 200, 80].map((v) => `${v}ms`), showIP: false, steps };
    }
    if (m === "iph") {
      // deterministic client -> server: A->S1, B->S4, C->S2
      const map = [0, 3, 1];
      const fires = [0, 1, 2, 0, 1, 2, 0, 1];
      return { phase: "IP Hash — same client IP deterministically maps to one server (sessions stick)", initStats: ["", "", "", ""], showIP: true, steps: fires.map((c) => ({ from: c, to: map[c], stats: ["", "", "", ""] })) };
    }
    // default: round robin
    const order = [0, 1, 2, 3, 0, 1, 2, 3];
    return { phase: "Round Robin — cycle through servers in fixed order, equal turns", initStats: ["", "", "", ""], showIP: false, steps: order.map((to, i) => ({ from: i % 3, to, stats: ["", "", "", ""] })) };
  };

  let mode = "rr";
  let tl: gsap.core.Timeline | null = null;
  const counts = [0, 0, 0, 0];

  const applyInit = (p: Plan) => {
    gsap.set(dots, { opacity: 0, x: CL_X, y: clientCY[0] });
    gsap.set(sLink, { opacity: 0.5 });
    counts.forEach((_, i) => { counts[i] = 0; countText[i].textContent = "0"; statTxt[i].textContent = p.initStats[i]; });
    ipLbl.forEach((ip) => gsap.set(ip, { opacity: p.showIP ? 0.85 : 0 }));
    phase.textContent = "";
  };

  applyInit(buildPlan(mode)); // build-time state

  const play = () => {
    tl?.kill();
    const p = buildPlan(mode);
    applyInit(p);
    tl = gsap.timeline();
    tl.add(() => (phase.textContent = p.phase));
    tl.to({}, { duration: 0.3 });

    const base = tl.duration();
    const GAP = 0.52;
    p.steps.forEach((step, k) => {
      const t = base + k * GAP;
      const d = dots[k];
      const fy = clientCY[step.from];
      tl!.set(d, { x: CL_X, y: fy, opacity: 0 }, t);
      tl!.to(d, { opacity: 1, duration: 0.12 }, t);
      tl!.to(d, { x: LB[0], y: LB[1], duration: 0.36, ease: "power1.in" }, t);
      tl!.to(d, { x: SDOT_X, y: sCY[step.to], duration: 0.5, ease: "power1.out" }, t + 0.36);
      tl!.to(d, { opacity: 0, duration: 0.14 }, t + 0.84);
      tl!.add(() => {
        counts[step.to]++; countText[step.to].textContent = String(counts[step.to]);
        step.stats.forEach((s, i) => (statTxt[i].textContent = s));
      }, t + 0.84);
      tl!.fromTo(sBox[step.to], { scale: 1, transformOrigin: "center" }, { scale: 1.06, duration: 0.14, yoyo: true, repeat: 1 }, t + 0.84);
    });
    tl.to({}, { duration: 0.5 });
  };

  return {
    play,
    pause: () => tl?.pause(),
    resume: () => tl?.play(),
    setRate: (r: number) => tl?.timeScale(r),
    cleanup: () => tl?.kill(),
    setMode: (m: string) => { mode = m; },
  };
}

/* ===========================================================================
   6) CONSISTENT HASHING — the ring: clockwise ownership + minimal remap
=========================================================================== */
function setupHashRing(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const cx = 380, cy = 300, R = 190;
  const pt = (deg: number, rad: number): [number, number] => {
    const th = (deg * Math.PI) / 180;
    return [cx + rad * Math.sin(th), cy - rad * Math.cos(th)];
  };

  const phase = mkText(svg, "", 380, 30, "viz-phase", "middle");

  // ring
  mk(svg, "circle", { cx, cy, r: R, class: "viz-stroke" });
  // top tick = hash 0 / 2^32 wrap point
  const [tx1, ty1] = pt(0, R - 9), [tx2, ty2] = pt(0, R + 9);
  mk(svg, "line", { x1: tx1, y1: ty1, x2: tx2, y2: ty2, class: "viz-stroke" });
  mkText(svg, "0 / 2³²", cx, cy - R - 18, "viz-label-sm", "middle");
  mkText(svg, "↻ clockwise", cx + 70, cy - R - 18, "viz-label-sm", "start");

  // servers
  const srvAng = [20, 95, 165, 230, 300];
  const srvName = ["S1", "S2", "S3", "S4", "S5"];
  const srvBase: Element[] = [], srvWarn: Element[] = [], srvG: SVGGElement[] = [];
  srvAng.forEach((a, i) => {
    const [x, y] = pt(a, R);
    const g = mk(svg, "g") as SVGGElement;
    gsap.set(g, { x, y });
    srvBase.push(mk(g, "circle", { cx: 0, cy: 0, r: 20, class: "viz-img" }));
    srvWarn.push(mk(g, "circle", { cx: 0, cy: 0, r: 20, class: "viz-warn", opacity: 0 }));
    mkText(g, srvName[i], 0, 5, "viz-node-lbl", "middle");
    srvG.push(g);
  });

  // keys: each owned by first server clockwise
  const keys = [
    { name: "K1", ang: 50, srv: 1 },
    { name: "K2", ang: 130, srv: 2 },
    { name: "K3", ang: 200, srv: 3 },
    { name: "K4", ang: 270, srv: 4 },
    { name: "K5", ang: 340, srv: 0 },
  ];
  const keyDot: Element[] = [], keyLbl: Element[] = [], chord: Element[] = [];
  keys.forEach((k) => {
    const [x, y] = pt(k.ang, R);
    const [lx, ly] = pt(k.ang, R + 28);
    keyDot.push(mk(svg, "circle", { cx: x, cy: y, r: 6, class: "viz-txt", opacity: 0 }));
    keyLbl.push(mkText(svg, k.name, lx, ly + 4, "viz-label-sm", "middle"));
    keyLbl[keyLbl.length - 1].setAttribute("opacity", "0");
    chord.push(mk(svg, "line", { x1: x, y1: y, x2: x, y2: y, class: "viz-pull", opacity: 0 }));
  });

  // shared walker dot
  const walker = mk(svg, "circle", { cx: 0, cy: 0, r: 7, class: "viz-bar-pos", opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const reset = () => {
    gsap.set([...keyDot, ...keyLbl, ...chord, walker], { opacity: 0 });
    gsap.set(srvG, { opacity: 0, scale: 0.7, transformOrigin: "center" });
    gsap.set(srvWarn, { opacity: 0 });
    keys.forEach((k, i) => {
      const [x, y] = pt(k.ang, R);
      gsap.set(chord[i], { attr: { x1: x, y1: y, x2: x, y2: y } });
    });
    phase.textContent = "";
  };
  // build-time: servers visible, keys hidden (no flash)
  gsap.set([...keyDot, ...keyLbl, ...chord, walker], { opacity: 0 });
  gsap.set(srvG, { opacity: 1, scale: 1, transformOrigin: "center" });

  // walk the shared walker clockwise from startAng to endAng, then settle
  const walk = (t: number, startAng: number, endAng: number, srv: number, ki: number) => {
    const proxy = { a: startAng };
    const [sx, sy] = pt(startAng, R);
    tl!.set(walker, { x: 0, y: 0, opacity: 0 }, t);
    tl!.set(proxy, { a: startAng }, t);
    tl!.add(() => gsap.set(walker, { attr: { cx: sx, cy: sy } }), t);
    tl!.to(walker, { opacity: 1, duration: 0.12 }, t);
    tl!.to(proxy, {
      a: endAng, duration: 0.9, ease: "power1.inOut",
      onUpdate: () => { const [wx, wy] = pt(proxy.a, R); gsap.set(walker, { attr: { cx: wx, cy: wy } }); },
    }, t);
    // pulse coordinator + draw ownership chord + park
    tl!.add(() => {
      const [kx, ky] = pt(keys[ki].ang, R);
      const [vx, vy] = pt(srvAng[srv], R);
      gsap.set(chord[ki], { attr: { x1: kx, y1: ky, x2: vx, y2: vy } });
    }, t + 0.9);
    tl!.to(chord[ki], { opacity: 0.7, duration: 0.3 }, t + 0.9);
    tl!.fromTo(srvBase[srv], { scale: 1, transformOrigin: "center" }, { scale: 1.18, duration: 0.16, yoyo: true, repeat: 1 }, t + 0.9);
    tl!.to(walker, { opacity: 0, duration: 0.2 }, t + 1.15);
  };

  const play = () => {
    tl?.kill();
    reset();
    tl = gsap.timeline();

    // PHASE 1: the ring
    tl.add(() => (phase.textContent = "one circular hash space — servers land at their tokens"));
    tl.to(srvG, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.12, ease: "back.out(1.7)" });
    tl.to({}, { duration: 0.4 });

    // PHASE 2: ownership by clockwise walk
    tl.add(() => (phase.textContent = "each key is owned by the first server clockwise"));
    keys.forEach((k, i) => {
      const t = tl!.duration();
      let end = srvAng[k.srv];
      if (end <= k.ang) end += 360; // wrap (K5 → S1)
      tl!.to([keyDot[i], keyLbl[i]], { opacity: 1, duration: 0.25 }, t);
      walk(t + 0.2, k.ang, end, k.srv, i);
    });
    tl.to({}, { duration: 0.6 });

    // PHASE 3: a node leaves — minimal remap
    tl.add(() => (phase.textContent = "S4 leaves — only its keys move, to the clockwise successor"));
    tl.fromTo(srvWarn[3], { opacity: 0, scale: 1, transformOrigin: "center" }, { opacity: 1, scale: 1.25, duration: 0.25, yoyo: true, repeat: 3 });
    tl.to(chord[2], { opacity: 0, duration: 0.3 }, "<"); // K3's old ownership of S4 fades
    tl.to(srvG[3], { opacity: 0.18, duration: 0.4 });
    // K3 re-walks clockwise past the gap to S5
    {
      const t = tl.duration() + 0.1;
      let end = srvAng[4]; // S5 = 300
      walk(t, keys[2].ang, end, 4, 2);
    }
    tl.to({}, { duration: 0.5 });
    tl.add(() => (phase.textContent = "every other key stayed put — only ~1/N moved"));
  };

  return {
    play,
    pause: () => tl?.pause(),
    resume: () => tl?.play(),
    setRate: (r: number) => tl?.timeScale(r),
    cleanup: () => tl?.kill(),
  };
}

/* ===========================================================================
   Exported components
=========================================================================== */
export const PullPushDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 760 360" maxW="max-w-2xl" delay={delay} setup={setupPullPush} />
);

export const ContrastiveTrainingDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 980 540" maxW="max-w-3xl" delay={delay} setup={setupTraining} />
);

export const GrpoAdvantageDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 540" maxW="max-w-3xl" delay={delay} setup={setupGrpoAdvantage} />
);

export const LoadBalancerDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 920 450" maxW="max-w-3xl" delay={delay} setup={setupLoadBalancer} />
);

export const HashRingDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 760 560" maxW="max-w-xl" delay={delay} setup={setupHashRing} />
);

export const LbAlgorithmsDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure
    caption={caption}
    viewBox="0 0 940 450"
    maxW="max-w-3xl"
    delay={delay}
    setup={setupLbAlgorithms}
    modes={[
      { key: "rr", label: "Round Robin" },
      { key: "wrr", label: "Weighted" },
      { key: "lc", label: "Least Conn" },
      { key: "lrt", label: "Least Resp" },
      { key: "iph", label: "IP Hash" },
    ]}
  />
);
