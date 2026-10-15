#!/usr/bin/env python3
"""ByteKiller decruncher for Shadow of the Beast III (personal RE use).

Faithful Python re-implementation of the 68k routine from the GPL WHDLoad
patch source (ShadowOfTheBeast3HD.s, Decrunch/.decrunch). The bitstream is
read BACKWARDS (pre-decrement longwords) with a 0x80000000 sentinel, exactly
like the 68k LSR/ROXR carry logic.

Blob format at file start:
  +0: d0 = compressed payload size in bytes (after the 12-byte header)
  +4: d1 = decompressed output size in bytes
  +8: d5 = checksum seed (running XOR of raw longwords must end at 0)

Usage:
  python3 tools/bytekiller.py decrunch <in.bin> <blob_offset> <out.bin>
  python3 tools/bytekiller.py scan <disk_image> [--max-hits N]

Scan tries plausible headers and reports blobs that decrunch with checksum 0.
Decrunch outputs stay in extracted/ (gitignored) - never commit them.
"""
import struct
import sys


class DecrunchError(Exception):
    pass


def u32(b, o):
    return struct.unpack_from('>I', b, o)[0]


class BitReader:
    def __init__(self, comp, seed):
        self.comp = comp
        self.pos = len(comp)  # one past end; reads go backwards
        self.checksum = seed & 0xFFFFFFFF
        if self.pos < 4:
            raise DecrunchError("payload too short")
        self.pos -= 4
        raw = u32(self.comp, self.pos)
        self.checksum ^= raw
        self.buf = raw  # first buffer: NO sentinel inserted (encoder guarantees MSB=1)
        self.first = True

    def next_bit(self):
        bit = self.buf & 1
        self.buf = (self.buf >> 1) & 0xFFFFFFFF
        if self.buf == 0:
            # Buffer exhausted. The bit just shifted out must be the sentinel.
            if bit != 1:
                raise DecrunchError("missing sentinel (invalid stream)")
            if self.pos < 4:
                raise DecrunchError("out of input bits")
            self.pos -= 4
            raw = u32(self.comp, self.pos)
            self.checksum ^= raw
            bit = raw & 1
            self.buf = ((raw >> 1) | 0x80000000) & 0xFFFFFFFF
        return bit

    def getbits(self, n):
        v = 0
        for _ in range(n):
            v = ((v << 1) | self.next_bit()) & 0xFFFFFFFF
        return v


def decrunch_blob(blob):
    """Decrunch one blob (starting at its 12-byte header).
    Returns (output_bytes, checksum). Raises DecrunchError on failure."""
    if len(blob) < 16:
        raise DecrunchError("blob too small")
    d0 = u32(blob, 0)
    d1 = u32(blob, 4)
    seed = u32(blob, 8)
    if d0 < 4 or d1 < 1:
        raise DecrunchError("bad header sizes")
    if 12 + d0 > len(blob):
        raise DecrunchError("blob truncated")
    if d0 % 4 != 0:
        raise DecrunchError("compressed size not multiple of 4")
    comp = blob[12:12 + d0]
    out = bytearray(d1)
    wp = d1  # write pointer: next write goes to wp-1
    br = BitReader(comp, seed)
    steps = 0
    max_steps = d1 * 40 + 10000

    def write_byte(b):
        nonlocal wp
        if wp <= 0:
            raise DecrunchError("output overrun")
        wp -= 1
        out[wp] = b & 0xFF

    def copy_match(off, count):
        nonlocal wp
        for _ in range(count):
            src = wp + off
            if not (wp <= src < d1):
                raise DecrunchError(f"bad match src={src} wp={wp}")
            b = out[src]
            if wp <= 0:
                raise DecrunchError("output overrun in match")
            wp -= 1
            out[wp] = b

    def literal_byte():
        v = 0
        for _ in range(8):
            v = ((v << 1) | br.next_bit()) & 0xFF
        return v

    while wp > 0:
        steps += 1
        if steps > max_steps:
            raise DecrunchError("step limit (likely invalid stream)")
        b = br.next_bit()
        if b == 1:
            cmd = br.getbits(2)
            if cmd < 2:  # %00/%01 after leading 1
                nbits = 9 + cmd
                count = cmd + 3
                off = br.getbits(nbits) - 1
                copy_match(off, count)
            elif cmd == 2:  # %10
                count = br.getbits(8) + 1
                off = br.getbits(12) - 1
                copy_match(off, count)
            else:  # %11 long literal
                count = br.getbits(8) + 9
                for _ in range(count):
                    write_byte(literal_byte())
                    if wp <= 0:
                        break
        else:
            b2 = br.next_bit()
            if b2 == 1:  # %01 short match, 8-bit offset, 2 bytes
                off = br.getbits(8) - 1
                copy_match(off, 2)
            else:  # %00 literal run 1..8
                count = br.getbits(3) + 1
                for _ in range(count):
                    write_byte(literal_byte())
    if wp != 0:
        raise DecrunchError("output not exactly filled")
    if br.checksum & 0xFFFFFFFF != 0:
        raise DecrunchError(f"checksum mismatch {br.checksum:08x}")
    return bytes(out)


def scan_image(path, max_hits=20):
    data = open(path, 'rb').read()
    hits = []
    # plausible headers: d0 comp size, d1 out size
    for off in range(0, len(data) - 16, 4):
        d0 = u32(data, off)
        d1 = u32(data, off + 4)
        if d0 < 32 or d0 > 300000:
            continue
        if d1 < 32 or d1 > 600000:
            continue
        if d0 % 4 != 0:
            continue
        if off + 12 + d0 > len(data):
            continue
        try:
            out = decrunch_blob(data[off:off + 12 + d0])
        except DecrunchError:
            continue
        hits.append((off, d0, d1, len(out)))
        print(f"HIT {path} @ 0x{off:06x}: comp={d0} out={d1}", flush=True)
        if len(hits) >= max_hits:
            break
    print(f"done: {len(hits)} hits")
    return hits


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2
    if argv[1] == 'decrunch' and len(argv) == 5:
        _, _, inp, off_s, outp = argv
        data = open(inp, 'rb').read()
        off = int(off_s, 0)
        out = decrunch_blob(data[off:])
        open(outp, 'wb').write(out)
        print(f"OK: {len(out)} bytes -> {outp}")
        return 0
    if argv[1] == 'scan' and len(argv) >= 3:
        max_hits = 20
        for i, a in enumerate(argv):
            if a == '--max-hits' and i + 1 < len(argv):
                max_hits = int(argv[i + 1])
        scan_image(argv[2], max_hits)
        return 0
    print(__doc__)
    return 2


if __name__ == '__main__':
    raise SystemExit(main(sys.argv))
