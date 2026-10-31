/** What the layout reads of a model: its lanes. */
export interface LayoutModel {
  lanes: ReadonlyArray<{ key: string; label: string; color: string; isReference: boolean }>;
}

/* ══════════════════════════════════════════════════════════════════════════
   Where the rows of the linear view sit.

   The drawing pans and the names beside it do not, so they are two elements
   rather than one - and two elements that have to agree to the pixel, since
   a name level with the wrong bar is worse than no name at all. Neither of
   them owns the arithmetic: this does, and both read it.

   Everything here is in the drawing's own coordinates, measured down from
   the top of it. The legend sits at the same top, so the numbers mean the
   same thing on both sides.
   ══════════════════════════════════════════════════════════════════════════ */

/** The names down the left, and the room the drawing gives up for them. */
export const LEGEND_WIDTH = 120;

/** The tube map sizes its tubes from this: what a haplotype's bar was. */
export const LANE_H = 17;
/** How tall an alt path's bar is: one row, whatever it holds. Where the
    haplotype reads one place more than once the visits split it between
    them - see `visitBand` in laneRaster.ts. */
export const BAR_H = 60;
/** Between one haplotype's bar and the next. Nothing: what separates one
    from the next is the rule under it, and a gap as well left every bar
    looking as though it had been pushed down from its own name. */
export const LANE_GAP = 0;
/** Top to top, which is the bar itself now that nothing sits between two. */
export const LANE_HEIGHT = LANE_H + LANE_GAP;
/** Nothing under the last bar: the rule under it is where the drawing ends,
    and room past that read as a gap belonging to something. */
export const FOOT_PAD = 0;
/** The graph's own track row in linear view. It draws nothing - every bar
    is drawn against the reference, and eg3's ruler track gives the
    coordinates - so it is only as tall as eg3's chrome needs: its name in
    the track legend (one line, 11 px) and the loading button that sits at
    the foot of a track's legend while a band loads (16 px). */
export const GRAPH_ROW_H = 16;

/** One row of the drawing, and the haplotype it belongs to. */
export interface LaneRow {
  key: string;
  label: string;
  color: string;
  top: number;
  height: number;
}

export interface LaneLayout {
  /** One per haplotype bar, top to bottom. */
  rows: LaneRow[];
  /** What the whole drawing comes to. */
  height: number;
}

/**
 * The rows of the linear view, in the order they are drawn: a bar per
 * haplotype, BAR_H tall. No ruler - eg3's ruler track draws the
 * coordinates - and no row for the reference, which every bar is drawn
 * against.
 */
export function laneLayout(model: LayoutModel): LaneLayout {
  /* One bar per haplotype, BAR_H tall: copies of a stretch share it as
     thinner bars rather than taking rows of their own. */
  const rows: LaneRow[] = [];
  let running = 0;
  model.lanes.forEach((lane) => {
    /* The reference has no bar of its own. */
    if (lane.isReference) return;
    const height = BAR_H;
    rows.push({
      key: lane.key,
      label: lane.label,
      color: lane.color,
      top: running,
      height,
    });
    running += height + LANE_GAP;
  });

  return { rows, height: running + FOOT_PAD };
}
