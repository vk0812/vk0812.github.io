#!/usr/bin/env python3
"""Estimate rendered text width, offline, no browser, no Playwright/Chromium.

This exists because the site's SVG figures set font-size in the same user
units as the rest of the coordinate system (a viewBox scales font-size along
with everything else), and it is very easy to center or pack a string that
looks fine at the character-count level but is visually wider than the box
or canvas it sits in. That gap shipped a real bug once: a bespoke animation's
longest GSAP-timeline narration string was never checked against the SVG's
own viewBox width, so it clipped off both edges once scrolled into view (see
"Real incident" in the blogger SKILL.md). A second, related bug shipped in
the same batch, an `IconArchitectureDiagram` node's `sub` label wrapped to
two lines because it was longer than the node box actually allows on one
line, and the offline collision check assumed every `sub` is exactly one
line, silently invalidating the check.

This is a character-count heuristic, not real font metrics. It is
deliberately biased wide (it overestimates width) so a string that "passes"
here has real margin, not just a marginal fit. Use it for guardrails before
committing coordinates, not as a pixel-perfect oracle.

Usage, CLI:
    python3 scripts/estimate_text_width.py "Some narration string" --preset viz-phase
    python3 scripts/estimate_text_width.py "Some narration string" --font-size 14 --weight bold --letter-spacing 0.04

Usage, importable:
    from estimate_text_width import estimate_width, PRESETS
    width = estimate_width("Some narration string", **PRESETS["viz-phase"])
"""

from __future__ import annotations

import argparse

# Average glyph width as a fraction of font-size, for the fonts this site
# actually uses (a serif/sans mix). Deliberately generous (wider than most
# real fonts average out to) so this stays a safe upper bound, not a guess
# that could go either way. Bold text is wider than regular at the same
# font-size, so it gets its own, larger factor.
REGULAR_CHAR_WIDTH_EM = 0.55
BOLD_CHAR_WIDTH_EM = 0.62

# Presets mirror every text class actually defined in src/index.css (the
# bespoke SVG/.viz system) plus the two IconArchitectureDiagram text roles,
# evaluated at IconArchitectureDiagram's narrower mobile breakpoint since
# that is the tighter constraint (see SKILL.md's node footprint section).
PRESETS: dict[str, dict[str, object]] = {
    "viz-label": {"font_size": 13, "weight": "regular", "letter_spacing_em": 0.06},
    "viz-label-sm": {"font_size": 11, "weight": "regular", "letter_spacing_em": 0.04},
    "viz-node-lbl": {"font_size": 12, "weight": "bold", "letter_spacing_em": 0.0},
    "viz-warn-lbl": {"font_size": 12, "weight": "bold", "letter_spacing_em": 0.0},
    "viz-phase": {"font_size": 14, "weight": "bold", "letter_spacing_em": 0.04},
    "viz-num": {"font_size": 15, "weight": "bold", "letter_spacing_em": 0.0},
    "viz-num-pos": {"font_size": 14, "weight": "bold", "letter_spacing_em": 0.0},
    "viz-num-neg": {"font_size": 14, "weight": "bold", "letter_spacing_em": 0.0},
    # IconArchitectureDiagram text, mobile breakpoint (w-24 = 96px node box,
    # the tighter of the two breakpoints, see check-icon-architecture-diagram.py.
    "icon-diagram-label": {"font_size": 11, "weight": "bold", "letter_spacing_em": 0.0},
    "icon-diagram-sub": {"font_size": 10, "weight": "regular", "letter_spacing_em": 0.0},
}


def estimate_width(text: str, font_size: float, weight: str = "regular", letter_spacing_em: float = 0.0) -> float:
    """Return an estimated rendered width in the same units as font_size."""
    per_char = font_size * (BOLD_CHAR_WIDTH_EM if weight == "bold" else REGULAR_CHAR_WIDTH_EM)
    spacing = max(0, len(text) - 1) * letter_spacing_em * font_size
    return len(text) * per_char + spacing


def max_chars_per_line(box_width: float, font_size: float, weight: str = "regular", letter_spacing_em: float = 0.0) -> int:
    """How many characters of this text style fit on one line inside box_width."""
    per_char = font_size * (BOLD_CHAR_WIDTH_EM if weight == "bold" else REGULAR_CHAR_WIDTH_EM) + letter_spacing_em * font_size
    if per_char <= 0:
        return 0
    return max(1, int(box_width // per_char))


def wrapped_line_count(text: str, box_width: float, font_size: float, weight: str = "regular", letter_spacing_em: float = 0.0) -> int:
    """How many lines `text` wraps to inside box_width, word-wrapping at spaces."""
    limit = max_chars_per_line(box_width, font_size, weight, letter_spacing_em)
    words = text.split()
    if not words:
        return 1
    lines = 1
    current = 0
    for word in words:
        word_len = len(word)
        needed = word_len if current == 0 else current + 1 + word_len
        if needed > limit and current > 0:
            lines += 1
            current = word_len
        else:
            current = needed
    return lines


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("text", help="The string to estimate")
    parser.add_argument("--preset", choices=sorted(PRESETS), help="Use a known site text style")
    parser.add_argument("--font-size", type=float, help="Font size in the same units as the coordinate system")
    parser.add_argument("--weight", choices=["regular", "bold"], default="regular")
    parser.add_argument("--letter-spacing", type=float, default=0.0, help="Letter spacing in em")
    parser.add_argument("--box-width", type=float, help="If given, also report wrapped line count inside this width")
    args = parser.parse_args()

    if args.preset:
        style = dict(PRESETS[args.preset])
    else:
        if args.font_size is None:
            parser.error("either --preset or --font-size is required")
        style = {"font_size": args.font_size, "weight": args.weight, "letter_spacing_em": args.letter_spacing}

    width = estimate_width(args.text, **style)
    print(f"estimated width: {width:.1f} units ({len(args.text)} chars, {style})")

    if args.box_width:
        lines = wrapped_line_count(args.text, args.box_width, **style)
        chars = max_chars_per_line(args.box_width, **style)
        print(f"at box width {args.box_width}: ~{chars} chars/line, wraps to {lines} line(s)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
