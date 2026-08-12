import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Bespoke GSAP animation for "Tool use, function calling, and MCP".
   Theme comes entirely from CSS vars (.viz / .dark .viz in index.css), so the
   same SVG reads correctly in both themes. Plays once when scrolled into
   view, replay/speed controls copied verbatim from the url-shortener
   reference implementation (VizFigure, mk, mkText).

   TOOL CALL ROUND TRIP, the one mechanism on this post where motion is
   genuinely clearer than a static diagram. A tool call is a back and forth,
   not a one-way pipeline, the model sends a call out, the host runs it, a
   real result comes back, and the model resumes with that result in view.
   Watching the value travel out and then back is the whole point, so this
   stays a bespoke animation while the host/client/server structure elsewhere
   on the post is a static IconArchitectureDiagram instead.

   Layout is a rectangular loop, checked offline against
   scripts/check-svg-layout.py before shipping, zero box/label/connector
   collisions.
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
   TOOL CALL ROUND TRIP, model emits a structured call, the host runs it,
   a real result comes back, the model resumes with that result in context.
   Rectangular loop layout: down the left column, across, down the right
   column, back across, down the left column again.
=========================================================================== */
function setupToolCallRoundTrip(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `tc-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });
  const markerBlue = mk(defs, "marker", {
    id: `tcb-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(markerBlue, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-blue" });

  const phase = mkText(svg, "", 450, 26, "viz-phase", "middle");
  const userText = mkText(svg, "User: “what's the weather in Denver?”", 450, 60, "viz-label", "middle") as SVGTextElement;

  // ---- boxes ----
  const modelBox = mk(svg, "rect", { x: 150, y: 120, width: 200, height: 64, rx: 10, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const modelLbl = mkText(svg, "Model", 250, 146, "viz-node-lbl", "middle") as SVGTextElement;
  const modelSub = mkText(svg, "no live weather data", 250, 165, "viz-label-sm", "middle") as SVGTextElement;

  const toolcallBox = mk(svg, "rect", { x: 140, y: 232, width: 220, height: 64, rx: 10, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const toolcallLbl = mkText(svg, "Emits a tool call", 250, 258, "viz-node-lbl", "middle") as SVGTextElement;
  const toolcallSub = mkText(svg, "get_weather(city='Denver')", 250, 277, "viz-label-sm", "middle") as SVGTextElement;

  const hostBox = mk(svg, "rect", { x: 560, y: 232, width: 200, height: 64, rx: 10, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const hostLbl = mkText(svg, "Host executes it", 660, 258, "viz-node-lbl", "middle") as SVGTextElement;
  const hostSub = mkText(svg, "calls the real weather API", 660, 277, "viz-label-sm", "middle") as SVGTextElement;

  const resultRing = mk(svg, "rect", { x: 554, y: 338, width: 212, height: 76, rx: 14, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const resultBox = mk(svg, "rect", { x: 560, y: 344, width: 200, height: 64, rx: 10, class: "viz-panel", opacity: 0 }) as SVGRectElement;
  const resultLbl = mkText(svg, "Result comes back", 660, 370, "viz-node-lbl", "middle") as SVGTextElement;
  const resultSub = mkText(svg, "71°F, clear skies", 660, 389, "viz-label-sm", "middle") as SVGTextElement;

  const resumeBox = mk(svg, "rect", { x: 140, y: 344, width: 220, height: 64, rx: 10, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const resumeLbl = mkText(svg, "Model resumes", 250, 370, "viz-node-lbl", "middle") as SVGTextElement;
  const resumeSub = mkText(svg, "result added to context", 250, 389, "viz-label-sm", "middle") as SVGTextElement;

  const finalRing = mk(svg, "rect", { x: 109, y: 450, width: 282, height: 76, rx: 14, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const finalBox = mk(svg, "rect", { x: 115, y: 456, width: 270, height: 64, rx: 10, class: "viz-panel", opacity: 0 }) as SVGRectElement;
  const finalLbl = mkText(svg, "Final answer", 250, 482, "viz-node-lbl", "middle") as SVGTextElement;
  const finalSub = mkText(svg, "“It's 71°F and clear in Denver”", 250, 501, "viz-label-sm", "middle") as SVGTextElement;

  // ---- arrows (self-drawing lines) ----
  function arrow(x1: number, y1: number, x2: number, y2: number, cls: string, markerId: string) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const line = mk(svg, "line", { x1, y1, x2, y2, class: cls, "marker-end": `url(#${markerId})`, opacity: 0 }) as SVGLineElement;
    line.style.strokeDasharray = String(len);
    return { line, len };
  }

  const arrowUser = arrow(250, 72, 250, 118, "viz-stroke", `tc-${uid}`);
  const arrowCall = arrow(250, 184, 250, 230, "viz-stroke", `tc-${uid}`);
  const arrowOut = arrow(360, 264, 558, 264, "viz-stroke", `tc-${uid}`);
  const arrowDown = arrow(660, 296, 660, 342, "viz-stroke", `tc-${uid}`);
  const arrowBack = arrow(558, 376, 362, 376, "viz-blue", `tcb-${uid}`);
  const arrowFinal = arrow(250, 408, 250, 454, "viz-blue", `tcb-${uid}`);

  const allBoxes = [modelBox, modelLbl, modelSub, toolcallBox, toolcallLbl, toolcallSub, hostBox, hostLbl, hostSub,
    resultBox, resultLbl, resultSub, resultRing, resumeBox, resumeLbl, resumeSub, finalBox, finalLbl, finalSub, finalRing];
  const allArrows = [arrowUser, arrowCall, arrowOut, arrowDown, arrowBack, arrowFinal];

  const notes = [
    "The model reads the question and has no built-in way to know today's weather",
    "Instead of guessing, it emits a structured call naming the tool and the city",
    "The host is the thing that actually runs code, it calls the real weather service",
    "A real result comes back, a temperature and a condition, not a guess",
    "That result gets added back into the conversation as a new message",
    "The model resumes and answers using the real number it was just handed",
  ];

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set(userText, { opacity: 0 });
    gsap.set(allBoxes, { opacity: 0 });
    allArrows.forEach(({ line, len }) => {
      gsap.set(line, { opacity: 0 });
      line.style.strokeDashoffset = String(len);
    });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = notes[0]; });
    tl.to(userText, { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.4 });
    tl.to(arrowUser.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowUser.line, { strokeDashoffset: 0, duration: 0.25, ease: "none" }, "<");
    tl.to(modelBox, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to([modelLbl, modelSub], { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = notes[1]; });
    tl.to(arrowCall.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowCall.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(toolcallBox, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to([toolcallLbl, toolcallSub], { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = notes[2]; });
    tl.to(arrowOut.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowOut.line, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
    tl.to(hostBox, { opacity: 1, duration: 0.3 }, "<0.15");
    tl.to([hostLbl, hostSub], { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = notes[3]; });
    tl.to(arrowDown.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowDown.line, { strokeDashoffset: 0, duration: 0.25, ease: "none" }, "<");
    tl.to(resultBox, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to([resultLbl, resultSub], { opacity: 1, duration: 0.3 }, "<");
    tl.to(resultRing, { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = notes[4]; });
    tl.to(arrowBack.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowBack.line, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
    tl.to(resumeBox, { opacity: 1, duration: 0.3 }, "<0.15");
    tl.to([resumeLbl, resumeSub], { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = notes[5]; });
    tl.to(arrowFinal.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowFinal.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(finalBox, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to([finalLbl, finalSub], { opacity: 1, duration: 0.3 }, "<");
    tl.to(finalRing, { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to(finalRing, { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });

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

export const ToolCallRoundTripDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 550" maxW="max-w-2xl" delay={delay} setup={setupToolCallRoundTrip} />
);
