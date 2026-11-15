import type { PlacedPart, RowBubble } from "./rowAlign";

/* ══════════════════════════════════════════════════════════════════════════
   A stretch read on the other strand, as the card shows it: the reference
   forward, the stretch flipped under it, column by column.

   The bars never flip anything (claude-memory/PLAN-remastered-2.md section
   4, the user, 2026-11-14): a stretch a walk reads on the other strand - an
   inverted run inside a row, or a whole reverse pass - is one block there,
   in the walk's own order. The flip lives here only. rowAlign.ts has
   already placed the run's steps, read back to front with every strand
   flipped, as a forward walk over the reference the run covers: the run is
   one `inverted` part, and the parts inside it are flagged `inverted`.
   Those parts, in the reference's order, are the card's segments.

   A column is a base of either row. A match, a mismatch and a replacement
   take their bases' columns on both rows; a white (reference the stretch
   skips) takes its reference bases' columns with none of the haplotype's;
   a mark (bases with no room on the reference) takes its own bases'
   columns with none of the reference's, before whatever starts at its
   place. So the card has room for what the bar has none for.
   ══════════════════════════════════════════════════════════════════════════ */

export type AlignKind = "match" | "mismatch" | "replaced" | "white" | "mark" | "none";

export interface AlignSeg {
  kind: AlignKind;
  /** Its first column, and one past its last. */
  c0: number;
  c1: number;
  /** The reference it stands on; a mark's is empty, at its place. */
  ref: number;
  refLen: number;
  /** Each row's bases, a column each; empty where the row has none. */
  refSeq: string;
  hapSeq: string;
  /** Its bases in the haplotype's own coordinates, lowest first: they fall
      along the columns, the stretch being read backward. Null for a white. */
  own: { from: number; to: number } | null;
  nodes: string[];
  /** Its bubble among the row's, null for a node both read. */
  bubble: number | null;
}

/** What differs inside the stretch, by bubble. */
export interface AlignCounts {
  snv: number;
  mnv: number;
  deletion: number;
  insertion: number;
  delins: number;
}

export interface ReverseAlignment {
  /** The reference the stretch covers. */
  ref: [number, number];
  /** Its own range, lowest first; read from `to` down to `from`. */
  own: { from: number; to: number } | null;
  cols: number;
  segs: AlignSeg[];
  counts: AlignCounts;
}

const INSIDE = new Set<PlacedPart["kind"]>(["match", "mismatch", "replaced", "white", "mark"]);

/**
 * The card's columns for one run of a row. `refSeq(from, to)` gives the
 * reference's bases over a stretch of the band.
 */
export function reverseAlignment(
  row: { parts: PlacedPart[]; bubbles: RowBubble[] },
  run: PlacedPart,
  refSeq: (from: number, to: number) => string,
): ReverseAlignment {
  const from = run.ref;
  const to = run.ref + run.len;
  const inside = row.parts
    .filter((part) => part.inverted && INSIDE.has(part.kind) && part.ref >= from && part.ref + (part.kind === "mark" ? 0 : part.len) <= to)
    /* A mark before whatever starts at its base. */
    .sort((a, b) => a.ref - b.ref || Number(b.kind === "mark") - Number(a.kind === "mark"));
  const segs: AlignSeg[] = [];
  let cols = 0;
  let at = from;
  const push = (seg: Omit<AlignSeg, "c0" | "c1">) => {
    const width = Math.max(seg.refSeq.length, seg.hapSeq.length);
    if (width <= 0) return;
    segs.push({ ...seg, c0: cols, c1: cols + width });
    cols += width;
  };
  /* Reference of the run no part stands on: nothing is claimed of it. */
  const unplaced = (until: number) => {
    if (until > at) push({ kind: "none", ref: at, refLen: until - at, refSeq: refSeq(at, until), hapSeq: "", own: null, nodes: [], bubble: null });
  };
  for (const part of inside) {
    const own = part.own ? { from: part.own.from, to: part.own.to } : null;
    if (part.kind === "mark") {
      unplaced(part.ref);
      at = Math.max(at, part.ref);
      push({ kind: "mark", ref: part.ref, refLen: 0, refSeq: "", hapSeq: part.seq ?? "", own, nodes: part.nodes, bubble: part.bubble });
      continue;
    }
    unplaced(part.ref);
    const bases = refSeq(part.ref, part.ref + part.len);
    push({
      kind: part.kind as AlignKind,
      ref: part.ref,
      refLen: part.len,
      refSeq: bases,
      hapSeq: part.kind === "white" ? "" : part.kind === "match" ? bases : (part.seq ?? ""),
      own,
      nodes: part.nodes,
      bubble: part.bubble,
    });
    at = Math.max(at, part.ref + part.len);
  }
  unplaced(to);

  const counts: AlignCounts = { snv: 0, mnv: 0, deletion: 0, insertion: 0, delins: 0 };
  const seen = new Set<number>();
  for (const seg of segs) {
    if (seg.bubble === null || seg.kind === "match" || seen.has(seg.bubble)) continue;
    seen.add(seg.bubble);
    const bubble = row.bubbles[seg.bubble];
    if (!bubble) continue;
    if (bubble.cls === "deletion") counts.deletion += 1;
    else if (bubble.cls === "insertion") counts.insertion += 1;
    else if (bubble.cls === "substitution") counts[bubble.aligned && bubble.aligned.hapMiddle > 1 ? "mnv" : "snv"] += 1;
    else counts.delins += 1;
  }
  return { ref: [from, to], own: run.own ? { from: run.own.from, to: run.own.to } : null, cols, segs, counts };
}

/** The segment standing on a reference base: never a mark, which takes no
    room there. -1 outside the stretch. */
export function segAt(alignment: ReverseAlignment, bp: number): number {
  const { segs } = alignment;
  let lo = 0;
  let hi = segs.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (segs[mid].ref + segs[mid].refLen > bp) hi = mid;
    else lo = mid + 1;
  }
  return lo < segs.length && segs[lo].ref <= bp ? lo : -1;
}

/** The first segment reaching past a column. */
export function segAtColumn(alignment: ReverseAlignment, column: number): number {
  const { segs } = alignment;
  let lo = 0;
  let hi = segs.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (segs[mid].c1 > column) hi = mid;
    else lo = mid + 1;
  }
  return Math.min(lo, segs.length - 1);
}

/** The own coordinate of the haplotype's base in a segment's k-th column:
    the stretch is read backward, so they fall. */
export const ownAtColumn = (seg: AlignSeg, k: number): number | null => (seg.own && k < seg.hapSeq.length ? seg.own.to - 1 - k : null);
