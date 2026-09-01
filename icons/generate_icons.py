#!/usr/bin/env python3
"""Render Chrome extension PNG icons from icons/icon.svg."""

from pathlib import Path

try:
    import cairosvg
except ImportError as error:
    raise SystemExit(
        "CairoSVG is required. Install it with: python3 -m pip install CairoSVG"
    ) from error


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "icon.svg"
SIZES = (16, 48, 128)


for size in SIZES:
    output = ROOT / f"icon{size}.png"
    cairosvg.svg2png(
        url=str(SOURCE),
        write_to=str(output),
        output_width=size,
        output_height=size,
    )
    print(f"Generated {output.name} from {SOURCE.name}")
