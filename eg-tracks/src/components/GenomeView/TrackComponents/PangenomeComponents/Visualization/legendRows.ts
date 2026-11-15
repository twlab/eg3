import type { Row } from "./linearModel";
import { ROW_LABEL_H, rowTop } from "./laneLayout";

/* ═══════════════════════════════════════════════════════════════════════
   The rows' regions in the track's legend (PLAN-legend.md, and
   PLAN-remastered-2.md section 3, in eg3/claude-memory).

   Each row of a haplotype's lane is one pass of its walk through the
   expanded region view. Its region, the walk's own coordinates, says what
   is on screen: the stretch of the walk's own coordinates whose pixels
   lie inside the window, the parts at the window's edges cut in
   proportion. A pan moves the window and the words follow (TrackFactory,
   viewWindowConfigChange). A row with nothing on screen keeps its whole
   region, dimmed.

   The pangenome view has no legend column since 2026-11-14: the words sit
   in a glass label in the empty strip above the row's bar
   (TrackHeader.tsx), on one line: the haplotype's name and the region on
   screen with its contig, as one label.
   ═══════════════════════════════════════════════════════════════════════ */

/** One row's words in the legend: where they sit, measured down from the
    lane's top as the rows are (laneLayout.ts), the lines, the whole story
    for a hover, and whether nothing of the row is on screen. */
export interface LegendRow {
  top: number;
  /** The region with its contig, as the column wrote it; the glass label
      keeps it as its `data-region`. */
  lines: string[];
  title: string;
  dim: boolean;
  /** The glass label's words (the user, 2026-11-14: "MHC-HG00621#1:
      1-2"): the haplotype's name and the range on screen, one label.
      Absent when the lane's name was not given. */
  name?: string;
  range: string;
  /** The numbers behind `range`: the stretch on screen, or the whole row's
      when nothing of it is (`dim`). */
  own: [number, number];
  /** In a lane with copies, the row's number: its dot carries it, and so
      does its pin on the copy ruler (copyRuler.ts). */
  pin?: number;
  /** The whole row reads the reference on the other strand. */
  reverse: boolean;
  /** The row's contig, written before the range in the glass label: "HG002#1:
      chr17:39,133,235–39,133,757" (the user, 2026-11-15: "put the contig
      back into the glass legend"). */
  contig: string;
}

/** The stretch of a row's own coordinates on screen, lowest first: every
    part holding its bases whose pixels fall inside [fromPx, toPx], a part
    across an edge cut in proportion to the pixels kept. A mark holds its
    bases at one reference place, so it counts when that place is inside.
    On the reference's strand a part's left end is its lowest own
    coordinate; reversed, its right end is, so the cut comes off the
    other end. Null when nothing of the row is inside. A mark on the right
    edge counts, unless `openRight`: a bin's edge belongs to the next bin. */
export function visibleOwn(row: Pick<Row, "parts">, px: (bp: number) => number, fromPx: number, toPx: number, openRight = false): [number, number] | null {
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
      if (x0 >= fromPx && (openRight ? x0 < toPx : x0 <= toPx)) keep(part.own.from, part.own.to);
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

/** How wide a row's pill may be. The longest regions on one line, a long
    contig name with 9-digit coordinates (JBHIIK010000078.1:248,380,000–
    248,456,000, 41 characters), take 254 px; the rest is room for the row's
    number and locator, which come with the copies (PLAN-remastered-2.md
    section 3). */
export const PILL_WIDTH = 330;
/** A pill sits 1 px down in the 14 px strip above its row's bar
    (laneLayout.ts ROW_LABEL_H) and is 13 px tall, so it ends where the
    row's mark band starts and never covers a mark. */
export const PILL_TOP = 1;
export const PILL_H = ROW_LABEL_H - PILL_TOP;

/** The region's lines for a legend of the given width: one line when it
    fits, else two, the contig and the first coordinate over the second;
    else three, a long contig name (CM087320.1, JBHIIK010000078.1) on a
    line of its own. */
export function regionLines(contig: string, from: number, to: number, legendWidth: number): string[] {
  const fits = (text: string) => text.length * CHAR_PX + SIDE_PX <= legendWidth;
  const one = regionText(contig, from, to);
  if (fits(one)) return [one];
  const head = `${contig}:${from.toLocaleString()}`;
  if (fits(head)) return [head, `–${to.toLocaleString()}`];
  return [`${contig}:`, from.toLocaleString(), `–${to.toLocaleString()}`];
}

/** The legend's rows for a lane: one per row of the lane, in the strip
    above the row's bar, saying the stretch of the walk on screen, or the
    whole region dimmed when nothing of the row is. `textWidth` is the
    room the words have: PILL_WIDTH in the glass pills. `tops` are the
    tops of the rows' bars where the lane has more in it than rows
    (laneLayout.ts laneSlots: a lane with copies); `pins` numbers the rows
    of the contigs named. */
export function legendRowsOf(
  rows: ReadonlyArray<Pick<Row, "parts" | "contig" | "ownFrom" | "ownTo"> & { flipped?: boolean }>,
  px: (bp: number) => number,
  fromPx: number,
  toPx: number,
  textWidth: number,
  name?: string,
  tops?: ReadonlyArray<number>,
  pins?: ReadonlySet<string>,
): LegendRow[] {
  return rows.map((row, n) => {
    const seen = visibleOwn(row, px, fromPx, toPx);
    const whole = regionText(row.contig, row.ownFrom, row.ownTo);
    const [from, to] = seen ?? [row.ownFrom, row.ownTo];
    const sameAsWhole = seen && from === row.ownFrom && to === row.ownTo;
    return {
      top: (tops?.[n] ?? rowTop(n)) - ROW_LABEL_H + PILL_TOP,
      lines: regionLines(row.contig, from, to, textWidth),
      title: seen ? (sameAsWhole ? `${whole}: the whole walk is on screen` : `on screen: ${regionText(row.contig, from, to)} of ${whole}`) : `${whole}: nothing of it is on screen`,
      dim: !seen,
      ...(name ? { name } : {}),
      range: `${from.toLocaleString()}–${to.toLocaleString()}`,
      own: [from, to],
      ...(pins?.has(row.contig) ? { pin: n + 1 } : {}),
      reverse: !!row.flipped,
      contig: row.contig,
    };
  });
}
