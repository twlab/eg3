/** What the layout reads of a model: its lanes, each with its rows
    (linearModel.ts). */
export interface LayoutModel {
  lanes: ReadonlyArray<{
    key: string;
    label: string;
    color: string;
    isReference: boolean;
    rows: ReadonlyArray<unknown>;
  }>;
}

/* ══════════════════════════════════════════════════════════════════════════
   Where the rows of the linear view sit.

   The drawing pans and the names beside it do not, so they are two elements
   rather than one - and two elements that have to agree to the pixel, since
   a name level with the wrong row is worse than no name at all. Neither of
   them owns the arithmetic: this does, and both read it.

   Everything here is in the drawing's own coordinates, measured down from
   the top of it. The legend sits at the same top, so the numbers mean the
   same thing on both sides.
   ══════════════════════════════════════════════════════════════════════════ */

/** The names down the left, and the room the drawing gives up for them. */
export const LEGEND_WIDTH = 120;

/** The tube map sizes its tubes from this: what a haplotype's bar was. */
export const LANE_H = 17;
/** One row of a haplotype: the band above the bar for the insertion marks
    (BarCanvas.tsx's MARK_BAND), the bar, and the rule under it. */
export const ROW_H = 44;
/** The room above each row. Its name, the walk's own coordinates, used
    to be written here; it is in the track legend now (PLAN-legend.md),
    and the room stays for the edges between passes. */
export const ROW_LABEL_H = 14;
/** Under a lane's last row. */
export const LANE_FOOT = 4;
/** A lane's height: its rows, one at least (a haplotype with no row still
    holds a row's worth, where its words go). */
export function laneHeightOf(rows: number): number {
  return Math.max(1, rows) * (ROW_LABEL_H + ROW_H) + LANE_FOOT;
}
/** The top of a lane's n-th row's bar, from the lane's top. */
export const rowTop = (n: number) => n * (ROW_LABEL_H + ROW_H) + ROW_LABEL_H;
/** The graph's own track row in linear view: the ref bar (RefBar.tsx),
    the reference walk every row is drawn against, as tall as eg3's chrome
    needs the row to be: its name in the track legend (one line, 11 px)
    and the loading button that sits at the foot of a track's legend while
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
}

export interface LaneLayout {
  /** One per haplotype, top to bottom. */
  rows: LaneRow[];
  /** What the whole drawing comes to. */
  height: number;
}

/**
 * The lanes of the linear view, in the order they are drawn: one per
 * haplotype, each as tall as its rows. No ruler - eg3's ruler track draws
 * the coordinates - and no lane for the reference, which every row is
 * drawn against.
 */
export function laneLayout(model: LayoutModel): LaneLayout {
  const rows: LaneRow[] = [];
  let running = 0;
  model.lanes.forEach((lane) => {
    if (lane.isReference) return;
    const height = laneHeightOf(lane.rows.length);
    rows.push({ key: lane.key, label: lane.label, color: lane.color, top: running, height, rows: lane.rows.length });
    running += height;
  });
  return { rows, height: running };
}
