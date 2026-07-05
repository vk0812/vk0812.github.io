import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ----------------------------------------------------------------------------
   Blueprint concept animation for "Designing Dropbox". Same shell as
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
   PRE-SIGNED UPLOAD — the Block Server hands out a URL instead of taking the
   bytes itself, so the chunk travels straight from the client to Block
   Storage in one hop instead of two.
=========================================================================== */
function setupPresignedUpload(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `pu-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });
  const markerBlue = mk(defs, "marker", {
    id: `pub-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(markerBlue, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-blue" });

  const phase = mkText(svg, "", 450, 24, "viz-phase", "middle");

  // Client
  mk(svg, "rect", { x: 360, y: 50, width: 180, height: 50, rx: 8, class: "viz-box" });
  mkText(svg, "Client", 450, 80, "viz-node-lbl", "middle");

  // client -> block server (request)
  const arrowDown = mk(svg, "line", {
    x1: 420, y1: 100, x2: 420, y2: 160, class: "viz-stroke", "marker-end": `url(#pu-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenDown = 60;
  arrowDown.style.strokeDasharray = String(lenDown);

  // Block Server
  const blockSvcBox = mk(svg, "rect", { x: 360, y: 160, width: 180, height: 50, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const blockSvcLbl = mkText(svg, "Block Server", 450, 190, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(blockSvcLbl, { opacity: 0 });

  const checkLbl = mkText(svg, "checks metadata for this chunk's hash", 450, 246, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set(checkLbl, { opacity: 0 });

  // block server -> client (pre-signed URL back)
  const arrowUp = mk(svg, "line", {
    x1: 480, y1: 160, x2: 480, y2: 100, class: "viz-blue", "marker-end": `url(#pub-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenUp = 60;
  arrowUp.style.strokeDasharray = String(lenUp);
  const urlLbl = mkText(svg, "pre-signed URL", 505, 134, "viz-label-sm", "start") as SVGTextElement;
  gsap.set(urlLbl, { opacity: 0 });

  // Block Storage (right side)
  const storageBox = mk(svg, "rect", { x: 660, y: 185, width: 180, height: 50, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const storageLbl = mkText(svg, "Block Storage", 750, 215, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(storageLbl, { opacity: 0 });

  // client -> block storage, direct, bypassing the block server entirely
  const bypass = mk(svg, "line", {
    x1: 540, y1: 70, x2: 660, y2: 210, class: "viz-blue", "marker-end": `url(#pub-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenBypass = Math.hypot(660 - 540, 210 - 70);
  bypass.style.strokeDasharray = String(lenBypass);

  const skipRing = mk(svg, "rect", { x: 354, y: 154, width: 192, height: 62, rx: 12, class: "viz-warn", fill: "none", opacity: 0 }) as SVGRectElement;
  const skipLbl = mkText(svg, "bytes never pass through here", 450, 268, "viz-warn-lbl", "middle") as SVGTextElement;
  gsap.set(skipLbl, { opacity: 0 });

  // Metadata Server (bottom)
  const metaBox = mk(svg, "rect", { x: 350, y: 340, width: 240, height: 50, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const metaLbl = mkText(svg, "Metadata Server", 470, 370, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(metaLbl, { opacity: 0 });

  const arrowToMeta = mk(svg, "line", {
    x1: 705, y1: 235, x2: 588, y2: 338, class: "viz-stroke", "marker-end": `url(#pu-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenToMeta = Math.hypot(705 - 588, 338 - 235);
  arrowToMeta.style.strokeDasharray = String(lenToMeta);

  const metaRing = mk(svg, "rect", { x: 344, y: 334, width: 252, height: 62, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const doneLbl1 = mkText(svg, "Chunk hash + location written to metadata", 470, 428, "viz-node-lbl", "middle") as SVGTextElement;
  const doneLbl2 = mkText(svg, "now discoverable by every other device", 470, 448, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([doneLbl1, doneLbl2], { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([arrowDown, blockSvcBox, blockSvcLbl, checkLbl, arrowUp, urlLbl, storageBox, storageLbl,
      bypass, skipRing, skipLbl, metaBox, metaLbl, arrowToMeta, metaRing, doneLbl1, doneLbl2], { opacity: 0 });
    arrowDown.style.strokeDashoffset = String(lenDown);
    arrowUp.style.strokeDashoffset = String(lenUp);
    bypass.style.strokeDashoffset = String(lenBypass);
    arrowToMeta.style.strokeDashoffset = String(lenToMeta);

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "A device has a new chunk to upload"; });
    tl.to({}, { duration: 0.35 });

    tl.add(() => { phase.textContent = "It asks the Block Server for a place to put it"; });
    tl.to(arrowDown, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowDown, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([blockSvcBox, blockSvcLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "The Block Server checks the chunk's hash against metadata first"; });
    tl.to(checkLbl, { opacity: 1, duration: 0.3 }, "<");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "No match, so it hands back a pre-signed URL instead of accepting the bytes"; });
    tl.to(arrowUp, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowUp, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to(urlLbl, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "The client uploads the chunk straight to Block Storage with that URL"; });
    tl.to(bypass, { opacity: 1, duration: 0.05 }, "<");
    tl.to([storageBox, storageLbl], { opacity: 1, duration: 0.3 }, "<");
    tl.to(bypass, { strokeDashoffset: 0, duration: 0.4, ease: "none" }, "<");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "The Block Server never sees the bytes, only the request and the hash check"; });
    tl.to(skipRing, { opacity: 1, duration: 0.3 }, "<");
    tl.to(skipLbl, { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(skipRing, { opacity: 0.3, duration: 0.5, yoyo: true, repeat: 1 });
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Once storage confirms the write, the chunk's hash and location land in the Metadata Server"; });
    tl.to(arrowToMeta, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowToMeta, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, "<");
    tl.to([metaBox, metaLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "That's the only trace the upload needs to leave behind"; });
    tl.to(metaRing, { opacity: 1, duration: 0.3 }, "<");
    tl.to([doneLbl1, doneLbl2], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(metaRing, { opacity: 0.3, duration: 0.6, yoyo: true, repeat: 2 });

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

export const PresignedUploadDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 480" maxW="max-w-2xl" delay={delay} setup={setupPresignedUpload} />
);

/* ===========================================================================
   CHUNK HASH FLOW — a chunk gets hashed once, and that hash either short
   circuits the upload (dedup match) or gets independently re-verified once
   the bytes land (checksum). Same single-chain-with-a-fork skeleton as
   setupCacheFlow, coordinates included, since that shape is already proven
   not to crowd its labels.
=========================================================================== */
function setupChunkHashFlow(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const uid = Math.random().toString(36).slice(2, 7);

  const defs = mk(svg, "defs");
  const marker = mk(defs, "marker", {
    id: `ch-${uid}`, viewBox: "0 0 10 10", refX: 8, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
  });
  mk(marker, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });

  const phase = mkText(svg, "", 450, 24, "viz-phase", "middle");

  mk(svg, "rect", { x: 360, y: 40, width: 180, height: 50, rx: 8, class: "viz-box" });
  mkText(svg, "Chunk ready to upload", 450, 70, "viz-node-lbl", "middle");

  const arrow1 = mk(svg, "line", {
    x1: 450, y1: 90, x2: 450, y2: 148, class: "viz-stroke", "marker-end": `url(#ch-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const len1 = 58;
  arrow1.style.strokeDasharray = String(len1);

  const hashBox = mk(svg, "rect", { x: 370, y: 150, width: 160, height: 50, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const hashLbl = mkText(svg, "SHA-256 hash", 450, 180, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(hashLbl, { opacity: 0 });

  const arrowHit = mk(svg, "line", {
    x1: 410, y1: 200, x2: 290, y2: 258, class: "viz-blue", "marker-end": `url(#ch-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenHit = Math.hypot(410 - 290, 258 - 200);
  arrowHit.style.strokeDasharray = String(lenHit);

  const hitBox = mk(svg, "rect", { x: 190, y: 260, width: 200, height: 60, rx: 8, class: "viz-panel", opacity: 0 }) as SVGRectElement;
  const hitRing = mk(svg, "rect", { x: 184, y: 254, width: 212, height: 72, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const hitLbl1 = mkText(svg, "Hash already exists", 290, 282, "viz-node-lbl", "middle") as SVGTextElement;
  const hitLbl2 = mkText(svg, "skip the upload", 290, 300, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([hitLbl1, hitLbl2], { opacity: 0 });

  const arrowMiss = mk(svg, "line", {
    x1: 490, y1: 200, x2: 610, y2: 258, class: "viz-blue", "marker-end": `url(#ch-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const lenMiss = Math.hypot(610 - 490, 258 - 200);
  arrowMiss.style.strokeDasharray = String(lenMiss);

  const missBox = mk(svg, "rect", { x: 510, y: 260, width: 200, height: 50, rx: 8, class: "viz-box", opacity: 0 }) as SVGRectElement;
  const missLbl = mkText(svg, "No match, needs upload", 610, 290, "viz-node-lbl", "middle") as SVGTextElement;
  gsap.set(missLbl, { opacity: 0 });

  const arrow2 = mk(svg, "line", {
    x1: 610, y1: 310, x2: 610, y2: 358, class: "viz-stroke", "marker-end": `url(#ch-${uid})`, opacity: 0,
  }) as SVGLineElement;
  const len2 = 48;
  arrow2.style.strokeDasharray = String(len2);

  const returnBox = mk(svg, "rect", { x: 500, y: 360, width: 220, height: 60, rx: 8, class: "viz-panel", opacity: 0 }) as SVGRectElement;
  const returnRing = mk(svg, "rect", { x: 494, y: 354, width: 232, height: 72, rx: 12, class: "viz-blue", fill: "none", opacity: 0 }) as SVGRectElement;
  const returnLbl1 = mkText(svg, "Storage verifies checksum", 610, 382, "viz-node-lbl", "middle") as SVGTextElement;
  const returnLbl2 = mkText(svg, "chunk is now trusted", 610, 400, "viz-label-sm", "middle") as SVGTextElement;
  gsap.set([returnLbl1, returnLbl2], { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  const play = () => {
    tl?.kill();
    phase.textContent = "";
    gsap.set([arrow1, hashBox, hashLbl, arrowHit, hitBox, hitRing, hitLbl1, hitLbl2, arrowMiss, missBox, missLbl,
      arrow2, returnBox, returnRing, returnLbl1, returnLbl2], { opacity: 0 });
    arrow1.style.strokeDashoffset = String(len1);
    arrowHit.style.strokeDashoffset = String(lenHit);
    arrowMiss.style.strokeDashoffset = String(lenMiss);
    arrow2.style.strokeDashoffset = String(len2);

    tl = gsap.timeline();

    tl.add(() => { phase.textContent = "A chunk's bytes are ready to go"; });
    tl.to({}, { duration: 0.35 });

    tl.add(() => { phase.textContent = "The client hashes the chunk before sending anything"; });
    tl.to(arrow1, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow1, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([hashBox, hashLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "That hash gets checked against metadata first"; });
    tl.to({}, { duration: 0.35 });

    tl.add(() => { phase.textContent = "A match means this content is already stored somewhere"; });
    tl.to(arrowHit, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowHit, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([hitBox, hitLbl1, hitLbl2], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to(hitRing, { opacity: 1, duration: 0.3 }, ">-0.1");
    tl.to({}, { duration: 0.5 });

    tl.add(() => { phase.textContent = "No match sends the chunk on to actually get uploaded"; });
    tl.to(arrowMiss, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrowMiss, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, "<");
    tl.to([missBox, missLbl], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "Once it lands, storage independently recomputes a checksum over the bytes"; });
    tl.to(arrow2, { opacity: 1, duration: 0.05 }, "<");
    tl.to(arrow2, { strokeDashoffset: 0, duration: 0.25, ease: "none" }, "<");
    tl.to([returnBox, returnLbl1, returnLbl2], { opacity: 1, duration: 0.3 }, "<0.1");
    tl.to({}, { duration: 0.4 });

    tl.add(() => { phase.textContent = "A match confirms the bytes are intact, not just that the client claims they are"; });
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

export const ChunkHashFlowDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 440" maxW="max-w-2xl" delay={delay} setup={setupChunkHashFlow} />
);
