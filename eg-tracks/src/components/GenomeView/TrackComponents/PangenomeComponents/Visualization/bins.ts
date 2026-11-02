import type { Bubble } from "./alignment";
import { bubbleOf, drawnArrowed } from "./linearModel";
import type { LinearLane, LinearModel, OutOfBand, PlacedPart, Reading } from "./linearModel";

/* ══════════════════════════════════════════════════════════════════════════
   The linear view zoomed out: each row's parts added up into bins.

   Below a pixel a base a bar cannot draw its parts one by one, so it draws
   bins: equal stretches of the reference, the same for every row, each
   holding what the haplotype does there. Nothing is aligned again. The
   parts are the ones linearModel.ts placed by alignment.ts's rule; here
   they are only added up, so every zoom shows the same alignment.

   The grid. A bin is the smallest power of two of bases that is at least
   2 px wide, and the bins start at the chromosome's base 0, so a pan never
   moves a bin and two bins make exactly one of the next size up.

   What a bin holds, for each row (a haplotype's bar, or one of its walk
   rows):
   - its bases, each exactly one of aligned (matched, mismatched, replaced
     or inverted), deleted (white: reference the haplotype skips, in the
     band or running out of it) or not read (past a missing-data end, where
     the walk leaves the reference for good; behind a jump back along the
     reference; or no walk at all), and how many of the aligned ones are
     read on the other strand;
   - on a bar, copies: the most readings of the haplotype that align any
     one of its bases base for base, which a deletion-insertion's letters
     do not: they are the haplotype's own, no copy of the reference;
   - the variants homed there, by size class, with their inserted bases and
     how many of them are insertions.

   A variant is one entry of the row's list, however many parts the
   alignment made of it, like one line of a VCF for one haplotype: an SNV,
   an MNV (eg3's substitution), an insertion, a deletion, a
   deletion-insertion (mismatch+gap and replacement), an inversion, or on a
   bar a duplication, tandem or dispersed (a reading that aligns, base for
   base, a stretch another reading of the haplotype already aligns). It
   counts once, in the bin of its home: its first changed reference base,
   or for an insertion the base it follows. An inversion is listed but not
   counted: its bases count as read on the other strand instead, and the
   variants inside it count as usual.

   One pass over a row's parts, in order along the reference, gives
   everything: each part adds its bases to the bins it crosses, never the
   other way round, and the parts other than matches are kept, since every
   variant the row draws has a part among them.

   The rules, case by case, are section 13 of PLAN-zoomed-out.md in
   eg3/claude-memory, "Bins, exactly", which the test's own predictor of
   the bins follows too.
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
export type VariantKind =
  | "SNV"
  | "MNV"
  | "insertion"
  | "deletion"
  | "deletion-insertion"
  | "inversion"
  | "duplication";

/** One haplotype carrying an alternate allele at one site, once however
    many parts the alignment made of it. */
export interface BinVariant {
  kind: VariantKind;
  /** Its first changed reference base, from its bubble rather than from a
      drawn part; for an insertion, the base it follows. */
  home: number;
  /** The larger of its reference span and its inserted bases; for a
      duplication, how many bases it is an extra copy at. */
  size: number;
  /** Its size class (sizeClassOf). */
  cls: number;
  /** The bin of its home, or null where the home is outside the band. */
  bin: number | null;
  /** In its bin's numbers: every variant but an inversion. */
  counted: boolean;
  /** The bases it adds that take no room on the reference. */
  inserted: number;
  /** Which of the lane's readings it is in. */
  reading: number;
  /** Which of the reading's: its bubble's path ("b", or "b.k" inside the
      inversion b), "out:left" or "out:right" for a white out of the band,
      "span" or "dup". */
  key: string;
}

/** A stretch a haplotype has more than once: the originals of the same
    copies cover every base of it (linearModel.ts, Copy). */
export interface CopyRun {
  from: number;
  to: number;
  /** The copies whose originals cover it, as indexes into lane.copies,
      ascending; the haplotype has the stretch 1 + their number times. */
  copies: number[];
  /** Those of them tandem (right beside the original) and dispersed. */
  tandem: number[];
  dispersed: number[];
  /** The bases the tandem copies add right here. */
  added: number;
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
  /** How many times the haplotype has the most-copied base of the bin:
      1 where it aligns the base once, 1 + the copies whose originals
      cover it; 0 in a walk row. */
  copies: Int32Array;
  /** The counted variants homed in the bin, their inserted bases, and how
      many of them are insertions. */
  variants: Int32Array;
  inserted: Int32Array;
  insertions: Int32Array;
  byClass: Int32Array;
  /** Every variant of the row, by home, then reading, then key. The same
      at every bin size but for `bin`. */
  list: BinVariant[];
  /** The copy runs, by `from`; none in a walk row. */
  runs: CopyRun[];
}

export interface LaneBins {
  key: string;
  bar: Bins;
  /** One per walk row: each dispersed copy of the lane with a row, in
      walk order, by its index among the lane's copies. */
  readings: Array<{ index: number; bins: Bins }>;
}

export interface ModelBins extends BinGrid {
  contig: string;
  /** Every lane but the reference's, in the model's order. */
  lanes: LaneBins[];
}

/* ── Bins of a model ──────────────────────────────────────────────────── */

/** Every haplotype's bar and walk rows, in bins of `binBp` bases. */
export function modelBins(model: LinearModel, binBp: number): ModelBins {
  const grid = binGrid(model.origin, model.end, binBp);
  return {
    ...grid,
    contig: model.contig,
    lanes: model.lanes.filter((lane) => !lane.isReference).map((lane) => laneBins(model, lane, grid)),
  };
}

/**
 * One haplotype's bar and walk rows in bins. Each walk row is one
 * dispersed copy with a row (linearModel.ts): its own parts, lined up on
 * its original, and its whites out of the band to the band's edge. The
 * bar is the parts it draws (lane.drawn: each reading's, clipped where an
 * earlier reading is drawn) and its own whites out of the band, which stop
 * where another reading draws; its copies and duplications come from the
 * lane's copies. A lane with no readings, a haplotype only the search
 * knows of, is a bar of bases not read.
 */
export function laneBins(model: LinearModel, lane: LinearLane, grid: BinGrid): LaneBins {
  const rows: LaneBins["readings"] = [];
  for (const copy of lane.copies) {
    if (!copy.drawn) continue;
    const bins = emptyBins(grid);
    const outs = copy.outOfBand.map((white): Stretch =>
      white.side === "right" ? [white.ref, grid.end] : [grid.origin, white.ref],
    );
    const pass = readRow(bins, grid, copy.parts, outs, (part) => drawnArrowed(part, copy));
    addVariants(bins, grid, readingVariants(model, copy, pass));
    rows.push({ index: copy.index, bins });
  }

  const bar = emptyBins(grid);
  const outs = lane.outOfBand.map((white): Stretch =>
    white.side === "right" ? [white.ref, white.until ?? grid.end] : [white.until ?? grid.origin, white.ref],
  );
  /* The readings' passes, for the bar's whites out of the band. */
  const passes = new Map<number, Pass>();
  for (const reading of lane.readings) {
    if (!reading.drawn) continue;
    const scratch = emptyBins(grid);
    const readingOuts = reading.outOfBand.map((white): Stretch =>
      white.side === "right" ? [white.ref, grid.end] : [grid.origin, white.ref],
    );
    passes.set(reading.index, readRow(scratch, grid, reading.parts, readingOuts, (part) => drawnArrowed(part, reading)));
  }
  const pass = readRow(bar, grid, lane.drawn, outs, (part) => drawnArrowed(part, lane.readings[part.reading]));
  const duplications = addCopies(bar, grid, lane, pass);
  addVariants(bar, grid, [...barVariants(model, lane, pass, passes), ...duplications]);
  return { key: lane.key, bar, readings: rows };
}

/* ── One pass over a row ──────────────────────────────────────────────── */

/** A stretch of the reference, [from, to). */
type Stretch = [number, number];

/** What one pass over a row's parts keeps besides its bins. */
interface Pass {
  /** What the row aligns base for base, in order along the reference,
      joined where the stretches touch: not a deletion-insertion's letters,
      which its bins count as aligned bases all the same. */
  aligned: Stretch[];
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
    copies: new Int32Array(n),
    variants: new Int32Array(n),
    inserted: new Int32Array(n),
    insertions: new Int32Array(n),
    byClass: new Int32Array(n * SIZE_CLASSES),
    list: [],
    runs: [],
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

/** Raises every bin that [from, to), cut to the band, reaches to at least
    `value`. */
function raiseOver(into: Int32Array, grid: BinGrid, from: number, to: number, value: number): void {
  const a = Math.max(from, grid.origin);
  const b = Math.min(to, grid.end);
  if (b <= a) return;
  for (let k = Math.floor(a / grid.binBp); k <= Math.floor((b - 1) / grid.binBp); k++) {
    const i = k - grid.first;
    if (into[i] < value) into[i] = value;
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
    inserted bases, so a mark covers nothing; neither does an open part. */
const ROOMY = new Set<PlacedPart["kind"]>(["match", "mismatch", "replaced", "inverted"]);

/* What covers a base, in the order that decides what it is: a white inside
   an inversion (a deletion there) makes it deleted, over the inverted span
   under it; else a roomy part makes it aligned, and read on the other
   strand where the part is drawn arrowed; else any other white, a span's
   or one out of the band, makes it deleted; else it is not read. An
   aligned base under a deletion-insertion's letters (a replaced part) is
   aligned in the bins but not base for base. */
const INSIDE_WHITE = 0;
const COVERED = 1;
const ARROWED = 2;
const WHITE = 3;
const LETTERS = 4;
/* Each level starts (code 2 × level + 1) or ends (2 × level). */
const KIND_CODES = 16;

/**
 * One pass over a row's parts. Adds its bases to its bins as aligned or
 * deleted, and the aligned ones read on the other strand; the rest stay
 * not read. `outs` are the row's whites out of the band, as stretches.
 */
function readRow(
  bins: Bins,
  grid: BinGrid,
  parts: PlacedPart[],
  outs: Stretch[],
  arrowed: (part: PlacedPart) => boolean,
): Pass {
  const pass: Pass = { aligned: [], changed: [] };
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
    if (arrowed(part)) cover(part.ref, part.ref + part.len, ARROWED);
    if (part.kind === "replaced") cover(part.ref, part.ref + part.len, LETTERS);
  }
  for (const [from, to] of outs) cover(from, to, WHITE);

  const sorted = Float64Array.from(events).sort();
  const depth = [0, 0, 0, 0, 0];
  const aligned = pass.aligned;
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
      if (depth[LETTERS] === 0) {
        const last = aligned[aligned.length - 1];
        if (last && last[1] === at) last[1] = next;
        else aligned.push([at, next]);
      }
    } else if (depth[WHITE] > 0) addOver(bins.deleted, grid, at, next);
  }
  for (let i = 0; i < grid.count; i++) bins.notRead[i] = bins.bases[i] - bins.aligned[i] - bins.deleted[i];
  return pass;
}

/* ── Copies ───────────────────────────────────────────────────────────── */

/**
 * A bar's copies, its copy runs and its duplications, from the lane's
 * copies (linearModel.ts, PLAN-duplications.md): a copy is a stretch of the
 * walk that reads again nodes it read before, tandem when it repeats the
 * steps right before it, dispersed otherwise. At each base of the band,
 * copies is 1 where the bar aligns it (`aligned`, the bar's pass) plus the
 * copies whose originals cover it; a bin keeps its most. A copy run is a
 * longest stretch the same copies' originals cover. A duplication variant
 * is one per dispersed copy and one per run of tandem copies, homed where
 * the bar draws it (its bar place, or its original where the bar draws
 * none of it), sized by its bases, in the piece's reading. Returns the
 * duplications.
 */
function addCopies(bins: Bins, grid: BinGrid, lane: LinearLane, pass: Pass): Found[] {
  for (const [from, to] of pass.aligned) raiseOver(bins.copies, grid, from, to, 1);
  const placed = lane.copies.filter((copy) => copy.original);
  /* A copy's original starts with code 2 × index + 1 and ends with 2 × index. */
  let codes = 2;
  while (codes < 2 * lane.copies.length) codes *= 2;
  const events: number[] = [];
  for (const copy of placed) events.push(copy.original![0] * codes + 2 * copy.index + 1, copy.original![1] * codes + 2 * copy.index);
  const sorted = Float64Array.from(events).sort();
  const active: number[] = [];
  let open: CopyRun | null = null;
  const close = () => {
    if (open) bins.runs.push(open);
    open = null;
  };
  for (let k = 0; k < sorted.length; ) {
    const at = eventBase(sorted[k], codes);
    for (; k < sorted.length && eventBase(sorted[k], codes) === at; k++) {
      const code = sorted[k] - at * codes;
      const index = code >> 1;
      if (code & 1) {
        const after = active.findIndex((other) => other > index);
        active.splice(after < 0 ? active.length : after, 0, index);
      } else active.splice(active.indexOf(index), 1);
    }
    if (k === sorted.length) break;
    const next = eventBase(sorted[k], codes);
    if (!active.length) {
      close();
      continue;
    }
    raiseOver(bins.copies, grid, at, next, 1 + active.length);
    const key = active.join(",");
    if (open && open.to === at && open.copies.join(",") === key) open.to = next;
    else {
      close();
      const tandem = active.filter((index) => lane.copies[index].kind === "tandem");
      open = { from: at, to: next, copies: [...active], tandem, dispersed: active.filter((index) => lane.copies[index].kind === "dispersed"), added: 0 };
    }
  }
  close();
  for (const run of bins.runs) run.added = run.tandem.length * (run.to - run.from);

  const found: Found[] = [];
  for (const copy of lane.copies) {
    if (copy.kind === "tandem" && copy.group !== copy.index) continue;
    const members = copy.kind === "tandem" ? lane.copies.filter((other) => other.group === copy.group) : [copy];
    const size = members.reduce((n, member) => n + member.ownTo - member.ownFrom, 0);
    const home = copy.bar ? copy.bar.ref : copy.original ? copy.original[0] : null;
    if (home === null) continue;
    found.push({ kind: "duplication", home, size, inserted: 0, reading: copy.piece, key: `dup:${copy.index}` });
  }
  return found;
}


/* ── Variants ─────────────────────────────────────────────────────────── */

/** A variant before it is put in a bin. */
type Found = Omit<BinVariant, "cls" | "bin" | "counted">;

/**
 * A closed bubble as a variant: what it is, its home, its size and its
 * inserted bases, all from the bubble itself. eg3's classes by their
 * scientific names: a substitution is an SNV (1 bp) or an MNV, a
 * mismatch+gap or a replacement a deletion-insertion. Null for a bubble
 * that changes nothing (eg3's match: the same bases through other nodes)
 * and for an open end.
 */
function bubbleVariant(bubble: Bubble, origin: number, reading: number, key: string): Found | null {
  if (bubble.open) return null;
  const found = (kind: VariantKind, home: number, size: number, inserted: number): Found => ({
    kind,
    home,
    size,
    inserted,
    reading,
    key,
  });
  if (bubble.cls === "inversion") {
    return found("inversion", origin + bubble.refAt, Math.max(bubble.refSeq.length, bubble.hapSeq.length), 0);
  }
  const { prefix, hapMiddle, refMiddle } = bubble.aligned;
  const at = origin + bubble.refAt + prefix;
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

/** Which of its reading's open ends a part is the mark of, with no jump:
    the bases the walk reads past the junction before it goes on along the
    reference. Null for any other part. */
function markSide(reading: Reading, part: PlacedPart): "left" | "right" | null {
  if (part.kind !== "mark" || part.jump || part.bubble.length !== 1) return null;
  const side = reading.alignment.bubbles[part.bubble[0]]?.open;
  return side === "left" || side === "right" ? side : null;
}

/**
 * An insertion at the band's edge: a mark at an open end with no jump,
 * where the reading has no white out of the band at that junction, so the
 * walk goes on along the reference just past the band, these bases first.
 * Homed on the base it follows.
 */
function edgeInsertion(reading: Reading, part: PlacedPart): Found | null {
  const side = markSide(reading, part);
  if (!side || reading.outOfBand.some((white) => white.side === side && white.ref === part.ref)) return null;
  return {
    kind: "insertion",
    home: part.ref - 1,
    size: part.len,
    inserted: part.len,
    reading: reading.index,
    key: String(part.bubble[0]),
  };
}

/**
 * A white out of the band: a deletion, or a deletion-insertion where the
 * walk reads bases of its own between the junction and the node outside
 * the band (the mark at that open end, which counts with it and not on
 * its own). Homed at its first reference base, outside the band for one
 * running left. `pass` is its reading's.
 */
function outOfBandVariant(reading: Reading, pass: Pass | undefined, white: OutOfBand): Found {
  const mark = pass?.changed.find((part) => markSide(reading, part) === white.side);
  const inserted = mark?.len ?? 0;
  return {
    kind: mark ? "deletion-insertion" : "deletion",
    home: white.refFrom,
    size: Math.max(white.bp, inserted),
    inserted,
    reading: white.reading,
    key: `out:${white.side}`,
  };
}

/** A span (a reading with nothing on the reference here, read before and
    after the band): a deletion wider than the band, or a
    deletion-insertion where the haplotype has bases of its own instead. */
function spanVariant(reading: Reading, span: NonNullable<PlacedPart["span"]>): Found {
  return {
    kind: span.instead > 0 ? "deletion-insertion" : "deletion",
    home: span.refFrom,
    size: Math.max(span.refTo - span.refFrom, span.instead),
    inserted: 0,
    reading: reading.index,
    key: "span",
  };
}

/** A walk row's variants: every closed bubble of its reading that changes
    something, inversions and the bubbles inside them included, its
    insertions at the band's edge, its whites out of the band, its span. */
function readingVariants(model: LinearModel, reading: Reading, pass: Pass): Found[] {
  const out: Found[] = [];
  const push = (found: Found | null) => {
    if (found) out.push(found);
  };
  reading.alignment.bubbles.forEach((bubble, b) => {
    push(bubbleVariant(bubble, model.origin, reading.index, String(b)));
    bubble.inside?.forEach((inner, k) => push(bubbleVariant(inner, model.origin, reading.index, `${b}.${k}`)));
  });
  for (const part of pass.changed) {
    if (part.kind === "mark") push(edgeInsertion(reading, part));
    else if (part.span) push(spanVariant(reading, part.span));
  }
  for (const white of reading.outOfBand) push(outOfBandVariant(reading, pass, white));
  return out;
}

/**
 * A bar's variants, from what it draws: a bubble, an insertion at the
 * band's edge or a span where lane.drawn holds a part of it other than a
 * match, so not one whose changes an earlier reading drawn over the same
 * place has clipped away, nor a mark drawnParts left out inside an
 * earlier reading's span; and each white out of the band the bar draws.
 * Duplications come from the copies.
 */
function barVariants(model: LinearModel, lane: LinearLane, pass: Pass, passes: Map<number, Pass>): Found[] {
  const out: Found[] = [];
  const seen = new Set<string>();
  const push = (found: Found | null) => {
    if (!found) return;
    const id = `${found.reading}:${found.key}`;
    if (seen.has(id)) return;
    seen.add(id);
    out.push(found);
  };
  for (const part of pass.changed) {
    const reading = lane.readings[part.reading];
    if (part.span) {
      push(spanVariant(reading, part.span));
      continue;
    }
    const bubble = bubbleOf(reading, part.bubble);
    if (!bubble) continue;
    if (bubble.open) push(edgeInsertion(reading, part));
    else push(sizedByMark(bubbleVariant(bubble, model.origin, reading.index, part.bubble.join(".")), part));
  }
  for (const white of lane.outOfBand) {
    push(outOfBandVariant(lane.readings[white.reading], passes.get(white.reading), white));
  }
  return out;
}

/** An insertion is sized by its mark on the bar, which linearModel.ts
    cuts to the bases of the haplotype's own where it held a copy's (the
    copy is marked below the bar); a mark that is copy alone keeps its
    number. */
function sizedByMark(found: Found | null, part: PlacedPart): Found | null {
  if (!found || found.kind !== "insertion" || part.kind !== "mark") return found;
  return { ...found, size: part.len, inserted: part.len };
}

/** Puts a row's variants in order and in their bins, and counts each but
    an inversion in its home's bin. */
function addVariants(bins: Bins, grid: BinGrid, found: Found[]): void {
  found.sort((a, b) => a.home - b.home || a.reading - b.reading || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  for (const one of found) {
    const variant: BinVariant = {
      ...one,
      cls: sizeClassOf(one.size),
      bin: binOf(grid, one.home),
      counted: one.kind !== "inversion",
    };
    bins.list.push(variant);
    const i = variant.bin;
    if (!variant.counted || i === null) continue;
    bins.variants[i] += 1;
    bins.byClass[i * SIZE_CLASSES + variant.cls] += 1;
    bins.inserted[i] += variant.inserted;
    if (variant.kind === "insertion") bins.insertions[i] += 1;
  }
}
