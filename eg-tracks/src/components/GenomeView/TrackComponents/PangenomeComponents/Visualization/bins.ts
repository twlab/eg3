import type { LinearModel, OutOfBand, PlacedPart, Row, RowBubble } from "./linearModel";

/* ══════════════════════════════════════════════════════════════════════════
   The linear view zoomed out: each row's parts added up into bins.

   Below a pixel a base a row cannot draw its parts one by one, so it draws
   bins: equal stretches of the reference, the same for every row, each
   holding what the haplotype does there. Nothing is aligned again. The
   parts are the ones rowAlign.ts placed; here they are only added up, so
   every zoom shows the same alignment.

   The grid. A bin is the smallest power of two of bases that is at least
   2 px wide, and the bins start at the chromosome's base 0, so a pan never
   moves a bin and two bins make exactly one of the next size up.

   What a bin holds, for each row (one walk of a haplotype):
   - its bases, each exactly one of aligned (matched, mismatched, replaced
     or inverted), deleted (white: reference the haplotype skips, in the
     band or running out of it) or not read (past a missing-data end, where
     the walk leaves the reference for good; behind a jump back along the
     reference; or no walk at all), and how many of the aligned ones are
     read on the other strand;
   - the variants homed there, by size class, with their inserted bases and
     how many of them are insertions.

   A variant is one entry of the row's list, however many parts the
   alignment made of it, like one line of a VCF for one haplotype: an SNV,
   an MNV (eg3's substitution), an insertion, a deletion, a
   deletion-insertion (mismatch+gap and replacement), or an inversion. It
   counts once, in the bin of its home: its first changed reference base,
   or for an insertion the base it follows. An inversion is listed but not
   counted: its bases count as read on the other strand instead, and the
   variants inside it count as usual.

   One pass over a row's parts, in order along the reference, gives
   everything: each part adds its bases to the bins it crosses, never the
   other way round, and the parts other than matches are kept, since every
   variant the row draws has a part among them.

   The rules, case by case, are section 13 of PLAN-zoomed-out.md in
   eg3/claude-memory, "Bins, exactly" (its copies, 13.4, are gone with the
   copies rule, PLAN-rows.md).
   ══════════════════════════════════════════════════════════════════════════ */

/* ── The grid ─────────────────────────────────────────────────────────── */

/** A bin is at least this many CSS pixels wide. */
export const BIN_MIN_PX = 2;
/** Larger than any chromosome: the bin a scale of nothing gives. */
const MAX_BIN_BP = 2 ** 30;

/**
 * The bin size at `scale` pixels a base: the smallest power of two of
 * bases at least `minPx` pixels wide. Found by doubling from 1, so a bin
 * exactly that wide is the one taken: at 1/16 px a base, 2 px is 32 bp,
 * not 64. The hover bin is found the same way with 16 px.
 */
export function binBpAt(scale: number, minPx: number = BIN_MIN_PX): number {
  if (!(scale > 0)) return MAX_BIN_BP;
  let bp = 1;
  while (bp * scale < minPx && bp < MAX_BIN_BP) bp *= 2;
  return bp;
}

/**
 * Where a band's bins sit. Grid bin k covers [k × binBp, (k + 1) × binBp)
 * of the chromosome. The band's bins are grid bins `first` to
 * `first + count - 1`, and bin i of a row is grid bin `first + i`. Only the
 * band's bases count, so its first and last bins are usually partial.
 */
export interface BinGrid {
  binBp: number;
  first: number;
  count: number;
  /** The band: its first base, and one past its last. */
  origin: number;
  end: number;
}

export function binGrid(origin: number, end: number, binBp: number): BinGrid {
  const first = Math.floor(origin / binBp);
  const count = end > origin ? Math.floor((end - 1) / binBp) - first + 1 : 0;
  return { binBp, first, count, origin, end };
}

/** The band's bin a base is in, or null for a base outside the band. */
export function binOf(grid: BinGrid, bp: number): number | null {
  return bp >= grid.origin && bp < grid.end ? Math.floor(bp / grid.binBp) - grid.first : null;
}

/* ── What a bin holds ─────────────────────────────────────────────────── */

/** Variants are counted by size class: one of size s is in class
    floor(log2 s), so 1 bp is class 0, 2-3 bp class 1, 4-7 bp class 2. Each
    zoom adds up the classes below its own line for the drawing, and stored
    counts still add up from zoom to zoom. */
export const SIZE_CLASSES = 32;
/** A size's class: its bit length less one. */
export function sizeClassOf(size: number): number {
  if (!(size >= 2)) return 0;
  if (size >= 2 ** 31) return SIZE_CLASSES - 1;
  return 31 - Math.clz32(size);
}

/** A variant's kind, by its scientific name. */
export type VariantKind = "SNV" | "MNV" | "insertion" | "deletion" | "deletion-insertion" | "inversion";

/** One haplotype carrying an alternate allele at one site, once however
    many parts the alignment made of it. */
export interface BinVariant {
  kind: VariantKind;
  /** Its first changed reference base, from its bubble rather than from a
      drawn part; for an insertion, the base it follows. */
  home: number;
  /** The larger of its reference span and its inserted bases. */
  size: number;
  /** Its size class (sizeClassOf). */
  cls: number;
  /** The bin of its home, or null where the home is outside the band. */
  bin: number | null;
  /** In its bin's numbers: every variant but an inversion. */
  counted: boolean;
  /** The bases it adds that take no room on the reference. */
  inserted: number;
  /** Which of the row's: its bubble's index as a string, "mark:<part>"
      for a mark at an end, "out:left" or "out:right" for a white out of
      the band, "span". */
  key: string;
}

/** One row's bins: each array has one entry per bin of the band, but
    `byClass`, which has SIZE_CLASSES per bin (bin i's class c is at
    i × SIZE_CLASSES + c). */
export interface Bins {
  /** The band's bases in the bin; aligned, deleted and not read add up to
      it. */
  bases: Int32Array;
  aligned: Int32Array;
  deleted: Int32Array;
  notRead: Int32Array;
  /** The aligned bases read on the other strand. */
  reverse: Int32Array;
  /** The counted variants homed in the bin, their inserted bases, and how
      many of them are insertions. */
  variants: Int32Array;
  inserted: Int32Array;
  insertions: Int32Array;
  byClass: Int32Array;
  /** Every variant of the row, by home, then key. The same at every bin
      size but for `bin`. */
  list: BinVariant[];
}

export interface LaneBins {
  key: string;
  /** One per row of the lane, in the lane's order. */
  rows: Array<{ index: number; bins: Bins }>;
}

export interface ModelBins extends BinGrid {
  contig: string;
  /** Every lane but the reference's, in the model's order. */
  lanes: LaneBins[];
}

/* ── Bins of a model ──────────────────────────────────────────────────── */

/** Every haplotype's rows, in bins of `binBp` bases. */
export function modelBins(model: LinearModel, binBp: number): ModelBins {
  const grid = binGrid(model.origin, model.end, binBp);
  return {
    ...grid,
    contig: model.contig,
    lanes: model.lanes
      .filter((lane) => !lane.isReference)
      .map((lane) => ({ key: lane.key, rows: lane.rows.map((row) => ({ index: row.index, bins: rowBins(model, row, grid) })) })),
  };
}

/** One row in bins: its parts, and its whites out of the band to the
    band's edge. */
export function rowBins(model: LinearModel, row: Row, grid: BinGrid): Bins {
  const bins = emptyBins(grid);
  const outs = row.outOfBand.map((white): Stretch => (white.side === "right" ? [white.ref, grid.end] : [grid.origin, white.ref]));
  const pass = readRow(bins, grid, row.parts, outs);
  addVariants(bins, grid, rowVariants(model, row, pass));
  return bins;
}

/* ── One pass over a row ──────────────────────────────────────────────── */

/** A stretch of the reference, [from, to). */
type Stretch = [number, number];

/** What one pass over a row's parts keeps besides its bins. */
interface Pass {
  /** Its parts other than matches, in order: every variant it draws has
      one among them. */
  changed: PlacedPart[];
}

function emptyBins(grid: BinGrid): Bins {
  const n = grid.count;
  const bins: Bins = {
    bases: new Int32Array(n),
    aligned: new Int32Array(n),
    deleted: new Int32Array(n),
    notRead: new Int32Array(n),
    reverse: new Int32Array(n),
    variants: new Int32Array(n),
    inserted: new Int32Array(n),
    insertions: new Int32Array(n),
    byClass: new Int32Array(n * SIZE_CLASSES),
    list: [],
  };
  for (let i = 0; i < n; i++) {
    const k = grid.first + i;
    bins.bases[i] = Math.min(grid.end, (k + 1) * grid.binBp) - Math.max(grid.origin, k * grid.binBp);
  }
  /* Not read until a part says otherwise. */
  bins.notRead.set(bins.bases);
  return bins;
}

/** Adds each base of [from, to), cut to the band, to its bin. */
function addOver(into: Int32Array, grid: BinGrid, from: number, to: number): void {
  const end = Math.min(to, grid.end);
  for (let at = Math.max(from, grid.origin); at < end; ) {
    const k = Math.floor(at / grid.binBp);
    const edge = Math.min(end, (k + 1) * grid.binBp);
    into[k - grid.first] += edge - at;
    at = edge;
  }
}

/* A sweep along the reference reads events: where a stretch starts, and
   one past where it ends. Each event is one number, its base times
   `codes` plus a code below `codes` that says what happens there, so a
   plain numeric sort puts them in order along the reference; `codes` is a
   power of two, so the base comes back exactly. Between one base with
   events and the next, the same stretches cover every base. */
const eventBase = (event: number, codes: number) => Math.floor(event / codes);

/** The parts that take room on the reference. A mark's len is its
    inserted bases, so a mark covers nothing. */
const ROOMY = new Set<PlacedPart["kind"]>(["match", "mismatch", "replaced", "inverted"]);

/* What covers a base, in the order that decides what it is: a white inside
   an inverted run (a deletion there) makes it deleted, over the inverted
   span under it; else a roomy part makes it aligned, and read on the other
   strand where the part is inside an inverted run; else any other white, a
   span's or one out of the band, makes it deleted; else it is not read. */
const INSIDE_WHITE = 0;
const COVERED = 1;
const ARROWED = 2;
const WHITE = 3;
/* Each level starts (code 2 × level + 1) or ends (2 × level). */
const KIND_CODES = 16;

/**
 * One pass over a row's parts. Adds its bases to its bins as aligned or
 * deleted, and the aligned ones read on the other strand; the rest stay
 * not read. `outs` are the row's whites out of the band, as stretches.
 */
function readRow(bins: Bins, grid: BinGrid, parts: PlacedPart[], outs: Stretch[]): Pass {
  const pass: Pass = { changed: [] };
  const events: number[] = [];
  const cover = (from: number, to: number, level: number) => {
    const a = Math.max(from, grid.origin);
    const b = Math.min(to, grid.end);
    if (b > a) events.push(a * KIND_CODES + 2 * level + 1, b * KIND_CODES + 2 * level);
  };
  for (const part of parts) {
    if (part.kind !== "match") pass.changed.push(part);
    if (part.kind === "white") cover(part.ref, part.ref + part.len, part.inverted ? INSIDE_WHITE : WHITE);
    if (!ROOMY.has(part.kind)) continue;
    cover(part.ref, part.ref + part.len, COVERED);
    if (part.inverted || part.kind === "inverted") cover(part.ref, part.ref + part.len, ARROWED);
  }
  for (const [from, to] of outs) cover(from, to, WHITE);

  const sorted = Float64Array.from(events).sort();
  const depth = [0, 0, 0, 0];
  for (let k = 0; k < sorted.length; ) {
    const at = eventBase(sorted[k], KIND_CODES);
    for (; k < sorted.length && eventBase(sorted[k], KIND_CODES) === at; k++) {
      const code = sorted[k] - at * KIND_CODES;
      depth[code >> 1] += code & 1 ? 1 : -1;
    }
    if (k === sorted.length) break;
    const next = eventBase(sorted[k], KIND_CODES);
    if (depth[INSIDE_WHITE] > 0) addOver(bins.deleted, grid, at, next);
    else if (depth[COVERED] > 0) {
      addOver(bins.aligned, grid, at, next);
      if (depth[ARROWED] > 0) addOver(bins.reverse, grid, at, next);
    } else if (depth[WHITE] > 0) addOver(bins.deleted, grid, at, next);
  }
  for (let i = 0; i < grid.count; i++) bins.notRead[i] = bins.bases[i] - bins.aligned[i] - bins.deleted[i];
  return pass;
}

/* ── Variants ─────────────────────────────────────────────────────────── */

/** A variant before it is put in a bin. */
type Found = Omit<BinVariant, "cls" | "bin" | "counted">;

/**
 * A bubble as a variant: what it is, its home, its size and its inserted
 * bases, all from the bubble itself. eg3's classes by their scientific
 * names: a substitution is an SNV (1 bp) or an MNV, a mismatch+gap or a
 * replacement a deletion-insertion. Null for a bubble that changes
 * nothing (eg3's match: the same bases through other nodes).
 */
function bubbleVariant(bubble: RowBubble, key: string): Found | null {
  const found = (kind: VariantKind, home: number, size: number, inserted: number): Found => ({ kind, home, size, inserted, key });
  if (bubble.cls === "inversion") return found("inversion", bubble.refAt, Math.max(bubble.refLen, bubble.hapSeq.length), 0);
  if (!bubble.aligned) return null;
  const { prefix, hapMiddle, refMiddle } = bubble.aligned;
  const at = bubble.refAt + prefix;
  switch (bubble.cls) {
    case "substitution":
      return found(hapMiddle === 1 ? "SNV" : "MNV", at, hapMiddle, 0);
    case "insertion":
      return found("insertion", at - 1, hapMiddle, hapMiddle);
    case "deletion":
      return found("deletion", at, refMiddle, 0);
    case "mismatch+gap":
    case "replacement":
      return found("deletion-insertion", at, Math.max(refMiddle, hapMiddle), Math.max(0, hapMiddle - refMiddle));
    default:
      return null;
  }
}

/** Which end of the row a mark at an end is at, with no jump: the bases
    the walk reads past the junction before it goes on along the
    reference. Null for any other part. */
export function markSide(row: Row, part: PlacedPart): "left" | "right" | null {
  if (part.kind !== "mark" || part.bubble !== null || part.jump || !row.anchored) return null;
  return part.ref <= row.anchored[0] ? "left" : "right";
}

/**
 * An insertion at the band's edge: a mark at an end with no jump, where
 * the row has no white out of the band at that junction, so the walk goes
 * on along the reference just past the band, these bases first. Homed on
 * the base it follows.
 */
function edgeInsertion(row: Row, part: PlacedPart, index: number): Found | null {
  const side = markSide(row, part);
  if (!side || row.outOfBand.some((white) => white.side === side && white.ref === part.ref)) return null;
  return { kind: "insertion", home: part.ref - 1, size: part.len, inserted: part.len, key: `mark:${index}` };
}

/**
 * A white out of the band: a deletion, or a deletion-insertion where the
 * walk reads bases of its own between the junction and the node outside
 * the band (the mark at that end, which counts with it and not on its
 * own). Homed at its first reference base, outside the band for one
 * running left.
 */
function outOfBandVariant(row: Row, pass: Pass, white: OutOfBand): Found {
  const mark = pass.changed.find((part) => markSide(row, part) === white.side);
  const inserted = mark?.len ?? 0;
  return {
    kind: mark ? "deletion-insertion" : "deletion",
    home: white.refFrom,
    size: Math.max(white.bp, inserted),
    inserted,
    key: `out:${white.side}`,
  };
}

/** A span (a row with nothing on the reference here, read before and
    after the band): a deletion wider than the band, or a
    deletion-insertion where the haplotype has bases of its own instead. */
function spanVariant(span: NonNullable<PlacedPart["span"]>): Found {
  return {
    kind: span.instead > 0 ? "deletion-insertion" : "deletion",
    home: span.refFrom,
    size: Math.max(span.refTo - span.refFrom, span.instead),
    inserted: 0,
    key: "span",
  };
}

/** A row's variants: every bubble that changes something, inverted runs
    and the bubbles inside them included, its insertions at the band's
    edge, its whites out of the band, its span. */
function rowVariants(_model: LinearModel, row: Row, pass: Pass): Found[] {
  const out: Found[] = [];
  const push = (found: Found | null) => {
    if (found) out.push(found);
  };
  row.bubbles.forEach((bubble, b) => push(bubbleVariant(bubble, String(b))));
  row.parts.forEach((part, index) => {
    if (part.kind === "mark") push(edgeInsertion(row, part, index));
    else if (part.span) push(spanVariant(part.span));
  });
  for (const white of row.outOfBand) push(outOfBandVariant(row, pass, white));
  return out;
}

/** Puts a row's variants in order and in their bins, and counts each but
    an inversion in its home's bin. */
function addVariants(bins: Bins, grid: BinGrid, found: Found[]): void {
  found.sort((a, b) => a.home - b.home || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  for (const one of found) {
    const variant: BinVariant = { ...one, cls: sizeClassOf(one.size), bin: binOf(grid, one.home), counted: one.kind !== "inversion" };
    bins.list.push(variant);
    const i = variant.bin;
    if (!variant.counted || i === null) continue;
    bins.variants[i] += 1;
    bins.byClass[i * SIZE_CLASSES + variant.cls] += 1;
    bins.inserted[i] += variant.inserted;
    if (variant.kind === "insertion") bins.insertions[i] += 1;
  }
}
