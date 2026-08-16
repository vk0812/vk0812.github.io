import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animation for the load balancing post. Same shell as
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
  setMode?: (m: string) => void;
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
  caption, viewBox, maxW = "max-w-3xl", setup, modes,
}: {
  caption: string;
  viewBox: string;
  maxW?: string;
  delay?: number;
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
   ALGORITHM DISTRIBUTOR — requests flowing from the load balancer down to a
   row of three servers, one mode per algorithm (round robin, least
   connections, weighted round robin, IP hash). Each mode reuses the same
   three geometry-only connector lines, one per server, and narrates which
   server gets picked and why as it draws.
=========================================================================== */
type Step = { target: number; badge: string; phase: string };
type ModeConfig = {
  label: string;
  badges: [string, string, string];
  steps: Step[];
  final: string;
};

const MODES: Record<string, ModeConfig> = {
  rr: {
    label: "Round robin",
    badges: ["0 served", "0 served", "0 served"],
    steps: [
      { target: 0, badge: "1 served", phase: "Request 1 arrives and goes to Server 1." },
      { target: 1, badge: "1 served", phase: "Request 2 goes to Server 2 next in line." },
      { target: 2, badge: "1 served", phase: "Request 3 completes the cycle at Server 3." },
      { target: 0, badge: "2 served", phase: "The rotation starts over at Server 1." },
      { target: 1, badge: "2 served", phase: "Server 2 gets the next turn again." },
      { target: 2, badge: "2 served", phase: "Server 3 rounds out a second full cycle." },
    ],
    final: "Round robin gives every server an equal turn no matter its load.",
  },
  lc: {
    label: "Least connections",
    badges: ["12 active", "4 active", "7 active"],
    steps: [
      { target: 1, badge: "5 active", phase: "Server 2 has the fewest active connections so it takes the next request." },
      { target: 1, badge: "6 active", phase: "Server 2 is still the lightest so it gets this one too." },
      { target: 1, badge: "7 active", phase: "Even at six active connections Server 2 remains the lightest load." },
      { target: 2, badge: "8 active", phase: "Server 2 and Server 3 are now tied so this one goes to Server 3." },
    ],
    final: "Least connections keeps adapting as active work shifts between servers.",
  },
  wrr: {
    label: "Weighted round robin",
    badges: ["Weight 5", "Weight 2", "Weight 1"],
    steps: [
      { target: 0, badge: "Weight 5", phase: "The server with weight 5 takes five of every eight requests." },
      { target: 1, badge: "Weight 2", phase: "The server with weight 2 takes two of every eight." },
      { target: 2, badge: "Weight 1", phase: "The server with weight 1 takes the last one." },
    ],
    final: "Weighted round robin sends traffic in proportion to server capacity.",
  },
  hash: {
    label: "IP hash",
    badges: ["1.1.1.1", "2.2.2.2", "3.3.3.3"],
    steps: [
      { target: 0, badge: "1.1.1.1", phase: "Client A at 1.1.1.1 hashes to Server 1." },
      { target: 1, badge: "2.2.2.2", phase: "Client B at 2.2.2.2 hashes to Server 2." },
      { target: 0, badge: "1.1.1.1", phase: "Client A's next request lands on Server 1 again." },
      { target: 2, badge: "3.3.3.3", phase: "Client C at 3.3.3.3 hashes to Server 3." },
      { target: 1, badge: "2.2.2.2", phase: "Client B's next request also lands on Server 2." },
    ],
    final: "IP hash always routes that client back to the same server.",
  },
};

function setupAlgorithmDistributor(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `lbd-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 22, "viz-phase", "middle");

  // incoming requests box
  mk(svg, "rect", { x: 350, y: 56, width: 200, height: 44, rx: 8, class: "viz-box" });
  mkText(svg, "Incoming requests", 450, 83, "viz-node-lbl", "middle");

  const arrReqLb = mk(svg, "line", {
    x1: 450, y1: 100, x2: 450, y2: 154, class: "viz-stroke", "marker-end": `url(#lbd-${uid})`,
  }) as SVGLineElement;

  // load balancer box, two internal lines (title + active mode)
  mk(svg, "rect", { x: 340, y: 154, width: 220, height: 74, rx: 10, class: "viz-box" });
  mkText(svg, "Load balancer", 450, 182, "viz-node-lbl", "middle");
  const lbSub = mkText(svg, "", 450, 206, "viz-label-sm", "middle") as SVGTextElement;

  // server row
  const serverCx = [190, 450, 710];
  const serverX = [95, 355, 615];
  type ServerEls = { box: SVGRectElement; ring: SVGRectElement; badge: SVGTextElement };
  const servers: ServerEls[] = serverCx.map((cx, i) => {
    const box = mk(svg, "rect", { x: serverX[i], y: 280, width: 190, height: 82, rx: 10, class: "viz-box" }) as SVGRectElement;
    const ring = mk(svg, "rect", {
      x: serverX[i] - 6, y: 274, width: 202, height: 94, rx: 14, class: "viz-blue", fill: "none", opacity: 0,
    }) as SVGRectElement;
    mkText(svg, `Server ${i + 1}`, cx, 310, "viz-node-lbl", "middle");
    const badge = mkText(svg, "", cx, 338, "viz-label-sm", "middle") as SVGTextElement;
    return { box, ring, badge };
  });

  // three geometry-only connector lines, one per server, reused across turns
  const lines = serverCx.map((cx) => {
    const ln = mk(svg, "line", {
      x1: 450, y1: 228, x2: cx, y2: 280, class: "viz-blue", "marker-end": `url(#lbd-${uid})`, opacity: 0,
    }) as SVGLineElement;
    const len = Math.hypot(cx - 450, 280 - 228);
    ln.style.strokeDasharray = String(len);
    ln.style.strokeDashoffset = String(len);
    return { el: ln, len };
  });

  let currentMode = "rr";
  let tl: gsap.core.Timeline | null = null;

  const play = () => {
    tl?.kill();
    const cfg = MODES[currentMode];
    phase.textContent = "";
    lbSub.textContent = cfg.label;
    servers.forEach((s, i) => {
      s.badge.textContent = cfg.badges[i];
      gsap.set(s.ring, { opacity: 0 });
    });
    lines.forEach((l) => {
      gsap.set(l.el, { opacity: 0 });
      l.el.style.strokeDashoffset = String(l.len);
    });

    tl = gsap.timeline();
    tl.set(arrReqLb, { opacity: 0 });
    tl.to(arrReqLb, { opacity: 1, duration: 0.3 });
    tl.to({}, { duration: 0.3 });

    let prevLine: SVGLineElement | null = null;
    cfg.steps.forEach((step, i) => {
      const line = lines[step.target];
      tl.add(() => { phase.textContent = step.phase; }, i === 0 ? ">" : ">-0.05");
      if (prevLine && prevLine !== line.el) {
        tl.to(prevLine, { opacity: 0.15, duration: 0.2 }, "<");
      }
      tl.set(line.el, { strokeDashoffset: line.len }, "<");
      tl.to(line.el, { opacity: 1, duration: 0.05 }, "<");
      tl.to(line.el, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
      tl.to(servers[step.target].ring, { opacity: 1, duration: 0.25 }, ">-0.05");
      tl.add(() => { servers[step.target].badge.textContent = step.badge; }, "<");
      tl.to(servers[step.target].ring, { opacity: 0, duration: 0.4 }, ">0.15");
      tl.to({}, { duration: 0.35 });
      prevLine = line.el;
    });

    tl.add(() => { phase.textContent = cfg.final; });
    tl.to({}, { duration: 0.6 });

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
    setMode: (m) => { currentMode = m; },
  };
}

export const AlgorithmDistributorDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure
    caption={caption}
    viewBox="0 0 900 400"
    maxW="max-w-2xl"
    delay={delay}
    setup={setupAlgorithmDistributor}
    modes={[
      { key: "rr", label: "Round robin" },
      { key: "lc", label: "Least connections" },
      { key: "wrr", label: "Weighted" },
      { key: "hash", label: "IP hash" },
    ]}
  />
);
