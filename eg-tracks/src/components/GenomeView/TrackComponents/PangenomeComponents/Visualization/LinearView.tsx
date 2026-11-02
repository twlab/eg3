import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Copy, Jump, LinearLane, LinearModel, LinearNode, OpenEnd, Reading } from "./linearModel";
import type { LinearAxis } from "./linearAxis";
import { hitAt, rasteriseBar } from "./barRaster";
import type { BarRaster, EndCap, MarkGlyph, RasterKeep, RasterPart, WhiteRun } from "./barRaster";
import { binBpAt, modelBins } from "./bins";
import type { BinVariant, Bins, CopyRun, ModelBins, VariantKind } from "./bins";
import { barRow, barTiers, dupDrawing, hiddenWhites, walkRow } from "./barTiers";
import type { BarTiers, CopyDrawing, TierAxis, TierWhite } from "./barTiers";
import BarCanvas, { DUP_BAND, MARK_BAND } from "./BarCanvas";
import type { BarTarget, DupHit } from "./BarCanvas";
import { CardBody, HoverCard, cardKeptOpen, cardSequence } from "./Cards";
import type { CardContent, CardItem, CardZoom, HoverCardHandle } from "./Cards";
import FloatingCard from "./FloatingCard";
import { dupRowsOf, laneLayout } from "./laneLayout";
import { deletionSize } from "./pangenomeModel";
import type { NodeLetters } from "./letters";
import type { BrowserClass, Bubble } from "./alignment";

/* ══════════════════════════════════════════════════════════════════════════
   The linear view: a bar per haplotype, on the reference's own axis.

   Every bar is the reference's length. What a haplotype has that the
   reference does not is a mark that takes no room; what it lacks is white;
   what differs over the same bases is letters; a stretch read backwards is
   arrowed; where a walk leaves the reference and never comes back, the bar
   stops at a cap and says missing data, and the card names the node the
   walk went into, in red. See linearModel.ts for how that is worked out and
   BarCanvas.tsx for how it is painted. The reference has no bar: it is
   what every bar is drawn against, and the graph's own track row draws
   nothing in this view (VisualizationContainer).

   A hover shows a card and a click keeps it. Zoomed in and at mid zoom -
   while a base has a pixel - the bars are drawn part by part, lettered
   where a letter fits, and the card is of the part under the pointer.
   Zoomed out past a pixel a base, each row is added up into bins (bins.ts)
   and drawn from what barTiers.ts says it draws of them: white gaps at
   their true width, ticks, grey stripes, big variants as themselves,
   arrows. There a hover or a click reads the bin round the pointer, the
   smallest grid bin at least HOVER_BIN_PX wide: its card adds up what the
   haplotype does there, lists its variants, and can zoom in on it. A
   variant drawn as itself keeps its own card, as at mid zoom.

   A duplication is a stretch of the walk that reads again nodes it read
   before (linearModel.ts, Copy; PLAN-duplications.md). The bar draws the
   walk aligned whole, so a copy shows where the walk has it: inserted, or
   in place of other reference. At a pixel a base or more the rule's marks
   go in a band below the bar (BarCanvas.tsx's DUP_BAND): a border round
   the original, a dotted line with one number under both an original and
   its dispersed copy, and a pointer where a copy is inserted, "tandem ×2".
   Zoomed out, the copies line along the bar's bottom edge says how many
   times the haplotype has a stretch (barTiers.ts's copyDrawing, from
   bins.ts's copy runs).

   "Show walks" draws a row per dispersed copy instead of the haplotype's
   one bar: the copy aligned on its own, lined up on its original. A walk
   row has no copies line and no band below.
   ══════════════════════════════════════════════════════════════════════════ */

/* Below a pixel a base the view is zoomed out: each row is added up into
   bins, and drawn and read by them. At a pixel a base or more a base is
   drawn as itself, lettered or not: that is what mid zoom is. */
const ZOOMED_OUT_BELOW_PX_PER_BASE = 1;
/** Zoomed out, a hover or a click reads the bin round the pointer: the
    smallest grid bin at least this many pixels wide (bins.ts's binBpAt),
    so it is easy to hit, and the same stretch of the reference from any
    band. */
const HOVER_BIN_PX = 16;
/** How many variants each of a bin card's lists shows, the largest first. */
const BIN_CARD_VARIANTS = 6;
/** A walk row's bar, and the room above it for its name. */
export const WALK_ROW_H = 36;
const WALK_ROW_GAP = 14;
const WALK_FOOT = 6;

export const walkRowTop = (row: number) => WALK_ROW_GAP + row * (WALK_ROW_H + WALK_ROW_GAP);

/** How tall the drawing comes out: a bar per haplotype. */
export function linearHeight(model: LinearModel): number {
  return laneLayout(model).height;
}

/** The haplotype a model drawn as one track row holds. */
const laneOf = (model: LinearModel) => model.lanes.find((lane) => !lane.isReference);

/** A haplotype's readings in walk order, those the bar draws: one per
    piece of its walk. */
const readingsOf = (lane: LinearLane) => lane.readings.filter((reading) => reading.drawn);
/** A reading's number as the cards give it: its place among the readings
    drawn, from 1, scraps left out. Null for a scrap. */
const readingNo = (lane: LinearLane, index: number): number | null => {
  const at = readingsOf(lane).findIndex((reading) => reading.index === index);
  return at >= 0 ? at + 1 : null;
};
/** A haplotype's walk rows: its dispersed copies with a row, in walk
    order. */
const rowsOf = (lane: LinearLane) => lane.copies.filter((copy) => copy.drawn);
/** A copy's number as the cards and the walk rows give it: its place among
    the rows, from 1; null for a copy with no row. */
const copyNo = (lane: LinearLane, index: number): number | null => {
  const at = rowsOf(lane).findIndex((copy) => copy.index === index);
  return at >= 0 ? at + 1 : null;
};
/** A copy's kind and times in words: "dispersed ×2", "inverted tandem ×3". */
const copyKind = (copy: Copy) => `${copy.inverted ? "inverted " : ""}${copy.kind} ×${copy.times}`;

/** Whether "Show walks" has anything to draw for this band's haplotype. */
export function walksShown(model: LinearModel): boolean {
  const lane = laneOf(model);
  return !!lane && rowsOf(lane).length > 0;
}

/** How tall the walks are: a row per dispersed copy. */
export function walksHeight(model: LinearModel): number {
  const lane = laneOf(model);
  const rows = Math.max(1, lane ? rowsOf(lane).length : 0);
  return walkRowTop(rows) - WALK_ROW_GAP + WALK_FOOT;
}

/** How many deletions in view this band's haplotype leaves undrawn,
    narrower than half a CSS pixel at this zoom: barTiers.ts's hidden
    whites over the rows drawn, its bar or, with its walk shown, every walk
    row. Measured in CSS pixels, as the rows are, so it is the same on any
    screen. Its track legend says so ("23 deletions too small to see").
    None at a pixel a base or more, where the rows are not binned. */
export function hiddenDeletions(model: LinearModel, axis: TierAxis, walks: boolean): number {
  if (axis.scale >= ZOOMED_OUT_BELOW_PX_PER_BASE) return 0;
  const lane = laneOf(model);
  if (!lane) return 0;
  const rows = walks && walksShown(model) ? rowsOf(lane).map((copy) => walkRow(lane, copy)) : [barRow(lane)];
  /* The bins' grid ends where the band does (bins.ts). */
  return rows.reduce((n, row) => n + hiddenWhites(model, row, axis), 0);
}

/** What a kept card is about, outlined in the drawing. */
type CardTarget =
  | { kind: "base"; row: string; part: number }
  | { kind: "mark"; row: string; glyph: number }
  | { kind: "white"; row: string; white: number }
  | { kind: "end"; row: string; cap: number }
  | { kind: "bin"; row: string; from: number; to: number }
  | { kind: "dup"; row: string; copy: number };

interface KeptCard extends CardContent {
  x: number;
  y: number;
  target: CardTarget;
}

/** One row of bars: a haplotype's bar, or one reading of it. */
interface BarRow {
  key: string;
  lane: LinearLane;
  /** The copy, when the row is one of a walk's: a dispersed copy aligned
      on its own. */
  reading: Copy | null;
  top: number;
  height: number;
  raster: BarRaster;
  /** Zoomed out: the row's bins and what it draws of them; null at a pixel
      a base or more. */
  bins: Bins | null;
  tiers: BarTiers | null;
  /** A bar's copies line, at every zoom; null on a walk row. */
  copies: CopyDrawing | null;
}

/** What a zoomed-out row's raster keeps (barTiers.ts): the marks kept as
    glyphs, and the whites wide enough to draw. */
function keepOf(tiers: BarTiers): RasterKeep {
  const marks = new Set(tiers.keptMarks);
  const parts = new Set<number>();
  const outs = new Set<number>();
  for (const white of tiers.whites) {
    if (!white.drawn) continue;
    if (white.part !== null) parts.add(white.part);
    else if (white.out !== null) outs.add(white.out);
  }
  return {
    keepMark: (index) => marks.has(index),
    keepWhite: (part, out) => (part !== null ? parts.has(part) : out !== null && outs.has(out)),
  };
}

interface LinearViewProps {
  model: LinearModel;
  axis: LinearAxis;
  /** Lane key to keep lit; every other lane is dimmed. */
  highlight: string | null;
  /** One haplotype's row drawn as its dispersed copies, a row each. */
  walks?: boolean;
  /** Moves the view to [start, end) of the reference's contig: what a bin
      card's "Zoom in here" does. Without it the card has no such button. */
  onZoomTo?: (start: number, end: number, contig?: string) => void;
}

const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;
const refCoord = (text: string) => <span className="pgv-coord-ref">{text}</span>;
const altCoord = (text: string) => <span className="pgv-coord-alt">{text}</span>;
const coordLabel = (text: string) => <span className="pgv-coord-label">{text}</span>;
const VARIANT_CLASS: Record<string, string> = {
  substitution: "pgv-var-sub",
  "mismatch+gap": "pgv-var-sub",
  replacement: "pgv-var-multi",
  insertion: "pgv-var-ins",
  deletion: "pgv-var-del",
  inversion: "pgv-var-inv",
  open: "",
  match: "",
};
const className = (cls: BrowserClass) =>
  cls === "mismatch+gap" ? "mismatches, then a gap" : cls === "replacement" ? "replacement" : cls;
/** A bin card's variants, by kind (bins.ts): the colour of each, the
    order they are counted in (inversions apart, as they are not counted),
    and what eg3's alignment calls the kind where its name differs. A
    deletion-insertion is named by its bubble's class instead, a
    replacement or a mismatch+gap. */
const KIND_CLASS: Record<VariantKind, string> = {
  SNV: "pgv-var-sub",
  MNV: "pgv-var-sub",
  insertion: "pgv-var-ins",
  deletion: "pgv-var-del",
  "deletion-insertion": "pgv-var-multi",
  inversion: "pgv-var-inv",
  duplication: "",
};
const KIND_ORDER: VariantKind[] = ["SNV", "MNV", "insertion", "deletion", "deletion-insertion", "duplication"];
const EG3_NAME: Partial<Record<VariantKind, string>> = { SNV: "mismatch", MNV: "substitution", duplication: "copies" };
/** The part under the pointer, in a bin card's words. */
const PART_WORDS: Partial<Record<RasterPart["kind"], string>> = {
  match: "bases as the reference has them",
  mismatch: "a changed base",
  replaced: "a deletion-insertion's bases",
  inverted: "bases read on the other strand",
};

function LinearView({
  model,
  axis,
  highlight,
  walks = false,
  onZoomTo,
}: LinearViewProps) {
  const { px, width, scale } = axis;
  const contig = model.contig;
  const referenceName = model.reference.sample;
  const where = (bp: number) => `${contig}:${bp.toLocaleString()}`;
  const span = (from: number, to: number) =>
    to - from > 1 ? `${contig}:${from.toLocaleString()}–${to.toLocaleString()}` : where(from);

  /* ── Cards ──────────────────────────────────────────────────────────── */
  const [card, setCard] = useState<KeptCard | null>(null);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  useEffect(() => setOpenItems(new Set()), [card]);
  /* A press anywhere but on a card closes the kept one. */
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

  /* ── Rows ────────────────────────────────────────────────────────────── */
  const layout = useMemo(() => laneLayout(model), [model]);
  const walkLane = walks ? laneOf(model) : undefined;
  /* Zoomed out, every row of every lane in bins of the size this zoom
     gives, on the one grid all lanes share (bins.ts). */
  const binned = useMemo<ModelBins | null>(
    () => (scale < ZOOMED_OUT_BELOW_PX_PER_BASE ? modelBins(model, binBpAt(scale)) : null),
    [model, scale],
  );
  const rows = useMemo<BarRow[]>(() => {
    const make = (key: string, lane: LinearLane, reading: Copy | null, top: number, height: number): BarRow => {
      /* Zoomed out: the row's bins, what it draws of them, and a raster
         that keeps only the marks and whites drawn. */
      const laneBins = binned?.lanes.find((candidate) => candidate.key === lane.key);
      const bins = (reading ? laneBins?.readings.find((row) => row.index === reading.index)?.bins : laneBins?.bar) ?? null;
      const tiers = binned && bins ? barTiers(binned, bins, reading ? walkRow(lane, reading) : barRow(lane), axis) : null;
      /* A bar's copies: zoomed out, the tiers' copies line, where a copied
         stretch too narrow for a line gets a marker; at a pixel a base or
         more, the duplication rule's marks below the bar alone. */
      const copies = reading ? null : tiers ? tiers.copies : { lines: [], markers: [], labels: [], ...dupDrawing(lane, axis) };
      return {
        key,
        lane,
        reading,
        top,
        height,
        bins,
        tiers,
        copies,
        raster: rasteriseBar(
          key,
          reading ? reading.parts : lane.drawn,
          reading ? reading.outOfBand : lane.outOfBand,
          reading ? reading.openEnds : lane.openEnds,
          reading ? lane.copies : lane.readings,
          model.graph,
          px,
          width,
          axis.startBp,
          axis.endBp,
          tiers ? keepOf(tiers) : undefined,
        ),
      };
    };
    if (walkLane) {
      return rowsOf(walkLane).map((copy, k) => make(`${walkLane.key} copy ${copy.index}`, walkLane, copy, walkRowTop(k), WALK_ROW_H));
    }
    const out: BarRow[] = [];
    for (const row of layout.rows) {
      const lane = model.lanes.find((candidate) => candidate.key === row.key);
      if (lane) out.push(make(lane.key, lane, null, row.top, row.height));
    }
    return out;
  }, [model, axis, px, width, layout, walkLane, binned]);
  const rowByKey = useMemo(() => new Map(rows.map((row) => [row.key, row])), [rows]);
  const height = walkLane ? walksHeight(model) : layout.height;
  /* In development, each zoomed-out row's bins and tiers on the window by
     its key, with the axis they were made at, for the check harness to
     read what the page drew from (claude-memory/testing), as the model is
     (VisualizationContainer). */
  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return;
    const w = window as unknown as { __pgvBins?: Record<string, unknown>; __pgvTiers?: Record<string, unknown> };
    const bins = (w.__pgvBins ??= {});
    const tiers = (w.__pgvTiers ??= {});
    const at = {
      scale: axis.scale,
      startBp: axis.startBp,
      endBp: axis.endBp,
      width: axis.width,
      viewFromPx: axis.viewFromPx,
      viewToPx: axis.viewToPx,
    };
    for (const row of rows) {
      if (binned && row.bins && row.tiers) {
        const { binBp, first, count, origin, end, contig } = binned;
        bins[row.key] = { ...at, binBp, first, count, origin, end, contig, bins: row.bins };
        tiers[row.key] = { ...at, binBp, tiers: row.tiers };
      } else {
        delete bins[row.key];
        delete tiers[row.key];
      }
    }
  }, [rows, axis, binned]);

  /* ── Bins, zoomed out ───────────────────────────────────────────────── */
  /* A hover or a click reads the bin round the pointer: a grid bin of
     hoverBp bases, the smallest at least HOVER_BIN_PX wide, cut to the
     band. It holds whole drawn bins, both being powers of two on the one
     grid from base 0, and is the same stretch from any band. */
  const hoverBp = binned ? binBpAt(scale, HOVER_BIN_PX) : 0;
  const binAt = (at: number): { from: number; to: number } | null => {
    if (!binned || !(hoverBp > 0)) return null;
    const k = Math.floor(axis.bpAt(at) / hoverBp);
    const from = Math.max(binned.origin, k * hoverBp);
    const to = Math.min(binned.end, (k + 1) * hoverBp);
    return to > from ? { from, to } : null;
  };
  /* A kept card closes when the grid changes: a new band, or a zoom. */
  useEffect(() => setCard(null), [binned]);
  /* "Zoom in here": the bin's middle, with as many bases round it as the
     view is pixels wide, so the view lands at a pixel a base, mid zoom. A
     whole number of bases just under the pixels, so it is never a hair
     under a pixel a base, which is still zoomed out. */
  const zoomTo = (from: number, to: number) => {
    if (!onZoomTo) return;
    const bases = Math.max(1, Math.floor(axis.viewToPx - axis.viewFromPx));
    const start = Math.round((from + to) / 2 - bases / 2);
    setCard(null);
    onZoomTo(start, start + bases, contig);
  };

  /* ── What the cards say ─────────────────────────────────────────────── */
  /** The reference's bases over a stretch of it, from the reference walk. */
  const referenceBases = (from: number, to: number) => {
    const steps = model.refSteps;
    let out = "";
    for (let k = 0; k < steps.length && out.length < to - from; k++) {
      const start = model.origin + model.refOffset[k];
      const end = model.origin + model.refOffset[k + 1];
      if (end <= from || start >= to) continue;
      const sequence = model.graph.seq.get(steps[k].id) ?? "";
      out += sequence.slice(Math.max(0, from - start), Math.min(sequence.length, to - start));
    }
    return out;
  };
  /** How common a node is in the whole pangenome, when the band knows. */
  const carriersLine = (id: string): string[] => {
    const count = model.carriers?.nodes[id];
    return model.carriers && count !== undefined
      ? [`in ${count.toLocaleString()} of ${model.carriers.total.toLocaleString()} haplotypes in the pangenome`]
      : [];
  };
  /** What a node links to on each side as drawn - left of it and right of
      it - among the fetched edges: each neighbour with the strand it is
      read on there, its length, and whether the reference walks it. A
      neighbour a walk went into and never came back from (`gone`) is in
      red. */
  const linkLines = (node: LinearNode, gone?: string): ReactNode[] => {
    const links = model.links.get(node.id);
    if (!links) return [];
    const left = node.reverse ? links.after : links.before;
    const right = node.reverse ? links.before : links.after;
    const show = (list: Array<{ id: string; reverse: boolean }>): ReactNode => {
      if (!list.length) return "none fetched";
      const named = list.slice(0, 8).map((n): ReactNode => {
        const reverse = node.reverse ? !n.reverse : n.reverse;
        const len = model.lengths.get(n.id);
        const onRef = model.nodes.get(n.id)?.onReference;
        /* A node the reference reads outside the band: where a deletion
           running out of it, or a jump, goes. */
        const elsewhere = onRef ? undefined : model.referenceAt[n.id];
        const count = model.carriers?.nodes[n.id];
        const notes = [
          ...(len !== undefined ? [`${len.toLocaleString()} bp`] : []),
          ...(onRef ? ["ref"] : elsewhere !== undefined ? [`ref at ${where(elsewhere)}`] : []),
          ...(count !== undefined ? [`${count.toLocaleString()} hap`] : []),
        ];
        const text = `${n.id}${reverse ? "−" : "+"}${notes.length ? ` (${notes.join(", ")})` : ""}`;
        return n.id === gone ? (
          <span key={n.id} className="pgv-open-end">
            {text}
          </span>
        ) : (
          text
        );
      });
      return (
        <>
          {named.map((item, k) => (
            <span key={k}>
              {k ? ", " : ""}
              {item}
            </span>
          ))}
          {list.length > 8 ? `, +${list.length - 8} more` : ""}
        </>
      );
    };
    return [<>before, to the left: {show(left)}</>, <>after, to the right: {show(right)}</>];
  };
  /** Where a walk leaves the reference and never comes back, in words, in
      red: the node it went into, how far it was followed, and why not
      further. Then the missing stretch, when the graph left it out. */
  const openEndLines = (lane: LinearLane, end: OpenEnd): ReactNode[] => {
    const into = end.into ? `${end.into.id}${end.into.reverse ? "−" : "+"}` : "its own sequence";
    const followed = (end.bases + (end.stop?.stop === "cap" ? end.stop.bp : 0)).toLocaleString();
    const ownLow = Math.min(end.own.from, end.own.to);
    const why = !end.stop
      ? `not followed past the fetch (${followed} bp)`
      : end.stop.stop === "cap"
        ? `followed for ${followed} bp, the most the browser follows`
        : end.at === "start" && ownLow === 0
          ? `followed for ${followed} bp, to the start of its contig`
          : `followed for ${followed} bp, to where its path in this graph ${end.at === "start" ? "starts" : "ends"}`;
    const lines: ReactNode[] = [
      <span className="pgv-open-end">
        {lane.label} leaves {referenceName} here, into {into}, and never comes back:
      </span>,
      <span className="pgv-open-end">{why}. Missing data from here.</span>,
    ];
    if (end.stop?.stop === "end" && end.stop.more) {
      lines.push(
        `the graph build left out the stretch of ${lane.label} that joins this to its ${end.at === "start" ? "previous" : "next"} piece of ${lane.readings[end.reading]?.contig ?? "its contig"}`,
      );
    }
    return lines;
  };
  /** Where a reading's walk goes on past one of its ends, in words. */
  const jumpLine = (lane: LinearLane, jump: Jump): string => {
    const no = jump.reading !== undefined ? readingNo(lane, jump.reading) : null;
    const which =
      jump.reading === undefined
        ? ", past what this reading reads"
        : no !== null
          ? ` (in piece ${no} of its walk)`
          : ", in a stretch with nothing on the reference here";
    return `${jump.before ? "the walk comes from" : "the walk goes on at"} ${where(jump.to)}${jump.reverse ? ", read backward" : ""}${which}`;
  };
  /** The reading a row's part belongs to: the copy on a walk row, else the
      lane's reading the part names. */
  const readingFor = (row: BarRow, part: { reading: number }): Reading => row.reading ?? row.lane.readings[part.reading];
  /** A copy as a card line: its number, kind, own coordinates and where
      the bar draws it. */
  const copyLine = (lane: LinearLane, copy: Copy): ReactNode => (
    <>
      {copyNo(lane, copy.index) !== null ? `copy ${copyNo(lane, copy.index)} · ` : ""}
      {copyKind(copy)} · {altCoord(`${copy.contig}:${copy.ownFrom.toLocaleString()}–${copy.ownTo.toLocaleString()}`)}
      {copy.bar ? (
        <>
          {" "}
          · {copy.bar.len ? <>drawn in place of {refCoord(span(copy.bar.ref, copy.bar.ref + copy.bar.len))}</> : <>inserted at {refCoord(where(copy.bar.ref))}</>}
        </>
      ) : (
        " · not drawn on the bar"
      )}
    </>
  );
  /** The band below a row's bar: a row of DUP_BAND per dispersed
      duplication on a haplotype's bar, none on a walk row. */
  const belowOf = (row: BarRow) => (row.reading ? 0 : dupRowsOf(row.lane) * DUP_BAND);
  /** The bar's height in a row: under the marks' band, over the
      duplications' band. */
  const barHeight = (row: BarRow) => row.height - MARK_BAND - belowOf(row) - 1;
  /** The bubble a part came from. */
  const bubbleOf = (reading: Reading, path: number[]): Bubble | null => {
    let bubble: Bubble | undefined = reading.alignment.bubbles[path[0]];
    if (bubble && path.length > 1) bubble = bubble.inside?.[path[1]];
    return bubble ?? null;
  };
  /** The step of a reading at one of the haplotype's own coordinates. */
  const stepAtOwn = (reading: Reading, bp: number) =>
    reading.steps.find((step) => bp >= step.start && bp < step.end) ?? null;
  /** What a bubble is, as a card line: its class and both sides. */
  const bubbleLine = (bubble: Bubble, reading: Reading, lane: LinearLane): ReactNode => {
    const cls = bubble.cls;
    const kind = <span className={VARIANT_CLASS[cls] ?? ""}>{className(cls)}</span>;
    const refAt = model.origin + bubble.refAt;
    if (cls === "open") {
      return (
        <>
          {kind} · {bubble.hapSeq.length.toLocaleString()} bp of {lane.label} that{" "}
          {bubble.open === "left" ? "comes in off the reference before" : "goes on off the reference after"}{" "}
          {refCoord(where(refAt))}
        </>
      );
    }
    if (cls === "inversion") {
      return (
        <>
          {kind} · {refCoord(span(refAt, refAt + bubble.refSeq.length))} ·{" "}
          {bubble.refSeq.length.toLocaleString()} bp read on the other strand
          {bubble.inside?.length ? `, ${plural(bubble.inside.filter((b) => b.cls !== "match").length, "change")} inside it` : ""}
        </>
      );
    }
    const a = bubble.aligned;
    const refFrom = refAt + a.prefix;
    const refTo = refFrom + a.refMiddle;
    const reads = bubble.hapSeq.slice(a.prefix, bubble.hapSeq.length - a.suffix);
    const instead = bubble.refSeq.slice(a.prefix, bubble.refSeq.length - a.suffix);
    const own = reading.ownFrom + 0;
    void own;
    const what =
      cls === "match" ? (
        <>the same bases as the reference, through other nodes</>
      ) : cls === "insertion" ? (
        <>+{reads.length.toLocaleString()} bp {cardSequence(reads)} at {refCoord(where(refFrom))}</>
      ) : cls === "deletion" ? (
        <>−{instead.length.toLocaleString()} bp {cardSequence(instead)} at {refCoord(span(refFrom, refTo))}</>
      ) : cls === "substitution" ? (
        <>{cardSequence(instead)} → {cardSequence(reads)} at {refCoord(span(refFrom, refTo))}</>
      ) : cls === "mismatch+gap" ? (
        <>
          {reads.length.toLocaleString()} bp for {instead.length.toLocaleString()} bp at {refCoord(span(refFrom, refTo))}:{" "}
          {a.paired.toLocaleString()} paired, then {Math.abs(reads.length - instead.length).toLocaleString()} bp{" "}
          {reads.length > instead.length ? "inserted" : "deleted"}
        </>
      ) : (
        <>
          {reads.length.toLocaleString()} bp {cardSequence(reads)} for {instead.length.toLocaleString()} bp{" "}
          {cardSequence(instead)} at {refCoord(span(refFrom, refTo))}, no base pairing claimed
        </>
      );
    return (
      <>
        {kind} · {what}
      </>
    );
  };
  const zoomOf = (zoom: NodeLetters | null | undefined, contigName: string): CardZoom | undefined => {
    if (!zoom) return undefined;
    const marked = Math.max(0, Math.min(zoom.at, zoom.letters.length - 1));
    const after = marked + Math.max(1, Math.min(zoom.span, zoom.letters.length - marked));
    return {
      before: zoom.letters.slice(0, marked).join(""),
      at: zoom.letters.slice(marked, after).join(""),
      after: zoom.letters.slice(after).join(""),
      where: (
        <>
          under the pointer: alt{" "}
          {altCoord(
            zoom.markTo > zoom.markFrom
              ? `${contigName}:${zoom.markFrom.toLocaleString()}–${(zoom.markTo + 1).toLocaleString()} · ${
                  zoom.markTo - zoom.markFrom + 1
                } bp`
              : `${contigName}:${zoom.markFrom.toLocaleString()}`,
          )}
          {zoom.reverse ? " · on the reverse strand, counting down" : ""}
        </>
      ),
    };
  };
  /** The lane's copies whose original covers a reference position: the
      haplotype has the place more than once. */
  const copiesAt = (lane: LinearLane, ref: number): CardItem[] =>
    lane.copies
      .filter((copy) => copy.original && copy.original[0] <= ref && ref < copy.original[1])
      .map((copy) => ({
        key: `copy ${copy.index}`,
        line: copyLine(lane, copy),
        details: [
          copy.kind === "tandem"
            ? "a tandem duplication: the walk reads these nodes again right after them"
            : "a dispersed duplication: the walk reads these nodes again elsewhere; with Show walks its row lines up here",
          `its original: ${span(copy.original![0], copy.original![1])}`,
        ],
      }));

  const describeBase = (row: BarRow, part: RasterPart, offset: number, bp: number, zoom: NodeLetters | null): CardContent => {
    const { lane } = row;
    const reading = readingFor(row, part);
    const step = Number.isFinite(bp) ? stepAtOwn(reading, bp) : null;
    const node = step ? model.nodes.get(step.node) ?? null : null;
    const refAt = part.kind === "open" ? null : part.ref + offset;
    const bubble = bubbleOf(reading, part.bubble);
    /* The node the reading leaves the reference by, for good. */
    const openEnd = step ? reading.openEnds.find((end) => end.from === step.node) : undefined;
    const lines: ReactNode[] = [
      <>
        {coordLabel(`Alt path (${lane.label})`)}{" "}
        {altCoord(Number.isFinite(bp) ? `${reading.contig}:${bp.toLocaleString()}` : reading.contig)}
        {part.own?.reverse ? " · read on the reverse strand: own coordinates count down left to right" : ""}
      </>,
      refAt !== null ? (
        <>
          {coordLabel(`Reference (${referenceName})`)} {refCoord(where(refAt))}
        </>
      ) : (
        <>
          {coordLabel(`Reference (${referenceName})`)} none here: {part.side === "left" ? "before" : "after"}{" "}
          {refCoord(where(part.ref))}
        </>
      ),
      ...(bubble ? [bubbleLine(bubble, reading, lane)] : []),
      ...(part.inverted ? ["inside an inversion: aligned on the other strand"] : []),
      ...(step ? [<>node {step.node} · {(step.end - step.start).toLocaleString()} bp · reads {cardSequence(model.graph.seq.get(step.node) ?? "")}</>] : []),
      ...(step ? carriersLine(step.node) : []),
      ...(node ? linkLines(node, openEnd?.into?.id) : []),
      ...(openEnd ? openEndLines(lane, openEnd) : []),
      ...(row.reading
        ? [<>copy {copyNo(lane, row.reading.index)} of {rowsOf(lane).length}: {copyLine(lane, row.reading)}</>]
        : readingsOf(lane).length > 1
          ? [`piece ${readingNo(lane, reading.index)} of ${readingsOf(lane).length} of its walk: ${reading.contig} ${reading.ownFrom.toLocaleString()}–${reading.ownTo.toLocaleString()}`]
          : []),
      ...reading.jumps.map((jump) => jumpLine(lane, jump)),
    ];
    const copies = refAt !== null && !row.reading ? copiesAt(lane, refAt) : [];
    return {
      title: `${lane.label}${node ? ` · node ${node.id}` : ""}`,
      zoom: zoomOf(zoom, reading.contig),
      lines,
      groups: copies.length ? [{ head: `Copies (${copies.length})`, items: copies }] : [],
    };
  };
  /** A duplication's mark below the bar: the copy, its kind and times,
      its original and where the bar draws it. */
  const describeDup = (row: BarRow, hit: DupHit): CardContent => {
    const { lane } = row;
    const copy = lane.copies[hit.copy];
    const group = copy.kind === "tandem" ? lane.copies.filter((other) => other.group === copy.group) : [copy];
    return {
      title: `${lane.label} · ${copyKind(copy)}`,
      lines: [
        copy.kind === "tandem"
          ? `a tandem duplication: the haplotype has this stretch ${copy.times} times in a row, the original and ${plural(group.length, "copy").replace("copys", "copies")} right after it`
          : `a dispersed duplication: the haplotype has this stretch ${copy.times} times, this copy elsewhere in its sequence`,
        ...(copy.inverted ? ["read on the other strand"] : []),
        ...(copy.original ? [<>original: {refCoord(span(copy.original[0], copy.original[1]))}, in the black border</>] : ["its original is outside the band"]),
        ...group.map((member) => copyLine(lane, member)),
        copy.kind === "tandem" ? "no walk row: the pointer stands for it" : copy.drawn ? "with Show walks, its row lines up on its original" : "no walk row: its original is not on the band",
      ],
      groups: [],
    };
  };

  const describeMark = (row: BarRow, glyph: MarkGlyph): CardContent => {
    const { lane, raster } = row;
    const parts = glyph.parts.map((index) => raster.parts[index]);
    const items: CardItem[] = parts.map((part) => {
      const reading = readingFor(row, part);
      const bubble = bubbleOf(reading, part.bubble);
      /* At an end that runs out of the band, the bases between the
         junction and the node the walk goes to or comes from there. */
      const why = part.jump
        ? `the haplotype's own bases between here and ${where(part.jump.to)}, where its walk ${
            part.jump.before ? "comes from" : "goes on"
          }`
        : bubble?.cls === "open"
          ? bubble.open === "left"
            ? "the haplotype's own bases between where it leaves the reference before the band and here"
            : "the haplotype's own bases between here and where it comes back to the reference past the band"
          : bubble?.cls === "insertion"
            ? "an insertion"
            : bubble?.cls === "mismatch+gap"
              ? "the surplus after the paired bases"
              : bubble?.cls === "replacement"
                ? "the surplus of a replacement"
                : "inserted bases";
      return {
        key: `${part.index}`,
        line: (
          <>
            +{part.len.toLocaleString()} bp {cardSequence(part.seq ?? "")} at {refCoord(where(part.ref))}
            {part.inverted ? " · inside an inversion" : ""}
          </>
        ),
        details: [
          why,
          ...(part.own
            ? [
                <>
                  alt {altCoord(`${reading.contig}:${part.own.from.toLocaleString()}–${part.own.to.toLocaleString()}`)}
                  {part.own.reverse ? " · on the reverse strand" : ""}
                </>,
              ]
            : []),
          ...(part.nodes.length ? [`node${part.nodes.length === 1 ? "" : "s"} ${part.nodes.join(" → ")}`] : []),
          ...(part.jump ? [jumpLine(lane, part.jump)] : []),
          ...(bubble ? [bubbleLine(bubble, reading, lane)] : []),
          ...part.nodes.flatMap((id) => carriersLine(id)),
        ],
      };
    });
    /* Several insertions close together share the glyph: the title names
       the largest, where it goes in, as the glyph's label does, and how
       many more. */
    const largest = parts.find((part) => part.len === glyph.largest) ?? parts[0];
    return {
      title:
        parts.length > 1
          ? `${lane.label} · +${glyph.largest.toLocaleString()} bp inserted at ${where(largest.ref)}, and ${plural(parts.length - 1, "more insertion")}`
          : `${lane.label} · +${glyph.bp.toLocaleString()} bp inserted at ${where(axis.bpAt(glyph.x) | 0)}`,
      lines: [
        "bases the haplotype has here that the reference does not: shown after the bases they replace, taking no room",
        ...(parts.length > 1 ? [`${parts.length} insertions close together, ${glyph.bp.toLocaleString()} bp in all, drawn as one mark`] : []),
      ],
      groups: [{ head: parts.length > 1 ? `Insertions (${parts.length})` : "Insertion", items }],
    };
  };

  const describeWhite = (row: BarRow, white: WhiteRun): CardContent => {
    const { lane } = row;
    const reading = readingFor(row, white);
    const skipped = white.open === null ? referenceBases(white.refFrom, white.refTo) : "";
    return {
      title: `${lane.label} · deletion`,
      lines: [
        <>
          <span className={VARIANT_CLASS.deletion}>deletion</span> · −{deletionSize(white.bp)} of reference{" "}
          {refCoord(span(white.refFrom, white.refTo))}
        </>,
        white.open === "span"
          ? `the haplotype reads none of this: it goes from ${where(white.refFrom)} to ${where(white.refTo)}, both past what is drawn, with ${
              white.instead ? `${white.instead.toLocaleString()} bp of its own` : "nothing"
            } in between`
          : white.open === "right"
            ? `the haplotype reads the reference up to ${where(white.refFrom - 1)} and next at ${where(white.refTo)}${
                white.node ? ` (node ${white.node})` : ""
              }, past the band`
            : white.open === "left"
              ? `the haplotype reads the reference at ${where(white.refFrom - 1)}${
                  white.node ? ` (node ${white.node})` : ""
                }, before the band, and next at ${where(white.refTo)}`
              : <>reference reads {cardSequence(skipped)}; the haplotype reads nothing here</>,
        row.reading ? <>copy {copyNo(lane, row.reading.index)}: {copyLine(lane, row.reading)}</> : `${reading.contig} ${reading.ownFrom.toLocaleString()}–${reading.ownTo.toLocaleString()}`,
      ],
      groups: [],
    };
  };

  /** A bar's end where the walk leaves the reference for good. */
  const describeEnd = (row: BarRow, cap: EndCap): CardContent => {
    const { lane } = row;
    const end = cap.end;
    const reading = readingFor(row, end);
    const ownLow = Math.min(end.own.from, end.own.to);
    const ownHigh = Math.max(end.own.from, end.own.to);
    return {
      title: `${lane.label} · missing data`,
      lines: [
        <>
          {coordLabel(`Reference (${referenceName})`)} {refCoord(where(end.ref))} · node {end.from}, where {lane.label} leaves
          the reference
        </>,
        ...openEndLines(lane, end),
        <>
          {coordLabel(`Alt path (${lane.label})`)} {altCoord(`${reading.contig}:${ownLow.toLocaleString()}–${ownHigh.toLocaleString()}`)} ·{" "}
          {plural(end.nodes.length, "node")} past the junction, none of them the reference's
        </>,
        "not an allele: nothing says what reference these bases stand in for, so the bar draws none of them",
        row.reading ? <>copy {copyNo(lane, row.reading.index)}: {copyLine(lane, row.reading)}</> : `${reading.contig} ${reading.ownFrom.toLocaleString()}–${reading.ownTo.toLocaleString()}`,
      ],
      groups: [],
    };
  };

  /** What a lane with nothing drawn says of the search for its haplotype
      along the reference (locate.ts). */
  /** Why the search gave a path up, in words. */
  const lostWhy = (reason: string | undefined) =>
    reason === "contig ends"
      ? "its contig ends"
      : reason === "turns back"
        ? "its path turns back before crossing"
        : "too much of its own sequence";
  const absentText = (lane: LinearLane): string => {
    const found = lane.located!;
    if (found.state === "notSeen") {
      return `not seen on the reference from ${where(found.from)} to ${where(found.to)}`;
    }
    const off =
      found.seenAt === undefined
        ? ""
        : ` ${deletionSize(found.side === "left" ? model.origin - found.seenAt : found.seenAt - model.end)} to the ${found.side}`;
    if (found.state === "lost") return `seen${off}, not followed across: ${lostWhy(found.reason)}`;
    return `seen${off}`;
  };
  const describeAbsent = (lane: LinearLane): CardContent => {
    const found = lane.located!;
    return {
      title: `${lane.label} · nothing here`,
      lines: [
        `no walk of ${lane.label} passes through the nodes fetched for this band`,
        `searched the reference from ${where(found.from)} to ${where(found.to)} for one of its sampled visits: ${
          found.seenAt === undefined ? "none" : `one at ${where(found.seenAt)}`
        }`,
        ...(found.state === "lost"
          ? [
              found.reason === "turns back"
                ? "followed from there, its path turned back along the reference before crossing the band"
                : `followed from there, its path ${
                    found.reason === "contig ends" ? "ended" : "ran more than 100 kb of its own sequence"
                  } before reaching the reference past the band`,
            ]
          : []),
        "a path's visits are sampled one in a hundred, so a haplotype that reads the reference only briefly in the stretch searched can be missed",
      ],
      groups: [],
    };
  };

  /** A variant's bubble, where it is one: bins.ts keys it "b", or "b.k"
      inside the inversion b. */
  const variantBubble = (row: BarRow, variant: BinVariant): Bubble | null => {
    const reading = readingFor(row, variant);
    if (!reading || !/^\d+(\.\d+)?$/.test(variant.key)) return null;
    return bubbleOf(reading, variant.key.split(".").map(Number));
  };
  /** A variant that is no bubble, in words: a white running out of the
      band, a span, or a duplication (bins.ts: one per dispersed copy or
      run of tandem copies, sized by its bases). */
  const variantWords = (lane: LinearLane, variant: BinVariant): string =>
    variant.key.startsWith("dup:")
      ? ((copy) =>
          copy
            ? `a ${copyKind(copy)}: ${variant.size.toLocaleString()} bp the walk reads again${copy.original ? `, its original at ${span(copy.original[0], copy.original[1])}` : ""}`
            : "a duplication")(lane.copies[Number(variant.key.slice(4))])
      : variant.key === "span"
        ? `the haplotype reads none of the band from ${where(variant.home)}: it goes on past both its ends`
        : `running out of the band to the ${variant.key === "out:left" ? "left" : "right"}, from ${where(variant.home)}${
            variant.inserted ? `, with ${variant.inserted.toLocaleString()} bp of its own` : ""
          }`;

  /**
   * Zoomed out: the bin round the pointer, from `from` to before `to`, on
   * one row, added up from the row's bins (bins.ts) and what the row draws
   * of them (barTiers.ts). Its bases, aligned, deleted and with missing
   * data; its variants by kind, inversions apart; the bases they insert;
   * the deletions too small to see that start in it; its copies; the part
   * under the pointer. Then lists, each the largest first: the variants
   * homed in it, as many as the count line counts; apart from them, the
   * inversions homed in it, which are listed but not counted, and the big
   * variants homed in another bin that only cross it. Its button, on the
   * kept card, zooms in on it.
   */
  const describeBin = (row: BarRow, from: number, to: number, at: number): CardContent | null => {
    const { lane, reading, bins, tiers } = row;
    if (!binned || !bins || !tiers) return null;
    const B = binned.binBp;
    const i0 = Math.max(0, Math.floor(from / B) - binned.first);
    const i1 = Math.min(binned.count, Math.ceil(to / B) - binned.first);
    const sum = (field: Int32Array) => {
      let n = 0;
      for (let i = i0; i < i1; i++) n += field[i];
      return n;
    };
    let copies = 0;
    for (let i = i0; i < i1; i++) copies = Math.max(copies, bins.copies[i]);
    const homedHere = (variant: BinVariant) => variant.bin !== null && variant.bin >= i0 && variant.bin < i1;
    const left = axis.px(from);
    const right = axis.px(to);

    /* Its variants: those homed in it, and the big ones crossing it from
       another bin, where the row draws them. Only the counted ones homed
       in it go under the count line; a variant that crosses it is counted
       in its own home's bin, and an inversion in none. */
    const homed: number[] = [];
    bins.list.forEach((variant, index) => {
      if (homedHere(variant)) homed.push(index);
    });
    const crossing = tiers.big
      .filter((big) => !homedHere(bins.list[big.variant]) && big.left < right && big.right > left)
      .map((big) => big.variant);

    /* By kind: those counted, and the inversions apart. */
    const byKind = new Map<VariantKind, { n: number; names: Set<string> }>();
    let inversions = 0;
    for (const index of homed) {
      const variant = bins.list[index];
      if (!variant.counted) {
        if (variant.kind === "inversion") inversions += 1;
        continue;
      }
      const known = byKind.get(variant.kind) ?? { n: 0, names: new Set<string>() };
      known.n += 1;
      const name = variant.kind === "deletion-insertion" ? variantBubble(row, variant)?.cls : EG3_NAME[variant.kind];
      if (name) known.names.add(name);
      byKind.set(variant.kind, known);
    }
    const counts = KIND_ORDER.filter((kind) => byKind.has(kind)).map((kind) => {
      const { n, names } = byKind.get(kind)!;
      return `${plural(n, kind)}${names.size ? ` (${[...names].join(" or ")})` : ""}`;
    });
    const variants = sum(bins.variants);
    const reverse = sum(bins.reverse);
    const notRead = sum(bins.notRead);
    const inserted = sum(bins.inserted);
    const hidden = tiers.whites.filter((white) => !white.drawn && white.from >= from && white.from < to).length;
    /* Its copies: the stretch here the haplotype has the most times. */
    const run = bins.runs
      .filter((one) => one.from < to && one.to > from)
      .reduce<CopyRun | null>((best, one) => (!best || one.copies.length > best.copies.length ? one : best), null);
    const hit = hitAt(row.raster, at);

    /* How each listed variant is drawn at this zoom. */
    const big = new Set(tiers.big.map((one) => one.variant));
    const ticked = new Set(tiers.ticks.map((tick) => tick.variant));
    const stripeOf = new Map(tiers.stripes.map((stripe) => [stripe.bin, stripe]));
    const whiteOf = new Map<number, TierWhite>();
    for (const white of tiers.whites) if (white.variant !== null) whiteOf.set(white.variant, white);
    const drawnAs = (index: number, variant: BinVariant): string | null => {
      /* An inversion, big or not, is drawn by the arrows over its bases. */
      if (variant.kind === "inversion") return "drawn by arrows: its bases are read on the other strand";
      if (variant.kind === "deletion") {
        const white = whiteOf.get(index);
        if (white) return white.drawn ? "drawn as a white gap at its true width" : "too small to see: counted in the track's legend";
      }
      if (big.has(index)) return "drawn as itself";
      if (ticked.has(index)) return "drawn as a tick at its base";
      const stripe = variant.bin !== null ? stripeOf.get(variant.bin) : undefined;
      if (stripe && variant.counted && variant.kind !== "duplication") {
        return `in a grey stripe: small variants are dense here, ${tiers.cells[stripe.cell].rate.toFixed(1)} per kb`;
      }
      return null;
    };
    const itemOf = (index: number): CardItem => {
      const variant = bins.list[index];
      const place = variant.kind === "insertion" ? variant.home + 1 : variant.home;
      const size = variant.size.toLocaleString();
      const bubble = variantBubble(row, variant);
      const how = drawnAs(index, variant);
      return {
        key: `variant ${index}`,
        line: (
          <>
            <span className={KIND_CLASS[variant.kind]}>{variant.kind}</span> ·{" "}
            {variant.kind === "insertion" ? `+${size}` : variant.kind === "deletion" ? `−${size}` : size} bp at {refCoord(where(place))}
          </>
        ),
        details: [
          bubble ? bubbleLine(bubble, readingFor(row, variant), lane) : variantWords(lane, variant),
          ...(how ? [how] : []),
          /* An inversion is listed in the bin of its first base but never
             counted (bins.ts). */
          ...(homedHere(variant)
            ? []
            : [
                variant.bin === null
                  ? `crosses this bin; its first base, ${where(variant.home)}, is outside the band`
                  : variant.counted
                    ? `crosses this bin; counted in the bin of its first base, ${where(variant.home)}`
                    : `crosses this bin; listed in the bin of its first base, ${where(variant.home)}`,
              ]),
        ],
      };
    };

    /* Bases the row does not read: on a bar, the haplotype has no data
       there; a walk row only says this copy does not read them. */
    const unread = reading ? "not read by this copy" : "with missing data";
    const lines: ReactNode[] = [
      `${sum(bins.bases).toLocaleString()} bp: ${sum(bins.aligned).toLocaleString()} aligned${
        reverse ? ` (${reverse.toLocaleString()} read on the other strand)` : ""
      }, ${sum(bins.deleted).toLocaleString()} deleted${notRead ? `, ${notRead.toLocaleString()} ${unread}` : ""}`,
      variants ? `${plural(variants, "variant")}: ${counts.join(", ")}` : "no variants",
      ...(inversions
        ? [`${plural(inversions, "inversion")} as well, not counted: ${inversions === 1 ? "its" : "their"} bases count as read on the other strand`]
        : []),
      ...(inserted ? [`${inserted.toLocaleString()} bp inserted, which the reference does not have`] : []),
      ...(hidden ? [`${plural(hidden, "deletion")} too small to see, counted in the track's legend`] : []),
      ...(copies >= 2 && run
        ? [`×${copies}: the haplotype has this stretch ${copies} times, ${plural(run.tandem.length, "tandem copy").replace("copys", "copies")} and ${run.dispersed.length} dispersed`]
        : []),
      ...(reading ? [<>copy {copyNo(lane, reading.index)} of {rowsOf(lane).length}: {copyLine(lane, reading)}</>] : []),
      hit ? (
        <>
          under the pointer: {PART_WORDS[hit.part.kind] ?? hit.part.kind}, at {refCoord(where(hit.part.ref + hit.offset))}
        </>
      ) : (
        <>
          under the pointer: {refCoord(where(Math.floor(axis.bpAt(at))))},{" "}
          {reading ? "where this copy has no bases" : `where ${lane.label} has no bases drawn`}
        </>
      ),
    ];
    const groups: CardContent["groups"] = [];
    /* A list, the largest first, BIN_CARD_VARIANTS at most, and how many
       it leaves out. */
    const list = (head: string, indexes: number[]) => {
      if (!indexes.length) return;
      const shown = [...indexes].sort((a, b) => bins.list[b].size - bins.list[a].size || a - b).slice(0, BIN_CARD_VARIANTS);
      groups.push({
        head: `${head} (${indexes.length.toLocaleString()})`,
        items: shown.map(itemOf),
        ...(indexes.length > shown.length ? { more: `and ${(indexes.length - shown.length).toLocaleString()} more` } : {}),
      });
    };
    list("Variants", homed.filter((index) => bins.list[index].counted));
    list("Inversions", homed.filter((index) => !bins.list[index].counted));
    list("Crossing this bin", crossing);
    if (copies >= 2 && run) {
      groups.push({
        head: `Copies (${run.copies.length})`,
        items: run.copies.map((index) => {
          const copy = lane.copies[index];
          return {
            key: `copy ${index}`,
            line: copyLine(lane, copy),
            details: [
              copy.kind === "tandem"
                ? "right after its original: a tandem duplication"
                : "elsewhere in the haplotype's sequence: a dispersed duplication",
              ...(copy.original ? [`its original: ${span(copy.original[0], copy.original[1])}`] : []),
            ],
          };
        }),
      });
    }
    return {
      title: `${lane.label} · ${span(from, to)}`,
      lines,
      ...(onZoomTo ? { action: { label: "Zoom in here", run: () => zoomTo(from, to) } } : {}),
      groups,
    };
  };

  const showHover = (key: string, build: () => CardContent | null, x: number, y: number) => {
    if (cardKeptOpen()) {
      hideHover();
      return;
    }
    hoverCard.current?.show(key, build, x, y);
  };
  const keep = (content: CardContent | null, target: CardTarget, x: number, y: number) => {
    hideHover();
    if (content) setCard({ ...content, x, y, target });
  };

  /* The outline round what the pointer is on. Written straight to the
     attribute: a hover is a hundred events long and none of them change
     anything React would need to work out again. */
  const outline = (box: { x: number; y: number; width: number; height: number } | null) => {
    const element = hoverBoxRef.current;
    if (!element) return;
    if (!box) {
      element.style.display = "none";
      return;
    }
    element.setAttribute("x", String(box.x));
    element.setAttribute("y", String(box.y));
    element.setAttribute("width", String(Math.max(1, box.width)));
    element.setAttribute("height", String(box.height));
    element.style.display = "";
  };
  /** A bar's end and the empty stretch past it, outlined. */
  const capBox = (row: BarRow, cap: EndCap) => {
    const x = Math.min(cap.left, cap.x - 3);
    return { x, y: row.top + MARK_BAND, width: Math.max(cap.right, cap.x + 3) - x, height: barHeight(row) };
  };
  /** A bin of a bar, outlined over the bar. */
  const binBox = (row: BarRow, from: number, to: number) => ({
    x: axis.px(from),
    y: row.top + MARK_BAND,
    width: axis.px(to) - axis.px(from),
    height: barHeight(row),
  });
  /** A duplication's mark below the bar, outlined: the copy's pointer, or
      its line under the original. */
  const dupBox = (row: BarRow, index: number) => {
    const copy = row.lane.copies[index];
    const pointer = row.copies?.pointers.find((one) => one.copy === index);
    const line = row.copies?.below.find((one) => one.copy === index);
    const left = pointer ? pointer.x - 5 : copy.original ? axis.px(copy.original[0]) : 0;
    const right = pointer ? pointer.x + 5 : copy.original ? axis.px(copy.original[1]) : 0;
    const at = pointer?.row ?? line?.row ?? 0;
    return { x: left, y: row.top + MARK_BAND + barHeight(row) + at * DUP_BAND, width: right - left, height: DUP_BAND };
  };
  const boxOf = (row: BarRow, target: BarTarget) => {
    if (target.kind === "base") {
      return { x: target.part.left, y: row.top + MARK_BAND, width: target.part.right - target.part.left, height: barHeight(row) };
    }
    if (target.kind === "mark") {
      return { x: target.glyph.x - 5, y: row.top, width: 10, height: MARK_BAND + 2 };
    }
    if (target.kind === "end") return capBox(row, target.cap);
    if (target.kind === "bin") return binBox(row, target.from, target.to);
    if (target.kind === "dup") return dupBox(row, target.dup.copy);
    return { x: target.white.left, y: row.top + MARK_BAND, width: target.white.right - target.white.left, height: barHeight(row) };
  };
  const onBarHover = (row: BarRow, target: BarTarget | null) => {
    if (!target || cardKeptOpen()) {
      outline(null);
      hideHover();
      return;
    }
    outline(boxOf(row, target));
    if (target.kind === "base") {
      const { part, offset, bp, zoom } = target;
      showHover(`base:${row.key}:${part.index}:${offset}`, () => describeBase(row, part, offset, bp, zoom), target.x, target.y);
    } else if (target.kind === "mark") {
      showHover(`mark:${row.key}:${target.glyph.x}`, () => describeMark(row, target.glyph), target.x, target.y);
    } else if (target.kind === "end") {
      showHover(`end:${row.key}:${target.cap.x}`, () => describeEnd(row, target.cap), target.x, target.y);
    } else if (target.kind === "bin") {
      /* Built again only when the part under the pointer changes, which
         its last line names. */
      const { from, to, at } = target;
      const hit = hitAt(row.raster, at);
      showHover(`bin:${row.key}:${from}:${hit ? `${hit.part.index}:${hit.offset}` : ""}`, () => describeBin(row, from, to, at), target.x, target.y);
    } else if (target.kind === "dup") {
      showHover(`dup:${row.key}:${target.dup.copy}`, () => describeDup(row, target.dup), target.x, target.y);
    } else {
      showHover(`white:${row.key}:${target.white.left}`, () => describeWhite(row, target.white), target.x, target.y);
    }
  };
  const onBarPick = (row: BarRow, target: BarTarget) => {
    if (target.kind === "base") {
      keep(describeBase(row, target.part, target.offset, target.bp, target.zoom), { kind: "base", row: row.key, part: target.part.index }, target.x, target.y);
    } else if (target.kind === "mark") {
      keep(describeMark(row, target.glyph), { kind: "mark", row: row.key, glyph: row.raster.marks.indexOf(target.glyph) }, target.x, target.y);
    } else if (target.kind === "end") {
      keep(describeEnd(row, target.cap), { kind: "end", row: row.key, cap: row.raster.caps.indexOf(target.cap) }, target.x, target.y);
    } else if (target.kind === "bin") {
      keep(describeBin(row, target.from, target.to, target.at), { kind: "bin", row: row.key, from: target.from, to: target.to }, target.x, target.y);
    } else if (target.kind === "dup") {
      keep(describeDup(row, target.dup), { kind: "dup", row: row.key, copy: target.dup.copy }, target.x, target.y);
    } else {
      keep(describeWhite(row, target.white), { kind: "white", row: row.key, white: row.raster.whites.indexOf(target.white) }, target.x, target.y);
    }
  };

  /* A walk's rows are lit or dimmed as their haplotype is. */
  const dim = (lane: LinearLane) => highlight !== null && highlight !== lane.key;

  /* What a kept card is about, outlined where it is drawn. */
  const kept = card?.target ?? null;
  const keptBox = (() => {
    if (!kept) return null;
    const row = rowByKey.get(kept.row);
    if (!row) return null;
    if (kept.kind === "base") {
      const part = row.raster.parts[kept.part];
      return part ? { x: part.left, y: row.top + MARK_BAND, width: part.right - part.left, height: barHeight(row) } : null;
    }
    if (kept.kind === "dup") return dupBox(row, kept.copy);
    if (kept.kind === "mark") {
      const glyph = row.raster.marks[kept.glyph];
      return glyph ? { x: glyph.x - 5, y: row.top, width: 10, height: MARK_BAND + 2 } : null;
    }
    if (kept.kind === "white") {
      const white = row.raster.whites[kept.white];
      return white ? { x: white.left, y: row.top + MARK_BAND, width: white.right - white.left, height: barHeight(row) } : null;
    }
    if (kept.kind === "end") {
      const cap = row.raster.caps[kept.cap];
      return cap ? capBox(row, cap) : null;
    }
    return binBox(row, kept.from, kept.to);
  })();

  return (
    <div className="pgv-linear" style={{ width, height }} onMouseLeave={hideHover}>
      {/* ── Haplotype bars ───────────────────────────────────────────── */}
      {rows.map((row) => (
        <div key={row.key} className="pgv-lane-slot" style={{ top: row.top, height: row.height }}>
          {row.lane.located && !row.reading && row.lane.drawn.length === 0 && (
            <div
              className="pgv-absent"
              onMouseMove={(event) =>
                showHover(`absent:${row.key}`, () => describeAbsent(row.lane), event.clientX, event.clientY)
              }
              onMouseLeave={hideHover}
            >
              {absentText(row.lane)}
            </div>
          )}
          <BarCanvas
            raster={row.raster}
            width={width}
            height={row.height}
            color={row.lane.color}
            view={[axis.viewFromPx, axis.viewToPx]}
            dim={dim(row.lane)}
            /* Zoomed out, the row's tiers: it is drawn from them, and a
               hover or a click reads the bin round the pointer. */
            tiers={row.tiers ?? undefined}
            binAt={row.tiers ? binAt : undefined}
            copies={row.copies ?? undefined}
            below={belowOf(row)}
            onHover={(target) => onBarHover(row, target)}
            onPick={(target) => onBarPick(row, target)}
          />
        </div>
      ))}

      <svg className="pgv-svg pgv-over" width={width} height={height}>
        {/* The foot of each row. */}
        {(walkLane ? [{ key: walkLane.key, top: 0, height }] : layout.rows).map((row) => (
          <line
            key={`rule-${row.key}`}
            className="pgv-row-rule"
            x1={0}
            x2={width}
            y1={row.top + row.height - 0.5}
            y2={row.top + row.height - 0.5}
          />
        ))}

        {/* A walk's rows' names: which copy each is. */}
        {walkLane &&
          rows.map((row) => (
            <text key={`name-${row.key}`} x={axis.viewFromPx + 4} y={row.top - 3} className="pgv-walk-label">
              {row.reading
                ? `copy ${copyNo(walkLane, row.reading.index)} · ${copyKind(row.reading)} · own ${row.reading.ownFrom.toLocaleString()}–${row.reading.ownTo.toLocaleString()}${row.reading.reversed ? " · read backwards" : ""}`
                : ""}
            </text>
          ))}

        <rect className="pgv-hover-node" ref={hoverBoxRef} x={0} y={0} width={0} height={0} style={{ display: "none" }} />
        {keptBox && <rect className="pgv-kept-node" x={keptBox.x} y={keptBox.y} width={keptBox.width} height={keptBox.height} />}
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

export default memo(LinearView);
