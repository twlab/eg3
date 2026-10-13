/* ══════════════════════════════════════════════════════════════════════════
   Byte-level decoders for the BLOB columns of a GBZ-base SQLite database.

   Ported from the `gbz` crate (support.rs, bwt.rs) and from gbz-base's own
   db.rs / utils.rs. Everything here is a straight transcription; the one
   place the port has to diverge is noted at `ByteCodeIter.next`.
   ══════════════════════════════════════════════════════════════════════════ */

/** A GBWT position: a node handle and an offset into that node's record. */
export interface Pos {
  node: number;
  offset: number;
}

/** A run of `len` copies of `value` in a record's BWT. */
export interface Run {
  value: number;
  len: number;
}

/** GBWT node handles: `2 * node_id + orientation`. Handle 0 ends a walk. */
export const ENDMARKER = 0;

export const nodeId = (handle: number) => Math.floor(handle / 2);
export const isReverse = (handle: number) => (handle & 1) === 1;
export const encodeNode = (id: number, reverse: boolean) => 2 * id + (reverse ? 1 : 0);

const BYTE_MASK = 0x7f;
const BYTE_FLAG = 0x80;
const BYTE_SHIFT = 7;

/**
 * Reads the 7-bits-per-byte varints the GBWT uses, with the continuation bit
 * in the high bit of each byte.
 */
export class ByteCodeIter {
  offset: number;

  constructor(
    private readonly bytes: Uint8Array,
    offset = 0,
  ) {
    this.offset = offset;
  }

  /** Next integer, or null at the end of the stream. */
  next(): number | null {
    let shift = 0;
    let result = 0;
    while (this.offset < this.bytes.length) {
      const value = this.bytes[this.offset];
      this.offset += 1;
      // Rust shifts a usize here. A JS `<<` is a 32-bit operation and would
      // silently wrap on the fifth byte of a varint, so scale instead - that
      // keeps every value exact up to 2^53.
      result += (value & BYTE_MASK) * 2 ** shift;
      shift += BYTE_SHIFT;
      if ((value & BYTE_FLAG) === 0) return result;
    }
    return null;
  }

  /** Next raw byte, used by the small-alphabet run encoding. */
  byte(): number | null {
    if (this.offset >= this.bytes.length) return null;
    const value = this.bytes[this.offset];
    this.offset += 1;
    return value;
  }
}

const RLE_THRESHOLD = 255;
const RLE_UNIVERSE = 256;

function sanitizeSigma(sigma: number): { sigma: number; threshold: number } {
  // Rust uses usize::MAX to mean "alphabet of unknown size". Any value at or
  // above RLE_THRESHOLD takes the same branch, so this only has to be large.
  const value = sigma === 0 ? Number.MAX_SAFE_INTEGER : sigma;
  const threshold =
    value < RLE_THRESHOLD ? Math.floor(RLE_UNIVERSE / value) : 0;
  return { sigma: value, threshold };
}

/**
 * Decodes the run-length encoding of a record's BWT. A small alphabet packs
 * the value and a short run length into a single byte; anything longer, or a
 * large alphabet, falls back to two varints.
 */
export class RLEIter {
  private readonly source: ByteCodeIter;
  private readonly sigma: number;
  private readonly threshold: number;

  constructor(bytes: Uint8Array, sigma: number) {
    this.source = new ByteCodeIter(bytes);
    const sanitized = sanitizeSigma(sigma);
    this.sigma = sanitized.sigma;
    this.threshold = sanitized.threshold;
  }

  next(): Run | null {
    if (this.sigma >= RLE_THRESHOLD) {
      const value = this.source.next();
      if (value === null) return null;
      const len = this.source.next();
      if (len === null) return null;
      return { value, len: len + 1 };
    }

    const byte = this.source.byte();
    if (byte === null) return null;
    const value = byte % this.sigma;
    let len = Math.floor(byte / this.sigma) + 1;
    if (len === this.threshold) {
      const extra = this.source.next();
      if (extra === null) return null;
      len += extra;
    }
    return { value, len };
  }
}

/**
 * Decodes the `edges` column: an alphabet size, then one delta-coded
 * destination handle and record offset per outgoing edge.
 */
export function decodeEdges(bytes: Uint8Array): Pos[] | null {
  const iter = new ByteCodeIter(bytes);
  const sigma = iter.next();
  if (sigma === null || sigma === 0) return null;

  const edges: Pos[] = [];
  let previous = 0;
  for (let i = 0; i < sigma; i++) {
    const delta = iter.next();
    if (delta === null) return null;
    const node = delta + previous;
    previous = node;
    const offset = iter.next();
    if (offset === null) return null;
    edges.push({ node, offset });
  }
  return edges;
}

/* Node sequences are packed three bases to a byte, base 6. Index 0 is the
   terminator that pads the final byte. */
const DECODE = ["", "A", "C", "G", "T", "N"];

export function decodeSequence(encoded: Uint8Array): string {
  const out: string[] = [];
  for (const byte of encoded) {
    let value = byte;
    for (let i = 0; i < 3; i++) {
      const base = DECODE[value % DECODE.length];
      if (base === "") return out.join("");
      value = Math.floor(value / DECODE.length);
      out.push(base);
    }
  }
  return out.join("");
}

/**
 * One sampled position on a path, from the `path_handles` column.
 *
 * A GBWT record holds one occurrence per sequence passing through the node,
 * addressed by BWT offset. Only one occurrence in every `ANCHOR_INTERVAL`
 * visits along each sequence is described here; the rest are recovered by
 * walking, since a walk is a single GBWT sequence and the sequence lengths
 * along it give every other offset.
 */
export interface PathAnchor {
  /** BWT offset of the anchored occurrence within this node record. */
  nodeOffset: number;
  /** GBWT sequence id: `pathHandle * 2 + (isReverse ? 1 : 0)`. */
  seqId: number;
  /** bp from the start of the forward path to this occurrence's leftmost base. */
  bpOffset: number;
}

/**
 * Decodes the `path_handles` column. Must stay byte-compatible with
 * `encode_path_anchors` in gbz-base `src/db.rs`:
 *
 *   count:   u16
 *   widths:  u8      (nw - 1) | ((sw - 1) << 2) | ((dw - 1) << 4)
 *   base:    varint  the smallest bpOffset in the record
 *   entries: count * [ nodeOffset: nw | seqId: sw | bpOffset - base: dw ]
 *
 * Entries are fixed width and sorted by `nodeOffset`, so `anchorAt` can binary
 * search them rather than scanning.
 */
export function decodePathAnchors(bytes: Uint8Array): PathAnchor[] {
  if (bytes.length < 2) return [];
  const count = bytes[0] | (bytes[1] << 8);
  if (count === 0 || bytes.length < 3) return [];

  const widths = bytes[2];
  const nw = (widths & 0x03) + 1;
  const sw = ((widths >> 2) & 0x03) + 1;
  const dw = ((widths >> 4) & 0x07) + 1;

  let at = 3;
  let base = 0;
  let shift = 0;
  while (at < bytes.length) {
    const byte = bytes[at];
    at += 1;
    // Multiply rather than shift: bp offsets exceed 32 bits on real graphs and
    // `<<` in JS truncates to 32.
    base += (byte & 0x7f) * Math.pow(2, shift);
    if ((byte & 0x80) === 0) break;
    shift += 7;
  }

  const readUint = (offset: number, width: number): number => {
    let value = 0;
    for (let i = 0; i < width; i++) {
      value += bytes[offset + i] * Math.pow(2, i * 8);
    }
    return value;
  };

  const entryLen = nw + sw + dw;
  const anchors: PathAnchor[] = [];
  for (let i = 0; i < count; i++) {
    const offset = at + i * entryLen;
    if (offset + entryLen > bytes.length) break;
    anchors.push({
      nodeOffset: readUint(offset, nw),
      seqId: readUint(offset + nw, sw),
      bpOffset: base + readUint(offset + nw + sw, dw),
    });
  }
  return anchors;
}

/**
 * Whether an edge is the canonical direction of its pair. The graph stores
 * both orientations of every edge; output keeps one of each.
 */
export function edgeIsCanonical(from: number, to: number): boolean {
  const fromId = nodeId(from);
  const toId = nodeId(to);
  if (!isReverse(from)) return toId >= fromId;
  return toId > fromId || (toId === fromId && !isReverse(to));
}

/** The same rule applied to a whole walk, by its first and last handle. */
export function pathIsCanonical(path: number[]): boolean {
  if (path.length === 0) return true;
  const first = path[0];
  const last = path[path.length - 1];
  if (isReverse(first) === isReverse(last)) return !isReverse(first);
  return edgeIsCanonical(first, last);
}
