import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   UrlSqueeze — the long URL visibly compresses into the short one, with a
   live character-count tick-down. A five-second hook before the requirements
   section, not a diagram, just sets the tone.
---------------------------------------------------------------------------- */

export const UrlSqueeze = ({
  longUrl,
  shortUrl,
  delay = 0,
}: {
  longUrl: string;
  shortUrl: string;
  delay?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const longRef = useRef<HTMLDivElement>(null);
  const shortRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(longUrl.length);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const play = () => {
      const counter = { v: longUrl.length };
      gsap.set(shortRef.current, { opacity: 0, scale: 0.85 });
      const tl = gsap.timeline();
      tl.to(counter, {
        v: shortUrl.length,
        duration: 1.1,
        ease: "power2.inOut",
        onUpdate: () => setCount(Math.round(counter.v)),
      });
      tl.to(longRef.current, { opacity: 0.35, scale: 0.96, duration: 0.4 }, "<0.2");
      tl.to(shortRef.current, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" }, ">-0.2");
    };

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          play();
          io.disconnect();
        }
      }),
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [longUrl, shortUrl]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay }}
      className="not-prose my-10 rounded-2xl border border-border bg-muted/20 p-6 sm:p-10 flex flex-col items-center gap-5"
    >
      <div ref={longRef} className="font-mono text-xs sm:text-sm text-foreground bg-background border border-border rounded-full px-4 py-2 max-w-full truncate">
        {longUrl}
      </div>
      <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" strokeWidth={1.75} />
      <div ref={shortRef} className="font-mono text-sm sm:text-base font-semibold text-foreground bg-background border border-border rounded-full px-5 py-2.5">
        {shortUrl}
      </div>
      <p className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground tabular-nums">
        {count} characters
      </p>
    </motion.div>
  );
};
