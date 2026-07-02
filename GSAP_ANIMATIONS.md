# Building Blueprint Animations (GSAP + SVG) for the Blog

How to add narrated, auto-playing concept animations to a post — the kind that
explain a topic (Bloom filters, contrastive learning, GRPO) the way
[makingsoftware.com](https://www.makingsoftware.com) explains hardware.

Everything lives in **one file**: `src/content/components/ConceptViz.tsx`.
Build a new animation there, export it, drop it into the post `.tsx`. That's it.

---

## 0. Mental model

Each animation = **one GSAP timeline** playing a story:
`intro → phase 1 → phase 2 → … → recap`.

Four separable parts:
- **SVG scene** — static structure (boxes, cells, labels), built once in JS.
- **GSAP timeline** — the director: sequences *when* things happen.
- **On-canvas `phase` text** — plain-language line that updates live so the
  animation explains itself with zero interaction.
- **Deterministic data** — compute real values up front (hashes, means,
  positions) so visuals never lie and timing is known.

---

## 1. Architecture (how it plugs into the blog)

Every animation is a `setupXxx(svg)` function returning an **`Api`**, wrapped by
the shared `VizFigure` component (which gives it controls, theming, in-view play
for free).

```ts
type Api = {
  play: () => void;              // (re)build timeline from scratch and play
  pause: () => void;
  resume: () => void;
  setRate: (r: number) => void;  // timeScale (speed buttons)
  cleanup: () => void;           // kill timeline on unmount
};

function setupMyThing(svg: SVGSVGElement): Api {
  while (svg.firstChild) svg.removeChild(svg.firstChild); // build scene ONCE
  /* … build static scene with mk()/mkText() … */
  let tl: gsap.core.Timeline | null = null;
  const play = () => { tl?.kill(); /* reset via gsap.set */ tl = gsap.timeline(); /* … */ };
  return {
    play,
    pause: () => tl?.pause(),
    resume: () => tl?.play(),
    setRate: (r) => tl?.timeScale(r),
    cleanup: () => tl?.kill(),
  };
}

// export at bottom of ConceptViz.tsx:
export const MyThingDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 540" maxW="max-w-3xl" delay={delay} setup={setupMyThing} />
);
```

Then: add to the barrel (`src/content/components/index.ts`) and use in the post:

```tsx
import { MyThingDiagram } from "../components";
...
<MyThingDiagram delay={1.2} caption="What this shows…" />
```

`VizFigure` already handles: framer-motion entrance, **IntersectionObserver**
(plays once when scrolled into view), and the control bar
(**▶/❚❚ · ↻ replay · 0.5/1/2×**). Don't re-implement these per animation.

---

## 2. Theming — light/dark (CRITICAL)

Colors come **entirely from CSS variables** scoped to `.viz` (and `.dark .viz`)
in `src/index.css`. Light = **black + blue**, dark = **white + blue**.

```css
.viz       { --v-ink:#1b1b1b; --v-blue:#2c3aa6; --v-blue-soft:rgba(44,58,166,.15);
             --v-warn:#c2622e; --v-panel:rgba(44,58,166,.045); }
.dark .viz { --v-ink:#ededed; --v-blue:#8095e8; --v-blue-soft:rgba(128,149,232,.18);
             --v-warn:#d98c52; --v-panel:rgba(128,149,232,.06); }
```

Reusable element classes are already defined: `.viz-stroke`, `.viz-thin`,
`.viz-panel`, `.viz-label`, `.viz-label-sm`, `.viz-box`, `.viz-cell`,
`.viz-img`, `.viz-txt`, `.viz-pull`, `.viz-baseline`, `.viz-bar-pos`,
`.viz-bar-neg`, `.viz-up`, `.viz-down`, `.viz-phase`, arrowhead fills
`.viz-arrow-ink|blue|warn`. Add new ones there if needed.

> **THE big gotcha:** CSS `var()` does **not** work in SVG *presentation
> attributes*. `setAttribute("stroke", "var(--v-warn)")` silently fails.
> **Always color via `class`**, never via a `stroke`/`fill` attribute.
> Corollary: **animate opacity / fill-opacity / position — not color** — so
> light↔dark switching keeps working live (the class var re-resolves; a
> gsap-tweened hex would freeze).

---

## 3. Building the scene in JS

DOM helpers (already in the file):

```ts
function mk(root, tag, attrs = {}) {            // create namespaced SVG node
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  root.appendChild(n); return n;
}
function mkText(root, str, x, y, cls = "viz-label", anchor = "start") {
  const t = mk(root, "text", { x, y, class: cls, "text-anchor": anchor });
  t.textContent = str; return t;
}
```

- Lay out in **`viewBox` coordinates** (e.g. `0 0 900 540`); it scales to fit.
- **Center text** with anchor `"middle"` — SVG text defaults to left-anchored at
  `x` (otherwise labels look "shifted right").
- **Nodes you move = a `<g>`** with shapes drawn centered at local `(0,0)`; move
  the group with `gsap.to(g, { x, y })` (translate). A `<g>` with no transform
  sits at the SVG origin — **set its start position at build time** or it flashes
  top-left before the first play.

---

## 4. Animation primitives

**Self-drawing line/arrow** — the signature move:

```ts
const ln = mk(fx, "line", { x1, y1, x2, y2, class: "viz-stroke",
  "marker-end": `url(#arrow-${uid})`, opacity: 0 });
const len = Math.hypot(x2 - x1, y2 - y1);
ln.style.strokeDasharray = len;
tl.fromTo(ln, { strokeDashoffset: len, opacity: 1 },
              { strokeDashoffset: 0, duration: 0.35, ease: "none" }, at);
```

> Arrowheads (`marker-end`) render even while the stroke is hidden by
> `dashoffset` — so create the line `opacity:0` and reveal it exactly when the
> draw starts.

Define the marker once in `<defs>`, fill via class, **unique id per instance**
(two animations on one page would collide on a shared id):

```ts
const uid = Math.random().toString(36).slice(2, 7);
const m = mk(defs, "marker", { id: `arrow-${uid}`, viewBox: "0 0 10 10",
  refX: 8, refY: 5, markerWidth: 6.5, markerHeight: 6.5, orient: "auto-start-reverse" });
mk(m, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });
```

**Flash / activate** an element — animate fill-opacity (theme-safe) + a pop:

```ts
gsap.to(cell, { attr: { "fill-opacity": 0.9 }, duration: 0.4 });
gsap.fromTo(cell, { scale: 1, transformOrigin: "center" },
                  { scale: 1.12, duration: 0.18, yoyo: true, repeat: 1 });
```

**Grow a bar from a baseline** (GRPO advantages): `fromTo` the rect `attr`
`y`+`height` from the baseline outward.

---

## 5. Sequencing one timeline

Position parameter places tweens in time:

| Position | Meaning |
|----------|---------|
| `">"` | end of timeline (after everything so far) |
| `"<"` | start of the previous tween (run concurrently) |
| `"+=0.5"` / number | relative / absolute time |

Patterns:
- **Stagger sub-steps** in a phase: first tween at `">"`, the rest at `"<"`
  (concurrent). Looping a step: `n === 0 ? ">" : "<"`.
- **`tl.add(() => {...}, at)`** runs JS at a position — phase-text changes, side
  effects, a `gsap.fromTo` that isn't on the timeline.
- **`tl.to({}, { duration: 1.2 })`** = a deliberate read-pause between phases.
- Live narration: `tl.add(() => (phase.textContent = "…"))` at each beat. Narrate
  *as it animates* (`h1("apple") = 3 → set bit 3`), not just a summary.

`play()` must **`gsap.set()` everything back to its start state** (instant, no
tween) before rebuilding the timeline, or leftover state bleeds into the replay.

---

## 6. Honest, deterministic data

Compute the real thing up front; pick demo cases that genuinely work.

```ts
const sim = new Array(M).fill(0);
INSERTED.forEach((w) => hashes.forEach((h) => (sim[h(w)] = 1)));
const FALSEPOS = POOL.find((w) => hashes.every((h) => sim[h(w)] === 1)); // real collision
```

The contrastive matrix is derived live from embedding distances; the GRPO
advantages are `reward − mean` of the actual rewards. Verify in Node
(`node -e "…"`) before wiring.

---

## 7. Integration rules (learned the hard way)

- **Never remove existing figures.** Only *add* animations, and only when asked.
  Place the animation near the related `<BlogImage>`, keep the figure.
- Animation captions **don't reuse `Figure N`** numbering (the figure keeps it) —
  describe what it shows instead.
- **No entrance delay on in-view blocks.** `VizFigure` ignores the `delay` prop
  for its `whileInView` fade. (A `transition={{ delay: 1.7 }}` once caused a 2s
  blank before the animation appeared.)
- Build the scene + set initial state at **build time** (in `setup`, not `play`)
  so nothing flashes at the origin before the in-view trigger fires.
- One accent color (`--v-warn`) is reserved for the "gotcha"/negative case.

---

## 8. Workflow for a NEW animation

1. **Pick the story** — 3–5 phases. Write them as a list first.
2. **Sketch layout** in viewBox coords. Inputs left/top, structure center,
   outputs/labels right.
3. **Precompute real data**; pick honest cases.
4. Write `setupXxx(svg): Api` in `ConceptViz.tsx` — build scene with `mk`/`mkText`
   (classes for color), then `play()` builds the timeline with staggered `base`
   times + live `phase` text + read-pauses.
5. Export `XxxDiagram` via `VizFigure`; add to `index.ts`; use in the post.
6. `npx tsc --noEmit`, then view at `/writings/:slug` (dev server). Tune timing
   at 0.5×.

---

## 9. Cheat sheet

```js
// timeline
gsap.timeline(); tl.to(t, vars, at); tl.fromTo(t, from, to, at);
tl.set(t, vars, at); tl.add(fn, at); tl.to({}, { duration: 1 }); // pause
// positions:  ">" end | "<" start-of-prev | "+=1" | 1.5 absolute
// playback:   tl.timeScale(r) | pause() | play() | kill()

// SVG/gsap rules:
//  color → CSS class only (var() fails in presentation attributes)
//  animate opacity/fill-opacity/x/y, NOT color (keeps light/dark live)
//  centered text → text-anchor "middle"
//  scale → transformOrigin "center"
//  self-draw → dasharray=len, animate dashoffset→0, line starts opacity:0
//  markers → unique id per instance; fill via class
//  move a node → it's a <g>; gsap.to(g,{x,y}); set start pos at build time
```

Reference implementations in `ConceptViz.tsx`: `setupPullPush` &
`setupTraining` (contrastive), `setupGrpoAdvantage` (GRPO). Theme vars + classes
live at the bottom of `src/index.css` under the `.viz` section.
