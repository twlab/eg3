import {
  forwardRef,
  memo,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import type {
  DrawFrame,
  GraphNode,
  Lane,
  LaneDeletion,
  LaneStep,
  PangenomeModel,
} from "./pangenomeModel";
import LaneCanvas from "./LaneCanvas";
import type { LaneHover } from "./LaneCanvas";
import FloatingCard from "./FloatingCard";
import { pieceAt, rasteriseLanes, visitPieces } from "./laneRaster";
import type { LaneRaster, RasterNode } from "./laneRaster";
import { laneLayout } from "./laneLayout";
import { BAR_H, FOOT_PAD, NODE_H } from "./laneLayout";
import { bandAxis } from "./pangenomeModel";
import { alleleKey } from "../../../../../getRemoteData/gbz/subgraph";
import {
  baseCentres,
  laneNeighbours,
  nodeInterval,
  sameSequenceLines,
  sequenceSize,
} from "./nodeDetail";

/* ══════════════════════════════════════════════════════════════════════════
   Linearized path view - the shape of figure 2c in Eizenga et al. 2020.

   The graph is flattened onto one base-level axis. Every haplotype gets a row
   and is painted as a coloured bar wherever it is present; where it drops out
   of the window the row is left blank, so absence reads as a gap in the bar.
   Underneath, the graph itself is drawn: one box per node, alleles of a site
   stacked, with the sequence spelled out once the zoom allows it.
   ══════════════════════════════════════════════════════════════════════════ */

/* Kept for the callers that still ask how much room the drawing wants
   beside the graph. There is none: the drawing is the band, edge to
   edge, and anything drawn outside it would make it the wrong width. */
export const GUTTER = 0;

/**
 * What one haplotype's bar takes, top to top.
 *
 * Exported because the height of the drawing is the height of the box
 * around it: the shell used to be given a constant tall enough for
 * anything, which left most of it empty and the rest scrolling.
 */
/* The rows the drawing is laid out on come from laneLayout, which the
   legend beside it reads too - see there. Re-exported, since the tube map
   sizes its tubes from the height of a bar. */
export { LANE_HEIGHT, LANE_H } from "./laneLayout";
/** The mark on an allele that is one of several ways in or out. */
const BULLET_R = 3.5;
/** How far the strip's ground reaches above it, to meet the ruler's own
    without a seam. It does not reach below: the first bar starts where the
    strip ends, and a ground hanging past it covered the top of that bar. */
const STRIP_GROUND_PAD = 4;
/* Below this a letter is a smudge, so the sequence is not drawn - the
   glyphs would cost more than they say. Above it the sequence is always
   drawn: this view is where a reader comes to read bases, and waiting for
   a zoom threshold to cross meant they usually could not.

   A node under the pointer spells itself out whatever its size, because
   asking for that stretch in particular is the reader saying the smudge
   is what they want to see. */
const SEQUENCE_MIN_SIZE = 4;

/* Zoomed out past the point where a letter can be drawn, a node is a few
   pixels or less and a window holds thousands of them: an element and a
   hover each, none of which can be read on its own. So the strip and the
   bars are read a section at a time instead - neighbouring nodes joined
   until the section is at least this wide - and only on a click. */
const SECTION_PX = 16;
/** Past this many bases a card's sequence gets a box of its own. */
const SEQUENCE_INLINE = 60;

/** Neighbouring nodes read as one, zoomed out. */
interface StripSection {
  left: number;
  right: number;
  nodes: GraphNode[];
}

/** What a clicked section says: where it is, and what it was made from. */
interface SectionCard {
  /** Where it was clicked, in window coordinates: the card opens there. */
  x: number;
  y: number;
  /** Zoomed in, what the card is about: outlined in the drawing, with the
      nodes either side of it, while the card is kept open. */
  target?: CardTarget;
  title: string;
  /** The letters under the pointer, on a haplotype's bar. */
  zoom?: CardZoom;
  lines: ReactNode[];
  /** Headed lists of nodes - every one of them, in a list that scrolls -
      each opening, on a click, to what it is. Near: the nodes either side
      of the one the card is about, headed in the yellow they are outlined
      in. Empty: what to say when the list has none. */
  groups: Array<{
    head: string;
    items: CardItem[];
    near?: boolean;
    empty?: string;
  }>;
}

/** What a card says, apart from where it is. */
type CardContent = Omit<SectionCard, "x" | "y" | "target">;

/** The letters around the pointer, with the ones it covers picked out. */
interface CardZoom {
  before: string;
  at: string;
  after: string;
  where: ReactNode;
}

/** One node in a card's list: its line, and what opening it says. */
interface CardItem {
  key: string;
  line: ReactNode;
  details: ReactNode[];
  /** Told when the pointer is on the entry and when it leaves. */
  onPoint?: (on: boolean) => void;
}

/** What a zoomed-in card is about. */
type CardTarget =
  /* One visit of a haplotype's bar - which of its raster's visits - and
     the letters under the pointer there. */
  | { kind: "visit"; lane: string; index: number; zoom: LaneHover["zoom"] }
  /* One node of the graph strip. */
  | { kind: "node"; id: string }
  /* The ways into or out of a visit a bullet counts, and where the bullet
     is drawn. */
  | {
      kind: "ways";
      lane: string;
      index: number;
      side: "before" | "after";
      ids: string[];
      x: number;
      y: number;
    };

/** A target as a string: the hover draws itself again only when it changes. */
const targetKey = (target: CardTarget) =>
  target.kind === "visit"
    ? `visit:${target.lane}:${target.index}:${target.zoom?.markFrom ?? ""}:${target.zoom?.markTo ?? ""}`
    : target.kind === "node"
      ? `node:${target.id}`
      : `ways:${target.lane}:${target.index}:${target.side}`;

/** Whether a card is kept open anywhere on the page. Each of the graph's
    rows is a view of its own, and while any of them keeps a card, no
    row's hover says anything. */
const cardKeptOpen = () =>
  typeof document !== "undefined" &&
  !!document.querySelector(".pgv-floating-card");

/** One way a haplotype differs from the reference, as its card lists it. */
interface Variant {
  /** Unresolved: the haplotype's walk here starts or ends while off the
      reference, so there is no reference node on that side to say what it
      stands in for. */
  /* Multiple: several changes in one stretch off the reference - see
     parts. Complex: a change the graph does not line up base by base, or a
     walk jumping back along the reference. */
  kind:
    | "substitution"
    | "multiple"
    | "complex"
    | "insertion"
    | "deletion"
    | "unresolved";
  /** For a multiple one, the changes it is made of, in reference order. */
  parts?: VariantPart[];
  /** For an unresolved one, which end of the walk here is off the
      reference. Whether the walk carries on past what was fetched or its
      contig stops there, the walk here cannot say. */
  openAt?: "start" | "end" | "both";
  /** For a deletion, that one end of it is outside this band, so the
      reference it skips was not fetched. */
  outside?: boolean;
  /** Where on the reference: the stretch it replaces, or the point an
      insertion goes in at. */
  refFrom: number;
  refTo: number;
  /** The contig of the haplotype's coordinates here - a lane can join a
      haplotype's contigs; see oneLanePerHaplotype. */
  contig?: string;
  /** Where in the haplotype: what it reads, or the point a deletion is at. */
  ownFrom: number;
  ownTo: number;
  /** Where its nodes off the reference are read in the haplotype - all of
      them, before any shared bases are trimmed off: how a visit finds the
      variant it is part of. */
  runFrom: number;
  runTo: number;
  /** What the haplotype reads, and the reference instead - on the
      reference's strand, less the bases the two share at either end. */
  reads: string;
  instead: string;
  /** The two alleles as the graph has them, where trimming shared bases
      off them changed what they say. */
  graph?: { instead: string; reads: string };
  /** The walk through it: the reference node it leaves, its nodes off the
      reference, the reference node it rejoins at. */
  walk: string[];
  /** A walk jumping back along the reference rather than over some of it. */
  jumpsBack: boolean;
  /** The pixels it is drawn across. */
  left: number;
  right: number;
}

/** One change a multiple variant is made of. */
interface VariantPart {
  kind: "substitution" | "complex" | "insertion" | "deletion";
  refFrom: number;
  refTo: number;
  ownFrom: number;
  ownTo: number;
  reads: string;
  instead: string;
}

/* A variant's colour by what it does to the reference. */
const VARIANT_CLASS: Record<Variant["kind"], string> = {
  substitution: "pgv-var-sub",
  multiple: "pgv-var-multi",
  complex: "pgv-var-sub",
  insertion: "pgv-var-ins",
  deletion: "pgv-var-del",
  unresolved: "",
};

/** One time a haplotype reads a place: in which of its lanes, which step. */
interface Reading {
  lane: Lane;
  step: LaneStep;
  node: GraphNode;
}
/* Every reading each haplotype makes of each site, by its label: worked out
   the first time a card asks, once per model. */
const readingsByModel = new WeakMap<
  PangenomeModel,
  Map<string, Map<number, Reading[]>>
>();

/** The haplotype a lane is of, from its key: a bar draws one haplotype -
    see oneLanePerHaplotype - and a node lists its lanes per contig. */
const haplotypeOf = (key: string) => key.split("#").slice(0, 2).join("#");

/** A sequence for a card: all of it. A long one in a box of its own that
    scrolls - a 14 kb insertion's bases all there to read and to select -
    so the line it is part of stays a line. Cut short with "…", the rest of
    it could not be read anywhere. */
const cardSequence = (sequence: string): ReactNode =>
  !sequence ? (
    "(no sequence)"
  ) : (
    <span
      className={
        sequence.length > SEQUENCE_INLINE
          ? "pgv-card-seq pgv-card-seq-long"
          : "pgv-card-seq"
      }
    >
      {sequence}
    </span>
  );

/** What a card says - the same whether a hover is showing it or a click
    has kept it. Kept, its entries open on a click. */
function CardBody({
  card,
  openItems,
  onToggle,
}: {
  card: CardContent;
  openItems?: ReadonlySet<string>;
  onToggle?: (key: string) => void;
}) {
  return (
    <>
      <div className="pgv-tooltip-title">{card.title}</div>
      {card.zoom && (
        <div className="pgv-zoom pgv-card-zoom">
          <div className="pgv-zoom-seq">
            {card.zoom.before}
            <span className="pgv-zoom-at">{card.zoom.at}</span>
            {card.zoom.after}
          </div>
          <div className="pgv-zoom-where">{card.zoom.where}</div>
        </div>
      )}
      {card.lines.map((line, index) => (
        <div key={index} className="pgv-section-line">
          {line}
        </div>
      ))}
      {card.groups.map((group) => (
        <div key={group.head}>
          <div
            className={`pgv-section-head${group.near ? " pgv-head-near" : ""}`}
          >
            {group.head}
          </div>
          {group.items.length === 0 ? (
            <div className="pgv-section-line">{group.empty ?? "none"}</div>
          ) : (
            <div className="pgv-section-list">
              {group.items.map((item) => {
                const key = `${group.head}:${item.key}`;
                const open = openItems?.has(key) ?? false;
                return (
                  <div key={key}>
                    {/* Text, not a button, so it can be selected like the
                        rest of the card: a click opens it, a drag that
                        highlights some of it does not. */}
                    <div
                      role="button"
                      tabIndex={0}
                      className="pgv-section-node pgv-section-item"
                      aria-expanded={open}
                      onClick={() => {
                        if (window.getSelection()?.toString()) return;
                        onToggle?.(key);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        onToggle?.(key);
                      }}
                      onMouseEnter={
                        item.onPoint ? () => item.onPoint?.(true) : undefined
                      }
                      onMouseLeave={
                        item.onPoint ? () => item.onPoint?.(false) : undefined
                      }
                    >
                      <span className="pgv-section-caret">
                        {open ? "▾" : "▸"}
                      </span>
                      {item.line}
                    </div>
                    {open &&
                      item.details.map((line, index) => (
                        <div key={index} className="pgv-section-detail">
                          {line}
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

interface HoverCardHandle {
  /** Shows the card for `key` at the pointer, building it only when the
      key is not the one already shown. */
  show: (
    key: string,
    build: () => CardContent | null,
    x: number,
    y: number,
  ) => void;
  hide: () => void;
}

/** Between the pointer and the card, and the card and the window's edges. */
const HOVER_GAP = 14;
const HOVER_EDGE = 8;

/**
 * The card a hover shows: what a click would keep, following the pointer.
 *
 * A component of its own holding its own state, so a hover renders this
 * and nothing else - the drawing it sits beside is thousands of elements,
 * and a hover is a hundred events long. It is moved by writing to its
 * style, as the tooltip it replaces was, and drawn again only when what it
 * is about changes.
 */
const HoverCard = forwardRef<HoverCardHandle>(function HoverCard(_props, ref) {
  const [shown, setShown] = useState<{ key: string; card: CardContent } | null>(
    null,
  );
  const box = useRef<HTMLDivElement>(null);
  const at = useRef({ x: 0, y: 0 });
  /* Measured once per change of what it says, so a move costs no layout. */
  const size = useRef({ width: 0, height: 0 });
  /* Below and right of the pointer; left of it near the right edge, above
     it near the bottom. */
  const place = () => {
    const element = box.current;
    if (!element) return;
    const { x, y } = at.current;
    const { width, height } = size.current;
    let left = x + HOVER_GAP;
    if (left + width > window.innerWidth - HOVER_EDGE) {
      left = Math.max(HOVER_EDGE, x - HOVER_GAP - width);
    }
    let top = y + HOVER_GAP;
    if (top + height > window.innerHeight - HOVER_EDGE) {
      top = Math.max(HOVER_EDGE, y - HOVER_GAP - height);
    }
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
  };
  useImperativeHandle(
    ref,
    () => ({
      show(key, build, x, y) {
        at.current = { x, y };
        setShown((was) => {
          if (was?.key === key) return was;
          const card = build();
          return card ? { key, card } : null;
        });
        place();
      },
      hide() {
        setShown(null);
      },
    }),
    /* place reads only refs. */
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [],
  );
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    size.current = { width: rect.width, height: rect.height };
    place();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [shown]);
  if (!shown) return null;
  return createPortal(
    <div ref={box} className="pgv-section-card pgv-hover-card">
      <CardBody card={shown.card} />
    </div>,
    document.body,
  );
});

/* Alleles off the reference walk are hatched rather than recoloured, so the
   haplotype keeps its colour and the divergence still reads at a glance.

   White, and drawn only on the bar itself: a letter's box is painted over
   the hatching rather than under it, so no diagonal crosses a glyph. The
   diagonals still run above and below each box, which is what keeps the
   stretch reading as one hatched run rather than a row of tiles. */
const HATCH_PITCH = 6;
const HATCH_INK = "#FFFFFF";

/* The box a letter sits in: as wide as its base, less a hair so one letter
   reads as one box, and only as tall as the letter itself.

   Uppercase ATGC has no descender, so the height that bounds a glyph is the
   font's cap height - about 0.72 of its size across the monospace faces in
   the stack (Consolas sits at 0.64, SF Mono nearer 0.70). Taking it from
   the font size rather than from the bar keeps the box on the letter at
   every zoom, where a fixed inset would swallow it at four pixels and
   leave it swimming at fifteen. */

/**
 * How tall the drawing comes out, from the bars it is made of.
 *
 * The same arithmetic the layout below walks, in closed form: a ruler, a
 * bar per haplotype, and the graph sitting under the reference with a gap
 * either side of it. Kept here next to the constants it is made from, so
 * the box around the drawing cannot drift from the drawing.
 */
export function linearHeight(
  model: PangenomeModel,
  alleleRows: boolean,
  strip = true,
): number {
  return laneLayout(model, alleleRows, strip).height;
}

export interface HoverTarget {
  x: number;
  y: number;
  title: string;
  lines: string[];
  /* The letters of the node under the pointer. A bar gives a base two or
     three pixels, so its letters are a texture rather than text - this is
     where they can be read. */
  zoom?: {
    letters: string[];
    /** Which of them the pointer is on. */
    at: number;
    /** How many bases its pixel covers, `at` among them. */
    span?: number;
    from: number;
    to: number;
    /** The coordinates of the marked bases. */
    markFrom?: number;
    markTo?: number;
    /** Whether the node runs on past what is shown. */
    clippedLeft?: boolean;
    clippedRight?: boolean;
    length?: number;
  } | null;
}

interface LinearPathViewProps {
  model: PangenomeModel;
  pxPerBase: number;
  /** Lane key to keep lit; every other lane is dimmed. Set from the graph
      strip and the legend: a bar itself does not answer a click. */
  highlight: string | null;
  onHover: (target: HoverTarget | null) => void;
  onSelectNode: (id: string | null) => void;
  selectedNode: string | null;
  /** The band to fill. Without one the drawing falls back to its own size. */
  frame?: DrawFrame;
  /** Spell what each haplotype carries into the hatching on its own bar. */
  alleleRows: boolean;
  /** Zoomed out, a haplotype's section is marked as off the reference only
      where more than this many of its bases there are; see LaneCanvas. */
  sectionAltBp?: number;
  /** Whether the graph strip is drawn. Off, only the model's haplotype bars
      are: one haplotype as a track row of its own. */
  strip?: boolean;
}

/* The bars used to be split into runs here and drawn as rects. They are
   painted from laneRaster.ts now, which does the same walk once into an array
   the hover can index - so the splitter and the Run it produced have gone
   with them. */

function LinearPathView({
  model,
  pxPerBase,
  frame,
  highlight,
  alleleRows,
  sectionAltBp = 0,
  strip = true,
}: LinearPathViewProps) {
  /* Several of these can share a page, so the hatch needs its own id. */
  const hatchId = `pgv-hatch-${useId().replace(/[^\w-]/g, "")}`;

  /* The stretch of bar under the pointer. A bar reports "12 bp over 5 nodes";
     this is what lets those five be pointed at rather than just counted. */
  const [litRun, setLitRun] = useState<{
    key: string;
    lane: string;
    nodes: Set<string>;
  } | null>(null);
  const nodeIsLit = (id: string) => litRun?.nodes.has(id) ?? false;

  /* From an open bullet's card to the node it names that the pointer is on
     in that card: the card says what they are, this says where. */
  const [linked, setLinked] = useState<{ lane: string; id: string } | null>(
    null,
  );

  /* The card a click keeps: a section's, zoomed out, or - zoomed in - the
     one the hover was showing. */
  const [card, setCard] = useState<SectionCard | null>(null);
  /* Which of the card's nodes are open; a new card starts with none. */
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  useEffect(() => {
    setOpenItems(new Set());
    setLinked(null);
  }, [card]);
  /* A press anywhere but on a card closes this one: each of the graph's rows
     is a view of its own, and a card left open in one stayed up beside the
     card another row opened. */
  useEffect(() => {
    if (!card) return;
    const close = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.(".pgv-floating-card")) return;
      setCard(null);
    };
    document.addEventListener("mousedown", close, true);
    return () => document.removeEventListener("mousedown", close, true);
  }, [card]);
  const toggleItem = (key: string) =>
    setOpenItems((was) => {
      const next = new Set(was);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  /* Zoomed in, the card a hover shows - the one a click keeps. */
  const hoverCard = useRef<HoverCardHandle>(null);
  const hideHover = () => hoverCard.current?.hide();

  /**
   * The haplotypes that carry what is lit in the strip.
   *
   * Pointing at an allele there asks who has it, and the answer is the bars
   * below: the ones that carry it stay as they are and the rest are dimmed,
   * which is what hovering a bar already does to the strip, the other way
   * round. A run lit from a bar names the lane it came from, and that is the
   * bar under the pointer rather than a question about the others, so it is
   * left alone.
   */
  const litLanes = useMemo(() => {
    if (!litRun || litRun.lane) return null;
    const lanes = new Set<string>();
    for (const id of litRun.nodes) {
      for (const key of model.nodeById.get(id)?.lanes ?? []) {
        lanes.add(haplotypeOf(key));
      }
    }
    return lanes.size ? lanes : null;
  }, [litRun, model]);



  /* The rows, from the same arithmetic the legend beside the drawing reads:
     the strip under the ruler, the haplotypes under it, a bar apiece. */
  /* Rebuilt only with the model: it walks every haplotype, and a render that
     changes neither - a pick, a card opening - should not pay for it. */
  const layout = useMemo(
    () => laneLayout(model, alleleRows, strip),
    [model, alleleRows, strip],
  );
  const { stripTop, stripH } = layout;
  const laneTop = new Map<string, number>();
  const laneHeight = new Map<string, number>();
  for (const row of layout.rows) {
    if (row.isReference) continue;
    laneTop.set(row.key, row.top);
    laneHeight.set(row.key, row.height);
  }
  const height = layout.height;
  /* ── The axis ────────────────────────────────────────────────────────
     The graph is drawn as it is laid out: every node gets room for the
     sequence it carries, so an allele longer than the reference's is
     wider on screen rather than squeezed onto the coordinate it replaces.

     What the band decides is where that drawing sits and how big it is,
     and it is fitted to the window on screen rather than to the band as a
     whole. Both edges of that window then land on the region that was
     asked for, which is the thing the reader can actually check.

     Fitting the band instead only looks equivalent. The layout is not the
     reference coordinate - a column is as wide as its widest allele, so a
     site where some haplotype carries more sequence than the reference
     takes room the reference spends no coordinate on - and the window is
     a window into the middle of the band, by which point that has already
     accumulated. Asking for 4,073,900..4,074,350 at context 32 showed
     4,073,891..4,074,318: 427 of the 450 bases, shifted 9 bp back. At
     context 0 nothing in this graph does that, which is why it looked
     right until there was context.

     The runway either side is drawn at the same scale, so it no longer
     divides the band into exact thirds; it is off-screen until a pan, and
     a pan refits to whatever it lands on. */
  const axis = useMemo(
    () => bandAxis(model, frame),
    [model, frame],
  );
  const scale = axis ? axis.scale : pxPerBase;
  const px = axis ? axis.px : (graphX: number) => graphX * scale;
  const width = frame ? frame.width : px(model.totalBp);

  /* Where the reference's walk skips room the layout keeps for another
     haplotype's insertion, however narrow: drawn over the strip at least a
     screen pixel wide, as a haplotype's bar draws its own (see LaneCanvas),
     whether the strip shows nodes or, zoomed out, sections. */
  const onePx = 1 / (typeof window === "undefined" ? 1 : window.devicePixelRatio || 1);
  const referenceGaps: Array<{ x: number; width: number; y: number }> = [];
  {
    const steps = model.reference?.steps ?? [];
    for (let i = 1; i < steps.length; i++) {
      if (steps[i].segment !== steps[i - 1].segment) continue;
      const before = model.nodeById.get(steps[i - 1].node);
      const after = model.nodeById.get(steps[i].node);
      if (!before || !after) continue;
      const from = px(before.x + before.length);
      const to = px(after.x);
      if (!(to - from > 1e-6)) continue;
      referenceGaps.push({
        x: from,
        width: Math.max(onePx, to - from),
        y: stripTop + before.row * NODE_H,
      });
    }
  }
  /* One size for every letter drawn at the window's own scale, so a node
     does not spell itself larger than its neighbour. */
  /* The same for the strip's own rows, which are shorter again. */
  const letterSize = Math.min(sequenceSize(scale), NODE_H * 0.7);
  const keptNode = card?.target?.kind === "node" ? card.target.id : null;
  const spellsOut = (node: { id: string; length: number }, perBase: number) =>
    node.length > 0 &&
    (sequenceSize(perBase) >= SEQUENCE_MIN_SIZE ||
      nodeIsLit(node.id) ||
      keptNode === node.id);

  /* ── Keeping the graph in sight ───────────────────────────────────────
     The graph sits under the reference bar, and scrolling past it leaves
     the haplotypes with nothing to read against. So it is held at the top
     of the screen once it would have left it.

     Done by shifting the group down rather than by `position: sticky`: an
     SVG child is not a CSS box and cannot be sticky, and lifting the strip
     out into its own element would have meant giving it its own copy of the
     layout - a second place for the gaps and the band width to be decided,
     and a second place for them to be decided differently. Nothing here
     touches x or the layout; the strip keeps the slot it already had and is
     only drawn somewhere else down the page.

     Written straight to the attribute on each frame, for the same reason
     the tooltip is: a scroll is a hundred events long and none of them
     change anything React would need to re-derive. */
  const svgRef = useRef<SVGSVGElement>(null);
  /* The outline round whatever the pointer is on. Written straight to the
     attributes, as the tooltip and the sticky strip are: a hover is a
     hundred events long and none of them change anything React would need
     to work out again. */
  const hoverBoxRef = useRef<SVGRectElement>(null);
  const stickyRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const strip = stickyRef.current;
    if (!svg || !strip) return;

    let queued = 0;
    const place = () => {
      queued = 0;
      /* Where the drawing is on screen now. The band is moved sideways by a
         transform, which leaves `top` alone, and the drawing is drawn at
         1:1 - no viewBox - so a user unit is a pixel down the page. */
      const box = svg.getBoundingClientRect();

      /* Pin under the chrome rather than under the top of the window, so
         the two never overlap. The toolbar is not sticky today, in which
         case its bottom goes negative as it leaves and this falls back to
         the top of the window on its own. */
      const panel = document.querySelector(".pgv-panel");
      const pinTop = Math.max(
        0,
        panel ? panel.getBoundingClientRect().bottom : 0,
      );

      /* Far enough to reach the pin, and no further than the foot of the
         drawing - past that it would float over whatever comes next.

         Measured from the top of the ruler rather than the top of the strip,
         since the ruler is the first of the two and what the pin has to
         clear; the strip comes to rest under it, as it is drawn. */
      const natural = box.top;
      const room = height - FOOT_PAD - (stripTop + stripH);
      const shift = Math.max(0, Math.min(pinTop - natural, room));

      const move = shift > 0 ? `translate(0, ${Math.round(shift)})` : "";
      strip.setAttribute("transform", move);
    };

    const onMove = () => {
      if (!queued) queued = requestAnimationFrame(place);
    };
    place();
    /* Captured, so a scroll inside any ancestor counts and not just the
       page's own. */
    window.addEventListener("scroll", onMove, {
      passive: true,
      capture: true,
    });
    window.addEventListener("resize", onMove);
    return () => {
      if (queued) cancelAnimationFrame(queued);
      window.removeEventListener("scroll", onMove, { capture: true });
      window.removeEventListener("resize", onMove);
    };
  }, [stripTop, stripH, height]);

  /* One array per haplotype, with an entry per pixel of the band. Both the
     painting and the hover read it, so they cannot disagree about what is
     where. Rebuilt only when the drawing changes - not on a hover, which is
     the point of it. */
  const rasters = useMemo(() => {
    const byKey = new Map<string, ReturnType<typeof rasteriseLanes>[number]>();
    for (const raster of rasteriseLanes(model, px, width)) {
      byKey.set(raster.key, raster);
    }
    return byKey;
    /* px is rebuilt every render, but it is the axis's own function or a
       plain scaling of it - so the axis and the width are what change it. */
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [model, axis, pxPerBase, width]);

  /* ── Sections, zoomed out ─────────────────────────────────────────────
     Only once a letter no longer fits a base: before that a node is wide
     enough to be read, and pointed at, on its own. Nodes are joined in the
     order they are drawn, and a section is only closed where the next node
     starts clear of it, so the alleles of one site always land together.
     Of the nodes with a place here only, as the bars draw them: an untied
     one is drawn nowhere, and where it was put is no place of its. Left
     in, the second pass of HG02074#2's duplication - untied in a band at
     chr14:99,967,150 that holds it but not where it goes - overlapped the
     reference's nodes a little each, chaining the whole view into one
     section, and the haplotype's few SNPs there hatched all of it. */
  const sections = useMemo<StripSection[] | null>(() => {
    if (sequenceSize(scale) >= SEQUENCE_MIN_SIZE) return null;
    const placed = model.nodes
      .filter((node) => !node.untied)
      .map((node) => ({
        node,
        left: px(node.x),
        right: px(node.x + node.length),
      }))
      .sort((a, b) => a.left - b.left || a.right - b.right);
    const out: StripSection[] = [];
    let open: StripSection | null = null;
    for (const { node, left, right } of placed) {
      if (
        open &&
        (left < open.right - 0.5 || open.right - open.left < SECTION_PX)
      ) {
        open.nodes.push(node);
        open.right = Math.max(open.right, right);
        continue;
      }
      open = { left, right, nodes: [node] };
      out.push(open);
    }
    return out;
    /* px is rebuilt every render, but only from the axis. */
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [model, axis, pxPerBase, scale]);

  /* A card drawn for a zoom that is gone would point at the wrong place. */
  useEffect(() => setCard(null), [sections]);

  const sectionAt = (x: number) =>
    sections?.find((section) => x >= section.left && x < section.right) ??
    null;

  const referenceContig =
    model.reference?.contig ??
    model.lanes.find((lane) => lane.isReference)?.contig ??
    "";

  /** The stretch of reference a section covers. */
  const referenceName = model.reference?.sample ?? "reference";
  /* A coordinate on the reference, blue as its legend is; one on an alt
     path, green as its legend is. */
  const refCoord = (text: string) => (
    <span className="pgv-coord-ref">{text}</span>
  );
  const altCoord = (text: string) => (
    <span className="pgv-coord-alt">{text}</span>
  );
  const coordLabel = (text: string) => (
    <span className="pgv-coord-label">{text}</span>
  );
  /** Where a section is on the reference, labelled as the reference's. */
  const regionLine = (section: StripSection) => {
    const refStart = Math.min(...section.nodes.map((node) => node.refStart));
    const refEnd = Math.max(...section.nodes.map((node) => node.refEnd));
    return (
      <>
        {coordLabel(`Reference (${referenceName})`)}{" "}
        {refCoord(
          `${referenceContig}:${refStart.toLocaleString()}–${refEnd.toLocaleString()}`,
        )}{" "}
        · {(refEnd - refStart).toLocaleString()} bp
      </>
    );
  };
  const refNodeLine = (node: GraphNode) => (
    <>
      node {node.id} · {node.length} bp · ref{" "}
      {refCoord(node.refStart.toLocaleString())}
    </>
  );
  /* An alt node has no place on the reference of its own: what it has is
     the stretch of reference its site stands in for, or the point it is
     inserted at. */
  const altNodeLine = (node: GraphNode) => (
    <>
      node {node.id} · {node.length} bp · ref {refCoord(nodeInterval(node))}
    </>
  );
  const plural = (n: number, word: string) =>
    `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;
  /* How common something is in the whole pangenome - every haplotype with
     a walk here, not just the rows drawn - said last in what it opens to.
     Absent for a band fetched before the counts were. */
  const pangenomeLine = (count: number | undefined): string[] =>
    model.carriers && count !== undefined
      ? [
          `in ${count.toLocaleString()} of ${model.carriers.total.toLocaleString()} haplotypes in the pangenome`,
        ]
      : [];
  const nodeCarriers = (node: GraphNode) =>
    pangenomeLine(model.carriers?.nodes[node.id]);
  /* Which of the rows drawn carry a node, by name: a lane is one contig of one. */
  const carriersLine = (node: GraphNode) => {
    const names = [
      ...new Set(node.lanes.map((key) => key.split("#").slice(0, 2).join("#"))),
    ];
    return `in the rows shown: ${names.join(", ")}`;
  };
  /** A reference node, opening to its sequence and how common it is. */
  const refNodeItem = (node: GraphNode): CardItem => ({
    key: node.id,
    line: refNodeLine(node),
    details: [cardSequence(node.sequence), ...nodeCarriers(node)],
  });
  /** What the reference reads between two of its nodes, in this window. */
  const referenceBetween = (before: GraphNode, after: GraphNode) =>
    model.nodes
      .filter(
        (node) =>
          node.onReference &&
          node.refStart >= before.refEnd &&
          node.refEnd <= after.refStart,
      )
      .sort((a, b) => a.refStart - b.refStart)
      .map((node) => node.sequence)
      .join("");

  /** The card for a section of the strip: the stretch of reference it
      covers, and its nodes - on the reference walk and off it - named and
      counted. */
  const openStripCard = (
    section: StripSection,
    at: { x: number; y: number },
  ) => {
    const refs = section.nodes.filter((node) => node.onReference);
    const alts = section.nodes.filter((node) => !node.onReference);
    setCard({
      x: at.x,
      y: at.y,
      title: "graph",
      lines: [
        regionLine(section),
        `${plural(section.nodes.length, "node")}: ${refs.length} reference, ${alts.length} alt`,
      ],
      groups: [
        {
          head: `Alt nodes (${alts.length})`,
          items: alts.map((node) => ({
            key: node.id,
            line: altNodeLine(node),
            details: [
              <>reads {cardSequence(node.sequence)}</>,
              carriersLine(node),
              ...nodeCarriers(node),
            ],
          })),
        },
        { head: `Reference nodes (${refs.length})`, items: refs.map(refNodeItem) },
      ],
    });
  };

  /**
   * Every way a haplotype's walk differs from the reference: each stretch
   * it spends off the reference walk - a substitution, an insertion, or
   * something less tidy - and each jump it makes over part of the
   * reference, a deletion. Read on the reference's strand, so a walk
   * running against the reference says the same as one running with it.
   */
  const laneVariants = (lane: Lane): Variant[] => {
    const steps = lane.steps;
    const nodeAt = (i: number) =>
      i >= 0 && i < steps.length ? model.nodeById.get(steps[i].node) : undefined;
    /* Two visits in one walk: a lane's walks meet at seams, not edges. */
    const joined = (i: number, j: number) =>
      j >= 0 && j < steps.length && steps[i].segment === steps[j].segment;
    /* Which way this haplotype reads the reference. */
    let drift = 0;
    for (let i = 0; i + 1 < steps.length; i++) {
      const a = nodeAt(i);
      const b = nodeAt(i + 1);
      if (a?.onReference && b?.onReference && joined(i, i + 1)) {
        drift += b.refStart - a.refStart;
      }
    }
    const forward = drift >= 0;
    const span = (nodes: GraphNode[]) => ({
      left: Math.min(...nodes.map((node) => px(node.x))),
      right: Math.max(...nodes.map((node) => px(node.x + node.length))),
    });

    /** The reference's own bases over a stretch of it, in this window. */
    const referenceSpan = (from: number, to: number) =>
      model.nodes
        .filter(
          (node) =>
            node.onReference && node.refStart >= from && node.refEnd <= to,
        )
        .sort((a, b) => a.refStart - b.refStart)
        .map((node) => node.sequence)
        .join("");
    /**
     * A stretch off the reference, as the changes the graph lines it up
     * into: each node of it stands in for the reference bases in its
     * column - a substitution - or for none, an insertion; the reference
     * it passes no node over is deleted. Null where the nodes do not line
     * up in order, or say one thing only.
     */
    const breakDown = (
      visits: Array<{ step: LaneStep; node: GraphNode }>,
      from: number,
      to: number,
    ): VariantPart[] | null => {
      if (!visits.length) return null;
      /* In reference order; and the haplotype's own coordinate either side
         of a visit, on the reference's left and right of it. */
      const ordered = forward ? visits : [...visits].reverse();
      const ownLeft = (step: LaneStep) => (forward ? step.start : step.end);
      const ownRight = (step: LaneStep) => (forward ? step.end : step.start);
      const parts: VariantPart[] = [];
      const deleted = (refFrom: number, refTo: number, own: number) =>
        parts.push({
          kind: "deletion",
          refFrom,
          refTo,
          ownFrom: own,
          ownTo: own,
          reads: "",
          instead: referenceSpan(refFrom, refTo),
        });
      let cursor = from;
      for (const { step, node } of ordered) {
        if (node.refStart < cursor || node.refEnd > to) return null;
        if (node.refStart > cursor) deleted(cursor, node.refStart, ownLeft(step));
        const span = node.refEnd - node.refStart;
        const there = span > 0 ? referenceSpan(node.refStart, node.refEnd) : "";
        if (there !== node.sequence) {
          parts.push({
            kind:
              span === 0
                ? "insertion"
                : span === node.length
                  ? "substitution"
                  : "complex",
            refFrom: node.refStart,
            refTo: node.refEnd,
            ownFrom: Math.min(step.start, step.end),
            ownTo: Math.max(step.start, step.end),
            reads: node.sequence,
            instead: there,
          });
        }
        cursor = Math.max(cursor, node.refEnd);
      }
      if (cursor < to) deleted(cursor, to, ownRight(ordered[ordered.length - 1].step));
      return parts.length > 1 ? parts : null;
    };

    const out: Variant[] = [];
    /* Deletions whose other end is outside the band, by the visit here
       they leave or rejoin at; see laneDeletions. */
    const outside = new Map<number, LaneDeletion[]>();
    for (const deletion of lane.deletions ?? []) {
      if (deletion.left !== null && deletion.right !== null) continue;
      const list = outside.get(deletion.step);
      if (list) list.push(deletion);
      else outside.set(deletion.step, [deletion]);
    }
    for (let i = 0; i < steps.length; i++) {
      const node = nodeAt(i);
      if (!node) continue;
      const contig = lane.segments[steps[i].segment]?.contig ?? lane.contig;
      /* No place here - the reference's path reads it elsewhere, or it is
         tied to nothing on the reference that was fetched: not drawn, and
         not one of the haplotype's changes here either. */
      if (node.untied) continue;
      for (const deletion of outside.get(i) ?? []) {
        /* Across the white it leaves, to the band's end: a section it
           leaves from, or any in the white, lists it - a section is drawn
           up to where the reference node ends, so the edge alone sits on
           the line between two. */
        const edge = px(deletion.right === null ? node.x + node.length : node.x);
        const [from, to] =
          deletion.right === null
            ? [edge - 0.5, px(model.totalBp)]
            : [px(0), edge + 0.5];
        out.push({
          contig,
          kind: "deletion",
          refFrom: deletion.refFrom,
          refTo: deletion.refTo,
          ownFrom: deletion.right === null ? steps[i].end : steps[i].start,
          ownTo: deletion.right === null ? steps[i].end : steps[i].start,
          runFrom: deletion.right === null ? steps[i].end : steps[i].start,
          runTo: deletion.right === null ? steps[i].end : steps[i].start,
          reads: "",
          instead: "",
          outside: true,
          walk: deletion.walk,
          jumpsBack: false,
          left: from,
          right: to,
        });
      }
      if (node.onReference) {
        /* A jump to a reference node the reference does not go to next. */
        const next = joined(i, i + 1) ? nodeAt(i + 1) : undefined;
        if (!next?.onReference) continue;
        const [low, high] = forward ? [node, next] : [next, node];
        if (high.refStart === low.refEnd) continue;
        const deleted = high.refStart > low.refEnd;
        const left = px(low.x + low.length);
        const right = px(high.x);
        out.push({
          contig,
          kind: deleted ? "deletion" : "complex",
          refFrom: deleted ? low.refEnd : high.refStart,
          refTo: deleted ? high.refStart : low.refEnd,
          ownFrom: steps[i].end,
          ownTo: steps[i].end,
          runFrom: steps[i].end,
          runTo: steps[i].end,
          reads: "",
          instead: deleted ? referenceBetween(low, high) : "",
          walk: [node.id, next.id],
          jumpsBack: !deleted,
          left: Math.min(left, right),
          right: Math.max(left, right),
        });
        continue;
      }

      /* Off the reference walk: the run to where it comes back. */
      let end = i;
      while (
        end < steps.length &&
        joined(i, end) &&
        !nodeAt(end)?.onReference
      ) {
        end += 1;
      }
      const runSteps = steps.slice(i, end);
      const run = runSteps
        .map((step) => model.nodeById.get(step.node))
        .filter((visited): visited is GraphNode => !!visited);
      const leaves = joined(i, i - 1) ? nodeAt(i - 1) : undefined;
      const rejoins = joined(i, end) ? nodeAt(end) : undefined;
      const onStrand = forward ? run : [...run].reverse();
      const reads = onStrand.map((visited) => visited.sequence).join("");
      const ownFrom = Math.min(...runSteps.map((step) => step.start));
      const ownTo = Math.max(...runSteps.map((step) => step.end));
      const walk = [
        ...(leaves ? [leaves.id] : []),
        ...run.map((visited) => visited.id),
        ...(rejoins ? [rejoins.id] : []),
      ];
      i = end - 1;

      if (!leaves?.onReference || !rejoins?.onReference) {
        out.push({
          contig,
          kind: "unresolved",
          openAt:
            !leaves?.onReference && !rejoins?.onReference
              ? "both"
              : !leaves?.onReference
                ? "start"
                : "end",
          refFrom: Math.min(...run.map((visited) => visited.refStart)),
          refTo: Math.max(...run.map((visited) => visited.refEnd)),
          ownFrom,
          ownTo,
          runFrom: ownFrom,
          runTo: ownTo,
          reads,
          instead: "",
          walk,
          jumpsBack: false,
          ...span(run),
        });
        continue;
      }
      const [low, high] = forward ? [leaves, rejoins] : [rejoins, leaves];
      const replaced = high.refStart - low.refEnd;
      if (replaced < 0) {
        out.push({
          contig,
          kind: "complex",
          refFrom: high.refStart,
          refTo: low.refEnd,
          ownFrom,
          ownTo,
          runFrom: ownFrom,
          runTo: ownTo,
          reads,
          instead: "",
          walk,
          jumpsBack: true,
          ...span(run),
        });
        continue;
      }
      /* What changed, as a VCF says it: the bases the two alleles share at
         either end are not part of it. A graph's allele often keeps one -
         where the reference reads TCTCT and the haplotype T, four bases are
         deleted, not five replaced by one. */
      const whole = replaced > 0 ? referenceBetween(low, high) : "";
      let head = 0;
      while (
        head < whole.length &&
        head < reads.length &&
        whole[head] === reads[head]
      ) {
        head += 1;
      }
      let tail = 0;
      while (
        tail < whole.length - head &&
        tail < reads.length - head &&
        whole[whole.length - 1 - tail] === reads[reads.length - 1 - tail]
      ) {
        tail += 1;
      }
      /* The same bases read by other nodes: nothing left to trim to. */
      if (head + tail >= Math.max(whole.length, reads.length)) {
        head = 0;
        tail = 0;
      }
      const instead = whole.slice(head, whole.length - tail);
      const changed = reads.slice(head, reads.length - tail);
      const kind = !instead
        ? "insertion"
        : !changed
          ? "deletion"
          : instead.length === changed.length
            ? "substitution"
            : "complex";
      /* Neither one thing nor another: what each of its nodes does, where
         the graph says so. */
      const parts =
        kind === "complex"
          ? breakDown(
              runSteps
                .map((step) => ({ step, node: model.nodeById.get(step.node) }))
                .filter(
                  (visit): visit is { step: LaneStep; node: GraphNode } =>
                    !!visit.node,
                ),
              low.refEnd,
              high.refStart,
            )
          : null;
      out.push({
          contig,
        kind: parts ? "multiple" : kind,
        ...(parts ? { parts } : {}),
        refFrom: low.refEnd + head,
        refTo: high.refStart - tail,
        /* Read against the reference, the haplotype's own coordinates run
           the other way, so its ends trim the other way round too. */
        ownFrom: forward ? ownFrom + head : ownFrom + tail,
        ownTo: forward ? ownTo - tail : ownTo - head,
        runFrom: ownFrom,
        runTo: ownTo,
        reads: changed,
        instead,
        graph: head || tail ? { instead: whole, reads } : undefined,
        walk,
        jumpsBack: false,
        ...span(run),
      });
    }
    return out.sort((a, b) => a.refFrom - b.refFrom || a.ownFrom - b.ownFrom);
  };

  /** A variant's one line - or one of a multiple variant's parts: what it
      does, where in the haplotype and on the reference, and to what. */
  const variantLine = (
    variant: Omit<VariantPart, "kind"> & {
      kind: Variant["kind"];
      contig?: string;
      jumpsBack?: boolean;
      openAt?: Variant["openAt"];
      parts?: VariantPart[];
    },
    lane: Lane,
  ) => {
    const { kind, refFrom, refTo, ownFrom, ownTo, reads, instead } = variant;
    /* Where in the haplotype: a deletion is a point in it, where it joins
       across what it skips. */
    const own = altCoord(
      ownTo - ownFrom > 1
        ? `${variant.contig ?? lane.contig}:${ownFrom.toLocaleString()}–${ownTo.toLocaleString()}`
        : `${variant.contig ?? lane.contig}:${ownFrom.toLocaleString()}`,
    );
    /* One base is one position, as a VCF would say it. */
    const where =
      refTo - refFrom > 1
        ? `${referenceContig}:${refFrom.toLocaleString()}–${refTo.toLocaleString()}`
        : `${referenceContig}:${refFrom.toLocaleString()}`;
    if (kind === "unresolved") {
      return (
        <>
          unresolved · alt {own} · {reads.length.toLocaleString()} bp ·{" "}
          {variant.openAt === "both"
            ? "its walk here is all off the reference"
            : `its walk here ${variant.openAt === "start" ? "starts" : "ends"} off the reference`}
        </>
      );
    }
    /* Several changes: which, each named in its own colour. */
    if (kind === "multiple" && variant.parts) {
      const counts = new Map<VariantPart["kind"], number>();
      for (const part of variant.parts) {
        counts.set(part.kind, (counts.get(part.kind) ?? 0) + 1);
      }
      return (
        <>
          <span className={VARIANT_CLASS.multiple}>multiple</span> · alt {own} ·
          ref {refCoord(where)} ·{" "}
          {[...counts].map(([part, count], index) => (
            <span key={part}>
              {index ? " + " : ""}
              <span className={VARIANT_CLASS[part]}>
                {count > 1 ? `${count} ${part}s` : part}
              </span>
            </span>
          ))}
        </>
      );
    }
    /* Only what it is takes its colour; where it is stays the reference's
       blue, as every coordinate in the card does. */
    const what =
      kind === "substitution"
        ? <>{cardSequence(instead)} → {cardSequence(reads)}</>
        : kind === "insertion"
          ? <>+{reads.length.toLocaleString()} bp {cardSequence(reads)}</>
          : kind === "deletion"
            ? <>−{(refTo - refFrom).toLocaleString()} bp {cardSequence(instead)}</>
            : variant.jumpsBack
              ? "jumps back along the reference"
              : `${(refTo - refFrom).toLocaleString()} bp → ${reads.length.toLocaleString()} bp`;
    return (
      <>
        <span className={VARIANT_CLASS[kind]}>{kind}</span> · alt {own} · ref{" "}
        {kind === "insertion" ? "at " : ""}
        {refCoord(where)} · {what}
      </>
    );
  };

  /** What the copies among some nodes are copies of: the nodes the
      haplotype read once already, where the reference has them. A copy is
      the walk reading a node again - see buildModel - named `node~2` for
      the second time. */
  const copiesLine = (ids: string[]): string[] => {
    const originals = [
      ...new Set(
        ids
          .map((id) => model.nodeById.get(id)?.copyOf)
          .filter((id): id is string => !!id),
      ),
    ]
      .map((id) => model.nodeById.get(id))
      .filter((node): node is GraphNode => !!node);
    if (!originals.length) return [];
    const placed = originals.filter((node) => node.onReference);
    const where = placed.length
      ? `${referenceContig}:${Math.min(...placed.map((node) => node.refStart)).toLocaleString()}–${Math.max(...placed.map((node) => node.refEnd)).toLocaleString()}`
      : "";
    return [
      `${plural(originals.length, "node")} read a second time (~2): a copy of ${where ? `${where}, read first where the reference has it` : "nodes read first off the reference"} - the haplotype has these bases twice`,
    ];
  };

  /** The part of a variant a section of a bar holds, when the variant runs
      past it: its nodes there, and what they read. A 14 kb insertion is one
      variant, and clicked in a 600 bp section of it the card listed all of
      it. */
  const variantHere = (
    variant: Variant,
    lane: Lane,
    within: { from: number; to: number },
  ) => {
    if (variant.runFrom >= within.from && variant.runTo <= within.to) return null;
    const off = new Set(
      variant.walk.filter((id) => !model.nodeById.get(id)?.onReference),
    );
    const steps = lane.steps.filter(
      (step) =>
        off.has(step.node) &&
        Math.max(step.start, step.end) > within.from &&
        Math.min(step.start, step.end) < within.to,
    );
    if (!steps.length) return null;
    /* On the reference's strand: in the order they are drawn. */
    const nodes = steps
      .map((step) => model.nodeById.get(step.node))
      .filter((node): node is GraphNode => !!node)
      .sort((a, b) => a.x - b.x);
    return {
      from: Math.min(...steps.map((step) => Math.min(step.start, step.end))),
      to: Math.max(...steps.map((step) => Math.max(step.start, step.end))),
      ids: steps.map((step) => step.node),
      reads: nodes.map((node) => node.sequence).join(""),
    };
  };

  /** What a variant opens to: both sides of it, the walk through the
      graph, and - last - how common it is. Given the part of the
      haplotype a card is about, only what of the variant is in it. */
  const variantDetails = (
    variant: Variant,
    lane: Lane,
    within?: { from: number; to: number },
  ): ReactNode[] => {
    const { kind, walk } = variant;
    const lines: ReactNode[] = [];
    const here = within ? variantHere(variant, lane, within) : null;
    if (here) {
      lines.push(
        <>
          here: alt{" "}
          {altCoord(
            `${variant.contig ?? lane.contig}:${here.from.toLocaleString()}–${here.to.toLocaleString()}`,
          )}{" "}
          · {(here.to - here.from).toLocaleString()} bp of its{" "}
          {(variant.runTo - variant.runFrom).toLocaleString()}
        </>,
      );
    }
    /* A multiple one, broken down: each change it is made of. */
    if (variant.parts) {
      lines.push(`made of ${variant.parts.length} changes:`);
      for (const part of variant.parts) {
        lines.push(<span className="pgv-variant-part">{variantLine(part, lane)}</span>);
      }
    }
    if (kind === "unresolved") {
      lines.push(<>haplotype reads {cardSequence(variant.reads)}</>);
      lines.push(
        variant.openAt === "start"
          ? "its walk here starts already off the reference: it left the reference before what was fetched, or its contig starts here - which, the walk here cannot say"
          : variant.openAt === "end"
            ? "its walk here ends before it gets back to the reference: it carries on past what was fetched, or its contig ends here - which, the walk here cannot say"
            : "its walk here never touches the reference: it runs on past both ends of what was fetched, or it is a short contig that never meets the reference - which, the walk here cannot say",
        "so what it replaces on the reference is not known",
      );
    } else if (variant.jumpsBack) {
      lines.push(
        "the walk goes back over reference it has already read - a duplication or a rearrangement",
      );
      if (variant.reads) lines.push(<>reads {cardSequence(variant.reads)} on the way</>);
    } else {
      lines.push(
        variant.outside
          ? `it skips ${referenceContig}:${variant.refFrom.toLocaleString()}–${variant.refTo.toLocaleString()}, which runs past what was fetched`
          : <>reference reads {variant.instead ? cardSequence(variant.instead) : "nothing here"}</>,
        here
          ? <>haplotype reads here {cardSequence(here.reads)}</>
          : <>haplotype reads {variant.reads ? cardSequence(variant.reads) : "nothing here"}</>,
      );
      /* Where the graph's alleles carry a base they share, what they are
         before it is trimmed off. */
      if (variant.graph) {
        lines.push(
          <>as the graph has it: {cardSequence(variant.graph.instead)} → {cardSequence(variant.graph.reads)}</>,
        );
      }
    }
    lines.push(
      here
        ? `node walk here, the insertion going on either side of it: ${here.ids.join(" → ")}`
        : `node walk: ${walk.join(" → ")}`,
      ...copiesLine(here ? here.ids : walk),
    );
    return [
      ...lines,
      ...(kind === "unresolved"
        ? []
        : pangenomeLine(model.carriers?.alleles[alleleKey(walk)])),
    ];
  };

  /** The visits of a bar in a section - those on one row of it, given the
      row: a haplotype stacked there, its rows threads of the same contig
      from places of it far apart (HG02074#2's 061 at chr14:99,979,807, at
      95,382,388 and 95,612,965), read as one went from the one to the
      other. Every row, when the row has none there. */
  const sectionVisits = (
    raster: LaneRaster,
    section: StripSection,
    row: number | null,
  ) => {
    const inside: number[] = [];
    raster.nodes.forEach((visit, index) => {
      if (visit.right > section.left && visit.left < section.right) {
        inside.push(index);
      }
    });
    const onRow = inside.filter((index) => raster.nodes[index].card === row);
    return onRow.length ? onRow : inside;
  };

  /**
   * The card for one haplotype's bar in a section: where it is in its own
   * contig and on the reference, and every way it differs from the
   * reference there, each opening to what it is - on the row clicked.
   */
  const openLaneCard = (
    lane: Lane,
    section: StripSection,
    row: number | null,
    at: { x: number; y: number },
  ) => {
    const raster = rasters.get(lane.key);
    if (!raster) return;
    const visits = raster.nodes;
    const inside = sectionVisits(raster, section, row);
    if (!inside.length) {
      setCard(null);
      return;
    }

    const here = inside.map((index) => visits[index]);
    const from = Math.min(...here.map((visit) => visit.start));
    const to = Math.max(...here.map((visit) => visit.start + visit.length));
    /* Its variants that touch the section, on the visits picked; a deletion
       is as wide as what it skips. */
    const variants = laneVariants(lane).filter(
      (variant) =>
        variant.left < section.right &&
        Math.max(variant.right, variant.left + 0.01) > section.left &&
        variant.ownTo >= from &&
        variant.ownFrom <= to,
    );
    const kinds = (
      [
        "substitution",
        "multiple",
        "complex",
        "insertion",
        "deletion",
        "unresolved",
      ] as const
    )
      .map((kind) => [kind, variants.filter((variant) => variant.kind === kind).length] as const)
      .filter(([, count]) => count > 0)
      .map(([kind, count]) =>
        kind === "multiple" || kind === "complex" || kind === "unresolved"
          ? `${count} ${kind}`
          : plural(count, kind),
      );

    setCard({
      x: at.x,
      y: at.y,
      title: lane.label,
      lines: [
        <>
          {coordLabel(`Alt path (${lane.label})`)}{" "}
          {altCoord(
            `${contigOf(lane, here[0].piece)}:${from.toLocaleString()}–${to.toLocaleString()}`,
          )}{" "}
          · {(to - from).toLocaleString()} bp
        </>,
        regionLine(section),
        variants.length
          ? `${plural(variants.length, "variant")}: ${kinds.join(" · ")}`
          : "no variants here: it reads as the reference does",
      ],
      groups: [
        {
          head: `Variants (${variants.length})`,
          items: variants.map((variant) => {
            /* A variant running past the section is listed as the part of
               it here, with how big it is in all. */
            const here = variantHere(variant, lane, { from, to });
            return {
              key: `${alleleKey(variant.walk)}@${variant.ownFrom}`,
              line: here ? (
                <>
                  {variantLine(
                    { ...variant, ownFrom: here.from, ownTo: here.to, reads: here.reads },
                    lane,
                  )}{" "}
                  · part of {(variant.runTo - variant.runFrom).toLocaleString()} bp
                </>
              ) : (
                variantLine(variant, lane)
              ),
              details: variantDetails(variant, lane, { from, to }),
            };
          }),
        },
        {
          /* What builds the section: every node the bar reads in it, in
             the order it reads them - on the reference or off it. */
          head: `Nodes (${inside.length})`,
          items: inside.flatMap((index) => {
            const visit = visits[index];
            const node = model.nodeById.get(visit.id);
            if (!node) return [];
            const near = nearItem(node, visit.start);
            const dupes = dupeItems(node, lane, visit.start);
            const item = dupes.length
              ? {
                  ...near,
                  line: (
                    <>
                      {near.line} · {dupes.length} dupes
                    </>
                  ),
                  details: [
                    ...near.details,
                    `dupes: the haplotype reads this place ${dupes.length} times`,
                    ...dupes.map((dupe) => dupe.line),
                  ],
                }
              : near;
            const original = node.copyOf ? model.nodeById.get(node.copyOf) : undefined;
            return [
              original
                ? {
                    ...item,
                    line: (
                      <>
                        {item.line} · copy of {original.id}
                        {original.onReference ? (
                          <> at {refCoord(original.refStart.toLocaleString())}</>
                        ) : null}
                      </>
                    ),
                    details: [
                      `a copy: the haplotype reading node ${original.id} again${
                        original.onReference
                          ? `, which it read first at ${referenceContig}:${original.refStart.toLocaleString()}`
                          : ""
                      }`,
                      ...item.details,
                    ],
                  }
                : item,
            ];
          }),
        },
      ],
    });
  };

  /* ── Zoomed in: the card a hover shows and a click keeps ──────────────── */
  const laneByKey = (key: string) =>
    model.lanes.find((lane) => lane.key === key);
  /* Each haplotype's variants, worked out the first time a card asks and
     kept while the drawing stays the same. */
  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  const variantCache = useMemo(() => new Map<string, Variant[]>(), [model, axis, pxPerBase, width]);
  const variantsOf = (lane: Lane) => {
    let variants = variantCache.get(lane.key);
    if (!variants) {
      variants = laneVariants(lane);
      variantCache.set(lane.key, variants);
    }
    return variants;
  };
  const refWhere = (node: GraphNode) =>
    node.refEnd > node.refStart
      ? `${referenceContig}:${node.refStart.toLocaleString()}–${node.refEnd.toLocaleString()}`
      : `${referenceContig}:${node.refStart.toLocaleString()}`;
  /** The contig a piece of a lane is on: a lane can join a haplotype's. */
  const contigOf = (lane: Lane, piece: number) =>
    lane.segments[piece]?.contig ?? lane.contig;
  /** Which site a node is at: its column, or its original's for a copy. */
  const siteOf = (node: GraphNode) =>
    (node.copyOf ? model.nodeById.get(node.copyOf) : node)?.column ?? -1;
  /**
   * Every time a haplotype reads the place a node is at - that node, another
   * allele of its site, or a copy of either - in any of its contigs: the
   * node's dupes, itself among them. The bar draws one of them; a card says
   * how many there are and where each is.
   */
  const dupesOf = (node: GraphNode, label: string): Reading[] => {
    let byLabel = readingsByModel.get(model);
    if (!byLabel) readingsByModel.set(model, (byLabel = new Map()));
    let bySite = byLabel.get(label);
    if (!bySite) {
      bySite = new Map();
      for (const lane of model.lanes) {
        if (lane.isReference || lane.label !== label) continue;
        for (const step of lane.steps) {
          const visited = model.nodeById.get(step.node);
          if (!visited) continue;
          const site = siteOf(visited);
          const reading = { lane, step, node: visited };
          const list = bySite.get(site);
          if (list) list.push(reading);
          else bySite.set(site, [reading]);
        }
      }
      byLabel.set(label, bySite);
    }
    return bySite.get(siteOf(node)) ?? [];
  };
  /** A dupe for a card: where it is in its own contig, where on the
      reference - in place, standing in for a stretch, inserted, or outside
      this view - and what it reads. `own` is the one the card is about. */
  const dupeItems = (node: GraphNode, lane: Lane, own: number): CardItem[] => {
    const dupes = dupesOf(node, lane.label);
    if (dupes.length < 2) return [];
    return dupes.map(({ lane: of, step, node: visited }) => ({
      key: `${of.key}@${step.start}`,
      line: (
        <>
          {altCoord(`${contigOf(of, step.segment)}:${step.start.toLocaleString()}`)} ·{" "}
          {visited.untied ? (
            "outside this view"
          ) : visited.onReference ? (
            <>in place, {refCoord(refWhere(visited))}</>
          ) : visited.refEnd > visited.refStart ? (
            <>in place of {refCoord(refWhere(visited))}</>
          ) : (
            <>inserted at {refCoord(refWhere(visited))}</>
          )}{" "}
          · {cardSequence(visited.sequence)}
          {of.key === lane.key && step.start === own ? " · this one" : ""}
        </>
      ),
      details: [
        <>node {visited.id} · {visited.length.toLocaleString()} bp · reads {cardSequence(visited.sequence)}</>,
      ],
    }));
  };
  /** Where a node is on the reference, said for what it is: its own
      stretch, the stretch an alternative stands in for, or the point it
      goes in at. */
  const referenceLine = (node: GraphNode) => (
    <>
      {coordLabel(`Reference (${referenceName})`)} {refCoord(refWhere(node))} ·{" "}
      {node.onReference
        ? `${node.length.toLocaleString()} bp`
        : node.refEnd > node.refStart
          ? "the stretch it stands in for"
          : "where it goes in"}
    </>
  );
  /** A node a card lists beside the one it is about: where it is, opening
      to what it reads and how common it is. `own`, where it is in the
      haplotype the card is about. */
  const nearItem = (node: GraphNode, own?: number): CardItem => ({
    key: own === undefined ? node.id : `${node.id}@${own}`,
    line: (
      <>
        node {node.id} · {node.length} bp ·{" "}
        {own === undefined ? null : <>alt {altCoord(own.toLocaleString())} · </>}
        ref{" "}
        {refCoord(
          node.onReference ? node.refStart.toLocaleString() : nodeInterval(node),
        )}
      </>
    ),
    details: [<>reads {cardSequence(node.sequence)}</>, ...nodeCarriers(node)],
  });
  /**
   * The visits either side of one in a haplotype's bar: its own steps
   * before and after it, within the walk it is part of - the step past a
   * seam is where the haplotype was before it left the window.
   */
  const visitNeighbours = (lane: Lane, raster: LaneRaster, index: number) => {
    /* The raster holds a visit per step whenever every step's node is in
       the model, which is how it is built; then the steps say the walks. */
    const aligned = raster.nodes.length === lane.steps.length;
    const near = (other: number) => {
      if (other < 0 || other >= raster.nodes.length) return null;
      if (aligned && lane.steps[other].segment !== lane.steps[index].segment) {
        return null;
      }
      const visit = raster.nodes[other];
      const node = model.nodeById.get(visit.id);
      return node ? { visit, node, index: other } : null;
    };
    return { prev: near(index - 1), next: near(index + 1) };
  };
  /** A node's neighbours in the graph, either side of it in the layout. */
  const graphNeighbours = (node: GraphNode) => {
    const ids = new Set<string>();
    for (const edge of model.edges) {
      if (edge.to === node.id) ids.add(edge.from);
      if (edge.from === node.id) ids.add(edge.to);
    }
    ids.delete(node.id);
    const near = [...ids]
      .map((id) => model.nodeById.get(id))
      .filter((other): other is GraphNode => !!other)
      .sort((a, b) => a.x - b.x || a.row - b.row);
    return {
      prev: near.filter((other) => other.x < node.x),
      next: near.filter((other) => other.x > node.x),
    };
  };
  /** The letters under the pointer, and where in the haplotype they are. */
  const cardZoom = (
    zoom: NonNullable<LaneHover["zoom"]>,
    contig: string,
  ): CardZoom => {
    /* The pointer is one pixel and a pixel can cover several bases: all of
       the ones it covers are marked. */
    const marked = Math.max(0, Math.min(zoom.at, zoom.letters.length - 1));
    const after =
      marked +
      Math.max(1, Math.min(zoom.span ?? 1, zoom.letters.length - marked));
    const from = zoom.markFrom;
    const to = zoom.markTo + 1;
    return {
      before: zoom.letters.slice(0, marked).join(""),
      at: zoom.letters.slice(marked, after).join(""),
      after: zoom.letters.slice(after).join(""),
      where: (
        <>
          under the pointer: alt{" "}
          {altCoord(
            to - from > 1
              ? `${contig}:${from.toLocaleString()}–${to.toLocaleString()} · ${to - from} bp`
              : `${contig}:${from.toLocaleString()}`,
          )}
        </>
      ),
    };
  };
  /** One visit of a haplotype's bar: where it is in the haplotype and on
      the reference, the variant it is part of, and the visits either side. */
  const describeVisit = (
    target: Extract<CardTarget, { kind: "visit" }>,
  ): CardContent | null => {
    const lane = laneByKey(target.lane);
    const raster = rasters.get(target.lane);
    const visit = raster?.nodes[target.index];
    const node = visit ? model.nodeById.get(visit.id) : undefined;
    if (!lane || !raster || !visit || !node) return null;
    const near = visitNeighbours(lane, raster, target.index);
    /* The variant this visit is one of the nodes of, if it is off the
       reference: a node can be read twice, so by where it is read. */
    const variants = node.onReference
      ? []
      : variantsOf(lane).filter(
          (variant) =>
            variant.walk.includes(node.id) &&
            variant.runFrom <= visit.start &&
            visit.start < Math.max(variant.runTo, variant.runFrom + 1),
        );
    const dupes = dupeItems(node, lane, visit.start);
    return {
      title: `${lane.label} · node ${node.id}`,
      zoom: target.zoom ? cardZoom(target.zoom, contigOf(lane, visit.piece)) : undefined,
      lines: [
        <>
          {coordLabel(`Alt path (${lane.label})`)}{" "}
          {altCoord(
            `${contigOf(lane, visit.piece)}:${visit.start.toLocaleString()}–${(
              visit.start + visit.length
            ).toLocaleString()}`,
          )}{" "}
          · {visit.length.toLocaleString()} bp
          {dupes.length ? ` · ${dupes.length} dupes` : ""}
        </>,
        referenceLine(node),
        node.onReference ? "on the reference walk" : "off the reference walk",
        ...(() => {
          const original = node.copyOf ? model.nodeById.get(node.copyOf) : undefined;
          if (!original) return [];
          const time = node.id.slice(node.id.lastIndexOf("~") + 1);
          return [
            `the haplotype reading node ${original.id} again - time ${time} - ${
              original.onReference
                ? `the first is on the reference at ${referenceContig}:${original.refStart.toLocaleString()}`
                : "the first is off the reference"
            }`,
          ];
        })(),
        <>reads {cardSequence(node.sequence)}</>,
        ...nodeCarriers(node),
      ],
      groups: [
        ...(variants.length
          ? [
              {
                head: variants.length > 1 ? `Variants (${variants.length})` : "Variant",
                items: variants.map((variant) => ({
                  key: `${alleleKey(variant.walk)}@${variant.ownFrom}`,
                  line: variantLine(variant, lane),
                  details: variantDetails(variant, lane),
                })),
              },
            ]
          : []),
        ...(dupes.length ? [{ head: `Dupes (${dupes.length})`, items: dupes }] : []),
        {
          head: "Previous node",
          near: true,
          items: near.prev ? [nearItem(near.prev.node, near.prev.visit.start)] : [],
          empty: "none: the haplotype enters the window here",
        },
        {
          head: "Next node",
          near: true,
          items: near.next ? [nearItem(near.next.node, near.next.visit.start)] : [],
          empty: "none: the haplotype leaves the window here",
        },
      ],
    };
  };
  /** One node of the graph strip: where it is, what it reads, and the
      nodes it joins either side. */
  const describeNode = (id: string): CardContent | null => {
    const node = model.nodeById.get(id);
    if (!node) return null;
    const near = graphNeighbours(node);
    return {
      title: `node ${node.id}`,
      lines: [
        referenceLine(node),
        node.onReference
          ? "on the reference walk"
          : "an alternative to the reference here",
        <>reads {cardSequence(node.sequence)}</>,
        carriersLine(node),
        ...sameSequenceLines(node, model),
        ...nodeCarriers(node),
      ],
      groups: [
        {
          head: `Previous nodes (${near.prev.length})`,
          near: true,
          items: near.prev.map((other) => nearItem(other)),
          empty: "none in the window",
        },
        {
          head: `Next nodes (${near.next.length})`,
          near: true,
          items: near.next.map((other) => nearItem(other)),
          empty: "none in the window",
        },
      ],
    };
  };
  /** The ways into or out of a visit a bullet counts: pointing at one in
      the card draws a line to where it is. */
  const describeWays = (
    target: Extract<CardTarget, { kind: "ways" }>,
  ): CardContent | null => {
    const lane = laneByKey(target.lane);
    const visit = rasters.get(target.lane)?.nodes[target.index];
    if (!lane || !visit) return null;
    const nodes = target.ids
      .map((id) => model.nodeById.get(id))
      .filter((node): node is GraphNode => !!node);
    return {
      title: `${lane.label}: ${target.ids.length} ways ${
        target.side === "before" ? "into" : "out of"
      } node ${visit.id}`,
      lines: ["point at one to see where it is"],
      groups: [
        {
          head: `Nodes (${nodes.length})`,
          items: nodes.map((node) => ({
            ...nearItem(node),
            onPoint: (on: boolean) =>
              setLinked(on ? { lane: lane.key, id: node.id } : null),
          })),
        },
      ],
    };
  };
  const describe = (target: CardTarget) =>
    target.kind === "visit"
      ? describeVisit(target)
      : target.kind === "node"
        ? describeNode(target.id)
        : describeWays(target);
  /* A hover shows the card a click would keep - unless one is kept. */
  const showHover = (target: CardTarget, x: number, y: number) => {
    if (cardKeptOpen()) {
      hideHover();
      return;
    }
    hoverCard.current?.show(targetKey(target), () => describe(target), x, y);
  };
  /* A click keeps it, where the click was. */
  const pin = (target: CardTarget, x: number, y: number) => {
    const content = describe(target);
    hideHover();
    setLitRun(null);
    if (content) setCard({ ...content, x, y, target });
  };

  const dim = (lane: Lane) =>
    (highlight !== null && haplotypeOf(highlight) !== haplotypeOf(lane.key)) ||
    (litLanes !== null && !litLanes.has(haplotypeOf(lane.key)));

  /* Where the lit allele sits in the bar of each haplotype that carries
     it. Worked out here rather than held: it is one node against a dozen
     lanes, and everything it is measured from - the axis, the rows - is
     built fresh on the render it is drawn in. */
  const litSpans: Array<{
    key: string;
    x: number;
    width: number;
    y: number;
    height: number;
  }> = [];
  if (litRun && !litRun.lane) {
    for (const id of litRun.nodes) {
      const node = model.nodeById.get(id);
      if (!node) continue;
      const left = px(node.x);
      const wide = Math.max(1, px(node.x + node.length) - left);
      for (const lane of new Set(node.lanes.map(haplotypeOf))) {
        /* The reference has no bar of its own; the strip is its bar. */
        const top = laneTop.get(lane);
        if (top === undefined) continue;
        litSpans.push({
          key: `${id}:${lane}`,
          x: left,
          width: wide,
          y: top,
          height: laneHeight.get(lane) ?? BAR_H,
        });
      }
    }
  }
  /* What a kept card is about, outlined where it is drawn - in the hover's
     cyan - and the nodes either side of it in yellow: in a haplotype's bar,
     its own steps before and after; in the strip, the nodes it joins. */
  const kept = card?.target ?? null;
  const openBullet = kept?.kind === "ways" ? kept : null;
  const keptMarks: Array<{
    key: string;
    x: number;
    y: number;
    width: number;
    height: number;
    near: boolean;
  }> = [];
  const keptNodes = new Map<string, boolean>();
  if (kept?.kind === "visit") {
    const lane = laneByKey(kept.lane);
    const raster = rasters.get(kept.lane);
    const top = laneTop.get(kept.lane);
    const self = raster?.nodes[kept.index];
    if (lane && raster && self && top !== undefined) {
      const near = visitNeighbours(lane, raster, kept.index);
      /* Round every piece of its bar: where it shares the place, its own
         thinner bar there. */
      const mark = (_visit: RasterNode, index: number, isNear: boolean) =>
        visitPieces(raster, index, BAR_H).forEach((piece, k) =>
          keptMarks.push({
            key: `${index}:${k}`,
            x: piece.left,
            y: top + piece.top,
            width: Math.max(1, piece.right - piece.left),
            height: piece.height,
            near: isNear,
          }),
        );
      if (near.prev) mark(near.prev.visit, near.prev.index, true);
      if (near.next) mark(near.next.visit, near.next.index, true);
      mark(self, kept.index, false);
    }
  } else if (kept?.kind === "node") {
    const node = model.nodeById.get(kept.id);
    if (node) {
      const near = graphNeighbours(node);
      for (const other of [...near.prev, ...near.next]) {
        keptNodes.set(other.id, true);
      }
      keptNodes.set(node.id, false);
    }
  }

  return (
    <div
      className="pgv-linear"
      style={{ width, height }}
      onMouseLeave={hideHover}
    >
      {/* ── Haplotype bars ──────────────────────────────────────────────
          Painted, not drawn. Each is a canvas over the whole band, filled
          from its raster - see laneRaster.ts for why, and for how a hover
          finds what is under the pointer without anything to hit. */}
      {model.lanes
        .filter((lane) => !lane.isReference)
        .map((lane) => (
        <div
          key={lane.key}
          className="pgv-lane-slot"
          style={{
            top: laneTop.get(lane.key),
            height: laneHeight.get(lane.key) ?? BAR_H,
          }}
        >
          <LaneCanvas
            raster={rasters.get(lane.key)!}
            width={width}
            height={laneHeight.get(lane.key) ?? BAR_H}
            barH={BAR_H}
            /* The haplotype's own pastel, from its name - see pastelColor -
               its variant stretches hatched in ivory (LaneCanvas). */
            color={lane.color}

            contig={lane.contig}
            isReference={lane.isReference}
            spellReference={alleleRows}
            dim={dim(lane)}
            /* Zoomed out, the bar is drawn and read a section at a time:
               what this haplotype does in the section clicked. */
            sections={sections ?? undefined}
            sectionAltBp={sectionAltBp}
            onPress={
              sections
                ? ({ x, row, clientX, clientY }) => {
                    const section = sectionAt(x);
                    if (section) {
                      openLaneCard(lane, section, row, { x: clientX, y: clientY });
                    }
                  }
                : undefined
            }
            /* The section the pointer is on, outlined across this bar where
               the haplotype has anything in it: what a click would open. */
            onPoint={(point) => {
              const outline = hoverBoxRef.current;
              if (!outline) return;
              const section = point === null ? null : sectionAt(point.x);
              const raster = rasters.get(lane.key);
              const top = laneTop.get(lane.key);
              let from = Infinity;
              let to = -Infinity;
              let high = Infinity;
              let low = -Infinity;
              if (section && raster && point) {
                for (const index of sectionVisits(raster, section, point.row)) {
                  const visit = raster.nodes[index];
                  from = Math.min(from, Math.max(section.left, visit.left));
                  to = Math.max(to, Math.min(section.right, visit.right));
                  for (const piece of visitPieces(raster, index, BAR_H)) {
                    if (piece.right <= section.left || piece.left >= section.right) {
                      continue;
                    }
                    high = Math.min(high, piece.top);
                    low = Math.max(low, piece.top + piece.height);
                  }
                }
              }
              if (top === undefined || !(to > from)) {
                outline.style.display = "none";
                return;
              }
              /* The rows outlined: the one pointed at, as tall as it is
                 drawn there. */
              const y = low > high ? top + high : top;
              outline.setAttribute("x", String(from));
              outline.setAttribute("y", String(y));
              outline.setAttribute("width", String(Math.max(1, to - from)));
              outline.setAttribute("height", String(low > high ? low - high : BAR_H));
              outline.style.display = "";
            }}
            onHover={(hover) => {
              const outline = hoverBoxRef.current;
              const top = laneTop.get(lane.key);
              /* While a card is kept, a hover says nothing. */
              if (!hover || top === undefined || cardKeptOpen()) {
                if (outline) outline.style.display = "none";
                hideHover();
                return;
              }
              /* Round the stretch under the pointer, in this bar only - in
                 a stack, round its own thinner bar. */
              const raster = rasters.get(lane.key);
              const piece = raster
                ? pieceAt(visitPieces(raster, hover.index, BAR_H), hover.at)
                : null;
              if (outline && piece) {
                outline.setAttribute("x", String(piece.left));
                outline.setAttribute("y", String(top + piece.top));
                outline.setAttribute(
                  "width",
                  String(Math.max(1, piece.right - piece.left)),
                );
                outline.setAttribute("height", String(piece.height));
                outline.style.display = "";
              }
              showHover(
                {
                  kind: "visit",
                  lane: lane.key,
                  index: hover.index,
                  zoom: hover.zoom,
                },
                hover.x,
                hover.y,
              );
            }}
            onPick={(hover) =>
              pin(
                {
                  kind: "visit",
                  lane: lane.key,
                  index: hover.index,
                  zoom: hover.zoom,
                },
                hover.x,
                hover.y,
              )
            }
          />
        </div>
        ))}

      {/* The ruler and the graph, still drawn: one is a handful of lines and
          the other is a single row, and the row has to be an element to be
          held at the top of the screen. Laid over the bars and deaf to the
          pointer, so a hover reaches the canvas underneath; the graph turns
          its own ear back on. */}
      <svg
        className="pgv-svg pgv-over"
        ref={svgRef}
        width={width}
        height={height}
        onMouseLeave={() => {
          hideHover();
          setLitRun(null);
        }}
        onClick={() => setCard(null)}
      >
        <defs>
          <pattern
            id={hatchId}
            width={HATCH_PITCH}
            height={HATCH_PITCH}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={HATCH_PITCH}
              stroke={HATCH_INK}
              strokeWidth={2}
            />
          </pattern>
        </defs>

        {/* No ruler: eg3's ruler track draws the coordinates, on the same
            band. */}


      {/* The foot of each row, carried on from the rule under its name.
          It lands in the gap under the bar, where nothing is drawn, so it
          bounds the band without crossing anything in it. */}
      {layout.rows.map((row) => (
        <line
          key={`rule-${row.key}`}
          className="pgv-row-rule"
          x1={0}
          x2={width}
          /* The last pixel of the row, not the first of the next: the
             rows are flush, so a rule drawn under one sat on the top of
             the bar below it. */
          y1={row.top + row.height - 0.5}
          y2={row.top + row.height - 0.5}
        />
      ))}

      {/* Where this haplotype's own way into an allele, or out of it, is one
          of several, a bullet on that side with how many there are. Its own
          steps, not the graph's edges: a bar is one haplotype's reading, and
          what another does at the same allele is drawn in its own bar. */}
      {/* Zoomed out a bullet would sit on a node a pixel wide, a thousand
          of them over each other; the section's card names the nodes. */}
      {!sections && model.lanes.map((lane) => {
        if (lane.isReference) return null;
        const raster = rasters.get(lane.key);
        const top = laneTop.get(lane.key);
        if (!raster || top === undefined) return null;
        return raster.nodes.map((visit, index) => {
          if (visit.onReference || !(visit.right > visit.left)) return null;
          const own = visitPieces(raster, index, BAR_H);
          if (!own.length) return null;
          const links = laneNeighbours(lane, visit.id);
          const sides = [
            ["before", visit.left, links.prev],
            ["after", visit.right, links.next],
          ] as Array<["before" | "after", number, string[]]>;
          return sides.map(([side, at, ids]) => {
            /* Level with its bar on that side, whichever piece it is. */
            const end = side === "before" ? own[0] : own[own.length - 1];
            const middle = top + (end ? end.top + end.height / 2 : BAR_H / 2);
            /* One way in and one way out is the ordinary case, and says
               nothing worth a mark. */
            if (ids.length < 2) return null;
            const key = `${lane.key}-${index}-${side}`;
            /* Opened rather than shown in passing: a reader asks for it, and
               it stays until they ask for something else. */
            const open = (event: React.MouseEvent) => {
              event.stopPropagation();
              pin(
                {
                  kind: "ways",
                  lane: lane.key,
                  index,
                  side,
                  ids,
                  x: at,
                  y: middle,
                },
                event.clientX,
                event.clientY,
              );
            };
            const isOpen =
              openBullet?.lane === lane.key &&
              openBullet.index === index &&
              openBullet.side === side;
            return (
              <g
                key={key}
                className={`pgv-bullet pgv-hears${isOpen ? " pgv-bullet-open" : ""}`}
                onClick={open}
              >
                <circle cx={at} cy={middle} r={BULLET_R} />
                <text x={at} y={middle}>
                  {ids.length}
                </text>
              </g>
            );
          });
        });
      })}

      {/* Whatever the pointer is on, outlined where that haplotype draws it. */}
      <rect
        className="pgv-hover-node"
        ref={hoverBoxRef}
        x={0}
        y={0}
        width={0}
        height={0}
        style={{ display: "none" }}
      />

      {keptMarks.map((mark) => (
        <rect
          key={`kept-${mark.key}`}
          className={mark.near ? "pgv-kept-near" : "pgv-kept-node"}
          x={mark.x}
          y={mark.y}
          width={mark.width}
          height={mark.height}
        />
      ))}

      {/* From an open bullet to whichever of the nodes it names the pointer
          is on: the list says what they are, this says where. */}
      {openBullet &&
        linked &&
        (() => {
          const raster = rasters.get(linked.lane);
          const top = laneTop.get(linked.lane);
          if (!raster || top === undefined) return null;
          const index = raster.nodes.findIndex((n) => n.id === linked.id);
          const visit = raster.nodes[index];
          if (!visit) return null;
          const piece = pieceAt(
            visitPieces(raster, index, BAR_H),
            (visit.left + visit.right) / 2,
          );
          return (
            <line
              className="pgv-bullet-link"
              x1={openBullet.x}
              y1={openBullet.y}
              x2={(visit.left + visit.right) / 2}
              y2={top + (piece ? piece.top + piece.height / 2 : BAR_H / 2)}
            />
          );
        })()}

      {/* The lit allele where its haplotypes carry it. Over the bars and
          deaf to the pointer, so hovering still reaches the canvas. */}
      {litSpans.map((span) => (
        <rect
          key={span.key}
          className="pgv-lit-span"
          x={span.x}
          y={span.y}
          width={span.width}
          height={span.height}
        />
      ))}

      {/* ── The graph underneath ──────────────────────────────────────── */}
      {/* One group, so the whole strip can be held at the top of the screen
          together. Last in the drawing, so it paints over the bars it floats
          across on the way down. */}
      {strip && (
      <g className="pgv-strip pgv-hears" ref={stickyRef}>
        {/* Ground under the strip, so the bars it floats over do not show
            through it. The shell's own colour, which makes it invisible
            where the strip is sitting in its own slot. */}
        <rect
          className="pgv-strip-ground"
          x={0}
          y={stripTop - STRIP_GROUND_PAD}
          width={width}
          height={stripH + STRIP_GROUND_PAD}
        />
        {/* Inside the drawing rather than in a gutter beside it, since a
            gutter is width the band cannot spare. */}
        <text className="pgv-strip-label" x={6} y={stripTop + 12}>
          graph
        </text>
        {sections &&
          sections.map((section, index) => {
            /* One box per row of the strip, from the first of the
               section's nodes in that row to the last. */
            const rows = new Map<
              number,
              { left: number; right: number; alt: boolean; lit: boolean }
            >();
            for (const node of section.nodes) {
              if (!alleleRows && !node.onReference) continue;
              const left = px(node.x);
              const right = Math.max(left + 1, px(node.x + node.length));
              const lit =
                highlight === null ||
                node.lanes.some((key) => haplotypeOf(key) === haplotypeOf(highlight));
              const row = rows.get(node.row);
              if (!row) {
                rows.set(node.row, { left, right, alt: !node.onReference, lit });
                continue;
              }
              row.left = Math.min(row.left, left);
              row.right = Math.max(row.right, right);
              row.alt &&= !node.onReference;
              row.lit ||= lit;
            }
            return (
              <g key={`section-${index}`}>
                {[...rows].map(([r, row]) => (
                  <g
                    key={r}
                    className={`pgv-node${row.alt ? " pgv-node-alt" : ""}${
                      row.lit ? "" : " pgv-dim"
                    }`}
                  >
                    <rect
                      x={row.left}
                      y={stripTop + r * NODE_H}
                      width={row.right - row.left}
                      height={NODE_H}
                    />
                  </g>
                ))}
                <line
                  className="pgv-node-edge"
                  x1={section.left}
                  x2={section.left}
                  y1={stripTop}
                  y2={stripTop + NODE_H}
                />
                <rect
                  className="pgv-section-hit"
                  x={section.left}
                  y={stripTop}
                  width={Math.max(1, section.right - section.left)}
                  height={stripH}
                  onClick={(event) => {
                    event.stopPropagation();
                    openStripCard(section, {
                      x: event.clientX,
                      y: event.clientY,
                    });
                  }}
                />
              </g>
            );
          })}
        {!sections && model.nodes
        /* The reference's own walk always, and the alternative alleles with
           it while they are asked for. Row 0 is not the same test: where the
           reference skips a site entirely, the alternative takes row 0, and
           filtering on the row would leave those alleles in the strip even
           with the button off. An untied node has no place here; see the
           sections. */
        .filter((node) => !node.untied && (alleleRows || node.onReference))
        .map((node) => {
          const y = stripTop + node.row * NODE_H;
          /* From the axis at both ends, so a node in a closed gap is drawn
             as narrow as the gap. */
          const left = px(node.x);
          const w = Math.max(1, px(node.x + node.length) - left);
          const perBase = node.length > 0 ? w / node.length : scale;
          const lit =
                highlight === null ||
                node.lanes.some((key) => haplotypeOf(key) === haplotypeOf(highlight));
          return (
            <g
              key={node.id}
              className={`pgv-node${node.onReference ? "" : " pgv-node-alt"}${
                lit ? "" : " pgv-dim"
              }${nodeIsLit(node.id) ? " pgv-node-lit" : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                pin({ kind: "node", id: node.id }, event.clientX, event.clientY);
              }}
              onMouseMove={(event) => {
                /* While a card is kept, a hover says nothing. */
                if (cardKeptOpen()) {
                  hideHover();
                  return;
                }
                /* Lighting it is what makes it spell itself out when it is
                   too small to have. */
                if (litRun?.key !== node.id) {
                  setLitRun({
                    key: node.id,
                    lane: "",
                    nodes: new Set([node.id]),
                  });
                }
                showHover({ kind: "node", id: node.id }, event.clientX, event.clientY);
              }}
            >
              <rect x={left} y={y} width={w} height={NODE_H} />
              {/* Where this node begins. The bar itself runs on through
                  its neighbours, so without this there is nothing to say
                  one node from the next - and with the old hairline
                  between them there was no telling a boundary from a gap
                  the layout kept for somebody else's allele. */}
              <line
                className="pgv-node-edge"
                x1={left}
                x2={left}
                y1={y}
                y2={y + NODE_H}
              />
              {spellsOut(node, perBase) && (
                <text
                  className="pgv-seq"
                  x={baseCentres(left, node.length, perBase)}
                  /* On the middle of the box, not a fixed drop from its
                   foot: the letters grow with the zoom and a constant
                   offset leaves them riding high at one zoom and low at
                   the next. The font places its own centre. */
                  y={y + NODE_H / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={Math.min(letterSize, sequenceSize(perBase))}
                >
                  {node.sequence}
                </text>
              )}
              </g>
            );
          })}
        {/* The kept node, and the nodes it joins either side. */}
        {!sections &&
          [...keptNodes].map(([id, near]) => {
            const node = model.nodeById.get(id);
            if (!node || !(alleleRows || node.onReference)) return null;
            const left = px(node.x);
            return (
              <rect
                key={`kept-${id}`}
                className={near ? "pgv-kept-near" : "pgv-kept-node"}
                x={left}
                y={stripTop + node.row * NODE_H}
                width={Math.max(1, px(node.x + node.length) - left)}
                height={NODE_H}
              />
            );
          })}
        {referenceGaps.map((gap, index) => (
          <rect
            key={`refgap-${index}`}
            className="pgv-reference-gap"
            x={gap.x}
            y={gap.y}
            width={gap.width}
            height={NODE_H}
          />
        ))}
      </g>
      )}

      </svg>

      {/* A clicked section, until another is clicked, the drawing is, or
          the reader closes it. */}
      {card && (
        <FloatingCard x={card.x} y={card.y} className="pgv-section-card">
          <button
            type="button"
            className="pgv-section-close"
            aria-label="Close"
            onClick={() => setCard(null)}
          >
            ×
          </button>
          <CardBody card={card} openItems={openItems} onToggle={toggleItem} />
        </FloatingCard>
      )}
      <HoverCard ref={hoverCard} />
    </div>
  );
}

/**
 * Wrapped, because the drawing is the expensive part of this view and it
 * only changes when its props do. The container holds those props still
 * between renders, so a hover - which no longer touches React state at
 * all - cannot reach this.
 */
export default memo(LinearPathView);
