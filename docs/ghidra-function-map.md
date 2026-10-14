# Ghidra function map (68k)

Generated with Ghidra 12.1.4, language 68000:BE:32:default, script
ghidra/DumpDecomp.java (disassemble from entry + analyzeAll).

Full disassembly text is kept locally but not committed (copyrighted bytes).

## First-stage loader at $78000 (blob = Disk.1[0x0C:0x410])

```
FUNC FUN_00078120 @ 00078120 size=122
FUNC FUN_0007819a @ 0007819a size=38
FUNC FUN_000781c0 @ 000781c0 size=22
FUNC FUN_000781d6 @ 000781d6 size=36
FUNC FUN_00078204 @ 00078204 size=94
FUNC FUN_00078262 @ 00078262 size=84
FUNC FUN_000782b6 @ 000782b6 size=120
FUNC FUN_0007832e @ 0007832e size=18
FUNC FUN_00078340 @ 00078340 size=14
FUNC FUN_0007834e @ 0007834e size=28
FUNC FUN_0007836a @ 0007836a size=68
FUNC thunk_FUN_00078204 @ 000781f2 size=10
```

## Second-stage loader at $7C000 (blob = Disk.1[0xA6800:0xAE800])

```
FUNC FUN_0007c24a @ 0007c24a size=26
FUNC FUN_0007c264 @ 0007c264 size=322
FUNC FUN_0007c3a6 @ 0007c3a6 size=172
FUNC FUN_0007c452 @ 0007c452 size=1058
FUNC FUN_0007c880 @ 0007c880 size=200
FUNC FUN_0007c948 @ 0007c948 size=150
FUNC FUN_0007c9de @ 0007c9de size=12
FUNC FUN_0007c9ea @ 0007c9ea size=26
FUNC FUN_0007ca04 @ 0007ca04 size=44
FUNC FUN_0007ca30 @ 0007ca30 size=272
FUNC FUN_0007cb40 @ 0007cb40 size=114
FUNC FUN_0007cbb2 @ 0007cbb2 size=38
FUNC FUN_0007cbd8 @ 0007cbd8 size=22
FUNC FUN_0007cbee @ 0007cbee size=36
FUNC FUN_0007cc1c @ 0007cc1c size=94
FUNC FUN_0007cc7a @ 0007cc7a size=142
FUNC FUN_0007cd08 @ 0007cd08 size=18
FUNC FUN_0007cd1a @ 0007cd1a size=14
FUNC FUN_0007cd28 @ 0007cd28 size=58
FUNC FUN_0007cd62 @ 0007cd62 size=72
FUNC FUN_0007cdae @ 0007cdae size=172
FUNC FUN_0007ce5a @ 0007ce5a size=26
FUNC FUN_0007ce74 @ 0007ce74 size=50
FUNC FUN_0007cea6 @ 0007cea6 size=110
FUNC FUN_0007cf14 @ 0007cf14 size=188
FUNC FUN_0007cfd0 @ 0007cfd0 size=86
FUNC FUN_0007d026 @ 0007d026 size=64
FUNC FUN_0007d066 @ 0007d066 size=382
FUNC FUN_0007d1e4 @ 0007d1e4 size=30
FUNC FUN_0007d202 @ 0007d202 size=150
FUNC FUN_0007d298 @ 0007d298 size=22
FUNC FUN_0007d2ae @ 0007d2ae size=26
FUNC FUN_0007d2c8 @ 0007d2c8 size=16
FUNC FUN_0007d2d8 @ 0007d2d8 size=28
FUNC FUN_0007d2f4 @ 0007d2f4 size=44
FUNC FUN_0007d320 @ 0007d320 size=84
FUNC FUN_0007d3b6 @ 0007d3b6 size=18
FUNC FUN_0007d3c8 @ 0007d3c8 size=56
FUNC FUN_0007d400 @ 0007d400 size=10
FUNC FUN_0007d40a @ 0007d40a size=34
FUNC FUN_0007d42c @ 0007d42c size=72
FUNC FUN_0007d474 @ 0007d474 size=78
FUNC FUN_0007d4c2 @ 0007d4c2 size=46
FUNC FUN_0007d4f0 @ 0007d4f0 size=2
FUNC FUN_0007d4f2 @ 0007d4f2 size=22
FUNC FUN_0007d508 @ 0007d508 size=50
FUNC FUN_0007d53a @ 0007d53a size=86
FUNC FUN_0007d590 @ 0007d590 size=52
FUNC FUN_0007d5c4 @ 0007d5c4 size=42
FUNC FUN_0007d5ee @ 0007d5ee size=16
FUNC FUN_0007d5fe @ 0007d5fe size=6
FUNC FUN_0007d604 @ 0007d604 size=52
FUNC thunk_FUN_0007cc1c @ 0007cc0a size=10
```

## Mapping confirmation

The slave patch list (GPL WHDLoad source) matches these recovered
addresses, confirming disk $A6800 <-> memory $7C000:

```
$7C24A -> slave PL_P $242,Loader
$7C948 -> slave PL_P $948,Decrunch  (ByteKiller)
$7CA30 -> slave PL_P $a30,Load2
$7CDAE -> slave PL_P $dae,LoadDOS
```
