# Building Blueprint Animations (GSAP + SVG) for the Blog

How to add narrated, auto-playing concept animations to a post, the kind that
explain a topic (hash collisions, a cache hit/miss path, two servers racing
for the same key) the way [makingsoftware.com](https://www.makingsoftware.com)
explains hardware.

## 0. Where this lives

`src/content/components/` is split by reusability (see the blogger skill for
the full breakdown). Animations built with this guide are the bespoke,
narrative kind, so they live in **`animations/<post-slug>/`**, one folder per
post. Build a new animation in that post's file, export it, drop it into the
post `.tsx`, add it to the top-level barrel `src/content/components/index.ts`.
That's it.

Reference implementation right now: `animations/url-shortener/ConceptViz.tsx`,
which exports `HashCollisionDiagram`, `KeyHandoffDiagram`, and
`CacheFlowDiagram` for the "Designing a URL Shortener" post.

If a visual is really just data plus layout (a stat row, a node graph driven
by a `nodes`/`edges` array, a table), it's not this kind of animation, it
belongs in `figures/` instead as a reusable, prop-driven component. This guide
is specifically for the hand-built, one-off SVG timelines that narrate a
process step by step.

---

## 1. Mental model

Each animation = **one GSAP timeline** playing a story:
`intro → phase 1 → phase 2 → … → recap`.

Four separable parts:
- **SVG scene**, static structure (boxes, cells, labels), built once in JS.
- **GSAP timeline**, the director, sequences *when* things happen.
- **On-canvas `phase` text**, a plain-language line that updates live so the
  animation explains itself with zero interaction.
- **Deterministic data**, real values computed up front (hashes, positions,
  example keys) so visuals never lie and timing is known.

---

## 2. Architecture (how it plugs into the blog)

Every animation is a `setupXxx(svg)` function returning an **`Api`**, wrapped
by the shared `VizFigure` component (which gives it controls, theming, and
in-view play for free). `VizFigure` lives at the top of
`animations/<slug>/ConceptViz.tsx`, copy it into a new post's file the first
time that post needs an animation, it's small and self-contained on purpose.

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

// export at the bottom of the file:
export const MyThingDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 540" maxW="max-w-3xl" delay={delay} setup={setupMyThing} />
);
```

Then add it to the barrel (`src/content/components/index.ts`, re-exporting
from `./animations/<slug>/ConceptViz`) and use it in the post:

```tsx
import { MyThingDiagram } from "../components";
...
<MyThingDiagram delay={0.05} caption="What this shows." />
```

`VizFigure` already handles: framer-motion entrance, **IntersectionObserver**
(plays once when scrolled into view), and the control bar
(**▶/❚❚ · ↻ replay · 0.5/1/2×**). Don't re-implement these per animation.
Because it triggers on scroll, not mount, give it a small independent `delay`
(`0.05` to `0.1`), not the next number in the surrounding text's cascade, see
the blogger skill's Animation delays section for why.

---

## 3. Theming, light/dark (CRITICAL)

Colors come **entirely from CSS variables** scoped to `.viz` (and `.dark
.viz`) in `src/index.css`. Light is black and blue, dark is white and blue.

```css
.viz       { --v-ink:#1b1b1b; --v-blue:#2c3aa6; --v-blue-soft:rgba(44,58,166,.15);
             --v-warn:#c2622e; --v-panel:rgba(44,58,166,.045); }
.dark .viz { --v-ink:#ededed; --v-blue:#8095e8; --v-blue-soft:rgba(128,149,232,.18);
             --v-warn:#d98c52; --v-panel:rgba(128,149,232,.06); }
```

Reusable element classes are already defined: `.viz-stroke`, `.viz-thin`,
`.viz-panel`, `.viz-label`, `.viz-label-sm`, `.viz-box`, `.viz-cell`,
`.viz-img`, `.viz-txt`, `.viz-pull`, `.viz-baseline`, `.viz-bar-pos`,
`.viz-bar-neg`, `.viz-up`, `.viz-down`, `.viz-phase`, `.viz-blue` (neutral
positive-path highlight), `.viz-warn` (reserved for the actual gotcha or
error case), `.viz-node-lbl`, arrowhead fills `.viz-arrow-ink|blue|warn`. Add
new ones there if needed, don't invent one-off inline colors.

> **The big gotcha.** CSS `var()` does **not** work in SVG *presentation
> attributes*. `setAttribute("stroke", "var(--v-warn)")` silently fails.
> **Always color via `class`**, never via a `stroke`/`fill` attribute.
> Corollary, **animate opacity / fill-opacity / position, not color**, so
> light/dark switching keeps working live (the class var re-resolves, a
> gsap-tweened hex would freeze).
>
> **Color semantics.** Reserve `.viz-warn` for a genuine negative outcome (a
> collision, a bug, an error path). Use `.viz-blue` for a positive or neutral
> highlight (a safe handoff, a cache hit, "this worked correctly"). Don't use
> the warning color just because it's visually punchy, readers pick up the
> color-coding and a misused warn color implies something's wrong when it
> isn't.

---

## 4. Building the scene in JS

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

- Lay out in **`viewBox` coordinates** (e.g. `0 0 900 400`), it scales to fit.
- **Center text** with anchor `"middle"`, SVG text defaults to left-anchored
  at `x` (otherwise labels look shifted right).
- **Symmetric two-lane layouts are the safest starting shape.** Two mirrored
  columns (`x = 230` and `x = 670` in a `900`-wide viewBox, say) with a
  vertical chain of arrow, box, arrow, box down each lane is proven across
  three different animations on this site (`setupHashCollision`,
  `setupKeyHandoff`), reuse that skeleton before inventing a new geometry.
  Diagonal branches (`setupCacheFlow`'s hit/miss split) are fine too, just
  compute the line length with `Math.hypot(dx, dy)` for the self-draw effect
  below, don't eyeball it.
- **Nodes you move = a `<g>`** with shapes drawn centered at local `(0,0)`,
  move the group with `gsap.to(g, { x, y })` (translate). A `<g>` with no
  transform sits at the SVG origin, **set its start position at build time**
  or it flashes top-left before the first play.

---

## 5. Animation primitives

**Self-drawing line/arrow**, the signature move:

```ts
const ln = mk(fx, "line", { x1, y1, x2, y2, class: "viz-stroke",
  "marker-end": `url(#arrow-${uid})`, opacity: 0 });
const len = Math.hypot(x2 - x1, y2 - y1);
ln.style.strokeDasharray = String(len);
tl.fromTo(ln, { strokeDashoffset: len, opacity: 1 },
              { strokeDashoffset: 0, duration: 0.35, ease: "none" }, at);
```

> Arrowheads (`marker-end`) render even while the stroke is hidden by
> `dashoffset`, so create the line `opacity: 0` and reveal it exactly when
> the draw starts.

Define the marker once in `<defs>`, fill via class, **unique id per
instance** (two animations on one page would collide on a shared id):

```ts
const uid = Math.random().toString(36).slice(2, 7);
const m = mk(defs, "marker", { id: `arrow-${uid}`, viewBox: "0 0 10 10",
  refX: 8, refY: 5, markerWidth: 6.5, markerHeight: 6.5, orient: "auto-start-reverse" });
mk(m, "path", { d: "M0,0 L10,5 L0,10 z", class: "viz-arrow-ink" });
```

**Flash / activate** an element, animate fill-opacity (theme-safe) plus a
pop:

```ts
gsap.to(cell, { attr: { "fill-opacity": 0.9 }, duration: 0.4 });
gsap.fromTo(cell, { scale: 1, transformOrigin: "center" },
                  { scale: 1.12, duration: 0.18, yoyo: true, repeat: 1 });
```

**Highlight ring around a box** (a "this is the important state" callout),
a second `rect` slightly larger than the box, `fill="none"`, colored via
class (`viz-blue` for positive, `viz-warn` for a real problem), faded in
after the box itself lands, sometimes pulsed with `yoyo: true, repeat: 2-3`.

**Grow a bar from a baseline**, `fromTo` the rect `attr` `y` and `height`
from the baseline outward.

---

## 6. Sequencing one timeline

Position parameter places tweens in time.

| Position | Meaning |
|---|---|
| `">"` | end of timeline (after everything so far) |
| `"<"` | start of the previous tween (run concurrently) |
| `"+=0.5"` / a number | relative / absolute time |

Patterns:
- **Stagger sub-steps** in a phase, first tween at `">"`, the rest at `"<"`
  (concurrent). Looping a step across two lanes, `i === 0 ? "<" : "<0.1"`.
- **`tl.add(() => {...}, at)`** runs JS at a position, phase-text changes,
  side effects, a `gsap.fromTo` that isn't on the timeline.
- **`tl.to({}, { duration: 1.2 })`** is a deliberate read-pause between
  phases, don't skip these, a story with no pauses reads as a blur.
- **Live narration**, `tl.add(() => (phase.textContent = "…"))` at each beat.
  Narrate *as it animates* ("Both requests reach the Key Generation
  Service"), not just a summary after the fact.

`play()` must **`gsap.set()` everything back to its start state** (instant,
no tween) before rebuilding the timeline, or leftover state bleeds into the
replay. This includes resetting every `strokeDashoffset` back to its full
length, it's the easiest thing to forget and the bug only shows up on the
second play.

---

## 7. Honest, deterministic data

Compute the real thing up front, pick demo cases that genuinely work. If two
lanes are supposed to end up with different values, generate two values and
verify by hand (or `node -e "..."`) that they're actually different before
wiring them into the SVG, don't assume.

`setupHashCollision` computes a real FNV-1a hash of two different strings
live in the browser and finds a genuine prefix collision at a shortened
length, it isn't staged. `setupKeyHandoff` and `setupCacheFlow` use fixed
example values (`aB3xQ9`, `P0qR7z`) since the point there is the handoff
mechanism, not the hash function, constants are fine when the animation
isn't making a claim about the data itself.

---

## 8. Integration rules (learned the hard way)

- **Never remove existing figures** when adding an animation. Only *add*, and
  only when asked or clearly implied. Place the new animation right after
  the paragraph that describes the mechanism it visualizes.
- Animation captions **don't get `Figure N`** numbering, that convention is
  for `BlogImage` screenshots. Describe what the animation shows in one
  plain sentence instead, no colon, no em-dash (see the blogger skill's
  punctuation rule, it applies to captions too).
- **No entrance delay on in-view blocks.** `VizFigure` ignores a large
  `delay` prop for its `whileInView` fade in any meaningful way, don't stack
  it with the surrounding cascade's growing numbers, a small independent
  `0.05` to `0.1` is correct (a `delay={1.7}` here once produced a multi
  second blank gap before the animation appeared).
- Build the scene and set the initial state at **build time** (inside
  `setup`, not `play`), so nothing flashes at the origin before the in-view
  trigger fires.
- One accent color (`.viz-warn`) is reserved for the actual gotcha or
  negative case, don't spend it on emphasis that isn't a problem.

---

## 9. Workflow for a NEW animation

1. **Pick the story**, 3 to 5 phases. Write them as a list first, in plain
   English, before touching SVG coordinates.
2. **Sketch the layout** in viewBox coordinates. A two-lane mirrored layout
   (see section 4) covers most "compare two things" or "two actors race"
   stories, a single vertical chain with a branch covers most "one thing,
   then it forks" stories (cache hit versus miss).
3. **Precompute real data**, pick honest cases, verify in Node if there's
   any real computation involved (a hash, an aggregate, anything that could
   silently be wrong).
4. If this is the post's first animation, create
   `animations/<slug>/ConceptViz.tsx` and copy the `VizFigure` wrapper, `mk`,
   `mkText`, and `Api` type from an existing one (`animations/url-shortener/ConceptViz.tsx`
   is the reference). If the post already has animations, add to that same
   file.
5. Write `setupXxx(svg): Api`, build the scene with `mk`/`mkText` (classes
   for color), then `play()` builds the timeline with staggered `at` times,
   live `phase` text, and read-pauses.
6. Export `XxxDiagram` via `VizFigure`, add it to the top-level
   `src/content/components/index.ts` barrel, use it in the post.
7. `npx tsc --noEmit`, then view at `/writings/:slug` on the dev server. Tune
   timing at 0.5x speed using the control bar before calling it done.

---

## 10. Cheat sheet

```js
// timeline
gsap.timeline(); tl.to(t, vars, at); tl.fromTo(t, from, to, at);
tl.set(t, vars, at); tl.add(fn, at); tl.to({}, { duration: 1 }); // pause
// positions:  ">" end | "<" start-of-prev | "+=1" | 1.5 absolute
// playback:   tl.timeScale(r) | pause() | play() | kill()

// SVG/gsap rules:
//  color -> CSS class only (var() fails in presentation attributes)
//  animate opacity/fill-opacity/x/y, NOT color (keeps light/dark live)
//  centered text -> text-anchor "middle"
//  scale -> transformOrigin "center"
//  self-draw -> dasharray = len, animate dashoffset -> 0, line starts opacity:0
//  markers -> unique id per instance; fill via class
//  move a node -> it's a <g>; gsap.to(g, {x, y}); set start pos at build time
//  warn color -> reserved for a real problem, not just emphasis
```

Reference implementations, all three in
`src/content/components/animations/url-shortener/ConceptViz.tsx`:
`setupHashCollision` (live hash computed in-browser, a real prefix
collision), `setupKeyHandoff` (two mirrored lanes, a positive outcome
highlighted in `.viz-blue`), `setupCacheFlow` (single chain that forks into a
hit path and a miss path). Theme vars and classes live at the bottom of
`src/index.css` under the `.viz` section.
