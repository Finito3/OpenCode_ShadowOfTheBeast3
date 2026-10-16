#!/usr/bin/env python3
"""Parse Amiga copperlist from a RAM dump + render framebuffer (personal RE).

Usage:
  python3 tools/copper_fb.py 1lvl.dat --copper 0xD62 --out extracted/renders/fb.png
  [--base-override 0x71BB6] [--width 320] [--planes 3] [--rows 192]
  [--palette 0x398:tools-palette | copper]

Copper MOVE = (reg,value) words; WAIT = reg word with bit0=1.
Bitplane regs $E0-$F6 give framebuffer addresses (PTH<<16|PTL).
"""
import struct
import sys

try:
    from PIL import Image
except ImportError:
    sys.stderr.write("need pillow\n")
    raise SystemExit(2)


def parse_copper(d, base, max_ins=400):
    ins = []
    for i in range(max_ins):
        o = base + i * 4
        if o + 4 > len(d):
            break
        reg = struct.unpack('>H', d[o:o + 2])[0]
        val = struct.unpack('>H', d[o + 2:o + 4])[0]
        if reg & 1:
            ins.append(('WAIT', reg, val))
            if reg == 0xFFFF and val == 0xFFFE:
                break
        else:
            ins.append(('MOVE', reg, val))
    return ins


def main(argv):
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("dump")
    ap.add_argument("--copper", type=lambda x: int(x, 0), default=0xD62)
    ap.add_argument("--out", default="extracted/renders/fb.png")
    ap.add_argument("--width", type=int, default=320)
    ap.add_argument("--planes", type=int, default=3)
    ap.add_argument("--rows", type=int, default=192)
    ap.add_argument("--palette", default="copper",
                    help="'copper' = use COLORxx MOVEs from list, or 0xOFF (blob off with 32 colors)")
    args = ap.parse_args(argv)
    d = open(args.dump, 'rb').read()
    ins = parse_copper(d, args.copper)
    bpl = {}
    colors = {}
    for kind, reg, val in ins:
        if kind == 'MOVE' and 0xE0 <= reg <= 0xF6 and reg % 2 == 0:
            bpl[reg] = val
        if kind == 'MOVE' and 0x180 <= reg <= 0x1BE and reg % 2 == 0:
            colors[(reg - 0x180) // 2] = val
    # framebuffer base from BPL1PTH/PTL
    base = (bpl.get(0xE0, 0) << 16) | bpl.get(0xE2, 0)
    print(f"copper ins: {len(ins)}, BPL1=0x{base:06x}, colors={len(colors)}")
    if base == 0 or base >= len(d):
        # fallback: explicit base via --palette trick not needed; abort
        print("no valid framebuffer base in copperlist")
        return 1
    if args.palette == 'copper':
        pal = []
        for i in range(32):
            w = colors.get(i, 0)
            pal.append((((w >> 8) & 0xF) * 17, ((w >> 4) & 0xF) * 17, (w & 0xF) * 17))
    else:
        off = int(args.palette, 0)
        blob = open("extracted/decrunched/to_8000_0x8000_375772.bin", 'rb').read()
        pal = []
        for i in range(32):
            w = struct.unpack('>H', blob[off + i * 2:off + i * 2 + 2])[0]
            pal.append((((w >> 8) & 0xF) * 17, ((w >> 4) & 0xF) * 17, (w & 0xF) * 17))
    rb = args.width // 8
    img = Image.new('RGB', (args.width, args.rows))
    px = img.load()
    for y in range(args.rows):
        for x in range(args.width):
            c = 0
            for p in range(args.planes):
                addr = base + (y * args.planes + p) * rb + x // 8
                if addr >= len(d):
                    break
                bit = (d[addr] >> (7 - (x % 8))) & 1
                c |= bit << p
            px[x, y] = pal[c % 32]
    img.save(args.out)
    print(f"saved {args.out}")


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
