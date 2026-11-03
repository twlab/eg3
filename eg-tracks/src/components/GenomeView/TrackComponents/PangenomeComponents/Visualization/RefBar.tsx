import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { LinearModel } from "./linearModel";
import type { LinearAxis } from "./linearAxis";
import { fitCanvas, useScreenSize } from "./canvasScreen";
import type { FittedCanvas } from "./canvasScreen";
import { CardBody, HoverCard, cardKeptOpen, cardSequence } from "./Cards";
import type { CardContent, CardItem, HoverCardHandle } from "./Cards";
import FloatingCard from "./FloatingCard";
import { GRAPH_ROW_H } from "./laneLayout";
import { binBpAt } from "./bins";
import { RATE_MIN_BP } from "./barTiers";
import { reverseComplement } from "./alignment";
import {
  BREAKS_PER_KB,
  LINE_INK,
  REF_INK,
  STRIPE_INKS,
  STRIPE_OF_BAR,
  breakClass,
  breaksOf,
  refBarOf,
  refBases,
  refStepAt,
  refStepsIn,
} from "./refBarRule";
import type { RefBarDrawing } from "./refBarRule";

/* ══════════════════════════════════════════════════════════════════════════
   The ref bar: the reference's own row in the linear view, painted from
   refBarRule.ts's rule (PLAN-zoomed-out.md, section 7). One canvas the band's
   width, GRAPH_ROW_H tall, in the graph's own track row: the slate bar,
   the stripes, the lines, the letters, in that order. A hover shows a
   card and a click keeps it: a node's at a pixel a base or more, the
   hover bin's under it, as the bars' cards go (LinearView.tsx).
   ══════════════════════════════════════════════════════════════════════════ */

/** Under a pixel a base a hover reads the bin round the pointer, the
    smallest grid bin at least this wide (as the bars'). */
const HOVER_BIN_PX = 16;
/** A bin's card lists its nodes while there are this many or fewer. */
const LIST_NODES = 20;
const MONO_STACK = 'ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace';
const LETTER_INK = "#ffffff";
const LETTER_SAMPLE = "ACGTN";
const INK_PROBE_SIZE = 100;
/** The shades' words, by class (refBarRule.ts's BREAKS_PER_KB). */
export const SHADE_WORDS: readonly string[] = [`under ${BREAKS_PER_KB[0]}`, `${BREAKS_PER_KB[0]}–${BREAKS_PER_KB[1]}`, `${BREAKS_PER_KB[1]}–${BREAKS_PER_KB[2]}`, `${BREAKS_PER_KB[2]} or more`];

interface RefBarProps {
  /** The band's whole model: the reference walk the bar is drawn from,
      and every lane, for which rows read a node. */
  model: LinearModel;
  axis: LinearAxis;
  /** Moves the view to [start, end) of the reference's contig: what a bin
      card's "Zoom in here" does. Without it the card has no such button. */
  onZoomTo?: (start: number, end: number, contig?: string) => void;
}

interface Box {
  x: number;
  width: number;
}

interface KeptCard extends CardContent {
  x: number;
  y: number;
  box: Box;
}

const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;
const refCoord = (text: string) => <span className="pgv-coord-ref">{text}</span>;
const coordLabel = (text: string) => <span className="pgv-coord-label">{text}</span>;

/** The bar painted at the screen's pixels. */
function paintRefBar(fitted: FittedCanvas, drawing: RefBarDrawing, model: LinearModel, axis: LinearAxis, width: number) {
  const { ctx, pw, ph, sx, sy } = fitted;
  const X = (bp: number) => Math.round(axis.px(bp) * sx);
  ctx.clearRect(0, 0, pw, ph);
  const from = Math.max(0, X(drawing.origin));
  const to = Math.min(pw, X(drawing.end));
  if (to <= from) return;
  ctx.fillStyle = REF_INK;
  ctx.fillRect(from, 0, to - from, ph);

  /* The stripes, in the middle half. */
  const top = Math.round(ph * STRIPE_OF_BAR[0]);
  const bottom = Math.round(ph * STRIPE_OF_BAR[1]);
  for (const stripe of drawing.stripes) {
    const a = Math.max(0, X(stripe.from));
    const b = Math.min(pw, Math.max(a + 1, X(stripe.to)));
    if (b <= a) continue;
    ctx.fillStyle = STRIPE_INKS[stripe.cls];
    ctx.fillRect(a, top, b - a, bottom - top);
  }

  /* The lines, a CSS pixel wide. */
  ctx.fillStyle = LINE_INK;
  const lineW = Math.max(1, Math.round(sx));
  for (const at of drawing.lines) {
    const x = X(at);
    if (x < 0 || x >= pw) continue;
    ctx.fillRect(x, 0, lineW, ph);
  }

  /* The letters, each centred on its base, as the bars draw theirs. */
  if (!drawing.letters) return;
  const fontPx = Math.floor(drawing.letterSize * sy);
  if (fontPx < 1) return;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `${INK_PROBE_SIZE}px ${MONO_STACK}`;
  const probe = ctx.measureText(LETTER_SAMPLE);
  const above = (probe.actualBoundingBoxAscent / INK_PROBE_SIZE) * fontPx;
  const below = (probe.actualBoundingBoxDescent / INK_PROBE_SIZE) * fontPx;
  ctx.font = `${fontPx}px ${MONO_STACK}`;
  const advance = ctx.measureText(LETTER_SAMPLE).width / LETTER_SAMPLE.length;
  const baseline = Math.round(ph / 2 + (above - below) / 2);
  ctx.fillStyle = LETTER_INK;
  const first = Math.max(drawing.origin, Math.floor(axis.bpAt(0)));
  const last = Math.min(drawing.end, Math.ceil(axis.bpAt(width)));
  const steps = refStepsIn(model, first, last);
  if (!steps) return;
  for (let k = steps[0]; k < steps[1]; k++) {
    const start = model.origin + model.refOffset[k];
    const end = model.origin + model.refOffset[k + 1];
    const a = Math.max(start, first);
    const b = Math.min(end, last);
    if (b <= a) continue;
    const shown = refBases(model, a, b);
    for (let i = 0; i < shown.length; i++) {
      ctx.fillText(shown.charAt(i), Math.round(axis.px(a + i + 0.5) * sx - advance / 2), baseline);
    }
  }
}

function RefBar({ model, axis, onZoomTo }: RefBarProps) {
  const { px, width, scale } = axis;
  const height = GRAPH_ROW_H;
  const contig = model.contig;
  const referenceName = model.reference.sample;
  const where = (bp: number) => `${contig}:${bp.toLocaleString()}`;
  const span = (from: number, to: number) =>
    to - from > 1 ? `${contig}:${from.toLocaleString()}–${to.toLocaleString()}` : where(from);

  const drawing = useMemo(() => refBarOf(model, scale, height), [model, scale, height]);
  /* In development, what the row drew from, for the check harness. */
  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return;
    (window as unknown as { __pgvRefBar?: unknown }).__pgvRefBar = { drawing, scale, axis };
  }, [drawing, scale, axis]);

  /* ── The canvas ─────────────────────────────────────────────────────── */
  const ref = useRef<HTMLCanvasElement>(null);
  const nudge = useRef(0);
  const screen = useScreenSize(ref);
  const fitted = useRef<FittedCanvas | null>(null);
  const repaint = useCallback(() => {
    if (!fitted.current) return;
    paintRefBar(fitted.current, drawing, model, axis, width);
  }, [drawing, model, axis, width]);
  const painted = useRef<{ repaint: () => void; pw: number; ph: number } | null>(null);
  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas || width <= 0) return;
    const ready = fitCanvas(canvas, width, height, screen, nudge);
    if (!ready) return;
    fitted.current = ready;
    const last = painted.current;
    if (last && last.repaint === repaint && last.pw === ready.pw && last.ph === ready.ph) return;
    repaint();
    painted.current = { repaint, pw: ready.pw, ph: ready.ph };
  }, [repaint, screen, width, height]);

  /* ── Cards ──────────────────────────────────────────────────────────── */
  const [card, setCard] = useState<KeptCard | null>(null);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  useEffect(() => setOpenItems(new Set()), [card]);
  useEffect(() => {
    if (!card) return;
    const close = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.(".pgv-floating-card")) return;
      setCard(null);
    };
    document.addEventListener("pointerdown", close, true);
    return () => document.removeEventListener("pointerdown", close, true);
  }, [card]);
  const toggleItem = (key: string) =>
    setOpenItems((was) => {
      const next = new Set(was);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const hoverCard = useRef<HoverCardHandle>(null);
  const hideHover = () => hoverCard.current?.hide();
  const hoverBoxRef = useRef<SVGRectElement>(null);
  const outline = (box: Box | null) => {
    const element = hoverBoxRef.current;
    if (!element) return;
    if (!box) {
      element.style.display = "none";
      return;
    }
    element.setAttribute("x", String(box.x));
    element.setAttribute("width", String(Math.max(1, box.width)));
    element.style.display = "";
  };

  /* Which rows read each node, for the node card. */
  const lanesOf = useMemo(() => {
    const out = new Map<string, string[]>();
    for (const lane of model.lanes) {
      if (lane.isReference) continue;
      const seen = new Set<string>();
      for (const row of lane.rows) {
        for (const step of row.steps) {
          if (seen.has(step.node)) continue;
          seen.add(step.node);
          const list = out.get(step.node);
          if (list) list.push(lane.label);
          else out.set(step.node, [lane.label]);
        }
      }
    }
    return out;
  }, [model]);
  /* Every break, in order, for a bin card's counts. */
  const breaks = useMemo(() => breaksOf(model), [model]);
  const breaksIn = (from: number, to: number) => {
    let lo = 0;
    let hi = breaks.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (breaks[mid] < from) lo = mid + 1;
      else hi = mid;
    }
    let n = 0;
    for (let i = lo; i < breaks.length && breaks[i] < to; i++) n++;
    return n;
  };
  const carriersLine = (id: string): string[] => {
    const count = model.carriers?.nodes[id];
    return model.carriers && count !== undefined
      ? [`in ${count.toLocaleString()} of ${model.carriers.total.toLocaleString()} haplotypes in the pangenome`]
      : [];
  };
  /** What a node links to on each side as drawn, among the fetched edges
      (as the bars' base card gives it). */
  const linkLines = (id: string, reverse: boolean): ReactNode[] => {
    const links = model.links.get(id);
    if (!links) return [];
    const left = reverse ? links.after : links.before;
    const right = reverse ? links.before : links.after;
    const show = (list: Array<{ id: string; reverse: boolean }>): ReactNode => {
      if (!list.length) return "none fetched";
      const named = list.slice(0, 8).map((n): ReactNode => {
        const strand = reverse ? !n.reverse : n.reverse;
        const len = model.lengths.get(n.id);
        const onRef = model.nodes.get(n.id)?.onReference;
        const elsewhere = onRef ? undefined : model.referenceAt[n.id];
        const count = model.carriers?.nodes[n.id];
        const notes = [
          ...(len !== undefined ? [`${len.toLocaleString()} bp`] : []),
          ...(onRef ? ["ref"] : elsewhere !== undefined ? [`ref at ${elsewhere.toLocaleString()}`] : []),
          ...(count !== undefined ? [`${count.toLocaleString()} hap`] : []),
        ];
        return (
          <span key={n.id}>
            {n.id}
            {strand ? "−" : "+"}
            {notes.length ? ` (${notes.join(", ")})` : ""}
          </span>
        );
      });
      const out: ReactNode[] = [];
      named.forEach((node, i) => {
        if (i) out.push(", ");
        out.push(node);
      });
      if (list.length > 8) out.push(` and ${list.length - 8} more`);
      return <>{out}</>;
    };
    return [<>before, to the left: {show(left)}</>, <>after, to the right: {show(right)}</>];
  };

  /** A node of the reference walk, step k. */
  const describeNode = (k: number): CardContent => {
    const step = model.refSteps[k];
    const start = model.origin + model.refOffset[k];
    const end = model.origin + model.refOffset[k + 1];
    const raw = model.graph.seq.get(step.id) ?? "";
    const shown = step.reverse ? reverseComplement(raw) : raw;
    const rows = lanesOf.get(step.id) ?? [];
    return {
      title: `node ${step.id}`,
      lines: [
        <>
          {coordLabel(`Reference (${referenceName})`)} {refCoord(span(start, end))} · {(end - start).toLocaleString()} bp
        </>,
        `on the reference walk${step.reverse ? ", read on its reverse strand" : ""}`,
        ...linkLines(step.id, step.reverse),
        <>reads {cardSequence(shown)}</>,
        `in the rows shown: ${rows.length ? rows.join(", ") : "none"}`,
        ...carriersLine(step.id),
      ],
      groups: [],
    };
  };

  /** The hover bin [from, to): the reference's nodes there. */
  const describeBin = (from: number, to: number): CardContent => {
    const steps = refStepsIn(model, from, to);
    const first = steps ? steps[0] : 0;
    const last = steps ? steps[1] : 0;
    const nodes: Array<{ k: number; start: number; end: number }> = [];
    for (let k = first; k < last; k++) {
      nodes.push({ k, start: model.origin + model.refOffset[k], end: model.origin + model.refOffset[k + 1] });
    }
    const starting = nodes.filter((node) => node.start >= from).length;
    const here = breaksIn(from, to);
    const perKb = (here * 1000) / Math.max(1, to - from);
    /* The cells the bin touches: their rates and shades. */
    const cellBp = drawing.cellBp;
    const cells: string[] = [];
    for (let c = Math.floor(from / cellBp); c * cellBp < to; c++) {
      const a = Math.max(model.origin, c * cellBp);
      const b = Math.min(model.end, (c + 1) * cellBp);
      if (b <= a) continue;
      const rate = (breaksIn(a, b) * 1000) / Math.max(RATE_MIN_BP, b - a);
      cells.push(`${Math.round(rate).toLocaleString()} per kb (${SHADE_WORDS[breakClass(rate)]})`);
    }
    const longest = nodes.reduce<{ k: number; start: number; end: number } | null>(
      (best, node) => (!best || node.end - node.start > best.end - best.start ? node : best),
      null,
    );
    const items: CardItem[] =
      nodes.length <= LIST_NODES
        ? nodes.map((node) => {
            const step = model.refSteps[node.k];
            const raw = model.graph.seq.get(step.id) ?? "";
            return {
              key: step.id,
              line: (
                <>
                  node {step.id} · {(node.end - node.start).toLocaleString()} bp · {refCoord(span(node.start, node.end))}
                </>
              ),
              details: [<>reads {cardSequence(step.reverse ? reverseComplement(raw) : raw)}</>, ...carriersLine(step.id)],
            };
          })
        : [];
    return {
      title: `${referenceName} · ${span(from, to)}`,
      lines: [
        `${(to - from).toLocaleString()} bp of the reference in ${plural(nodes.length, "node")}, ${starting} of them starting here`,
        `${Math.round(perKb).toLocaleString()} node breaks per kb here${cells.length ? `; its ${cells.length === 1 ? "cell" : "cells"} ${cells.join(" and ")}` : ""}`,
        ...(longest ? [`the longest: node ${model.refSteps[longest.k].id}, ${(longest.end - longest.start).toLocaleString()} bp`] : []),
        ...(nodes.length > LIST_NODES ? [`${nodes.length.toLocaleString()} nodes: too many to list here (${LIST_NODES} at most)`] : []),
      ],
      action: onZoomTo ? { label: "Zoom in here", run: () => onZoomTo(from, to, contig) } : undefined,
      groups: nodes.length <= LIST_NODES ? [{ head: `Nodes (${nodes.length})`, items }] : [],
    };
  };

  /** What is under the pointer: a node, or the hover bin. */
  const targetAt = (at: number): { key: string; build: () => CardContent; box: Box } | null => {
    const bp = axis.bpAt(at);
    if (scale >= 1) {
      const k = refStepAt(model, Math.floor(bp));
      if (k < 0) return null;
      const start = model.origin + model.refOffset[k];
      const end = model.origin + model.refOffset[k + 1];
      return { key: `node:${model.refSteps[k].id}`, build: () => describeNode(k), box: { x: px(start), width: px(end) - px(start) } };
    }
    const binBp = binBpAt(scale, HOVER_BIN_PX);
    const bin = Math.floor(bp / binBp);
    const from = Math.max(model.origin, bin * binBp);
    const to = Math.min(model.end, (bin + 1) * binBp);
    if (to <= from) return null;
    return { key: `bin:${bin}`, build: () => describeBin(from, to), box: { x: px(from), width: px(to) - px(from) } };
  };
  const onMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (cardKeptOpen()) {
      hideHover();
      outline(null);
      return;
    }
    const box = event.currentTarget.getBoundingClientRect();
    const target = targetAt(event.clientX - box.left);
    if (!target) {
      hideHover();
      outline(null);
      return;
    }
    outline(target.box);
    hoverCard.current?.show(target.key, target.build, event.clientX, event.clientY);
  };
  const onLeave = () => {
    hideHover();
    outline(null);
  };
  const onClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.stopPropagation();
    const box = event.currentTarget.getBoundingClientRect();
    const target = targetAt(event.clientX - box.left);
    hideHover();
    if (target) setCard({ ...target.build(), x: event.clientX, y: event.clientY, box: target.box });
  };

  return (
    <div className="pgv-refbar" style={{ width, height }} onMouseLeave={onLeave}>
      <canvas
        ref={ref}
        className="pgv-refbar-canvas"
        style={{ width, height }}
        onMouseMove={onMove}
        onClick={onClick}
      />
      <svg className="pgv-svg pgv-over" width={width} height={height}>
        <rect className="pgv-hover-node" ref={hoverBoxRef} x={0} y={0} width={0} height={height} style={{ display: "none" }} />
        {card && <rect className="pgv-kept-node" x={card.box.x} y={0} width={Math.max(1, card.box.width)} height={height} />}
      </svg>
      {card && (
        <FloatingCard x={card.x} y={card.y} className="pgv-section-card">
          <button type="button" className="pgv-section-close" aria-label="Close" onClick={() => setCard(null)}>
            ×
          </button>
          <CardBody card={card} openItems={openItems} onToggle={toggleItem} kept />
        </FloatingCard>
      )}
      <HoverCard ref={hoverCard} />
    </div>
  );
}

export default memo(RefBar);
