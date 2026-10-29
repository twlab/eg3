/** What the layout reads of a model: its lanes, and the strip's rows. */
export interface LayoutModel {
  lanes: ReadonlyArray<{ key: string; label: string; color: string; isReference: boolean }>;
  rowCount: number;
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
/** Between one haplotype's bar and the next, and between the strip and the
    first of them. Nothing: what separates one from the next is the rule
    under it, and a gap as well left every bar looking as though it had been
    pushed down from its own name. */
export const LANE_GAP = 0;
export const STRIP_GAP = 0;
/** Top to top, which is the bar itself now that nothing sits between two. */
export const LANE_HEIGHT = LANE_H + LANE_GAP;
/** Nothing under the last bar: the rule under it is where the drawing ends,
    and room past that read as a gap belonging to something. */
export const FOOT_PAD = 0;
/** One row of the strip. The rows sit against each other: the reference's own
    walk and the alleles of it are one drawing of one place. */
export const NODE_H = 18;

/** One row of the drawing, and the haplotype it belongs to. */
export interface LaneRow {
  key: string;
  label: string;
  color: string;
  /** The reference's row is the strip, which is drawn rather than barred. */
  isReference: boolean;
  top: number;
  height: number;
}

export interface LaneLayout {
  /** The strip, which is where the reference is drawn. */
  stripTop: number;
  stripH: number;
  /** A row for the strip and one per haplotype bar, top to bottom. */
  rows: LaneRow[];
  /** What the whole drawing comes to. */
  height: number;
}

/**
 * The rows of the linear view, in the order they are drawn.
 *
 * The strip - the reference, one row of it and a row per alternative
 * allele while those are asked for - then a bar per haplotype, BAR_H tall. No ruler: eg3's ruler track draws the
 * coordinates. Without `strip`, only the bars: a haplotype drawn as a track
 * row of its own.
 */
export function laneLayout(
  model: LayoutModel,
  alleleRows: boolean,
  strip = true,
): LaneLayout {
  const stripTop = 0;
  const stripH = strip ? (alleleRows ? model.rowCount : 1) * NODE_H : 0;

  const reference = model.lanes.find((lane) => lane.isReference);
  const rows: LaneRow[] = reference && strip
    ? [
        {
          key: reference.key,
          label: reference.label,
          color: reference.color,
          isReference: true,
          top: stripTop,
          height: stripH,
        },
      ]
    : [];

  /* One bar per haplotype, BAR_H tall: copies of a stretch share it as
     thinner bars rather than taking rows of their own. */
  let running = stripTop + stripH + (strip ? STRIP_GAP : 0);
  model.lanes.forEach((lane) => {
    /* The reference has no bar of its own: the strip is where it is drawn. */
    if (lane.isReference) return;
    const height = BAR_H;
    rows.push({
      key: lane.key,
      label: lane.label,
      color: lane.color,
      isReference: false,
      top: running,
      height,
    });
    running += height + LANE_GAP;
  });

  return { stripTop, stripH, rows, height: running + FOOT_PAD };
}
