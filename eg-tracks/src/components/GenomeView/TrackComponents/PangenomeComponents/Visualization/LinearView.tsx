import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { LinearLane, LinearModel, Reading, StripNode } from "./linearModel";
import type { LinearAxis } from "./linearAxis";
import { rasteriseBar } from "./barRaster";
import type { BarRaster, MarkGlyph, RasterPart, WhiteRun } from "./barRaster";
import BarCanvas, { MARK_BAND } from "./BarCanvas";
import type { BarTarget } from "./BarCanvas";
import { CardBody, HoverCard, cardKeptOpen, cardSequence } from "./Cards";
import type { CardContent, CardItem, CardZoom, HoverCardHandle } from "./Cards";
import FloatingCard from "./FloatingCard";
import { FOOT_PAD, NODE_H, laneLayout } from "./laneLayout";
import { baseCentres, sequenceSize } from "./nodeDetail";
import { deletionSize } from "./pangenomeModel";
import type { NodeLetters } from "./letters";
import type { BrowserClass, Bubble } from "./alignment";

/* ══════════════════════════════════════════════════════════════════════════
   The linear view: the graph strip under the ruler, and a bar per
   haplotype under it, on the reference's own axis.

   Every bar is the reference's length. What a haplotype has that the
   reference does not is a mark that takes no room; what it lacks is white;
   what differs over the same bases is letters; a stretch read backwards is
   arrowed; a run that touches the reference at one end only is hatched
   out from the junction. See linearModel.ts for how that is worked out and
   BarCanvas.tsx for how it is painted. The strip shows the reference's
   nodes at their coordinates and, when asked, the alleles under them,
   each where the first reading that takes it puts its bases.

   A hover shows a card and a click keeps it. Zoomed out past a letter a
   base, the strip is read a section at a time, and so are the bars.

   "Show walks" draws a haplotype's readings a row each instead of its one
   bar: the same parts, each reading's own, over the reference it anchors
   to, in walk order.
   ══════════════════════════════════════════════════════════════════════════ */

/* Below this a letter is a smudge, so none is drawn and the strip is read
   in sections. */
const SEQUENCE_MIN_SIZE = 4;
/* Neighbouring nodes are joined into a section until it is this wide. */
const SECTION_PX = 16;
/* A bar is read part by part out to this many bases a pixel, as
   genomealign's fine mode is; past it, a section at a time. */
export const BAR_NODE_BASES_PER_PX = 10;
/** How far the strip's ground reaches above it, to meet the ruler's own. */
const STRIP_GROUND_PAD = 4;
/** A walk row's bar, and the room above it for its name. */
export const WALK_ROW_H = 36;
const WALK_ROW_GAP = 14;
const WALK_FOOT = 6;

export const walkRowTop = (row: number) => WALK_ROW_GAP + row * (WALK_ROW_H + WALK_ROW_GAP);

/** The rows the layout is built on: the lanes, and the strip's rows. */
const layoutOf = (model: LinearModel, alleleRows: boolean, strip: boolean) =>
  laneLayout({ lanes: model.lanes, rowCount: model.stripRows }, alleleRows, strip);

/** How tall the drawing comes out: the strip and a bar per haplotype. */
export function linearHeight(model: LinearModel, alleleRows: boolean, strip = true): number {
  return layoutOf(model, alleleRows, strip).height;
}

/** The haplotype a model drawn as one track row holds. */
const laneOf = (model: LinearModel) => model.lanes.find((lane) => !lane.isReference);

/** A haplotype's readings in walk order, those the bar draws. */
const readingsOf = (lane: LinearLane) => lane.readings.filter((reading) => reading.drawn);

/** Whether "Show walks" has anything to draw for this band's haplotype. */
export function walksShown(model: LinearModel): boolean {
  const lane = laneOf(model);
  return !!lane && readingsOf(lane).length > 0;
}

/** How tall the walks are: a row per reading. */
export function walksHeight(model: LinearModel): number {
  const lane = laneOf(model);
  const rows = Math.max(1, lane ? readingsOf(lane).length : 0);
  return walkRowTop(rows) - WALK_ROW_GAP + WALK_FOOT;
}

/** A section of the strip, zoomed out: neighbouring nodes read as one. */
interface StripSection {
  left: number;
  right: number;
  nodes: StripNode[];
}

/** What a kept card is about, outlined in the drawing. */
type CardTarget =
  | { kind: "base"; row: string; part: number }
  | { kind: "mark"; row: string; glyph: number }
  | { kind: "white"; row: string; white: number }
  | { kind: "node"; id: string }
  | { kind: "section"; row: string; left: number; right: number };

interface KeptCard extends CardContent {
  x: number;
  y: number;
  target: CardTarget;
}

/** One row of bars: a haplotype's bar, or one reading of it. */
interface BarRow {
  key: string;
  lane: LinearLane;
  /** The reading, when the row is one of a walk's. */
  reading: Reading | null;
  top: number;
  height: number;
  raster: BarRaster;
}

interface LinearViewProps {
  model: LinearModel;
  axis: LinearAxis;
  /** Lane key to keep lit; every other lane is dimmed. */
  highlight: string | null;
  /** Draw the alleles under the reference in the strip. */
  alleleRows: boolean;
  /** Zoomed out, a haplotype's section is hatched only where more than
      this many of its bases there are off the reference. */
  sectionAltBp?: number;
  /** Whether the graph strip is drawn. Off, only the bars: one haplotype
      as a track row of its own. */
  strip?: boolean;
  /** One haplotype's row drawn as its readings, a row each. */
  walks?: boolean;
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

function LinearView({
  model,
  axis,
  highlight,
  alleleRows,
  sectionAltBp = 0,
  strip = true,
  walks = false,
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
  /* The strip's node under the pointer: lit in every bar that carries it. */
  const [litNode, setLitNode] = useState<string | null>(null);
  const hoverBoxRef = useRef<SVGRectElement>(null);

  /* ── Rows ────────────────────────────────────────────────────────────── */
  const layout = useMemo(() => layoutOf(model, alleleRows, strip), [model, alleleRows, strip]);
  const { stripTop, stripH } = layout;
  const walkLane = walks && !strip ? laneOf(model) : undefined;
  const rows = useMemo<BarRow[]>(() => {
    const make = (key: string, lane: LinearLane, reading: Reading | null, top: number, height: number): BarRow => ({
      key,
      lane,
      reading,
      top,
      height,
      raster: rasteriseBar(
        key,
        reading ? reading.parts : lane.drawn,
        reading ? reading.outOfBand : lane.outOfBand,
        lane.readings,
        model.graph,
        px,
        width,
        axis.startBp,
        axis.endBp,
      ),
    });
    if (walkLane) {
      return readingsOf(walkLane).map((reading, k) =>
        make(`${walkLane.key} reading ${reading.index}`, walkLane, reading, walkRowTop(k), WALK_ROW_H),
      );
    }
    const out: BarRow[] = [];
    for (const row of layout.rows) {
      if (row.isReference) continue;
      const lane = model.lanes.find((candidate) => candidate.key === row.key);
      if (lane) out.push(make(lane.key, lane, null, row.top, row.height));
    }
    return out;
  }, [model, axis, px, width, layout, walkLane]);
  const rowByKey = useMemo(() => new Map(rows.map((row) => [row.key, row])), [rows]);
  const height = walkLane ? walksHeight(model) : layout.height;

  /* ── The strip's nodes, and its sections zoomed out ─────────────────── */
  const stripNodes = useMemo(() => {
    const nodes = [...model.nodes.values()].filter((node) => alleleRows || node.onReference);
    return nodes.sort((a, b) => a.ref - b.ref || a.row - b.row);
  }, [model, alleleRows]);
  const sections = useMemo<StripSection[] | null>(() => {
    if (sequenceSize(scale) >= SEQUENCE_MIN_SIZE) return null;
    const placed = stripNodes
      .map((node) => ({ node, left: px(node.ref), right: px(node.ref + Math.max(node.width, 0)) }))
      .sort((a, b) => a.left - b.left || a.right - b.right);
    const out: StripSection[] = [];
    let open: StripSection | null = null;
    for (const { node, left, right } of placed) {
      if (open && (left < open.right - 0.5 || open.right - open.left < SECTION_PX)) {
        open.nodes.push(node);
        open.right = Math.max(open.right, right);
        continue;
      }
      open = { left, right: Math.max(right, left + 1), nodes: [node] };
      out.push(open);
    }
    return out;
  }, [stripNodes, px, scale]);
  useEffect(() => setCard(null), [sections]);
  const barsByNode = !sections || 1 / scale < BAR_NODE_BASES_PER_PX;
  const sectionAt = (x: number) =>
    sections?.find((section) => x >= section.left && x < section.right) ?? null;

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
  /** The other readings of a lane that read a reference position: dupes. */
  const dupesAt = (lane: LinearLane, reading: number, ref: number): CardItem[] =>
    lane.readings
      .filter((other) => other.drawn && other.index !== reading && other.refFrom <= ref && ref < other.refTo)
      .map((other) => ({
        key: `${other.index}`,
        line: (
          <>
            reading {other.index + 1} · {altCoord(`${other.contig}:${other.ownFrom.toLocaleString()}–${other.ownTo.toLocaleString()}`)}{" "}
            · reads {refCoord(span(other.refFrom, other.refTo))}
          </>
        ),
        details: [`the haplotype has this place more than once; the bar draws the first along its contig`],
      }));

  const describeBase = (row: BarRow, part: RasterPart, offset: number, bp: number, zoom: NodeLetters | null): CardContent => {
    const { lane } = row;
    const reading = lane.readings[part.reading];
    const step = Number.isFinite(bp) ? stepAtOwn(reading, bp) : null;
    const node = step ? model.nodes.get(step.node) ?? null : null;
    const refAt = part.kind === "open" ? null : part.ref + offset;
    const bubble = bubbleOf(reading, part.bubble);
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
      ...(row.reading ? [`reading ${reading.index + 1} of ${readingsOf(lane).length}: ${reading.contig} ${reading.ownFrom.toLocaleString()}–${reading.ownTo.toLocaleString()}`] : []),
    ];
    const dupes = refAt !== null ? dupesAt(lane, reading.index, refAt) : [];
    return {
      title: `${lane.label}${node ? ` · node ${node.id}` : ""}`,
      zoom: zoomOf(zoom, reading.contig),
      lines,
      groups: dupes.length ? [{ head: `Dupes (${dupes.length})`, items: dupes }] : [],
    };
  };

  const describeMark = (row: BarRow, glyph: MarkGlyph): CardContent => {
    const { lane, raster } = row;
    const parts = glyph.parts.map((index) => raster.parts[index]);
    const items: CardItem[] = parts.map((part) => {
      const reading = lane.readings[part.reading];
      const bubble = bubbleOf(reading, part.bubble);
      const why =
        bubble?.cls === "open"
          ? "the haplotype's own bases before it leaves the band"
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
          ...(bubble ? [bubbleLine(bubble, reading, lane)] : []),
          ...part.nodes.flatMap((id) => carriersLine(id)),
        ],
      };
    });
    return {
      title: `${lane.label} · +${glyph.bp.toLocaleString()} bp inserted at ${where(axis.bpAt(glyph.x) | 0)}`,
      lines: [
        "bases the haplotype has here that the reference does not: shown after the bases they replace, taking no room",
        ...(parts.length > 1 ? [`${parts.length} insertions close together, drawn as one mark`] : []),
      ],
      groups: [{ head: parts.length > 1 ? `Insertions (${parts.length})` : "Insertion", items }],
    };
  };

  const describeWhite = (row: BarRow, white: WhiteRun): CardContent => {
    const { lane } = row;
    const reading = lane.readings[white.reading];
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
            ? `the haplotype leaves the reference at ${where(white.refFrom)} for ${where(white.refTo)}, past what was fetched`
            : white.open === "left"
              ? `the haplotype comes to ${where(white.refTo)} from ${where(white.refFrom)}, before what was fetched`
              : <>reference reads {cardSequence(skipped)}; the haplotype reads nothing here</>,
        `reading ${reading.index + 1}: ${reading.contig} ${reading.ownFrom.toLocaleString()}–${reading.ownTo.toLocaleString()}`,
      ],
      groups: [],
    };
  };

  /** What a lane with nothing drawn says of the search for its haplotype
      along the reference (locate.ts). */
  const absentText = (lane: LinearLane): string => {
    const found = lane.located!;
    const reach = Math.max(model.origin - found.from, found.to - model.end);
    if (found.state === "notSeen") return `not seen on the reference within ${deletionSize(reach)}`;
    const off =
      found.seenAt === undefined
        ? ""
        : ` ${deletionSize(found.side === "left" ? model.origin - found.seenAt : found.seenAt - model.end)} to the ${found.side}`;
    if (found.state === "lost") {
      return `seen${off}, not followed across: ${found.reason === "contig ends" ? "its contig ends" : "too much of its own sequence"}`;
    }
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
              `followed from there, its path ${
                found.reason === "contig ends" ? "ended" : "ran more than 100 kb of its own sequence"
              } before reaching the reference past the band`,
            ]
          : []),
        "a path's visits are sampled one in a hundred, so a haplotype that reads the reference only briefly in the stretch searched can be missed",
      ],
      groups: [],
    };
  };

  const describeNode = (node: StripNode): CardContent => {
    const names = [...new Set(node.lanes)];
    return {
      title: `node ${node.id}`,
      lines: [
        <>
          {coordLabel(`Reference (${referenceName})`)}{" "}
          {refCoord(
            node.onReference
              ? span(node.ref, node.ref + node.length)
              : node.width > 0
                ? span(node.ref, node.ref + node.width)
                : where(node.ref),
          )}{" "}
          ·{" "}
          {node.onReference
            ? `${node.length.toLocaleString()} bp`
            : node.width > 0
              ? `the ${node.width.toLocaleString()} bp it stands in for${node.mark ? ", the rest inserted" : ""}`
              : "inserted here, no room"}
        </>,
        node.onReference ? "on the reference walk" : "an alternative to the reference here",
        ...(node.placedBy ? [`placed by ${node.placedBy.lane}'s reading ${node.placedBy.reading + 1}`] : []),
        <>reads {cardSequence(node.sequence)}</>,
        `in the rows shown: ${names.length ? names.join(", ") : "none"}`,
        ...carriersLine(node.id),
      ],
      groups: [],
    };
  };

  /** Zoomed out: what a haplotype does in a section of the band. */
  const describeSection = (row: BarRow, section: { left: number; right: number }): CardContent => {
    const { lane, raster } = row;
    const inside = raster.parts.filter(
      (part) => part.right > section.left && part.left < section.right && part.kind !== "match",
    );
    const whites = raster.whites.filter((white) => white.right > section.left && white.left < section.right);
    const counts = new Map<string, number>();
    for (const part of inside) counts.set(part.kind, (counts.get(part.kind) ?? 0) + part.len);
    const refFrom = Math.round(axis.bpAt(section.left));
    const refTo = Math.round(axis.bpAt(section.right));
    const items: CardItem[] = [
      ...inside.map((part) => {
        const reading = lane.readings[part.reading];
        const bubble = bubbleOf(reading, part.bubble);
        return {
          key: `part ${part.index}`,
          line: (
            <>
              {part.kind} · {part.len.toLocaleString()} bp at {refCoord(where(part.ref))}
            </>
          ),
          details: [...(bubble ? [bubbleLine(bubble, reading, lane)] : []), ...(part.seq ? [<>reads {cardSequence(part.seq)}</>] : [])],
        };
      }),
      ...whites.map((white, k) => ({
        key: `white ${k}`,
        line: (
          <>
            <span className={VARIANT_CLASS.deletion}>deletion</span> · −{deletionSize(white.bp)} at {refCoord(span(white.refFrom, white.refTo))}
          </>
        ),
        details: [],
      })),
    ];
    return {
      title: lane.label,
      lines: [
        <>
          {coordLabel(`Reference (${referenceName})`)} {refCoord(span(refFrom, refTo))} · {(refTo - refFrom).toLocaleString()} bp
        </>,
        counts.size || whites.length
          ? `${[...counts].map(([kind, bp]) => `${bp.toLocaleString()} bp ${kind}`).join(" · ")}${whites.length ? ` · ${plural(whites.length, "deletion")}` : ""}`
          : "reads as the reference does here",
      ],
      groups: [{ head: `Changes (${items.length})`, items }],
    };
  };

  const describeStripSection = (section: StripSection): CardContent => {
    const refs = section.nodes.filter((node) => node.onReference);
    const alts = section.nodes.filter((node) => !node.onReference);
    const refFrom = Math.min(...section.nodes.map((node) => node.ref));
    const refTo = Math.max(...section.nodes.map((node) => node.ref + Math.max(node.width, 1)));
    const item = (node: StripNode): CardItem => ({
      key: node.id,
      line: (
        <>
          node {node.id} · {node.length.toLocaleString()} bp · {refCoord(node.width > 0 ? span(node.ref, node.ref + node.width) : where(node.ref))}
        </>
      ),
      details: [<>reads {cardSequence(node.sequence)}</>, `in the rows shown: ${[...new Set(node.lanes)].join(", ") || "none"}`, ...carriersLine(node.id)],
    });
    return {
      title: "graph",
      lines: [
        <>
          {coordLabel(`Reference (${referenceName})`)} {refCoord(span(refFrom, refTo))} · {(refTo - refFrom).toLocaleString()} bp
        </>,
        `${plural(section.nodes.length, "node")}: ${refs.length} reference, ${alts.length} alt`,
      ],
      groups: [
        { head: `Alt nodes (${alts.length})`, items: alts.map(item) },
        { head: `Reference nodes (${refs.length})`, items: refs.map(item) },
      ],
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
    setLitNode(null);
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
  const boxOf = (row: BarRow, target: BarTarget) => {
    if (target.kind === "base") {
      return { x: target.part.left, y: row.top + MARK_BAND, width: target.part.right - target.part.left, height: row.height - MARK_BAND - 1 };
    }
    if (target.kind === "mark") {
      return { x: target.glyph.x - 5, y: row.top, width: 10, height: MARK_BAND + 2 };
    }
    return { x: target.white.left, y: row.top + MARK_BAND, width: target.white.right - target.white.left, height: row.height - MARK_BAND - 1 };
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
    } else {
      showHover(`white:${row.key}:${target.white.left}`, () => describeWhite(row, target.white), target.x, target.y);
    }
  };
  const onBarPick = (row: BarRow, target: BarTarget) => {
    if (target.kind === "base") {
      keep(describeBase(row, target.part, target.offset, target.bp, target.zoom), { kind: "base", row: row.key, part: target.part.index }, target.x, target.y);
    } else if (target.kind === "mark") {
      keep(describeMark(row, target.glyph), { kind: "mark", row: row.key, glyph: row.raster.marks.indexOf(target.glyph) }, target.x, target.y);
    } else {
      keep(describeWhite(row, target.white), { kind: "white", row: row.key, white: row.raster.whites.indexOf(target.white) }, target.x, target.y);
    }
  };

  /* A walk's rows are lit or dimmed as their haplotype is. */
  const dim = (lane: LinearLane) => highlight !== null && highlight !== lane.key;

  /* Where a lit strip node is drawn in each bar. */
  const litSpans: Array<{ key: string; x: number; width: number; y: number; height: number }> = [];
  if (litNode) {
    for (const row of rows) {
      for (const part of row.raster.parts) {
        if (!part.nodes.includes(litNode) || !(part.right > part.left)) continue;
        litSpans.push({
          key: `${row.key}:${part.index}`,
          x: part.left,
          width: part.right - part.left,
          y: row.top + MARK_BAND,
          height: row.height - MARK_BAND - 1,
        });
      }
    }
  }
  /* What a kept card is about, outlined where it is drawn. */
  const kept = card?.target ?? null;
  const keptBox = (() => {
    if (!kept) return null;
    if (kept.kind === "node") {
      const node = model.nodes.get(kept.id);
      if (!node || !(alleleRows || node.onReference)) return null;
      const x = px(node.ref);
      return { x, y: stripTop + node.row * NODE_H, width: Math.max(1, px(node.ref + node.width) - x), height: NODE_H };
    }
    const row = rowByKey.get(kept.row);
    if (!row) return null;
    if (kept.kind === "base") {
      const part = row.raster.parts[kept.part];
      return part ? { x: part.left, y: row.top + MARK_BAND, width: part.right - part.left, height: row.height - MARK_BAND - 1 } : null;
    }
    if (kept.kind === "mark") {
      const glyph = row.raster.marks[kept.glyph];
      return glyph ? { x: glyph.x - 5, y: row.top, width: 10, height: MARK_BAND + 2 } : null;
    }
    if (kept.kind === "white") {
      const white = row.raster.whites[kept.white];
      return white ? { x: white.left, y: row.top + MARK_BAND, width: white.right - white.left, height: row.height - MARK_BAND - 1 } : null;
    }
    return { x: kept.left, y: row.top, width: kept.right - kept.left, height: row.height };
  })();

  /* ── Keeping the strip in sight ─────────────────────────────────────── */
  const svgRef = useRef<SVGSVGElement>(null);
  const stickyRef = useRef<SVGGElement>(null);
  useEffect(() => {
    const svg = svgRef.current;
    const group = stickyRef.current;
    if (!svg || !group) return;
    let queued = 0;
    const place = () => {
      queued = 0;
      const box = svg.getBoundingClientRect();
      const panel = document.querySelector(".pgv-panel");
      const pinTop = Math.max(0, panel ? panel.getBoundingClientRect().bottom : 0);
      const room = height - FOOT_PAD - (stripTop + stripH);
      const shift = Math.max(0, Math.min(pinTop - box.top, room));
      group.setAttribute("transform", shift > 0 ? `translate(0, ${Math.round(shift)})` : "");
    };
    const onMove = () => {
      if (!queued) queued = requestAnimationFrame(place);
    };
    place();
    window.addEventListener("scroll", onMove, { passive: true, capture: true });
    window.addEventListener("resize", onMove);
    return () => {
      if (queued) cancelAnimationFrame(queued);
      window.removeEventListener("scroll", onMove, { capture: true });
      window.removeEventListener("resize", onMove);
    };
  }, [stripTop, stripH, height]);

  const letterSize = Math.min(sequenceSize(scale), NODE_H * 0.7);
  const keptNode = kept?.kind === "node" ? kept.id : null;
  const nodeLit = (id: string) => litNode === id || keptNode === id;
  const stripNodeAt = (section: StripSection, event: React.MouseEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = section.left + (event.clientX - box.left);
    const row = Math.floor((event.clientY - box.top) / NODE_H);
    let best: StripNode | null = null;
    let away = Infinity;
    for (const node of section.nodes) {
      if (node.row !== row) continue;
      const left = px(node.ref);
      const right = px(node.ref + node.width);
      const off = x < left ? left - x : x >= right ? x - right : 0;
      if (off < away) {
        best = node;
        away = off;
      }
    }
    return best;
  };

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
            dim={dim(row.lane)}
            reversed={row.reading?.reversed ?? false}
            sections={sections ?? undefined}
            sectionAltBp={sectionAltBp}
            onPress={
              sections && !barsByNode
                ? ({ x, clientX, clientY }) => {
                    const section = sectionAt(x);
                    if (section) {
                      keep(describeSection(row, section), { kind: "section", row: row.key, left: section.left, right: section.right }, clientX, clientY);
                    }
                  }
                : undefined
            }
            onPoint={(point) => {
              const section = point === null ? null : sectionAt(point.x);
              outline(section ? { x: section.left, y: row.top, width: section.right - section.left, height: row.height } : null);
            }}
            onHover={(target) => onBarHover(row, target)}
            onPick={(target) => onBarPick(row, target)}
          />
        </div>
      ))}

      <svg
        className="pgv-svg pgv-over"
        ref={svgRef}
        width={width}
        height={height}
        onMouseLeave={() => {
          hideHover();
          setLitNode(null);
        }}
        onClick={() => setCard(null)}
      >
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

        {/* A walk's rows' names: which reading each is. */}
        {walkLane &&
          rows.map((row, k) => (
            <text key={`name-${row.key}`} x={axis.viewFromPx + 4} y={row.top - 3} className="pgv-strip-label">
              {k === 0 ? "in place" : `own ${row.reading?.ownFrom.toLocaleString()}–${row.reading?.ownTo.toLocaleString()}`}
              {row.reading?.reversed ? " · read backwards" : ""}
            </text>
          ))}

        <rect className="pgv-hover-node" ref={hoverBoxRef} x={0} y={0} width={0} height={0} style={{ display: "none" }} />
        {keptBox && <rect className="pgv-kept-node" x={keptBox.x} y={keptBox.y} width={keptBox.width} height={keptBox.height} />}
        {litSpans.map((lit) => (
          <rect key={lit.key} className="pgv-lit-span" x={lit.x} y={lit.y} width={lit.width} height={lit.height} />
        ))}

        {/* ── The graph strip ─────────────────────────────────────────── */}
        {strip && (
          <g className="pgv-strip pgv-hears" ref={stickyRef}>
            <rect className="pgv-strip-ground" x={0} y={stripTop - STRIP_GROUND_PAD} width={width} height={stripH + STRIP_GROUND_PAD} />
            <text className="pgv-strip-label" x={6} y={stripTop + 12}>
              graph
            </text>
            {sections &&
              sections.map((section, index) => {
                const byRow = new Map<number, { left: number; right: number; alt: boolean }>();
                for (const node of section.nodes) {
                  const left = px(node.ref);
                  const right = Math.max(left + 1, px(node.ref + node.width));
                  const row = byRow.get(node.row);
                  if (!row) byRow.set(node.row, { left, right, alt: !node.onReference });
                  else {
                    row.left = Math.min(row.left, left);
                    row.right = Math.max(row.right, right);
                  }
                }
                return (
                  <g key={`section-${index}`}>
                    {[...byRow].map(([r, row]) => (
                      <g key={r} className={`pgv-node${row.alt ? " pgv-node-alt" : ""}`}>
                        <rect x={row.left} y={stripTop + r * NODE_H} width={row.right - row.left} height={NODE_H} />
                      </g>
                    ))}
                    <line className="pgv-node-edge" x1={section.left} x2={section.left} y1={stripTop} y2={stripTop + NODE_H} />
                    <rect
                      className={`pgv-section-hit${barsByNode ? " pgv-section-hit-nodes" : ""}`}
                      x={section.left}
                      y={stripTop}
                      width={Math.max(1, section.right - section.left)}
                      height={stripH}
                      onMouseMove={
                        barsByNode
                          ? (event) => {
                              if (cardKeptOpen()) {
                                hideHover();
                                return;
                              }
                              const node = stripNodeAt(section, event);
                              if (!node) {
                                hideHover();
                                return;
                              }
                              if (litNode !== node.id) setLitNode(node.id);
                              showHover(`node:${node.id}`, () => describeNode(node), event.clientX, event.clientY);
                            }
                          : undefined
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        if (barsByNode) {
                          const node = stripNodeAt(section, event);
                          if (node) keep(describeNode(node), { kind: "node", id: node.id }, event.clientX, event.clientY);
                          return;
                        }
                        keep(describeStripSection(section), { kind: "section", row: "graph", left: section.left, right: section.right }, event.clientX, event.clientY);
                      }}
                    />
                  </g>
                );
              })}
            {!sections &&
              stripNodes.map((node) => {
                const y = stripTop + node.row * NODE_H;
                const left = px(node.ref);
                const w = Math.max(1, px(node.ref + node.width) - left);
                const perBase = node.width > 0 ? w / node.width : scale;
                const lit =
                  highlight === null || node.lanes.some((key) => key === highlight) || node.onReference;
                const shown = node.width > 0 ? node.sequence.slice(0, node.width) : "";
                const spell = shown.length > 0 && (sequenceSize(perBase) >= SEQUENCE_MIN_SIZE || nodeLit(node.id));
                return (
                  <g
                    key={node.id}
                    className={`pgv-node${node.onReference ? "" : " pgv-node-alt"}${lit ? "" : " pgv-dim"}${
                      nodeLit(node.id) ? " pgv-node-lit" : ""
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      keep(describeNode(node), { kind: "node", id: node.id }, event.clientX, event.clientY);
                    }}
                    onMouseMove={(event) => {
                      if (cardKeptOpen()) {
                        hideHover();
                        return;
                      }
                      if (litNode !== node.id) setLitNode(node.id);
                      showHover(`node:${node.id}`, () => describeNode(node), event.clientX, event.clientY);
                    }}
                  >
                    {node.width > 0 ? (
                      <rect x={left} y={y} width={w} height={NODE_H} />
                    ) : (
                      /* No room: a mark in its row, pointing at where it goes in. */
                      <polygon points={`${left - 4},${y + 2} ${left + 4},${y + 2} ${left},${y + NODE_H - 3}`} />
                    )}
                    <line className="pgv-node-edge" x1={left} x2={left} y1={y} y2={y + NODE_H} />
                    {spell && (
                      <text
                        className="pgv-seq"
                        x={baseCentres(left, shown.length, perBase)}
                        y={y + NODE_H / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={Math.min(letterSize, sequenceSize(perBase))}
                      >
                        {shown}
                      </text>
                    )}
                  </g>
                );
              })}
          </g>
        )}
      </svg>

      {card && (
        <FloatingCard x={card.x} y={card.y} className="pgv-section-card">
          <button type="button" className="pgv-section-close" aria-label="Close" onClick={() => setCard(null)}>
            ×
          </button>
          <CardBody card={card} openItems={openItems} onToggle={toggleItem} />
        </FloatingCard>
      )}
      <HoverCard ref={hoverCard} />
    </div>
  );
}

export default memo(LinearView);
