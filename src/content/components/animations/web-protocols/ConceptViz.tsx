import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animation for "Long-Polling, WebSockets, and Server-Sent
   Events". Same shell as animations/url-shortener/ConceptViz.tsx, theme
   comes entirely from CSS vars (.viz / .dark .viz in index.css), plays once
   when scrolled into view.
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
   WEBSOCKET HANDSHAKE — the HTTP Upgrade request and 101 response cross
   once, then messages flow in both directions independently. The two
   message arrows near the bottom draw concurrently on purpose, that
   simultaneity is the entire point of "full duplex".
=========================================================================== */
function setupWebSocketHandshake(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const markerInk = mk(defs, "marker", {
    id: `wsh-ink-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(markerInk, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });
  const markerBlue = mk(defs, "marker", {
    id: `wsh-blue-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(markerBlue, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-blue" });

  const phase = mkText(svg, "", 450, 28, "viz-phase", "middle");

  const clientBox = mk(svg, "rect", { x: 70, y: 60, width: 200, height: 60, rx: 8, class: "viz-box" });
  const clientLbl = mkText(svg, "Client", 170, 96, "viz-node-lbl", "middle") as SVGTextElement;
  const serverBox = mk(svg, "rect", { x: 630, y: 60, width: 200, height: 60, rx: 8, class: "viz-box" });
  const serverLbl = mkText(svg, "Server", 730, 96, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set([clientBox, serverBox, clientLbl, serverLbl], { opacity: 0 });

  // arrow 1: Upgrade request, client -> server
  const arrow1 = mk(svg, "line", {
    x1: 270, y1: 185, x2: 630, y2: 185, class: "viz-stroke", "marker-end": `url(#wsh-ink-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const len1 = 360;
  arrow1.style.strokeDasharray = String(len1);
  const label1 = mkText(svg, "Upgrade request", 450, 150, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set(label1, { opacity: 0 });

  // arrow 2: 101 Switching Protocols, server -> client
  const arrow2 = mk(svg, "line", {
    x1: 630, y1: 249, x2: 270, y2: 249, class: "viz-stroke", "marker-end": `url(#wsh-ink-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const len2 = 360;
  arrow2.style.strokeDasharray = String(len2);
  const label2 = mkText(svg, "101 Switching Protocols", 450, 217, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set(label2, { opacity: 0 });

  // arrow 3: a message from the client, drawn concurrently with arrow 4
  const arrow3 = mk(svg, "line", {
    x1: 270, y1: 313, x2: 630, y2: 313, class: "viz-blue", "marker-end": `url(#wsh-blue-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const len3 = 360;
  arrow3.style.strokeDasharray = String(len3);
  const label3 = mkText(svg, "Client message", 450, 281, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set(label3, { opacity: 0 });

  // arrow 4: a message from the server, drawn concurrently with arrow 3
  const arrow4 = mk(svg, "line", {
    x1: 630, y1: 377, x2: 270, y2: 377, class: "viz-blue", "marker-end": `url(#wsh-blue-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const len4 = 360;
  arrow4.style.strokeDasharray = String(len4);
  const label4 = mkText(svg, "Server message", 450, 345, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set(label4, { opacity: 0 });

  const clientRing = mk(svg, "rect", { x: 64, y: 54, width: 212, height: 72, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const serverRing = mk(svg, "rect", { x: 624, y: 54, width: 212, height: 72, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;

  const summary = mkText(svg, "Persistent full duplex, either side sends anytime", 450, 430, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(summary, { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([clientBox, serverBox, clientLbl, serverLbl], { opacity: 0 });
    [arrow1, arrow2, arrow3, arrow4].forEach((a) => gsap.set(a, { opacity: 0 }));
    arrow1.style.strokeDashoffset = String(len1);
    arrow2.style.strokeDashoffset = String(len2);
    arrow3.style.strokeDashoffset = String(len3);
    arrow4.style.strokeDashoffset = String(len4);
    gsap.set([label1, label2, label3, label4, summary, clientRing, serverRing], { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "The connection starts as a normal HTTP request"; });
    tl.to([clientBox, serverBox, clientLbl, serverLbl], { opacity: 1, duration: 0.35 }, "<");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Client asks the server to upgrade to WebSocket"; });
    tl.to(arrow1, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow1, { strokeDashoffset: 0, duration: 0.4, ease: "none" }, "<");
    tl.to(label1, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Server accepts, switching protocols to WebSocket"; });
    tl.to(arrow2, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow2, { strokeDashoffset: 0, duration: 0.4, ease: "none" }, "<");
    tl.to(label2, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Now either side can send a message at any time"; });
    tl.to([arrow3, arrow4], { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow3, { strokeDashoffset: 0, duration: 0.4, ease: "none" }, "<");
    tl.to(arrow4, { strokeDashoffset: 0, duration: 0.4, ease: "none" }, "<");
    tl.to([label3, label4], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "A persistent full duplex channel, no request needed to reply"; });
    tl.to([clientRing, serverRing], { opacity: 1, duration: 0.3 }, "<");
    tl.to(summary, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to([clientRing, serverRing], { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });

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

export const WebSocketHandshakeDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 480" maxW="max-w-2xl" delay={delay} setup={setupWebSocketHandshake} />
);
