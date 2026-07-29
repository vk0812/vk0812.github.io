import { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

const cleanId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "");

const setupSeatHoldRace = (svg: SVGSVGElement, markerId: string) => {
  const nodes = svg.querySelectorAll(".tm-node");
  const edges = svg.querySelectorAll(".tm-edge");
  const phase = svg.querySelector<SVGTextElement>(".tm-phase");
  const held = svg.querySelectorAll(".tm-held");
  const rejected = svg.querySelectorAll(".tm-rejected");
  const confirmed = svg.querySelectorAll(".tm-confirmed");

  gsap.set(nodes, { opacity: 0, scale: 0.86, transformOrigin: "center" });
  gsap.set(edges, { opacity: 0 });
  gsap.set(held, { opacity: 0 });
  gsap.set(rejected, { opacity: 0 });
  gsap.set(confirmed, { opacity: 0 });

  const tl = gsap.timeline();
  const say = (message: string) =>
    tl.add(() => {
      if (phase) phase.textContent = message;
    });

  say("Two fans choose the same pair of seats");
  tl.to(svg.querySelectorAll(".tm-fans"), { opacity: 1, scale: 1, duration: 0.4, stagger: 0.1, ease: "back.out(1.5)" });
  tl.to(svg.querySelectorAll(".tm-request"), { opacity: 1, duration: 0.3 }, ">");
  tl.to(svg.querySelectorAll(".tm-hold"), { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }, ">");
  tl.to({}, { duration: 0.8 });

  say("One atomic check holds B12 and B13 together for Fan A");
  tl.to(svg.querySelectorAll(".tm-seat-edge"), { opacity: 1, duration: 0.3 });
  tl.to(svg.querySelectorAll(".tm-seats"), { opacity: 1, scale: 1, duration: 0.4, stagger: 0.12, ease: "back.out(1.5)" }, ">");
  tl.to(held, { opacity: 1, duration: 0.3 }, ">");
  tl.to({}, { duration: 0.8 });

  say("Fan B gets one clean conflict instead of half a booking");
  tl.to(svg.querySelectorAll(".tm-conflict"), { opacity: 1, duration: 0.3 });
  tl.to(rejected, { opacity: 1, duration: 0.3 }, ">");
  tl.to({}, { duration: 0.8 });

  say("Payment confirms the booking, or the hold expires and seats return");
  tl.to(svg.querySelectorAll(".tm-payment-edge"), { opacity: 1, duration: 0.3 });
  tl.to(svg.querySelectorAll(".tm-payment"), { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }, ">");
  tl.to(confirmed, { opacity: 1, duration: 0.3 }, ">");

  return tl;
};

export const SeatHoldRaceDiagram = ({ caption, delay = 0 }: { caption: string; delay?: number }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const markerId = `ticketmaster-arrow-${cleanId(useId())}`;
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const timeline = setupSeatHoldRace(svg, markerId);
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
  }, [markerId]);

  const toggle = () => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    if (timeline.progress() >= 1) timeline.restart();
    else if (playing) timeline.pause();
    else timeline.play();
    setPlaying(!playing || timeline.progress() >= 1);
  };

  const replay = () => {
    timelineRef.current?.restart();
    setPlaying(true);
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
      transition={{ duration: 0.4, delay }}
      className="not-prose my-10 mx-auto max-w-3xl"
    >
      <div className="viz rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
        <svg ref={svgRef} viewBox="0 0 900 520" className="w-full h-auto" role="img" aria-label={caption}>
          <defs>
            <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" className="viz-arrow-ink" />
            </marker>
          </defs>

          <text x="450" y="34" textAnchor="middle" className="viz-phase tm-phase">
            Two fans choose the same pair of seats
          </text>

          <g className="tm-edge tm-request">
            <line x1="194" y1="164" x2="302" y2="230" className="viz-thin" strokeWidth="2" markerEnd={`url(#${markerId})`} />
            <line x1="194" y1="356" x2="302" y2="290" className="viz-thin" strokeWidth="2" markerEnd={`url(#${markerId})`} />
          </g>
          <g className="tm-edge tm-seat-edge">
            <line x1="488" y1="242" x2="590" y2="176" className="viz-thin" strokeWidth="2" markerEnd={`url(#${markerId})`} />
            <line x1="488" y1="278" x2="590" y2="344" className="viz-thin" strokeWidth="2" markerEnd={`url(#${markerId})`} />
          </g>
          <g className="tm-edge tm-conflict">
            <line x1="302" y1="300" x2="194" y2="366" className="viz-thin" strokeWidth="2" markerEnd={`url(#${markerId})`} />
          </g>
          <g className="tm-edge tm-payment-edge">
            <line x1="395" y1="323" x2="395" y2="394" className="viz-thin" strokeWidth="2" markerEnd={`url(#${markerId})`} />
          </g>

          <g className="tm-node tm-fans">
            <rect x="54" y="112" width="140" height="104" rx="16" className="viz-box" strokeWidth="1.5" />
            <text x="124" y="151" textAnchor="middle" className="viz-label">Fan A</text>
            <text x="124" y="178" textAnchor="middle" className="viz-label-sm">wants B12, B13</text>
          </g>
          <g className="tm-node tm-fans">
            <rect x="54" y="304" width="140" height="104" rx="16" className="viz-box" strokeWidth="1.5" />
            <text x="124" y="343" textAnchor="middle" className="viz-label">Fan B</text>
            <text x="124" y="370" textAnchor="middle" className="viz-label-sm">wants B12, B13</text>
            <text x="124" y="398" textAnchor="middle" className="viz-warn-lbl tm-rejected">pick again</text>
          </g>

          <g className="tm-node tm-hold">
            <rect x="302" y="205" width="186" height="118" rx="16" className="viz-box" strokeWidth="1.5" />
            <text x="395" y="244" textAnchor="middle" className="viz-label">Seat Hold Service</text>
            <text x="395" y="271" textAnchor="middle" className="viz-label-sm">all seats or none</text>
            <text x="395" y="298" textAnchor="middle" className="viz-label-sm">five-minute lease</text>
          </g>

          <g className="tm-node tm-seats">
            <rect x="590" y="122" width="220" height="106" rx="16" className="viz-panel" strokeWidth="1.5" />
            <text x="700" y="160" textAnchor="middle" className="viz-label">Seat B12</text>
            <text x="700" y="191" textAnchor="middle" className="viz-label-sm tm-held">held by Fan A</text>
          </g>
          <g className="tm-node tm-seats">
            <rect x="590" y="292" width="220" height="106" rx="16" className="viz-panel" strokeWidth="1.5" />
            <text x="700" y="330" textAnchor="middle" className="viz-label">Seat B13</text>
            <text x="700" y="361" textAnchor="middle" className="viz-label-sm tm-held">held by Fan A</text>
          </g>

          <g className="tm-node tm-payment">
            <rect x="290" y="394" width="210" height="84" rx="16" className="viz-box" strokeWidth="1.5" />
            <text x="395" y="428" textAnchor="middle" className="viz-label">Payment provider</text>
            <text x="395" y="456" textAnchor="middle" className="viz-label-sm tm-confirmed">confirm sale or release</text>
          </g>
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
