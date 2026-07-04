import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animations for "Designing Instagram". Same shell as
   animations/url-shortener/ConceptViz.tsx, theme comes entirely from CSS vars
   (.viz / .dark .viz in index.css), plays once when scrolled into view.
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
   FAN-OUT ON WRITE — a new photo gets pushed straight into every follower's
   precomputed News Feed the moment it's posted, instead of being assembled
   at read time.
=========================================================================== */
function setupFeedFanout(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `ff-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 24, "viz-phase", "middle");

  mk(svg, "rect", { x: 350, y: 40, width: 200, height: 50, rx: 8, class: "viz-box" });
  mkText(svg, "@lena posts a photo", 450, 70, "viz-node-lbl", "middle");

  const arrow1 = mk(svg, "line", {
    x1: 450, y1: 90, x2: 450, y2: 148, class: "viz-stroke", "marker-end": `url(#ff-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const len1 = 58;
  arrow1.style.strokeDasharray = String(len1);

  const svcBox = mk(svg, "rect", { x: 345, y: 150, width: 210, height: 50, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const svcLbl = mkText(svg, "Feed Generation Service", 450, 180, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(svcLbl, { opacity: 0 });

  const lookupLbl = mkText(svg, "looks up everyone who follows @lena", 450, 210, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set(lookupLbl, { opacity: 0 });

  const lanes = [
    { x: 230, follower: "Follower A" },
    { x: 670, follower: "Follower B" },
  ];

  type Lane = {
    arrowFork: SVGLineElement; lenFork: number;
    feedBox: SVGRectElement; feedRing: SVGRectElement; feedLbl1: SVGTextElement; feedLbl2: SVGTextElement;
  };

  const laneEls: Lane[] = lanes.map(({ x, follower }) => {
    const x1 = x < 450 ? 410 : 490;
    const arrowFork = mk(svg, "line", {
      x1, y1: 200, x2: x, y2: 268, class: "viz-blue", "marker-end": `url(#ff-${uid})`, opacity: 0,
    }) as SVGLineElement;
    const lenFork = Math.hypot(x - x1, 268 - 200);
    arrowFork.style.strokeDasharray = String(lenFork);

    const feedRing = mk(svg, "rect", {
      x: x - 101, y: 264, width: 202, height: 72, rx: 12, class: "viz-blue", fill: "none", opacity: 0,
    }) as SVGRectElement;
    const feedBox = mk(svg, "rect", {
      x: x - 95, y: 270, width: 190, height: 60, rx: 8, class: "viz-panel", opacity: 0,
    }) as SVGRectElement;
    const feedLbl1 = mkText(svg, `${follower}'s UserNewsFeed`, x, 292, "viz-node-lbl", "middle") as SVGTextElement;
    const feedLbl2 = mkText(svg, "new row prepended", x, 310, "viz-label-sm", "middle") as SVGTextElement;
    gsap.set([feedLbl1, feedLbl2], { opacity: 0 });

    return { arrowFork, lenFork, feedBox, feedRing, feedLbl1, feedLbl2 };
  });

  const doneLbl = mkText(svg, "BOTH FEEDS ARE READY BEFORE EITHER FOLLOWER ASKS", 450, 372, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(doneLbl, { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([arrow1, svcBox, svcLbl, lookupLbl, doneLbl], { opacity: 0 });
    arrow1.style.strokeDashoffset = String(len1);
    laneEls.forEach((l) => {
      gsap.set([l.arrowFork, l.feedBox, l.feedRing, l.feedLbl1, l.feedLbl2], { opacity: 0 });
      l.arrowFork.style.strokeDashoffset = String(l.lenFork);
    });

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "A user posts a new photo"; });
    tl.to({}, { duration: 0.35 });

    tl.add(() => { phase.textContent = "The write reaches the Feed Generation Service"; });
    tl.to(arrow1, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow1, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([svcBox, svcLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "It looks up every follower of this user"; });
    tl.to(lookupLbl, { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "The photo is pushed straight into each follower's precomputed feed"; });
    laneEls.forEach((l, i) => {
      tl.to(l.arrowFork, { opacity: 1, duration: 0.05 }, i === 0 ? "<" : "<0.1");
      tl.to(l.arrowFork, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
      tl.to([l.feedBox, l.feedLbl1, l.feedLbl2], { opacity: 1, duration: 0.3 }, "<0.1");
    });
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "No query-time assembly left, the feed is already sitting there on read"; });
    tl.to([laneEls[0].feedRing, laneEls[1].feedRing], { opacity: 1, duration: 0.3 }, "<");
    tl.to(doneLbl, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to([laneEls[0].feedRing, laneEls[1].feedRing], { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });

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

export const FeedFanoutDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 390" maxW="max-w-2xl" delay={delay} setup={setupFeedFanout} />
);

/* ===========================================================================
   UPLOAD & THUMBNAIL PIPELINE — a photo's original bytes and its generated
   thumbnails take different paths into object storage, and a CDN sits in
   front of both so repeat views never reach origin storage again.
=========================================================================== */
function setupUploadPipeline(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `up-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 24, "viz-phase", "middle");

  mk(svg, "rect", { x: 360, y: 40, width: 180, height: 50, rx: 8, class: "viz-box" });
  mkText(svg, "Client uploads photo", 450, 70, "viz-node-lbl", "middle");

  const arrow1 = mk(svg, "line", {
    x1: 450, y1: 90, x2: 450, y2: 148, class: "viz-stroke", "marker-end": `url(#up-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const len1 = 58;
  arrow1.style.strokeDasharray = String(len1);

  const appBox = mk(svg, "rect", { x: 365, y: 150, width: 170, height: 50, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const appLbl = mkText(svg, "Write App Server", 450, 180, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(appLbl, { opacity: 0 });

  const arrowOrig = mk(svg, "line", {
    x1: 410, y1: 200, x2: 230, y2: 258, class: "viz-blue", "marker-end": `url(#up-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenOrig = Math.hypot(410 - 230, 258 - 200);
  arrowOrig.style.strokeDasharray = String(lenOrig);

  const origBox = mk(svg, "rect", { x: 140, y: 260, width: 180, height: 56, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const origLbl1 = mkText(svg, "Object Storage", 230, 282, "viz-node-lbl", "middle") as SVGTextElement;
  const origLbl2 = mkText(svg, "original bytes", 230, 300, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([origLbl1, origLbl2], { opacity: 0 });

  const arrowThumb = mk(svg, "line", {
    x1: 490, y1: 200, x2: 670, y2: 258, class: "viz-blue", "marker-end": `url(#up-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenThumb = Math.hypot(670 - 490, 258 - 200);
  arrowThumb.style.strokeDasharray = String(lenThumb);

  const thumbSvcBox = mk(svg, "rect", { x: 580, y: 260, width: 180, height: 50, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const thumbSvcLbl = mkText(svg, "Thumbnail Service", 670, 290, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(thumbSvcLbl, { opacity: 0 });

  const arrow2 = mk(svg, "line", {
    x1: 670, y1: 310, x2: 670, y2: 358, class: "viz-stroke", "marker-end": `url(#up-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const len2 = 48;
  arrow2.style.strokeDasharray = String(len2);

  const thumbStoreBox = mk(svg, "rect", { x: 580, y: 360, width: 180, height: 56, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const thumbStoreLbl1 = mkText(svg, "Object Storage", 670, 382, "viz-node-lbl", "middle") as SVGTextElement;
  const thumbStoreLbl2 = mkText(svg, "resized thumbnails", 670, 400, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([thumbStoreLbl1, thumbStoreLbl2], { opacity: 0 });

  const arrowCdnL = mk(svg, "line", {
    x1: 280, y1: 316, x2: 410, y2: 448, class: "viz-stroke", "marker-end": `url(#up-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenCdnL = Math.hypot(410 - 280, 448 - 316);
  arrowCdnL.style.strokeDasharray = String(lenCdnL);

  const arrowCdnR = mk(svg, "line", {
    x1: 620, y1: 416, x2: 490, y2: 448, class: "viz-stroke", "marker-end": `url(#up-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenCdnR = Math.hypot(620 - 490, 448 - 416);
  arrowCdnR.style.strokeDasharray = String(lenCdnR);

  const cdnRing = mk(svg, "rect", { x: 356, y: 444, width: 188, height: 60, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const cdnBox = mk(svg, "rect", { x: 362, y: 450, width: 176, height: 48, rx: 8, class: "viz-panel", opacity: 0 }) as SVGRectElement;
  const cdnLbl = mkText(svg, "CDN caches both at the edge", 450, 480, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set(cdnLbl, { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([arrow1, appBox, appLbl, arrowOrig, origBox, origLbl1, origLbl2, arrowThumb, thumbSvcBox, thumbSvcLbl,
      arrow2, thumbStoreBox, thumbStoreLbl1, thumbStoreLbl2, arrowCdnL, arrowCdnR, cdnBox, cdnRing, cdnLbl], { opacity: 0 });
    arrow1.style.strokeDashoffset = String(len1);
    arrowOrig.style.strokeDashoffset = String(lenOrig);
    arrowThumb.style.strokeDashoffset = String(lenThumb);
    arrow2.style.strokeDashoffset = String(len2);
    arrowCdnL.style.strokeDashoffset = String(lenCdnL);
    arrowCdnR.style.strokeDashoffset = String(lenCdnR);

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "A client uploads a new photo"; });
    tl.to({}, { duration: 0.35 });

    tl.add(() => { phase.textContent = "The write path takes the request"; });
    tl.to(arrow1, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow1, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([appBox, appLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "The original bytes go straight to object storage"; });
    tl.to(arrowOrig, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowOrig, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([origBox, origLbl1, origLbl2], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "In parallel, a Thumbnail Service generates smaller sizes for feeds and previews"; });
    tl.to(arrowThumb, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowThumb, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([thumbSvcBox, thumbSvcLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Those thumbnails land in object storage too, alongside the original"; });
    tl.to(arrow2, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow2, { strokeDashoffset: 0, duration: 0.25, ease: "none" }, "<");
    tl.to([thumbStoreBox, thumbStoreLbl1, thumbStoreLbl2], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "A CDN fronts both, so repeat views never reach origin storage again"; });
    tl.to([arrowCdnL, arrowCdnR], { opacity: 1, duration: 0.05 }, "<");
    tl.to([arrowCdnL, arrowCdnR], { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
    tl.to([cdnBox, cdnLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(cdnRing, { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to(cdnRing, { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });

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

export const PhotoUploadDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 520" maxW="max-w-2xl" delay={delay} setup={setupUploadPipeline} />
);
