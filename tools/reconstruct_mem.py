#!/usr/bin/env python3
"""Reconstruct Shadow of the Beast III memory image (personal RE use).

Replicates the WHDLoad-equivalent loading sequence (linear copies from
Disk.N images + ByteKiller decrunch) to build the memory image the game
sees. All outputs stay in extracted/ (gitignored).

Loads (from $7C000 loader code + slave source):
 1. mem[$7C000:+$3000]   = Disk1[$A6800:+$3000]          (2nd-stage loader)
 2. mem[$59F80:+$16F80]  = Disk1[$8E338:+$16F80]        ($4AB38+$43800)
    decrunch mem[$59F80] -> mem[$5A000]
 3. mem[$7F80:+$33000]   = Disk1[$1800:+$33000]
    mem[$7F80+$33000:+$1634C] = Disk1[$78000:+$1634C]
    decrunch mem[$7F80] -> mem[$8000]
 4. decrunch mem[$7DE28] -> mem[$40000]  (embedded in loader track)
 5. mem[$68000:+512]     = Disk2[0:+512]                 (LoadDOS D1=0,D2=1)
    mem[$6FF90:+4608]    = Disk2[1024:+4608]             (LoadDOS D1=2,D2=9)

Usage: python3 tools/reconstruct_mem.py
Outputs: extracted/memory.bin (1MB), extracted/decrunched/*.bin
"""
import os
import struct
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from bytekiller import decrunch_blob, DecrunchError

PROJ = "/home/opencode/projects/ShadowOfTheBeast3"
ORIG = os.path.join(PROJ, "original/ShadowOfTheBeast3")
EXT = os.path.join(PROJ, "extracted")
DEC = os.path.join(EXT, "decrunched")


def u32(b, o):
    return struct.unpack_from('>I', b, o)[0]


def main():
    os.makedirs(DEC, exist_ok=True)
    d1 = open(os.path.join(ORIG, "Disk.1"), 'rb').read()
    d2 = open(os.path.join(ORIG, "Disk.2"), 'rb').read()
    d3 = open(os.path.join(ORIG, "Disk.3"), 'rb').read()
    mem = bytearray(0x100000)  # 1MB

    def load(dst, src, size, name):
        mem[dst:dst + size] = src[:size]
        print(f"LOAD mem[0x{dst:06x}:+0x{size:x}] <- {name}")

    def decrunch_at(src_addr, dst_addr, name):
        # read header at src to get sizes
        d0 = u32(mem, src_addr)
        d1 = u32(mem, src_addr + 4)
        print(f"DECRUNCH mem[0x{src_addr:x}] (comp={d0}, out={d1}) -> mem[0x{dst_addr:x}] ({name})")
        blob = bytes(mem[src_addr:src_addr + 12 + d0])
        out = decrunch_blob(blob)
        mem[dst_addr:dst_addr + len(out)] = out
        fn = os.path.join(DEC, f"{name}_0x{dst_addr:x}_{len(out)}.bin")
        open(fn, 'wb').write(out)
        print(f"  OK {len(out)} bytes -> {os.path.basename(fn)}")
        return len(out)

    # 1. second-stage loader
    load(0x7C000, d1[0xA6800:0xA6800 + 0x3000], 0x3000, "Disk1[$A6800] loader")
    # 2. $59F80 region
    load(0x59F80, d1[0x8E338:0x8E338 + 0x16F80], 0x16F80, "Disk1[$8E338]")
    decrunch_at(0x59F80, 0x5A000, "to_5A000")
    # 3. $7F80 region (two chunks)
    load(0x7F80, d1[0x1800:0x1800 + 0x33000], 0x33000, "Disk1[$1800] part1")
    load(0x7F80 + 0x33000, d1[0x78000:0x78000 + 0x1634C], 0x1634C, "Disk1[$78000] part2")
    decrunch_at(0x7F80, 0x8000, "to_8000")
    # 4. embedded in loader
    decrunch_at(0x7DE28, 0x40000, "to_40000")
    # 5. LoadDOS sectors from Disk.2
    load(0x68000, d2[0:512], 512, "Disk2[0] dos")
    load(0x6FF90, d2[1024:1024 + 4608], 4608, "Disk2[1024] dos")

    open(os.path.join(EXT, "memory.bin"), 'wb').write(bytes(mem))
    print(f"\nMemory image saved: {os.path.join(EXT, 'memory.bin')} (1MB)")
    # verify LoadDOS magic
    print(f"mem[$68004] = 0x{u32(mem,0x68004):08x} (expect b2fca1fe)")


if __name__ == '__main__':
    main()
