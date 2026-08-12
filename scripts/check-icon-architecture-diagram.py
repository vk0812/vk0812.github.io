#!/usr/bin/env python3
"""Offline collision check for IconArchitectureDiagram, text-wrapping aware.

Usage:
    python3 scripts/check-icon-architecture-diagram.py layout.json

Replaces the old "write a throwaway Node script per diagram" pattern. That
pattern shipped a real bug, every throwaway script assumed a node's `sub`
text always renders on exactly one line (matching the flat height constants
that used to live in SKILL.md, ~88px with no sub, ~102px with one), but a
`sub` string longer than the node box can hold on one line actually wraps to
two or three lines, silently invalidating that assumption. The wrapped
"router weight times expert output" sub on the mixture-of-experts post's
final combine node is the real incident that motivated this script, its true
rendered height was taller than the formula assumed, which let it overlap
the node below with no warning from the old check. See "Real incident" in
SKILL.md for the full story.

This script computes each node's TRUE footprint from its actual `label` and
`sub` strings (using scripts/estimate_text_width.py's wrapping estimate) at
BOTH of IconArchitectureDiagram's real Tailwind breakpoints, mobile (w-24,
h-12, 11px label) and desktop (w-28, h-14, 12px label, same 10px sub either
way), and uses the larger of the two, so a diagram that is safe here is safe
at both screen sizes, not just the one someone happened to picture mentally.

JSON input mirrors the component's real props:

{
  "height": 560,
  "nodes": [
    {"id": "tokens", "label": "Token embeddings", "sub": "4 tokens in this example", "x": 50, "y": 8}
  ],
  "edges": [{"from": "tokens", "to": "router"}]
}

`height` is the same `height` prop passed to <IconArchitectureDiagram>.
`x`/`y` are percent, exactly as passed to the component. No browser,
Chromium, or Playwright involved, this is pure arithmetic mirroring the
component's own CSS.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from estimate_text_width import wrapped_line_count  # noqa: E402

# Mirrors IconArchitectureDiagram.tsx exactly. Keep these in sync if that
# component's Tailwind classes ever change.
BREAKPOINTS = {
    "mobile": {"box_width": 96, "icon": 48, "label_font": 11, "label_weight": "bold"},
    "desktop": {"box_width": 112, "icon": 56, "label_font": 12, "label_weight": "bold"},
}
SUB_FONT = 10
SUB_WEIGHT = "regular"
GAP_ICON_TO_TEXT = 8       # Tailwind gap-2
LABEL_LINE_HEIGHT_EM = 1.25
SUB_LINE_HEIGHT_EM = 1.3
SUB_MARGIN_TOP = 2         # Tailwind mt-0.5

# Empirically matches the skill's original ~8 constant (56px half-width /
# 700px container ~= 8%), kept as the single source of truth here instead
# of two numbers that could drift apart.
CONTAINER_WIDTH_PX = 700
NODE_R = 8  # percent radius reserved around each icon for line-clipping, mirrors the component's NODE_R


def node_footprint_px(label: str, sub: str | None) -> tuple[float, float]:
    """Return (half_height_px, half_width_px), the worse of the two breakpoints."""
    best_height = 0.0
    best_width = 0.0
    for bp in BREAKPOINTS.values():
        label_lines = wrapped_line_count(label, bp["box_width"], bp["label_font"], bp["label_weight"])
        total = bp["icon"] + GAP_ICON_TO_TEXT + label_lines * bp["label_font"] * LABEL_LINE_HEIGHT_EM
        if sub:
            sub_lines = wrapped_line_count(sub, bp["box_width"], SUB_FONT, SUB_WEIGHT)
            total += SUB_MARGIN_TOP + sub_lines * SUB_FONT * SUB_LINE_HEIGHT_EM
        best_height = max(best_height, total)
        best_width = max(best_width, bp["box_width"])
    return best_height / 2, best_width / 2


def to_percent(nodes: list[dict[str, Any]], height: float) -> dict[str, dict[str, float]]:
    footprints: dict[str, dict[str, float]] = {}
    for n in nodes:
        half_h_px, half_w_px = node_footprint_px(n.get("label", ""), n.get("sub"))
        footprints[n["id"]] = {
            "x": n["x"],
            "y": n["y"],
            "half_h": half_h_px / height * 100,
            "half_w": half_w_px / CONTAINER_WIDTH_PX * 100,
        }
    return footprints


def rects_overlap(a: dict[str, float], b: dict[str, float]) -> bool:
    return (
        abs(a["x"] - b["x"]) < (a["half_w"] + b["half_w"])
        and abs(a["y"] - b["y"]) < (a["half_h"] + b["half_h"])
    )


def clip(a: dict[str, float], b: dict[str, float], r: float) -> tuple[float, float]:
    dx, dy = b["x"] - a["x"], b["y"] - a["y"]
    dist = (dx ** 2 + dy ** 2) ** 0.5 or 1
    return a["x"] + dx / dist * r, a["y"] + dy / dist * r


def segment_hits_rect(p1: tuple[float, float], p2: tuple[float, float], rect: dict[str, float]) -> bool:
    lo_x, hi_x = rect["x"] - rect["half_w"], rect["x"] + rect["half_w"]
    lo_y, hi_y = rect["y"] - rect["half_h"], rect["y"] + rect["half_h"]
    dx, dy = p2[0] - p1[0], p2[1] - p1[1]
    t0, t1 = 0.0, 1.0
    for p, q in ((-dx, p1[0] - lo_x), (dx, hi_x - p1[0]), (-dy, p1[1] - lo_y), (dy, hi_y - p1[1])):
        if p == 0:
            if q < 0:
                return False
            continue
        r = q / p
        if p < 0:
            t0 = max(t0, r)
        else:
            t1 = min(t1, r)
    return t0 < t1 and t1 > 0 and t0 < 1


def check(layout: dict[str, Any]) -> list[str]:
    issues: list[str] = []
    height = layout["height"]
    nodes = layout["nodes"]
    edges = layout.get("edges", [])
    footprints = to_percent(nodes, height)

    by_id = {n["id"]: n for n in nodes}
    ids = list(footprints)
    for i, a_id in enumerate(ids):
        for b_id in ids[i + 1:]:
            if rects_overlap(footprints[a_id], footprints[b_id]):
                fa, fb = footprints[a_id], footprints[b_id]
                issues.append(
                    f"node overlap: {a_id} (footprint {fa['half_w']*2:.1f}x{fa['half_h']*2:.1f}%) "
                    f"with {b_id} (footprint {fb['half_w']*2:.1f}x{fb['half_h']*2:.1f}%)"
                )

    for e in edges:
        a, b = footprints.get(e["from"]), footprints.get(e["to"])
        if not a or not b:
            issues.append(f"edge references missing node: {e}")
            continue
        p1 = clip(a, b, NODE_R)
        p2 = clip(b, a, NODE_R)
        for node_id, rect in footprints.items():
            if node_id in (e["from"], e["to"]):
                continue
            if segment_hits_rect(p1, p2, rect):
                issues.append(f"edge {e['from']}->{e['to']} crosses unrelated node: {node_id}")

    for n in nodes:
        sub = n.get("sub")
        if sub:
            for bp_name, bp in BREAKPOINTS.items():
                lines = wrapped_line_count(sub, bp["box_width"], SUB_FONT, SUB_WEIGHT)
                if lines >= 3:
                    issues.append(
                        f"node '{n['id']}' sub wraps to {lines} lines at {bp_name} width "
                        f"('{sub}'), shorten it or move the detail into prose/caption instead"
                    )

    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("layout", type=Path)
    args = parser.parse_args()

    layout = json.loads(args.layout.read_text())
    issues = check(layout)
    if issues:
        print("\n".join(issues))
        print(f"{len(issues)} issue(s) found", file=sys.stderr)
        return 1
    print("No node overlaps, edge crossings, or excessive sub wrapping found")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
