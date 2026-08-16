import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animation for "Heartbeat and Checksum". Same shell as
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
   HEARTBEAT PULSE — Server A sends periodic heartbeats to the Load Balancer.
   Regular pulses arrive, then heartbeats stop, then the timeout expires and
   the Load Balancer marks Server A failed and reroutes new connections to
   Server B. Motion carries the story here, the whole point is time passing
   (a beat, silence, a timeout), not just a labeled request chain.
=========================================================================== */
function setupHeartbeatPulse(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `hb-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-blue" });
  const markerWarn = mk(defs, "marker", {
    id: `hbw-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(markerWarn, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-warn" });

  const phase = mkText(svg, "", 450, 28, "viz-phase", "middle");

  const lbBox = mk(svg, "rect", { x: 350, y: 40, width: 200, height: 56, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const lbLbl = mkText(svg, "Load Balancer", 450, 73, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(lbLbl, { opacity: 0 });

  const serverABox = mk(svg, "rect", { x: 140, y: 220, width: 180, height: 56, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const serverALbl = mkText(svg, "Server A", 230, 253, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(serverALbl, { opacity: 0 });
  const serverARing = mk(svg, "rect", { x: 134, y: 214, width: 192, height: 68, rx: 12, class: "viz-warn", fill: "none", opacity: 0 }) as SVGRectElement;

  const serverBBox = mk(svg, "rect", { x: 580, y: 220, width: 180, height: 56, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const serverBLbl = mkText(svg, "Server B", 670, 253, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(serverBLbl, { opacity: 0 });
  const serverBRing = mk(svg, "rect", { x: 574, y: 214, width: 192, height: 68, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;

  const statusBadge = mk(svg, "rect", { x: 370, y: 140, width: 160, height: 56, rx: 8, class: "viz-panel", opacity: 0 }) as SVGRectElement;
  const statusRing = mk(svg, "rect", { x: 364, y: 134, width: 172, height: 68, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const statusLbl = mkText(svg, "UP", 450, 173, "viz-phase", "middle") as SVGTextElement;
  gsap.set(statusLbl, { opacity: 0 });

  const hbLine = mk(svg, "line", {
    x1: 230, y1: 220, x2: 410, y2: 96, class: "viz-blue",
    "marker-end": `url(#hb-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const hbLen = Math.hypot(410 - 230, 96 - 220);
  hbLine.style.strokeDasharray = String(hbLen);

  const reLine = mk(svg, "line", {
    x1: 490, y1: 96, x2: 670, y2: 220, class: "viz-warn",
    "marker-end": `url(#hbw-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const reLen = Math.hypot(670 - 490, 220 - 96);
  reLine.style.strokeDasharray = String(reLen);

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([lbBox, lbLbl, serverABox, serverALbl, serverBBox, serverBLbl], { opacity: 0 });
    gsap.set([statusBadge, statusRing, statusLbl], { opacity: 0 });
    gsap.set([serverARing, serverBRing], { opacity: 0 });
    statusLbl.textContent = "UP";
    statusLbl.setAttribute("class", "viz-phase");
    hbLine.style.strokeDashoffset = String(hbLen);
    gsap.set(hbLine, { opacity: 0 });
    reLine.style.strokeDashoffset = String(reLen);
    gsap.set(reLine, { opacity: 0 });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Server A and Server B both report to the Load Balancer"; });
    tl.to([lbBox, lbLbl, serverABox, serverALbl, serverBBox, serverBLbl], { opacity: 1, duration: 0.35, stagger: 0.05 }, "<");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Server A sends a heartbeat to the Load Balancer every two seconds"; });
    tl.to([statusBadge, statusLbl], { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.2 });

    // beat 1
    tl.to(hbLine, { opacity: 1, duration: 0.05 });
    tl.fromTo(hbLine, { strokeDashoffset: hbLen }, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(statusRing, { opacity: 1, duration: 0.15 }, "<0.1");
    tl.to([hbLine, statusRing], { opacity: 0, duration: 0.25 }, "+=0.25");

    // beat 2
    tl.to(hbLine, { opacity: 1, duration: 0.05 }, "+=0.35");
    tl.fromTo(hbLine, { strokeDashoffset: hbLen }, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(statusRing, { opacity: 1, duration: 0.15 }, "<0.1");
    tl.to([hbLine, statusRing], { opacity: 0, duration: 0.25 }, "+=0.25");

    // beat 3
    tl.to(hbLine, { opacity: 1, duration: 0.05 }, "+=0.35");
    tl.fromTo(hbLine, { strokeDashoffset: hbLen }, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(statusRing, { opacity: 1, duration: 0.15 }, "<0.1");
    tl.to([hbLine, statusRing], { opacity: 0, duration: 0.25 }, "+=0.25");

    tl.to({}, { duration: 0.3 });

    tl.add(() => { phase.textContent = "Heartbeats stop arriving, the Load Balancer is not sure yet"; });
    tl.to(statusLbl, { opacity: 0, duration: 0.2 }, "<");
    tl.add(() => { statusLbl.textContent = "UNKNOWN"; });
    tl.to(statusLbl, { opacity: 1, duration: 0.2 });
    tl.to({}, { duration: 0.9 });

    tl.add(() => { phase.textContent = "After the timeout, the Load Balancer marks Server A failed"; });
    tl.to(statusLbl, { opacity: 0, duration: 0.2 }, "<");
    tl.add(() => {
      statusLbl.textContent = "FAILED";
      statusLbl.setAttribute("class", "viz-warn-lbl");
    });
    tl.to(statusLbl, { opacity: 1, duration: 0.2 });
    tl.to(serverABox, { opacity: 0.35, duration: 0.4 }, "<");
    tl.to(serverARing, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "New connections are routed to Server B instead"; });
    tl.to(reLine, { opacity: 1, duration: 0.05 }, "<");
    tl.to(reLine, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
    tl.to(serverBRing, { opacity: 1, duration: 0.3 }, "<0.2");
    tl.to(serverBRing, { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });

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

export const HeartbeatPulseDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 480" maxW="max-w-2xl" delay={delay} setup={setupHeartbeatPulse} />
);
