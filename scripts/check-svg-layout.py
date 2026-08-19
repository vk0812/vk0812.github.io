#!/usr/bin/env python3
"""Offline geometry checks for bespoke SVG and GSAP visuals.

Usage:
    python3 scripts/check-svg-layout.py layout.json

The input may describe one layout directly or several under a top-level
`layouts` array. Coordinates use the visual's own SVG viewBox space.

Text can be described in two ways. Existing width/height rectangles remain
supported. New visuals should prefer text-aware labels such as:

    {
      "id": "approval-sub",
      "text": "explicit boundary crossing",
      "preset": "viz-label-sm",
      "x": 760,
      "y": 262,
      "anchor": "middle",
      "inside": "approval",
      "padding": 8
    }

When `text` and `preset` are present, width is estimated conservatively with
`estimate_text_width.py`. This catches the common failure where a centered
label looks fine in source but renders wider than its containing box.

Boxes may declare `inside` when they are intentionally nested. Labels may
declare `inside` to require containment in a particular box, and
`allow_overlap_with` for deliberate boundary-label crossings. Edges may use
`allow_cross` for deliberate crossings such as a line that exits a sandbox
boundary. These exceptions must be explicit rather than silently ignored.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from estimate_text_width import PRESETS, estimate_width  # noqa: E402

Point = tuple[float, float]
Rect = tuple[float, float, float, float]


def rect(item: dict[str, Any]) -> Rect:
    return float(item["x"]), float(item["y"]), float(item["width"]), float(item["height"])


def overlaps(a: Rect, b: Rect) -> bool:
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    return ax < bx + bw and ax + aw > bx and ay < by + bh and ay + ah > by


def contains_rect(outer: Rect, inner: Rect, padding: float = 0) -> bool:
    ox, oy, ow, oh = outer
    ix, iy, iw, ih = inner
    return (
        ix >= ox + padding
        and iy >= oy + padding
        and ix + iw <= ox + ow - padding
        and iy + ih <= oy + oh - padding
    )


def label_rect(item: dict[str, Any]) -> Rect:
    if "width" in item and "height" in item:
        return rect(item)
    if "text" not in item or "preset" not in item:
        raise ValueError(f"label {item.get('id')} needs width/height or text/preset")
    preset = item["preset"]
    if preset not in PRESETS:
        raise ValueError(f"label {item.get('id')} uses unknown preset {preset}")
    style = PRESETS[preset]
    width = estimate_width(item["text"], **style)
    font_size = float(style["font_size"])
    height = font_size * 1.3
    x = float(item["x"])
    baseline = float(item["y"])
    anchor = item.get("anchor", "start")
    left = x - width / 2 if anchor == "middle" else x - width if anchor == "end" else x
    top = baseline - height
    return left, top, width, height


def segment_hits_rect(start: Point, end: Point, box: Rect) -> bool:
    x, y, width, height = box
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    parameters = (
        (-dx, start[0] - x),
        (dx, x + width - start[0]),
        (-dy, start[1] - y),
        (dy, y + height - start[1]),
    )
    lower, upper = 0.0, 1.0
    for coefficient, distance in parameters:
        if coefficient == 0:
            if distance <= 0:
                return False
            continue
        value = distance / coefficient
        if coefficient < 0:
            lower = max(lower, value)
        else:
            upper = min(upper, value)
    return lower < upper and upper > 0 and lower < 1


def check_one(layout: dict[str, Any]) -> list[str]:
    name = layout.get("name", "layout")
    issues: list[str] = []
    box_defs = {item["id"]: item for item in layout.get("boxes", [])}
    boxes = {item_id: rect(item) for item_id, item in box_defs.items()}
    label_defs = {item["id"]: item for item in layout.get("labels", [])}

    try:
        labels = {item_id: label_rect(item) for item_id, item in label_defs.items()}
    except ValueError as error:
        return [f"{name}: {error}"]

    def ancestors(box_id: str) -> set[str]:
        found: set[str] = set()
        current = box_id
        while current in box_defs and box_defs[current].get("inside"):
            current = box_defs[current]["inside"]
            if current in found:
                issues.append(f"{name}: cyclic box nesting involving {current}")
                break
            found.add(current)
        return found

    canvas = layout.get("canvas")
    if canvas:
        canvas_rect: Rect = (0.0, 0.0, float(canvas["width"]), float(canvas["height"]))
        for kind, items in (("box", boxes), ("label", labels)):
            for item_id, item_rect in items.items():
                if not contains_rect(canvas_rect, item_rect):
                    issues.append(f"{name}: {kind} exceeds canvas: {item_id} {item_rect}")

    ids = list(boxes)
    for index, first_id in enumerate(ids):
        for second_id in ids[index + 1 :]:
            if box_defs[first_id].get("inside") == second_id or box_defs[second_id].get("inside") == first_id:
                continue
            if overlaps(boxes[first_id], boxes[second_id]):
                issues.append(f"{name}: box overlap: {first_id} with {second_id}")

    for label_id, label_box in labels.items():
        definition = label_defs[label_id]
        inside = definition.get("inside")
        ignored = set(definition.get("allow_overlap_with", []))
        if inside:
            if inside not in boxes:
                issues.append(f"{name}: label {label_id} references missing container {inside}")
            else:
                padding = float(definition.get("padding", 6))
                if not contains_rect(boxes[inside], label_box, padding):
                    issues.append(
                        f"{name}: label escapes box: {label_id} not safely inside {inside}; "
                        f"label={label_box} box={boxes[inside]} padding={padding}"
                    )
                ignored |= {inside} | ancestors(inside)
        for box_id, box_rect in boxes.items():
            if box_id in ignored:
                continue
            if overlaps(label_box, box_rect):
                issues.append(f"{name}: label overlap: {label_id} with box {box_id}")

    label_ids = list(labels)
    for index, first_id in enumerate(label_ids):
        for second_id in label_ids[index + 1 :]:
            if overlaps(labels[first_id], labels[second_id]):
                issues.append(f"{name}: label overlap: {first_id} with {second_id}")

    for edge in layout.get("edges", []):
        edge_id = edge["id"]
        points = [(float(x), float(y)) for x, y in edge.get("points", [])]
        if len(points) < 2:
            issues.append(f"{name}: edge has fewer than two points: {edge_id}")
            continue
        for endpoint_name in ("from", "to"):
            endpoint_id = edge.get(endpoint_name)
            if endpoint_id and endpoint_id not in boxes:
                issues.append(f"{name}: edge references missing box: {edge_id} {endpoint_name}={endpoint_id}")
        ignored = {edge.get("from"), edge.get("to")} | set(edge.get("allow_cross", []))
        if edge.get("from"):
            ignored |= ancestors(edge["from"])
        if edge.get("to"):
            ignored |= ancestors(edge["to"])
        for start, end in zip(points, points[1:]):
            for box_id, box_rect in boxes.items():
                if box_id in ignored:
                    continue
                if segment_hits_rect(start, end, box_rect):
                    issues.append(f"{name}: edge crosses unrelated box: {edge_id} through {box_id}")

    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("layout", type=Path, help="JSON layout file to check")
    args = parser.parse_args()

    try:
        data = json.loads(args.layout.read_text())
    except (OSError, json.JSONDecodeError) as error:
        print(f"Unable to read layout: {error}", file=sys.stderr)
        return 2

    layouts = data.get("layouts", [data])
    issues: list[str] = []
    for layout in layouts:
        issues.extend(check_one(layout))

    if issues:
        print("\n".join(issues))
        print(f"{len(issues)} visual layout issue(s) found", file=sys.stderr)
        return 1

    print(f"No visual layout issues found across {len(layouts)} layout(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
