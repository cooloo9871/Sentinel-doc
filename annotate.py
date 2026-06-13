#!/usr/bin/env python3
"""Add red rectangles to screenshots for documentation annotations."""
import sys
from PIL import Image, ImageDraw

def annotate(input_path, output_path, boxes):
    """
    boxes: list of (x1, y1, x2, y2) tuples in CSS pixels
    """
    img = Image.open(input_path).convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for (x1, y1, x2, y2) in boxes:
        draw.rectangle([x1, y1, x2, y2], outline=(220, 38, 38, 255), width=3)
    result = Image.alpha_composite(img, overlay).convert("RGB")
    result.save(output_path, "PNG")
    print(f"Saved: {output_path}")

if __name__ == "__main__":
    # Usage: python3 annotate.py input.png output.png x1,y1,x2,y2 [x1,y1,x2,y2 ...]
    inp, out = sys.argv[1], sys.argv[2]
    boxes = [tuple(int(v) for v in b.split(",")) for b in sys.argv[3:]]
    annotate(inp, out, boxes)
