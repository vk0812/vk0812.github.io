---
name: blogger
description: Draft a blog post for vk0812.github.io in Vidit's voice. Invoke when the user asks to write, draft, or scaffold a new entry under /writings, typically with a topic and target audience. Handles file scaffolding, registration, and dev-server preview.
---

# Blogger, vk0812.github.io

Drafts technical and personal blog posts for the writings section of this site, in a voice consistent with the existing posts.

## When to use

Invoke this skill when the user asks to:
- "Write a blog about X", "draft a writeup on X", "make a post about X"
- Add a new entry under `/writings`
- Convert notes or a paper into a blog post

Do NOT invoke for: editing existing posts in passing (just edit), one-off paragraph tweaks, or non-blog content.

## Voice and style

The two reference posts that define the voice are `src/content/posts/intern-exp.tsx` (personal narrative) and `src/content/posts/contrastive-learning.tsx` (technical). Read at least one before drafting.

**Tone**
- First-person, conversational, warm. Write like you're explaining to a smart friend over coffee, not lecturing.
- Light humor where it fits, especially in personal posts. In technical posts, keep humor sparing. One or two dry asides per long section, not jokes-per-paragraph.
- Use contractions ("it's", "we'll", "don't"). Stiff prose feels off.

**Audience for technical posts**
- Default reader: someone with basic ML knowledge. Knows what an embedding, a loss function, gradient descent are. Doesn't know your specific topic.
- Don't drop jargon without explanation. If you have to use a term like "InfoNCE" or "LoRA", briefly say what it is the first time it appears.
- Don't dumb things down either. The reader is smart, just unfamiliar with this corner of the field.

**Sentence rhythm**
- Mix short and long sentences. Drop one-line punches occasionally ("That's it." or "Six lines of real work.").
- Concrete beats abstract. If the reference material has an example (a dog photo, a number, a code snippet), use it explicitly in the prose.

**Reference images, important**
- If the user supplies a reference image, read it with the Read tool BEFORE writing anything. Extract the exact example used (question text, answer values, formula variant, table entries) and state it back in a short confirmation message so the user can catch misreads early.
- Use those exact values everywhere in the post: prose, inline formulas, code blocks, figure captions. Do not invent a "cleaner" or "simpler" version of the example even if it seems mathematically equivalent — readers compare the post against the image and inconsistencies are confusing.

**Punctuation rule, important**
- Do NOT use em dashes (`—`) or en dashes (`–`) anywhere. They look off in this site's typography and read as AI-generated.
- Do NOT use semicolons (`;`) in prose. The author dislikes them. This applies to body text, captions, alt text, and list items, anywhere user-visible.
- Do NOT use colons (`:`) in prose either, same reason, reads as AI-generated. This includes list item lead-ins like `<strong>Label:</strong>`, use a period instead (`<strong>Label.</strong>`). URLs like `https://` are fine, that's not a prose colon.
- Use commas, parentheses, or two short sentences instead of a colon or semicolon.
- Hyphens inside compound words are fine ("image-text", "L2-normalize", "self-supervised"). The rule is about dashes used as a substitute for a comma or sentence break.
- JS/TS code semicolons and colons (object literals, type annotations, import lines) are fine, the rule only applies to prose the reader sees.
- Before handing back a post, grep the file for stray `:` outside of code/URLs and for `—`/`–` to catch anything missed.
- One standing exception, the `"Figure N: ..."` prefix on `BlogImage` captions (see Figures and placeholders below) is a numbering label, not a prose colon, keep using it there. Newer figure types (`StatTiles`, `IconArchitectureDiagram`, `ApiEndpointsTable`, `SchemaCards`, `animations/<slug>/` pieces) don't get `Figure N` numbering at all, just a plain descriptive caption, so this exception doesn't come up for them.

**What to avoid**
- Generic openers like "In today's fast-paced world of AI..." or "In this blog post, we will explore...". Just start.
- Scope-and-prerequisites sentences like "This post covers X, Y, and Z" or "Basic distributed systems familiarity assumed." Cut straight from the hook into content, don't preview the table of contents in prose.
- Bulleted summaries of obvious things. Bullets earn their place by listing genuinely parallel items.
- Filler transitions ("Now, let's move on to...", "As we discussed before..."). Trust the reader.
- Abbreviations and shortforms in prose: always spell out the full term ("load balancer" not "LB", "Weighted Round Robin" not "WRR"). Acronyms that are themselves the canonical name (WAF, CDN, CPU, DNS, HTTP, HTTPS, SSL, TLS) are fine.
- Marketing-speak ("revolutionary", "game-changing", "unleash the power of"). Never.
- Naming this blog's own other posts or calling out "this series" ("every other case study in this series", "the same pattern this series has already used"). Keep comparisons general instead, describe the mechanism or the class of system it shows up in ("the same pattern any system needing unique IDs without a single point of failure reaches for"), not a pointer back to specific posts on this site. This includes naming a *system* that happens to be another post's topic purely as a comparison point ("unlike a URL shortener, which..." or "a Pastebin service deliberately..."), even with no link and even if you remember that other post's content well. You may not have (re-)read that post in this session, and the reference will drift out of sync with what it actually says. Describe the general mechanism instead ("services that truncate a hash to keep a link short", "a flat key space with no natural relationship between entries") so the comparison holds up without depending on another file's current content.

**Bold text, sparing.** `<strong>` is available in `Paragraph` prose (`Bloom Filters`, `CDN` already use it inside `ListItem`s). For technical posts, also use it inline in regular paragraphs, but sparingly, 5 to 7 uses across a whole long case study, never more than one per paragraph. Reserve it for the few things that actually carry the argument, a load-bearing number stated once ("Assume **500 million new short links a month**"), or the first real mention of a named mechanism the rest of the post leans on (**Key Generation Service**, **Consistent hashing**, **Least Recently Used**, **object storage**). Don't bold for emphasis or decoration, and don't bold the same term twice.

## Structure

Standard arc for a technical post (6 to 9 sections, ~1500 to 2500 words):

1. **Cold open**, 1 to 2 paragraphs grounding the topic in something the reader has already seen ("If you've used image search..."). Do NOT add a "this post covers X, Y, Z" scope sentence or a "basic X familiarity assumed" prerequisite sentence, just launch straight into the core idea after the hook.
2. **The core idea** (optional), the one-sentence version of the concept, before any math or detail. Don't add this as its own standalone heading by default, a lot of posts don't need it, the cold open often already lands the concept. Only give it a dedicated `Heading` when the topic genuinely needs a beat to state the one-sentence version before the mechanism starts (a novel or unintuitive concept that isn't obvious from the cold open). Default to folding straight from the cold open into requirements or setup.
3. **Setup, data, prerequisites**, what the inputs look like, with a concrete example.
4. **The mechanism**, the actual technical content, broken into 2 to 4 sub-sections.
5. **Loss, objective, key equation** (if applicable), a single block formula plus a plain-language walkthrough of every symbol. Follow with the actual code.
6. **What it produces, why it works**, the outcome (embedding space, fine-tuned model, whatever).
7. **End-to-end summary**, one figure or a short ordered list that puts every step together.
8. **Takeaways**, a tight bulleted list, 3 to 5 items.
9. **Practical tips**, bulleted list of things that actually matter when implementing. Bold the lead phrase of each item.
10. **Closing**, short. One paragraph zooming out, a pointer to further reading, a one-line sign-off ("Thanks for reading...").

Personal posts (like `intern-exp.tsx`) follow a looser narrative arc but the same voice rules.

**Ending, every post, no exceptions.** End with a `Heading level={2}` "Takeaways" followed by a `List` of 3 to 5 items, then a final `Paragraph` that zooms out and closes with a one-line sign-off ("Thanks for reading."). Don't stop at the Takeaways list, the closing paragraph is required. See `rate-limiting.tsx` and `data-partitioning.tsx` for the exact shape. If a post gets edited later and something before the ending is removed (a paragraph, a Quote, a figure), the ending stays, just renumber the delays after the removal so the cascade has no gaps (see Animation delays below).

**System design case studies can run long.** The 1500 to 2500 word guideline is a default for topic explainers, not a ceiling. When the user explicitly asks for thorough or comprehensive coverage of a system design topic (see `designing-url-shortener.tsx`), it's fine to cover every sub-topic in the source material plus adjacent things worth knowing (rate limiting, HTTP redirect codes, event-driven analytics, and so on), with more than 9 sections if the topic warrants it. Depth over the default length guideline when asked.

## Authoring workflow

Three files to touch for every new post. All three are required, otherwise the post won't show up in the listing.

### 1. Create `src/content/posts/<slug>.tsx`

```tsx
import { BlogPostData } from "./types";
import { Paragraph, Heading, BlogImage, Formula, CodeBlock, InlineCode, List, ListItem, Quote } from "../components";

export const <camelCaseName>: BlogPostData = {
  title: "Post Title",                  // sentence case, no trailing punctuation. If topic is an acronym, use the expanded full name here, no "(ACRONYM)" suffix
  date: "Month Day, Year",              // e.g. "April 30, 2026", long-form
  slug: "<kebab-case-slug>",            // matches the filename
  content: (
    <>
      {/* sections go here */}
    </>
  ),
};
```

### 2. Register in `src/content/posts/index.ts`

Add an import and an entry to the `blogPosts` record. The key MUST match the slug.

### 3. Add to `src/pages/Writings.tsx`

Prepend (most recent first) an entry to the local `blogPosts` array:

```ts
{ id: "<slug>", title: "Post Title", date: "DD/MM", tag: "<Tag>", year: 2026 },
```

The date format here is `DD/MM` (different from the post file's long-form date). If the tag is new, add a color to `tagColors` at the top of the file. Tailwind classes like `bg-purple-100 text-purple-700` work well.

**Acronym titles, important.** When the topic itself is an acronym (CORS, CAP, CDN, etc.), the two title fields differ on purpose:
- `Writings.tsx` listing `title` (folder/list view): expanded full name with the acronym in parens, e.g. `"Cross-Origin Resource Sharing (CORS)"`. This is what readers scan and search, so spell it out.
- Post file `title` (top of the actual post page): just the expanded full name, no parens, e.g. `"Cross-Origin Resource Sharing"`. The acronym gets introduced naturally in the first paragraph instead.

## Component folder structure

`src/content/components/` is organized by how reusable a component is, not by which post first needed it. When adding something new, place it by this test, and it's always re-exported from the top-level `src/content/components/index.ts` barrel, which is the only path every post file imports from (`from "../components"`). Never make a post import a specific file path directly.

- **`primitives/`**, the prose building blocks every post uses: `Paragraph`, `Heading`, `InlineCode`, `CodeBlock`, `BlogImage`, `Formula`, `Quote`, `List`, `Diagram`. New primitives are rare, propose one to the user first.
- **`figures/`**, generic, config-driven, reusable across any future topic: `StatTiles` (counter tiles from a data array), `IconArchitectureDiagram` (node/edge/phase system diagram from a data array), `CapacityMathDiagram` (grouped back-of-envelope math that reveals line by line), `StaticCards` (`ApiEndpointsTable`, `SchemaCards`, static reference panels), `ReplicationDiagram` (a side-by-side comparison of two named configurations, each a small box diagram plus a one-line note). If a new figure is driven entirely by props/data and isn't tied to one post's narrative, it belongs here, even if it plays a GSAP timeline internally (`CapacityMathDiagram` does), the test is reusability, not "does it animate."
- **`animations/<slug>/`**, bespoke, hand-built GSAP/SVG animations that narrate one specific post's concept (hash collisions, cache hit/miss, key handoff, and so on). One folder per post slug. These are usually one-off and not reused, so don't force them into `figures/`. See "Building bespoke animations" below for how to build a new one (`GSAP_ANIMATIONS.md` at the repo root has extra depth on the same material if needed, but this section is self-sufficient).

**`GroupedIconCard` exists in the codebase but is retired, do not use it, even when a post seems to want a "here's what's inside this component" breakdown.** The user has explicitly said not to reach for it "unless very very necessary," and in practice it never turns out to be necessary, a plain sentence or a `List` naming the sub-parts reads just as well without adding a new visual shape to the page. If a future post seems to call for exactly this pattern, ask the user first rather than adding it back on your own judgment.

**Default to a static visual before reaching for a new bespoke GSAP animation, even for a process that has clear steps.** A step-by-step request/response chain (a message's send-ack-store-route-deliver round trip) does not automatically need motion to read clearly. This was a real, repeated correction on the Facebook Messenger post, a first draft used three separate hand-built GSAP timelines (a message round trip, a cache hit/miss lookup, a WebSocket handshake) plus a plain-div panel for a Kafka pub-sub fan-out, and the user pushed back on all of it wanting static visuals instead. Reserve an actual GSAP animation (see "Building bespoke animations" below) for a mechanism where the motion itself is the point, a race between two servers, a value forking down two different paths, a line drawing itself to show data actually moving, not just "this has multiple steps."

**"Static" has two different homes depending on what the diagram needs, know which one before building.** `IconArchitectureDiagram` with no `phases` prop is the right choice for a plain node/edge system diagram, boxes and arrows only, no text riding on the arrows themselves, no curved connectors, no double-headed arrows. It is the *wrong* choice the moment a post needs to reproduce something with per-edge labels, curves, or bidirectional arrows (the classic "User A / Chat Server A / Database / Chat Server B / User B" ack-chain diagram, if the user hands you a reference image, is this case), because `IconArchitectureDiagram`'s edges are unlabeled straight dashed lines only, forcing that shape into it either drops the labels or produces something that doesn't match what was asked for. For that second case, build a fully static (no GSAP timeline, no play/pause/replay controls) hand-coded SVG directly in `animations/<slug>/ConceptViz.tsx` instead, plain JSX `<line>`/`<path>`/`<text>` elements, `foreignObject` for icon+label boxes, a `motion.figure` fade-in wrapper for entrance, nothing else. `animations/<slug>/` is the right home for this even though nothing moves, the folder's purpose is "bespoke, hand-built SVG for one specific post's diagram," not "SVG that also animates." See `MessageAckChainDiagram` in `animations/designing-messenger/ConceptViz.tsx` for the reference shape, curved bidirectional connectors via a quadratic bezier `<path>` with `markerStart` and `markerEnd` both set, straight single-direction arrows via `<line>` with `markerEnd` only, and every label placed with real clearance from its own arrow's stroke (see the spacing rule below, it applies here just as much as to a GSAP piece).

**`IconArchitectureDiagram` had a real bug where a static (no `phases`) diagram showed a permanent amber ring around every node.** The highlight ring's opacity was only ever set by the GSAP timeline that runs during phase transitions, so with no `phases` there was no timeline to hide it, and the ring rendered at full opacity all the time, a stray yellow-ish box around every icon. This is fixed now, the ring element itself only renders when `phases` are actually present. If a future edit to this component reintroduces a ring, marker, or highlight element, make sure it defaults to hidden and is only revealed by the animation that's supposed to show it, not visible-by-default with animation only meant to hide it.

**If a clean version genuinely isn't achievable, it's fine to skip the diagram for that section entirely.** Don't ship a visual that overlaps text on a line or looks worse than the surrounding figures just to have "something there." A section can stand on prose and a `List` alone.

When a post needs a new visual, first check if `figures/` already has something that fits (most tabular, stat-shaped, or simple unlabeled node/edge needs do). Only reach for a new `animations/<slug>/` piece, static or GSAP, when nothing in `figures/` covers the shape. **And even then, ask whether it needs to be hand-coded SVG at all**, a "compare two static configurations side by side" figure (`ReplicationDiagram`, two panels of boxes and a one-line note each) reads just as clearly built with plain Tailwind divs, and divs can't produce the cramped-text bug custom SVG coordinates can (see "Layout spacing" under Building bespoke animations below).

**Reuse an existing bespoke animation across posts when the mechanism is literally the same.** `designing-pastebin.tsx` shares the Key Generation Service and cache-then-database read path with `designing-url-shortener.tsx`, so it imports `HashCollisionDiagram`, `KeyHandoffDiagram`, and `CacheFlowDiagram` straight from `animations/url-shortener/ConceptViz.tsx` and just writes a new caption, instead of duplicating the same GSAP timeline into a `animations/designing-pastebin/` folder. Only build a new bespoke animation when the post introduces a mechanism the site hasn't animated before (the object storage split, a CDN edge cache, and so on stayed prose in the pastebin post for this reason, no existing animation fit and a new one wasn't asked for).

## Component cheat sheet

All animation-aware components take a `delay` prop. Convention: start at `0.1`, increment by `~0.05` between sibling elements. This produces a gentle staggered entry.

| Component | Use for | Props |
|---|---|---|
| `Paragraph` | Body text | `delay` |
| `Heading` | Section headers | `level={2 \| 3 \| 4}`, `delay` |
| `InlineCode` | Single-token code in prose | (children only) |
| `CodeBlock` | Multi-line code with syntax highlighting | `language` (e.g. `"Python"`, `"TypeScript"`), `code`, `delay` |
| `BlogImage` | Figures, screenshots | `src`, `alt`, `caption`, `size={"sm"\|"md"\|"lg"\|"full"}` (default `md`), `delay` |
| `Formula` | KaTeX-rendered math | `block` (display mode), `delay`. Children must be a LaTeX string. |
| `Quote` | Pull quote | `author`, `delay` |
| `List` + `ListItem` | Bulleted, numbered list | `ordered` on `List`, `delay` on `List` |
| `Diagram` | Custom JSX diagram | `caption`, `delay` |
| `StatTiles` | Counting-up KPI tiles (capacity estimates, benchmark numbers) | `items: StatItem[]` (`label`, `value`, `suffix?`, `icon`, `color`), `delay` |
| `CapacityMathDiagram` | Back-of-envelope math (traffic, storage, bandwidth, cache) as a grouped, line-by-line reveal instead of prose paragraphs | `groups: CapacityGroup[]` (`title`, `lines: {expression, result}[]`, `note`), `delay`, `caption` |
| `IconArchitectureDiagram` | System diagram, node by node. Omit `phases` for a simple static box-and-arrow diagram (the default choice for any multi-step flow that doesn't need motion), pass `phases` only when the build-up itself needs to be animated | `nodes`, `edges`, `phases?` (cumulative build-up steps with a narrating `note`), `height`, `delay`, `caption` |
| `ApiEndpointsTable` | REST endpoint reference instead of a bullet list | `items: ApiEndpoint[]` (`method`, `path`, `description`), `delay` |
| `SchemaCards` | Database table schema instead of a bullet list | `tables: SchemaTableSpec[]` (`name`, `fields: {name, note?}[]`), `delay` |
| `ReplicationDiagram` | Side-by-side comparison of two named configurations (each a small box diagram plus a note) | `panels: [ReplicationPanel, ReplicationPanel]` (`title`, `writeLabel`, `fanLabel`, `nodes: string[]`, `highlightNodes?`, `note`), `delay` |

`GroupedIconCard` still exists in the codebase for backward compatibility with posts that already use it, but do not use it in new posts, see the note above the `figures/` list.

**Prefer a data-driven figure over a bulleted list for structured, parallel data.** A REST API's endpoints, a database schema's fields, a set of named config options, anything that's really rows of the same shape reads better as `ApiEndpointsTable` or `SchemaCards` than as `<List><ListItem><strong>Label.</strong> ...</ListItem></List>`. Keep `List` for prose-shaped bullets (takeaways, pros/cons, loosely parallel sentences).

## Building bespoke animations (GSAP + SVG)

For the hand-built, one-off SVG timelines that narrate a process step by step (a hash collision, a cache hit/miss fork, two servers racing for a key). Reference implementations: `animations/url-shortener/ConceptViz.tsx` (`HashCollisionDiagram`, `KeyHandoffDiagram`, `CacheFlowDiagram`) and `animations/designing-dropbox/ConceptViz.tsx` (`PresignedUploadDiagram`, `ChunkHashFlowDiagram`). `GSAP_ANIMATIONS.md` at the repo root covers the same ground in more depth if you want it, but everything needed to build one correctly is here.

**Reuse before rebuilding.** If a new post's mechanism is the same thing an existing animation already narrates (a cache-then-database read path, a key-handoff race), import the existing export from its `animations/<slug>/ConceptViz.tsx` and just write a new caption, the way `designing-pastebin.tsx` reuses all three url-shortener animations. Only build a new one when the post introduces a mechanism nothing on the site has animated yet.

**Mental model.** One GSAP timeline plays a story: intro to phase 1 to phase 2 to recap. Four parts, an SVG scene (boxes, cells, labels, built once in JS), the GSAP timeline (sequences *when* things happen), on-canvas `phase` text (a plain-language line updated live so the animation narrates itself with zero interaction), and deterministic data (real values computed up front so visuals never lie).

**The `Api` + `VizFigure` wrapper.** Every animation is a `setupXxx(svg)` function returning an `Api`, wrapped by a `VizFigure` component that gives it controls, theming, and in-view autoplay for free:

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
  /* build static scene with mk()/mkText(), set initial positions at build time */
  let tl: gsap.core.Timeline | null = null;
  const play = () => { tl?.kill(); /* gsap.set(...) back to start state */ tl = gsap.timeline(); /* ... */ };
  return { play, pause: () => tl?.pause(), resume: () => tl?.play(), setRate: (r) => tl?.timeScale(r), cleanup: () => tl?.kill() };
}

export const MyThingDiagram = ({ caption, delay }: { caption: string; delay?: number }) => (
  <VizFigure caption={caption} viewBox="0 0 900 480" maxW="max-w-2xl" delay={delay} setup={setupMyThing} />
);
```

Copy `VizFigure`, `mk()`, and `mkText()` verbatim from an existing `animations/<slug>/ConceptViz.tsx` the first time a post needs its own animation file, they're small and self-contained on purpose. `VizFigure` already handles the entrance fade, the `IntersectionObserver` (plays once when scrolled into view), and the control bar (play/pause, replay, 0.5x/1x/2x). Don't re-implement those. `play()` must `gsap.set()` everything back to its start state (including every `strokeDashoffset` back to full length) before rebuilding the timeline, or leftover state bleeds into the replay, this bug only shows up on the second play.

**Theming, non-negotiable.** Colors come entirely from CSS vars scoped to `.viz`/`.dark .viz` in `src/index.css`. `setAttribute("stroke", "var(--v-warn)")` silently fails, SVG presentation attributes don't resolve `var()`. **Always color via `class`** (`.viz-stroke`, `.viz-box`, `.viz-panel`, `.viz-blue`, `.viz-warn`, `.viz-label`, `.viz-label-sm`, `.viz-node-lbl`, `.viz-phase`, `.viz-warn-lbl`, arrowhead fills `.viz-arrow-ink|blue|warn`), and animate opacity/position/fill-opacity, never color, so light/dark switching stays live. `.viz-warn` is reserved for an actual negative outcome (a collision, a bug, a real gotcha), `.viz-blue` is the neutral/positive highlight. Don't spend the warning color on emphasis that isn't a problem.

**Layout basics.** Lay out in `viewBox` coordinates (it scales to fit). Center text with `text-anchor="middle"` (SVG defaults to left-anchored). A symmetric two-lane layout (mirrored columns) is the safest shape for "compare two things" stories, a single vertical chain with a fork is safest for "one thing, then it forks" stories (a hit/miss or match/no-match split). A node you move is a `<g>`, moved with `gsap.to(g, {x, y})`, set its start position at build time or it flashes at the origin before the first play.

**Self-drawing line, the signature move.**
```ts
const len = Math.hypot(x2 - x1, y2 - y1);
ln.style.strokeDasharray = String(len);
tl.fromTo(ln, { strokeDashoffset: len, opacity: 1 }, { strokeDashoffset: 0, duration: 0.35, ease: "none" }, at);
```
Create the line `opacity: 0` and reveal it exactly when the draw starts, arrowheads render through a hidden dash offset otherwise. Give every marker a unique id per instance (`Math.random().toString(36).slice(2, 7)`), two animations on one page collide on a shared id otherwise.

**Sequencing.** `">"` places a tween at the end of the timeline so far, `"<"` runs it concurrently with the previous tween's start, `"+=0.5"`/a number is relative or absolute time. `tl.add(() => { phase.textContent = "..."; }, at)` narrates *as it animates*, not just a summary after the fact. `tl.to({}, { duration: 1.2 })` is a deliberate read-pause between phases, don't skip these, a story with no pauses reads as a blur.

**Honest, deterministic data.** Compute the real thing up front, verify by hand or `node -e` that two lanes actually produce different values before wiring them in. Fixed example values are fine when the animation isn't making a claim about the data itself (a handoff mechanism doesn't need a real hash function behind it), but don't assume, check.

**Layout spacing, easy to get wrong.** A hand-coded SVG with too little vertical gap between a box's bottom edge and the label text below it produces cramped, overlapping-looking output, and this is very easy to get wrong by eyeballing coordinates. It already happened once in this repo (`PresignedUploadDiagram`'s first draft had a label sitting almost on top of the box above it, and the top phase text crowded the first box). As a rule of thumb, leave at least 25 to 30 viewBox units between a box's edge and any label text placed outside it, not the 10 to 15 units that reads fine in your head but cramped once rendered. Check that no label text touches or overlaps a box edge, that the top phase text has real breathing room before the first box, and that no arrow crosses through a box it isn't pointing at. This applies to every future SVG diagram on this site, GSAP-animated or fully static, not just the one that broke it.

**The same rule applies to a label sitting next to its own arrow, not just to boxes.** When a diagram puts text alongside a line or curve (an edge label on a hand-coded ack-chain diagram, for example), the user has explicitly called out overlapping label-on-arrow text as something to check for every time, strictly. Keep real clearance (aim for the same 25 to 30 unit range) between a label's nearest edge and the arrow's stroke, on both straight lines and curves. For a curve specifically, remember the label only needs clearance from the curve's *nearest* point, which for a bezier bulging away from the label is not the same x or y as either endpoint, work out where the curve is actually closest to the label before placing it, not just where the endpoints are.

**Integration rules.** Never remove existing figures when adding one, only add. Place a new animation right after the paragraph describing the mechanism it visualizes. No `Figure N` numbering on animation captions (that's for `BlogImage` screenshots only), one plain descriptive sentence instead. Give it a small independent `delay` (`0.05` to `0.1`), not the next number in the surrounding cascade, it triggers on scroll via `IntersectionObserver`, not on mount (a `delay={1.7}` here once produced a multi-second blank gap before the animation appeared).

## Math (KaTeX)

The `Formula` component renders LaTeX. Two important escape rules in JSX:

```tsx
// Inline: wrap the LaTeX string in {`...`} to preserve backslashes
<Formula>{`\\tau`}</Formula>
<Formula>{`N \\times N`}</Formula>

// Block, display
<Formula block>
  {`\\mathcal{L}_i = -\\log \\frac{\\exp(s_i / \\tau)}{\\sum_j \\exp(s_j / \\tau)}`}
</Formula>
```

Quick LaTeX reference:
- Greek: `\\tau`, `\\theta`, `\\sigma`, `\\mu`
- Operators: `\\times`, `\\cdot`, `\\leq`, `\\geq`, `\\approx`
- Subscript, superscript: `x_i`, `x^2`, `x_{ij}`, `x^{2n}`
- Fraction: `\\frac{a}{b}`
- Sum: `\\sum_{i=1}^{N}`
- Functions: `\\log`, `\\exp`, `\\sin`, `\\operatorname{sim}` for non-standard
- Calligraphy (loss): `\\mathcal{L}`

KaTeX is in lenient mode (`throwOnError: false`), so a malformed expression renders as red text rather than crashing the page.

## Capacity math, and verifying it

System design case studies always have a "sizing the problem" section (traffic, storage, bandwidth, cache). Don't write this as a wall of paragraphs doing arithmetic in prose, readers can't hold five chained numbers in their head reading English. Use `CapacityMathDiagram` instead, group the derivation (`Traffic`, `Storage`, `Bandwidth`, `Cache (hot 20%)` is the usual set), one or two sentences of framing prose before it to state the starting assumption (the one input number, e.g. "500 million new links a month"), then the diagram carries every subsequent derivation. Keep `StatTiles` right after it for the headline numbers, don't remove those.

**Verify every line before publishing, this is not optional.** A `CapacityMathDiagram` line is `{ expression, result }`, and it's easy to write an `expression` that *looks* like it produces the `result` next to it without actually checking the arithmetic, especially when chaining an already-rounded number into the next step. This shipped as a real bug once, a pastebin post line read `"12/s × 5 (read:write ratio)" -> "≈ 58 reads/s"`, which looks plausible but `12 × 5 = 60`, not `58`. The 58 was real (5,000,000 reads/day ÷ 86,400s ≈ 58), it just didn't come from 12, it came independently from the unrounded daily total. Before handing back any post with a `CapacityMathDiagram` or a capacity-related `Formula` block, run every line's arithmetic through `node -e` (or equivalent) and confirm expression actually produces result within a couple percent, not just that the final number matches the prose you already wrote. Prefer an extra explicit line over a compressed one that hides a chained rounding error, e.g. split "derive reads/day, then divide by seconds" into two lines rather than one line that multiplies two already-rounded per-second rates together.

## Code blocks

Use the `language` prop with the human-readable name. The component aliases to the right Prism grammar.

```tsx
<CodeBlock
  language="Python"
  code={`def contrastive_loss(image_embs, text_embs, t=0.07):
    ...`}
/>
```

Supported labels: `TypeScript`, `JavaScript`, `Python`, `Bash`, `JSON`, `CSS`, `HTML`. Anything else is passed through lowercased.

The code string is auto-trimmed. Theme switches with the site, GitHub light or VS Dark.

## Figures and placeholders

**Where final images go**: `cdn-assets/blog/<topic>/<filename>.png` (NOT `public/`, that would bloat the deploy artifact). Reference it exactly the same way from the component, `/blog/<topic>/<filename>.png` (absolute path, no leading dot). A Vite plugin in `vite.config.ts` serves it locally in dev and, at build, rewrites the path to a jsDelivr + wsrv.nl WebP CDN URL, so images are ~90% smaller on the live site and the artifact stays tiny no matter how many you add. Nothing else to configure, just drop the file in `cdn-assets/...` and use the `/blog/...` path.

**Placeholder convention**: when drafting, the user will swap real crops in later. For every figure the post needs, insert a `<BlogImage>` with `src="/placeholder.svg"` and a fully-written `caption`, `alt`, and `size`. The caption must accurately describe the figure that will eventually go there, so the user can drop in the right crop without re-reading the post.

```tsx
<BlogImage
  delay={0.5}
  size="md"
  src="/placeholder.svg"
  alt="Four image-text pairs: dog photo with caption, mountain photo with caption, etc."
  caption="Figure 2: A tiny batch of image-text pairs. Each image has exactly one matching caption; everything else is a non-match."
/>
```

Number figures sequentially (`Figure 1`, `Figure 2`, ...) in caption text. Do NOT add a "full reference image" or "appendix" at the end of the post unless the user asks.

**Caption format.** One sentence, concise. Pattern: `"Figure N: Short noun phrase. Key insight or numbers."` A period (or comma) separates what it shows from why it matters, do NOT use a semicolon or em-dash. Aim for the length of Figure 1/2 in the GRPO post, descriptive but not a paragraph. Wrong: `"Figure 3: This figure illustrates the step-by-step process by which..."`. Right: `"Figure 3: Numerical walkthrough for G=4. Mean reward 0.25 becomes the baseline, giving advantages +0.75 (correct) and -0.25 (wrong)."`.

**Size prop matters.** Default (`md`, max-w-xl ~576px) suits most screenshot crops. Use `lg` for wide horizontal pipeline diagrams. Use `full` only for true full-bleed images (rare). Use `sm` for small square or portrait crops that look blurred or upscaled at `md`.

## Animation delays

Start at `0.1`, step `0.05` per element. After a heading, the body paragraph that follows should be `+0.05` from the heading. Keep delays monotonically increasing; resetting partway through breaks the cascade.

For a long post, delays will reach `2.0`+, that's fine. They run on initial mount, not on scroll.

**Exception, viewport-triggered figures.** `StatTiles`, `IconArchitectureDiagram`, `ApiEndpointsTable`, `SchemaCards`, and any `animations/<slug>/` GSAP piece use `whileInView`/an `IntersectionObserver`, they play when scrolled into view, not on initial mount. Give these a small independent delay, `0.05` to `0.1`, not the next number in the main cascade. Don't try to make them monotonic with the surrounding text delays, they're on a different clock.

**If content gets edited out later**, a paragraph, a `Quote`, a whole section, don't leave the gap. Renumber every delay after the removed element so the sequence is still a clean `+0.05` staircase with no jumps. A `0.1` jump where there should be `0.05` is the tell that something was deleted and the sequence never got fixed, grep the file's delay values in order and check the diffs are all `0.05` before handing it back.

## Tags

Existing tags and colors live in `Writings.tsx`'s `tagColors` map. Reuse where possible. Conventions so far:
- `Machine Learning`, purple (`bg-purple-100 text-purple-700`), general ML topics
- `LLMs`, green (`bg-green-100 text-green-700`), language-model-specific
- `Intern`, blue (`bg-blue-100 text-blue-700`), internship or career narratives
- `Book`, yellow (`bg-yellow-100 text-yellow-700`), book reviews or reading notes
- `System Design`, orange (`bg-orange-100 text-orange-700`), individual system design concepts (caching, load balancing, partitioning, and so on)
- `Case Studies`, teal (`bg-teal-100 text-teal-700`), a full "design X" walkthrough that pulls several System Design concepts together (see `designing-url-shortener.tsx`, `designing-pastebin.tsx`). Note the actual tag string in `Writings.tsx` is `"Case Studies"`, not "System Design Case Studies", match that exact string or the folder view splits into two tags.

If a new tag is needed, pick a Tailwind color family that doesn't clash and add both to `tagColors` and `tagAccent` in `Writings.tsx` (the folder tab accent color, easy to miss).

## After drafting

1. Verify the dev server compiles (run `npm run dev` in background if not already running; default port `8080`).
2. Curl the new route to confirm 200: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/writings/<slug>`.
3. If the post added or touched any component (a new figure, a new animation, a reorganized import), also run `npx tsc --noEmit` and `npx vite build` once. A 200 from curl only proves the route mounts, it won't catch a type error in a prop the dev server's HMR papers over.
4. If the post has a `CapacityMathDiagram`, a capacity-related `Formula` block, or any other numeric derivation, verify every step's arithmetic independently (see Capacity math above) before calling it done, not just that it type-checks.
5. Grep the file for stray `:`, `;`, `—`, `–` in prose one more time (see Punctuation rule above), it's cheap and catches anything a mid-edit slipped in.
6. Send the user the local URL.
7. **Don't commit.** Leave commits to the user unless they explicitly ask.

**Deployment**: pushing to `main` auto-builds and publishes to the `gh-pages` branch (served by GitHub Pages' classic pipeline). Never push to `gh-pages` by hand, and don't touch the deploy workflow.

## Constraints

- Don't fabricate citations, paper titles, or numbers. If the user supplies a reference image or paper, derive examples from it; don't invent ones the source doesn't support.
- Don't add features the post doesn't need (analytics, share buttons, related-posts widgets) unless asked.
- Don't break the existing `example-showcase.tsx` post; it doubles as a component reference.
- Don't crop reference images. The user handles cropping themselves; just leave placeholders with accurate captions.
- A new **static, data-driven figure** in `figures/` (a table, a card grid, a stat row) is fine to add directly when the post's content genuinely needs it, follow the existing `StaticCards.tsx` pattern (props in, plain Tailwind out, no gsap). A new **bespoke animation** in `animations/<slug>/`, or any component that introduces a new interaction pattern, gets proposed to the user first.
- Don't add internal links to other posts on this site (no `<Link to="/writings/...">` in post prose). Reference a related concept by name in plain text if it helps, without turning it into a hyperlink.
