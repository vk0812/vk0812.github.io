import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animations for the system design case studies.
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
   HASH COLLISION — why truncating a hash isn't safe on its own
   Real hash: FNV-1a (32-bit) -> base62. Two real, different strings computed
   live below happen to share their first two encoded characters, an actual
   collision, not a staged one, verified offline before wiring this up.
=========================================================================== */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
const B62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function toBase62(n: number, len: number): string {
  let s = "";
  let x = n;
  for (let i = 0; i < len; i++) {
    s = B62[x % 62] + s;
    x = Math.floor(x / 62);
  }
  return s;
}

function setupHashCollision(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const URL_A = "myapp.com/posts/billing";
  const URL_B = "myapp.com/posts/api";
  const keyA = toBase62(fnv1a(URL_A), 6);
  const keyB = toBase62(fnv1a(URL_B), 6);
  const SHORT_LEN = 2; // shrunk on purpose so the collision shows up fast; same math at 6

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `hc-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 28, "viz-phase", "middle");

  const lanes = [
    { x: 230, url: URL_A, key: keyA },
    { x: 670, url: URL_B, key: keyB },
  ];

  type Lane = {
    urlText: SVGTextElement;
    arrow1: SVGLineElement; len1: number;
    hashBox: SVGRectElement; hashLbl: SVGTextElement;
    arrow2: SVGLineElement; len2: number;
    headSpan: SVGTSpanElement; tailSpan: SVGTSpanElement;
    arrow3: SVGLineElement; len3: number;
    shortBox: SVGRectElement; shortRing: SVGRectElement; shortLbl: SVGTextElement;
  };

  const laneEls: Lane[] = lanes.map(({ x, url, key }) => {
    const urlText = mkText(svg, url, x, 60, "viz-label", "middle") as SVGTextElement;

    const arrow1 = mk(svg, "line", {
      x1: x, y1: 72, x2: x, y2: 138, class: "viz-stroke",
      "marker-end": `url(#hc-${uid})`, opacity: 0,
    }) as SVGLineElement;
    const len1 = 66;
    arrow1.style.strokeDasharray = String(len1);

    const hashBox = mk(svg, "rect", {
      x: x - 70, y: 140, width: 140, height: 56, rx: 8, class: "viz-box", opacity: 0,
    }) as SVGRectElement;
    const hashLbl = mkText(svg, "FNV-1a", x, 173, "viz-node-lbl", "middle") as SVGTextElement;
    gsap.set(hashLbl, { opacity: 0 });

    const arrow2 = mk(svg, "line", {
      x1: x, y1: 196, x2: x, y2: 258, class: "viz-stroke",
      "marker-end": `url(#hc-${uid})`, opacity: 0,
    }) as SVGLineElement;
    const len2 = 62;
    arrow2.style.strokeDasharray = String(len2);

    const fullKeyEl = mk(svg, "text", { x, y: 278, class: "viz-label", "text-anchor": "middle" });
    const headSpan = mk(fullKeyEl, "tspan", { class: "viz-node-lbl" }) as SVGTSpanElement;
    headSpan.textContent = key.slice(0, SHORT_LEN);
    const tailSpan = mk(fullKeyEl, "tspan", { class: "viz-label-sm" }) as SVGTSpanElement;
    tailSpan.textContent = key.slice(SHORT_LEN);
    gsap.set(fullKeyEl, { opacity: 0 });

    const arrow3 = mk(svg, "line", {
      x1: x, y1: 292, x2: x, y2: 338, class: "viz-stroke",
      "marker-end": `url(#hc-${uid})`, opacity: 0,
    }) as SVGLineElement;
    const len3 = 46;
    arrow3.style.strokeDasharray = String(len3);

    const shortRing = mk(svg, "rect", {
      x: x - 41, y: 335, width: 82, height: 56, rx: 12, class: "viz-warn", fill: "none", opacity: 0,
    }) as SVGRectElement;
    const shortBox = mk(svg, "rect", {
      x: x - 35, y: 340, width: 70, height: 46, rx: 8, class: "viz-panel", opacity: 0,
    }) as SVGRectElement;
    const shortLbl = mkText(svg, key.slice(0, SHORT_LEN), x, 370, "viz-phase", "middle") as SVGTextElement;
    gsap.set(shortLbl, { opacity: 0 });

    return { urlText, arrow1, len1, hashBox, hashLbl, arrow2, len2, headSpan, tailSpan, arrow3, len3, shortBox, shortRing, shortLbl };
  });

  const collideLine = mk(svg, "line", {
    x1: lanes[0].x + 41, y1: 363, x2: lanes[1].x - 41, y2: 363,
    class: "viz-warn", opacity: 0,
  }) as SVGLineElement;
  const collideLen = lanes[1].x - 41 - (lanes[0].x + 41);
  collideLine.style.strokeDasharray = String(collideLen);
  const collideLbl = mkText(svg, "SAME PREFIX -> COLLISION", 450, 340, "viz-warn-lbl", "middle") as SVGTextElement;
  gsap.set(collideLbl, { opacity: 0 });

  gsap.set([laneEls[0].urlText, laneEls[1].urlText], { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([laneEls[0].urlText, laneEls[1].urlText], { opacity: 0 });
    laneEls.forEach((l) => {
      gsap.set([l.arrow1, l.arrow2, l.arrow3], { opacity: 0 });
      l.arrow1.style.strokeDashoffset = String(l.len1);
      l.arrow2.style.strokeDashoffset = String(l.len2);
      l.arrow3.style.strokeDashoffset = String(l.len3);
      gsap.set([l.hashBox, l.hashLbl], { opacity: 0 });
      gsap.set(l.headSpan.parentElement!, { opacity: 0 });
      gsap.set([l.shortBox, l.shortRing, l.shortLbl], { opacity: 0 });
      gsap.set(l.tailSpan, { opacity: 1 });
    });
    collideLine.style.strokeDashoffset = String(collideLen);
    gsap.set(collideLine, { opacity: 0 });
    gsap.set(collideLbl, { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Two different URLs come in"; });
    tl.to([laneEls[0].urlText, laneEls[1].urlText], { opacity: 1, duration: 0.35, stagger: 0.1 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Both run through the same hash function"; });
    laneEls.forEach((l, i) => {
      tl.to(l.arrow1, { opacity: 1, duration: 0.05 }, i === 0 ? "<" : "<0.1");
      tl.to(l.arrow1, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
      tl.to([l.hashBox, l.hashLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    });
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Each produces a full-length key"; });
    laneEls.forEach((l, i) => {
      tl.to(l.arrow2, { opacity: 1, duration: 0.05 }, i === 0 ? "<" : "<0.1");
      tl.to(l.arrow2, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
      tl.to(l.headSpan.parentElement!, { opacity: 1, duration: 0.3 }, "<0.1");
    });
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "But the short link only shows the first two characters"; });
    laneEls.forEach((l, i) => {
      tl.to(l.tailSpan, { opacity: 0.25, duration: 0.35 }, i === 0 ? "<" : "<0.05");
      tl.to(l.arrow3, { opacity: 1, duration: 0.05 }, "<");
      tl.to(l.arrow3, { strokeDashoffset: 0, duration: 0.25, ease: "none" }, "<");
      tl.to([l.shortBox, l.shortLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    });
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Same prefix, different URLs, this is a collision"; });
    tl.to([laneEls[0].shortRing, laneEls[1].shortRing], { opacity: 1, duration: 0.3 }, "<");
    tl.to(collideLine, { opacity: 1, duration: 0.05 }, "<");
    tl.to(collideLine, { strokeDashoffset: 0, duration: 0.4, ease: "none" }, "<");
    tl.to(collideLbl, { opacity: 1, duration: 0.3 }, "<0.2");
    tl.to([laneEls[0].shortRing, laneEls[1].shortRing], { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 3 });

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

export const HashCollisionDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 400" maxW="max-w-2xl" delay={delay} setup={setupHashCollision} />
);

/* ===========================================================================
   KEY HANDOFF — why the Key Generation Service can hand out keys to many
   concurrent callers without ever handing out the same one twice.
=========================================================================== */
function setupKeyHandoff(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const KEY_A = "aB3xQ9";
  const KEY_B = "P0qR7z";

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `kh-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 28, "viz-phase", "middle");

  const lanes = [
    { x: 230, server: "Server A", key: KEY_A },
    { x: 670, server: "Server B", key: KEY_B },
  ];

  type Lane = {
    serverText: SVGTextElement;
    arrow1: SVGLineElement; len1: number;
    kgsBox: SVGRectElement; kgsLbl: SVGTextElement;
    arrow2: SVGLineElement; len2: number;
    keyLbl: SVGTextElement;
    arrow3: SVGLineElement; len3: number;
    usedBox: SVGRectElement; usedRing: SVGRectElement; usedLbl: SVGTextElement;
  };

  const laneEls: Lane[] = lanes.map(({ x, server, key }) => {
    const serverText = mkText(svg, server, x, 60, "viz-label", "middle") as SVGTextElement;

    const arrow1 = mk(svg, "line", {
      x1: x, y1: 72, x2: x, y2: 138, class: "viz-stroke",
      "marker-end": `url(#kh-${uid})`, opacity: 0,
    }) as SVGLineElement;
    const len1 = 66;
    arrow1.style.strokeDasharray = String(len1);

    const kgsBox = mk(svg, "rect", {
      x: x - 80, y: 140, width: 160, height: 56, rx: 8, class: "viz-box", opacity: 0,
    }) as SVGRectElement;
    const kgsLbl = mkText(svg, "Key Generation Service", x, 173, "viz-node-lbl", "middle") as SVGTextElement;
    gsap.set(kgsLbl, { opacity: 0 });

    const arrow2 = mk(svg, "line", {
      x1: x, y1: 196, x2: x, y2: 258, class: "viz-stroke",
      "marker-end": `url(#kh-${uid})`, opacity: 0,
    }) as SVGLineElement;
    const len2 = 62;
    arrow2.style.strokeDasharray = String(len2);

    const keyLbl = mkText(svg, key, x, 278, "viz-node-lbl", "middle") as SVGTextElement;
    gsap.set(keyLbl, { opacity: 0 });

    const arrow3 = mk(svg, "line", {
      x1: x, y1: 292, x2: x, y2: 338, class: "viz-stroke",
      "marker-end": `url(#kh-${uid})`, opacity: 0,
    }) as SVGLineElement;
    const len3 = 46;
    arrow3.style.strokeDasharray = String(len3);

    const usedRing = mk(svg, "rect", {
      x: x - 51, y: 335, width: 102, height: 56, rx: 12, class: "viz-blue", fill: "none", opacity: 0,
    }) as SVGRectElement;
    const usedBox = mk(svg, "rect", {
      x: x - 45, y: 340, width: 90, height: 46, rx: 8, class: "viz-panel", opacity: 0,
    }) as SVGRectElement;
    const usedLbl = mkText(svg, "marked used", x, 368, "viz-label-sm", "middle") as SVGTextElement;
    gsap.set(usedLbl, { opacity: 0 });

    return { serverText, arrow1, len1, kgsBox, kgsLbl, arrow2, len2, keyLbl, arrow3, len3, usedBox, usedRing, usedLbl };
  });

  const okLine = mk(svg, "line", {
    x1: lanes[0].x + 51, y1: 363, x2: lanes[1].x - 51, y2: 363,
    class: "viz-blue", opacity: 0,
  }) as SVGLineElement;
  const okLen = lanes[1].x - 51 - (lanes[0].x + 51);
  okLine.style.strokeDasharray = String(okLen);
  const okLbl = mkText(svg, "DIFFERENT KEYS, NO COLLISION", 450, 340, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(okLbl, { opacity: 0 });

  gsap.set([laneEls[0].serverText, laneEls[1].serverText], { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([laneEls[0].serverText, laneEls[1].serverText], { opacity: 0 });
    laneEls.forEach((l) => {
      gsap.set([l.arrow1, l.arrow2, l.arrow3], { opacity: 0 });
      l.arrow1.style.strokeDashoffset = String(l.len1);
      l.arrow2.style.strokeDashoffset = String(l.len2);
      l.arrow3.style.strokeDashoffset = String(l.len3);
      gsap.set([l.kgsBox, l.kgsLbl], { opacity: 0 });
      gsap.set(l.keyLbl, { opacity: 0 });
      gsap.set([l.usedBox, l.usedRing, l.usedLbl], { opacity: 0 });
    });
    okLine.style.strokeDashoffset = String(okLen);
    gsap.set(okLine, { opacity: 0 });
    gsap.set(okLbl, { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Two servers ask for a key at the same moment"; });
    tl.to([laneEls[0].serverText, laneEls[1].serverText], { opacity: 1, duration: 0.35, stagger: 0.1 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Both requests reach the Key Generation Service"; });
    laneEls.forEach((l, i) => {
      tl.to(l.arrow1, { opacity: 1, duration: 0.05 }, i === 0 ? "<" : "<0.1");
      tl.to(l.arrow1, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
      tl.to([l.kgsBox, l.kgsLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    });
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "It hands each of them a different key from its in memory batch"; });
    laneEls.forEach((l, i) => {
      tl.to(l.arrow2, { opacity: 1, duration: 0.05 }, i === 0 ? "<" : "<0.1");
      tl.to(l.arrow2, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
      tl.to(l.keyLbl, { opacity: 1, duration: 0.3 }, "<0.1");
    });
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "That key is marked used before it ever reaches the server"; });
    laneEls.forEach((l, i) => {
      tl.to(l.arrow3, { opacity: 1, duration: 0.05 }, i === 0 ? "<" : "<0.1");
      tl.to(l.arrow3, { strokeDashoffset: 0, duration: 0.25, ease: "none" }, "<");
      tl.to([l.usedBox, l.usedLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    });
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Two different keys handed out safely, no duplicate possible"; });
    tl.to([laneEls[0].usedRing, laneEls[1].usedRing], { opacity: 1, duration: 0.3 }, "<");
    tl.to(okLine, { opacity: 1, duration: 0.05 }, "<");
    tl.to(okLine, { strokeDashoffset: 0, duration: 0.4, ease: "none" }, "<");
    tl.to(okLbl, { opacity: 1, duration: 0.3 }, "<0.2");

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

export const KeyHandoffDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 400" maxW="max-w-2xl" delay={delay} setup={setupKeyHandoff} />
);

/* ===========================================================================
   CACHE FLOW — the Redirection Service checks cache first, a hit returns
   immediately, a miss falls through to the URL database and back-fills
   the cache before answering.
=========================================================================== */
function setupCacheFlow(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `cf-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 24, "viz-phase", "middle");

  mk(svg, "rect", { x: 360, y: 40, width: 180, height: 50, rx: 8, class: "viz-box" });
  mkText(svg, "Redirection Service", 450, 70, "viz-node-lbl", "middle");

  const arrow1 = mk(svg, "line", {
    x1: 450, y1: 90, x2: 450, y2: 148, class: "viz-stroke", "marker-end": `url(#cf-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const len1 = 58;
  arrow1.style.strokeDasharray = String(len1);

  const cacheBox = mk(svg, "rect", { x: 370, y: 150, width: 160, height: 50, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const cacheLbl = mkText(svg, "Cache", 450, 180, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(cacheLbl, { opacity: 0 });

  const arrowHit = mk(svg, "line", {
    x1: 410, y1: 200, x2: 290, y2: 258, class: "viz-blue", "marker-end": `url(#cf-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenHit = Math.hypot(410 - 290, 258 - 200);
  arrowHit.style.strokeDasharray = String(lenHit);

  const hitBox = mk(svg, "rect", { x: 190, y: 260, width: 200, height: 60, rx: 8, class: "viz-panel", opacity: 0 }) as SVGRectElement;
  const hitRing = mk(svg, "rect", { x: 184, y: 254, width: 212, height: 72, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const hitLbl1 = mkText(svg, "Cache hit", 290, 282, "viz-node-lbl", "middle") as SVGTextElement;
  const hitLbl2 = mkText(svg, "return redirect right away", 290, 300, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([hitLbl1, hitLbl2], { opacity: 0 });

  const arrowMiss = mk(svg, "line", {
    x1: 490, y1: 200, x2: 610, y2: 258, class: "viz-blue", "marker-end": `url(#cf-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenMiss = Math.hypot(610 - 490, 258 - 200);
  arrowMiss.style.strokeDasharray = String(lenMiss);

  const missBox = mk(svg, "rect", { x: 510, y: 260, width: 200, height: 50, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const missLbl = mkText(svg, "URL Database", 610, 290, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(missLbl, { opacity: 0 });

  const arrow2 = mk(svg, "line", {
    x1: 610, y1: 310, x2: 610, y2: 358, class: "viz-stroke", "marker-end": `url(#cf-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const len2 = 48;
  arrow2.style.strokeDasharray = String(len2);

  const returnBox = mk(svg, "rect", { x: 500, y: 360, width: 220, height: 60, rx: 8, class: "viz-panel", opacity: 0 }) as SVGRectElement;
  const returnRing = mk(svg, "rect", { x: 494, y: 354, width: 232, height: 72, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const returnLbl1 = mkText(svg, "Populate cache", 610, 382, "viz-node-lbl", "middle") as SVGTextElement;
  const returnLbl2 = mkText(svg, "then return redirect", 610, 400, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([returnLbl1, returnLbl2], { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([arrow1, cacheBox, cacheLbl, arrowHit, hitBox, hitRing, hitLbl1, hitLbl2, arrowMiss, missBox, missLbl, arrow2, returnBox, returnRing, returnLbl1, returnLbl2], { opacity: 0 });
    arrow1.style.strokeDashoffset = String(len1);
    arrowHit.style.strokeDashoffset = String(lenHit);
    arrowMiss.style.strokeDashoffset = String(lenMiss);
    arrow2.style.strokeDashoffset = String(len2);

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "A request comes in to resolve a short link"; });
    tl.to({}, { duration: 0.35 });

    tl.add(() => { phase.textContent = "The Redirection Service checks the cache first"; });
    tl.to(arrow1, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow1, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([cacheBox, cacheLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "On a hit, it returns the redirect right away"; });
    tl.to(arrowHit, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowHit, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([hitBox, hitLbl1, hitLbl2], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(hitRing, { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "On a miss, it falls through to the URL database"; });
    tl.to(arrowMiss, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowMiss, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([missBox, missLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "The result gets written into the cache, then the redirect goes out"; });
    tl.to(arrow2, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow2, { strokeDashoffset: 0, duration: 0.25, ease: "none" }, "<");
    tl.to([returnBox, returnLbl1, returnLbl2], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(returnRing, { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to(returnRing, { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });

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

export const CacheFlowDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 440" maxW="max-w-2xl" delay={delay} setup={setupCacheFlow} />
);
