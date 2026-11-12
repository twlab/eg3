import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Step } from "./alignment";

/* ══════════════════════════════════════════════════════════════════════════
   The drawing on a nested site's card (PLAN-card.md, 2026-11-10): the
   site's readings as rows, instead of words.

   Columns are the reference's nodes between the site's two anchors, with
   room before a column for nodes some reading inserts there. The first row
   is the reference's own reading, straight across; then one row per
   reading, in order of how many haplotypes read it: its reference nodes
   at their columns, its own nodes in the room, white over the reference
   it skips. A row is laid out by the pointer's rules 1 and 3 (a node the
   reference reads at or after the pointer anchors; any other is pending),
   the same rule as the merge stepper in claude-memory/diagrams. Columns
   every reading passes alike fold into one "…" column. A box shows its
   node's bases, or its id, on a switch; the count of haplotypes reading
   the row stands at its right. This walk's row is outlined, and the
   nested part of it - where it differs from the reference - is shaded.
   ══════════════════════════════════════════════════════════════════════════ */

export interface SiteRow {
  key: string;
  /** The nodes between the anchors, in the order read; none for a
      deletion. */
  nodes: Step[];
  /** Haplotypes reading it. */
  count: number;
  /** This walk's own reading. */
  mine: boolean;
  commonest: boolean;
  /** The reference's own reading. */
  ref: boolean;
}

export interface SiteDrawingData {
  /** The reference's steps strictly between the anchors. */
  refNodes: Step[];
  anchors: [Step, Step];
  /** The reference row first, then the readings by count. */
  rows: SiteRow[];
  /** Haplotypes counted at the site. */
  total: number;
  /** Haplotypes reaching only one of the two anchors: not rows. */
  partial: number;
  /** A node's bases on the reference's strand; null where the band does
      not have them. */
  seqOf: (step: Step) => string | null;
  /** The card's width, for the choice between bases and nodes. */
  maxWidth: number;
}

type Mode = "bases" | "nodes";

/** A row's pieces on the reference columns, by the pointer's rules 1 and
    3: an anchor at a column, or a bubble - the pending nodes before the
    next anchor, over the columns [from, to) it skips. */
type Piece = { kind: "anchor"; k: number; step: Step } | { kind: "bubble"; from: number; to: number; pending: Step[] };

export function layOutRow(refNodes: Step[], nodes: Step[]): Piece[] {
  const pieces: Piece[] = [];
  let p = 0;
  let pending: Step[] = [];
  for (const step of nodes) {
    let k = -1;
    for (let t = p; t < refNodes.length; t++) {
      if (refNodes[t].id === step.id && refNodes[t].reverse === step.reverse) {
        k = t;
        break;
      }
    }
    if (k < 0) {
      pending.push(step);
      continue;
    }
    if (pending.length || k > p) pieces.push({ kind: "bubble", from: p, to: k, pending });
    pieces.push({ kind: "anchor", k, step });
    p = k + 1;
    pending = [];
  }
  if (pending.length || p < refNodes.length) pieces.push({ kind: "bubble", from: p, to: refNodes.length, pending });
  return pieces;
}

/** How many rows show before "show all". */
const SHOWN = 4;
const ROW_H = 22;
const BOX_H = 16;
const ANCHOR_W = 34;
const LABEL_W = 64;
const COUNT_W = 54;
const PX_PER_BASE = 7;
const NODE_W = 36;
const FOLD_W = 28;
/** Columns every reading passes alike fold when a run is this long. */
const FOLD_MIN = 3;

interface Column {
  /** The reference steps it stands for: one, or a folded run. */
  steps: Step[];
  /** Its first step's index among the reference nodes. */
  k: number;
  folded: boolean;
  width: number;
  x: number;
}

/** The short form of a node's id: its last three digits. */
const shortId = (step: Step) => `…${step.id.slice(-3)}${step.reverse ? "−" : ""}`;

export function SiteDrawing({ data, kept }: { data: SiteDrawingData; kept: boolean }): ReactNode {
  const { refNodes, rows, seqOf } = data;
  /* The columns: the reference's nodes between the anchors; at an
     insertion site, where the reference has none, the commonest reading's
     nodes instead, so readings that share nodes line up (the user: "the
     letters dont look aligned"). A node is drawn as the reference's only
     when the reference reads it. */
  const axis = useMemo(() => (refNodes.length ? refNodes : (rows.find((row) => row.commonest)?.nodes ?? [])), [refNodes, rows]);
  const refIds = useMemo(() => new Set(refNodes.map((step) => step.id)), [refNodes]);
  const laid = useMemo(() => rows.map((row) => (row.ref ? null : layOutRow(axis, row.nodes))), [axis, rows]);
  /* Bases can be shown only where every node drawn has them. */
  const canBases = useMemo(() => rows.every((row) => row.nodes.every((step) => seqOf(step) !== null)), [rows, seqOf]);
  const basesOf = (step: Step) => seqOf(step) ?? "";
  const boxWidth = (mode: Mode, step: Step) => (mode === "bases" ? Math.max(14, basesOf(step).length * PX_PER_BASE + 6) : NODE_W);

  /* The columns and the room before each, for a mode. */
  const layout = (mode: Mode) => {
    const runWidth = (steps: Step[]) => steps.reduce((w, step) => w + boxWidth(mode, step) + 2, 0);
    /* The room before column k: the widest pending run ending there,
       beyond the reference columns it replaces. */
    const slot = new Array(axis.length + 1).fill(0);
    for (const pieces of laid) {
      if (!pieces) continue;
      for (const piece of pieces) {
        if (piece.kind !== "bubble") continue;
        const have = runWidth(axis.slice(piece.from, piece.to));
        slot[piece.to] = Math.max(slot[piece.to], runWidth(piece.pending) - have);
      }
    }
    /* A column every reading anchors (or skips with the whole site, as
       a deletion does), with no room before it, is the same in every
       reading: runs of them fold. */
    const alike = axis.map((_, k) =>
      laid.every((pieces, i) => !pieces || rows[i].nodes.length === 0 || pieces.some((piece) => piece.kind === "anchor" && piece.k === k)) && !slot[k],
    );
    const columns: Column[] = [];
    let k = 0;
    while (k < axis.length) {
      let end = k;
      while (end < axis.length && alike[end] && (end === k || !slot[end])) end += 1;
      if (end - k >= FOLD_MIN) {
        columns.push({ steps: axis.slice(k, end), k, folded: true, width: FOLD_W, x: 0 });
        k = end;
      } else {
        columns.push({ steps: [axis[k]], k, folded: false, width: boxWidth(mode, axis[k]), x: 0 });
        k += 1;
      }
    }
    const x0 = LABEL_W + ANCHOR_W + 6;
    let x = x0;
    const colX: number[] = new Array(axis.length).fill(0);
    for (const column of columns) {
      x += slot[column.k];
      column.x = x;
      for (let j = 0; j < column.steps.length; j++) colX[column.k + j] = x;
      x += column.width + 2;
    }
    const xEnd = x + slot[axis.length];
    const width = xEnd + ANCHOR_W + 8 + COUNT_W;
    /** The column holding reference node k, and where it ends. */
    const colOf = (kk: number) => columns.find((column) => kk >= column.k && kk < column.k + column.steps.length)!;
    const endOf = (kk: number) => {
      const column = colOf(kk);
      return column.x + column.width + 2;
    };
    return { columns, slot, colX, xEnd, width, runWidth, colOf, endOf };
  };
  const basesLayout = useMemo(() => layout("bases"), [laid, canBases, data.maxWidth]);
  const nodesLayout = useMemo(() => layout("nodes"), [laid]);
  const [mode, setMode] = useState<Mode>(canBases && basesLayout.width <= data.maxWidth ? "bases" : "nodes");
  const [showAll, setShowAll] = useState(false);
  const L = mode === "bases" ? basesLayout : nodesLayout;

  /* The rows shown: the reference's, the first few readings, and this
     walk's. */
  const shown = rows.filter((row, i) => showAll || row.ref || row.mine || i <= SHOWN);
  const hidden = rows.length - shown.length;

  const label = (step: Step) => (mode === "bases" ? basesOf(step) : shortId(step));
  const title = (step: Step) => `node ${step.id}${step.reverse ? " (other strand)" : ""} · ${basesOf(step) || "bases not sent"}${basesOf(step) ? ` (${basesOf(step).length} bp)` : ""}`;
  /* A node the reference reads is drawn as the reference draws it, white
     on blue-grey, in every row; a reading's own node orange with dark
     text. */
  const box = (x: number, y: number, w: number, step: Step, cls: "pgv-site-refnode" | "pgv-site-ownnode") => (
    <g key={`${x}:${step.id}`}>
      <rect x={x} y={y} width={w} height={BOX_H} rx={3} className={cls}>
        <title>{title(step)}</title>
      </rect>
      <text x={x + w / 2} y={y + 12} className={cls === "pgv-site-refnode" ? "pgv-site-refink" : "pgv-site-ink"}>
        {label(step)}
      </text>
    </g>
  );
  const white = (x1: number, x2: number, y: number) => (x2 - x1 > 2 ? <rect key={`w${x1}`} x={x1} y={y + 5} width={x2 - x1 - 2} height={6} className="pgv-site-white" /> : null);

  /* Each row's boxes on the layout - a reference column's node, or an own
     node, with its x-range - and its white stretches. Worked out for every
     row, hidden ones too, since all of them count below. */
  type Box = { x: number; w: number; step: Step; own: boolean; folded?: Column };
  const geometryOf = (row: SiteRow): { boxes: Box[]; whites: Array<[number, number]> } => {
    const boxes: Box[] = [];
    const whites: Array<[number, number]> = [];
    const pieces = laid[rows.indexOf(row)];
    if (row.ref) {
      /* At an insertion site the reference has nothing between the anchors. */
      if (!refNodes.length) {
        if (axis.length) whites.push([L.colX[0] - L.slot[0], L.xEnd]);
        return { boxes, whites };
      }
      for (const column of L.columns) boxes.push({ x: column.x, w: column.width, step: column.steps[0], own: false, folded: column.folded ? column : undefined });
      return { boxes, whites };
    }
    if (!row.nodes.length) {
      whites.push([L.colX[0] - L.slot[0], L.xEnd]);
      return { boxes, whites };
    }
    for (const piece of pieces ?? []) {
      if (piece.kind === "anchor") {
        const column = L.colOf(piece.k);
        if (column.folded) {
          if (piece.k === column.k) boxes.push({ x: column.x, w: column.width, step: column.steps[0], own: !refIds.has(column.steps[0].id), folded: column });
        } else boxes.push({ x: column.x, w: column.width, step: piece.step, own: !refIds.has(piece.step.id) });
        continue;
      }
      /* A bubble: its own nodes end where the next column starts. Nodes
         standing in for reference nodes stretch over the whole room of the
         columns they replace (the user: one node of two bases in place of
         two nodes of a base each is the same size as those two), so white
         is left only where the reading has nothing there: a deletion.
         Nodes inserted before a column keep their own width. */
      const to = piece.to < axis.length ? L.colX[piece.to] : L.xEnd;
      const replaces = piece.to > piece.from;
      const roomFrom = replaces ? L.colX[piece.from] : to - L.runWidth(piece.pending);
      if (!piece.pending.length) {
        whites.push([roomFrom, to]);
        continue;
      }
      const widths = piece.pending.map((step) => boxWidth(mode, step));
      const natural = widths.reduce((n, w) => n + w, 0);
      const forBoxes = Math.max(natural, to - roomFrom - 2 * piece.pending.length);
      let x = roomFrom;
      piece.pending.forEach((step, j) => {
        const w = replaces ? (forBoxes * widths[j]) / natural : widths[j];
        boxes.push({ x, w, step, own: !refIds.has(step.id) });
        x += w + 2;
      });
    }
    return { boxes, whites };
  };
  const geometry = useMemo(() => rows.map(geometryOf), [rows, L, mode]);
  const readings = rows.filter((row) => row.count > 0).length;
  const header = 14;
  const footer = 16 + (data.partial ? 14 : 0);
  const height = header + shown.length * ROW_H + footer;
  const basesWidth = basesLayout.width;
  const nodesWidth = nodesLayout.width;
  return (
    <div className="pgv-site">
      <div className="pgv-site-bar">
        {kept ? (
          <>
            <button type="button" className={`pgv-site-switch${mode === "bases" ? " pgv-site-on" : ""}`} disabled={!canBases} title={canBases ? undefined : "some bases were not sent"} onClick={() => setMode("bases")}>
              bases
            </button>
            <button type="button" className={`pgv-site-switch${mode === "nodes" ? " pgv-site-on" : ""}`} onClick={() => setMode("nodes")}>
              nodes
            </button>
          </>
        ) : (
          <span className="pgv-site-note">{mode === "bases" ? "bases" : "nodes"}: click the mark to switch</span>
        )}
        {/* How many ways the haplotypes read the site: the readings some
            haplotype has, the reference's own among them when any reads
            it straight (its row stands at ×0 when none does). */}
        <span className="pgv-site-note">{readings} reading{readings === 1 ? "" : "s"}</span>
        {mode === "bases" && basesWidth > data.maxWidth && <span className="pgv-site-note">scrolls sideways</span>}
        {mode === "nodes" && nodesWidth > data.maxWidth && <span className="pgv-site-note">scrolls sideways</span>}
      </div>
      <div className="pgv-site-scroll">
        <svg width={L.width} height={height} viewBox={`0 0 ${L.width} ${height}`} className="pgv-site-svg" data-mode={mode}>
          <text x={L.width - 4} y={10} className="pgv-site-count-head">
            haplotypes
          </text>
          {shown.map((row, i) => {
            const y = header + i * ROW_H + 3;
            const g = geometry[rows.indexOf(row)];
            const parts: ReactNode[] = [];
            for (const b of g.boxes) {
              if (b.folded) {
                parts.push(
                  <g key={`f${b.x}`}>
                    <rect x={b.x} y={y} width={b.w} height={BOX_H} rx={3} className={b.own ? "pgv-site-ownnode" : "pgv-site-refnode"}>
                      <title>{`${b.folded.steps.length} nodes, ${b.folded.steps.reduce((n, s) => n + basesOf(s).length, 0)} bp, the same in every reading`}</title>
                    </rect>
                    <text x={b.x + b.w / 2} y={y + 12} className={b.own ? "pgv-site-ink" : "pgv-site-refink"}>
                      …
                    </text>
                  </g>,
                );
              } else parts.push(box(b.x, y, b.w, b.step, b.own ? "pgv-site-ownnode" : "pgv-site-refnode"));
            }
            for (const [x1, x2] of g.whites) parts.push(white(x1, x2, y));
            const countX = L.width - 4;
            /* Rows run by count, so the commonest is the first reading and
               needs no mark; it gets one only if it ever stands elsewhere. */
            const starred = row.commonest && rows.indexOf(row) !== 1;
            return (
              <g key={row.key} className={`pgv-site-row${row.mine ? " pgv-site-mine" : ""}`} data-row="" data-nodes={row.nodes.map((s) => `${s.id}${s.reverse ? "-" : ""}`).join(" ")} data-count={row.count} data-ref={row.ref ? "" : undefined} data-mine={row.mine ? "" : undefined} data-commonest={row.commonest ? "" : undefined}>
                {row.mine && <rect x={1} y={y - 3} width={L.width - 2} height={ROW_H - 1} rx={4} className="pgv-site-mine-fill" />}
                <text x={4} y={y + 12} className={`pgv-site-who${row.mine ? " pgv-site-who-mine" : ""}`}>
                  {row.ref ? "reference" : row.mine ? "this walk" : ""}
                </text>
                <rect x={LABEL_W} y={y} width={ANCHOR_W} height={BOX_H} rx={3} className="pgv-site-anchor">
                  <title>{`anchor: node ${data.anchors[0].id}`}</title>
                </rect>
                <text x={LABEL_W + ANCHOR_W / 2} y={y + 12} className="pgv-site-anchor-ink">
                  {shortId(data.anchors[0])}
                </text>
                {parts}
                <rect x={L.xEnd} y={y} width={ANCHOR_W} height={BOX_H} rx={3} className="pgv-site-anchor">
                  <title>{`anchor: node ${data.anchors[1].id}`}</title>
                </rect>
                <text x={L.xEnd + ANCHOR_W / 2} y={y + 12} className="pgv-site-anchor-ink">
                  {shortId(data.anchors[1])}
                </text>
                <text x={countX - (starred ? 12 : 0)} y={y + 12} className={`pgv-site-count${row.mine ? " pgv-site-count-strong" : ""}`}>
                  ×{row.count.toLocaleString()}
                </text>
                {starred && (
                  <text x={countX} y={y + 12} className="pgv-site-star">
                    <title>the commonest reading</title>★
                  </text>
                )}
                {row.mine && <rect x={1} y={y - 3} width={L.width - 2} height={ROW_H - 1} rx={4} className="pgv-site-mine-edge" />}
              </g>
            );
          })}
          <text x={L.width - 4} y={header + shown.length * ROW_H + 11} className="pgv-site-count-head">
            of {data.total.toLocaleString()}
          </text>
          {data.partial > 0 && (
            <text x={L.width - 4} y={header + shown.length * ROW_H + 25} className="pgv-site-count-head">
              ×{data.partial.toLocaleString()} reach only one anchor: not counted
            </text>
          )}
        </svg>
      </div>
      {hidden > 0 && (
        <div className="pgv-site-bar">
          {kept ? (
            <button type="button" className="pgv-site-switch" onClick={() => setShowAll(true)}>
              show all {rows.length - 1} readings
            </button>
          ) : (
            <span className="pgv-site-note">{hidden} more readings: click the mark to see all</span>
          )}
        </div>
      )}
    </div>
  );
}
