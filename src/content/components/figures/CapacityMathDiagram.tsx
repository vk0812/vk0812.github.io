import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   CapacityMathDiagram — walks through a capacity-estimation derivation
   (traffic, storage, bandwidth, cache, whatever groups a post needs) as an
   animated build-up instead of a wall of arithmetic in prose. Fully data
   driven, so it's reusable across any system design post that does back of
   the envelope math, same "plays once in view" convention as the rest of
   the site's figures.
---------------------------------------------------------------------------- */

export interface CapacityLine {
  expression: string;
  result: string;
}

export interface CapacityGroup {
  title: string;
  lines: CapacityLine[];
  note: string;
}

const CTRL = "font-mono text-[11px] tracking-widest h-7 px-2.5 inline-flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors rounded";
const CTRL_ON = "font-mono text-[11px] tracking-widest h-7 px-2.5 inline-flex items-center justify-center border border-foreground bg-foreground text-background rounded";

export const CapacityMathDiagram = ({
  groups,
  caption,
  delay = 0,
}: {
  groups: CapacityGroup[];
  caption?: string;
  delay?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef(new Map<string, HTMLDivElement>());
  const rateRef = useRef(1);
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [note, setNote] = useState(groups[0]?.note ?? "");
  const [activeIdx, setActiveIdx] = useState(0);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const lineEls = lineRefs.current;

    const build = () => {
      tlRef.current?.kill();
      lineEls.forEach((el) => gsap.set(el, { opacity: 0, y: 6 }));

      const tl = gsap.timeline();

      groups.forEach((group, gi) => {
        tl.add(() => setNote(group.note), gi === 0 ? 0 : ">");
        tl.add(() => setActiveIdx(gi), "<");
        group.lines.forEach((_, li) => {
          const el = lineEls.get(`${gi}-${li}`);
          if (el) tl.to(el, { opacity: 1, y: 0, duration: 0.35 }, li === 0 ? "<0.1" : "<0.15");
        });
        tl.to({}, { duration: 0.55 });
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
  }, []);

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
      <div ref={containerRef} className="rounded-2xl border border-border bg-muted/20 p-5 sm:p-8">
        <div className="grid sm:grid-cols-2 gap-4">
          {groups.map((group, gi) => (
            <div
              key={group.title}
              className={`rounded-xl border p-4 sm:p-5 transition-colors duration-300 ${
                activeIdx >= gi ? "border-foreground/25 bg-background/40" : "border-border/60 bg-background/20"
              }`}
            >
              <p className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                {group.title}
              </p>
              <div className="flex flex-col gap-2">
                {group.lines.map((line, li) => (
                  <div
                    key={li}
                    ref={(el) => {
                      if (el) lineRefs.current.set(`${gi}-${li}`, el);
                    }}
                    className="flex items-baseline justify-between gap-3 flex-wrap"
                  >
                    <span className="font-mono text-[12px] sm:text-[13px] text-muted-foreground">
                      {line.expression}
                    </span>
                    <span className="font-mono text-sm sm:text-base font-semibold text-foreground tabular-nums">
                      {line.result}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

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
      </div>
      {caption && (
        <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">
          {caption}
        </figcaption>
      )}
    </motion.figure>
  );
};
