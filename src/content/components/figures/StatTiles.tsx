import { useEffect, useRef } from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   StatTiles — capacity-estimate numbers that count up once scrolled into
   view, instead of sitting in a bullet list. Same "plays once in view"
   convention as the rest of the site's figures.
---------------------------------------------------------------------------- */

export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  color: string; // tailwind text-color class
}

export const StatTiles = ({ items, delay = 0 }: { items: StatItem[]; delay?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const numRefs = useRef(new Map<number, HTMLSpanElement>());

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const play = () => {
      items.forEach((item, i) => {
        const target = numRefs.current.get(i);
        if (!target) return;
        const counter = { v: 0 };
        gsap.to(counter, {
          v: item.value,
          duration: 1.3,
          delay: i * 0.08,
          ease: "power2.out",
          snap: { v: item.value >= 1000 ? 10 : 1 },
          onUpdate: () => {
            target.textContent = Math.round(counter.v).toLocaleString();
          },
        });
      });
    };

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          play();
          io.disconnect();
        }
      }),
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay }}
      className="not-prose my-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
    >
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5 flex flex-col gap-2">
            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${item.color}`} strokeWidth={1.75} />
            <p className="font-mono text-xl sm:text-2xl font-semibold text-foreground tabular-nums">
              <span
                ref={(el) => {
                  if (el) numRefs.current.set(i, el);
                }}
              >
                0
              </span>
              {item.suffix && <span className="text-muted-foreground text-sm sm:text-base ml-0.5">{item.suffix}</span>}
            </p>
            <p className="font-sans text-[11px] sm:text-xs text-muted-foreground leading-snug">{item.label}</p>
          </div>
        );
      })}
    </motion.div>
  );
};
