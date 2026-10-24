"""Optional artwork generator: python3 -m pip install Pillow, then run this file.

The website build uses the checked-in GIF/PNG and does not require Python.
This is an editorial animation of the existing schematic, not model output.
"""
from pathlib import Path
import math
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "papers"
OUT.mkdir(parents=True, exist_ok=True)
W, H = 800, 640
BG = "#e9ecf4"
BLUE = "#2642d5"
INK = "#293f77"
MUTED = "#52638a"

def font(name, size):
    return ImageFont.truetype(name, size)

serif = font("DejaVuSerif.ttf", 72)
mono = font("DejaVuSansMono.ttf", 16)
labels = font("DejaVuSans.ttf", 25)
small = font("DejaVuSansMono.ttf", 15)

def blend(a, b, t):
    aa = tuple(int(a[i:i+2], 16) for i in (1, 3, 5))
    bb = tuple(int(b[i:i+2], 16) for i in (1, 3, 5))
    return tuple(round(x+(y-x)*t) for x,y in zip(aa,bb))

def render(t):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.text((46, 40), "LANGUAGE DIFFUSION TRANSFORMER", font=small, fill=MUTED)
    d.text((42, 78), "LangDiT", font=serif, fill=INK)
    for x, label in [(46, "NOISY STATE"), (316, "TRANSFORMER"), (588, "PREDICTIONS")]:
        d.text((x, 217), label, font=small, fill=MUTED)
    # All token states and predictions light up together; no token-by-token reveal.
    groups = [(46, ["z₁", "z₂", "z₃"]), (316, ["Norm", "Attn", "FFN"]), (588, ["p(x₁)", "p(x₂)", "p(x₃)"])]
    for col, (x, names) in enumerate(groups):
        strength = max(0, 1-abs(t-(0.16+col*0.29))/0.19)
        for row, label in enumerate(names):
            y = 253+row*61
            fill = blend("#365bc2", BLUE, strength) if col==1 else blend("#f9fafc", "#ced8ff", strength)
            edge = blend("#97a8d1", BLUE, strength)
            d.rounded_rectangle((x, y, x+166, y+49), radius=5, fill=fill, outline=edge, width=2)
            d.text((x+83, y+24), label, font=labels, fill="white" if col==1 else INK, anchor="mm")
    for start, end, phase in [(225, 302, .23), (495, 574, .52)]:
        y = 338
        d.line((start,y,end,y), fill="#a3afca", width=2)
        d.line((end-8,y-7,end,y,end-8,y+7), fill="#7d8caf", width=2)
        progress = (t-phase)/.22
        if 0 <= progress <= 1:
            x = start+(end-start)*progress
            d.ellipse((x-5,y-5,x+5,y+5), fill=BLUE)
    d.line((46, 470, 754, 470), fill="#c8d0df", width=1)
    for i, line in enumerate(["Continuous representations.", "Noise-aware computation.", "Joint token predictions."]):
        d.text((46, 494+i*28), line, font=mono, fill=MUTED)
    return img

frames = [render(i/59) for i in range(60)]
# A shared palette prevents color flicker and keeps the animation small.
palette = frames[43].quantize(colors=128)
indexed = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
indexed[0].save(OUT / "langdit-preview.gif", save_all=True, append_images=indexed[1:], duration=100, loop=0, optimize=True)
frames[43].save(OUT / "langdit-poster.png", optimize=True)
print("Created assets/papers/langdit-preview.gif and langdit-poster.png")
