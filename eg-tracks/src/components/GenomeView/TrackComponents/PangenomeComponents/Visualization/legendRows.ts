import type { PlacedPart } from "./rowAlign";
import type { Row } from "./linearModel";
import { rowTop } from "./laneLayout";

/* ═══════════════════════════════════════════════════════════════════════
   The rows' regions in the track legend (PLAN-legend.md in
   eg3/claude-memory).

   Each row of a haplotype's lane is one pass of its walk through the
   expanded region view. Its region, the walk's own coordinates, used to
   be written over the row in the drawing; it is written in the track
   legend instead, level with the row, and says what is on screen: the
   stretch of the walk's own coordinates whose pixels lie inside the
   window, the parts at the window's edges cut in proportion. A pan moves
   the window and the words follow (TrackFactory, viewWindowConfigChange).
   A row with nothing on screen keeps its whole region, dimmed.
   ═══════════════════════════════════════════════════════════════════════ */

/** One row's words in the legend: where they sit, measured down from the
    lane's top as the rows are (laneLayout.ts), the lines, the whole story
    for a hover, and whether nothing of the row is on screen. */
export interface LegendRow {
  top: number;
  lines: string[];
  title: string;
  dim: boolean;
}

/** The stretch of a row's own coordinates on screen, lowest first: every
    part holding its bases whose pixels fall inside [fromPx, toPx], a part
    across an edge cut in proportion to the pixels kept. A mark holds its
    bases at one reference place, so it counts when that place is inside.
    On the reference's strand a part's left end is its lowest own
    coordinate; reversed, its right end is, so the cut comes off the
    other end. Null when nothing of the row is inside. */
export function visibleOwn(row: Pick<Row, "parts">, px: (bp: number) => number, fromPx: number, toPx: number): [number, number] | null {
  let lo = Infinity;
  let hi = -Infinity;
  const keep = (from: number, to: number) => {
    lo = Math.min(lo, from);
    hi = Math.max(hi, to);
  };
  for (const part of row.parts) {
    if (!part.own) continue;
    const x0 = px(part.ref);
    if (part.kind === "mark" || part.len <= 0) {
      if (x0 >= fromPx && x0 <= toPx) keep(part.own.from, part.own.to);
      continue;
    }
    const x1 = px(part.ref + part.len);
    if (x1 <= fromPx || x0 >= toPx) continue;
    const cutLeft = Math.max(0, (fromPx - x0) / (x1 - x0));
    const cutRight = Math.max(0, (x1 - toPx) / (x1 - x0));
    const span = part.own.to - part.own.from;
    const offLow = Math.round(span * (part.own.reverse ? cutRight : cutLeft));
    const offHigh = Math.round(span * (part.own.reverse ? cutLeft : cutRight));
    keep(part.own.from + offLow, part.own.to - offHigh);
  }
  return lo <= hi ? [lo, hi] : null;
}

/** A region as text: "chr17:39,145,028–39,146,200". */
export const regionText = (contig: string, from: number, to: number): string => `${contig}:${from.toLocaleString()}–${to.toLocaleString()}`;

/** About what a character of the legend's 10 px monospace takes, and the
    room the legend keeps at its sides. */
const CHAR_PX = 6;
const SIDE_PX = 8;

/** The region's lines for a legend of the given width: one line when it
    fits, else two, the contig and the first coordinate over the second. */
export function regionLines(contig: string, from: number, to: number, legendWidth: number): string[] {
  const one = regionText(contig, from, to);
  if (one.length * CHAR_PX + SIDE_PX <= legendWidth) return [one];
  return [`${contig}:${from.toLocaleString()}`, `–${to.toLocaleString()}`];
}

/** The legend's rows for a lane: one per row of the lane, level with the
    row's bar, saying the stretch of the walk on screen, or the whole
    region dimmed when nothing of the row is. */
export function legendRowsOf(rows: ReadonlyArray<Pick<Row, "parts" | "contig" | "ownFrom" | "ownTo">>, px: (bp: number) => number, fromPx: number, toPx: number, legendWidth: number): LegendRow[] {
  return rows.map((row, n) => {
    const seen = visibleOwn(row, px, fromPx, toPx);
    const whole = regionText(row.contig, row.ownFrom, row.ownTo);
    const [from, to] = seen ?? [row.ownFrom, row.ownTo];
    const sameAsWhole = seen && from === row.ownFrom && to === row.ownTo;
    return {
      top: rowTop(n) + 2,
      lines: regionLines(row.contig, from, to, legendWidth),
      title: seen ? (sameAsWhole ? `${whole}: the whole walk is on screen` : `on screen: ${regionText(row.contig, from, to)} of ${whole}`) : `${whole}: nothing of it is on screen`,
      dim: !seen,
    };
  });
}
