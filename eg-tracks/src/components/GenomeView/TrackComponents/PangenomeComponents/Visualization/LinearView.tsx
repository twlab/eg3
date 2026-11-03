import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Jump, LinearLane, LinearModel, LinearNode, OpenEnd, Row, RowBubble } from "./linearModel";
import type { LinearAxis } from "./linearAxis";
import { hitAt, rasteriseBar } from "./barRaster";
import type { BarRaster, EndCap, MarkGlyph, RasterKeep, RasterPart, WhiteRun } from "./barRaster";
import { binBpAt, modelBins } from "./bins";
import type { BinVariant, Bins, ModelBins, VariantKind } from "./bins";
import { barTiers, hiddenWhites, rowOf } from "./barTiers";
import type { BarTiers, TierAxis, TierWhite } from "./barTiers";
import BarCanvas, { MARK_BAND } from "./BarCanvas";
import type { BarTarget } from "./BarCanvas";
import { CardBody, HoverCard, cardKeptOpen, cardSequence } from "./Cards";
import type { CardContent, CardItem, CardZoom, HoverCardHandle } from "./Cards";
import FloatingCard from "./FloatingCard";
import { ROW_H, laneLayout, rowTop } from "./laneLayout";
import { deletionSize } from "./pangenomeModel";
import type { NodeLetters } from "./letters";
import type { BrowserClass } from "./alignment";
import { usePangenomeView } from "./pangenomeViewState";
import type { NestedMark } from "./nestedMarks";
import { formText } from "./markLabel";

/* ══════════════════════════════════════════════════════════════════════════
   The linear view: a row per walk of each haplotype, on the reference's
   own axis.

   A haplotype's lane holds one row per walk the fetch gave of it, each
   the reference's length and labelled with the walk's own coordinates
   (linearModel.ts, rowAlign.ts; PLAN-rows.md). A row is plain where the
   walk reads what the reference reads; what it has that the reference
   does not is a mark that takes no room; what it lacks is white; what
   differs over the same bases is letters; a stretch read on the other
   strand is arrowed; where the walk leaves the reference and never comes
   back, the row stops at a cap and says missing data, and the card names
   the node the walk went into, in red. A haplotype with the band three
   times has three rows: that is how a duplication shows. The reference
   has no row here: it is what every row is drawn against, and the graph's
   own track row draws it as the ref bar (RefBar.tsx; VisualizationContainer).

   A hover shows a card and a click keeps it. Zoomed in and at mid zoom -
   while a base has a pixel - the rows are drawn part by part, lettered
   where a letter fits, and the card is of the part under the pointer.
   Zoomed out past a pixel a base, each row is added up into bins (bins.ts)
   and drawn from what barTiers.ts says it draws of them: white gaps at
   their true width, ticks, grey stripes, big variants as themselves,
   arrows. There a hover or a click reads the bin round the pointer, the
   smallest grid bin at least HOVER_BIN_PX wide: its card adds up what the
   row does there, lists its variants, and can zoom in on it. A variant
   drawn as itself keeps its own card, as at mid zoom.
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

/** How tall the drawing comes out: each haplotype's rows. */
export function linearHeight(model: LinearModel): number {
  return laneLayout(model).height;
}

/** The haplotype a model drawn as one track row holds. */
const laneOf = (model: LinearModel) => model.lanes.find((lane) => !lane.isReference);

/** How many deletions in view this band's haplotype leaves undrawn,
    narrower than half a CSS pixel at this zoom: barTiers.ts's hidden
    whites over its rows. Measured in CSS pixels, as the rows are, so it
    is the same on any screen. Its track legend says so ("23 deletions too
    small to see"). None at a pixel a base or more, where the rows are not
    binned. */
export function hiddenDeletions(model: LinearModel, axis: TierAxis): number {
  if (axis.scale >= ZOOMED_OUT_BELOW_PX_PER_BASE) return 0;
  const lane = laneOf(model);
  if (!lane) return 0;
  /* The bins' grid ends where the band does (bins.ts). */
  return lane.rows.reduce((n, row) => n + hiddenWhites(model, rowOf(row), axis), 0);
}

/** What a kept card is about, outlined in the drawing. */
type CardTarget =
  | { kind: "base"; row: string; part: number }
  | { kind: "mark"; row: string; glyph: number }
  | { kind: "white"; row: string; white: number }
  | { kind: "end"; row: string; cap: number }
  | { kind: "bin"; row: string; from: number; to: number };

interface KeptCard extends CardContent {
  x: number;
  y: number;
  target: CardTarget;
}

/** One row of the drawing: one walk of a haplotype. */
interface BarRow {
  key: string;
  lane: LinearLane;
  row: Row;
  top: number;
  height: number;
  /** Zoomed out: the row's bins and what it draws of them. */
  bins: Bins | null;
  tiers: BarTiers | null;
  raster: BarRaster;
}

interface LinearViewProps {
  model: LinearModel;
  axis: LinearAxis;
  /** Lane key to keep lit; every other lane is dimmed. */
  highlight: string | null;
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
};
const KIND_ORDER: VariantKind[] = ["SNV", "MNV", "insertion", "deletion", "deletion-insertion"];
const EG3_NAME: Partial<Record<VariantKind, string>> = { SNV: "mismatch", MNV: "substitution" };
/** The part under the pointer, in a bin card's words. */
const PART_WORDS: Partial<Record<RasterPart["kind"], string>> = {
  match: "bases as the reference has them",
  mismatch: "a changed base",
  replaced: "a deletion-insertion's bases",
  inverted: "bases read on the other strand",
};

/** Which of a zoomed-out row's marks and whites the raster keeps: those
    barTiers.ts draws. */
function keepOf(tiers: BarTiers): RasterKeep {
  const marks = new Set(tiers.keptMarks);
  const partWhites = new Set<number>();
  const outWhites = new Set<number>();
  for (const white of tiers.whites) {
    if (!white.drawn) continue;
    if (white.part !== null) partWhites.add(white.part);
    if (white.out !== null) outWhites.add(white.out);
  }
  return {
    keepMark: (index) => marks.has(index),
    keepWhite: (part, out) => (part !== null ? partWhites.has(part) : out !== null ? outWhites.has(out) : false),
  };
}

function LinearView({ model, axis, highlight, onZoomTo }: LinearViewProps) {
  const { px, width, scale } = axis;
  const contig = model.contig;
  const referenceName = model.reference.sample;
  /* Rule D's switch: whose versions a nested mark counts (nestedMarks.ts). */
  const countOver = usePangenomeView()?.countOver ?? "all";
  const where = (bp: number) => `${contig}:${bp.toLocaleString()}`;
  const span = (from: number, to: number) =>
    to - from > 1 ? `${contig}:${from.toLocaleString()}–${to.toLocaleString()}` : where(from);
  /** A row's name: its walk's contig and own coordinates. */
  const rowName = (row: Row) => `${row.contig}:${row.ownFrom.toLocaleString()}–${row.ownTo.toLocaleString()}`;

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
  /* Zoomed out, every row of every lane in bins of the size this zoom
     gives, on the one grid all lanes share (bins.ts). */
  const binned = useMemo<ModelBins | null>(
    () => (scale < ZOOMED_OUT_BELOW_PX_PER_BASE ? modelBins(model, binBpAt(scale)) : null),
    [model, scale],
  );
  const rows = useMemo<BarRow[]>(() => {
    const out: BarRow[] = [];
    for (const slot of layout.rows) {
      const lane = model.lanes.find((candidate) => candidate.key === slot.key);
      if (!lane) continue;
      const laneBins = binned?.lanes.find((candidate) => candidate.key === lane.key);
      lane.rows.forEach((row, n) => {
        const bins = laneBins?.rows.find((one) => one.index === row.index)?.bins ?? null;
        const tiers = binned && bins ? barTiers(binned, bins, rowOf(row), axis) : null;
        const key = `${lane.key} row ${row.index}`;
        out.push({
          key,
          lane,
          row,
          top: slot.top + rowTop(n),
          height: ROW_H,
          bins,
          tiers,
          raster: rasteriseBar(key, row, model.graph, px, width, axis.startBp, axis.endBp, { ...(tiers ? keepOf(tiers) : {}), countOver }),
        });
      });
    }
    return out;
  }, [model, axis, px, width, layout, binned, countOver]);
  const rowByKey = useMemo(() => new Map(rows.map((row) => [row.key, row])), [rows]);
  const height = layout.height;
  /** Where the reference walk first reads a node, for the cards. */
  const refNodeAt = useMemo(() => {
    const at = new Map<string, number>();
    model.refSteps.forEach((step, k) => {
      if (!at.has(step.id)) at.set(step.id, model.origin + model.refOffset[k]);
    });
    return at;
  }, [model]);

  /* In development, each zoomed-out row's bins and tiers on the window by
     its key, with the axis they were made at, for the check harness to
     read what the page drew from (claude-memory/testing), as the model is
     (VisualizationContainer). */
  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return;
    const w = window as unknown as { __pgvBins?: Record<string, unknown>; __pgvTiers?: Record<string, unknown> };
    const bins = (w.__pgvBins ??= {});
    const tiers = (w.__pgvTiers ??= {});
    const at = { scale: axis.scale, startBp: axis.startBp, endBp: axis.endBp, width: axis.width, viewFromPx: axis.viewFromPx, viewToPx: axis.viewToPx };
    for (const row of rows) {
      if (binned && row.bins && row.tiers) {
        const { binBp, first, count, origin, end, contig: chr } = binned;
        bins[row.key] = { ...at, binBp, first, count, origin, end, contig: chr, bins: row.bins };
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
  /** Where the reference reads a node, in words: on the band's walk, or
      elsewhere (`referenceAt`); nothing for a node of the haplotype's own. */
  const referenceReads = (id: string): string | null => {
    const here = refNodeAt.get(id);
    if (here !== undefined) return `the reference reads this node at ${where(here)}`;
    const elsewhere = model.referenceAt[id];
    return elsewhere !== undefined ? `the reference reads this node at ${where(elsewhere)}, outside the band` : null;
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
  const openEndLines = (lane: LinearLane, row: Row, end: OpenEnd): ReactNode[] => {
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
      lines.push(`the graph build left out the stretch of ${lane.label} that joins this to its ${end.at === "start" ? "previous" : "next"} walk of ${row.contig}`);
    }
    return lines;
  };
  /** Where a row's walk turns back along the reference at one of its ends,
      in words. */
  const jumpLine = (jump: Jump): string =>
    `${jump.before ? "the walk comes from" : "the walk goes on at"} ${where(jump.to)}${jump.reverse ? ", read on the other strand" : ""}: reference already drawn, so the rest of the walk is not`;
  /** The row's line on a card: which walk of the haplotype it is. */
  const rowLine = (lane: LinearLane, row: Row): ReactNode => (
    <>
      walk {row.index + 1} of {lane.rows.length}: {altCoord(rowName(row))}
      {lane.undrawn ? ` (${plural(lane.undrawn, "other walk")} through the band's nodes read none of its reference)` : ""}
    </>
  );
  /** The step of a row at one of the haplotype's own coordinates. */
  const stepAtOwn = (row: Row, bp: number) => row.steps.find((step) => bp >= step.start && bp < step.end) ?? null;
  /** What a bubble is, as a card line: its class and both sides. */
  const bubbleLine = (bubble: RowBubble, row: Row): ReactNode => {
    const cls = bubble.cls;
    const kind = <span className={VARIANT_CLASS[cls] ?? ""}>{className(cls)}</span>;
    if (cls === "inversion") {
      const changes = (bubble.inside ?? []).filter((b) => row.bubbles[b].cls !== "match").length;
      return (
        <>
          {kind} · {refCoord(span(bubble.refAt, bubble.refAt + bubble.refLen))} · {bubble.refLen.toLocaleString()} bp read on the other strand
          {changes ? `, ${plural(changes, "change")} inside it` : ""}
        </>
      );
    }
    const a = bubble.aligned;
    if (!a) return kind;
    const refFrom = bubble.refAt + a.prefix;
    const refTo = refFrom + a.refMiddle;
    const reads = bubble.hapSeq.slice(a.prefix, bubble.hapSeq.length - a.suffix);
    const instead = bubble.refSeq.slice(a.prefix, bubble.refSeq.length - a.suffix);
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
          {reads.length.toLocaleString()} bp {cardSequence(reads)} for {instead.length.toLocaleString()} bp {cardSequence(instead)} at{" "}
          {refCoord(span(refFrom, refTo))}, no base pairing claimed
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
              ? `${contigName}:${zoom.markFrom.toLocaleString()}–${(zoom.markTo + 1).toLocaleString()} · ${zoom.markTo - zoom.markFrom + 1} bp`
              : `${contigName}:${zoom.markFrom.toLocaleString()}`,
          )}
          {zoom.reverse ? " · on the reverse strand, counting down" : ""}
        </>
      ),
    };
  };

  /** Other lanes on screen whose rows delete across a reference base:
      what a base's card says of them (a site inside a deletion). */
  const lanesOnScreen = model.allLanes ?? model.lanes;
  const deletedByOthers = (refAt: number, lane: LinearLane): ReactNode[] =>
    lanesOnScreen.flatMap((other) =>
      other.isReference || other.key === lane.key
        ? []
        : other.rows.flatMap((row) =>
            row.parts
              .filter((part) => part.kind === "white" && !part.span && part.ref <= refAt && refAt < part.ref + part.len)
              .map((part) => `inside the ${part.len.toLocaleString()} bp ${other.label} deletes (${span(part.ref, part.ref + part.len)}): ${other.label} has no base here`),
          ),
    );
  /** Sites inside a deletion where the lanes on screen differ: a changed
      base on another lane's row, against the reference's base. */
  const sitesSkipped = (white: WhiteRun, lane: LinearLane): ReactNode[] => {
    if (white.open !== null) return [];
    const sites = new Map<number, string[]>();
    for (const other of lanesOnScreen) {
      if (other.isReference || other.key === lane.key) continue;
      for (const row of other.rows) {
        for (const part of row.parts) {
          if (part.kind !== "mismatch" || !part.seq) continue;
          for (let i = 0; i < part.len; i++) {
            const at = part.ref + i;
            if (at < white.refFrom || at >= white.refTo) continue;
            const list = sites.get(at) ?? [];
            list.push(`${part.seq[i]} on ${other.label}`);
            sites.set(at, list);
          }
        }
      }
    }
    if (!sites.size) return [];
    const shown = [...sites.entries()].sort((a, b) => a[0] - b[0]).slice(0, 3);
    const lines: ReactNode[] = shown.map(([at, who]) => {
      const same = lanesOnScreen
        .filter((other) => !other.isReference && other.key !== lane.key && other.rows.some((row) => row.parts.some((part) => part.kind === "match" && part.ref <= at && at < part.ref + part.len)))
        .map((other) => other.label);
      return `skips a site where the lanes on screen differ: ${where(at)}, ${who.join(", ")}${same.length ? `, ${referenceBases(at, at + 1)} on ${same.join(", ")} as on ${referenceName}` : ""}`;
    });
    if (sites.size > shown.length) lines.push(`and ${plural(sites.size - shown.length, "more such site")}`);
    return lines;
  };

  const describeBase = (bar: BarRow, part: RasterPart, offset: number, bp: number, zoom: NodeLetters | null): CardContent => {
    const { lane, row } = bar;
    const step = Number.isFinite(bp) ? stepAtOwn(row, bp) : null;
    const node = step ? model.nodes.get(step.node) ?? null : null;
    const refAt = part.ref + offset;
    const bubble = part.bubble !== null ? row.bubbles[part.bubble] : null;
    /* The node the row leaves the reference by, for good. */
    const openEnd = step ? row.openEnds.find((end) => end.from === step.node) : undefined;
    const lines: ReactNode[] = [
      <>
        {coordLabel(`Alt path (${lane.label})`)} {altCoord(Number.isFinite(bp) ? `${row.contig}:${bp.toLocaleString()}` : row.contig)}
        {part.own?.reverse ? " · read on the reverse strand: own coordinates count down left to right" : ""}
      </>,
      <>
        {coordLabel(`Reference (${referenceName})`)} {refCoord(where(refAt))}
      </>,
      ...(bubble ? [bubbleLine(bubble, row)] : []),
      ...(part.inverted ? ["inside an inverted run: placed on the other strand"] : []),
      ...(step ? [<>node {step.node} · {(step.end - step.start).toLocaleString()} bp · reads {cardSequence(model.graph.seq.get(step.node) ?? "")}</>] : []),
      ...(step && part.kind !== "match" ? [referenceReads(step.node) ?? "a node of the haplotype's own: the reference does not read it"] : []),
      ...(step ? carriersLine(step.node) : []),
      ...(node ? linkLines(node, openEnd?.into?.id) : []),
      ...(openEnd ? openEndLines(lane, row, openEnd) : []),
      ...deletedByOthers(refAt, lane),
      rowLine(lane, row),
      ...row.jumps.map(jumpLine),
    ];
    return { title: `${lane.label}${node ? ` · node ${node.id}` : ""}`, zoom: zoomOf(zoom, row.contig), lines, groups: [] };
  };

  /** Rule D: what a card says of a site with more than one version among
      the haplotypes counted (nestedMarks.ts): the versions, each with its
      count and the lanes on screen reading it, then the straight readers
      and those anchoring other nodes, and where inside the site the
      versions differ. */
  const versionsCard = (parts: RasterPart[]): { lines: ReactNode[]; groups: CardContent["groups"] } => {
    const groups: CardContent["groups"] = [];
    const lines: ReactNode[] = [];
    for (const part of parts) {
      const info: NestedMark | null = part.nested?.[countOver] ?? null;
      if (!info) continue;
      const unit = info.unit === "haplotypes" ? "haplotypes in the band" : "lanes on screen";
      const of = (n: number) => `in ${n.toLocaleString()} of ${info.total.toLocaleString()} ${info.unit}`;
      const mineWords = info.seq === "" ? "nothing: it deletes the reference here" : <>{cardSequence(info.seq)}</>;
      lines.push(
        <>
          <span className="pgv-var-nested">nested</span> · {info.versions} versions at this site among the {unit}; this walk reads {mineWords}
          {info.rank === 1
            ? ", the commonest"
            : info.diffs
              ? <>, which differs from the commonest {info.list[0].seq === "" ? "(nothing)" : cardSequence(info.list[0].seq ?? "")} as the chips show</>
              : ", not compared: the commonest version's bases were not sent"}
        </>,
      );
      if (info.merged) {
        lines.push(
          `one site of ${info.refLen.toLocaleString()} reference bases, merged from ${plural(info.merged.pairs, "anchor pair")}${info.merged.source === "chains" ? ", a top-level snarl of the graph's chains" : ""}: every walk's bases between the anchor before and the anchor after, the reference nodes it reads inside included`,
        );
        if (info.merged.partial) lines.push(`${plural(info.merged.partial, info.unit === "haplotypes" ? "haplotype" : "lane")} anchor only one end of it, neither, or the two in the other order (an inverted run): not counted`);
      }
      if (info.sites.length) lines.push(`the versions differ at ${plural(info.sites.length, "place")} along the commonest: ${info.sites.join("; ")}`);
      if (info.others) lines.push(`${plural(info.others, info.unit === "haplotypes" ? "haplotype" : "lane")} anchor other nodes over this stretch: counted at their own sites`);
      const items: CardItem[] = info.list.map((v, i) => ({
        key: `${part.index}:v${i}`,
        line: (
          <>
            {v.seq === "" ? "nothing" : v.seq !== null && v.seq.length <= 40 ? cardSequence(v.seq) : `${v.bases.toLocaleString()} bp`} · {of(v.count)}
            {v.commonest ? " · the commonest" : ""}
            {v.mine ? " · this walk's" : ""}
          </>
        ),
        details: [
          v.lanes.length ? `lanes on screen reading it: ${v.lanes.join(", ")}` : "no lane on screen reads it",
          v.nodes.length ? `${plural(v.nodes.length, "node")}: ${v.nodes.map((s) => `${s.id}${s.reverse ? " (reverse)" : ""}`).join(", ")}` : "no node: the walk goes from the anchor before straight to the anchor after",
        ],
      }));
      items.push({
        key: `${part.index}:straight`,
        line: <>{info.refLen ? "the reference's own bases" : "nothing inserted"} · {of(info.straight)} read straight across</>,
        details: [info.straightLanes.length ? `lanes on screen: ${info.straightLanes.join(", ")}` : "no lane on screen"],
      });
      groups.push({ head: `Versions here (${info.versions})`, items });
      /* A merged site's sealed sites inside, as vg deconstruct lists nested
         snarls: each with its own versions over the haplotypes in the band,
         and how many of the merged site's readers skip it. */
      if (info.merged?.inside.length) {
        groups.push({
          head: `Sites inside (${info.merged.inside.length})`,
          items: info.merged.inside.map((inner, i) => ({
            key: `${part.index}:inside${i}`,
            line: (
              <>
                {refCoord(inner.refLen ? span(inner.refAt, inner.refAt + inner.refLen) : where(inner.refAt))} · {inner.refLen ? `${inner.refLen.toLocaleString()} bp of reference` : "an insertion site"} ·{" "}
                {inner.versions.map((v) => `${v.seq === "" ? "nothing" : v.seq !== null && v.seq.length <= 24 ? v.seq : `${v.bases.toLocaleString()} bp`} in ${v.count.toLocaleString()}`).join(", ")}
                {inner.straight ? `; the reference's own in ${inner.straight.toLocaleString()}` : ""}
              </>
            ),
            details: [`${inner.skip.toLocaleString()} of the merged site's readers do not pass this site: they anchor other nodes over it`],
          })),
        });
      }
    }
    return { lines, groups };
  };

  const describeMark = (bar: BarRow, glyph: MarkGlyph): CardContent => {
    const { lane, row, raster } = bar;
    const parts = glyph.parts.map((index) => raster.parts[index]);
    /* A site glyph on letters: the versions are the card. */
    if (glyph.refLen !== undefined && parts.length === 1) {
      const part = parts[0];
      const info = part.nested?.[countOver];
      const versions = versionsCard(parts);
      return {
        title: `${lane.label} · ${info ? formText(info.forms[info.forms.length - 1]) : ""} bp at ${where(part.ref)}`,
        lines: [
          `a site read more than one way: the walk's bases for the ${glyph.refLen.toLocaleString()} reference bases between the anchor before and the anchor after; its letters on the bar are drawn against the reference, the label's chips against the commonest version`,
          ...versions.lines,
          rowLine(lane, row),
        ],
        groups: versions.groups,
      };
    }
    const items: CardItem[] = parts.map((part) => {
      const bubble = part.bubble !== null ? row.bubbles[part.bubble] : null;
      const side = part.ref <= (row.anchored?.[0] ?? -Infinity) ? "left" : "right";
      /* At an end: the bases between the junction and the node the walk
         goes to or comes from there. */
      const why = part.jump
        ? `the haplotype's own bases between here and ${where(part.jump.to)}, where its walk ${part.jump.before ? "comes from" : "goes on"}`
        : !bubble
          ? side === "left"
            ? "the haplotype's own bases between where it leaves the reference before the band and here"
            : "the haplotype's own bases between here and where it comes back to the reference past the band"
          : bubble.cls === "insertion"
            ? "an insertion: bases the reference does not have here"
            : bubble.cls === "mismatch+gap"
              ? "the surplus after the paired bases"
              : bubble.cls === "replacement"
                ? "the surplus of a replacement"
                : "inserted bases";
      /* Each node it holds, and where the reference reads it, if it does:
         a second pass over the reference shows here as its own bases. */
      const nodeLines = part.nodes.map((id): ReactNode => {
        const reads = referenceReads(id);
        return (
          <>
            node {id} · {(model.lengths.get(id) ?? 0).toLocaleString()} bp{reads ? ` · ${reads}` : ""}
          </>
        );
      });
      return {
        key: `${part.index}`,
        line: (
          <>
            +{part.len.toLocaleString()} bp {cardSequence(part.seq ?? "")} at {refCoord(where(part.ref))}
            {part.inverted ? " · inside an inverted run" : ""}
          </>
        ),
        details: [
          why,
          ...(part.own ? [<>alt {altCoord(`${row.contig}:${part.own.from.toLocaleString()}–${part.own.to.toLocaleString()}`)}{part.own.reverse ? " · on the reverse strand" : ""}</>] : []),
          ...nodeLines,
          ...(part.jump ? [jumpLine(part.jump)] : []),
          ...(bubble ? [bubbleLine(bubble, row)] : []),
          ...part.nodes.flatMap((id) => carriersLine(id)),
        ],
      };
    });
    /* Rule D: a mark at an insertion site with more than one version among
       the haplotypes counted (nestedMarks.ts). */
    const { lines: nestedLines, groups: nestedGroups } = versionsCard(parts);
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
        "bases the haplotype has here that the reference does not: shown after the bases they follow, taking no room",
        ...(parts.length > 1 ? [`${parts.length} insertions close together, ${glyph.bp.toLocaleString()} bp in all, drawn as one mark`] : []),
        ...nestedLines,
        rowLine(lane, row),
      ],
      groups: [...nestedGroups, { head: parts.length > 1 ? `Insertions (${parts.length})` : "Insertion", items }],
    };
  };

  const describeWhite = (bar: BarRow, white: WhiteRun): CardContent => {
    const { lane, row } = bar;
    const skipped = white.open === null ? referenceBases(white.refFrom, white.refTo) : "";
    /* Rule D at a deletion: the site's versions, where the band reads it
       more than one way. */
    const versions = white.part !== null ? versionsCard([bar.raster.parts[white.part]]) : { lines: [], groups: [] };
    return {
      title: `${lane.label} · deletion`,
      lines: [
        <>
          <span className={VARIANT_CLASS.deletion}>deletion</span> · −{deletionSize(white.bp)} of reference {refCoord(span(white.refFrom, white.refTo))}
        </>,
        white.open === "span"
          ? `the haplotype reads none of this: it goes from ${where(white.refFrom)} to ${where(white.refTo)}, both past what is drawn, with ${
              white.instead ? `${white.instead.toLocaleString()} bp of its own` : "nothing"
            } in between`
          : white.open === "right"
            ? `the haplotype reads the reference up to ${where(white.refFrom - 1)} and next at ${where(white.refTo)}${white.node ? ` (node ${white.node})` : ""}, past the band`
            : white.open === "left"
              ? `the haplotype reads the reference at ${where(white.refFrom - 1)}${white.node ? ` (node ${white.node})` : ""}, before the band, and next at ${where(white.refTo)}`
              : <>reference reads {cardSequence(skipped)}; the haplotype reads nothing here</>,
        ...sitesSkipped(white, lane),
        ...versions.lines,
        rowLine(lane, row),
      ],
      groups: versions.groups,
    };
  };

  /** A row's end where the walk leaves the reference for good. */
  const describeEnd = (bar: BarRow, cap: EndCap): CardContent => {
    const { lane, row } = bar;
    const end = cap.end;
    const ownLow = Math.min(end.own.from, end.own.to);
    const ownHigh = Math.max(end.own.from, end.own.to);
    return {
      title: `${lane.label} · missing data`,
      lines: [
        <>
          {coordLabel(`Reference (${referenceName})`)} {refCoord(where(end.ref))} · node {end.from}, where {lane.label} leaves the reference
        </>,
        ...openEndLines(lane, row, end),
        <>
          {coordLabel(`Alt path (${lane.label})`)} {altCoord(`${row.contig}:${ownLow.toLocaleString()}–${ownHigh.toLocaleString()}`)} ·{" "}
          {plural(end.nodes.length, "node")} past the junction, none of them the reference's
        </>,
        "not an allele: nothing says what reference these bases stand in for, so the row draws none of them",
        rowLine(lane, row),
      ],
      groups: [],
    };
  };

  /** What a lane with nothing drawn says of the search for its haplotype
      along the reference (locate.ts), or of its walks. */
  const lostWhy = (reason: string | undefined) =>
    reason === "contig ends" ? "its contig ends" : reason === "turns back" ? "its path turns back before crossing" : "too much of its own sequence";
  const absentText = (lane: LinearLane): string => {
    const found = lane.located;
    if (!found) {
      return lane.undrawn ? `${plural(lane.undrawn, "walk")} through the band's nodes, none reading its reference` : "nothing here";
    }
    if (found.state === "notSeen") return `not seen on the reference from ${where(found.from)} to ${where(found.to)}`;
    const off =
      found.seenAt === undefined
        ? ""
        : ` ${deletionSize(found.side === "left" ? model.origin - found.seenAt : found.seenAt - model.end)} to the ${found.side}`;
    if (found.state === "lost") return `seen${off}, not followed across: ${lostWhy(found.reason)}`;
    return `seen${off}`;
  };
  const describeAbsent = (lane: LinearLane): CardContent => {
    const found = lane.located;
    if (!found) {
      return {
        title: `${lane.label} · nothing drawn`,
        lines: [
          lane.undrawn
            ? `${plural(lane.undrawn, "walk")} of ${lane.label} pass through nodes of this band, but none reads a node of the reference walk here, so there is nothing to place`
            : `no walk of ${lane.label} passes through the nodes fetched for this band`,
        ],
        groups: [],
      };
    }
    return {
      title: `${lane.label} · nothing here`,
      lines: [
        `no walk of ${lane.label} passes through the nodes fetched for this band`,
        `searched the reference from ${where(found.from)} to ${where(found.to)} for one of its sampled visits: ${found.seenAt === undefined ? "none" : `one at ${where(found.seenAt)}`}`,
        ...(found.state === "lost"
          ? [
              found.reason === "turns back"
                ? "followed from there, its path turned back along the reference before crossing the band"
                : `followed from there, its path ${found.reason === "contig ends" ? "ended" : "ran more than 100 kb of its own sequence"} before reaching the reference past the band`,
            ]
          : []),
        "a path's visits are sampled one in a hundred, so a haplotype that reads the reference only briefly in the stretch searched can be missed",
      ],
      groups: [],
    };
  };

  /** A variant's bubble, where it is one: bins.ts keys it by its index. */
  const variantBubble = (row: Row, variant: BinVariant): RowBubble | null =>
    /^\d+$/.test(variant.key) ? row.bubbles[Number(variant.key)] ?? null : null;
  /** A variant that is no bubble, in words: a white running out of the
      band, a span, or an insertion at the band's edge. */
  const variantWords = (variant: BinVariant): string =>
    variant.key === "span"
      ? `the haplotype reads none of the band from ${where(variant.home)}: it goes on past both its ends`
      : variant.key.startsWith("mark:")
        ? `at the band's edge, before the walk goes on along the reference`
        : `running out of the band to the ${variant.key === "out:left" ? "left" : "right"}, from ${where(variant.home)}${
            variant.inserted ? `, with ${variant.inserted.toLocaleString()} bp of its own` : ""
          }`;

  /**
   * Zoomed out: the bin round the pointer, from `from` to before `to`, on
   * one row, added up from the row's bins (bins.ts) and what the row draws
   * of them (barTiers.ts). Its bases, aligned, deleted and not read; its
   * variants by kind, inversions apart; the bases they insert; the
   * deletions too small to see that start in it; the part under the
   * pointer. Then lists, each the largest first: the variants homed in it,
   * as many as the count line counts; apart from them, the inversions
   * homed in it, which are listed but not counted, and the big variants
   * homed in another bin that only cross it. Its button, on the kept card,
   * zooms in on it.
   */
  const describeBin = (bar: BarRow, from: number, to: number, at: number): CardContent | null => {
    const { lane, row, bins, tiers } = bar;
    if (!binned || !bins || !tiers) return null;
    const B = binned.binBp;
    const i0 = Math.max(0, Math.floor(from / B) - binned.first);
    const i1 = Math.min(binned.count, Math.ceil(to / B) - binned.first);
    const sum = (field: Int32Array) => {
      let n = 0;
      for (let i = i0; i < i1; i++) n += field[i];
      return n;
    };
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
    const crossing = tiers.big.filter((big) => !homedHere(bins.list[big.variant]) && big.left < right && big.right > left).map((big) => big.variant);

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
    const hit = hitAt(bar.raster, at);

    /* How each listed variant is drawn at this zoom. */
    const big = new Set(tiers.big.map((one) => one.variant));
    const ticked = new Set(tiers.ticks.map((tick) => tick.variant));
    const stripeOf = new Map(tiers.stripes.map((stripe) => [stripe.bin, stripe]));
    const whiteOf = new Map<number, TierWhite>();
    for (const white of tiers.whites) if (white.variant !== null) whiteOf.set(white.variant, white);
    const drawnAs = (index: number, variant: BinVariant): string | null => {
      if (variant.kind === "inversion") return "drawn by arrows: its bases are read on the other strand";
      if (variant.kind === "deletion") {
        const white = whiteOf.get(index);
        if (white) return white.drawn ? "drawn as a white gap at its true width" : "too small to see: counted in the track's legend";
      }
      if (big.has(index)) return "drawn as itself";
      if (ticked.has(index)) return "drawn as a tick at its base";
      const stripe = variant.bin !== null ? stripeOf.get(variant.bin) : undefined;
      if (stripe && variant.counted) return `in a grey stripe: small variants are dense here, ${tiers.cells[stripe.cell].rate.toFixed(1)} per kb`;
      return null;
    };
    /* Rule D zoomed out: a variant whose site the haplotypes counted read
       more than one way (nestedMarks.ts), by its bubble's first changed
       part. */
    const nestedOfVariant = (variant: BinVariant): NestedMark | null => {
      if (!/^d+$/.test(variant.key)) return null;
      const b = Number(variant.key);
      const first = row.parts.filter((part) => part.bubble === b && part.kind !== "match").sort((x, y) => x.ref - y.ref)[0];
      return first?.nested?.[countOver] ?? null;
    };
    const unitWords = countOver === "all" ? "the haplotypes in the band" : "the lanes on screen";
    const itemOf = (index: number): CardItem => {
      const variant = bins.list[index];
      const place = variant.kind === "insertion" ? variant.home + 1 : variant.home;
      const size = variant.size.toLocaleString();
      const bubble = variantBubble(row, variant);
      const how = drawnAs(index, variant);
      const info = nestedOfVariant(variant);
      return {
        key: `variant ${index}`,
        line: (
          <>
            {info ? <><span className="pgv-var-nested">nested</span> · </> : null}
            <span className={KIND_CLASS[variant.kind]}>{variant.kind}</span> · {variant.kind === "insertion" ? `+${size}` : variant.kind === "deletion" ? `−${size}` : size} bp at{" "}
            {refCoord(where(place))}
          </>
        ),
        details: [
          bubble ? bubbleLine(bubble, row) : variantWords(variant),
          ...(how ? [how] : []),
          ...(info
            ? [
                `read ${info.versions} ways among ${unitWords}: this walk's version ${formText(info.forms[info.forms.length - 1])}${info.seq ? ` ${info.seq.length <= 40 ? info.seq : `(${info.seq.length.toLocaleString()} bp)`}` : " (nothing)"}, in ${info.count.toLocaleString()} of ${info.total.toLocaleString()} ${info.unit}${info.rank === 1 ? ", the commonest" : ""}; ${info.straight.toLocaleString()} read straight across${info.others ? `; ${info.others.toLocaleString()} anchor other nodes` : ""}`,
                ...(info.sites.length ? [info.sites.join("; ")] : []),
              ]
            : []),
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

    const lines: ReactNode[] = [
      `${sum(bins.bases).toLocaleString()} bp: ${sum(bins.aligned).toLocaleString()} aligned${reverse ? ` (${reverse.toLocaleString()} read on the other strand)` : ""}, ${sum(bins.deleted).toLocaleString()} deleted${
        notRead ? `, ${notRead.toLocaleString()} not read by this walk` : ""
      }`,
      variants ? `${plural(variants, "variant")}: ${counts.join(", ")}` : "no variants",
      ...(() => {
        const n = homed.filter((index) => bins.list[index].counted && nestedOfVariant(bins.list[index])).length;
        return n ? [`${plural(n, "site")} read more than one way among ${unitWords}: listed as nested below`] : [];
      })(),
      ...(inversions ? [`${plural(inversions, "inversion")} as well, not counted: ${inversions === 1 ? "its" : "their"} bases count as read on the other strand`] : []),
      ...(inserted ? [`${inserted.toLocaleString()} bp inserted, which the reference does not have`] : []),
      ...(hidden ? [`${plural(hidden, "deletion")} too small to see, counted in the track's legend`] : []),
      rowLine(lane, row),
      hit ? (
        <>
          under the pointer: {PART_WORDS[hit.part.kind] ?? hit.part.kind}, at {refCoord(where(hit.part.ref + hit.offset))}
        </>
      ) : (
        <>under the pointer: {refCoord(where(Math.floor(axis.bpAt(at))))}, where this walk has no bases</>
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
  /** The bar's height in a row: under the marks' band. */
  const barHeight = (bar: BarRow) => bar.height - MARK_BAND - 1;
  /** A row's end and the empty stretch past it, outlined. */
  const capBox = (bar: BarRow, cap: EndCap) => {
    const x = Math.min(cap.left, cap.x - 3);
    return { x, y: bar.top + MARK_BAND, width: Math.max(cap.right, cap.x + 3) - x, height: barHeight(bar) };
  };
  /** A bin of a row, outlined over the bar. */
  const binBox = (bar: BarRow, from: number, to: number) => ({ x: axis.px(from), y: bar.top + MARK_BAND, width: axis.px(to) - axis.px(from), height: barHeight(bar) });
  const boxOf = (bar: BarRow, target: BarTarget) => {
    if (target.kind === "base") return { x: target.part.left, y: bar.top + MARK_BAND, width: target.part.right - target.part.left, height: barHeight(bar) };
    if (target.kind === "mark") return { x: target.glyph.x - 5, y: bar.top, width: 10, height: MARK_BAND + 2 };
    if (target.kind === "end") return capBox(bar, target.cap);
    if (target.kind === "bin") return binBox(bar, target.from, target.to);
    return { x: target.white.left, y: bar.top + MARK_BAND, width: target.white.right - target.white.left, height: barHeight(bar) };
  };
  const onBarHover = (bar: BarRow, target: BarTarget | null) => {
    if (!target || cardKeptOpen()) {
      outline(null);
      hideHover();
      return;
    }
    outline(boxOf(bar, target));
    if (target.kind === "base") {
      const { part, offset, bp, zoom } = target;
      showHover(`base:${bar.key}:${part.index}:${offset}`, () => describeBase(bar, part, offset, bp, zoom), target.x, target.y);
    } else if (target.kind === "mark") {
      showHover(`mark:${bar.key}:${target.glyph.x}`, () => describeMark(bar, target.glyph), target.x, target.y);
    } else if (target.kind === "end") {
      showHover(`end:${bar.key}:${target.cap.x}`, () => describeEnd(bar, target.cap), target.x, target.y);
    } else if (target.kind === "bin") {
      /* Built again only when the part under the pointer changes, which
         its last line names. */
      const { from, to, at } = target;
      const hit = hitAt(bar.raster, at);
      showHover(`bin:${bar.key}:${from}:${hit ? `${hit.part.index}:${hit.offset}` : ""}`, () => describeBin(bar, from, to, at), target.x, target.y);
    } else {
      showHover(`white:${bar.key}:${target.white.left}`, () => describeWhite(bar, target.white), target.x, target.y);
    }
  };
  const onBarPick = (bar: BarRow, target: BarTarget) => {
    if (target.kind === "base") {
      keep(describeBase(bar, target.part, target.offset, target.bp, target.zoom), { kind: "base", row: bar.key, part: target.part.index }, target.x, target.y);
    } else if (target.kind === "mark") {
      keep(describeMark(bar, target.glyph), { kind: "mark", row: bar.key, glyph: bar.raster.marks.indexOf(target.glyph) }, target.x, target.y);
    } else if (target.kind === "end") {
      keep(describeEnd(bar, target.cap), { kind: "end", row: bar.key, cap: bar.raster.caps.indexOf(target.cap) }, target.x, target.y);
    } else if (target.kind === "bin") {
      keep(describeBin(bar, target.from, target.to, target.at), { kind: "bin", row: bar.key, from: target.from, to: target.to }, target.x, target.y);
    } else {
      keep(describeWhite(bar, target.white), { kind: "white", row: bar.key, white: bar.raster.whites.indexOf(target.white) }, target.x, target.y);
    }
  };

  /* A haplotype's rows are lit or dimmed as their haplotype is. */
  const dim = (lane: LinearLane) => highlight !== null && highlight !== lane.key;

  /* What a kept card is about, outlined where it is drawn. */
  const kept = card?.target ?? null;
  const keptBox = (() => {
    if (!kept) return null;
    const bar = rowByKey.get(kept.row);
    if (!bar) return null;
    if (kept.kind === "base") {
      const part = bar.raster.parts[kept.part];
      return part ? { x: part.left, y: bar.top + MARK_BAND, width: part.right - part.left, height: barHeight(bar) } : null;
    }
    if (kept.kind === "mark") {
      const glyph = bar.raster.marks[kept.glyph];
      return glyph ? { x: glyph.x - 5, y: bar.top, width: 10, height: MARK_BAND + 2 } : null;
    }
    if (kept.kind === "white") {
      const white = bar.raster.whites[kept.white];
      return white ? { x: white.left, y: bar.top + MARK_BAND, width: white.right - white.left, height: barHeight(bar) } : null;
    }
    if (kept.kind === "end") {
      const cap = bar.raster.caps[kept.cap];
      return cap ? capBox(bar, cap) : null;
    }
    return binBox(bar, kept.from, kept.to);
  })();

  /* Lanes with nothing drawn: their words, where their one row would be. */
  const emptyLanes = layout.rows
    .filter((slot) => slot.rows === 0)
    .map((slot) => ({ slot, lane: model.lanes.find((lane) => lane.key === slot.key) }))
    .filter((one): one is { slot: (typeof layout.rows)[number]; lane: LinearLane } => !!one.lane);

  return (
    <div className="pgv-linear" style={{ width, height }} onMouseLeave={hideHover}>
      {/* ── The rows ────────────────────────────────────────────────── */}
      {rows.map((bar) => (
        <div key={bar.key} className="pgv-lane-slot" style={{ top: bar.top, height: bar.height }}>
          <BarCanvas
            raster={bar.raster}
            width={width}
            height={bar.height}
            color={bar.lane.color}
            view={[axis.viewFromPx, axis.viewToPx]}
            dim={dim(bar.lane)}
            /* Zoomed out, the row's tiers: it is drawn from them, and a
               hover or a click reads the bin round the pointer. */
            tiers={bar.tiers ?? undefined}
            binAt={bar.tiers ? binAt : undefined}
            onHover={(target) => onBarHover(bar, target)}
            onPick={(target) => onBarPick(bar, target)}
          />
        </div>
      ))}
      {emptyLanes.map(({ slot, lane }) => (
        <div key={slot.key} className="pgv-lane-slot" style={{ top: slot.top + rowTop(0), height: ROW_H }}>
          <div
            className="pgv-absent"
            onMouseMove={(event) => showHover(`absent:${lane.key}`, () => describeAbsent(lane), event.clientX, event.clientY)}
            onMouseLeave={hideHover}
          >
            {absentText(lane)}
          </div>
        </div>
      ))}

      <svg className="pgv-svg pgv-over" width={width} height={height}>
        {/* The foot of each lane. */}
        {layout.rows.map((slot) => (
          <line key={`rule-${slot.key}`} className="pgv-row-rule" x1={0} x2={width} y1={slot.top + slot.height - 0.5} y2={slot.top + slot.height - 0.5} />
        ))}
        {/* Each row's name: the walk's contig and own coordinates. */}
        {rows.map((bar) => (
          <text key={`name-${bar.key}`} x={axis.viewFromPx + 4} y={bar.top - 3} className="pgv-walk-label">
            {rowName(bar.row)}
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
