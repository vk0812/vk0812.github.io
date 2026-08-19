#!/usr/bin/env python3
"""Render deterministic diagnostic SVG/PNG previews from visual layout JSON.

Usage:
    python3 scripts/render-svg-layout.py layout.json
    python3 scripts/render-svg-layout.py layout.json --out-dir /tmp/blogger-visual-qa

This is intentionally not the production renderer. It is a zero-server visual
sanity pass for the exact geometry described by check-svg-layout.py. It draws
boxes, labels, and connector paths using the same viewBox coordinates so a
reviewer can inspect spacing and arrow relationships even when the React app
cannot be launched. PNG output is produced when CairoSVG is installed. SVG
output is always produced.
"""

from __future__ import annotations

import argparse
import html
import json
from pathlib import Path
from typing import Any


def esc(value: Any) -> str:
    return html.escape(str(value), quote=True)


def render_layout(layout: dict[str, Any]) -> str:
    name = layout.get("name", "layout")
    canvas = layout.get("canvas") or {"width": 900, "height": 500}
    width = float(canvas["width"])
    height = float(canvas["height"])
    boxes = {box["id"]: box for box in layout.get("boxes", [])}

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:g} {height:g}" width="{width:g}" height="{height:g}">',
        '<rect width="100%" height="100%" fill="#ffffff"/>',
        '<style>text{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;fill:#222}.box{fill:#f5f6fa;stroke:#222;stroke-width:2}.nested{fill:none;stroke:#777;stroke-width:1.5;stroke-dasharray:7 6}.edge{fill:none;stroke:#3049b8;stroke-width:2.5}.label{font-size:11px;fill:#666}.node{font-size:12px;font-weight:700}.phase{font-size:14px;font-weight:700}.warn{fill:#c65d3d;font-weight:700}</style>',
        '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#3049b8"/></marker></defs>',
        f'<text x="12" y="20" class="label">diagnostic · {esc(name)}</text>',
    ]

    for box in layout.get("boxes", []):
        cls = "nested" if box.get("inside") is None and any(child.get("inside") == box["id"] for child in layout.get("boxes", [])) else "box"
        parts.append(
            f'<rect class="{cls}" x="{box["x"]}" y="{box["y"]}" width="{box["width"]}" height="{box["height"]}" rx="12"/>'
        )

    for edge in layout.get("edges", []):
        points = edge.get("points", [])
        if len(points) < 2:
            continue
        coords = " ".join(f"{x},{y}" for x, y in points)
        parts.append(f'<polyline class="edge" points="{coords}" marker-end="url(#arrow)"/>')

    class_map = {
        "viz-node-lbl": "node",
        "viz-warn-lbl": "warn",
        "viz-phase": "phase",
        "viz-label": "label",
        "viz-label-sm": "label",
    }
    for label in layout.get("labels", []):
        if "text" not in label:
            continue
        anchor = label.get("anchor", "start")
        css = class_map.get(label.get("preset"), "label")
        parts.append(
            f'<text x="{label["x"]}" y="{label["y"]}" text-anchor="{esc(anchor)}" class="{css}">{esc(label["text"])}</text>'
        )

    parts.append("</svg>")
    return "\n".join(parts)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("layout", type=Path)
    parser.add_argument("--out-dir", type=Path, default=Path("/tmp/blogger-visual-qa"))
    args = parser.parse_args()

    data = json.loads(args.layout.read_text())
    layouts = data.get("layouts", [data])
    args.out_dir.mkdir(parents=True, exist_ok=True)

    try:
        import cairosvg  # type: ignore
    except ImportError:
        cairosvg = None

    for index, layout in enumerate(layouts, start=1):
        safe = "".join(ch if ch.isalnum() or ch in "-_" else "-" for ch in layout.get("name", f"layout-{index}"))
        svg = render_layout(layout)
        svg_path = args.out_dir / f"{safe}.svg"
        svg_path.write_text(svg)
        print(svg_path)
        if cairosvg is not None:
            png_path = args.out_dir / f"{safe}.png"
            cairosvg.svg2png(bytestring=svg.encode(), write_to=str(png_path), output_width=1200)
            print(png_path)

    if cairosvg is None:
        print("CairoSVG not installed, SVG diagnostics created without PNG copies")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
