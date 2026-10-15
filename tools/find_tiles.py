#!/usr/bin/env python3
"""Find Amiga ILBM tiles in a memory dump (Maptapper-style, personal RE use).

Scans a binary for 16x16 tile candidates (3/4/5 planes, sequential and
interleaved) and scores them by structure (solid runs + limited colors).
Real tiles score high, noise scores low.

Usage: python3 tools/find_tiles.py <blob> [--stride 32] [--top 20]
"""
import struct
import sys

TW, TH, RB = 16, 16, 2


def tile_bytes(planes):
    return TH * RB * planes


def get_tile(data, base, planes, seq):
    """Return list of color indices for a 16x16 tile, or None if OOB."""
    n = tile_bytes(planes)
    if base + n > len(data):
        return None
    cols = []
    for y in range(TH):
        for x in range(TW):
            c = 0
            for p in range(planes):
                addr = base + ((p * TH + y) * RB + x // 8 if seq
                               else (y * planes + p) * RB + x // 8)
                bit = (data[addr] >> (7 - (x % 8))) & 1
                c |= bit << p
            cols.append(c)
    return cols


def score_tile(cols):
    """Higher = more tile-like. Rewards solid 2x2 blocks and few colors."""
    if cols is None:
        return -1
    distinct = len(set(cols))
    if distinct <= 1 or distinct > 12:
        return -1
    solid = 0
    for y in range(0, TH - 1):
        for x in range(0, TW - 1):
            a = cols[y * TW + x]
            if (a == cols[y * TW + x + 1] == cols[(y + 1) * TW + x]
                    == cols[(y + 1) * TW + x + 1]):
                solid += 1
    # runs: horizontal same-color runs of 3+
    runs = 0
    for y in range(TH):
        r = 1
        for x in range(1, TW):
            if cols[y * TW + x] == cols[y * TW + x - 1]:
                r += 1
            else:
                if r >= 3:
                    runs += r
                r = 1
        if r >= 3:
            runs += r
    return solid + runs - distinct * 2


def main(argv):
    path = argv[1] if len(argv) > 1 else None
    if not path:
        print(__doc__)
        return 2
    stride = 32
    topn = 20
    for i, a in enumerate(argv):
        if a == '--stride' and i + 1 < len(argv):
            stride = int(argv[i + 1])
        if a == '--top' and i + 1 < len(argv):
            topn = int(argv[i + 1])
    data = open(path, 'rb').read()
    print(f"scan {path} ({len(data)}B), stride={stride}")
    results = []
    for planes in (3, 4, 5):
        for seq in (True, False):
            n = tile_bytes(planes)
            scored = []
            for base in range(0, len(data) - n, stride):
                s = score_tile(get_tile(data, base, planes, seq))
                if s > 60:
                    scored.append((s, base))
            scored.sort(reverse=True)
            tag = f"{planes}p-{'seq' if seq else 'int'}"
            print(f"== {tag}: {len(scored)} candidates over 60")
            for s, b in scored[:topn]:
                print(f"   score={s:4d} base=0x{b:06x}")
                results.append((s, b, planes, seq))
    results.sort(reverse=True)
    print(f"\nTOP {topn} overall:")
    for s, b, p, q in results[:topn]:
        print(f"  score={s:4d} base=0x{b:06x} {p}p-{'seq' if q else 'int'}")


if __name__ == '__main__':
    raise SystemExit(main(sys.argv))
