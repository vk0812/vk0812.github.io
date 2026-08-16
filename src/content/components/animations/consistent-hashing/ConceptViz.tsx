import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animation for "Consistent Hashing". Same shell as
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
   HASH RING — servers and keys share one circular hash space, a key is owned
   by the first server hit walking clockwise. Then the payoff, a server
   leaving or joining only remaps the slice of keys next to it, everything
   else on the ring stays exactly where it was.
=========================================================================== */
const CX = 450;
const CY = 340;
const R = 200;

function pointOnRing(deg: number, radius = R) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

// Polyline approximation of a circular arc, always sweeping clockwise
// (increasing angle) from fromDeg to toDeg.
function arcPathD(fromDeg: number, toDeg: number, radius = R): { d: string; approxLen: number } {
  const end = toDeg < fromDeg ? toDeg + 360 : toDeg;
  const span = end - fromDeg;
  const steps = Math.max(8, Math.round(span / 3));
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const deg = fromDeg + (span * i) / steps;
    const { x, y } = pointOnRing(deg, radius);
    d += (i === 0 ? "M " : "L ") + x.toFixed(2) + "," + y.toFixed(2) + " ";
  }
  // approximate chord-based length, good enough for a dash-draw animation
  const approxLen = radius * (span * Math.PI) / 180;
  return { d, approxLen };
}

interface RingNodeSpec {
  id: string;
  label: string;
  deg: number;
  labelDeg: number;
  labelR: number;
}

const SERVERS: RingNodeSpec[] = [
  { id: "S1", label: "S1", deg: -81, labelDeg: -81, labelR: 255 },
  { id: "S2", label: "S2", deg: -18, labelDeg: -18, labelR: 255 },
  { id: "S3", label: "S3", deg: 54, labelDeg: 54, labelR: 255 },
  { id: "S4", label: "S4", deg: 126, labelDeg: 126, labelR: 255 },
  { id: "S5", label: "S5", deg: 198, labelDeg: 198, labelR: 255 },
];
const S6: RingNodeSpec = { id: "S6", label: "S6", deg: 162, labelDeg: 162, labelR: 255 };

const KEYS: RingNodeSpec[] = [
  { id: "K1", label: "K1", deg: -54, labelDeg: -54, labelR: 155 },
  { id: "K2", label: "K2", deg: 90, labelDeg: 90, labelR: 155 },
  { id: "K3", label: "K3", deg: 234, labelDeg: 234, labelR: 155 },
  { id: "K4", label: "K4", deg: 144, labelDeg: 144, labelR: 155 },
];

function setupHashRing(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `hr-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-blue" });

  const phase = mkText(svg, "", 450, 28, "viz-phase", "middle");

  mk(svg, "circle", { cx: CX, cy: CY, r: R, class: "viz-stroke" });

  type NodeEls = { group: SVGGElement; circle: SVGCircleElement; label: SVGTextElement; ring: SVGCircleElement };
  const serverEls = new Map<string, NodeEls>();
  const keyEls = new Map<string, NodeEls>();

  function buildNode(spec: RingNodeSpec, kind: "server" | "key"): NodeEls {
    const { x, y } = pointOnRing(spec.deg);
    const { x: lx, y: ly } = pointOnRing(spec.labelDeg, spec.labelR);
    const group = mk(svg, "g", { opacity: 0 }) as SVGGElement;
    const r = kind === "server" ? 14 : 10;
    const circleCls = kind === "server" ? "viz-box" : "viz-panel";
    const circle = mk(group, "circle", { cx: x, cy: y, r, class: circleCls }) as SVGCircleElement;
    const label = mkText(group, spec.label, lx, ly, kind === "server" ? "viz-node-lbl" : "viz-label-sm", "middle") as SVGTextElement;
    const ring = mk(svg, "circle", { cx: x, cy: y, r: r + 6, class: "viz-blue", opacity: 0 }) as SVGCircleElement;
    return { group, circle, label, ring };
  }

  SERVERS.forEach((s) => serverEls.set(s.id, buildNode(s, "server")));
  const s6Els = buildNode(S6, "server");
  serverEls.set(S6.id, s6Els);
  KEYS.forEach((k) => keyEls.set(k.id, buildNode(k, "key")));

  // arcs, each a key walking clockwise to its owning server
  function buildArc(fromDeg: number, toDeg: number) {
    const { d, approxLen } = arcPathD(fromDeg, toDeg);
    const path = mk(svg, "path", { d, class: "viz-blue", "marker-end": `url(#hr-${uid})`, opacity: 0 }) as SVGPathElement;
    const len = path.getTotalLength() || approxLen;
    path.style.strokeDasharray = String(len);
    return { path, len };
  }

  const arcK1S2 = buildArc(-54 + 6, -18 - 8);
  const arcK2S4 = buildArc(90 + 6, 126 - 8);
  const arcK3S1 = buildArc(234 + 6, 279 - 8);
  const arcK4S5 = buildArc(144 + 6, 198 - 8);
  const arcK1S3 = buildArc(-54 + 6, 54 - 8);
  const arcK4S6 = buildArc(144 + 6, 162 - 8);

  const allArcs = [arcK1S2, arcK2S4, arcK3S1, arcK4S5, arcK1S3, arcK4S6];

  const s1 = serverEls.get("S1")!, s2 = serverEls.get("S2")!, s3 = serverEls.get("S3")!;
  const s4 = serverEls.get("S4")!, s5 = serverEls.get("S5")!, s6 = serverEls.get("S6")!;
  const k1 = keyEls.get("K1")!, k2 = keyEls.get("K2")!, k3 = keyEls.get("K3")!, k4 = keyEls.get("K4")!;

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    [s1, s2, s3, s4, s5, s6].forEach((n) => gsap.set([n.group, n.ring], { opacity: 0 }));
    [k1, k2, k3, k4].forEach((n) => gsap.set([n.group, n.ring], { opacity: 0 }));
    allArcs.forEach((a) => {
      gsap.set(a.path, { opacity: 0 });
      a.path.style.strokeDashoffset = String(a.len);
    });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Five servers place tokens around the ring"; });
    tl.to([s1.group, s2.group, s3.group, s4.group, s5.group], { opacity: 1, duration: 0.3, stagger: 0.08 }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "Keys hash onto the ring, then walk clockwise to the next server"; });
    tl.to([k1.group, k2.group, k3.group, k4.group], { opacity: 1, duration: 0.3, stagger: 0.08 }, "<");
    tl.to({}, { duration: 0.3 });
    [arcK1S2, arcK2S4, arcK3S1, arcK4S5].forEach((a, i) => {
      tl.to(a.path, { opacity: 1, duration: 0.05 }, i === 0 ? "<0.1" : "<0.2");
      tl.to(a.path, { strokeDashoffset: 0, duration: 0.5, ease: "none" }, "<");
    });
    tl.to({}, { duration: 0.6 });

    tl.add(() => { phase.textContent = "Server S2 leaves the ring"; });
    tl.to([s2.group, arcK1S2.path], { opacity: 0, duration: 0.4 }, "<");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Only K1 remaps, to S2's clockwise successor S3"; });
    tl.to(arcK1S3.path, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arcK1S3.path, { strokeDashoffset: 0, duration: 0.5, ease: "none" }, "<");
    tl.to(s3.ring, { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "A new server, S6, joins between S4 and S5"; });
    tl.to(s6.group, { opacity: 1, duration: 0.4 }, "<");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Only K4 shifts, from S5 to S6, everything else stays put"; });
    tl.to(arcK4S5.path, { opacity: 0, duration: 0.3 }, "<");
    tl.to(arcK4S6.path, { opacity: 1, duration: 0.05 }, "<0.1");
    tl.to(arcK4S6.path, { strokeDashoffset: 0, duration: 0.4, ease: "none" }, "<");
    tl.to(s6.ring, { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to([arcK1S3.path, arcK2S4.path, arcK3S1.path], { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });

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

export const HashRingDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 620" maxW="max-w-2xl" delay={delay} setup={setupHashRing} />
);
