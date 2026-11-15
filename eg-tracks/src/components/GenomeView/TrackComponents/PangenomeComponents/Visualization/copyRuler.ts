import type { ContigCopies, OwnRange, ViewCopy } from "./copiesModel";
import { betweenText, copiesCount, copyTab, regionNumeral } from "./copiesModel";
import type { LaneSlots } from "./laneLayout";

/* ══════════════════════════════════════════════════════════════════════════
   The copy ruler of a haplotype with copies, and its tabs: where everything
   sits (PLAN-remastered-2.md section 3, steps 3 and 4, in eg3/claude-memory;
   mockup diagrams/copy-ruler-aero.html). No React: CopyRulerView.tsx draws what
   this works out, in the track's header, which does not pan.

   The ruler is in the haplotype's own coordinates, one per contig with
   copies: from where the finder's walk stopped on the left to where it
   stopped on the right. On it lie the anchor sites (the reference just
   outside the duplicated stretch, read once; with them whatever else is
   read in place outside the copies), the copies in own order, and
   what the walk found between them: cuts (holes in the graph), and
   stretches it could not place on CHM13, labelled own sequence (the user,
   2026-11-15: drawn as nothing, they read as a deletion), their hover
   saying they are not read in this CHM13 region, since they may be CHM13
   farther away. Over it stands one pin a row, numbered as the
   row is, where the row's stretch on screen lies; an amber mark shows that
   stretch at its true size: a line across the bar while it is narrow, a
   band along the bar's foot once it is wide, so it never hides a copy.
   ══════════════════════════════════════════════════════════════════════════ */

/** The ruler's measures, down from its band's top and in from the view's
    left (the band is laneLayout.ts RULER_H tall). */
export const RULER = {
  /** Where the ruler starts: after the caption at its left. */
  left: 244,
  /** The room kept at the view's right. */
  right: 12,
  /** The caption's place and width. */
  captionLeft: 4,
  captionWidth: 230,
  barTop: 33,
  barH: 14,
  /** A pin's centre and radius; pins closer than `pinGap` are moved apart. */
  pinY: 22.5,
  pinR: 6.5,
  pinGap: 15,
  /** The ticks' numbers' baseline. */
  tickLabelY: 58,
  /** The smallest step between ticks, in pixels. */
  tickMinPx: 110,
  /** An amber mark's least width. */
  markMin: 2,
} as const;

/** One stretch of the ruler. */
export interface RulerStretch {
  x0: number;
  x1: number;
  own: OwnRange;
  kind: "anchor" | "copy" | "uncut" | "cut" | "unplaced";
  /** A copy's shade: the haplotype's colour, or (1) a shade deeper, turn
      about, so two copies side by side are told apart. */
  tone: 0 | 1;
  /** Written inside it when it fits. */
  label: string;
  /** Its words, for a hover. */
  title: string;
  /** A copy's parts, each read forward or backward. */
  parts: Array<{ x0: number; x1: number; backward: boolean }>;
}
/** A row's pin. */
export interface RulerPin {
  /** The row's place among the lane's rows, from 0, and its number. */
  row: number;
  n: number;
  /** Where the row's stretch on screen lies: the middle of what of it
      lies in the row's copy (a row may run from an anchor site into its
      copy, or on past it), or its own middle where none does. */
  at: number;
  /** Where the pin stands: `at`, unless pins were moved apart. */
  x: number;
  /** Nothing of the row is on screen: the pin is over its whole range. */
  dim: boolean;
}
/** Where a row's stretch on screen lies on the ruler. */
export interface RulerMark {
  row: number;
  x0: number;
  x1: number;
}
export interface RulerTick {
  x: number;
  label: string;
}
export interface CopyRuler {
  /** From the lane's top. */
  top: number;
  contig: string;
  /** "in place, 4 copies"; "unknown number of copies". */
  count: string;
  /** "Copy positions 38.08–38.48 Mb". */
  caption: string;
  x0: number;
  x1: number;
  stretches: RulerStretch[];
  pins: RulerPin[];
  /** Too many pins to stand apart: drawn small, without numbers. */
  crowded: boolean;
  marks: RulerMark[];
  ticks: RulerTick[];
  /** The walk stopped at one of its limits: there may be more copies. */
  mightBeMore: boolean;
}
/** A tab, on its line across the lane. */
export interface CopyTabView {
  /** The strip's top, from the lane's top. */
  top: number;
  /** The first row under it. */
  row: number;
  text: string;
  /** What lies between its copy and the copy before, on the line; empty
      where the copy follows straight on. */
  between: string;
  /** Its copy's shade on the ruler; null for a tab that is no copy's. */
  tone: 0 | 1 | null;
  title: string;
}
/** A lane's copies as its header draws them. */
export interface LaneCopies {
  /** The view's width, in pixels. */
  width: number;
  /** The lane's height. */
  height: number;
  /** The contig is named in each ruler's title: the lane has rows on more
      than one. */
  nameContigs: boolean;
  rulers: CopyRuler[];
  tabs: CopyTabView[];
}

/** What this reads of a row: its contig, the stretch of its own
    coordinates it draws (linearModel.ts `extent`), and the stretch of it
    on screen (legendRows.ts visibleOwn), null when none is. */
export interface RulerRow {
  contig: string;
  extent: OwnRange;
  seen: OwnRange | null;
  /** The row's copy's own range (linearModel.ts `copy`), null in none. */
  copy: OwnRange | null;
}

const kb = (bp: number): string => `${(bp / 1000).toFixed(1)} kb`;
const sized = (bp: number): string => (bp >= 10_000 ? kb(bp) : `${bp.toLocaleString()} bp`);
const range = (contig: string, own: OwnRange): string => `${contig}:${own[0].toLocaleString()}–${own[1].toLocaleString()}`;


/** The step between ticks: 1, 2 or 5 times a power of ten, `least` bases
    or more. */
export function tickStep(least: number): number {
  if (!(least > 1)) return 1;
  const power = Math.pow(10, Math.floor(Math.log10(least)));
  const lead = least / power;
  return (lead <= 1 ? 1 : lead <= 2 ? 2 : lead <= 5 ? 5 : 10) * power;
}

/**
 * One contig's ruler in a view `width` pixels wide. `rows` are the lane's
 * rows, in their order; only those on this contig get a pin.
 */
export function copyRulerOf(contig: ContigCopies, rows: ReadonlyArray<RulerRow>, width: number, top = 0): CopyRuler {
  const x0: number = RULER.left;
  const x1 = Math.max(x0 + 1, width - RULER.right);
  const [from, to] = contig.span;
  const scale = to > from ? (x1 - x0) / (to - from) : 0;
  const x = (own: number) => Math.min(x1, Math.max(x0, x0 + (own - from) * scale));
  const stretch = (own: OwnRange, kind: RulerStretch["kind"], label: string, title: string, tone: 0 | 1 = 0, parts: RulerStretch["parts"] = []): RulerStretch => ({
    x0: x(own[0]),
    x1: x(own[1]),
    own,
    kind,
    tone,
    label,
    title,
    parts,
  });

  const stretches: RulerStretch[] = [];
  /* What is read in place outside the copies: an anchor site alone, or
     with it the reference a row reads on from the copy in place. */
  for (const site of contig.outside) {
    const isSite = [contig.anchors.left, contig.anchors.right].some((one) => one && one[0] === site[0] && one[1] === site[1]);
    stretches.push(
      stretch(
        site,
        "anchor",
        "read once",
        isSite
          ? `Anchor site · ${range(contig.contig, site)} · the reference just outside the duplicated stretch, read once`
          : `Outside the duplicated stretch · ${range(contig.contig, site)} · read in place: the reference there is read once`,
      ),
    );
  }
  contig.copies.forEach((copy, k) => {
    stretches.push(
      stretch(
        copy.own,
        "copy",
        copy.n === null ? "in place" : regionNumeral(copy.n),
        `${copyTab(copy)} · ${range(contig.contig, copy.own)}`,
        (k % 2) as 0 | 1,
        copy.parts.map((part) => ({ x0: x(part.own[0]), x1: x(part.own[1]), backward: part.backward })),
      ),
    );
  });
  if (contig.uncut) {
    /* Broken where a stretch inside could not be placed on CHM13: nothing
       is drawn there, the bare line between the pieces. */
    const holes = contig.others.filter((other) => other.kind === "unplaced").map((other) => other.own).sort((p, q) => p[0] - q[0]);
    const pieces: OwnRange[] = [];
    let at = contig.uncut[0];
    for (const [a, b] of holes) {
      if (b <= at || a >= contig.uncut[1]) continue;
      if (a > at) pieces.push([at, a]);
      at = Math.max(at, b);
    }
    if (contig.uncut[1] > at) pieces.push([at, contig.uncut[1]]);
    for (const piece of pieces) {
      stretches.push(stretch(piece, "uncut", "", `Unknown number of copies · ${range(contig.contig, contig.uncut)} · nothing here is in place, so it is not cut into copies`));
    }
  }
  for (const other of contig.others) {
    const bp = other.own[1] - other.own[0];
    stretches.push(
      other.kind === "cut"
        ? stretch(other.own, "cut", "cut", `Cut · ${bp.toLocaleString()} bp not in the graph · ${range(contig.contig, other.own)}`)
        : stretch(other.own, "unplaced", "own sequence", `${sized(bp)} of its own sequence: not read in this CHM13 region · ${range(contig.contig, other.own)}`),
    );
  }
  /* In own order; an uncut stretch before what lies inside it, which is
     drawn over it. */
  stretches.sort((p, q) => p.own[0] - q.own[0] || (p.kind === "uncut" ? -1 : q.kind === "uncut" ? 1 : 0));

  /* The pins and the marks. */
  const pins: RulerPin[] = [];
  const marks: RulerMark[] = [];
  rows.forEach((row, n) => {
    if (row.contig !== contig.contig) return;
    const own: OwnRange = row.seen ?? row.extent;
    const inCopy: OwnRange | null = row.copy && Math.min(row.copy[1], own[1]) > Math.max(row.copy[0], own[0]) ? [Math.max(row.copy[0], own[0]), Math.min(row.copy[1], own[1])] : null;
    const at = x(((inCopy ?? own)[0] + (inCopy ?? own)[1]) / 2);
    pins.push({ row: n, n: n + 1, at, x: at, dim: !row.seen });
    if (row.seen) {
      const m0 = x(own[0]);
      const m1 = x(own[1]);
      const short = Math.max(0, RULER.markMin - (m1 - m0)) / 2;
      marks.push({ row: n, x0: m0 - short, x1: m1 + short });
    }
  });
  /* Pins closer than the gap are moved apart: to the right first, then
     back from the ruler's end. Where there is no room for all, none is
     moved and they are drawn small. */
  const inOrder = [...pins].sort((p, q) => p.at - q.at || p.row - q.row);
  const crowded = inOrder.length > 1 && (inOrder.length - 1) * RULER.pinGap > x1 - x0 - 2 * RULER.pinR;
  if (!crowded) {
    for (let k = 1; k < inOrder.length; k++) inOrder[k].x = Math.max(inOrder[k].x, inOrder[k - 1].x + RULER.pinGap);
    const last = inOrder.length - 1;
    if (last >= 0) inOrder[last].x = Math.min(inOrder[last].x, x1 - RULER.pinR);
    for (let k = last - 1; k >= 0; k--) inOrder[k].x = Math.min(inOrder[k].x, inOrder[k + 1].x - RULER.pinGap);
  }

  /* The ticks. */
  const ticks: RulerTick[] = [];
  if (scale > 0) {
    const step = tickStep(RULER.tickMinPx / scale);
    for (let at = Math.ceil(from / step) * step; at <= to; at += step) ticks.push({ x: x(at), label: at.toLocaleString() });
  }

  const mb = (own: number) => (own / 1e6).toFixed(2);
  return {
    top,
    contig: contig.contig,
    count: copiesCount(contig),
    caption: `Copy positions ${mb(from)}–${mb(to)} Mb`,
    x0,
    x1,
    stretches,
    pins,
    crowded,
    marks,
    ticks,
    mightBeMore: contig.mightBeMore,
  };
}

/**
 * A lane's rulers and tabs, placed by its slots (laneLayout.ts laneSlots);
 * null for a lane without copies.
 */
export function laneCopiesOf(lane: { rows: ReadonlyArray<{ contig: string; extent: OwnRange; copy?: ViewCopy | null }>; copies: ReadonlyArray<ContigCopies> }, slots: LaneSlots, seen: ReadonlyArray<OwnRange | null>, width: number): LaneCopies | null {
  if (!slots.rulers.length) return null;
  const rows: RulerRow[] = lane.rows.map((row, n) => ({ contig: row.contig, extent: row.extent, seen: seen[n] ?? null, copy: row.copy?.own ?? null }));
  const rulers = slots.rulers
    .map((slot) => {
      const contig = lane.copies.find((one) => one.contig === slot.contig);
      return contig ? copyRulerOf(contig, rows, width, slot.top) : null;
    })
    .filter((one): one is CopyRuler => one !== null);
  const tabs: CopyTabView[] = slots.tabs.map((slot, k) => {
    const contig = lane.copies.find((one) => one.contig === slot.contig);
    const base = { top: slot.top, row: slot.row };
    if (slot.kind === "copy" && slot.copy && contig) {
      const at = contig.copies.indexOf(slot.copy);
      /* The line says what lies between this copy and the copy before it
         in the haplotype's own order. Where that copy has no row here, so
         no tab above this one, the line names it. */
      const before = k > 0 ? slots.tabs[k - 1] : null;
      const follows = !!before && before.kind === "copy" && before.contig === slot.contig && before.copy === contig.copies[at - 1];
      const lies = betweenText(slot.copy.between);
      return {
        ...base,
        text: copyTab(slot.copy),
        between: lies && !follows && at > 0 ? `after ${contig.copies[at - 1].n === null ? "in place" : `region ${regionNumeral(contig.copies[at - 1].n!)}`}: ${lies}` : lies,
        tone: (at % 2) as 0 | 1,
        title: `${copyTab(slot.copy)} · ${range(slot.contig, slot.copy.own)}`,
      };
    }
    if (slot.kind === "uncut" && contig?.uncut) {
      return {
        ...base,
        text: `Unknown number of copies · ${kb(contig.uncut[1] - contig.uncut[0])}`,
        between: "",
        tone: 0,
        title: `${range(slot.contig, contig.uncut)}: the stretch found reading the duplicated stretch. Nothing in it is in place, so it is not cut into copies`,
      };
    }
    if (slot.kind === "outside") {
      return { ...base, text: "Not in a copy", between: "", tone: null, title: `Rows on ${slot.contig} that lie in none of its copies` };
    }
    return { ...base, text: slot.contig, between: "", tone: null, title: `Rows on ${slot.contig}, where no copies were found` };
  });
  return { width, height: slots.height, nameContigs: new Set(lane.rows.map((row) => row.contig)).size > 1, rulers, tabs };
}
