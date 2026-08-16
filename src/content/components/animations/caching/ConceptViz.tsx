import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animation for "Caching". Same shell as
   animations/url-shortener/ConceptViz.tsx, theme comes entirely from CSS
   vars (.viz / .dark .viz in index.css), plays once when scrolled into view.
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
   LRU EVICTION — a four-slot cache holds keys A, B, C, D ordered from least
   to most recently used, left to right. Reading B slides it to the
   most-recently-used end. When a new key E arrives with the cache full, the
   entry sitting at the least-recently-used end (now A) gets evicted, and
   everything else shifts down to make room. Motion is the whole point here,
   an LRU cache is defined by what moves on access and what falls off on
   overflow, not by a static snapshot.
=========================================================================== */
const SLOT_X = [219, 373, 527, 681];
const ROW_Y = 170;
const BOX_W = 130;
const BOX_H = 80;
const STAGE_X = 820;

function setupLruEviction(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const phase = mkText(svg, "", 450, 28, "viz-phase", "middle");

  // static slot outlines, purely decorative background
  SLOT_X.forEach((x) => {
    mk(svg, "rect", {
      x: x - BOX_W / 2, y: ROW_Y, width: BOX_W, height: BOX_H, rx: 8,
      class: "viz-thin",
    });
  });

  mkText(svg, "LRU END", SLOT_X[0], 132, "viz-label-sm", "middle");
  mkText(svg, "MRU END", SLOT_X[3], 132, "viz-label-sm", "middle");

  type Item = {
    key: string;
    group: SVGGElement;
    ring: SVGRectElement;
  };

  function makeItem(key: string, x: number, visible: boolean): Item {
    const group = mk(svg, "g", { transform: `translate(${x}, 0)` }) as SVGGElement;
    const ring = mk(group, "rect", {
      x: -BOX_W / 2 - 6, y: ROW_Y - 6, width: BOX_W + 12, height: BOX_H + 12, rx: 12,
      class: "viz-blue", fill: "none", opacity: 0,
    }) as SVGRectElement;
    mk(group, "rect", {
      x: -BOX_W / 2, y: ROW_Y, width: BOX_W, height: BOX_H, rx: 8, class: "viz-box",
    });
    mkText(group, key, 0, ROW_Y + BOX_H / 2 + 7, "viz-node-lbl", "middle").setAttribute(
      "style", "font-size:22px; font-weight:700"
    );
    if (!visible) gsap.set(group, { opacity: 0 });
    return { key, group, ring };
  }

  const itemA = makeItem("A", SLOT_X[0], true);
  const itemB = makeItem("B", SLOT_X[1], true);
  const itemC = makeItem("C", SLOT_X[2], true);
  const itemD = makeItem("D", SLOT_X[3], true);
  const itemE = makeItem("E", STAGE_X, false);

  const newKeyLbl = mkText(svg, "new key arrives", STAGE_X, 125, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set(newKeyLbl, { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";

    // transforms are driven entirely through setAttribute (see onUpdate
    // below), gsap only ever touches opacity on these groups, mixing gsap's
    // own x/y transform cache with manual setAttribute calls on the same
    // element causes the two to fight on replay
    itemA.group.setAttribute("transform", `translate(${SLOT_X[0]}, 0)`);
    itemB.group.setAttribute("transform", `translate(${SLOT_X[1]}, 0)`);
    itemC.group.setAttribute("transform", `translate(${SLOT_X[2]}, 0)`);
    itemD.group.setAttribute("transform", `translate(${SLOT_X[3]}, 0)`);
    itemE.group.setAttribute("transform", `translate(${STAGE_X}, 0)`);
    gsap.set(itemA.group, { opacity: 1 });
    gsap.set(itemB.group, { opacity: 1 });
    gsap.set(itemC.group, { opacity: 1 });
    gsap.set(itemD.group, { opacity: 1 });
    gsap.set(itemE.group, { opacity: 0 });
    [itemA, itemB, itemC, itemD, itemE].forEach((it) => {
      it.ring.setAttribute("class", "viz-blue");
      gsap.set(it.ring, { opacity: 0 });
    });
    gsap.set(newKeyLbl, { opacity: 0 });
    // gsap can't tween an SVG <g> transform attribute directly, so track the
    // slot x for each key in a plain object and re-apply it via onUpdate
    const gState = { A: SLOT_X[0], B: SLOT_X[1], C: SLOT_X[2], D: SLOT_X[3], E: STAGE_X };

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Four keys sit in the cache, ordered from least to most recently used"; });
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Key B gets read again, so it slides to the most-recently-used end"; });
    tl.to(itemB.ring, { opacity: 1, duration: 0.25 }, "<");
    tl.to(gState, { B: SLOT_X[3], C: SLOT_X[1], D: SLOT_X[2], duration: 0.6, ease: "power2.inOut",
      onUpdate: () => {
        itemB.group.setAttribute("transform", `translate(${gState.B}, 0)`);
        itemC.group.setAttribute("transform", `translate(${gState.C}, 0)`);
        itemD.group.setAttribute("transform", `translate(${gState.D}, 0)`);
      } }, "<0.1");
    tl.to(itemB.ring, { opacity: 0, duration: 0.4 }, ">-0.1");
    tl.to({}, { duration: 0.3 });

    tl.add(() => { phase.textContent = "The cache is full and a new key, E, shows up"; });
    tl.to(newKeyLbl, { opacity: 1, duration: 0.3 }, "<");
    tl.to(itemE.group, { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "The least recently used key gets evicted to make room"; });
    tl.add(() => { itemA.ring.setAttribute("class", "viz-warn"); });
    tl.to(itemA.ring, { opacity: 1, duration: 0.25 }, "<");
    tl.to(itemA.group, { opacity: 0, duration: 0.5 }, "<0.3");
    tl.to(newKeyLbl, { opacity: 0, duration: 0.3 }, "<");
    tl.to(gState, {
      C: SLOT_X[0], D: SLOT_X[1], B: SLOT_X[2], E: SLOT_X[3], duration: 0.6, ease: "power2.inOut",
      onUpdate: () => {
        itemC.group.setAttribute("transform", `translate(${gState.C}, 0)`);
        itemD.group.setAttribute("transform", `translate(${gState.D}, 0)`);
        itemB.group.setAttribute("transform", `translate(${gState.B}, 0)`);
        itemE.group.setAttribute("transform", `translate(${gState.E}, 0)`);
      },
    }, "<0.2");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "E takes the newest slot, C is next in line if the cache fills up again"; });
    tl.to(itemE.ring, { opacity: 1, duration: 0.3 }, "<");
    tl.add(() => { itemC.ring.setAttribute("class", "viz-warn"); });
    tl.to(itemC.ring, { opacity: 1, duration: 0.3 }, "<");
    tl.to([itemE.ring, itemC.ring], { opacity: 0.25, duration: 0.6, yoyo: true, repeat: 3 });

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

export const LruEvictionDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 320" maxW="max-w-2xl" delay={delay} setup={setupLruEviction} />
);
