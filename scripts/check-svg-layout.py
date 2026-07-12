#!/usr/bin/env python3
"""Check boxes, labels, and SVG connector geometry from a JSON layout.

Usage:
    python3 scripts/check-svg-layout.py layout.json

The JSON format is intentionally renderer-agnostic:

{
  "boxes": [{"id": "parent", "x": 100, "y": 40, "width": 120, "height": 50}],
  "labels": [{"id": "caption", "x": 20, "y": 10, "width": 80, "height": 16}],
  "edges": [
    {"id": "parent-child", "from": "parent", "to": "child",
     "points": [[160, 90], [160, 120]]}
  ]
}

Coordinates are in the same space as the visual. Edge points can describe a
straight line or a polyline. The checker reports duplicate identities, box and
label overlaps, missing edge targets, connector crossings through unrelated
boxes, and endpoints placed inside any box.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


Point = tuple[float, float]
Rect = tuple[float, float, float, float]


def rect(item: dict[str, Any]) -> Rect:
    return (float(item["x"]), float(item["y"]), float(item["width"]), float(item["height"]))


def contains(r: Rect, p: Point) -> bool:
    x, y, width, height = r
    return x < p[0] < x + width and y < p[1] < y + height


def overlaps(a: Rect, b: Rect) -> bool:
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    return ax < bx + bw and ax + aw > bx and ay < by + bh and ay + ah > by


def segment_hits_rect(start: Point, end: Point, box: Rect) -> bool:
    """Use Liang-Barsky clipping to detect interior segment intersections."""
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


def points(edge: dict[str, Any]) -> list[Point]:
    return [(float(point[0]), float(point[1])) for point in edge["points"]]


def check_layout(layout: dict[str, Any]) -> list[str]:
    issues: list[str] = []

    for kind in ("boxes", "labels", "edges"):
        seen: set[str] = set()
        for item in layout.get(kind, []):
            item_id = item["id"]
            if item_id in seen:
                issues.append(f"duplicate {kind[:-1]} id: {item_id}")
            seen.add(item_id)

    boxes = {item["id"]: (item, rect(item)) for item in layout.get("boxes", [])}
    labels = {item["id"]: (item, rect(item)) for item in layout.get("labels", [])}

    box_items = list(boxes.items())
    for index, (first_id, (_, first_rect)) in enumerate(box_items):
        for second_id, (_, second_rect) in box_items[index + 1 :]:
            if overlaps(first_rect, second_rect):
                issues.append(f"box overlap: {first_id} with {second_id}")

    label_items = list(labels.items())
    for label_id, (_, label_rect) in label_items:
        for box_id, (_, box_rect) in boxes.items():
            if overlaps(label_rect, box_rect):
                issues.append(f"label overlap: {label_id} with box {box_id}")
    for index, (first_id, (_, first_rect)) in enumerate(label_items):
        for second_id, (_, second_rect) in label_items[index + 1 :]:
            if overlaps(first_rect, second_rect):
                issues.append(f"label overlap: {first_id} with {second_id}")

    for edge in layout.get("edges", []):
        edge_id = edge["id"]
        edge_points = points(edge)
        if len(edge_points) < 2:
            issues.append(f"edge has fewer than two points: {edge_id}")
            continue
        for endpoint_name in ("from", "to"):
            endpoint_id = edge.get(endpoint_name)
            if endpoint_id and endpoint_id not in boxes:
                issues.append(f"edge references missing box: {edge_id} {endpoint_name}={endpoint_id}")

        for endpoint_name, endpoint in (("start", edge_points[0]), ("end", edge_points[-1])):
            for box_id, (_, box_rect) in boxes.items():
                if contains(box_rect, endpoint):
                    issues.append(f"edge endpoint inside box: {edge_id} {endpoint_name} in {box_id}")

        for start, end in zip(edge_points, edge_points[1:]):
            for box_id, (_, box_rect) in boxes.items():
                if box_id in {edge.get("from"), edge.get("to")}:
                    continue
                if segment_hits_rect(start, end, box_rect):
                    issues.append(f"edge crosses unrelated box: {edge_id} through {box_id}")

    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("layout", type=Path, help="JSON layout file to check")
    args = parser.parse_args()

    try:
        layout = json.loads(args.layout.read_text())
    except (OSError, json.JSONDecodeError) as error:
        print(f"Unable to read layout: {error}", file=sys.stderr)
        return 2

    issues = check_layout(layout)
    if issues:
        print("\n".join(issues))
        print(f"{len(issues)} layout issue(s) found", file=sys.stderr)
        return 1

    print("No box, label, endpoint, or connector collisions found")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
