import type { BinGrid, BinVariant, Bins, ModelBins, VariantKind } from "./bins";
import type { LinearAxis } from "./linearAxis";
import type { LinearModel, OutOfBand, PlacedPart, Row } from "./linearModel";

/* ══════════════════════════════════════════════════════════════════════════
   The linear view zoomed out: what each variant of a row is drawn as.

   bins.ts adds a row's parts up into bins. This decides, at one zoom, what
   the row draws of them, so the row, its track legend and the tests all
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
   - Bases read on the other strand (an inverted run) get arrows over runs
     at least 5 px wide, and one arrow glyph below that. So an inversion of
     any size shows by its arrows, never by a tick, and is not counted
     (bins.ts).
   A duplication is not a variant of a row: the haplotype's rows are its
   walks, and a stretch it has more than once is in more than one row
   (PLAN-rows.md).
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

/** Whether a variant is drawn as itself at `scale` pixels a base. Its size
    is the larger of its reference span and its inserted bases (bins.ts),
    so an insertion is measured as if its bases took room. */
export function isBig(variant: Pick<BinVariant, "kind" | "size">, scale: number): boolean {
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
    pixels a base, where a base is placed, the band's ends, and the view. */
export type TierAxis = Pick<LinearAxis, "scale" | "px" | "startBp" | "endBp" | "viewFromPx" | "viewToPx">;

/** One row as barRaster.ts reads it: its parts and its whites out of the
    band. */
export interface TierRow {
  parts: PlacedPart[];
  outOfBand: OutOfBand[];
}

/** A row of the model as a tier row. */
export const rowOf = (row: Row): TierRow => ({ parts: row.parts, outOfBand: row.outOfBand });

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
}

/** The kinds that take room on the reference. */
const ROOMY = new Set<PlacedPart["kind"]>(["match", "mismatch", "replaced", "inverted"]);
/** The reference bases a part covers: a mark's len is its inserted bases,
    which take none. */
const roomOf = (part: PlacedPart) => (part.kind === "mark" ? 0 : part.len);
/** The kinds of small variant drawn as a tick: never a deletion (a gap, or
    counted) or an inversion (arrows). */
const TICKED = new Set<VariantKind>(["SNV", "MNV", "insertion", "deletion-insertion"]);

/** The key of the variant a part draws (bins.ts): its bubble's index,
    "span" for a span's white, "mark:<index>" for a mark at an end. A
    match draws none. */
export function partKey(part: PlacedPart, index: number): string | null {
  if (part.kind === "match") return null;
  if (part.span) return "span";
  if (part.bubble !== null) return String(part.bubble);
  return part.kind === "mark" ? `mark:${index}` : null;
}

/** Each variant of a row by its key, as an index into the list. */
function variantIds(list: BinVariant[]): Map<string, number> {
  const ids = new Map<string, number>();
  list.forEach((variant, i) => ids.set(variant.key, i));
  return ids;
}

/* ── Whites ────────────────────────────────────────────────────────────── */

/**
 * Every white of a row that has room in the band, where barRaster.ts
 * places it: a white part (a deletion, a deletion-insertion's leftover
 * reference, a deletion inside an inverted run, a span) from its first
 * base to past its last; a white out of the band from its junction to the
 * band's edge. `ids` names their variants.
 */
export function rowWhites(grid: Pick<BinGrid, "origin" | "end">, row: TierRow, axis: TierAxis, ids?: Map<string, number>): TierWhite[] {
  const { px, startBp, endBp, viewFromPx, viewToPx } = axis;
  const whites: TierWhite[] = [];
  const add = (left: number, right: number, from: number, to: number, part: number | null, out: number | null, id: string | null) => {
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
    add(px(part.ref), px(part.ref + part.len), part.ref, part.ref + part.len, index, null, partKey(part, index));
  });
  row.outOfBand.forEach((white, index) => {
    const id = `out:${white.side}`;
    if (white.side === "right") add(px(white.ref), px(endBp), white.ref, grid.end, null, index, id);
    else add(px(startBp), px(white.ref), grid.origin, white.ref, null, index, id);
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
    const key = partKey(part, index);
    const id = key === null ? undefined : ids.get(key);
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
     not big. */
  const small = new Int32Array(grid.count);
  list.forEach((variant, i) => {
    if (variant.bin === null || !variant.counted || big[i]) return;
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
    const key = partKey(part, index);
    const id = key === null ? undefined : ids.get(key);
    if (id !== undefined ? big[id] : bigInsertion(part.len, scale)) keptMarks.push(index);
  });

  /* Bases read on the other strand: those an inverted run covers, less the
     deletions inside it, which are white. */
  const turned: Stretch[] = [];
  const insideWhites: Stretch[] = [];
  for (const part of row.parts) {
    if (part.kind === "white") {
      if (part.inverted) insideWhites.push([part.ref, part.ref + part.len]);
    } else if (ROOMY.has(part.kind) && (part.kind === "inverted" || part.inverted)) {
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
  };
}

/* ── A model ───────────────────────────────────────────────────────────── */

export interface LaneTiers {
  key: string;
  /** One per row, as in LaneBins. */
  rows: Array<{ index: number; tiers: BarTiers }>;
}

/** Every haplotype's rows at one zoom, from their bins (modelBins at this
    zoom's bin size, binBpAt(axis.scale)). */
export function modelTiers(model: LinearModel, bins: ModelBins, axis: TierAxis): LaneTiers[] {
  const lanes = new Map(model.lanes.map((lane) => [lane.key, lane]));
  const out: LaneTiers[] = [];
  for (const laneBins of bins.lanes) {
    const lane = lanes.get(laneBins.key);
    if (!lane) continue;
    out.push({
      key: lane.key,
      rows: laneBins.rows.map(({ index, bins: rowBins }) => ({ index, tiers: barTiers(bins, rowBins, rowOf(lane.rows[index]), axis) })),
    });
  }
  return out;
}
