import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

const LINE = "viz-thin";
const NODE = "viz-box";
const DENSE = "viz-panel-warn";
const LEAF = "viz-panel";
const LABEL = "viz-label";
const MUTED = "viz-label-sm";
const PHASE = "viz-phase";

type Setup = (svg: SVGSVGElement, markerId: string) => gsap.core.Timeline;

const slugId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "");

const Frame = ({
  caption,
  viewBox,
  setup,
  children,
}: {
  caption: string;
  viewBox: string;
  setup: Setup;
  children: ReactNode | ((markerId: string) => ReactNode);
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const markerId = `yelp-arrow-${slugId(useId())}`;
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const timeline = setup(svg, markerId);
    timelineRef.current = timeline;
    timeline.pause(0);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timeline.play();
          setPlaying(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(svg);

    return () => {
      observer.disconnect();
      timeline.kill();
    };
  }, [markerId, setup]);

  const replay = () => {
    timelineRef.current?.restart();
    setPlaying(true);
  };

  const toggle = () => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    if (timeline.progress() >= 1) timeline.restart();
    else if (playing) timeline.pause();
    else timeline.play();
    setPlaying(!playing || timeline.progress() >= 1);
  };

  const changeRate = (nextRate: number) => {
    setRate(nextRate);
    timelineRef.current?.timeScale(nextRate);
  };

  return (
    <motion.figure
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4 }}
      className="not-prose my-10 mx-auto max-w-3xl"
    >
      <div className="viz rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
        <svg ref={svgRef} viewBox={viewBox} className="w-full h-auto" role="img" aria-label={caption}>
          <defs>
            <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" className="viz-arrow-ink" />
            </marker>
          </defs>
          {typeof children === "function" ? children(markerId) : children}
        </svg>
        <div className="mt-4 flex items-center justify-center gap-1.5">
          <button type="button" onClick={toggle} className="font-mono text-[11px] tracking-widest h-7 px-2.5 border border-border text-muted-foreground hover:text-foreground rounded">
            {playing ? "PAUSE" : "PLAY"}
          </button>
          <button type="button" onClick={replay} className="font-mono text-[11px] tracking-widest h-7 px-2.5 border border-border text-muted-foreground hover:text-foreground rounded">
            REPLAY
          </button>
          {[0.5, 1, 2].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => changeRate(value)}
              className={`font-mono text-[11px] tracking-widest h-7 px-2.5 border rounded ${
                rate === value ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {value}x
            </button>
          ))}
        </div>
      </div>
      <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">{caption}</figcaption>
    </motion.figure>
  );
};

const setInitialState = (svg: SVGSVGElement, selector: string) => {
  gsap.set(svg.querySelectorAll(selector), { opacity: 0, scale: 0.85, transformOrigin: "center" });
};

const setupQuadTree: Setup = (svg, markerId) => {
  setInitialState(svg, ".qt-node");
  gsap.set(svg.querySelectorAll(".qt-edge, .qt-search"), { opacity: 0 });

  const timeline = gsap.timeline();
  const phase = svg.querySelector<SVGTextElement>(".qt-phase");
  const note = (text: string) => timeline.add(() => { if (phase) phase.textContent = text; });
  const show = (selector: string, at: string | number = ">") =>
    timeline.to(svg.querySelectorAll(selector), { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.5)" }, at);

  note("Begin with one cell covering the whole map");
  show(".qt-root");
  timeline.to({}, { duration: 0.65 });

  note("The root is too dense, so split it into four quadrants");
  timeline.to(svg.querySelectorAll(".qt-root-edge"), { opacity: 1, duration: 0.35 });
  show(".qt-quadrant");
  timeline.to({}, { duration: 0.75 });

  note("A busy quadrant needs another split, while sparse areas stay large");
  timeline.to(svg.querySelectorAll(".qt-dense-edge"), { opacity: 1, duration: 0.35 });
  show(".qt-leaf");
  timeline.to({}, { duration: 0.75 });

  note("A location lookup follows the tree to one leaf, then checks nearby leaves");
  show(".qt-user", ">");
  timeline.to(svg.querySelectorAll(".qt-search-edge"), { opacity: 1, duration: 0.35 });
  show(".qt-neighbor", ">");
  timeline.to({}, { duration: 0.8 });

  return timeline;
};

export const QuadTreeDiagram = ({ caption }: { caption: string }) => (
  <Frame caption={caption} viewBox="0 0 900 680" setup={setupQuadTree}>
    {(markerId) => (
      <>
    <text x="450" y="30" textAnchor="middle" className={PHASE + " qt-phase"}>Begin with one cell covering the whole map</text>

    <g className="qt-edge qt-root-edge">
      <line x1="450" y1="132" x2="280" y2="202" className={LINE} strokeWidth="2" markerEnd={`url(#${markerId})`} />
      <line x1="450" y1="132" x2="620" y2="202" className={LINE} strokeWidth="2" markerEnd={`url(#${markerId})`} />
      <line x1="450" y1="132" x2="280" y2="342" className={LINE} strokeWidth="2" markerEnd={`url(#${markerId})`} />
      <line x1="450" y1="132" x2="620" y2="342" className={LINE} strokeWidth="2" markerEnd={`url(#${markerId})`} />
    </g>

    <g className="qt-edge qt-dense-edge">
      <line x1="280" y1="398" x2="175" y2="454" className={LINE} strokeWidth="2" markerEnd={`url(#${markerId})`} />
      <line x1="280" y1="398" x2="385" y2="454" className={LINE} strokeWidth="2" markerEnd={`url(#${markerId})`} />
      <line x1="280" y1="398" x2="175" y2="566" className={LINE} strokeWidth="2" markerEnd={`url(#${markerId})`} />
      <line x1="280" y1="398" x2="385" y2="566" className={LINE} strokeWidth="2" markerEnd={`url(#${markerId})`} />
    </g>

    <g className="qt-node qt-root">
      <rect x="350" y="76" width="200" height="56" rx="14" className={NODE} strokeWidth="1.5" />
      <text x="450" y="100" textAnchor="middle" className={LABEL}>Whole world</text>
      <text x="450" y="119" textAnchor="middle" className={MUTED}>one grid</text>
    </g>

    <g className="qt-node qt-quadrant">
      <rect x="195" y="202" width="170" height="56" rx="14" className={NODE} strokeWidth="1.5" />
      <text x="280" y="227" textAnchor="middle" className={LABEL}>Sparse region</text>
      <text x="280" y="246" textAnchor="middle" className={MUTED}>large leaf</text>
    </g>
    <g className="qt-node qt-quadrant">
      <rect x="535" y="202" width="170" height="56" rx="14" className={NODE} strokeWidth="1.5" />
      <text x="620" y="227" textAnchor="middle" className={LABEL}>Sparse region</text>
      <text x="620" y="246" textAnchor="middle" className={MUTED}>large leaf</text>
    </g>
    <g className="qt-node qt-quadrant">
      <rect x="195" y="342" width="170" height="56" rx="14" className={DENSE} strokeWidth="1.5" />
      <text x="280" y="367" textAnchor="middle" className={LABEL}>Dense downtown</text>
      <text x="280" y="386" textAnchor="middle" className={MUTED}>split again</text>
    </g>
    <g className="qt-node qt-quadrant">
      <rect x="535" y="342" width="170" height="56" rx="14" className={NODE} strokeWidth="1.5" />
      <text x="620" y="367" textAnchor="middle" className={LABEL}>Sparse region</text>
      <text x="620" y="386" textAnchor="middle" className={MUTED}>large leaf</text>
    </g>

    {[{ x: 175, y: 478 }, { x: 385, y: 478 }, { x: 175, y: 590 }, { x: 385, y: 590 }].map(({ x, y }) => (
      <g key={`${x}-${y}`} className="qt-node qt-leaf">
        <rect x={x - 65} y={y - 24} width="130" height="48" rx="12" className={LEAF} strokeWidth="1.5" />
        <text x={x} y={y + 5} textAnchor="middle" className={LABEL}>leaf grid</text>
      </g>
    ))}

    <g className="qt-edge qt-search-edge">
      <line x1="60" y1="420" x2="110" y2="478" className={LINE} strokeWidth="2" markerEnd={`url(#${markerId})`} />
      <line x1="60" y1="570" x2="110" y2="590" className={LINE} strokeWidth="2" markerEnd={`url(#${markerId})`} />
    </g>
    <g className="qt-search qt-user">
      <circle cx="45" cy="420" r="15" className="viz-box" strokeWidth="1.5" />
      <text x="45" y="385" textAnchor="middle" className={MUTED}>user location</text>
    </g>
    <g className="qt-search qt-neighbor">
      <circle cx="45" cy="570" r="15" className="viz-panel" strokeWidth="1.5" />
      <text x="45" y="530" textAnchor="middle" className={MUTED}>neighbor check</text>
    </g>
      </>
    )}
  </Frame>
);

const setupReverseIndex: Setup = (svg) => {
  setInitialState(svg, ".ri-step");
  gsap.set(svg.querySelectorAll(".ri-edge"), { opacity: 0 });

  const timeline = gsap.timeline();
  const phase = svg.querySelector<SVGTextElement>(".ri-phase");
  const note = (text: string) => timeline.add(() => { if (phase) phase.textContent = text; });
  const show = (selector: string, at: string | number = ">") =>
    timeline.to(svg.querySelectorAll(selector), { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }, at);

  note("Each place belongs to one hashed index partition");
  show(".ri-place");
  timeline.to({}, { duration: 0.6 });

  note("The reverse index groups IDs and coordinates by partition");
  timeline.to(svg.querySelectorAll(".ri-edge-one"), { opacity: 1, duration: 0.35 });
  show(".ri-index");
  timeline.to({}, { duration: 0.65 });

  note("A replacement server asks only for its own assignment");
  timeline.to(svg.querySelectorAll(".ri-edge-two"), { opacity: 1, duration: 0.35 });
  show(".ri-rebuild");
  timeline.to({}, { duration: 0.7 });

  note("Those coordinates rebuild the missing local QuadTree");
  timeline.to(svg.querySelectorAll(".ri-edge-three"), { opacity: 1, duration: 0.35 });
  show(".ri-tree");
  return timeline;
};

export const ReverseIndexDiagram = ({ caption }: { caption: string }) => (
  <Frame caption={caption} viewBox="0 0 900 540" setup={setupReverseIndex}>
    {(markerId) => (
      <>
    <text x="450" y="30" textAnchor="middle" className={PHASE + " ri-phase"}>Each place belongs to one hashed index partition</text>

    <g className="ri-step ri-place">
      <rect x="45" y="185" width="210" height="150" rx="16" className={NODE} strokeWidth="1.5" />
      <text x="150" y="218" textAnchor="middle" className={LABEL}>Place records</text>
      <text x="150" y="252" textAnchor="middle" className={MUTED}>ID 104 · lat, long</text>
      <text x="150" y="278" textAnchor="middle" className={MUTED}>ID 108 · lat, long</text>
      <text x="150" y="304" textAnchor="middle" className={MUTED}>ID 121 · lat, long</text>
    </g>

    <g className="ri-edge ri-edge-one">
      <line x1="255" y1="260" x2="350" y2="260" className={LINE} strokeWidth="2" markerEnd={`url(#${markerId})`} />
    </g>

    <g className="ri-step ri-index">
      <rect x="350" y="150" width="220" height="220" rx="16" className="viz-box" strokeWidth="1.5" />
      <text x="460" y="185" textAnchor="middle" className={LABEL}>Reverse index</text>
      <text x="460" y="213" textAnchor="middle" className={MUTED}>partition 2</text>
      <line x1="375" y1="230" x2="545" y2="230" className="viz-thin" opacity="0.2" />
      <text x="460" y="258" textAnchor="middle" className={MUTED}>104 → lat, long</text>
      <text x="460" y="286" textAnchor="middle" className={MUTED}>108 → lat, long</text>
      <text x="460" y="314" textAnchor="middle" className={MUTED}>121 → lat, long</text>
      <text x="460" y="344" textAnchor="middle" className={MUTED}>Hash(place ID) = 2</text>
    </g>

    <g className="ri-edge ri-edge-two">
      <line x1="570" y1="260" x2="655" y2="260" className={LINE} strokeWidth="2" markerEnd={`url(#${markerId})`} />
    </g>

    <g className="ri-step ri-rebuild">
      <rect x="655" y="185" width="200" height="150" rx="16" className={DENSE} strokeWidth="1.5" />
      <text x="755" y="218" textAnchor="middle" className={LABEL}>Replacement server</text>
      <text x="755" y="252" textAnchor="middle" className={MUTED}>requests partition 2</text>
      <text x="755" y="280" textAnchor="middle" className={MUTED}>avoids full scan</text>
      <text x="755" y="308" textAnchor="middle" className={MUTED}>rebuilds locally</text>
    </g>

    <g className="ri-edge ri-edge-three">
      <line x1="755" y1="335" x2="755" y2="420" className={LINE} strokeWidth="2" markerEnd={`url(#${markerId})`} />
    </g>

    <g className="ri-step ri-tree">
      <rect x="635" y="420" width="240" height="64" rx="14" className={LEAF} strokeWidth="1.5" />
      <text x="755" y="447" textAnchor="middle" className={LABEL}>QuadTree partition 2</text>
      <text x="755" y="468" textAnchor="middle" className={MUTED}>ready for search traffic</text>
    </g>
      </>
    )}
  </Frame>
);
