import type { OutOfBand, PlacedPart, Reading } from "./linearModel";
import { reverseComplement, stepSeq } from "./alignment";
import type { Graph } from "./alignment";
import { deletionText } from "./pangenomeModel";
import { coveredBases } from "./letters";
import type { NodeLetters } from "./letters";

/* ══════════════════════════════════════════════════════════════════════════
   One haplotype's bar as an array with one entry per pixel.

   The arrangement eg-tracks' density tracks use: the drawing is reduced
   once to a value per pixel of the band, and everything afterwards reads
   that array - painting walks it, and a hover indexes it with the pointer's
   own x, so there is nothing to hit-test and the two cannot disagree.

   What a pixel holds is the part of the alignment drawn there (see
   linearModel.ts: a run of matching bases, letters over the reference they
   replace, a replacement, an inverted stretch, an open end) and which of
   the part's bases. White - reference the haplotype skips - leaves the
   pixel empty and is listed with its size. Marks, the bases with no room,
   are a list of glyphs: each sits at a pixel and takes none.
   ══════════════════════════════════════════════════════════════════════════ */

/** A part placed on the band's pixels. */
export interface RasterPart extends PlacedPart {
  index: number;
  left: number;
  right: number;
  /** Drawn arrowed, as read on the other strand: an inverted span, or any
      part of a reading read backwards as a whole; both at once cancel. */
  arrowed: boolean;
}

/** A mark's glyph: one or more marks within a glyph's width of each other,
    drawn as one with their sizes summed. */
export interface MarkGlyph {
  x: number;
  bp: number;
  /** The parts it stands for, as indices into `parts`. */
  parts: number[];
}

/** White on the bar: a deletion inside the band, or one running out of it. */
export interface WhiteRun {
  left: number;
  right: number;
  bp: number;
  /** Which end runs out of the band; "span" both, the whole band white. */
  open: "left" | "right" | "span" | null;
  text: string;
  refFrom: number;
  refTo: number;
  reading: number;
  /** The part, for a deletion inside the band. */
  part: number | null;
  /** Spanning: the haplotype's own bases in place of the reference. */
  instead?: number;
  /** Running out of the band: the node outside it the walk goes to or
      comes from, which the reference reads at the far end. */
  node?: string;
}

export interface BarRaster {
  key: string;
  width: number;
  /** Index into `parts` per pixel, -1 where the bar is empty. */
  part: Int32Array;
  /** Which base of that part the pixel shows. */
  base: Int32Array;
  parts: RasterPart[];
  marks: MarkGlyph[];
  whites: WhiteRun[];
  /** A reading's own sequence, in its own order, and its first base's
      coordinate - for the letters round the pointer. */
  own: (reading: number) => { seq: string; from: number };
}

/** Marks closer than this, in pixels, are drawn as one glyph. */
export const MARK_MERGE_PX = 8;
/** How far from a glyph's centre the pointer still means it. */
export const MARK_HIT_PX = 6;

/** The kinds that take room on the bar. */
const ROOMY = new Set<PlacedPart["kind"]>(["match", "mismatch", "replaced", "inverted", "open"]);

/**
 * A bar from its parts. `px` is the axis's own, so the bar cannot drift
 * from the strip or the ruler; `startBp`/`endBp` are the band's, where a
 * deletion running out of it ends.
 */
export function rasteriseBar(
  key: string,
  placed: PlacedPart[],
  outOfBand: OutOfBand[],
  readings: Reading[],
  graph: Graph,
  px: (bp: number) => number,
  width: number,
  startBp: number,
  endBp: number,
): BarRaster {
  const w = Math.max(0, Math.ceil(width));
  const parts: RasterPart[] = placed.map((part, index) => {
    const leftward = part.kind === "open" && part.side === "left";
    const left = leftward ? px(part.ref - part.len) : px(part.ref);
    const right = leftward ? px(part.ref) : px(part.ref + part.len);
    const inverted = part.kind === "inverted" || !!part.inverted;
    const arrowed = inverted !== !!readings[part.reading]?.reversed;
    return { ...part, index, left, right, arrowed };
  });
  const partAt = new Int32Array(w).fill(-1);
  const baseAt = new Int32Array(w).fill(-1);
  /* An inverted span first, then everything else over it: what differs
     inside an inversion is drawn on the span and answers for its pixels. */
  const paint = (part: RasterPart) => {
    if (!ROOMY.has(part.kind) || !(part.right > part.left) || part.len <= 0) return;
    const from = Math.max(0, Math.floor(part.left));
    const to = Math.min(w, Math.ceil(part.right));
    const perBase = (part.right - part.left) / part.len;
    for (let x = from; x < to; x++) {
      /* The centre of the pixel, so a base that only just covers one is
         not claimed by its neighbour. */
      const into = (x + 0.5 - part.left) / perBase;
      partAt[x] = part.index;
      baseAt[x] = Math.min(part.len - 1, Math.max(0, Math.floor(into)));
    }
  };
  for (const part of parts) if (part.kind === "inverted") paint(part);
  for (const part of parts) if (part.kind !== "inverted") paint(part);

  /* Marks: one glyph per cluster within a glyph's width. */
  const markParts = parts
    .filter((part) => part.kind === "mark")
    .sort((a, b) => a.left - b.left);
  const marks: MarkGlyph[] = [];
  for (const part of markParts) {
    const last = marks[marks.length - 1];
    if (last && part.left - last.x <= MARK_MERGE_PX) {
      last.bp += part.len;
      last.parts.push(part.index);
      continue;
    }
    marks.push({ x: part.left, bp: part.len, parts: [part.index] });
  }

  const whites: WhiteRun[] = [];
  for (const part of parts) {
    if (part.kind !== "white") continue;
    const span = part.span;
    whites.push({
      left: part.left,
      right: part.right,
      bp: span ? span.refTo - span.refFrom : part.len,
      open: span ? "span" : null,
      text: span ? deletionText(span.refTo - span.refFrom, "span", span.instead) : deletionText(part.len, null),
      refFrom: span ? span.refFrom : part.ref,
      refTo: span ? span.refTo : part.ref + part.len,
      reading: part.reading,
      part: part.index,
      ...(span ? { instead: span.instead } : {}),
    });
  }
  for (const out of outOfBand) {
    whites.push({
      left: out.side === "right" ? px(out.ref) : px(out.until ?? startBp),
      right: out.side === "right" ? px(out.until ?? endBp) : px(out.ref),
      bp: out.bp,
      open: out.side,
      text: deletionText(out.bp, out.side),
      refFrom: out.refFrom,
      refTo: out.refTo,
      reading: out.reading,
      part: null,
      node: out.node,
    });
  }
  whites.sort((a, b) => a.left - b.left);

  const owns = new Map<number, { seq: string; from: number }>();
  const own = (reading: number) => {
    let known = owns.get(reading);
    if (!known) {
      const steps = readings[reading]?.steps ?? [];
      known = {
        seq: steps.map((s) => stepSeq(graph, { id: s.node, reverse: s.reverse })).join(""),
        from: steps[0]?.start ?? 0,
      };
      owns.set(reading, known);
    }
    return known;
  };

  return { key, width: w, part: partAt, base: baseAt, parts, marks, whites, own };
}

/** What the pointer is on, in a part of the bar. */
export interface BarHit {
  part: RasterPart;
  /** Which base of the part. */
  offset: number;
  /** The pointer's own pixel. */
  pixel: number;
  /** The haplotype's own coordinate of that base. */
  bp: number;
}

/** The haplotype's own coordinate of a base of a part. */
export function ownOf(part: PlacedPart, offset: number): number {
  if (!part.own) return NaN;
  return part.own.reverse ? part.own.to - 1 - offset : part.own.from + offset;
}

/** The part at a pixel, or null where the bar is empty there. */
export function hitAt(raster: BarRaster, at: number): BarHit | null {
  const x = Math.round(at);
  if (x < 0 || x >= raster.width) return null;
  const index = raster.part[x];
  if (index < 0) return null;
  const part = raster.parts[index];
  const offset = raster.base[x];
  return { part, offset, pixel: x, bp: ownOf(part, offset) };
}

/** The mark glyph at a pixel, or null. */
export function markAt(raster: BarRaster, at: number): MarkGlyph | null {
  let best: MarkGlyph | null = null;
  for (const glyph of raster.marks) {
    const away = Math.abs(glyph.x - at);
    if (away <= MARK_HIT_PX && (!best || away < Math.abs(best.x - at))) best = glyph;
  }
  return best;
}

/** The white at a pixel, or null. */
export function whiteAt(raster: BarRaster, at: number): WhiteRun | null {
  return raster.whites.find((white) => at >= white.left && at < white.right) ?? null;
}

/**
 * The haplotype's own sequence round the pointer, `half` bases either side
 * of what its pixel covers, read through the whole reading rather than
 * stopping at the part: a part is the alignment's business, not the
 * reader's, and a window that stopped at the edge of an allele cut a word
 * in half. Left to right along the bar: a stretch read on the reverse
 * strand is shown on the reference's strand with its own coordinates
 * counting down, as the bar draws it.
 */
export function lettersAround(raster: BarRaster, hit: BarHit, half: number): NodeLetters | null {
  const { part } = hit;
  if (!part.own || !part.seq && part.kind !== "match" && part.kind !== "inverted") return null;
  const reading = raster.own(part.reading);
  const { first, last } = coveredBases({
    sequence: "",
    length: part.len,
    left: part.left,
    right: part.right,
    start: 0,
    offset: hit.offset,
    pixel: hit.pixel,
  });
  /* The marked bases in the haplotype's own coordinates, lowest first. */
  const a = ownOf(part, first);
  const b = ownOf(part, last);
  const markFrom = Math.min(a, b);
  const markTo = Math.max(a, b);
  const i0 = markFrom - reading.from;
  const i1 = markTo - reading.from + 1;
  if (!(i0 >= 0) || i1 > reading.seq.length) return null;
  const before = reading.seq.slice(Math.max(0, i0 - half), i0);
  const marked = reading.seq.slice(i0, i1);
  const after = reading.seq.slice(i1, i1 + half);
  const reverse = part.own.reverse;
  /* Along the bar: a reversed stretch's own order runs right to left, so
     what is shown is the other strand of it, back to front. */
  const shown = reverse
    ? [reverseComplement(after), reverseComplement(marked), reverseComplement(before)]
    : [before, marked, after];
  return {
    letters: shown.join("").split(""),
    at: shown[0].length,
    span: marked.length,
    from: reading.from + Math.max(0, i0 - half),
    to: reading.from + Math.min(reading.seq.length, i1 + half) - 1,
    markFrom,
    markTo,
    ...(reverse ? { reverse } : {}),
    clippedLeft: (reverse ? after : before).length >= half,
    clippedRight: (reverse ? before : after).length >= half,
    length: reading.seq.length,
  };
}
