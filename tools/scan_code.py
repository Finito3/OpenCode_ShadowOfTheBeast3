#!/usr/bin/env python3
"""Scan SOTB3 disk images for code regions and map them.

Disk layout: side-major, 80 tracks per side, 0x1800 bytes per track.
  side 0: tracks 0-79 at 0x00000-0x77FFF
  side 1: tracks 0-79 at 0x78000-0xEFFFF
"""

import sys
from capstone import Cs, CS_ARCH_M68K, CS_MODE_BIG_ENDIAN

md = Cs(CS_ARCH_M68K, CS_MODE_BIG_ENDIAN)
md.skipdata = True

TRACK = 0x1800


def code_score(blob):
    """Return (bytes_consumed, num_instructions, unique_mnemonics)."""
    ins = list(md.disasm(blob, 0))
    consumed = sum(len(i.bytes) for i in ins)
    mn = len(set(i.mnemonic for i in ins))
    return consumed, len(ins), mn


def scan_disk(path, min_density=0.6, min_mn=12, window=0x200):
    data = open(path, 'rb').read()
    ntracks = len(data) // TRACK
    print(f"\n=== {path}: {len(data)} bytes, {ntracks} tracks ===")

    regions = []
    for side in range(2):
        for t in range(80):
            off = side * (80 * TRACK) + t * TRACK
            trk = data[off:off + TRACK]
            # scan track in windows
            for w in range(0, TRACK - window, 0x100):
                blob = trk[w:w + window]
                # skip mostly-empty/AA/FF
                aa = blob.count(b'\xaa')
                zz = blob.count(b'\x00')
                ff = blob.count(b'\xff')
                if max(aa, zz, ff) > window * 0.5:
                    continue
                c, n, mn = code_score(blob)
                if c >= window * min_density and mn >= min_mn:
                    abs_off = off + w
                    regions.append((abs_off, side, t, w, c, n, mn))

    # Merge adjacent regions
    regions.sort()
    merged = []
    for r in regions:
        if merged and r[0] == merged[-1][0] + merged[-1][3]:
            # extend previous
            merged[-1] = list(merged[-1])
            merged[-1][3] += window
            merged[-1][4] += r[4]
            merged[-1][5] += r[5]
        else:
            merged.append(list(r))

    print(f"Found {len(merged)} code regions:")
    for r in merged:
        off, side, t, woff, c, n, mn = r
        size = woff  # actually window-sized chunks merged
        print(f"  side={side} track={t:3d} disk_off=0x{off+woff:06x} "
              f"code_bytes={c} instrs={n} mnemonics={mn}")


if __name__ == '__main__':
    for p in sys.argv[1:]:
        scan_disk(p)
