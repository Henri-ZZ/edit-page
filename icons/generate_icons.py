#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import math

def create_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw rounded rectangle background
    margin = size // 16
    radius = size // 6
    draw.rounded_rectangle([margin, margin, size - margin, size - margin],
                           radius=radius, fill=(74, 144, 217, 255))

    # Draw pencil icon
    padding = size // 4
    pencil_margin = padding
    pencil_color = (255, 255, 255, 255)
    stroke_width = max(2, size // 32)

    # Pencil coordinates (scaled)
    s = size - 2 * pencil_margin
    x0 = pencil_margin
    y0 = pencil_margin

    # Pencil tip triangle
    tip_size = s * 0.15
    tip_points = [
        (x0 + s * 0.12, y0 + s * 0.88),
        (x0 + s * 0.12, y0 + s * 0.75),
        (x0 + s * 0.25, y0 + s * 0.88),
    ]
    draw.polygon(tip_points, fill=pencil_color)

    # Pencil body
    body_rect = [
        (x0 + s * 0.12, y0 + s * 0.28),
        (x0 + s * 0.72, y0 + s * 0.88),
    ]
    draw.rectangle(body_rect, fill=pencil_color)

    # Pencil diagonal cut
    cut_points = [
        (x0 + s * 0.12, y0 + s * 0.28),
        (x0 + s * 0.30, y0 + s * 0.10),
        (x0 + s * 0.90, y0 + s * 0.70),
        (x0 + s * 0.72, y0 + s * 0.88),
    ]
    draw.polygon(cut_points, fill=pencil_color)

    # Pencil line
    line_start = (x0 + s * 0.25, y0 + s * 0.15)
    line_end = (x0 + s * 0.85, y0 + s * 0.75)
    draw.line([line_start, line_end], fill=(74, 144, 217, 255), width=stroke_width)

    return img

for size in [16, 48, 128]:
    icon = create_icon(size)
    icon.save(f'/Users/conghua/code/edit-page/icons/icon{size}.png')
    print(f'Generated icon{size}.png')

print('Done!')
