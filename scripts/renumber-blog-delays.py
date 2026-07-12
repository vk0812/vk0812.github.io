#!/usr/bin/env python3
"""Renumber prose animation delays in a blog JSX file.

Usage:
    python3 scripts/renumber-blog-delays.py src/content/posts/designing-yelp.tsx

Viewport-triggered figures keep their small independent delay. Paragraphs,
headings, lists, and other normal content receive a 0.1, 0.15, 0.2, ...
staircase in source order.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


VIEWPORT_COMPONENTS = {
    "ApiEndpointsTable",
    "CapacityMathDiagram",
    "IconArchitectureDiagram",
    "ReplicationDiagram",
    "SchemaCards",
    "StatTiles",
}

OPENING_TAG = re.compile(r"<([A-Z][A-Za-z0-9]*)\b[^>]*>", re.DOTALL)
DELAY_PROP = re.compile(r"(\bdelay\s*=\s*)\{[^}]+\}")


def renumber(source: str) -> str:
    counter = 0

    def replace_tag(match: re.Match[str]) -> str:
        nonlocal counter
        tag = match.group(1)
        original = match.group(0)
        preserve = tag in VIEWPORT_COMPONENTS or tag.endswith("Diagram")

        if preserve:
            return original

        def replace_delay(delay_match: re.Match[str]) -> str:
            nonlocal counter
            value = 0.1 + counter * 0.05
            counter += 1
            return f"{delay_match.group(1)}{{{value:.2f}}}"

        return DELAY_PROP.sub(replace_delay, original)

    return OPENING_TAG.sub(replace_tag, source)


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python3 scripts/renumber-blog-delays.py <blog.tsx>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    if not path.is_file():
        print(f"File not found: {path}", file=sys.stderr)
        return 2

    original = path.read_text()
    updated = renumber(original)
    if updated == original:
        print(f"No delay props changed in {path}")
        return 0

    path.write_text(updated)
    print(f"Renumbered normal content delays in {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
