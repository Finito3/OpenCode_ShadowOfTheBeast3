#!/usr/bin/env python3
"""Scan SOTB3 disk images for code regions and dump them for Ghidra analysis."""

import sys
import os
from capstone import Cs, CS_ARCH_M68K, CS_MODE_BIG_ENDIAN

md = Cs(CS_ARCH_M68K, CS_MODE_BIG_ENDIAN)
md.skipdata = True

TRACK = 0x1800
WINDOW = 0x200
STEP = 0x100


def code_score(blob):
    ins = list(md.disasm(blob, 0))
    consumed = sum(len(i.bytes) for i in ins)
    mn = len(set(i.mnemonic for i in ins))
    return consumed, len(ins), mn


def scan_disk(path, outdir):
    data = open(path, 'rb').read()
    name = os.path.basename(path)
    os.makedirs(outdir, exist_ok=True)

    # Mark each byte as code/non-code using sliding window
    code_map = bytearray(len(data))  # 1 = likely code
    for side in range(2):
        for t in range(80):
            off = side * (80 * TRACK) + t * TRACK
            trk = data[off:off + TRACK]
            for w in range(0, TRACK - WINDOW, STEP):
                blob = trk[w:w + WINDOW]
                aa = blob.count(b'\xaa')
                zz = blob.count(b'\x00')
                ff = blob.count(b'\xff')
                if max(aa, zz, ff) > WINDOW * 0.5:
                    continue
                c, n, mn = code_score(blob)
                if c >= WINDOW * 0.5 and mn >= 10:
                    for i in range(w, w + WINDOW):
                        code_map[off + i] = 1

    # Find contiguous code regions
    regions = []
    i = 0
    while i < len(data):
        if code_map[i]:
            start = i
            while i < len(data) and code_map[i]:
                i += 1
            end = i
            if end - start >= 0x400:  # min 1KB
                regions.append((start, end))
        else:
            i += 1

    print(f"\n=== {name}: {len(regions)} code regions ===")
    for idx, (s, e) in enumerate(regions):
        size = e - s
        fname = f"{outdir}/{name}_region_{idx:03d}_0x{s:06x}_0x{e:06x}.bin"
        with open(fname, 'wb') as f:
            f.write(data[s:e])
        print(f"  region {idx:03d}: 0x{s:06x}-0x{e:06x} ({size:,} bytes) -> {fname}")
    return regions


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("usage: scan_code.py <outdir> <Disk.N> ...")
        sys.exit(2)
    outdir = sys.argv[1]
    for p in sys.argv[2:]:
        scan_disk(p, outdir)
