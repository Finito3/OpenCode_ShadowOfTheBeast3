#!/usr/bin/env python3
"""Render Amiga bitplane graphics to PNG (personal RE use).
Usage: render_bp.py <blob> <pal_offset> <data_offset> <out.png>
  [--width 320] [--planes 3] [--rows 192] [--interleaved] [--palette-n 32]
Palette: 12-bit 0x0RGB words, big-endian.
"""
import struct
import sys

try:
    from PIL import Image
except ImportError:
    sys.stderr.write("need pillow\n")
    raise SystemExit(2)


def parse_args(argv):
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("blob")
    ap.add_argument("pal_offset", type=lambda x: int(x, 0))
    ap.add_argument("data_offset", type=lambda x: int(x, 0))
    ap.add_argument("out")
    ap.add_argument("--width", type=int, default=320)
    ap.add_argument("--planes", type=int, default=3)
    ap.add_argument("--rows", type=int, default=192)
    ap.add_argument("--interleaved", action="store_true")
    ap.add_argument("--palette-n", type=int, default=32)
    return ap.parse_args(argv)


def main(argv):
    a = parse_args(argv)
    data = open(a.blob, 'rb').read()
    pal = []
    for i in range(a.palette_n):
        w = struct.unpack('>H', data[a.pal_offset + i * 2:a.pal_offset + i * 2 + 2])[0]
        r = ((w >> 8) & 0xF) * 17
        g = ((w >> 4) & 0xF) * 17
        b = (w & 0xF) * 17
        pal.append((r, g, b))
    rb = a.width // 8
    img = Image.new('RGB', (a.width, a.rows))
    px = img.load()
    off = a.data_offset
    for y in range(a.rows):
        for x in range(a.width):
            col = 0
            for p in range(a.planes):
                if a.interleaved:
                    addr = off + (y * a.planes + p) * rb + x // 8
                else:
                    addr = off + p * rb * a.rows + y * rb + x // 8
                if addr >= len(data):
                    break
                bit = (data[addr] >> (7 - (x % 8))) & 1
                col |= bit << p
            px[x, y] = pal[col % len(pal)]
    img.save(a.out)
    print(f"saved {a.out} ({a.width}x{a.rows}x{a.planes})")


if __name__ == '__main__':
    main(sys.argv[1:])
