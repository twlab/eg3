import type { ContigCopies, ViewCopy } from "./copiesModel";

/** What the layout reads of a row: its contig, the stretch of its own
    coordinates it draws and the copy it lies in (linearModel.ts). */
export interface LayoutRow {
  contig?: string;
  extent?: [number, number];
  copy?: ViewCopy | null;
}
/** What the layout reads of a lane. */
export interface LayoutLane {
  rows: ReadonlyArray<LayoutRow>;
  /** The haplotype's copies per contig (copiesModel.ts); none, or absent,
      for a haplotype without copies. */
  copies?: ReadonlyArray<ContigCopies>;
}
/** What the layout reads of a model: its lanes, each with its rows
    (linearModel.ts). */
export interface LayoutModel {
  lanes: ReadonlyArray<
    LayoutLane & {
      key: string;
      label: string;
      color: string;
      isReference: boolean;
    }
  >;
}

/* ══════════════════════════════════════════════════════════════════════════
   Where the rows of the linear view sit.

   The drawing pans and the names over it do not, so they are two elements
   rather than one - and two elements that have to agree to the pixel, since
   a name level with the wrong row is worse than no name at all. Neither of
   them owns the arithmetic: this does, and both read it.

   Everything here is in the drawing's own coordinates, measured down from
   the top of it. The legend sits at the same top, so the numbers mean the
   same thing on both sides. Since 2026-11-14 the pangenome view has no
   legend column: the names are glass labels over the drawing's left edge
   (TrackHeader.tsx), and the drawing is the view's full width.
   ══════════════════════════════════════════════════════════════════════════ */

/** The tube map sizes its tubes from this: what a haplotype's bar was. */
export const LANE_H = 17;
/** One row of a haplotype: the band above the bar for the insertion marks
    (BarCanvas.tsx's MARK_BAND), the bar, and the rule under it. */
export const ROW_H = 44;
/** The room above each row, empty in the drawing: the row's region, the
    walk's own coordinates, sits here in a glass pill of the track's legend
    (legendRows.ts, TrackHeader.tsx); a lane's first strip also holds the
    haplotype's name. */
export const ROW_LABEL_H = 14;
/** Under a lane's last row. */
export const LANE_FOOT = 4;
/** A lane's height: its rows, one at least (a haplotype with no row still
    holds a row's worth, where its words go). For a lane without copies. */
export function laneHeightOf(rows: number): number {
  return Math.max(1, rows) * (ROW_LABEL_H + ROW_H) + LANE_FOOT;
}
/** The top of a lane's n-th row's bar, from the lane's top, in a lane
    without copies. A lane with copies has more in it: `laneSlots`. */
export const rowTop = (n: number) => n * (ROW_LABEL_H + ROW_H) + ROW_LABEL_H;

/* ── A lane with copies (PLAN-remastered-2.md section 3, steps 3 and 4) ──
   A haplotype with copies of a duplicated stretch has, before the first
   row of each contig with copies, a band for the copy ruler; and before
   the first row of each copy, a strip for the copy's tab, on a line across
   the band. The drawing leaves the room and draws the lines
   (LinearView.tsx); the ruler, the tabs and the words are the header's
   (TrackHeader.tsx, CopyRulerView.tsx), which does not pan. Both read this. */

/** The copy ruler's band: the title's strip (ROW_LABEL_H), the pins, the
    ruler's bar, the ticks' numbers (copyRuler.ts RULER). */
export const RULER_H = 62;
/** A tab's strip; its line is the strip's last pixel. */
export const TAB_H = 18;

/** A tab: the rows from `row` on, until the next tab, are one copy's; or
    the uncut stretch's, where nothing is in place; or rows of a contig
    with copies that lie in none of them; or the rows of a contig without
    copies, in a lane where another has some. */
export interface TabSlot {
  top: number;
  /** The first row under it. */
  row: number;
  contig: string;
  kind: "copy" | "uncut" | "outside" | "contig";
  copy: ViewCopy | null;
}
export interface RulerSlot {
  top: number;
  /** The contig's first row. */
  row: number;
  contig: string;
}
/** Where everything in a lane sits, from the lane's top. */
export interface LaneSlots {
  height: number;
  /** The top of each row's bar. */
  rowTops: number[];
  rulers: RulerSlot[];
  tabs: TabSlot[];
}

/**
 * The slots of a lane. Without copies: its rows, as `rowTop` and
 * `laneHeightOf` say. With copies: a ruler band before each contig that
 * has a row in one, a tab strip before each run of rows that belong
 * together.
 */
export function laneSlots(lane: LayoutLane): LaneSlots {
  const rows = lane.rows;
  /* A contig's copies count here only where one of its rows lies in a copy,
     or in the uncut stretch. Where none does - the view lies just outside
     the haplotype's duplicated stretch - a ruler would tell no rows apart,
     and the contig is laid out as one without copies (the user,
     2026-11-15: "hide"). */
  const inUncut = (row: LayoutRow, one: ContigCopies) => !!one.uncut && !!row.extent && Math.min(one.uncut[1], row.extent[1]) > Math.max(one.uncut[0], row.extent[0]);
  const copies = (lane.copies ?? []).filter((one) => rows.some((row) => row.contig === one.contig && ((!!row.copy && one.copies.includes(row.copy)) || inUncut(row, one))));
  const withCopies = (contig: string | undefined) => copies.find((one) => one.contig === contig);
  if (!rows.length || !rows.some((row) => withCopies(row.contig))) {
    return { height: laneHeightOf(rows.length), rowTops: rows.map((_, n) => rowTop(n)), rulers: [], tabs: [] };
  }
  const rowTops: number[] = [];
  const rulers: RulerSlot[] = [];
  const tabs: TabSlot[] = [];
  let y = 0;
  let group = "";
  rows.forEach((row, n) => {
    const contig = row.contig ?? "";
    const found = withCopies(contig);
    const newContig = n === 0 || rows[n - 1].contig !== row.contig;
    if (found && newContig) {
      rulers.push({ top: y, row: n, contig });
      y += RULER_H;
    }
    /* What the row belongs to. */
    let kind: TabSlot["kind"] = "contig";
    let copy: ViewCopy | null = null;
    let id = `${contig}|contig`;
    if (found) {
      const at = row.copy ? found.copies.indexOf(row.copy) : -1;
      if (at >= 0) {
        kind = "copy";
        copy = row.copy ?? null;
        id = `${contig}|copy ${at}`;
      } else if (inUncut(row, found)) {
        kind = "uncut";
        id = `${contig}|uncut`;
      } else {
        kind = "outside";
        id = `${contig}|outside`;
      }
    }
    if (id !== group) {
      tabs.push({ top: y, row: n, contig, kind, copy });
      y += TAB_H;
      group = id;
    }
    y += ROW_LABEL_H;
    rowTops.push(y);
    y += ROW_H;
  });
  return { height: y + LANE_FOOT, rowTops, rulers, tabs };
}
/** The graph's own track row in linear view: the ref bar (RefBar.tsx),
    the reference walk every row is drawn against, as tall as eg3's chrome
    needed the row to be in the legend column: its name (one line, 11 px)
    and the loading button that sat at the foot of a track's legend while
    a band loads (16 px). The user's choice of 2026-11-03, so no track
    moves. */
export const GRAPH_ROW_H = 16;

/** One lane of the drawing, and the haplotype it belongs to. */
export interface LaneRow {
  key: string;
  label: string;
  color: string;
  top: number;
  height: number;
  rows: number;
  /** Where its rows, rulers and tabs sit, from `top`. */
  slots: LaneSlots;
}

export interface LaneLayout {
  /** One per haplotype, top to bottom. */
  rows: LaneRow[];
  /** What the whole drawing comes to. */
  height: number;
}

/**
 * The lanes of the linear view, in the order they are drawn: one per
 * haplotype, each as tall as its rows, and its copy rulers and tabs where
 * it has copies. No ruler - eg3's ruler track draws
 * the coordinates - and no lane for the reference, which every row is
 * drawn against.
 */
export function laneLayout(model: LayoutModel): LaneLayout {
  const rows: LaneRow[] = [];
  let running = 0;
  model.lanes.forEach((lane) => {
    if (lane.isReference) return;
    const slots = laneSlots(lane);
    rows.push({ key: lane.key, label: lane.label, color: lane.color, top: running, height: slots.height, rows: lane.rows.length, slots });
    running += slots.height;
  });
  return { rows, height: running };
}
