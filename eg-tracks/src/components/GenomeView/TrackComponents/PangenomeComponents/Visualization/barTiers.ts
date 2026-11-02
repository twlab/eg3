import type { BinGrid, BinVariant, Bins, CopyRun, ModelBins, VariantKind } from "./bins";
import type { LinearAxis } from "./linearAxis";
import { markSize } from "./barRaster";
import { drawnArrowed } from "./linearModel";
import { dupRowsOf } from "./laneLayout";
import type { Copy, LinearLane, LinearModel, OutOfBand, PlacedPart, Reading } from "./linearModel";

/* ══════════════════════════════════════════════════════════════════════════
   The linear view zoomed out: what each variant of a row is drawn as.

   bins.ts adds a row's parts up into bins. This decides, at one zoom, what
   the row draws of them, so the bar, its track legend and the tests all
   read one answer. Nothing is painted here. Every place and width is in
   CSS pixels on the band's own axis (linearAxis.ts), where barRaster.ts
   places the parts, so the answer is the same on any screen.

   The user's rules (2026-10-31; PLAN-zoomed-out.md, "Decided so far" and
   sections 5 and 13.11):
   - A big variant is drawn as itself, as at mid zoom, with its own label:
     one of 50 bp or more (a structural variant), or one at least 2 px wide
     at this zoom, an insertion measured as if its bases took room. Its
     replaced bases (a deletion-insertion, eg3's replacement) are hatched
     at any width, as at mid zoom, under the hatching's 6 px pitch too.
   - White gaps, reference the haplotype skips (white parts, spans, and
     deletions running out of the band), measured where barRaster.ts
     places them: drawn at their true width when at least 0.5 px wide, and
     never widened. A narrower one is not drawn, whatever its size in
     bases, and is counted for the haplotype's track legend ("N deletions
     too small to see"). There is no 1 px notch for anything.
   - Small variants (SNVs; MNVs, eg3's substitutions; small insertions,
     deletions and deletion-insertions): a 1 px tick at the variant's own
     base, or a grey stripe across its bin, never both. How dense they are
     is measured over a fixed 1 kb window: cells of 1,024 bp on the bins'
     own grid, or each bin where bins are 1 kb or more. While bins are
     under 1 kb, a bin with small variants gets the stripe where its cell
     has 10 or more of them per kb, and they are ticks elsewhere; once bins
     are 1 kb or more, every bin with a small variant gets the stripe. A
     deletion is never a tick: it is a gap, or counted in the legend, but
     it counts toward the rate.
   - The stripe's grey is a class of its cell's rate: small variants per kb
     of the cell's bases that have data, less the bases under big
     variants' gaps, taken over at least half a cell, so a cell mostly
     under a big gap is not dark from one variant. The classes are the
     same on every lane.
   - A mark (inserted bases, a glyph above the bar) stays where it is a big
     variant's. A mark that is no variant of its own (before a jump, or at
     a deletion running out of the band) stays where it is 50 bp or more,
     or at least 2 px as if its bases took room.
   - Bases read on the other strand (an inversion, or a reading read
     backwards as a whole) get arrows over runs at least 5 px wide, and one
     arrow glyph below that. So an inversion of any size shows by its
     arrows, never by a tick, and is not counted (bins.ts).
   - Duplications are drawn by the copies line (copyDrawing), at every
     zoom: never big, never a tick, and not in the stripe's count. The bar
     draws a stretch the haplotype reads more than once only once, and a
     thin line along its bottom edge and one label say how many times it
     has it: solid where a copy is tandem (right beside the original),
     dotted where every copy is dispersed. Zoomed out, a copied stretch
     narrower than 2 px gets a marker instead. At a pixel a base or more
     the duplication rule's own marks (PLAN-duplications.md; dupDrawing)
     go below the bar: a border round each original, a dotted line under
     each original and each dispersed copy's place with one number for
     the pair, and a pointer where a copy is inserted, "tandem ×2".
   ══════════════════════════════════════════════════════════════════════════ */

/* ── The lines ─────────────────────────────────────────────────────────── */

/** A variant of this many bases or more is a structural variant, drawn as
    itself at every zoom. */
export const SV_BP = 50;
/** A variant at least this many pixels wide is drawn as itself. An
    insertion is measured as if its bases took room. */
export const BIG_PX = 2;
/** A white gap at least this many CSS pixels wide is drawn at its true
    width; a narrower one is counted instead. */
export const GAP_MIN_PX = 0.5;
/** Arrows need this many pixels (BarCanvas.tsx's ARROW_WIDTH). A narrower
    run of bases read on the other strand gets one arrow glyph. */
export const ARROWS_MIN_PX = 5;
/** Small variants are counted over cells this many bases wide, on the
    bins' own grid from base 0: a fixed 1 kb window, which holds whole bins
    and never moves. Where bins are this wide or wider, each bin is its own
    cell, and every bin with a small variant gets the grey stripe. */
export const CELL_BP = 1024;
/** A cell's rate is taken over at least this many of its bases, half a
    cell, so a cell mostly under a gap or past a missing-data end does not
    turn dark from one variant. */
export const RATE_MIN_BP = 512;
/** While bins are under a cell, a cell with this many small variants per
    kb or more has its bins with small variants striped in its grey; a
    sparser one keeps their ticks. */
export const DENSE_PER_KB = 10;
/** Where the grey classes start, in small variants per kb. Class 1 is
    under 1, class 2 from 1, class 3 from 3, class 4 from 10 and class 5
    from 30. Class 0, a cell with no small variant, has no stripe. So while
    bins are under a cell, the stripes are classes 4 and 5. */
export const STRIPE_PER_KB: readonly number[] = [1, 3, 10, 30];
/** Zoomed out, a copied stretch needs this many pixels for the copies
    line; a narrower one gets a marker. */
export const COPY_LINE_MIN_PX = 2;
/** The copies marker: a tick this many pixels wide, its label this far
    right of it. */
export const COPY_TICK_PX = 2;
const COPY_LABEL_GAP_PX = 2;
/** The least room between a copies label and the next one's place. */
const COPY_LABEL_PAD_PX = 4;
/** A copies line that comes back after a gap narrower than this, with the
    same words and style, goes on under the label before; after a wider one
    it is labelled again (the user, 2026-11-01). */
export const COPY_RELABEL_PX = 4;

/** Whether a variant is drawn as itself at `scale` pixels a base. Its size
    is the larger of its reference span and its inserted bases (bins.ts),
    so an insertion is measured as if its bases took room. */
export function isBig(variant: Pick<BinVariant, "kind" | "size">, scale: number): boolean {
  if (variant.kind === "duplication") return false;
  return variant.size >= SV_BP || variant.size * scale >= BIG_PX;
}

/** Whether inserted bases that are no variant of their own keep their
    glyph: by the same line, as if they took room. */
export function bigInsertion(bases: number, scale: number): boolean {
  return bases >= SV_BP || bases * scale >= BIG_PX;
}

/** A rate's grey class: 0 for none, then 1 to 5. */
export function stripeClass(perKb: number): number {
  if (!(perKb > 0)) return 0;
  let cls = 1;
  for (const from of STRIPE_PER_KB) if (perKb >= from) cls += 1;
  return cls;
}

/* ── What a row is ─────────────────────────────────────────────────────── */

/** The axis a row is drawn on (linearAxis.ts). Only these are read: the
    pixels a base, where a base is placed, the band's ends, where a white
    running out of the band stops (as barRaster.ts has it), and the view. */
export type TierAxis = Pick<LinearAxis, "scale" | "px" | "startBp" | "endBp" | "viewFromPx" | "viewToPx">;

/** One row as barRaster.ts reads it: a haplotype's bar, or one of its walk
    rows. */
export interface TierRow {
  /** The bar's lane.drawn, or a walk row's reading.parts. */
  parts: PlacedPart[];
  /** Its whites out of the band: the bar's lane.outOfBand, which may stop
      short of the band's edge (`until`), or the reading's own. */
  outOfBand: OutOfBand[];
  /** The lane's readings, which a part names by index. */
  readings: Reading[];
}

/** A haplotype's bar as a row. */
export const barRow = (lane: LinearLane): TierRow => ({
  parts: lane.drawn,
  outOfBand: lane.outOfBand,
  readings: lane.readings,
});

/** One of a haplotype's walk rows: one of its dispersed copies, aligned
    on its own, lined up on its original; its parts name the lane's copies
    by index. */
export const walkRow = (lane: LinearLane, copy: Copy): TierRow => ({
  parts: copy.parts,
  outOfBand: copy.outOfBand,
  readings: lane.copies,
});

/* ── What is drawn ─────────────────────────────────────────────────────── */

/** A stretch of the band, in CSS pixels from its left edge. */
export interface PxSpan {
  left: number;
  right: number;
}

/** A variant drawn as itself. */
export interface BigVariant extends PxSpan {
  /** Which of the row's variants: an index into its list (Bins.list). */
  variant: number;
  kind: VariantKind;
  /** Its parts in the row other than matches, as indexes into the row's
      parts, and its white out of the band, as an index into those. Its
      place, left to right, is theirs; an insertion's is its mark's, which
      takes no room. */
  parts: number[];
  out: number | null;
  /** A deletion-insertion with replaced bases: hatched at any width, as at
      mid zoom. Under the hatching's 6 px pitch it shows a stripe or two of
      it, never a solid block. */
  fill?: "hatch";
}

/** Reference the haplotype skips, where barRaster.ts places it. */
export interface TierWhite extends PxSpan {
  /** The reference bases it covers in the band, [from, to). */
  from: number;
  to: number;
  /** At least GAP_MIN_PX wide: drawn at its true width, left to right.
      Otherwise hidden. */
  drawn: boolean;
  /** Its left edge is in view, so if hidden it is one of the legend's
      count. */
  inView: boolean;
  /** A white part (a span's included), as an index into the row's parts,
      or a white out of the band, as an index into those. */
  part: number | null;
  out: number | null;
  /** Its variant, as an index into the row's list, where it has one. */
  variant: number | null;
}

/** A 1 px tick for a small variant. */
export interface Tick {
  /** An index into the row's list. */
  variant: number;
  /** The left edge of the variant's first changed base; for an insertion,
      the point its bases go in, where its mark would be. */
  x: number;
}

/** A cell (CELL_BP) that holds small variants: what its grey is measured
    over. */
export interface Cell {
  /** The band's reference bases it covers, [from, to). */
  from: number;
  to: number;
  /** The small variants homed in its bins. */
  small: number;
  /** Its bases under big variants' gaps, left out of the rate. */
  under: number;
  /** Small variants per kb, and its grey class, 1 to 5. */
  rate: number;
  cls: number;
}

/** A bin's grey stripe. */
export interface Stripe extends PxSpan {
  /** The bin, as an index into the row's bins. */
  bin: number;
  /** The small variants homed in the bin. */
  small: number;
  /** Its cell, as an index into the row's cells, whose class it is drawn
      in. */
  cell: number;
  cls: number;
}

/** A copy run's line along the bar's bottom edge. */
export interface CopyLine extends PxSpan {
  /** The run, as an index into the row's runs (Bins.runs). Its line
      reaches the next run of its stretch, across a gap too narrow to
      see. */
  run: number;
  /** Every copy dispersed: dotted. One tandem, or both kinds: solid. */
  dotted: boolean;
}

/** Zoomed out, a copied stretch too narrow for a line: a tick up from the
    bar's bottom edge. */
export interface CopyMarker {
  /** Its tick's left edge: the stretch's first base. */
  x: number;
  /** Its runs, as indexes into the row's runs. It is labelled by the one
      the haplotype has the most times. */
  runs: number[];
  /** The bases its tandem copies add here (CopyRun.added, summed). */
  added: number;
}

/** A pixel a base or more: a stretch of the bar with a black border round
    it, the original of a duplication. */
export type DupBorder = PxSpan;

/** A dotted line below the bar, under an original or under the place a
    dispersed copy is drawn in, "n." at its left end and "×k" at its
    right: the number pairs a copy with its original when both are in
    view (null for one with either out of view). */
export interface DupLine extends PxSpan {
  copy: number;
  /** Which row below the bar, from 0: a dispersed duplication's own. */
  row: number;
  number: number | null;
  text: string;
}

/** A pointer below the bar at the point a copy is inserted: a tandem
    copy's, "tandem ×2", underlined; an inserted dispersed copy's, "1. ×2"
    or "⋯ ×2" with its original out of view. */
export interface DupPointer {
  x: number;
  copy: number;
  row: number;
  text: string;
  underline: boolean;
}

/** Where a copies label may go: from `x`, ending by `end`. */
export interface CopyLabel {
  x: number;
  /** Before the next label's place, or at the band's end. */
  end: number;
  text: string;
  /** What it names: a line, as an index into lines, or a marker, into
      markers. */
  line: number | null;
  marker: number | null;
}

/** What a bar's copies line draws at one zoom (copyDrawing), and, at a
    pixel a base or more, the duplication rule's marks (dupDrawing). */
export interface CopyDrawing {
  lines: CopyLine[];
  markers: CopyMarker[];
  labels: CopyLabel[];
  borders: DupBorder[];
  below: DupLine[];
  pointers: DupPointer[];
}

/** What a row draws zoomed out, at one zoom. */
export interface BarTiers {
  binBp: number;
  /** The variants drawn as themselves, in the list's order. */
  big: BigVariant[];
  /** Every white of the row with room in the band, left to right. */
  whites: TierWhite[];
  /** The hidden whites in view: the legend's "N deletions too small to
      see". */
  hidden: number;
  ticks: Tick[];
  /** Every cell with a small variant, left to right, and the bins striped
      in their grey. */
  cells: Cell[];
  stripes: Stripe[];
  /** The marks drawn as glyphs, as indexes into the row's parts. */
  keptMarks: number[];
  /** Runs of bases read on the other strand: arrows along each run at
      least ARROWS_MIN_PX wide, one arrow glyph at `x` on a narrower one.
      A break narrower than GAP_MIN_PX does not end a run, since nothing
      that narrow is drawn. */
  arrowRuns: PxSpan[];
  arrowGlyphs: Array<PxSpan & { x: number }>;
  /** The copies line of a bar's copy runs (copyDrawing). None on a walk
      row, which has no runs. */
  copies: CopyDrawing;
}

/** The kinds that take room on the reference. */
const ROOMY = new Set<PlacedPart["kind"]>(["match", "mismatch", "replaced", "inverted"]);
/** The reference bases a part covers: a mark's len is its inserted bases,
    which take none. */
const roomOf = (part: PlacedPart) => (part.kind === "mark" ? 0 : part.len);
/** The kinds of small variant drawn as a tick: never a deletion (a gap, or
    counted), a duplication (the copies line) or an inversion (arrows). */
const TICKED = new Set<VariantKind>(["SNV", "MNV", "insertion", "deletion-insertion"]);

/** A variant's name within its row: its reading and its key (bins.ts),
    which together are unique. */
const idOf = (reading: number, key: string) => `${reading}:${key}`;

/** The key of the variant a part draws: its bubble's path, or "span" for a
    span's white. A match draws none, nor does an anchor. */
function partKey(part: PlacedPart): string | null {
  if (part.kind === "match") return null;
  if (part.span) return "span";
  return part.bubble.length ? part.bubble.join(".") : null;
}

/** Each variant of a row by its name, as an index into the list. */
function variantIds(list: BinVariant[]): Map<string, number> {
  const ids = new Map<string, number>();
  list.forEach((variant, i) => ids.set(idOf(variant.reading, variant.key), i));
  return ids;
}

/* ── Whites ────────────────────────────────────────────────────────────── */

/**
 * Every white of a row that has room in the band, where barRaster.ts
 * places it: a white part (a deletion, a deletion-insertion's leftover
 * reference, a deletion inside an inversion, a span) from its first base
 * to past its last; a white out of the band from its junction to where it
 * stops (`until`) or to the band's edge. Its bases are bins.ts's: to
 * `until`, or to the band's first or last base. `ids` names their variants.
 */
export function rowWhites(
  grid: Pick<BinGrid, "origin" | "end">,
  row: TierRow,
  axis: TierAxis,
  ids?: Map<string, number>,
): TierWhite[] {
  const { px, startBp, endBp, viewFromPx, viewToPx } = axis;
  const whites: TierWhite[] = [];
  const add = (
    left: number,
    right: number,
    from: number,
    to: number,
    part: number | null,
    out: number | null,
    id: string | null,
  ) => {
    if (!(right > left)) return;
    whites.push({
      left,
      right,
      from,
      to,
      drawn: right - left >= GAP_MIN_PX,
      inView: left >= viewFromPx && left < viewToPx,
      part,
      out,
      variant: (id !== null ? ids?.get(id) : undefined) ?? null,
    });
  };
  row.parts.forEach((part, index) => {
    if (part.kind !== "white") return;
    const key = partKey(part);
    add(px(part.ref), px(part.ref + part.len), part.ref, part.ref + part.len, index, null, key === null ? null : idOf(part.reading, key));
  });
  row.outOfBand.forEach((white, index) => {
    const id = idOf(white.reading, `out:${white.side}`);
    if (white.side === "right") {
      add(px(white.ref), px(white.until ?? endBp), white.ref, white.until ?? grid.end, null, index, id);
    } else {
      add(px(white.until ?? startBp), px(white.ref), white.until ?? grid.origin, white.ref, null, index, id);
    }
  });
  /* As barRaster.ts lists them: by left edge, parts first where two meet. */
  return whites.sort((a, b) => a.left - b.left);
}

/** How many of a row's whites in view are too narrow to draw: the count
    for the haplotype's track legend. None at 1 px a base or more, where a
    base is a whole pixel. */
export function hiddenWhites(grid: Pick<BinGrid, "origin" | "end">, row: TierRow, axis: TierAxis): number {
  let hidden = 0;
  for (const white of rowWhites(grid, row, axis)) if (!white.drawn && white.inView) hidden += 1;
  return hidden;
}

/* ── Stretches of the reference ────────────────────────────────────────── */

/** A stretch of the reference, [from, to). */
type Stretch = [number, number];

/** Stretches joined where they overlap or touch, in order. */
function joined(stretches: Stretch[]): Stretch[] {
  const out: Stretch[] = [];
  for (const [from, to] of [...stretches].sort((a, b) => a[0] - b[0])) {
    if (!(to > from)) continue;
    const last = out[out.length - 1];
    if (last && from <= last[1]) last[1] = Math.max(last[1], to);
    else out.push([from, to]);
  }
  return out;
}

/** What of `keep` is not under `drop`; both joined. */
function without(keep: Stretch[], drop: Stretch[]): Stretch[] {
  const out: Stretch[] = [];
  let d = 0;
  for (const [from, to] of keep) {
    let at = from;
    while (d < drop.length && drop[d][1] <= at) d++;
    for (let k = d; k < drop.length && drop[k][0] < to; k++) {
      if (drop[k][0] > at) out.push([at, drop[k][0]]);
      at = Math.max(at, drop[k][1]);
    }
    if (to > at) out.push([at, to]);
  }
  return out;
}

/** Adds each base of [from, to), cut to the band, to its bin. */
function addOver(into: Float64Array, grid: BinGrid, from: number, to: number): void {
  const end = Math.min(to, grid.end);
  for (let at = Math.max(from, grid.origin); at < end; ) {
    const k = Math.floor(at / grid.binBp);
    const edge = Math.min(end, (k + 1) * grid.binBp);
    into[k - grid.first] += edge - at;
    at = edge;
  }
}

/* ── One row ───────────────────────────────────────────────────────────── */

/**
 * What a row draws zoomed out: its bins (bins.ts, at the bin size of this
 * zoom), its parts as barRaster.ts reads them, and the axis. Every rule is
 * read off the row's variant list and its bins; the parts say where each
 * thing is drawn.
 */
export function barTiers(grid: BinGrid, bins: Bins, row: TierRow, axis: TierAxis): BarTiers {
  const { scale, px } = axis;
  const B = grid.binBp;
  const list = bins.list;
  const ids = variantIds(list);
  const big = list.map((variant) => isBig(variant, scale));

  /* Each variant's parts in the row, and its white out of the band. */
  const partsOf = new Map<number, number[]>();
  row.parts.forEach((part, index) => {
    const key = partKey(part);
    const id = key === null ? undefined : ids.get(idOf(part.reading, key));
    if (id === undefined) return;
    const known = partsOf.get(id);
    if (known) known.push(index);
    else partsOf.set(id, [index]);
  });
  const whites = rowWhites(grid, row, axis, ids);
  const outOf = new Map<number, TierWhite>();
  for (const white of whites) if (white.out !== null && white.variant !== null) outOf.set(white.variant, white);

  /* Big variants, where their parts are. */
  const bigOnes: BigVariant[] = [];
  list.forEach((variant, i) => {
    if (!big[i]) return;
    const parts = partsOf.get(i) ?? [];
    const out = outOf.get(i) ?? null;
    let left = Infinity;
    let right = -Infinity;
    for (const index of parts) {
      const part = row.parts[index];
      left = Math.min(left, px(part.ref));
      right = Math.max(right, px(part.ref + roomOf(part)));
    }
    if (out) {
      left = Math.min(left, out.left);
      right = Math.max(right, out.right);
    }
    if (!(right >= left)) left = right = px(variant.kind === "insertion" ? variant.home + 1 : variant.home);
    const itself: BigVariant = { variant: i, kind: variant.kind, left, right, parts, out: out ? out.out : null };
    if (variant.kind === "deletion-insertion" && parts.some((index) => row.parts[index].kind === "replaced")) {
      itself.fill = "hatch";
    }
    bigOnes.push(itself);
  });

  /* The small variants homed in each bin: counted (so not an inversion),
     not big, not a duplication. */
  const small = new Int32Array(grid.count);
  list.forEach((variant, i) => {
    if (variant.bin === null || !variant.counted || big[i] || variant.kind === "duplication") return;
    small[variant.bin] += 1;
  });

  /* The bases under big variants' gaps, drawn or not, per bin. */
  const under = new Float64Array(grid.count);
  const gaps = joined(whites.filter((white) => white.variant !== null && big[white.variant]).map((white): Stretch => [white.from, white.to]));
  for (const [from, to] of gaps) addOver(under, grid, from, to);

  /* The cells with small variants. A cell holds whole bins, the bins being
     powers of two, or is one bin where bins are a cell or wider; its
     count, its bases with data and those under big gaps are its bins'. */
  const perCell = Math.max(1, CELL_BP / B);
  const cells: Cell[] = [];
  const cellOf = new Int32Array(grid.count).fill(-1);
  for (let i = 0; i < grid.count; ) {
    const k = Math.floor((grid.first + i) / perCell);
    let j = i;
    let n = 0;
    let data = 0;
    let gone = 0;
    for (; j < grid.count && Math.floor((grid.first + j) / perCell) === k; j++) {
      n += small[j];
      data += bins.aligned[j] + bins.deleted[j];
      gone += under[j];
    }
    if (n) {
      const rate = (n * 1000) / Math.max(RATE_MIN_BP, data - gone);
      cellOf.fill(cells.length, i, j);
      cells.push({
        from: Math.max(grid.origin, k * perCell * B),
        to: Math.min(grid.end, (k + 1) * perCell * B),
        small: n,
        under: gone,
        rate,
        cls: stripeClass(rate),
      });
    }
    i = j;
  }

  /* The grey stripes: each bin with a small variant, in its cell's class,
     where bins are a cell or wider or the cell is dense. */
  const striped = new Uint8Array(grid.count);
  const stripes: Stripe[] = [];
  for (let i = 0; i < grid.count; i++) {
    const cell = cellOf[i];
    if (!small[i] || (B < CELL_BP && cells[cell].rate < DENSE_PER_KB)) continue;
    const k = grid.first + i;
    stripes.push({
      bin: i,
      left: px(Math.max(grid.origin, k * B)),
      right: px(Math.min(grid.end, (k + 1) * B)),
      small: small[i],
      cell,
      cls: cells[cell].cls,
    });
    striped[i] = 1;
  }

  /* The ticks: each small variant of a kind that is ticked, in a bin with
     no stripe. */
  const ticks: Tick[] = [];
  list.forEach((variant, i) => {
    if (variant.bin === null || big[i] || !TICKED.has(variant.kind) || striped[variant.bin]) return;
    ticks.push({ variant: i, x: px(variant.kind === "insertion" ? variant.home + 1 : variant.home) });
  });

  /* The marks kept as glyphs: a variant's where it is big; one that is no
     variant of its own (before a jump, or at a deletion running out of the
     band) by its own bases. */
  const keptMarks: number[] = [];
  row.parts.forEach((part, index) => {
    if (part.kind !== "mark") return;
    const id = ids.get(idOf(part.reading, part.bubble.join(".")));
    if (id !== undefined ? big[id] : bigInsertion(part.len, scale)) keptMarks.push(index);
  });

  /* Bases read on the other strand: those a roomy part drawn arrowed
     covers (an inverted span and the parts inside it agree), less the
     deletions inside an inversion, which are white. */
  const turned: Stretch[] = [];
  const insideWhites: Stretch[] = [];
  for (const part of row.parts) {
    if (part.kind === "white") {
      if (part.inverted) insideWhites.push([part.ref, part.ref + part.len]);
    } else if (ROOMY.has(part.kind) && drawnArrowed(part, row.readings[part.reading])) {
      turned.push([part.ref, part.ref + part.len]);
    }
  }
  const runs: PxSpan[] = [];
  for (const [from, to] of without(joined(turned), joined(insideWhites))) {
    const left = px(from);
    const right = px(to);
    const last = runs[runs.length - 1];
    if (last && left - last.right < GAP_MIN_PX) last.right = Math.max(last.right, right);
    else runs.push({ left, right });
  }

  return {
    binBp: B,
    big: bigOnes,
    whites,
    hidden: whites.filter((white) => !white.drawn && white.inView).length,
    ticks,
    cells,
    stripes,
    keptMarks,
    arrowRuns: runs.filter((run) => run.right - run.left >= ARROWS_MIN_PX),
    arrowGlyphs: runs
      .filter((run) => run.right - run.left < ARROWS_MIN_PX)
      .map((run) => ({ ...run, x: (run.left + run.right) / 2 })),
    copies: copyDrawing(bins.runs, axis, true),
  };
}

/* ── The copies line ───────────────────────────────────────────────────── */

/** A copy run's words: how many times the haplotype has the stretch,
    "×5", the original counted; where it has tandem and dispersed copies
    both, how many of each, "×4: 2 tandem, 1 dispersed". Where all are of
    one kind, the line's style says which. */
export function copyText(run: Pick<CopyRun, "copies" | "tandem" | "dispersed">): string {
  const times = 1 + run.copies.length;
  const tandem = run.tandem.length;
  const dispersed = run.dispersed.length;
  return tandem && dispersed ? `×${times}: ${tandem} tandem, ${dispersed} dispersed` : `×${times}`;
}

/**
 * A bar's copies line, at every zoom (the user, 2026-10-31;
 * PLAN-zoomed-out.md section 5): the bar draws a stretch the haplotype
 * reads more than once only once, and a line along its bottom edge says
 * how many times it has it. A line per copy run (bins.ts): dotted where
 * every copy is dispersed, solid where one is tandem (which makes the
 * haplotype longer right here). Runs less than GAP_MIN_PX apart are one copied
 * stretch, as nothing narrower is drawn: each run's line reaches the next
 * one's. With `markers`, zoomed out, a copied stretch narrower than
 * COPY_LINE_MIN_PX is a marker instead, labelled with its most copies and
 * what its copies in a row add ("×35 +2.0 Kb"); at a pixel a base or more
 * every run is a line. A label goes where a stretch's words or style
 * change, on runs at least GAP_MIN_PX wide, a narrower one being too small
 * to see: at the first base of its run, or where the run comes into view
 * from the left, so the line in view says what it is. A line that comes
 * back after a gap narrower than COPY_RELABEL_PX, with the same words and
 * style, goes on under the label before; after a wider gap it is labelled
 * again. Each label has room to the next label's place, less
 * COPY_LABEL_PAD_PX, or to the band's end; BarCanvas draws it only where
 * it fits there.
 */
export function copyDrawing(runs: CopyRun[], axis: TierAxis, markers: boolean): CopyDrawing {
  const { px, viewFromPx } = axis;
  const lines: CopyLine[] = [];
  const marks: CopyMarker[] = [];
  /* The labels' places, left to right: each label at `x`, its room ending
     before the next one's `at`. */
  const places: Array<{ at: number; x: number; text: string; line: number | null; marker: number | null }> = [];
  /* The label open now, over lines with the same words and style: placed
     once its last line is known. Set inside the loop's callback, so typed
     wide here rather than narrowed to null. */
  type Label = { key: string; text: string; left: number; right: number; line: number };
  let open = null as Label | null;
  const place = () => {
    if (!open) return;
    const x = open.left < viewFromPx && open.right > viewFromPx ? viewFromPx : open.left;
    places.push({ at: x, x, text: open.text, line: open.line, marker: null });
    open = null;
  };
  const order = runs.map((_, i) => i).sort((a, b) => runs[a].from - runs[b].from || a - b);
  for (let k = 0; k < order.length; ) {
    let j = k + 1;
    while (j < order.length && px(runs[order[j]].from) - px(runs[order[j - 1]].to) < GAP_MIN_PX) j++;
    const stretch = order.slice(k, j);
    k = j;
    const left = px(runs[stretch[0]].from);
    if (markers && px(runs[stretch[stretch.length - 1]].to) - left < COPY_LINE_MIN_PX) {
      place();
      const most = stretch.reduce((best, i) => (runs[i].copies.length > runs[best].copies.length ? i : best));
      const added = stretch.reduce((n, i) => n + runs[i].added, 0);
      places.push({
        at: left,
        x: left + COPY_TICK_PX + COPY_LABEL_GAP_PX,
        text: `${copyText(runs[most])}${added ? ` +${markSize(added)}` : ""}`,
        line: null,
        marker: marks.length,
      });
      marks.push({ x: left, runs: stretch, added });
      continue;
    }
    if (open && left - open.right >= COPY_RELABEL_PX) place();
    /* A line per run; a label over lines with the same words and style. */
    stretch.forEach((i, n) => {
      const run = runs[i];
      const right = n + 1 < stretch.length ? px(runs[stretch[n + 1]].from) : px(run.to);
      const dotted = run.tandem.length === 0;
      lines.push({ run: i, left: px(run.from), right, dotted });
      if (px(run.to) - px(run.from) < GAP_MIN_PX) {
        if (open) open.right = right;
        return;
      }
      const text = copyText(run);
      const key = `${text}${dotted ? " dotted" : ""}`;
      if (open?.key === key) open.right = right;
      else {
        place();
        open = { key, text, left: px(run.from), right, line: lines.length - 1 };
      }
    });
  }
  place();
  const bandEnd = px(axis.endBp);
  return {
    lines,
    markers: marks,
    labels: places.map(({ x, text, line, marker }, n) => ({
      x,
      end: n + 1 < places.length ? places[n + 1].at - COPY_LABEL_PAD_PX : bandEnd,
      text,
      line,
      marker,
    })),
    borders: [],
    below: [],
    pointers: [],
  };
}

/* ── The duplication rule's marks, at a pixel a base or more ───────────── */

/**
 * The marks below the bar (PLAN-duplications.md, 2026-11-02), from the
 * lane's copies and the axis: a black border round each original on the
 * band; for a run of tandem copies, one pointer where they are inserted,
 * "tandem ×k" ("inverted tandem ×k" for one read on the other strand);
 * for a dispersed copy, a dotted line under its original and, where the
 * bar draws its bases in place of reference, under that place, or a
 * pointer where it is inserted. The number pairs a dispersed copy with its
 * original: counted left to right by original over the copies whose
 * original and place are both in view; one with either out of view has no
 * number, its pointer reading "⋯ ×k". Each dispersed duplication has a row
 * of its own below the bar (laneLayout.ts's dupRowsOf), its original's
 * line and its copy's line or pointer on that row, the rows in the order
 * of the originals; a tandem pointer sits on the first row. Nothing where
 * the bar draws none of a copy and its original is off the band (its row
 * alone shows it).
 */
export function dupDrawing(lane: LinearLane, axis: TierAxis): Pick<CopyDrawing, "borders" | "below" | "pointers"> {
  const { px, viewFromPx, viewToPx } = axis;
  const inView = (left: number, right: number) => right >= viewFromPx && left <= viewToPx;
  const borders: DupBorder[] = [];
  const below: DupLine[] = [];
  const pointers: DupPointer[] = [];
  const numbered = lane.copies
    .filter((copy) => copy.kind === "dispersed" && copy.original && copy.bar && inView(px(copy.original[0]), px(copy.original[1])) && inView(px(copy.bar.ref), px(copy.bar.ref + copy.bar.len)))
    .sort((a, b) => a.original![0] - b.original![0] || a.index - b.index);
  const numberOf = new Map(numbered.map((copy, n) => [copy.index, n + 1]));
  /* The rows: one per dispersed copy with an original or a place, in the
     order of their originals (their places where they have none), stable
     across pans; as many as laneLayout.ts gives the lane. */
  const placeOf = (copy: Copy) => (copy.original ? copy.original[0] : copy.bar!.ref);
  const rowed = lane.copies.filter((copy) => copy.kind === "dispersed" && (copy.original || copy.bar)).sort((a, b) => placeOf(a) - placeOf(b) || a.index - b.index);
  const rowOf = new Map(rowed.map((copy, n) => [copy.index, Math.min(n, dupRowsOf(lane) - 1)]));
  for (const copy of lane.copies) {
    if (copy.original) borders.push({ left: px(copy.original[0]), right: px(copy.original[1]) });
    if (copy.kind === "tandem") {
      if (copy.group === copy.index && copy.bar) {
        pointers.push({ x: px(copy.bar.ref), copy: copy.index, row: 0, text: `${copy.inverted ? "inverted tandem" : "tandem"} ×${copy.times}`, underline: true });
      }
      continue;
    }
    const row = rowOf.get(copy.index);
    if (row === undefined) continue;
    const number = numberOf.get(copy.index) ?? null;
    const text = `×${copy.times}`;
    if (copy.original) below.push({ left: px(copy.original[0]), right: px(copy.original[1]), copy: copy.index, row, number, text });
    if (!copy.bar) continue;
    if (copy.bar.len > 0) below.push({ left: px(copy.bar.ref), right: px(copy.bar.ref + copy.bar.len), copy: copy.index, row, number, text });
    else pointers.push({ x: px(copy.bar.ref), copy: copy.index, row, text: number !== null ? `${number}. ${text}` : `⋯ ${text}`, underline: false });
  }
  return { borders, below, pointers };
}

/* ── A model ───────────────────────────────────────────────────────────── */

export interface LaneTiers {
  key: string;
  bar: BarTiers;
  /** One per walk row, as in LaneBins. */
  readings: Array<{ index: number; tiers: BarTiers }>;
}

/** Every haplotype's bar and walk rows at one zoom, from their bins
    (modelBins at this zoom's bin size, binBpAt(axis.scale)). */
export function modelTiers(model: LinearModel, bins: ModelBins, axis: TierAxis): LaneTiers[] {
  const lanes = new Map(model.lanes.map((lane) => [lane.key, lane]));
  const out: LaneTiers[] = [];
  for (const laneBins of bins.lanes) {
    const lane = lanes.get(laneBins.key);
    if (!lane) continue;
    out.push({
      key: lane.key,
      bar: barTiers(bins, laneBins.bar, barRow(lane), axis),
      readings: laneBins.readings.map(({ index, bins: rowBins }) => ({
        index,
        tiers: barTiers(bins, rowBins, walkRow(lane, lane.copies[index]), axis),
      })),
    });
  }
  return out;
}
