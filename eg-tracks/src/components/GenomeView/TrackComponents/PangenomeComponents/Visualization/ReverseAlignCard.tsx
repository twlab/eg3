import { useCallback, useLayoutEffect, useRef } from "react";
import type { ReverseAlignment } from "./reverseAlign";
import { ownAtColumn, segAtColumn } from "./reverseAlign";
import { REF_INK, LINE_INK } from "./refBarRule";

/* ══════════════════════════════════════════════════════════════════════════
   The alignment a block's card shows: the reference forward, the stretch
   read on the other strand flipped under it (reverseAlign.ts).

   One view: nodes with their bases inside, as the reference bar draws its
   own. The reference's row is the bar's slate; the haplotype's is its own
   colour, a mismatch a black chip with its letter, a deletion white, an
   insertion marked in the marks' orange, a replacement hatched. The
   reference's coordinates rise above; the haplotype's own fall below,
   because the stretch is read backward. The segment the card is about is
   picked out on both rows.

   On the hover card it is centred on the base under the pointer, marked
   by a caret, and follows it. On the card a click kept it scrolls sideways over the whole
   stretch. Painted on a canvas, only the columns in sight: a stretch can
   be a hundred thousand columns long.
   ══════════════════════════════════════════════════════════════════════════ */

export interface ReverseAlignProps {
  data: ReverseAlignment;
  /** The segment the card is about, as an index into the data's. */
  focus: number;
  /** The column under the pointer: the canvas is centred on it and marks
      it. Without it, on the segment's middle. */
  at?: number;
  /** The haplotype's colour. */
  color: string;
  refName: string;
  hapName: string;
  /** On the kept card: it scrolls. */
  kept?: boolean;
}

/** A column, the canvas and its rows, in CSS pixels. */
const COLUMN = 11;
const WIDTH = 528;
const HEIGHT = 112;
const Y_AXIS = 13;
const Y_REF = 22;
const ROW = 24;
const Y_HAP = 54;
const Y_OWN = 96;
/** A coordinate is written every this many bases, where it fits whole. */
const LABEL_EVERY = 20;
const LABEL_HALF = 34;
const CHIP_INK = "#000000";
const LETTER_INK = "#1d2430";
const MARK_INK = "#c2410c";
const HATCH_INK = "#fffff0";
const AXIS_INK = "#4b5563";
const TICK_INK = "#6b7280";
const FOCUS_BAND = "#fde68a";
const FOCUS_INK = "#111827";
const MONO = '600 11px ui-monospace, "SFMono-Regular", Consolas, monospace';
const SANS = '10.5px system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where to scroll so the pointer's column is the canvas's middle; with
    no column, the segment's middle. */
const centredOn = (data: ReverseAlignment, focus: number, at?: number): number => {
  const seg = data.segs[focus];
  const all = data.cols * COLUMN;
  if (all <= WIDTH || (!seg && at === undefined)) return 0;
  const middle = at !== undefined ? at + 0.5 : (seg.c0 + seg.c1) / 2;
  return Math.max(0, Math.min(all - WIDTH, middle * COLUMN - WIDTH / 2));
};

function paint(canvas: HTMLCanvasElement, { data, focus, color, at }: ReverseAlignProps, scrollLeft: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const pw = Math.round(WIDTH * dpr);
  const ph = Math.round(HEIGHT * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  if (!data.segs.length) return;
  const x = (column: number) => column * COLUMN - scrollLeft;
  const firstColumn = Math.max(0, Math.floor(scrollLeft / COLUMN));
  const lastColumn = Math.min(data.cols, Math.ceil((scrollLeft + WIDTH) / COLUMN) + 1);
  const picked = data.segs[focus] ?? null;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 1;

  /* The segment the card is about: a band behind both rows. */
  if (picked) {
    ctx.fillStyle = FOCUS_BAND;
    ctx.fillRect(x(picked.c0) - 2, Y_REF - 5, (picked.c1 - picked.c0) * COLUMN + 4, Y_HAP + ROW + 5 - (Y_REF - 5));
  }

  for (let s = segAtColumn(data, firstColumn); s < data.segs.length && data.segs[s].c0 < lastColumn; s++) {
    const seg = data.segs[s];
    const from = Math.max(seg.c0, firstColumn);
    const to = Math.min(seg.c1, lastColumn);
    for (let column = from; column < to; column++) {
      const k = column - seg.c0;
      const left = x(column);
      const middle = left + COLUMN / 2;
      const refBase = seg.refSeq.charAt(k);
      const hapBase = seg.hapSeq.charAt(k);

      /* The reference's row: its nodes in the bar's slate, a base each. */
      if (refBase) {
        ctx.fillStyle = REF_INK;
        ctx.fillRect(left, Y_REF, COLUMN, ROW);
        ctx.fillStyle = "#ffffff";
        ctx.font = MONO;
        ctx.fillText(refBase, middle, Y_REF + ROW / 2 + 0.5);
      } else {
        /* Bases the reference has no room for. */
        ctx.strokeStyle = TICK_INK;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(left, Y_REF + ROW / 2);
        ctx.lineTo(left + COLUMN, Y_REF + ROW / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      /* The haplotype's row, flipped. */
      if (hapBase) {
        ctx.fillStyle = seg.kind === "mismatch" ? CHIP_INK : color;
        ctx.fillRect(left, Y_HAP, COLUMN, ROW);
        if (seg.kind === "replaced") {
          ctx.save();
          ctx.beginPath();
          ctx.rect(left, Y_HAP, COLUMN, ROW);
          ctx.clip();
          ctx.strokeStyle = HATCH_INK;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let d = -ROW; d < COLUMN + ROW; d += 6) {
            ctx.moveTo(left + d, Y_HAP + ROW);
            ctx.lineTo(left + d + ROW, Y_HAP);
          }
          ctx.stroke();
          ctx.restore();
          ctx.lineWidth = 1;
        }
        if (seg.kind === "mark") {
          ctx.fillStyle = MARK_INK;
          ctx.fillRect(left, Y_HAP - 4, COLUMN, 4);
          ctx.strokeStyle = MARK_INK;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(left + 0.75, Y_HAP + 0.75, COLUMN - 1.5, ROW - 1.5);
          ctx.lineWidth = 1;
        }
        ctx.fillStyle = seg.kind === "mismatch" ? "#ffffff" : LETTER_INK;
        ctx.font = MONO;
        ctx.fillText(hapBase, middle, Y_HAP + ROW / 2 + 0.5);
      } else if (seg.kind === "white") {
        /* Reference the stretch skips: white, a line through it. */
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(left, Y_HAP, COLUMN, ROW);
        ctx.strokeStyle = TICK_INK;
        ctx.beginPath();
        ctx.moveTo(left, Y_HAP + ROW / 2);
        ctx.lineTo(left + COLUMN, Y_HAP + ROW / 2);
        ctx.stroke();
      }

      /* A segment's first column: the node's border on both rows. */
      if (k === 0) {
        ctx.strokeStyle = LINE_INK;
        ctx.beginPath();
        ctx.moveTo(left + 0.5, Y_REF);
        ctx.lineTo(left + 0.5, Y_REF + ROW);
        ctx.stroke();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
        ctx.beginPath();
        ctx.moveTo(left + 0.5, Y_HAP);
        ctx.lineTo(left + 0.5, Y_HAP + ROW);
        ctx.stroke();
      }

      /* The coordinates: the reference's above, the haplotype's own below. */
      if (middle > LABEL_HALF && middle < WIDTH - LABEL_HALF) {
        ctx.font = SANS;
        ctx.fillStyle = AXIS_INK;
        ctx.strokeStyle = TICK_INK;
        const refAt = seg.ref + k;
        if (refBase && refAt % LABEL_EVERY === 0) {
          ctx.fillText(refAt.toLocaleString(), middle, Y_AXIS - 4);
          ctx.beginPath();
          ctx.moveTo(middle, Y_AXIS + 4);
          ctx.lineTo(middle, Y_REF);
          ctx.stroke();
        }
        const ownAt = ownAtColumn(seg, k);
        if (ownAt !== null && ownAt % LABEL_EVERY === 0) {
          ctx.fillText(ownAt.toLocaleString(), middle, Y_OWN + 6);
          ctx.beginPath();
          ctx.moveTo(middle, Y_HAP + ROW);
          ctx.lineTo(middle, Y_OWN - 3);
          ctx.stroke();
        }
      }
    }
  }

  if (picked) {
    ctx.strokeStyle = FOCUS_INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(x(picked.c0), Y_REF - 1, (picked.c1 - picked.c0) * COLUMN, ROW + 2);
    ctx.strokeRect(x(picked.c0), Y_HAP - 1, (picked.c1 - picked.c0) * COLUMN, ROW + 2);
    ctx.lineWidth = 1;
  }

  /* The base under the pointer: a caret over its column, between the rows. */
  if (at !== undefined) {
    const middle = x(at) + COLUMN / 2;
    ctx.fillStyle = FOCUS_INK;
    ctx.beginPath();
    ctx.moveTo(middle - 4, Y_REF + ROW + 1);
    ctx.lineTo(middle + 4, Y_REF + ROW + 1);
    ctx.lineTo(middle, Y_HAP - 1);
    ctx.closePath();
    ctx.fill();
  }
}

export function ReverseAlign(props: ReverseAlignProps) {
  const { data, focus, refName, hapName, kept = false } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const repaint = useCallback(() => {
    if (!canvas.current) return;
    const now = latest.current;
    paint(canvas.current, now, now.kept ? (scroller.current?.scrollLeft ?? 0) : centredOn(now.data, now.focus, now.at));
  }, []);

  /* Centred on the segment it is about: every time on the hover card,
     which follows the pointer; once on the kept card, which then scrolls. */
  useLayoutEffect(() => {
    if (kept && scroller.current) scroller.current.scrollLeft = centredOn(data, focus, props.at);
    repaint();
  }, [data, focus, props.at, kept, props.color, repaint]);

  return (
    <div className="pgv-ralign">
      <div className="pgv-ralign-tags" style={{ height: HEIGHT }}>
        <div className="pgv-ralign-tag" style={{ top: Y_REF, height: ROW }}>
          <b>{refName}</b>
          <span>forward</span>
        </div>
        <div className="pgv-ralign-tag" style={{ top: Y_HAP, height: ROW }}>
          <b>{hapName}</b>
          <span>flipped</span>
        </div>
      </div>
      <div ref={scroller} className={`pgv-ralign-scroll${kept ? " pgv-ralign-kept" : ""}`} style={{ width: WIDTH }} onScroll={kept ? repaint : undefined}>
        <canvas ref={canvas} className="pgv-ralign-canvas" style={{ width: WIDTH, height: HEIGHT }} />
        {kept && <div style={{ width: data.cols * COLUMN, height: 1 }} />}
      </div>
    </div>
  );
}

/** How wide a card holding the alignment is let be. */
export const REVERSE_ALIGN_CARD_WIDTH = WIDTH + 120;
