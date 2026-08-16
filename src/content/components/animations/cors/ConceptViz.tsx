import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animation for "Cross-Origin Resource Sharing". Same shell
   as animations/url-shortener/ConceptViz.tsx, theme comes entirely from CSS
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
   PREFLIGHT ROUND TRIP — a sequence-diagram style animation of a complex
   request. The browser sends an OPTIONS preflight, the server answers with
   the methods and headers it allows, and only then does the real request
   (and its response) go out.
=========================================================================== */
function setupPreflightRoundTrip(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const markerRight = mk(defs, "marker", {
    id: `pf-r-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(markerRight, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });
  const markerLeft = mk(defs, "marker", {
    id: `pf-l-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(markerLeft, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-blue" });

  const phase = mkText(svg, "", 450, 26, "viz-phase", "middle");

  const BX = 180, SX = 720;

  const browserBox = mk(svg, "rect", { x: 100, y: 58, width: 160, height: 56, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const browserLbl = mkText(svg, "Browser", BX, 91, "viz-node-lbl", "middle") as SVGTextElement;
  const serverBox = mk(svg, "rect", { x: 640, y: 58, width: 160, height: 56, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const serverLbl = mkText(svg, "Server", SX, 91, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set([browserLbl, serverLbl], { opacity: 0 });

  const lifelineBrowser = mk(svg, "line", { x1: BX, y1: 114, x2: BX, y2: 440, class: "viz-thin", opacity: 0 }) as SVGLineElement;
  const lifelineServer = mk(svg, "line", { x1: SX, y1: 114, x2: SX, y2: 440, class: "viz-thin", opacity: 0 }) as SVGLineElement;

  const rowLen = SX - BX;

  function arrowRow(y: number, dir: "right" | "left", labelStr: string) {
    const [x1, x2] = dir === "right" ? [BX, SX] : [SX, BX];
    const line = mk(svg, "line", {
      x1, y1: y, x2, y2: y,
      class: dir === "right" ? "viz-stroke" : "viz-blue",
      "marker-end": `url(#${dir === "right" ? `pf-r-${uid}` : `pf-l-${uid}`})`,
      opacity: 0,
    }) as SVGLineElement;
    line.style.strokeDasharray = String(rowLen);
    const label = mkText(svg, labelStr, 450, y - 28, "viz-label-sm", "middle") as SVGTextElement;
    gsap.set(label, { opacity: 0 });
    return { line, label };
  }

  const row1 = arrowRow(178, "right", "OPTIONS /resource");
  const row2 = arrowRow(258, "left", "Access-Control-Allow-*");
  const row3 = arrowRow(338, "right", "PUT /resource");
  const row4 = arrowRow(418, "left", "200 OK response");
  const rows = [row1, row2, row3, row4];

  const ringBrowser = mk(svg, "rect", { x: 94, y: 52, width: 172, height: 68, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const ringServer = mk(svg, "rect", { x: 634, y: 52, width: 172, height: 68, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([browserBox, browserLbl, serverBox, serverLbl, lifelineBrowser, lifelineServer, ringBrowser, ringServer], { opacity: 0 });
    rows.forEach((r) => {
      gsap.set([r.line, r.label], { opacity: 0 });
      r.line.style.strokeDashoffset = String(rowLen);
    });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Browser wants to send a PUT request with a JSON body"; });
    tl.to([browserBox, browserLbl, serverBox, serverLbl, lifelineBrowser, lifelineServer], { opacity: 1, duration: 0.4 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "It sends an OPTIONS preflight to ask permission first"; });
    tl.to(row1.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(row1.line, { strokeDashoffset: 0, duration: 0.4, ease: "none" }, "<");
    tl.to(row1.label, { opacity: 1, duration: 0.3 }, "<0.2");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Server responds with the methods and headers it allows"; });
    tl.to(row2.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(row2.line, { strokeDashoffset: 0, duration: 0.4, ease: "none" }, "<");
    tl.to(row2.label, { opacity: 1, duration: 0.3 }, "<0.2");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Only then does the browser send the real PUT request"; });
    tl.to(row3.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(row3.line, { strokeDashoffset: 0, duration: 0.4, ease: "none" }, "<");
    tl.to(row3.label, { opacity: 1, duration: 0.3 }, "<0.2");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "The actual response comes back and the script finally sees it"; });
    tl.to(row4.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(row4.line, { strokeDashoffset: 0, duration: 0.4, ease: "none" }, "<");
    tl.to(row4.label, { opacity: 1, duration: 0.3 }, "<0.2");
    tl.to([ringBrowser, ringServer], { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to([ringBrowser, ringServer], { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });

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

export const PreflightRoundTripDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 480" maxW="max-w-2xl" delay={delay} setup={setupPreflightRoundTrip} />
);
