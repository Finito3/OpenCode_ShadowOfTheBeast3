#!/usr/bin/env python3
"""Extract an LHA/LhA archive (Amiga .lha) using the `lhafile` module.

Usage:
  python3 tools/extract_lha.py <archive.lha> <output_dir>

Requires `lhafile` (pip install lhafile).  An isolated venv works too, e.g.
  uv venv /tmp/lhaenv && uv pip install --python /tmp/lhaenv/bin/python lhafile
  /tmp/lhaenv/bin/python tools/extract_lha.py ... out/
"""
import os
import sys

try:
    import lhafile
except ImportError:
    sys.stderr.write("missing 'lhafile' (pip install lhafile)\n")
    raise SystemExit(2)


def main(argv):
    if len(argv) != 3:
        sys.stderr.write(__doc__)
        return 2
    src, out = argv[1], argv[2]
    f = lhafile.Lhafile(src)
    for info in f.infolist():
        data = f.read(info.filename)
        dest = os.path.join(out, info.filename)
        os.makedirs(os.path.dirname(dest) or ".", exist_ok=True)
        with open(dest, "wb") as fh:
            fh.write(data)
        print("%9d  %s" % (info.file_size, info.filename))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
