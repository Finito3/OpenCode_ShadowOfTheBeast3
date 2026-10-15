#!/usr/bin/env python3
"""Extract Psygnosis files using the directory at Disk.2[$3000].

Directory: 0x1000 bytes. Entries 16B: name NUL-terminated at +0, size u32 at +12.
Block map at +$C00 (0x400 bytes): each byte = file index owning that $400 block.
File data = concatenation of owned $400 blocks in table order, truncated to size.

Writes to extracted/files/ (gitignored). Never commit outputs.
"""
import os
import struct
import sys

TRACK = 0x1800


def u32(b, o):
    return struct.unpack_from('>I', b, o)[0]


def parse_dir(blk):
    entries = []
    for i in range(0, 0xC00, 0x10):
        e = blk[i:i + 16]
        if all(c == 0 for c in e):
            continue
        name = e[:12].split(b'\x00')[0]
        size = u32(e, 12)
        entries.append({'index': i // 16, 'name': name, 'size': size, 'off': i})
    return entries, blk[0xC00:0x1000]


def extract(disk_bytes, entries, blockmap, outdir):
    os.makedirs(outdir, exist_ok=True)
    manifest = []
    for en in entries:
        idx = en['index']
        size = en['size']
        try:
            name = en['name'].decode('ascii')
        except Exception:
            name = f"file_{idx:03d}.bin"
        blocks = [i for i, b in enumerate(blockmap) if b == idx]
        data = bytearray()
        for bi in blocks:
            chunk = disk_bytes[bi * 0x400:(bi + 1) * 0x400]
            data += chunk
        data = bytes(data[:size])
        fn = f"{idx:03d}_{name or 'noname'}.bin"
        # sanitize
        fn = ''.join(c if (c.isalnum() or c in '._-') else '_' for c in fn)
        with open(os.path.join(outdir, fn), 'wb') as f:
            f.write(data)
        manifest.append((idx, name, size, len(blocks), len(data)))
        print(f"idx={idx:3d} name={name!r:18s} size={size:7d} blocks={len(blocks):4d} got={len(data)} -> {fn}")
    return manifest


def main(argv):
    proj = "/home/opencode/projects/ShadowOfTheBeast3"
    d2 = open(os.path.join(proj, "original/ShadowOfTheBeast3/Disk.2"), 'rb').read()
    blk = d2[0x3000:0x4000]
    entries, blockmap = parse_dir(blk)
    print(f"entries: {len(entries)}")
    outdir = os.path.join(proj, "extracted/files_disk2")
    extract(d2, entries, blockmap, outdir)


if __name__ == '__main__':
    main(sys.argv)
