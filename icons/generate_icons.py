#!/usr/bin/env python3
"""Render the Edit Page extension icon at Chrome's required sizes."""

from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent
SCALE = 8


def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(
        tuple(value * SCALE for value in box),
        radius=radius * SCALE,
        fill=fill,
        outline=outline,
        width=width * SCALE,
    )


def polygon(draw, points, fill):
    draw.polygon([(x * SCALE, y * SCALE) for x, y in points], fill=fill)


def create_master():
    size = 128 * SCALE
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    # The browser page is now the whole icon, maximizing clarity at 16 px.
    rounded(draw, (5, 5, 123, 123), 25, "#FFFFFF")
    rounded(draw, (8, 8, 120, 41), 20, "#4F46E5")
    draw.rectangle((8 * SCALE, 25 * SCALE, 120 * SCALE, 41 * SCALE), fill="#4F46E5")

    for x, color in ((25, "#F9A8D4"), (37, "#FDE68A"), (49, "#6EE7B7")):
        draw.ellipse(((x - 3.5) * SCALE, 21.5 * SCALE, (x + 3.5) * SCALE, 28.5 * SCALE), fill=color)

    rounded(draw, (24, 61, 75, 70), 4.5, "#A5B4FC")
    rounded(draw, (24, 79, 62, 88), 4.5, "#C7D2FE")
    rounded(draw, (24, 97, 51, 106), 4.5, "#E0E7FF")

    pencil = Image.new("RGBA", image.size, (0, 0, 0, 0))
    pen = ImageDraw.Draw(pencil)
    rounded(pen, (66, 73, 116, 97), 8, "#06B6D4")
    pen.rectangle((103 * SCALE, 73 * SCALE, 113 * SCALE, 97 * SCALE), fill=(255, 255, 255, 235))
    polygon(pen, [(66, 73), (66, 97), (46, 85)], "#FDE68A")
    polygon(pen, [(53, 80.8), (53, 89.2), (46, 85)], "#312E81")
    pencil = pencil.rotate(-25, center=(84 * SCALE, 85 * SCALE), resample=Image.Resampling.BICUBIC)
    image.alpha_composite(pencil)

    # Draw the outline last so the colored header never protrudes past the page.
    draw = ImageDraw.Draw(image)
    rounded(draw, (5, 5, 123, 123), 25, None, "#312E81", 6)
    return image


master = create_master()
for output_size in (16, 48, 128):
    output = master.resize((output_size, output_size), Image.Resampling.LANCZOS)
    path = ROOT / f"icon{output_size}.png"
    output.save(path, optimize=True)
    print(f"Generated {path.name}")
