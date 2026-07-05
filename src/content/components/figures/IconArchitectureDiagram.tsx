import { useEffect, useRef, useState } from "react";
import { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   IconArchitectureDiagram — a clean system-design figure.

   Real icons (lucide, colored per node type), bold labels, dashed connectors,
   positioned on a percentage grid so it stays legible at any width.

   Pass `phases` and it becomes a self-playing GSAP build-up: nodes and their
   connectors fade in group by group, narrated by a caption underneath,
   the way the rest of the site's figures already work (autoplay once in
   view, replay/speed controls). Omit `phases` and it just renders statically.
---------------------------------------------------------------------------- */

export interface DiagramNode {
  id: string;
  label: string;
  sub?: string;
  icon: LucideIcon;
  color: string; // tailwind text-color class, e.g. "text-blue-500"
  x: number; // percent, 0-100
  y: number; // percent, 0-100
}

export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  dashed?: boolean;
  bidirectional?: boolean;
}

export interface DiagramPhase {
  nodeIds: string[]; // cumulative: everything visible by this phase
  edgeIds: string[]; // cumulative
  note: string;
  highlight?: string[];
}

const NODE_R = 8; // percent radius reserved around each icon for line-clipping

function clip(a: { x: number; y: number }, b: { x: number; y: number }, r: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  return { x: a.x + (dx / dist) * r, y: a.y + (dy / dist) * r };
}

const CTRL = "font-mono text-[11px] tracking-widest h-7 px-2.5 inline-flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors rounded";
const CTRL_ON = "font-mono text-[11px] tracking-widest h-7 px-2.5 inline-flex items-center justify-center border border-foreground bg-foreground text-background rounded";

export const IconArchitectureDiagram = ({
  nodes,
  edges,
  phases,
  caption,
  height = 460,
  delay = 0,
}: {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  phases?: DiagramPhase[];
  caption?: string;
  height?: number;
  delay?: number;
}) => {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLDivElement>());
  const edgeRefs = useRef(new Map<string, SVGLineElement>());
  const ringRefs = useRef(new Map<string, HTMLDivElement>());
  const rateRef = useRef(1);
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [note, setNote] = useState(phases?.[0]?.note ?? "");
  const [activeIdx, setActiveIdx] = useState(0);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const animated = !!phases && phases.length > 0;

  useEffect(() => {
    if (!animated) return;

    const nodeEls = nodeRefs.current;
    const edgeEls = edgeRefs.current;
    const ringEls = ringRefs.current;

    nodeEls.forEach((el) => gsap.set(el, { opacity: 0, scale: 0.8, transformOrigin: "center" }));
    edgeEls.forEach((el) => gsap.set(el, { opacity: 0 }));
    ringEls.forEach((el) => gsap.set(el, { opacity: 0 }));

    const build = () => {
      tlRef.current?.kill();
      nodeEls.forEach((el) => gsap.set(el, { opacity: 0, scale: 0.8 }));
      edgeEls.forEach((el) => gsap.set(el, { opacity: 0 }));
      ringEls.forEach((el) => gsap.set(el, { opacity: 0 }));

      const tl = gsap.timeline({ onUpdate: () => {} });
      let prevNodes: string[] = [];
      let prevEdges: string[] = [];

      phases!.forEach((phase, i) => {
        const newNodes = phase.nodeIds.filter((id) => !prevNodes.includes(id));
        const newEdges = phase.edgeIds.filter((id) => !prevEdges.includes(id));

        tl.add(() => {
          setNote(phase.note);
          setActiveIdx(i);
        }, i === 0 ? 0 : ">");

        newNodes.forEach((id, j) => {
          const el = nodeEls.get(id);
          if (el) tl.to(el, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.6)" }, j === 0 ? "<" : "<0.08");
        });
        newEdges.forEach((id) => {
          const el = edgeEls.get(id);
          if (el) tl.to(el, { opacity: 1, duration: 0.3 }, "<");
        });

        (phase.highlight ?? []).forEach((id) => {
          const ring = ringEls.get(id);
          if (!ring) return;
          tl.to(ring, { opacity: 1, duration: 0.3 }, ">-0.1");
          tl.to(ring, { opacity: 0, duration: 0.5 }, ">0.3");
        });

        tl.to({}, { duration: 0.55 });

        prevNodes = phase.nodeIds;
        prevEdges = phase.edgeIds;
      });

      tlRef.current = tl;
      tl.timeScale(rateRef.current);
    };

    build();
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          tlRef.current?.play();
          setPlaying(true);
          io.disconnect();
        }
      }),
      { threshold: 0.25 }
    );
    if (containerRef.current) io.observe(containerRef.current);

    return () => {
      io.disconnect();
      tlRef.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated]);

  const togglePlay = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (tl.progress() >= 1) tl.restart();
    else if (playing) tl.pause();
    else tl.play();
    setPlaying(!playing || tl.progress() >= 1);
  };

  const replay = () => {
    tlRef.current?.restart();
    setPlaying(true);
  };

  const changeRate = (r: number) => {
    rateRef.current = r;
    setRate(r);
    tlRef.current?.timeScale(r);
  };

  return (
    <motion.figure
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay }}
      className="not-prose my-10"
    >
      <div ref={containerRef} className="rounded-2xl border border-border bg-muted/20 p-6 sm:p-10">
        <div className="relative w-full" style={{ height }}>
          <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <marker id="iad-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" className="fill-foreground/60" />
              </marker>
            </defs>
            {edges.map((e) => {
              const a = byId.get(e.from);
              const b = byId.get(e.to);
              if (!a || !b) return null;
              const p1 = clip(a, b, NODE_R);
              const p2 = clip(b, a, NODE_R);
              return (
                <line
                  key={e.id}
                  ref={(el) => {
                    if (el) edgeRefs.current.set(e.id, el);
                  }}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  className="stroke-foreground/60"
                  strokeWidth={0.4}
                  strokeDasharray={e.dashed === false ? undefined : "2 2"}
                  vectorEffect="non-scaling-stroke"
                  markerEnd="url(#iad-arrow)"
                  markerStart={e.bidirectional ? "url(#iad-arrow)" : undefined}
                  opacity={animated ? undefined : 1}
                />
              );
            })}
          </svg>

          {nodes.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                ref={(el) => {
                  if (el) nodeRefs.current.set(n.id, el);
                }}
                className="absolute flex flex-col items-center gap-2 -translate-x-1/2 -translate-y-1/2 w-24 sm:w-28"
                style={{ left: `${n.x}%`, top: `${n.y}%` }}
              >
                <div className="relative">
                  {animated && (
                    <div
                      ref={(el) => {
                        if (el) ringRefs.current.set(n.id, el);
                      }}
                      className="absolute -inset-2 rounded-2xl ring-2 ring-amber-400/70"
                      style={{ opacity: 0 }}
                    />
                  )}
                  <div className={`relative flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-background border border-border shadow-sm ${n.color}`}>
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.75} />
                  </div>
                </div>
                <div className="text-center leading-tight">
                  <p className="font-sans text-[11px] sm:text-xs font-semibold text-foreground">{n.label}</p>
                  {n.sub && <p className="font-sans text-[10px] text-muted-foreground mt-0.5">{n.sub}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {animated && (
          <div className="mt-6 pt-5 border-t border-border/60 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
            <AnimatePresence mode="wait">
              <motion.p
                key={note}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="font-serif text-sm sm:text-base text-foreground leading-snug"
              >
                {note}
              </motion.p>
            </AnimatePresence>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={togglePlay} className={CTRL} aria-label={playing ? "Pause" : "Play"}>
                {playing ? "PAUSE" : "PLAY"}
              </button>
              <button onClick={replay} className={CTRL} aria-label="Replay">
                REPLAY
              </button>
              {[0.5, 1, 2].map((r) => (
                <button key={r} onClick={() => changeRate(r)} className={rate === r ? CTRL_ON : CTRL}>
                  {r}x
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">
          {caption}
        </figcaption>
      )}
    </motion.figure>
  );
};
