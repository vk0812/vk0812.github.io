import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

const NS = "http://www.w3.org/2000/svg";

type Api = {
  play: () => void;
  pause: () => void;
  resume: () => void;
  setRate: (rate: number) => void;
  cleanup: () => void;
};

function mk(root: Element, tag: string, attrs: Record<string, string | number> = {}) {
  const node = document.createElementNS(NS, tag);
  for (const key in attrs) node.setAttribute(key, String(attrs[key]));
  root.appendChild(node);
  return node;
}

function mkText(
  root: Element,
  value: string,
  x: number,
  y: number,
  className = "viz-label",
  anchor = "start"
) {
  const text = mk(root, "text", {
    x,
    y,
    class: className,
    "text-anchor": anchor,
  });
  text.textContent = value;
  return text;
}

const CONTROL =
  "font-mono text-xs tracking-widest h-8 px-3 inline-flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors rounded";
const CONTROL_ACTIVE =
  "font-mono text-xs tracking-widest h-8 px-3 inline-flex items-center justify-center border border-foreground bg-foreground text-background rounded";

function VizFigure({
  caption,
  setup,
}: {
  caption: string;
  delay?: number;
  setup: (svg: SVGSVGElement) => Api;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const apiRef = useRef<Api | null>(null);
  const rateRef = useRef(1);
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    if (!apiRef.current) return;
    apiRef.current.play();
    apiRef.current.setRate(rateRef.current);
    setPlaying(true);
  };

  useEffect(() => {
    if (!svgRef.current) return;
    const api = setup(svgRef.current);
    apiRef.current = api;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          play();
          observer.disconnect();
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(svgRef.current);
    return () => {
      observer.disconnect();
      api.cleanup();
    };
  }, [setup]);

  const toggle = () => {
    if (!apiRef.current) return;
    if (playing) {
      apiRef.current.pause();
      setPlaying(false);
    } else {
      apiRef.current.resume();
      setPlaying(true);
    }
  };

  const selectRate = (nextRate: number) => {
    rateRef.current = nextRate;
    setRate(nextRate);
    apiRef.current?.setRate(nextRate);
  };

  return (
    <motion.figure
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="mx-auto mb-8 max-w-3xl"
    >
      <div className="viz rounded-lg border border-border bg-card p-3 shadow-sm sm:p-5">
        <svg ref={svgRef} viewBox="0 0 900 390" preserveAspectRatio="xMidYMid meet" />
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button onClick={toggle} className={CONTROL} style={{ minWidth: "5.5rem" }}>
            {playing ? "❚❚ PAUSE" : "▶ PLAY"}
          </button>
          <button onClick={play} className={CONTROL}>
            ↻ REPLAY
          </button>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          {[0.5, 1, 2].map((value) => (
            <button
              key={value}
              onClick={() => selectRate(value)}
              className={rate === value ? CONTROL_ACTIVE : CONTROL}
            >
              {value}×
            </button>
          ))}
        </div>
      </div>
      <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
        {caption}
      </figcaption>
    </motion.figure>
  );
}

function setupBayesUpdate(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `bayes-${uid}`,
    viewBox: "0 0 10 10",
    refX: 8,
    refY: 5,
    markerWidth: 6,
    markerHeight: 6,
    orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 28, "viz-phase", "middle") as SVGTextElement;
  const panels = [
    mk(svg, "rect", { x: 40, y: 58, width: 240, height: 282, rx: 12, class: "viz-panel" }),
    mk(svg, "rect", { x: 330, y: 58, width: 240, height: 282, rx: 12, class: "viz-panel" }),
    mk(svg, "rect", { x: 620, y: 58, width: 240, height: 282, rx: 12, class: "viz-panel" }),
  ];

  const arrowOne = mk(svg, "line", {
    x1: 280,
    y1: 199,
    x2: 330,
    y2: 199,
    class: "viz-stroke",
    "marker-end": `url(#bayes-${uid})`,
    opacity: 0,
  }) as SVGLineElement;
  const arrowTwo = mk(svg, "line", {
    x1: 570,
    y1: 199,
    x2: 620,
    y2: 199,
    class: "viz-stroke",
    "marker-end": `url(#bayes-${uid})`,
    opacity: 0,
  }) as SVGLineElement;
  arrowOne.style.strokeDasharray = "50";
  arrowTwo.style.strokeDasharray = "50";

  const priorTitle = mkText(svg, "PRIOR", 160, 88, "viz-node-lbl", "middle") as SVGTextElement;
  const evidenceTitle = mkText(svg, "EVIDENCE", 450, 88, "viz-node-lbl", "middle") as SVGTextElement;
  const posteriorTitle = mkText(svg, "POSTERIOR", 740, 88, "viz-node-lbl", "middle") as SVGTextElement;

  const priorTrack = mk(svg, "rect", {
    x: 100,
    y: 120,
    width: 120,
    height: 170,
    rx: 7,
    class: "viz-panel",
  });
  const priorBar = mk(svg, "rect", {
    x: 100,
    y: 290,
    width: 120,
    height: 0,
    rx: 7,
    class: "viz-cell",
  }) as SVGRectElement;
  const priorValue = mkText(svg, "20% spam", 160, 318, "viz-num", "middle") as SVGTextElement;

  const spamLabel = mkText(svg, "if spam", 400, 116, "viz-label-sm", "middle") as SVGTextElement;
  const cleanLabel = mkText(svg, "if not spam", 500, 116, "viz-label-sm", "middle") as SVGTextElement;
  const spamTrack = mk(svg, "rect", {
    x: 365,
    y: 130,
    width: 70,
    height: 160,
    rx: 7,
    class: "viz-panel",
  });
  const cleanTrack = mk(svg, "rect", {
    x: 465,
    y: 130,
    width: 70,
    height: 160,
    rx: 7,
    class: "viz-panel",
  });
  const spamEvidence = mk(svg, "rect", {
    x: 365,
    y: 290,
    width: 70,
    height: 0,
    rx: 7,
    class: "viz-cell",
  }) as SVGRectElement;
  const cleanEvidence = mk(svg, "rect", {
    x: 465,
    y: 290,
    width: 70,
    height: 0,
    rx: 7,
    class: "viz-ghost",
  }) as SVGRectElement;
  const spamJoint = mkText(svg, "15% joint", 400, 318, "viz-num-pos", "middle") as SVGTextElement;
  const cleanJoint = mkText(svg, "8% joint", 500, 318, "viz-label-sm", "middle") as SVGTextElement;

  const posteriorTrack = mk(svg, "rect", {
    x: 680,
    y: 120,
    width: 120,
    height: 170,
    rx: 7,
    class: "viz-panel",
  });
  const posteriorBar = mk(svg, "rect", {
    x: 680,
    y: 290,
    width: 120,
    height: 0,
    rx: 7,
    class: "viz-cell",
  }) as SVGRectElement;
  const posteriorValue = mkText(svg, "65.2% spam", 740, 318, "viz-num-pos", "middle") as SVGTextElement;

  const allStatic = [
    ...panels,
    priorTitle,
    evidenceTitle,
    posteriorTitle,
    priorTrack,
    spamTrack,
    cleanTrack,
    posteriorTrack,
    spamLabel,
    cleanLabel,
  ];
  const allValues = [priorValue, spamJoint, cleanJoint, posteriorValue];
  gsap.set(allStatic, { opacity: 0 });
  gsap.set(allValues, { opacity: 0 });

  let timeline: gsap.core.Timeline | null = null;
  let rate = 1;

  const play = () => {
    timeline?.kill();
    phase.textContent = "";
    arrowOne.style.strokeDashoffset = "50";
    arrowTwo.style.strokeDashoffset = "50";
    gsap.set([arrowOne, arrowTwo], { opacity: 0 });
    gsap.set(allStatic, { opacity: 0 });
    gsap.set(allValues, { opacity: 0 });
    gsap.set(priorBar, { attr: { y: 290, height: 0 }, opacity: 0.85 });
    gsap.set(spamEvidence, { attr: { y: 290, height: 0 }, opacity: 0.85 });
    gsap.set(cleanEvidence, { attr: { y: 290, height: 0 }, opacity: 0.8 });
    gsap.set(posteriorBar, { attr: { y: 290, height: 0 }, opacity: 0.85 });

    timeline = gsap.timeline();
    timeline.to(panels, { opacity: 1, duration: 0.3, stagger: 0.08 });

    timeline.add(() => {
      phase.textContent = "Start with the base rate, 20% of messages are spam";
    });
    timeline.to([priorTitle, priorTrack], { opacity: 1, duration: 0.25 }, "<");
    timeline.to(priorBar, { attr: { y: 256, height: 34 }, duration: 0.55, ease: "power2.out" });
    timeline.to(priorValue, { opacity: 1, duration: 0.25 }, "<0.2");
    timeline.to({}, { duration: 0.8 });

    timeline.add(() => {
      phase.textContent = "The word free appears in 75% of spam and 10% of other messages";
    });
    timeline.to(arrowOne, { opacity: 1, duration: 0.05 }, "<");
    timeline.to(arrowOne, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    timeline.to(
      [evidenceTitle, spamLabel, cleanLabel, spamTrack, cleanTrack],
      { opacity: 1, duration: 0.25 },
      "<0.1"
    );
    timeline.to(
      spamEvidence,
      { attr: { y: 170, height: 120 }, duration: 0.55, ease: "power2.out" },
      "<0.1"
    );
    timeline.to(
      cleanEvidence,
      { attr: { y: 274, height: 16 }, duration: 0.55, ease: "power2.out" },
      "<"
    );
    timeline.to({}, { duration: 0.7 });

    timeline.add(() => {
      phase.textContent = "The matching paths contain 15% spam and 8% other messages";
    });
    timeline.to([spamJoint, cleanJoint], { opacity: 1, duration: 0.3, stagger: 0.08 }, "<");
    timeline.to({}, { duration: 0.9 });

    timeline.add(() => {
      phase.textContent = "Normalize the 23% that survived, the posterior becomes 65.2%";
    });
    timeline.to(arrowTwo, { opacity: 1, duration: 0.05 }, "<");
    timeline.to(arrowTwo, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    timeline.to([posteriorTitle, posteriorTrack], { opacity: 1, duration: 0.25 }, "<0.1");
    timeline.to(
      posteriorBar,
      { attr: { y: 179.13, height: 110.87 }, duration: 0.65, ease: "power2.out" },
      "<0.1"
    );
    timeline.to(posteriorValue, { opacity: 1, duration: 0.3 }, "<0.25");
    timeline.to(posteriorBar, { opacity: 0.45, duration: 0.5, yoyo: true, repeat: 2 });
    timeline.timeScale(rate);
  };

  return {
    play,
    pause: () => timeline?.pause(),
    resume: () => timeline?.play(),
    setRate: (nextRate) => {
      rate = nextRate;
      timeline?.timeScale(nextRate);
    },
    cleanup: () => timeline?.kill(),
  };
}

export const BayesUpdateDiagram = ({
  caption,
  delay,
}: {
  caption: string;
  delay?: number;
}) => <VizFigure caption={caption} delay={delay} setup={setupBayesUpdate} />;
