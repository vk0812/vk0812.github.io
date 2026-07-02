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
- Use commas, colons, parentheses, or two short sentences instead.
- Hyphens inside compound words are fine ("image-text", "L2-normalize", "self-supervised"). The rule is about dashes used as a substitute for a comma or sentence break.
- JS/TS code semicolons (statement terminators, import lines) are fine, the rule only applies to prose.

**What to avoid**
- Generic openers like "In today's fast-paced world of AI..." or "In this blog post, we will explore...". Just start.
- Scope-and-prerequisites sentences like "This post covers X, Y, and Z" or "Basic distributed systems familiarity assumed." Cut straight from the hook into content, don't preview the table of contents in prose.
- Bulleted summaries of obvious things. Bullets earn their place by listing genuinely parallel items.
- Filler transitions ("Now, let's move on to...", "As we discussed before..."). Trust the reader.
- Abbreviations and shortforms in prose: always spell out the full term ("load balancer" not "LB", "Weighted Round Robin" not "WRR"). Acronyms that are themselves the canonical name (WAF, CDN, CPU, DNS, HTTP, HTTPS, SSL, TLS) are fine.
- Marketing-speak ("revolutionary", "game-changing", "unleash the power of"). Never.

## Structure

Standard arc for a technical post (6 to 9 sections, ~1500 to 2500 words):

1. **Cold open**, 1 to 2 paragraphs grounding the topic in something the reader has already seen ("If you've used image search..."). Do NOT add a "this post covers X, Y, Z" scope sentence or a "basic X familiarity assumed" prerequisite sentence, just launch straight into the core idea after the hook.
2. **The core idea**, the one-sentence version of the concept, before any math or detail.
3. **Setup, data, prerequisites**, what the inputs look like, with a concrete example.
4. **The mechanism**, the actual technical content, broken into 2 to 4 sub-sections.
5. **Loss, objective, key equation** (if applicable), a single block formula plus a plain-language walkthrough of every symbol. Follow with the actual code.
6. **What it produces, why it works**, the outcome (embedding space, fine-tuned model, whatever).
7. **End-to-end summary**, one figure or a short ordered list that puts every step together.
8. **Takeaways**, a tight bulleted list, 3 to 5 items.
9. **Practical tips**, bulleted list of things that actually matter when implementing. Bold the lead phrase of each item.
10. **Closing**, short. One paragraph zooming out, a pointer to further reading, a one-line sign-off ("Thanks for reading...").

Personal posts (like `intern-exp.tsx`) follow a looser narrative arc but the same voice rules.

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

**Where final images go**: `public/blog/<topic>/<filename>.png`, referenced as `/blog/<topic>/<filename>.png` from the component (absolute path, no leading dot).

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

## Tags

Existing tags and colors live in `Writings.tsx`'s `tagColors` map. Reuse where possible. Conventions so far:
- `ML`, purple (`bg-purple-100 text-purple-700`), general ML topics
- `LLMs`, green (`bg-green-100 text-green-700`), language-model-specific
- `Intern`, blue (`bg-blue-100 text-blue-700`), internship or career narratives
- `Book`, yellow (`bg-yellow-100 text-yellow-700`), book reviews or reading notes

If a new tag is needed, pick a Tailwind color family that doesn't clash and add to `tagColors`.

## After drafting

1. Verify the dev server compiles (run `npm run dev` in background if not already running; default port `8080`).
2. Curl the new route to confirm 200: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/writings/<slug>`.
3. Send the user the local URL.
4. **Don't commit.** Leave commits to the user unless they explicitly ask.

## Constraints

- Don't fabricate citations, paper titles, or numbers. If the user supplies a reference image or paper, derive examples from it; don't invent ones the source doesn't support.
- Don't add features the post doesn't need (analytics, share buttons, related-posts widgets) unless asked.
- Don't break the existing `example-showcase.tsx` post; it doubles as a component reference.
- Don't crop reference images. The user handles cropping themselves; just leave placeholders with accurate captions.
- Stay within the existing component set. If a post truly needs something new (a callout box, a table), propose it to the user before adding a new component.
