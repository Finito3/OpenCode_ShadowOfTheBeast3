#!/usr/bin/env python3
"""MFM track decoder for Shadow of the Beast III.

Based on Ghidra analysis of the game's loader (blob at $78000->$783FF):
  FUN_0007836a: locates sync $4489, validates track/side, checksum, de-interleaves data
  FUN_00078340: odd/even longword MFM decode: d0 = ((w0&MASK)<<1)|(w1&MASK)
  FUN_0007834e: de-interleave two halves using odd/even decode

Track format hypothesis:
  [sync 0x4489][header pair -> track/side ID][checksum pair][data region]
  Data region is de-interleaved from two halves via odd/even decode.
"""

import os
import sys
import struct

TRACK = 0x1800
MASK = 0x55555555
SYNC = 0x4489


def mfm_decode_pair(w0, w1):
    """FUN_00078340: odd/even longword MFM decode -> single longword."""
    return (((w0 & MASK) << 1) | (w1 & MASK)) & 0xFFFFFFFF


def deinterleave_halves(buf, out_len):
    """FUN_0007834e: de-interleave two halves into destination."""
    out = bytearray()
    half = out_len // 2
    if len(buf) < half * 2:
        return bytes(out)
    a0 = buf[:half]
    a1 = buf[half:half * 2]
    n = half // 4
    for i in range(n):
        w1 = struct.unpack_from('>I', a0, i * 4)[0]
        w2 = struct.unpack_from('>I', a1, i * 4)[0]
        d = mfm_decode_pair(w1, w2)
        out += struct.pack('>I', d)
    return bytes(out)


def find_syncs(data):
    """Find all offsets of 0x4489 sync word."""
    offs = []
    i = 0
    while True:
        i = data.find(SYNC.to_bytes(2, 'big'), i)
        if i < 0:
            break
        offs.append(i)
        i += 2
    return offs


def decode_track_at(data, sync_off):
    """Try to decode track data starting at a sync position.
    Returns dict with decoded info or None."""
    if sync_off + 0x10 + 0x1800 > len(data):
        return None

    # Header pair at sync+0 (after sync word itself)
    hdr_start = sync_off + 2
    if hdr_start + 8 > len(data):
        return None
    w0 = struct.unpack_from('>I', data, hdr_start)[0]
    w1 = struct.unpack_from('>I', data, hdr_start + 4)[0]
    track_id = mfm_decode_pair(w0, w1)

    # Checksum pair at sync+8
    chk_start = sync_off + 8
    if chk_start + 8 > len(data):
        return None
    w2 = struct.unpack_from('>I', data, chk_start)[0]
    w3 = struct.unpack_from('>I', data, chk_start + 4)[0]
    checksum = mfm_decode_pair(w2, w3)

    # Data region at sync+0x10
    data_start = sync_off + 0x10
    data_region = data[data_start:data_start + 0x1800]

    # De-interleave
    deinterleaved = deinterleave_halves(data_region, 0x1800)

    return {
        'sync_offset': sync_off,
        'track_id_decoded': f'{track_id:08x}',
        'track_id_implied': f'{(track_id & 0xFF):d}',
        'checksum': f'{checksum:08x}',
        'deinterleaved_len': len(deinterleaved),
        'deinterleaved_first64': deinterleaved[:64].hex(' '),
        'deinterleaved_has_ascii': sum(1 for b in deinterleaved[:256] if 32 <= b < 127),
    }


def track_offset(side, track):
    return side * (80 * TRACK) + track * TRACK


def main():
    if len(sys.argv) < 2:
        print("usage: mfm_decode.py <Disk.N> [side] [track]")
        return 2
    path = sys.argv[1]
    side = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    track = int(sys.argv[3]) if len(sys.argv) > 3 else -1

    data = open(path, 'rb').read()
    print(f"Disk {path}: {len(data)} bytes")

    if track >= 0:
        off = track_offset(side, track)
        trk = data[off:off + TRACK]
        print(f"\nTrack side={side} track={track} @ 0x{off:x} ({len(trk)} bytes)")
        syncs = find_syncs(trk)
        print(f"Sync words: {len(syncs)} at {[hex(s) for s in syncs[:20]]}")
        for s in syncs[:10]:
            res = decode_track_at(trk, s)
            if res:
                print(f"  sync@0x{s:04x}: track_id={res['track_id_decoded']} "
                      f"chk={res['checksum']} deint={res['deinterleaved_len']}B "
                      f"ascii_chars={res['deinterleaved_has_ascii']}")
                print(f"    first64: {res['deinterleaved_first64']}")
    else:
        for side in range(2):
            for t in range(80):
                off = track_offset(side, t)
                trk = data[off:off + TRACK]
                syncs = find_syncs(trk)
                if syncs:
                    print(f"side={side} track={t:3d} @ 0x{off:06x}: {len(syncs)} syncs")
    return 0


if __name__ == '__main__':
    sys.exit(main())
