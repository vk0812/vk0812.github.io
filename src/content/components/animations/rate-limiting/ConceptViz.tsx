import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animations for "Rate Limiting". Same shell as
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
   TOKEN BUCKET / LEAKY BUCKET — a single figure with a mode tab. Motion is
   the mechanism here, so both variants are animated. Token mode shows a
   bucket sized for 10 tokens refilling at 2 a second, a burst of 10 draining
   it instantly, and a request arriving faster than the refill finding it
   empty. Leaky mode shows a 5 slot FIFO queue, 8 requests arriving at once,
   the first 5 queuing, the other 3 overflowing, and the queue draining at a
   fixed 1 request a second. Both variants share the exact same outer
   skeleton (incoming box, mechanism box, pass/reject fork), only the
   mechanism's interior content and outcome labels differ by mode.
=========================================================================== */
type BucketMode = "token" | "leaky";

function setupTokenBucket(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `rl-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 26, "viz-phase", "middle");

  mk(svg, "rect", { x: 360, y: 40, width: 180, height: 50, rx: 8, class: "viz-box" });
  mkText(svg, "Incoming requests", 450, 70, "viz-node-lbl", "middle");

  const arrow1 = mk(svg, "line", {
    x1: 450, y1: 90, x2: 450, y2: 148, class: "viz-stroke", "marker-end": `url(#rl-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const len1 = 58;
  arrow1.style.strokeDasharray = String(len1);

  mk(svg, "rect", { x: 370, y: 150, width: 160, height: 120, rx: 10, class: "viz-box" });
  const bucketLabel = mkText(svg, "Token bucket", 450, 175, "viz-node-lbl", "middle") as SVGTextElement;

  const units: SVGRectElement[] = [];
  for (let i = 0; i < 10; i++) {
    units.push(mk(svg, "rect", { x: 0, y: 0, width: 0, height: 0, rx: 2, class: "viz-box", opacity: 0 }) as SVGRectElement);
  }

  const counterText = mkText(svg, "", 450, 250, "viz-label-sm", "middle") as SVGTextElement;

  const arrowPass = mk(svg, "line", {
    x1: 410, y1: 270, x2: 290, y2: 328, class: "viz-blue", "marker-end": `url(#rl-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenPass = Math.hypot(410 - 290, 328 - 270);
  arrowPass.style.strokeDasharray = String(lenPass);

  const arrowReject = mk(svg, "line", {
    x1: 490, y1: 270, x2: 610, y2: 328, class: "viz-warn", "marker-end": `url(#rl-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenReject = Math.hypot(610 - 490, 328 - 270);
  arrowReject.style.strokeDasharray = String(lenReject);

  const passBox = mk(svg, "rect", { x: 190, y: 330, width: 200, height: 70, rx: 8, class: "viz-panel", opacity: 0 }) as SVGRectElement;
  const passRing = mk(svg, "rect", { x: 184, y: 324, width: 212, height: 82, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const passLine1 = mkText(svg, "", 290, 358, "viz-node-lbl", "middle") as SVGTextElement;
  const passLine2 = mkText(svg, "", 290, 376, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([passLine1, passLine2], { opacity: 0 });

  const rejectBox = mk(svg, "rect", { x: 510, y: 330, width: 200, height: 70, rx: 8, class: "viz-panel-warn", opacity: 0 }) as SVGRectElement;
  const rejectRing = mk(svg, "rect", { x: 504, y: 324, width: 212, height: 82, rx: 12, class: "viz-warn", fill: "none", opacity: 0 }) as SVGRectElement;
  const rejectLine1 = mkText(svg, "", 610, 358, "viz-warn-lbl", "middle") as SVGTextElement;
  const rejectLine2 = mkText(svg, "", 610, 376, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([rejectLine1, rejectLine2], { opacity: 0 });

  let mode: BucketMode = "token";
  const XS = [385, 415, 445, 475, 505];

  function buildInner(m: BucketMode) {
    bucketLabel.textContent = m === "token" ? "Token bucket" : "Queue (FIFO)";
    XS.forEach((x, i) => {
      if (m === "token") {
        units[i].setAttribute("x", String(x - 6));
        units[i].setAttribute("y", "195");
        units[i].setAttribute("width", "12");
        units[i].setAttribute("height", "12");
        units[i + 5].setAttribute("x", String(x - 6));
        units[i + 5].setAttribute("y", "213");
        units[i + 5].setAttribute("width", "12");
        units[i + 5].setAttribute("height", "12");
      } else {
        units[i].setAttribute("x", String(x - 10));
        units[i].setAttribute("y", "195");
        units[i].setAttribute("width", "20");
        units[i].setAttribute("height", "20");
        units[i + 5].setAttribute("width", "0");
        units[i + 5].setAttribute("height", "0");
        units[i + 5].style.opacity = "0";
      }
    });
    passLine1.textContent = m === "token" ? "Token spent" : "Joins the drain";
    passLine2.textContent = m === "token" ? "request passes through" : "1 request out per second";
    rejectLine1.textContent = m === "token" ? "Bucket empty" : "Queue full";
    rejectLine2.textContent = m === "token" ? "request rejected, HTTP 429" : "rejected as overflow (429)";
  }
  buildInner(mode);

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set(arrow1, { opacity: 0 });
    arrow1.style.strokeDashoffset = String(len1);
    gsap.set(arrowPass, { opacity: 0 });
    arrowPass.style.strokeDashoffset = String(lenPass);
    gsap.set(arrowReject, { opacity: 0 });
    arrowReject.style.strokeDashoffset = String(lenReject);
    gsap.set([passBox, passRing, passLine1, passLine2, rejectBox, rejectRing, rejectLine1, rejectLine2], { opacity: 0 });

    if (mode === "token") {
      gsap.set(units.slice(0, 10), { opacity: 1 });
      counterText.textContent = "10 / 10 tokens";
    } else {
      gsap.set(units.slice(0, 5), { opacity: 0 });
      counterText.textContent = "0 / 5 queued";
    }

    tl = gsap.timeline();

    if (mode === "token") {
      tl.add(() => { phase.textContent = "Bucket starts full with all 10 tokens"; });
      tl.to({}, { duration: 0.6 });

      tl.add(() => { phase.textContent = "A burst of 10 requests arrives at once"; });
      tl.to(arrow1, { opacity: 1, duration: 0.05 }, "<");
      tl.to(arrow1, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
      tl.to({}, { duration: 0.3 });

      tl.add(() => {
        phase.textContent = "Each request spends a token, and the burst passes through";
        counterText.textContent = "0 / 10 tokens";
      });
      tl.to(units.slice(0, 10), { opacity: 0.15, duration: 0.4, stagger: 0.03 }, "<");
      tl.to(arrowPass, { opacity: 1, duration: 0.05 }, "<");
      tl.to(arrowPass, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
      tl.to([passBox, passRing, passLine1, passLine2], { opacity: 1, duration: 0.3 }, "<0.1");
      tl.to({}, { duration: 0.4 });

      tl.add(() => {
        phase.textContent = "The bucket refills at 2 tokens a second";
        counterText.textContent = "2 / 10 tokens";
      });
      tl.to([units[0], units[1]], { opacity: 1, duration: 0.4 }, "<");
      tl.to({}, { duration: 0.4 });

      tl.add(() => {
        phase.textContent = "A request faster than the refill rate finds the bucket empty";
        counterText.textContent = "0 / 10 tokens";
      });
      tl.to([units[0], units[1]], { opacity: 0.15, duration: 0.2 }, "<");
      tl.to(arrowReject, { opacity: 1, duration: 0.05 }, "<0.1");
      tl.to(arrowReject, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
      tl.to([rejectBox, rejectRing, rejectLine1, rejectLine2], { opacity: 1, duration: 0.3 }, "<0.1");
      tl.to(rejectRing, { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });
    } else {
      tl.add(() => { phase.textContent = "8 requests arrive from the client at once"; });
      tl.to(arrow1, { opacity: 1, duration: 0.05 }, "<");
      tl.to(arrow1, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
      tl.to({}, { duration: 0.3 });

      tl.add(() => { phase.textContent = "The first 5 fill the queue"; });
      tl.to(units.slice(0, 5), { opacity: 1, duration: 0.35, stagger: 0.08 }, "<");
      tl.add(() => { counterText.textContent = "5 / 5 queued"; }, ">-0.1");
      tl.to({}, { duration: 0.4 });

      tl.add(() => { phase.textContent = "The other 3 hit a full queue and are rejected as overflow"; });
      tl.to(arrowReject, { opacity: 1, duration: 0.05 }, "<");
      tl.to(arrowReject, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
      tl.to([rejectBox, rejectRing, rejectLine1, rejectLine2], { opacity: 1, duration: 0.3 }, "<0.1");
      tl.to({}, { duration: 0.4 });

      tl.add(() => {
        phase.textContent = "The server drains the queue at a fixed 1 request per second";
        counterText.textContent = "4 / 5 queued";
      });
      tl.to(units[0], { opacity: 0.15, duration: 0.3 }, "<");
      tl.to(arrowPass, { opacity: 1, duration: 0.05 }, "<0.1");
      tl.to(arrowPass, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
      tl.to([passBox, passRing, passLine1, passLine2], { opacity: 1, duration: 0.3 }, "<0.1");
      tl.to({}, { duration: 0.4 });

      tl.add(() => { phase.textContent = "Steady output, no matter how bursty the arrival was"; });
      tl.to(passRing, { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });
    }

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
    setMode: (m) => { mode = m as BucketMode; buildInner(mode); },
  };
}

export const TokenBucketDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure
    caption={caption}
    viewBox="0 0 900 440"
    maxW="max-w-2xl"
    delay={delay}
    setup={setupTokenBucket}
    modes={[
      { key: "token", label: "Token bucket" },
      { key: "leaky", label: "Leaky bucket" },
    ]}
  />
);

/* ===========================================================================
   WINDOW BOUNDARY — a fully static (no GSAP, no play controls) side-by-side
   comparison of the fixed window counter's boundary bug against the sliding
   window log's fix, both at the same 100 requests a minute limit used in the
   prose. Built as plain SVG JSX, not a GSAP timeline, since nothing here
   needs to move to make the comparison land.
=========================================================================== */
export const WindowBoundaryDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8 mx-auto max-w-3xl"
  >
    <div className="viz rounded-lg border border-border bg-card p-3 sm:p-5 shadow-sm">
      <svg viewBox="0 0 900 340" className="w-full h-auto">
        <text x={250} y={48} textAnchor="middle" className="viz-node-lbl">Fixed window</text>
        <rect x={80} y={80} width={160} height={60} rx={8} className="viz-box" />
        <text x={160} y={105} textAnchor="middle" className="viz-node-lbl">95 requests</text>
        <text x={160} y={123} textAnchor="middle" className="viz-label-sm">closing soon</text>
        <rect x={260} y={80} width={160} height={60} rx={8} className="viz-box" />
        <text x={340} y={105} textAnchor="middle" className="viz-node-lbl">95 requests</text>
        <text x={340} y={123} textAnchor="middle" className="viz-label-sm">new window opens</text>

        <line x1={60} y1={173} x2={410} y2={173} className="viz-stroke" />
        <line x1={230} y1={160} x2={230} y2={186} className="viz-warn" strokeDasharray="4 4" />
        <text x={230} y={203} textAnchor="middle" className="viz-label-sm">window resets here</text>

        <rect x={80} y={230} width={320} height={70} rx={8} className="viz-panel-warn" />
        <text x={240} y={258} textAnchor="middle" className="viz-warn-lbl">190 requests slip through</text>
        <text x={240} y={278} textAnchor="middle" className="viz-label-sm">in about 10 seconds</text>

        <text x={680} y={48} textAnchor="middle" className="viz-node-lbl">Sliding window log</text>
        <rect x={600} y={80} width={160} height={60} rx={8} className="viz-box" />
        <text x={680} y={105} textAnchor="middle" className="viz-node-lbl">Rolling 60s window</text>
        <text x={680} y={123} textAnchor="middle" className="viz-label-sm">recalculated live</text>

        <line x1={520} y1={173} x2={840} y2={173} className="viz-stroke" />
        <text x={680} y={203} textAnchor="middle" className="viz-label-sm">no fixed reset point</text>

        <rect x={520} y={230} width={320} height={70} rx={8} className="viz-panel" />
        <text x={680} y={258} textAnchor="middle" className="viz-node-lbl">Capped at 100</text>
        <text x={680} y={278} textAnchor="middle" className="viz-label-sm">no matter where the boundary falls</text>
      </svg>
    </div>
    {caption && (
      <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">
        {caption}
      </figcaption>
    )}
  </motion.figure>
);
