#!/usr/bin/env python3
"""Analyze a WHDLoad-style SOTB3 disk image (Disk.1/2/3).

The WHDLoad images are linear: 160 tracks x 0x1800 bytes (12 sectors x 512),
side-major (tracks 0..79 = side 0, 80..159 = side 1) as used by the game's
own track loader.

Usage:
  python3 tools/disk_report.py <Disk.N>
  python3 tools/disk_report.py <Disk.N> --scan-code     # needs capstone
  python3 tools/disk_report.py <Disk.N> --track 31 --dump out.bin
  python3 tools/disk_report.py <Disk.N> --bootloader out.bin
"""
import argparse
import sys

TRACK = 0x1800  # 12 * 512
TRACKS = 160


def entropy(b):
    from collections import Counter
    import math
    if not b:
        return 0.0
    c = Counter(b)
    n = len(b)
    return -sum((v / n) * math.log2(v / n) for v in c.values())


def code_density(b):
    """Fraction of bytes decoded as valid 68k instructions (needs capstone)."""
    from capstone import Cs, CS_ARCH_M68K, CS_MODE_BIG_ENDIAN
    md = Cs(CS_ARCH_M68K, CS_MODE_BIG_ENDIAN)
    ins = list(md.disasm(b, 0))
    consumed = sum(len(i.bytes) for i in ins)
    mn = len(set(i.mnemonic for i in ins))
    return consumed / len(b), mn


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path")
    ap.add_argument("--scan-code", action="store_true",
                    help="scan for 68k code tracks (needs capstone)")
    ap.add_argument("--track", type=int)
    ap.add_argument("--dump")
    ap.add_argument("--bootloader")
    args = ap.parse_args()

    d = open(args.path, "rb").read()
    print("file: %s  size=%d  tracks=%d" % (args.path, len(d), len(d) // TRACK))

    if args.bootloader:
        # boot block copies disk[0x0C:0x410] to $78000 (entry $780D8)
        blob = d[0x0C:0x410]
        open(args.bootloader, "wb").write(blob)
        print("bootloader -> %s (%d bytes, base $78000)" % (args.bootloader, len(blob)))
        return

    if args.track is not None:
        off = args.track * TRACK
        t = d[off:off + TRACK]
        print("track %d @ 0x%x  entropy=%.2f" % (args.track, off, entropy(t)))
        if args.dump:
            open(args.dump, "wb").write(t)
            print("track dumped -> %s" % args.dump)
        return

    if args.scan_code:
        try:
            for i in range(min(TRACKS, len(d) // TRACK)):
                t = d[i * TRACK:(i + 1) * TRACK]
                frac, mn = code_density(t)
                if frac > 0.30 and mn > 20:
                    print("track %3d @ 0x%06x  code~%.2f  mnemonics=%d"
                          % (i, i * TRACK, frac, mn))
        except ImportError:
            sys.stderr.write("capstone not installed\n")
            return 2
        return

    # default: summary of tracks
    ntracks = min(TRACKS, len(d) // TRACK)
    for i in range(ntracks):
        t = d[i * TRACK:(i + 1) * TRACK]
        print("track %3d @ 0x%06x  entropy=%.2f" % (i, i * TRACK, entropy(t)))


if __name__ == "__main__":
    raise SystemExit(main())
