import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { CheckCircle2 } from "lucide-react";

/* ----------------------------------------------------------------------------
   Blueprint concept animations for the "Designing a Payment System" post.
   Theme comes entirely from CSS vars (.viz / .dark .viz in index.css), so the
   same SVG reads black+blue in light mode and white+blue in dark mode.
   Each animation plays once when scrolled into view; a replay button restarts.
---------------------------------------------------------------------------- */

const NS = "http://www.w3.org/2000/svg";
type Api = {
  play: () => void; // (re)build timeline from scratch and play
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

/* ===========================================================================
   Shared figure wrapper: framer-motion entrance + in-view trigger + replay
=========================================================================== */
const CTRL =
  "font-mono text-xs tracking-widest h-8 px-3 inline-flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors rounded";
const CTRL_ON =
  "font-mono text-xs tracking-widest h-8 px-3 inline-flex items-center justify-center border border-foreground bg-foreground text-background rounded";

function VizFigure({
  caption,
  viewBox,
  maxW = "max-w-3xl",
  setup,
}: {
  caption: string;
  viewBox: string;
  maxW?: string;
  delay?: number; // accepted for API parity; not used for in-view entrance
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
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            doPlay();
            io.disconnect();
          }
        }),
      { threshold: 0.25 },
    );
    io.observe(svg);
    return () => {
      io.disconnect();
      api.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup]);

  const togglePlay = () => {
    const api = apiRef.current;
    if (!api) return;
    if (playing) {
      api.pause();
      setPlaying(false);
    } else {
      api.resume();
      setPlaying(true);
    }
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
          <button onClick={doPlay} className={CTRL}>
            ↻ REPLAY
          </button>
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
   PAYMENT INTENT STATE MACHINE — the intent advances left to right on the
   happy path (created -> requires_action -> processing -> succeeded), with
   cancelled and failed shown as the two terminal exits that branch off it.
   A traveling marker shows exactly one state is ever "current" at a time.
=========================================================================== */
function setupPaymentIntentStateMachine(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `sm-${uid}`,
    viewBox: "0 0 10 10",
    refX: 8,
    refY: 5,
    markerWidth: 6,
    markerHeight: 6,
    orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });
  const warnMarker = mk(defs, "marker", {
    id: `smw-${uid}`,
    viewBox: "0 0 10 10",
    refX: 8,
    refY: 5,
    markerWidth: 6,
    markerHeight: 6,
    orient: "auto-start-reverse",
  });
  mk(warnMarker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-warn" });

  const phase = mkText(svg, "", 450, 28, "viz-phase", "middle");

  type Box = { cx: number; cy: number; rect: SVGRectElement; ring?: SVGRectElement };
  const box = (
    cx: number,
    cy: number,
    label: string,
    sub: string,
    warn: boolean,
  ): Box => {
    const w = 150;
    const h = 90;
    const rect = mk(svg, "rect", {
      x: cx - w / 2,
      y: cy - h / 2,
      width: w,
      height: h,
      rx: 14,
      class: warn ? "viz-panel-warn" : "viz-box",
      opacity: 0,
    }) as SVGRectElement;
    const lbl = mkText(svg, label, cx, cy - 6, "viz-node-lbl", "middle") as SVGTextElement;
    const subLbl = mkText(svg, sub, cx, cy + 16, "viz-label-sm", "middle") as SVGTextElement;
    gsap.set([lbl, subLbl], { opacity: 0 });
    let ring: SVGRectElement | undefined;
    if (!warn) {
      ring = mk(svg, "rect", {
        x: cx - w / 2 - 6,
        y: cy - h / 2 - 6,
        width: w + 12,
        height: h + 12,
        rx: 18,
        class: "viz-blue",
        opacity: 0,
      }) as SVGRectElement;
    }
    return { cx, cy, rect: rect, ring };
  };

  const created = box(120, 110, "Created", "intent opens here", false);
  const requiresAction = box(340, 110, "Requires Action", "3D Secure or similar", false);
  const processing = box(560, 110, "Processing", "provider confirming", false);
  const succeeded = box(780, 110, "Succeeded", "final, never changes", false);
  const cancelled = box(340, 320, "Cancelled", "abandoned before completion", true);
  const failed = box(560, 320, "Failed", "provider declined", true);

  const allTexts = Array.from(svg.querySelectorAll("text")).filter((t) => t !== phase);
  const allBoxRects = [created.rect, requiresAction.rect, processing.rect, succeeded.rect, cancelled.rect, failed.rect];
  const rings = [created.ring, requiresAction.ring, processing.ring, succeeded.ring].filter(Boolean) as SVGRectElement[];

  const mkEdge = (x1: number, y1: number, x2: number, y2: number, warn: boolean) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const line = mk(svg, "line", {
      x1,
      y1,
      x2,
      y2,
      class: warn ? "viz-warn" : "viz-stroke",
      "marker-end": warn ? `url(#smw-${uid})` : `url(#sm-${uid})`,
      opacity: 0,
    }) as SVGLineElement;
    if (warn) line.style.strokeDasharray = "6 5";
    else line.style.strokeDasharray = String(len);
    return { line, len };
  };

  const e1 = mkEdge(195, 110, 265, 110, false);
  const e2 = mkEdge(415, 110, 485, 110, false);
  const e3 = mkEdge(635, 110, 705, 110, false);
  const e4 = mkEdge(340, 155, 340, 275, true);
  const e5 = mkEdge(560, 155, 560, 275, true);

  const dot = mk(svg, "circle", { cx: 120, cy: 110, r: 9, class: "viz-arrow-blue", opacity: 0 }) as SVGCircleElement;

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set(allTexts, { opacity: 0 });
    gsap.set(allBoxRects, { opacity: 0 });
    gsap.set(rings, { opacity: 0 });
    gsap.set(dot, { opacity: 0 });
    gsap.set(dot, { attr: { cx: 120, cy: 110 } });
    [e1, e2, e3].forEach((e) => {
      gsap.set(e.line, { opacity: 0 });
      e.line.style.strokeDashoffset = String(e.len);
    });
    [e4, e5].forEach((e) => gsap.set(e.line, { opacity: 0 }));

    tl = gsap.timeline();

    tl.add(() => {
      phase.textContent = "Every payment starts as a payment intent in the created state";
    });
    tl.to([created.rect], { opacity: 1, duration: 0.35 }, "<");
    tl.to(allTexts.filter((t) => t.textContent === "Created" || t.textContent === "intent opens here"), {
      opacity: 1,
      duration: 0.3,
    }, "<0.1");
    tl.to(dot, { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.7 });

    tl.add(() => {
      phase.textContent = "If the card needs extra verification, it moves to requires action";
    });
    tl.to(e1.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(e1.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(requiresAction.rect, { opacity: 1, duration: 0.35 }, "<0.1");
    tl.to(
      allTexts.filter((t) => t.textContent === "Requires Action" || t.textContent === "3D Secure or similar"),
      { opacity: 1, duration: 0.3 },
      "<0.1",
    );
    tl.to(dot, { attr: { cx: 340 }, duration: 0.4, ease: "power2.inOut" }, "<");
    tl.to({}, { duration: 0.4 });
    tl.add(() => {
      phase.textContent = "Abandoning the flow here, instead of continuing, moves it to cancelled";
    });
    tl.to(e4.line, { opacity: 1, duration: 0.3 }, "<");
    tl.to(cancelled.rect, { opacity: 1, duration: 0.35 }, "<0.1");
    tl.to(
      allTexts.filter((t) => t.textContent === "Cancelled" || t.textContent === "abandoned before completion"),
      { opacity: 1, duration: 0.3 },
      "<0.1",
    );
    tl.to({}, { duration: 0.7 });

    tl.add(() => {
      phase.textContent = "Once verification clears, it moves to processing while the provider confirms the charge";
    });
    tl.to(e2.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(e2.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(processing.rect, { opacity: 1, duration: 0.35 }, "<0.1");
    tl.to(
      allTexts.filter((t) => t.textContent === "Processing" || t.textContent === "provider confirming"),
      { opacity: 1, duration: 0.3 },
      "<0.1",
    );
    tl.to(dot, { attr: { cx: 560 }, duration: 0.4, ease: "power2.inOut" }, "<");
    tl.to({}, { duration: 0.4 });
    tl.add(() => {
      phase.textContent = "A decline from the provider moves it to failed instead";
    });
    tl.to(e5.line, { opacity: 1, duration: 0.3 }, "<");
    tl.to(failed.rect, { opacity: 1, duration: 0.35 }, "<0.1");
    tl.to(
      allTexts.filter((t) => t.textContent === "Failed" || t.textContent === "provider declined"),
      { opacity: 1, duration: 0.3 },
      "<0.1",
    );
    tl.to({}, { duration: 0.7 });

    tl.add(() => {
      phase.textContent = "A successful charge is the only door into succeeded, and it never changes again";
    });
    tl.to(e3.line, { opacity: 1, duration: 0.05 }, "<");
    tl.to(e3.line, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(succeeded.rect, { opacity: 1, duration: 0.35 }, "<0.1");
    tl.to(
      allTexts.filter((t) => t.textContent === "Succeeded" || t.textContent === "final, never changes"),
      { opacity: 1, duration: 0.3 },
      "<0.1",
    );
    tl.to(dot, { attr: { cx: 780 }, duration: 0.4, ease: "power2.inOut" }, "<");
    tl.to(succeeded.ring!, { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to(succeeded.ring!, { opacity: 0.25, duration: 0.6, yoyo: true, repeat: 3 });

    tl.timeScale(rate);
  };

  let rate = 1;
  play();

  return {
    play,
    pause: () => tl?.pause(),
    resume: () => tl?.play(),
    setRate: (r) => {
      rate = r;
      tl?.timeScale(r);
    },
    cleanup: () => tl?.kill(),
  };
}

export const PaymentIntentStateMachineDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure
    caption={caption}
    viewBox="0 0 900 420"
    maxW="max-w-3xl"
    delay={delay}
    setup={setupPaymentIntentStateMachine}
  />
);

/* ===========================================================================
   IDEMPOTENT RETRY — a request times out AFTER the provider already charged
   the card. The app cannot tell success from failure from the network error
   alone. It retries with the exact same idempotency key, and the provider
   returns the original stored result instead of charging a second time.
=========================================================================== */
function setupIdempotentRetry(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `ir-${uid}`,
    viewBox: "0 0 10 10",
    refX: 8,
    refY: 5,
    markerWidth: 6,
    markerHeight: 6,
    orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 28, "viz-phase", "middle");

  // Merchant App box
  mk(svg, "rect", { x: 340, y: 70, width: 220, height: 80, rx: 14, class: "viz-box" });
  const merchantLbl = mkText(svg, "Merchant App", 450, 104, "viz-node-lbl", "middle") as SVGTextElement;
  const merchantSub = mkText(svg, "sends charge, idem_abc123", 450, 124, "viz-label-sm", "middle") as SVGTextElement;

  // Payment Provider box
  mk(svg, "rect", { x: 340, y: 280, width: 220, height: 80, rx: 14, class: "viz-box" });
  mkText(svg, "Payment Provider", 450, 314, "viz-node-lbl", "middle");
  mkText(svg, "external service boundary", 450, 334, "viz-label-sm", "middle");

  // Card charged panel (right)
  const cardPanel = mk(svg, "rect", {
    x: 650,
    y: 280,
    width: 200,
    height: 80,
    rx: 14,
    class: "viz-panel",
    opacity: 0,
  }) as SVGRectElement;
  const cardLbl1 = mkText(svg, "Card Charged", 750, 314, "viz-node-lbl", "middle") as SVGTextElement;
  const cardLbl2 = mkText(svg, "$50.00, this really happened", 750, 334, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([cardLbl1, cardLbl2], { opacity: 0 });
  const connCard = mk(svg, "line", {
    x1: 560,
    y1: 320,
    x2: 650,
    y2: 320,
    class: "viz-stroke",
    "marker-end": `url(#ir-${uid})`,
    opacity: 0,
  }) as SVGLineElement;
  const connCardLen = 90;
  connCard.style.strokeDasharray = String(connCardLen);

  // Idempotency store panel (left)
  const idemPanel = mk(svg, "rect", {
    x: 60,
    y: 280,
    width: 190,
    height: 80,
    rx: 14,
    class: "viz-panel",
    opacity: 0,
  }) as SVGRectElement;
  const idemLbl1 = mkText(svg, "Idempotency Store", 155, 314, "viz-node-lbl", "middle") as SVGTextElement;
  const idemLbl2 = mkText(svg, "idem_abc123 -> succeeded", 155, 334, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([idemLbl1, idemLbl2], { opacity: 0 });
  const connIdem = mk(svg, "line", {
    x1: 340,
    y1: 320,
    x2: 250,
    y2: 320,
    class: "viz-stroke",
    "marker-end": `url(#ir-${uid})`,
    opacity: 0,
  }) as SVGLineElement;
  const connIdemLen = 90;
  connIdem.style.strokeDasharray = String(connIdemLen);

  // Central request/response channel
  const reqLine = mk(svg, "line", {
    x1: 450,
    y1: 150,
    x2: 450,
    y2: 280,
    class: "viz-stroke",
    "marker-end": `url(#ir-${uid})`,
    opacity: 0,
  }) as SVGLineElement;
  const reqLen = 130;
  reqLine.style.strokeDasharray = String(reqLen);

  const respFull = mk(svg, "line", {
    x1: 450,
    y1: 280,
    x2: 450,
    y2: 150,
    class: "viz-blue",
    "marker-end": `url(#ir-${uid})`,
    opacity: 0,
  }) as SVGLineElement;
  const respFullLen = 130;
  respFull.style.strokeDasharray = String(respFullLen);

  const respPartial = mk(svg, "line", {
    x1: 470,
    y1: 280,
    x2: 475,
    y2: 220,
    class: "viz-warn",
    opacity: 0,
  }) as SVGLineElement;
  respPartial.style.strokeDasharray = "6 5";
  const xmark = mkText(svg, "✕", 475, 202, "viz-warn-lbl", "middle") as SVGTextElement;
  gsap.set(xmark, { opacity: 0, fontSize: 22 });

  const timeoutLbl1 = mkText(svg, "No response arrives", 170, 200, "viz-warn-lbl", "middle") as SVGTextElement;
  const timeoutLbl2 = mkText(svg, "timeout, unknown result", 170, 218, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([timeoutLbl1, timeoutLbl2], { opacity: 0 });

  const retryLbl1 = mkText(svg, "Retries the request", 730, 200, "viz-node-lbl", "middle") as SVGTextElement;
  const retryLbl2 = mkText(svg, "same idempotency key", 730, 218, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([retryLbl1, retryLbl2], { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    merchantSub.textContent = "sends charge, idem_abc123";
    gsap.set([cardPanel, cardLbl1, cardLbl2, connCard], { opacity: 0 });
    gsap.set([idemPanel, idemLbl1, idemLbl2, connIdem], { opacity: 0 });
    gsap.set([reqLine, respFull, respPartial, xmark, timeoutLbl1, timeoutLbl2, retryLbl1, retryLbl2], { opacity: 0 });
    reqLine.style.strokeDashoffset = String(reqLen);
    respFull.style.strokeDashoffset = String(respFullLen);
    respPartial.style.strokeDashoffset = "40";

    tl = gsap.timeline();

    tl.add(() => {
      phase.textContent = "The merchant app sends a charge with idempotency key idem_abc123";
    });
    tl.to(reqLine, { opacity: 1, duration: 0.05 }, "<");
    tl.to(reqLine, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
    tl.to({}, { duration: 0.5 });

    tl.add(() => {
      phase.textContent = "The provider actually charges the card for $50.00";
    });
    tl.to(connCard, { opacity: 1, duration: 0.05 }, "<");
    tl.to(connCard, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([cardPanel, cardLbl1, cardLbl2], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.6 });

    tl.add(() => {
      phase.textContent = "But the connection drops before the response gets back";
    });
    tl.to(respPartial, { opacity: 1, duration: 0.05 }, "<");
    tl.to(respPartial, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(xmark, { opacity: 1, duration: 0.25 }, "<0.15");
    tl.to([timeoutLbl1, timeoutLbl2], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.add(() => {
      merchantSub.textContent = "no response, unsure if charged";
    });
    tl.to({}, { duration: 0.9 });

    tl.add(() => {
      phase.textContent = "It cannot tell success from failure, so it retries with the exact same key";
    });
    tl.set(reqLine, { opacity: 0, attr: { "stroke-dashoffset": reqLen } }, "<");
    tl.to(reqLine, { opacity: 1, duration: 0.05 }, "<");
    tl.to(reqLine, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
    tl.to([retryLbl1, retryLbl2], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => {
      phase.textContent = "The provider finds idem_abc123 already has a stored result from the first attempt";
    });
    tl.to(connIdem, { opacity: 1, duration: 0.05 }, "<");
    tl.to(connIdem, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([idemPanel, idemLbl1, idemLbl2], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.6 });

    tl.add(() => {
      phase.textContent = "It returns that original result instead of charging the card again";
    });
    tl.to(respFull, { opacity: 1, duration: 0.05 }, "<");
    tl.to(respFull, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
    tl.add(() => {
      merchantSub.textContent = "succeeded, charged exactly once";
    });

    tl.timeScale(rate);
  };

  let rate = 1;
  play();

  return {
    play,
    pause: () => tl?.pause(),
    resume: () => tl?.play(),
    setRate: (r) => {
      rate = r;
      tl?.timeScale(r);
    },
    cleanup: () => tl?.kill(),
  };
}

export const IdempotentRetryDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 400" maxW="max-w-3xl" delay={delay} setup={setupIdempotentRetry} />
);

/* ===========================================================================
   LEDGER POSTING TABLE — a static (no GSAP) double-entry example. Every
   event, including a refund, is a brand new pair of balanced rows. Nothing
   already written ever gets edited.
=========================================================================== */
interface LedgerRow {
  account: string;
  debit?: string;
  credit?: string;
}
interface LedgerEvent {
  title: string;
  rows: LedgerRow[];
  total: string;
}

const ledgerEvents: LedgerEvent[] = [
  {
    title: "Event 1, charge succeeds",
    rows: [
      { account: "Processor Receivable", debit: "$50.00" },
      { account: "Merchant Payable", credit: "$48.25" },
      { account: "Fee Revenue", credit: "$1.75" },
    ],
    total: "Debits $50.00 = Credits $50.00",
  },
  {
    title: "Event 2, refund issued",
    rows: [
      { account: "Merchant Payable", debit: "$48.25" },
      { account: "Fee Revenue", debit: "$1.75" },
      { account: "Processor Receivable", credit: "$50.00" },
    ],
    total: "Debits $50.00 = Credits $50.00",
  },
];

export const LedgerPostingTable = ({ caption, delay = 0 }: { caption: string; delay?: number }) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-10 mx-auto max-w-2xl"
  >
    <div className="rounded-2xl border border-border bg-muted/20 overflow-hidden">
      {ledgerEvents.map((event, ei) => (
        <div key={event.title} className={ei !== ledgerEvents.length - 1 ? "border-b border-border/60" : ""}>
          <div className="px-4 sm:px-6 py-3 bg-muted/30">
            <p className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {event.title}
            </p>
          </div>
          <div>
            {event.rows.map((row, ri) => (
              <div
                key={row.account}
                className={`flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 text-sm ${
                  ri !== event.rows.length - 1 ? "border-b border-border/30" : ""
                }`}
              >
                <span className="font-sans text-foreground">{row.account}</span>
                <div className="flex items-center gap-6 font-mono tabular-nums">
                  <span className="w-16 text-right text-foreground">{row.debit ?? ""}</span>
                  <span className="w-16 text-right text-blue-500 dark:text-blue-400">{row.credit ?? ""}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-muted/20">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" strokeWidth={2} />
            <span className="font-mono text-xs text-muted-foreground">{event.total}</span>
          </div>
        </div>
      ))}
    </div>
    {caption && (
      <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">{caption}</figcaption>
    )}
  </motion.figure>
);
