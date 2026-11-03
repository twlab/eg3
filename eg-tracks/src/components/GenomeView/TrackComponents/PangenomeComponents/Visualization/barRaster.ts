import type { OpenEnd, OutOfBand, PlacedPart, RowStep } from "./linearModel";
import { reverseComplement, stepSeq } from "./alignment";
import type { Graph } from "./alignment";
import { deletionText } from "./pangenomeModel";
import { coveredBases } from "./letters";
import type { NodeLetters } from "./letters";
import type { CountOver, NestedMark } from "./nestedMarks";
import type { LabelRun } from "./markLabel";

/* ══════════════════════════════════════════════════════════════════════════
   One row's bar as an array with one entry per pixel.

   The arrangement eg-tracks' density tracks use: the drawing is reduced
   once to a value per pixel of the band, and everything afterwards reads
   that array - painting walks it, and a hover indexes it with the pointer's
   own x, so there is nothing to hit-test and the two cannot disagree.

   What a pixel holds is the part of the row drawn there (see rowAlign.ts:
   a run of matching bases, letters over the reference they replace, a
   replacement, an inverted stretch) and which of the part's
   bases. White - reference the haplotype skips - leaves the pixel empty
   and is listed with its size. Marks, the bases with no room, are a list
   of glyphs: each sits at a pixel and takes none. So are the bar's ends
   where a walk leaves the reference for good: a cap at the junction, and
   the empty stretch past it that says missing data.
   ══════════════════════════════════════════════════════════════════════════ */

/** A part placed on the band's pixels. */
export interface RasterPart extends PlacedPart {
  index: number;
  /** Where it starts and ends. A mark's len is its inserted bases, which
      take no room, so its right edge is its left. */
  left: number;
  right: number;
  /** Drawn arrowed, as read on the other strand: an inverted run, or a
      part inside one. */
  arrowed: boolean;
}

/** A mark's glyph: one or more marks within a glyph's width of each other,
    drawn as one. Its label names the largest of them (markLabel). */
export interface MarkGlyph {
  x: number;
  /** All its marks' bases, for the card. */
  bp: number;
  /** Its largest mark's bases. */
  largest: number;
  /** The parts it stands for, as indices into `parts`. */
  parts: number[];
  /** Rule D: any of its marks is at an insertion site with two or more versions
      among the haplotypes counted (nestedMarks.ts): drawn in the nested
      ink and font. */
  nested: boolean;
  /** What the label says, the longest form first (markLabel.ts): one mark
      alone, its version with chips on what differs; several, the largest
      and how many more. BarCanvas draws the first that fits the room. */
  forms: LabelRun[][];
  /** A site glyph on a deletion-insertion's or a substitution's letters
      (PLAN-bubble-sites.md): the reference between the site's anchors, in
      bases. Absent on an insertion's mark. */
  refLen?: number;
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
  /** The part, for a deletion inside the band. */
  part: number | null;
  /** Spanning: the haplotype's own bases in place of the reference. */
  instead?: number;
  /** Running out of the band: the node outside it the walk goes to or
      comes from, which the reference reads at the far end. */
  node?: string;
}

/** Where the bar stops because the walk leaves the reference for good
    (OpenEnd): the cap at the junction, and the empty stretch past it, up to
    the next thing drawn, that carries the words and answers the pointer. */
export interface EndCap {
  x: number;
  side: "left" | "right";
  end: OpenEnd;
  left: number;
  right: number;
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
  caps: EndCap[];
  /** The row's own sequence, in its own order, and its first base's
      coordinate - for the letters round the pointer. */
  own: () => { seq: string; from: number };
}

/** Marks closer than this, in pixels, are drawn as one glyph. */
export const MARK_MERGE_PX = 8;
/** How far from a glyph's centre the pointer still means it. */
export const MARK_HIT_PX = 6;
/** How far past a bar's end its "missing data" reaches, at most, and how
    near the cap the pointer still means it. */
export const END_LABEL_PX = 96;
export const END_HIT_PX = 5;

/** The kinds that take room on the bar. */
const ROOMY = new Set<PlacedPart["kind"]>(["match", "mismatch", "replaced", "inverted"]);

/** Which of a bar's marks and whites it draws: all of them, unless told.
    Zoomed out, barTiers.ts says (LinearView): a mark keeps its glyph only
    where it is kept, and a white is drawn only where it is wide enough to
    see, so the labels and the hover skip the rest too. */
export interface RasterKeep {
  /** Whether a mark keeps its glyph, by its index among the parts. */
  keepMark?: (index: number) => boolean;
  /** Whether a white is drawn: a white part by its index among the parts,
      or a white out of the band by its index among those. */
  keepWhite?: (part: number | null, out: number | null) => boolean;
  /** Rule D: whose versions a mark's label counts, every haplotype in the
      band or the lanes on screen; "all" unless told. */
  countOver?: CountOver;
}

/** What a row gives the raster: its parts, its whites out of the band,
    its missing-data ends, and its steps for the letters round the pointer. */
export interface RasterRow {
  parts: PlacedPart[];
  outOfBand: OutOfBand[];
  openEnds: OpenEnd[];
  steps: RowStep[];
}

/**
 * A row's bar from its parts. `px` is the axis's own, so the bar cannot
 * drift from the ruler or the other rows; `startBp`/`endBp` are the
 * band's, where a deletion running out of it ends. `keep` leaves marks and
 * whites out of the glyphs and the whites; by default nothing is left out.
 */
export function rasteriseBar(
  key: string,
  row: RasterRow,
  graph: Graph,
  px: (bp: number) => number,
  width: number,
  startBp: number,
  endBp: number,
  keep: RasterKeep = {},
): BarRaster {
  const { parts: placed, outOfBand, openEnds } = row;
  const w = Math.max(0, Math.ceil(width));
  const parts: RasterPart[] = placed.map((part, index) => {
    const left = px(part.ref);
    /* A mark sits at a point: its len is the bases it inserts. */
    const right = part.kind === "mark" ? left : px(part.ref + part.len);
    return { ...part, index, left, right, arrowed: part.kind === "inverted" || !!part.inverted };
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

  /* Marks: one glyph per cluster within a glyph's width, of the marks
     kept. A nested site on letters (rule D at any bubble,
     PLAN-bubble-sites.md: a deletion-insertion's or a substitution's
     first part) gets a site glyph at its start in place of its bubble's
     plain surplus mark, zoomed in and at mid zoom; a deletion's white gets
     none, its card listing the versions. */
  const countOver = keep.countOver ?? "all";
  const zoomedOut = !!keep.keepMark;
  /* A white gets a site glyph only where the row's version at a merged
     site has bases: a deletion of part of the site. A deletion of the
     whole site, or of a plain site, keeps its white alone. */
  const siteParts = zoomedOut
    ? []
    : parts.filter((part) => {
        const info = part.nested?.[countOver];
        if (!info || part.kind === "mark") return false;
        return part.kind !== "white" || info.seq.length > 0;
      });
  const folded = new Set(siteParts.map((part) => part.bubble));
  const surplusOf = (bubble: number | null) => parts.filter((p) => p.kind === "mark" && p.bubble !== null && p.bubble === bubble).reduce((n, p) => n + p.len, 0);
  const markParts = [
    ...parts.filter((part) => part.kind === "mark" && (keep.keepMark?.(part.index) ?? true) && !(part.bubble !== null && folded.has(part.bubble))),
    ...siteParts,
  ].sort((a, b) => a.left - b.left);
  const marks: MarkGlyph[] = [];
  for (const part of markParts) {
    const info: NestedMark | null = part.nested?.[countOver] ?? null;
    const bp = part.kind === "mark" ? part.len : surplusOf(part.bubble);
    const last = marks[marks.length - 1];
    if (last && part.left - last.x <= MARK_MERGE_PX) {
      last.bp += bp;
      last.largest = Math.max(last.largest, bp);
      last.parts.push(part.index);
      last.nested = last.nested || !!info;
      last.forms = [[{ text: markLabel(last) }]];
      continue;
    }
    marks.push({
      x: part.left,
      bp,
      largest: bp,
      parts: [part.index],
      nested: !!info,
      forms: info ? info.forms : [[{ text: `+${bp.toLocaleString()}` }]],
      ...(info && info.refLen > 0 ? { refLen: info.refLen } : {}),
    });
  }

  /* The whites drawn. */
  const whites: WhiteRun[] = [];
  for (const part of parts) {
    if (part.kind !== "white" || (keep.keepWhite && !keep.keepWhite(part.index, null))) continue;
    const span = part.span;
    whites.push({
      left: part.left,
      right: part.right,
      bp: span ? span.refTo - span.refFrom : part.len,
      open: span ? "span" : null,
      text: span ? deletionText(span.refTo - span.refFrom, "span", span.instead) : deletionText(part.len, null),
      refFrom: span ? span.refFrom : part.ref,
      refTo: span ? span.refTo : part.ref + part.len,
      part: part.index,
      ...(span ? { instead: span.instead } : {}),
    });
  }
  outOfBand.forEach((out, index) => {
    if (keep.keepWhite && !keep.keepWhite(null, index)) return;
    whites.push({
      left: out.side === "right" ? px(out.ref) : px(startBp),
      right: out.side === "right" ? px(endBp) : px(out.ref),
      bp: out.bp,
      open: out.side,
      text: deletionText(out.bp, out.side),
      refFrom: out.refFrom,
      refTo: out.refTo,
      part: null,
      node: out.node,
    });
  });
  whites.sort((a, b) => a.left - b.left);

  /* The bar's ends where a walk leaves the reference for good: the empty
     pixels past each, up to the next part drawn. */
  const caps: EndCap[] = openEnds
    .map((end) => {
      const x = px(end.ref);
      let left = x;
      let right = x;
      if (end.side === "right") {
        for (let k = Math.max(0, Math.ceil(x)); k < Math.min(w, Math.ceil(x) + END_LABEL_PX) && partAt[k] < 0; k++) right = k + 1;
      } else {
        for (let k = Math.min(w, Math.floor(x)) - 1; k >= Math.max(0, Math.floor(x) - END_LABEL_PX) && partAt[k] < 0; k--) left = k;
      }
      return { x, side: end.side, end, left, right };
    })
    .sort((a, b) => a.x - b.x);

  let known: { seq: string; from: number } | null = null;
  const own = () => {
    if (!known) {
      const steps = row.steps;
      known = {
        seq: steps.map((s) => stepSeq(graph, { id: s.node, reverse: s.reverse })).join(""),
        from: steps[0]?.start ?? 0,
      };
    }
    return known;
  };

  return { key, width: w, part: partAt, base: baseAt, parts, marks, whites, caps, own };
}

/** A size in bases, short, for a label: as it is under a thousand ("582"),
    then to a tenth of a Kb ("2.0 Kb", "32.2 Kb"), and from a million to a
    tenth of an Mb ("1.2 Mb"). */
export function markSize(bp: number): string {
  if (bp < 1000) return `${bp}`;
  const kb = Math.round(bp / 100) / 10;
  if (kb < 1000) return `${kb.toFixed(1)} Kb`;
  return `${(Math.round(bp / 100_000) / 10).toFixed(1)} Mb`;
}

/** What a mark's glyph says beside it. One mark: its bases, "+2,040".
    Several: the largest and how many more, "+32.2 Kb & 2 more", since
    their sum would match no insertion the haplotype has. */
export function markLabel(glyph: Pick<MarkGlyph, "bp" | "largest" | "parts">): string {
  const more = glyph.parts.length - 1;
  return more > 0 ? `+${markSize(glyph.largest)} & ${more} more` : `+${glyph.bp.toLocaleString()}`;
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

/** The bar's end at a pixel - its cap, or the empty stretch past it - or
    null. */
export function capAt(raster: BarRaster, at: number): EndCap | null {
  return (
    raster.caps.find(
      (cap) => Math.abs(at - cap.x) <= END_HIT_PX || (at >= cap.left && at < cap.right),
    ) ?? null
  );
}

/**
 * The haplotype's own sequence round the pointer, `half` bases either side
 * of what its pixel covers, read through the whole row rather than
 * stopping at the part: a part is the alignment's business, not the
 * reader's, and a window that stopped at the edge of an allele cut a word
 * in half. Left to right along the bar: a stretch read on the reverse
 * strand is shown on the reference's strand with its own coordinates
 * counting down, as the bar draws it.
 */
export function lettersAround(raster: BarRaster, hit: BarHit, half: number): NodeLetters | null {
  const { part } = hit;
  if (!part.own || !part.seq && part.kind !== "match" && part.kind !== "inverted") return null;
  const reading = raster.own();
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
