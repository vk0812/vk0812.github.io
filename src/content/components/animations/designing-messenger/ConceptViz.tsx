import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { LucideIcon, Users, Server, Database } from "lucide-react";

/* ----------------------------------------------------------------------------
   Blueprint concept animations for "Designing Facebook Messenger". Same shell
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
   DIRECTORY LOOKUP — a chat server checks its local cache for the
   recipient's server first, and only falls back to the directory service on
   a miss, caching the answer for next time. Same single-chain-with-a-fork
   skeleton as the dropbox chunk hash flow.
=========================================================================== */
function setupDirectoryLookup(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `dl-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 24, "viz-phase", "middle");

  mk(svg, "rect", { x: 330, y: 40, width: 240, height: 50, rx: 8, class: "viz-box" });
  mkText(svg, "Needs to route to User B", 450, 70, "viz-node-lbl", "middle");

  const arrow1 = mk(svg, "line", { x1: 450, y1: 90, x2: 450, y2: 148, class: "viz-stroke", "marker-end": `url(#dl-${uid})`, opacity: 0 }) as SVGLineElement;
  const len1 = 58; arrow1.style.strokeDasharray = String(len1);

  const cacheBox = mk(svg, "rect", { x: 350, y: 150, width: 200, height: 50, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const cacheLbl = mkText(svg, "Check local cache", 450, 180, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(cacheLbl, { opacity: 0 });

  const arrowHit = mk(svg, "line", { x1: 400, y1: 200, x2: 250, y2: 258, class: "viz-blue", "marker-end": `url(#dl-${uid})`, opacity: 0 }) as SVGLineElement;
  const lenHit = Math.hypot(400 - 250, 258 - 200); arrowHit.style.strokeDasharray = String(lenHit);

  const hitBox = mk(svg, "rect", { x: 130, y: 260, width: 240, height: 60, rx: 8, class: "viz-panel", opacity: 0 }) as SVGRectElement;
  const hitRing = mk(svg, "rect", { x: 124, y: 254, width: 252, height: 72, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const hitLbl1 = mkText(svg, "Cache hit", 250, 282, "viz-node-lbl", "middle") as SVGTextElement;
  const hitLbl2 = mkText(svg, "deliver straight to Chat Server B", 250, 300, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([hitLbl1, hitLbl2], { opacity: 0 });

  const arrowMiss = mk(svg, "line", { x1: 500, y1: 200, x2: 650, y2: 258, class: "viz-blue", "marker-end": `url(#dl-${uid})`, opacity: 0 }) as SVGLineElement;
  const lenMiss = Math.hypot(650 - 500, 258 - 200); arrowMiss.style.strokeDasharray = String(lenMiss);

  const missBox = mk(svg, "rect", { x: 530, y: 260, width: 240, height: 50, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const missLbl = mkText(svg, "Cache miss, ask Directory Service", 650, 290, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(missLbl, { opacity: 0 });

  const arrow2 = mk(svg, "line", { x1: 650, y1: 310, x2: 650, y2: 358, class: "viz-stroke", "marker-end": `url(#dl-${uid})`, opacity: 0 }) as SVGLineElement;
  const len2 = 48; arrow2.style.strokeDasharray = String(len2);

  const returnBox = mk(svg, "rect", { x: 530, y: 360, width: 240, height: 60, rx: 8, class: "viz-panel", opacity: 0 }) as SVGRectElement;
  const returnRing = mk(svg, "rect", { x: 524, y: 354, width: 252, height: 72, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const returnLbl1 = mkText(svg, "Directory returns the mapping", 650, 382, "viz-node-lbl", "middle") as SVGTextElement;
  const returnLbl2 = mkText(svg, "cache it, then deliver", 650, 400, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([returnLbl1, returnLbl2], { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([arrow1, cacheBox, cacheLbl, arrowHit, hitBox, hitRing, hitLbl1, hitLbl2, arrowMiss, missBox, missLbl,
      arrow2, returnBox, returnRing, returnLbl1, returnLbl2], { opacity: 0 });
    arrow1.style.strokeDashoffset = String(len1);
    arrowHit.style.strokeDashoffset = String(lenHit);
    arrowMiss.style.strokeDashoffset = String(lenMiss);
    arrow2.style.strokeDashoffset = String(len2);

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "Chat Server A needs to find where User B is connected"; });
    tl.to({}, { duration: 0.35 });

    tl.add(() => { phase.textContent = "It checks its own local cache first"; });
    tl.to([arrow1], { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow1, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([cacheBox, cacheLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "A hit skips the directory service entirely"; });
    tl.to(arrowHit, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowHit, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([hitBox, hitLbl1, hitLbl2], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(hitRing, { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "A miss means the cached entry is stale or never existed"; });
    tl.to(arrowMiss, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowMiss, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([missBox, missLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "The directory service resolves the real mapping"; });
    tl.to(arrow2, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow2, { strokeDashoffset: 0, duration: 0.25, ease: "none" }, "<");
    tl.to([returnBox, returnLbl1, returnLbl2], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "and that answer gets cached, so the next message skips this round trip"; });
    tl.to(returnRing, { opacity: 1, duration: 0.3 }, "<");
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

export const DirectoryLookupDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 440" maxW="max-w-2xl" delay={delay} setup={setupDirectoryLookup} />
);

/* ===========================================================================
   MESSAGE ACK CHAIN — a fully static (no GSAP, no play controls) reproduction
   of the classic five-box ack-chain diagram, User A, Server A, Database,
   Server B, User B, wired up with the same nine arrows. Built as plain SVG
   JSX, not a GSAP timeline, since nothing here needs to move, it only needs
   to lay out cleanly with labels that sit near their arrow without touching
   the stroke.
=========================================================================== */
interface AckBoxSpec {
  x: number;
  y: number;
  w: number;
  h: number;
  icon: LucideIcon;
  color: string;
  lines: string[];
}

const AckBox = ({ x, y, w, h, icon: Icon, color, lines }: AckBoxSpec) => (
  <foreignObject x={x} y={y} width={w} height={h}>
    <div
      // eslint-disable-next-line react/no-unknown-property
      xmlns="http://www.w3.org/1999/xhtml"
      className="h-full w-full rounded-xl border border-border bg-background shadow-sm flex flex-col items-center justify-center gap-1.5 px-2"
    >
      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${color}`} strokeWidth={1.75} />
      <div className="text-center leading-tight">
        {lines.map((l, i) => (
          <p key={i} className="font-sans text-[10px] sm:text-[11px] font-semibold text-foreground">
            {l}
          </p>
        ))}
      </div>
    </div>
  </foreignObject>
);

export const MessageAckChainDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8 mx-auto max-w-3xl"
  >
    <div className="rounded-lg border border-border bg-card p-3 sm:p-5 shadow-sm">
      <svg viewBox="0 0 900 660" className="w-full h-auto">
        <defs>
          <marker id="ack-ink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="fill-foreground/70" />
          </marker>
          <marker id="ack-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="fill-blue-500 dark:fill-blue-400" />
          </marker>
        </defs>

        {/* top cluster, User A <-> Server A */}
        <line x1="200" y1="45" x2="336" y2="45" className="stroke-foreground/70" strokeWidth="2" strokeDasharray="6 5" markerEnd="url(#ack-ink)" />
        <text x="268" y="34" textAnchor="middle" className="fill-foreground/80 font-sans text-[11px]">Send message to User B</text>

        <line x1="336" y1="80" x2="200" y2="80" className="stroke-foreground/70" strokeWidth="2" strokeDasharray="6 5" markerEnd="url(#ack-ink)" />
        <text x="268" y="69" textAnchor="middle" className="fill-foreground/80 font-sans text-[11px]">Message received</text>

        <line x1="336" y1="115" x2="200" y2="115" className="stroke-blue-500 dark:stroke-blue-400" strokeWidth="2" strokeDasharray="6 5" markerEnd="url(#ack-blue)" />
        <text x="268" y="104" textAnchor="middle" className="fill-blue-600 dark:fill-blue-400 font-sans text-[11px]">Message sent</text>

        {/* Server A -> Database */}
        <line x1="584" y1="80" x2="696" y2="80" className="stroke-foreground/70" strokeWidth="2" strokeDasharray="6 5" markerEnd="url(#ack-ink)" />
        <text x="640" y="65" textAnchor="middle" className="fill-foreground/80 font-sans text-[11px]">Store the message</text>

        {/* middle cluster, Server A <-> Server B */}
        <path d="M380,130 Q300,325 380,520" fill="none" className="stroke-foreground/70" strokeWidth="2" strokeDasharray="6 5" markerStart="url(#ack-ink)" markerEnd="url(#ack-ink)" />
        <text x="205" y="328" textAnchor="end" className="fill-foreground/80 font-sans text-[11px]">Acknowledgement</text>

        <line x1="460" y1="520" x2="460" y2="134" className="stroke-foreground/70" strokeWidth="2" strokeDasharray="6 5" markerEnd="url(#ack-ink)" />
        <text x="478" y="318" textAnchor="start" className="fill-foreground/80 font-sans text-[11px]">Message</text>
        <text x="478" y="336" textAnchor="start" className="fill-foreground/80 font-sans text-[11px]">sent</text>

        <path d="M540,130 Q640,325 540,520" fill="none" className="stroke-foreground/70" strokeWidth="2" strokeDasharray="6 5" markerStart="url(#ack-ink)" markerEnd="url(#ack-ink)" />
        <text x="672" y="295" textAnchor="start" className="fill-foreground/80 font-sans text-[11px]">Pass the message to</text>
        <text x="672" y="313" textAnchor="start" className="fill-foreground/80 font-sans text-[11px]">server managing connection</text>
        <text x="672" y="331" textAnchor="start" className="fill-foreground/80 font-sans text-[11px]">with User B</text>

        {/* bottom cluster, Server B <-> User B */}
        <line x1="336" y1="550" x2="200" y2="550" className="stroke-foreground/70" strokeWidth="2" strokeDasharray="6 5" markerEnd="url(#ack-ink)" />
        <text x="268" y="539" textAnchor="middle" className="fill-foreground/80 font-sans text-[11px]">Send message to User B</text>

        <line x1="200" y1="585" x2="336" y2="585" className="stroke-foreground/70" strokeWidth="2" strokeDasharray="6 5" markerEnd="url(#ack-ink)" />
        <text x="268" y="574" textAnchor="middle" className="fill-foreground/80 font-sans text-[9px] sm:text-[10px]">Receive acknowledgement</text>

        {/* nodes */}
        <AckBox x={40} y={50} w={160} h={60} icon={Users} color="text-slate-500" lines={["User A"]} />
        <AckBox x={340} y={30} w={240} h={100} icon={Server} color="text-violet-500" lines={["Server managing", "connection with User A"]} />
        <AckBox x={700} y={50} w={160} h={60} icon={Database} color="text-blue-600" lines={["Database"]} />
        <AckBox x={340} y={520} w={240} h={100} icon={Server} color="text-pink-500" lines={["Server managing", "connection with User B"]} />
        <AckBox x={40} y={540} w={160} h={60} icon={Users} color="text-slate-500" lines={["User B"]} />
      </svg>
    </div>
    {caption && (
      <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">
        {caption}
      </figcaption>
    )}
  </motion.figure>
);
