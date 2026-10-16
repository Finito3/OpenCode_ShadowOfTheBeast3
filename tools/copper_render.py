#!/usr/bin/env python3
"""Minimal copper emulator + scanline renderer (personal RE use).

Parses an Amiga copperlist from a RAM dump, emulates register state per
scanline (BPLxPTH/PTL, COLOR00-31, BPLCON0/1, BPL1MOD/2MOD, SPRxPTH/PTL),
then renders each scanline with active pointers/palette/modulo/scroll.

Usage:
  python3 tools/copper_render.py 1lvl.dat --copper 0xD62 --out out.png
  [--width 320] [--rows 192] [--planes 6] [--dual]
"""
import struct
import sys

try:
    from PIL import Image
except ImportError:
    sys.stderr.write("need pillow\n")
    raise SystemExit(2)


def parse_copper(d, base, max_ins=2000):
    ins = []
    for i in range(max_ins):
        o = base + i * 4
        if o + 4 > len(d):
            break
        a = struct.unpack('>H', d[o:o + 2])[0]
        b = struct.unpack('>H', d[o + 2:o + 4])[0]
        if a & 1:
            ins.append(('WAIT', a, b))
            if a == 0xFFFF and b == 0xFFFE:
                break
        else:
            ins.append(('MOVE', a, b))
    return ins


def main(argv):
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("dump")
    ap.add_argument("--copper", type=lambda x: int(x, 0), default=0xD62)
    ap.add_argument("--out", default="extracted/renders/copper.png")
    ap.add_argument("--width", type=int, default=320)
    ap.add_argument("--rows", type=int, default=192)
    ap.add_argument("--planes", type=int, default=6)
    ap.add_argument("--dual", action="store_true",
                    help="dual playfield: PF1=odd planes colors 0-7, PF2=even colors 8-15")
    args = ap.parse_args(argv)
    d = open(args.dump, 'rb').read()
    ins = parse_copper(d, args.copper)
    print(f"copper ins: {len(ins)}")

    # state per scanline: step through WAITs
    # collect MOVE runs separated by WAIT vp
    bands = []  # (start_vp, moves dict)
    cur = {}
    cur_vp = 0
    for kind, a, b in ins:
        if kind == 'WAIT':
            vp = (a >> 8) & 0xFF
            # end previous band at this vp
            bands.append((cur_vp, dict(cur)))
            cur_vp = vp
            if a == 0xFFFF:
                break
        else:
            cur[a] = b
    bands.append((cur_vp, dict(cur)))
    print(f"bands: {len(bands)} (vp: {[v for v, _ in bands][:12]}...)")

    def palette_of(st):
        pal = []
        for i in range(32):
            w = st.get(0x180 + i * 2, 0)
            pal.append((((w >> 8) & 0xF) * 17, ((w >> 4) & 0xF) * 17, (w & 0xF) * 17))
        return pal

    def bpl_addr(st, n):
        # n = 1..6 -> PTH reg 0xE0+(n-1)*4? No: BPLnPTH = 0xE0+(n-1)*4? BPL1PTH=E0,BPL2PTH=E4...
        reg = 0xE0 + (n - 1) * 4
        return ((st.get(reg, 0) << 16) | st.get(reg + 2, 0)) & 0xFFFFFF

    img = Image.new('RGB', (args.width, args.rows))
    px = img.load()
    rb = args.width // 8
    for y in range(args.rows):
        # active band = last band with start_vp <= y (+44 offset? copper VP counts from top incl blanking)
        # Amiga VP 0 = top of blanking; visible starts ~44. Our bands use raw vp; map y -> vp = y+44 approx.
        # Simpler: use band by order (band k covers rows proportionally) OR match exact vp.
        vp = y + 44
        st = bands[0][1]
        for sv, sm in bands:
            if sv <= vp:
                st = sm
        pal = palette_of(st)
        mod1 = st.get(0x108, 0)
        # signed modulo
        if mod1 & 0x8000:
            mod1 -= 0x10000
        for x in range(args.width):
            c = 0
            for p in range(1, args.planes + 1):
                addr = bpl_addr(st, p)
                if addr == 0 or addr >= len(d):
                    continue
                # row stride: interleaved assumed (planes contiguous per row)
                off = addr + (y * args.planes + (p - 1)) * rb + x // 8
                if off >= len(d):
                    continue
                bit = (d[off] >> (7 - (x % 8))) & 1
                c |= bit << (p - 1)
            if args.dual:
                # PF1 = odd planes (bits 0,2,4), PF2 = even (bits 1,3,5); priority by playfield
                pf1 = (c & 1) | ((c >> 1) & 2) | ((c >> 2) & 4)  # bits 0,2,4 -> 0..7
                pf2 = ((c >> 1) & 1) | ((c >> 2) & 2) | ((c >> 3) & 4)  # bits 1,3,5 -> 0..7
                if pf2:
                    px[x, y] = pal[8 + pf2]
                else:
                    px[x, y] = pal[pf1]
            else:
                px[x, y] = pal[c % 32]
    img.save(args.out)
    print(f"saved {args.out}")


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
