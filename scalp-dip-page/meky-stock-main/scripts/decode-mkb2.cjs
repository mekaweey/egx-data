#!/usr/bin/env node
// scripts/decode-mkb2.cjs
//
// Decode a .mkb2 archive (MKB2 = "MeKy Binary v2", produced by the
// /api/public/hooks/export-binary route) back into one CSV file per
// table×date — byte-identical to the source archive files.
//
// Usage:
//   node scripts/decode-mkb2.cjs <input.mkb2> <output_dir>
//
// Output files look like:  live_ticks__2026-08-23.csv
//
// Pure Node.js — no dependencies.
//
// Format (MKB2):
//   4 bytes 'MKB2', then a sequence of self-describing sections:
//     uvarint table-name length + UTF-8 name
//     uvarint date length + UTF-8 date
//     uvarint row count n
//     uvarint column count
//     uvarint compressed body length
//     body = zlib deflate of column records:
//       per column: uvarint name length + name, 1 tag byte,
//       null bitmap (ceil(n/8) bytes), payload of non-null values.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const MAGIC = "MKB2";

function die(msg) {
  console.error(msg);
  process.exit(1);
}

// Unsigned LEB128 (may exceed 32 bits — decode as BigInt).
function readUvarint(buf, off) {
  let val = 0n;
  let shift = 0n;
  for (;;) {
    const b = buf[off++];
    val |= BigInt(b & 0x7f) << shift;
    if ((b & 0x80) === 0) return { value: val, next: off };
    shift += 7n;
    if (shift > 70n) throw new Error("uvarint too long (corrupt file?)");
  }
}

// Signed zigzag LEB128 (BigInt).
function readSvarint(buf, off) {
  const { value: zz, next } = readUvarint(buf, off);
  return { value: (zz >> 1n) ^ -(zz & 1n), next };
}

// uvarint byte length + UTF-8 bytes.
function readLenPrefixed(buf, off) {
  const { value: len, next } = readUvarint(buf, off);
  const l = Number(len);
  return { value: buf.toString("utf8", next, next + l), next: next + l };
}
// Decode one column record into an array of n strings ("" = null cell).
function decodeColumn(body, off, n) {
  const name = readLenPrefixed(body, off);
  off = name.next;
  const tag = body[off++];
  const values = new Array(n).fill("");
  const nullBitsOff = off;
  const isNull = (i) => ((body[nullBitsOff + (i >> 3)] >> (i % 8)) & 1) === 1;
  off += Math.ceil(n / 8);

  if (tag === 0x01) {
    // Dictionary strings: dict entries, then one id per non-null row.
    const dl = readUvarint(body, off);
    off = dl.next;
    const dict = new Array(Number(dl.value));
    for (let i = 0; i < dict.length; i++) {
      const s = readLenPrefixed(body, off);
      off = s.next;
      dict[i] = s.value;
    }
    for (let i = 0; i < n; i++) {
      if (isNull(i)) continue;
      const id = readUvarint(body, off);
      off = id.next;
      values[i] = dict[Number(id.value)];
    }
  } else if (tag === 0x02) {
    // Plain length-prefixed UTF-8 strings, one per non-null row.
    for (let i = 0; i < n; i++) {
      if (isNull(i)) continue;
      const s = readLenPrefixed(body, off);
      off = s.next;
      values[i] = s.value;
    }
  } else if (tag === 0x10) {
    // int64 delta chain: 8-byte BE seed + zigzag deltas between non-null.
    let firstIdx = -1;
    for (let i = 0; i < n; i++) {
      if (!isNull(i)) {
        firstIdx = i;
        break;
      }
    }
    if (firstIdx !== -1) {
      let prev = body.readBigInt64BE(off);
      off += 8;
      values[firstIdx] = prev.toString();
      for (let i = firstIdx + 1; i < n; i++) {
        if (isNull(i)) continue;
        const d = readSvarint(body, off);
        off = d.next;
        prev += d.value;
        values[i] = prev.toString();
      }
    }
  } else if (tag === 0x11) {
    // int64 direct: one zigzag varint per non-null row.
    for (let i = 0; i < n; i++) {
      if (isNull(i)) continue;
      const v = readSvarint(body, off);
      off = v.next;
      values[i] = v.value.toString();
    }
  } else if (tag === 0x20) {
    // float64: 8-byte BE doubles, one per non-null row.
    let k = 0;
    for (let i = 0; i < n; i++) {
      if (isNull(i)) continue;
      values[i] = String(body.readDoubleBE(off + k * 8));
      k++;
    }
    off += 8 * k;
  } else if (tag === 0x30) {
    // bool: packed bits of non-null rows ("true" = 1).
    let k = 0;
    const packedOff = off;
    for (let i = 0; i < n; i++) {
      if (isNull(i)) continue;
      const bit = (body[packedOff + (k >> 3)] >> (k % 8)) & 1;
      values[i] = bit ? "true" : "false";
      k++;
    }
    off += Math.ceil(k / 8);
  } else {
    throw new Error(`Unknown column tag 0x${tag.toString(16)} for column "${name.value}"`);
  }
  return { name: name.value, values, next: off };
}

// Same escaping rule as the archive writer (history-export csvCell),
// so decoded files are byte-identical to the source archive files.
function csvEscape(s) {
  const str = String(s == null ? "" : s);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function main() {
  const inPath = process.argv[2];
  const outDir = process.argv[3];
  if (!inPath || !outDir) {
    console.error("Usage: node scripts/decode-mkb2.cjs <input.mkb2> <output_dir>");
    process.exit(1);
  }
  if (!fs.existsSync(inPath)) die("File not found: " + inPath);

  const t0 = Date.now();
  const raw = fs.readFileSync(inPath);
  if (raw.length < 4 || raw.toString("ascii", 0, 4) !== MAGIC) {
    die("BAD MAGIC — not an MKB2 file");
  }
  fs.mkdirSync(outDir, { recursive: true });

  let off = 4;
  let sections = 0;
  let rows = 0;
  let outBytes = 0;
  while (off < raw.length) {
    const t = readLenPrefixed(raw, off);
    off = t.next;
    const d = readLenPrefixed(raw, off);
    off = d.next;
    const rn = readUvarint(raw, off);
    off = rn.next;
    const cc = readUvarint(raw, off);
    off = cc.next;
    const bl = readUvarint(raw, off);
    off = bl.next;
    const n = Number(rn.value);
    const colCount = Number(cc.value);
    const bodyLen = Number(bl.value);
    const body = zlib.inflateSync(raw.subarray(off, off + bodyLen));
    off += bodyLen;

    let boff = 0;
    const cols = [];
    for (let j = 0; j < colCount; j++) {
      const c = decodeColumn(body, boff, n);
      boff = c.next;
      cols.push(c);
    }
    if (boff !== body.length) {
      die(`Section ${t.value} ${d.value}: ${body.length - boff} trailing bytes in body`);
    }

    const lines = [cols.map((c) => csvEscape(c.name)).join(",")];
    for (let i = 0; i < n; i++) {
      lines.push(cols.map((c) => csvEscape(c.values[i])).join(","));
    }
    const csv = lines.join("\n") + "\n";
    const outPath = path.join(outDir, `${t.value}__${d.value}.csv`);
    fs.writeFileSync(outPath, csv, "utf8");

    sections++;
    rows += n;
    outBytes += Buffer.byteLength(csv);
    console.log(
      `  [${t.value} ${d.value}] ${n} rows, ${colCount} cols -> ${outPath} (${(Buffer.byteLength(csv) / 1024).toFixed(1)} KB)`,
    );
  }

  console.log("\n=== DONE ===");
  console.log(`Sections: ${sections}, rows: ${rows}`);
  console.log(
    `Decoded CSV: ${(outBytes / 1024 / 1024).toFixed(2)} MB from MKB2 ${(raw.length / 1024 / 1024).toFixed(2)} MB (${((raw.length / outBytes) * 100).toFixed(1)}% of original)`,
  );
  console.log(`Output dir: ${outDir}`);
  console.log(`Time: ${Date.now() - t0} ms`);
}

main();
