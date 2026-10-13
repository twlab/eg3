import { useId, useMemo, useState, memo, useRef, useEffect } from "react";
import type {
  DrawFrame,
  GraphNode,
  Lane,
  PangenomeModel,
} from "./pangenomeModel";
import LaneCanvas from "./LaneCanvas";
import FloatingCard from "./FloatingCard";
import { rasteriseLanes } from "./laneRaster";
import { laneLayout } from "./laneLayout";
import { FOOT_PAD, LANE_H, NODE_H } from "./laneLayout";
import { bandAxis } from "./pangenomeModel";
import {
  baseCentres,
  laneNeighbourLines,
  laneNeighbours,
  nodeDetailLines,
  nodeInterval,
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
/** How many of the nodes it connects to a bullet names before it counts. */
const BULLET_LIST_MAX = 8;
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
/** How many nodes of each kind a section's card names before it counts. */
const SECTION_LIST_MAX = 12;

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
  /** What a hover said, kept by a click: its lines wrap. */
  detail?: boolean;
  title: string;
  lines: string[];
  /** Headed lists: the nodes of each kind, or a haplotype's alleles. */
  groups: Array<{ head: string; lines: string[] }>;
}

/** The first few of a list, and how many more there are. */
const listed = (lines: string[]) =>
  lines.length > SECTION_LIST_MAX
    ? [
        ...lines.slice(0, SECTION_LIST_MAX),
        `…and ${lines.length - SECTION_LIST_MAX} more`,
      ]
    : lines;

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

  onHover,
  onSelectNode,
  selectedNode,
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

  /* What a bullet says when it is asked: the nodes on the other side of it. */
  const neighbourLines = (ids: string[]) => {
    const shown = ids.slice(0, BULLET_LIST_MAX);
    const lines = shown.map((id) => {
      const node = model.nodeById.get(id);
      if (!node) return `node ${id}`;
      const carried = `${node.lanes.length}/${model.lanes.length} haplotypes`;
      return `node ${id} · ${node.length} bp · ${carried}${
        node.onReference ? " · reference walk" : ""
      }`;
    });
    if (ids.length > shown.length) {
      lines.push(`…and ${ids.length - shown.length} more`);
    }
    return lines;
  };
  /**
   * The bullet a reader has opened, if any, and the node they are pointing
   * at of the ones it names.
   *
   * Kept apart from the hover, which writes to the tooltip and touches no
   * state at all: this changes only when the pointer crosses one of the few
   * nodes an open bullet names, so it costs a render then and never
   * otherwise.
   */
  const [openBullet, setOpenBullet] = useState<{
    key: string;
    x: number;
    y: number;
    ids: string[];
  } | null>(null);
  const [linked, setLinked] = useState<{ lane: string; id: string } | null>(
    null,
  );

  /* The section a reader clicked, zoomed out; see SECTION_PX. */
  const [card, setCard] = useState<SectionCard | null>(null);

  /* What the pointer last hovered - a node of the strip, a stretch of a
     bar - so a click there can keep it open as a card. */
  const lastHover = useRef<HoverTarget | null>(null);
  const hoverTo = (target: HoverTarget | null) => {
    lastHover.current = target;
    onHover(target);
  };
  /** A click where a hover was: the same lines, kept, at the pointer. */
  const openDetailCard = (at: { clientX: number; clientY: number }) => {
    const target = lastHover.current;
    if (!target) return;
    setCard({
      x: at.clientX,
      y: at.clientY,
      title: target.title,
      lines: target.lines,
      groups: [],
      detail: true,
    });
    /* The card says it now; the tooltip would sit on top of it. */
    onHover(null);
  };

  /* Which haplotype's bar a pick came from, where it came from one. A node
     clicked in the graph belongs to every haplotype carrying it; one clicked
     in a bar belongs to that bar, and that is the route worth lighting. */
  const [pickedLane, setPickedLane] = useState<string | null>(null);

  /**
   * The route a picked node belongs to.
   *
   * Picking one asks what it is part of, and the answer is the detour it sits
   * in: the run of alleles that connect to one another, from where the
   * haplotype leaves the reference walk to where it rejoins it. Not every
   * allele the haplotype carries - those are separate detours, each with its
   * own place - and not the sequence it shares, which is most of the window
   * and is what every other haplotype has too.
   */
  const routeNodes = useMemo(() => {
    const picked = selectedNode ? model.nodeById.get(selectedNode) : null;
    /* A stretch of the reference is not a detour, so there is nothing to
       light: every haplotype has it. */
    if (!picked || picked.onReference) return null;
    /* The bar it was picked from, or failing that everything carrying it. */
    const carrying =
      pickedLane && picked.lanes.includes(pickedLane)
        ? new Set([pickedLane])
        : new Set(picked.lanes);
    const offReference = (id: string) =>
      model.nodeById.get(id)?.onReference === false;

    const nodes = new Set<string>();
    for (const lane of model.lanes) {
      if (!carrying.has(lane.key)) continue;
      const steps = lane.steps;
      steps.forEach((step, index) => {
        if (step.node !== selectedNode) return;
        /* Out both ways while the haplotype is still off the reference: the
           detour this visit belongs to, and no further. A haplotype that
           passes the same allele twice has each visit answered on its own. */
        let from = index;
        let to = index;
        while (from > 0 && offReference(steps[from - 1].node)) from -= 1;
        while (to + 1 < steps.length && offReference(steps[to + 1].node)) {
          to += 1;
        }
        for (let at = from; at <= to; at += 1) nodes.add(steps[at].node);
      });
    }
    return nodes.size ? nodes : null;
  }, [selectedNode, pickedLane, model]);

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
      for (const key of model.nodeById.get(id)?.lanes ?? []) lanes.add(key);
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
  const spellsOut = (node: { id: string; length: number }, perBase: number) =>
    node.length > 0 &&
    (sequenceSize(perBase) >= SEQUENCE_MIN_SIZE || nodeIsLit(node.id));

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
     starts clear of it, so the alleles of one site always land together. */
  const sections = useMemo<StripSection[] | null>(() => {
    if (sequenceSize(scale) >= SEQUENCE_MIN_SIZE) return null;
    const placed = model.nodes
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
    model.lanes.find((lane) => lane.isReference)?.contig ?? "";

  /** The stretch of reference a section covers. */
  const regionLine = (section: StripSection) => {
    const refStart = Math.min(...section.nodes.map((node) => node.refStart));
    const refEnd = Math.max(...section.nodes.map((node) => node.refEnd));
    return `${referenceContig}:${refStart.toLocaleString()}–${refEnd.toLocaleString()} (${(
      refEnd - refStart
    ).toLocaleString()} bp of reference)`;
  };
  const refNodeLine = (node: GraphNode) =>
    `node ${node.id} · ${node.length} bp · at ${node.refStart.toLocaleString()}`;
  /* An alt node has no place on the reference of its own: what it has is
     the stretch of reference its site stands in for, or the point it is
     inserted at. A haplotype's card adds where it is in that haplotype. */
  const altNodeLine = (node: GraphNode, own?: number) =>
    `node ${node.id} · ${node.length} bp · ref ${nodeInterval(node)}${
      own === undefined ? "" : ` · own ${own.toLocaleString()}`
    } · ${node.lanes.length}/${model.lanes.length} haplotypes`;
  const plural = (n: number, word: string) =>
    `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

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
        { head: `Reference nodes (${refs.length})`, lines: listed(refs.map(refNodeLine)) },
        {
          head: `Alt nodes (${alts.length})`,
          lines: listed(alts.map((node) => altNodeLine(node))),
        },
      ],
    });
  };

  /**
   * The card for one haplotype's bar in a section: what this haplotype
   * does there. Its own coordinates, how much of it is off the reference,
   * and each allele it carries - where it leaves the reference walk, what
   * it reads instead, and where it comes back - followed in its own walk
   * past the section's edges, so an allele is named whole.
   */
  const openLaneCard = (
    lane: Lane,
    section: StripSection,
    at: { x: number; y: number },
  ) => {
    const raster = rasters.get(lane.key);
    if (!raster) return;
    const visits = raster.nodes;
    const inside: number[] = [];
    visits.forEach((visit, index) => {
      if (visit.right > section.left && visit.left < section.right) {
        inside.push(index);
      }
    });
    if (!inside.length) {
      setCard(null);
      return;
    }

    /* Its alleles: runs of visits off the reference walk. */
    const alleles: Array<{ from: number; to: number }> = [];
    for (const index of inside) {
      if (visits[index].onReference) continue;
      if (alleles.some((run) => index >= run.from && index <= run.to)) continue;
      let from = index;
      let to = index;
      while (from > 0 && !visits[from - 1].onReference) from -= 1;
      while (to + 1 < visits.length && !visits[to + 1].onReference) to += 1;
      alleles.push({ from, to });
    }
    const alleleLines = alleles.map(({ from, to }) => {
      const run = visits.slice(from, to + 1);
      const bp = run.reduce((sum, visit) => sum + visit.length, 0);
      const before = from > 0 ? model.nodeById.get(visits[from - 1].id) : null;
      const after =
        to + 1 < visits.length ? model.nodeById.get(visits[to + 1].id) : null;
      const ids =
        run.length <= 3
          ? run.map((visit) => visit.id).join(" → ")
          : `${run[0].id} → … → ${run[run.length - 1].id}`;
      /* What the reference has between the two places this allele hangs
         from, where both are in the window. */
      const instead =
        before && after && after.refStart >= before.refEnd
          ? ` in place of ${(after.refStart - before.refEnd).toLocaleString()} bp`
          : "";
      return `${before ? `from ${before.id}` : "enters the window"} · ${ids} (${plural(
        run.length,
        "node",
      )}, ${bp.toLocaleString()} bp${instead}) · ${
        after ? `back at ${after.id}` : "leaves the window"
      }`;
    });

    const here = inside.map((index) => visits[index]);
    const bp = here.reduce((sum, visit) => sum + visit.length, 0);
    const altBp = here
      .filter((visit) => !visit.onReference)
      .reduce((sum, visit) => sum + visit.length, 0);
    const from = Math.min(...here.map((visit) => visit.start));
    const to = Math.max(...here.map((visit) => visit.start + visit.length));
    const nodes = [...new Set(here.map((visit) => visit.id))]
      .map((id) => model.nodeById.get(id))
      .filter((node): node is GraphNode => !!node);
    const alts = nodes.filter((node) => !node.onReference);
    const refs = nodes.filter((node) => node.onReference);

    setCard({
      x: at.x,
      y: at.y,
      title: lane.label,
      lines: [
        regionLine(section),
        `${from.toLocaleString()}–${to.toLocaleString()} in its own coordinates`,
        `${bp.toLocaleString()} bp here, ${altBp.toLocaleString()} bp of it off the reference`,
        `${plural(alleles.length, "alt allele")} · ${plural(alts.length, "alt node")} · ${plural(
          refs.length,
          "reference node",
        )}`,
      ],
      groups: [
        { head: `Alt alleles (${alleles.length})`, lines: listed(alleleLines) },
        {
          head: `Alt nodes (${alts.length})`,
          lines: listed(
            alts.map((node) =>
              altNodeLine(node, here.find((visit) => visit.id === node.id)?.start),
            ),
          ),
        },
        { head: `Reference nodes (${refs.length})`, lines: listed(refs.map(refNodeLine)) },
      ],
    });
  };

  const dim = (lane: Lane) =>
    (highlight !== null && highlight !== lane.key) ||
    (litLanes !== null && !litLanes.has(lane.key));

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
      for (const lane of node.lanes) {
        /* The reference has no bar of its own; the strip is its bar. */
        const top = laneTop.get(lane);
        if (top === undefined) continue;
        litSpans.push({
          key: `${id}:${lane}`,
          x: left,
          width: wide,
          y: top,
          height: laneHeight.get(lane) ?? LANE_H,
        });
      }
    }
  }
  return (
    <div
      className="pgv-linear"
      style={{ width, height }}
      onMouseLeave={() => hoverTo(null)}
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
            height: laneHeight.get(lane.key) ?? LANE_H,
          }}
          /* Zoomed in, a click on a bar keeps what its hover said open as a
             card; zoomed out, the bar's sections open their own. */
          onClick={sections ? undefined : (event) => openDetailCard(event)}
        >
          <LaneCanvas
            raster={rasters.get(lane.key)!}
            width={width}
            height={laneHeight.get(lane.key) ?? LANE_H}
            rowH={LANE_H}
            color={lane.color}

            contig={lane.contig}
            isReference={lane.isReference}
            spellReference={alleleRows}
            dim={dim(lane)}
            /* The bar that was picked from, and no other: a route is one
               haplotype's, however many carry the node it was picked by. */
            route={pickedLane === lane.key ? (routeNodes ?? undefined) : undefined}
            /* Zoomed out, the bar is drawn and read a section at a time:
               what this haplotype does in the section clicked. */
            sections={sections ?? undefined}
            sectionAltBp={sectionAltBp}
            onPress={
              sections
                ? ({ x, clientX, clientY }) => {
                    const section = sectionAt(x);
                    if (section) {
                      openLaneCard(lane, section, { x: clientX, y: clientY });
                    }
                  }
                : undefined
            }
            /* The section the pointer is on, outlined across this bar where
               the haplotype has anything in it: what a click would open. */
            onPoint={(x) => {
              const outline = hoverBoxRef.current;
              if (!outline) return;
              const section = x === null ? null : sectionAt(x);
              const raster = rasters.get(lane.key);
              const top = laneTop.get(lane.key);
              let from = Infinity;
              let to = -Infinity;
              let lastCard = 0;
              if (section && raster) {
                for (const visit of raster.nodes) {
                  if (visit.right <= section.left || visit.left >= section.right) {
                    continue;
                  }
                  from = Math.min(from, Math.max(section.left, visit.left));
                  to = Math.max(to, Math.min(section.right, visit.right));
                  lastCard = Math.max(lastCard, visit.card);
                }
              }
              if (top === undefined || !(to > from)) {
                outline.style.display = "none";
                return;
              }
              outline.setAttribute("x", String(from));
              outline.setAttribute("y", String(top));
              outline.setAttribute("width", String(Math.max(1, to - from)));
              outline.setAttribute("height", String((lastCard + 1) * LANE_H));
              outline.style.display = "";
            }}
            onHover={(hover) => {
              hoverTo(
                hover
                  ? {
                      ...hover,
                      /* What this bar's own path does at the allele under the
                         pointer - the two the bullets count. */
                      lines: [
                        ...hover.lines,
                        ...laneNeighbourLines(lane, hover.nodeId),
                      ],
                    }
                  : hover,
              );
              /* Round the stretch under the pointer, in this bar only. */
              const outline = hoverBoxRef.current;
              const top = laneTop.get(lane.key);
              if (outline && hover && top !== undefined) {
                outline.setAttribute("x", String(hover.box.left));
                outline.setAttribute("y", String(top + hover.box.card * LANE_H));
                outline.setAttribute(
                  "width",
                  String(Math.max(1, hover.box.right - hover.box.left)),
                );
                outline.setAttribute("height", String(LANE_H));
                outline.style.display = "";
              } else if (outline) {
                outline.style.display = "none";
              }
              /* Only while a bullet is open, and only for what it names:
                 anything else leaves the state alone, so an ordinary hover
                 still costs no render. */
              if (!openBullet) return;
              const on =
                hover && openBullet.ids.includes(hover.nodeId)
                  ? { lane: lane.key, id: hover.nodeId }
                  : null;
              setLinked((was) =>
                was?.id === on?.id && was?.lane === on?.lane ? was : on,
              );
            }}
            onPick={(id) => {
              setPickedLane(lane.key);
              onSelectNode(selectedNode === id ? null : id);
            }}
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
          hoverTo(null);
          setLitRun(null);
        }}
        onClick={() => {
          setOpenBullet(null);
          setLinked(null);
          setCard(null);
          onSelectNode(null);
        }}
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
          const middle = top + visit.card * LANE_H + LANE_H / 2;
          const links = laneNeighbours(lane, visit.id);
          const sides = [
            ["before", visit.left, links.prev],
            ["after", visit.right, links.next],
          ] as Array<["before" | "after", number, string[]]>;
          return sides.map(([side, at, ids]) => {
            /* One way in and one way out is the ordinary case, and says
               nothing worth a mark. */
            if (ids.length < 2) return null;
            const key = `${lane.key}-${index}-${side}`;
            /* Opened rather than shown in passing: a reader asks for it, and
               it stays until they ask for something else. */
            const open = (event: React.MouseEvent) => {
              event.stopPropagation();
              setOpenBullet({ key, x: at, y: middle, ids });
              setLinked(null);
              hoverTo({
                x: event.clientX,
                y: event.clientY,
                title: `${lane.label}: ${ids.length} ways ${
                  side === "before" ? "into" : "out of"
                } node ${visit.id}`,
                lines: neighbourLines(ids),
              });
            };
            return (
              <g
                key={key}
                className={`pgv-bullet pgv-hears${
                  openBullet?.key === key ? " pgv-bullet-open" : ""
                }`}
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

      {/* From an open bullet to whichever of the nodes it names the pointer
          is on: the list says what they are, this says where. */}
      {openBullet &&
        linked &&
        (() => {
          const raster = rasters.get(linked.lane);
          const top = laneTop.get(linked.lane);
          if (!raster || top === undefined) return null;
          const visit = raster.nodes.find((n) => n.id === linked.id);
          if (!visit) return null;
          return (
            <line
              className="pgv-bullet-link"
              x1={openBullet.x}
              y1={openBullet.y}
              x2={(visit.left + visit.right) / 2}
              y2={top + visit.card * LANE_H + LANE_H / 2}
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
              const lit = highlight === null || node.lanes.includes(highlight);
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
           with the button off. */
        .filter((node) => alleleRows || node.onReference)
        .map((node) => {
          const y = stripTop + node.row * NODE_H;
          /* From the axis at both ends, so a node in a closed gap is drawn
             as narrow as the gap. */
          const left = px(node.x);
          const w = Math.max(1, px(node.x + node.length) - left);
          const perBase = node.length > 0 ? w / node.length : scale;
          const lit = highlight === null || node.lanes.includes(highlight);
          return (
            <g
              key={node.id}
              className={`pgv-node${node.onReference ? "" : " pgv-node-alt"}${
                lit ? "" : " pgv-dim"
              }${selectedNode === node.id ? " pgv-node-picked" : ""}${
                nodeIsLit(node.id) ? " pgv-node-lit" : ""
              }${routeNodes?.has(node.id) ? " pgv-node-route" : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                /* Picked from the graph, so it belongs to no one bar. */
                setPickedLane(null);
                onSelectNode(selectedNode === node.id ? null : node.id);
                /* Its detail kept open where it was clicked, as a card. */
                if (selectedNode === node.id) setCard(null);
                else openDetailCard(event);
              }}
              onMouseMove={(event) => {
                /* Lighting it is what makes it spell itself out when it is
                   too small to have. */
                if (litRun?.key !== node.id) {
                  setLitRun({
                    key: node.id,
                    lane: "",
                    nodes: new Set([node.id]),
                  });
                }
                hoverTo({
                  x: event.clientX,
                  y: event.clientY,
                  title: `node ${node.id}`,
                  lines: nodeDetailLines(node, model),
                });
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
        <FloatingCard
          x={card.x}
          y={card.y}
          className={`pgv-section-card${card.detail ? " pgv-detail-card" : ""}`}
        >
          <button
            type="button"
            className="pgv-section-close"
            aria-label="Close"
            onClick={() => setCard(null)}
          >
            ×
          </button>
          <div className="pgv-tooltip-title">{card.title}</div>
          {card.lines.map((line) => (
            <div key={line} className="pgv-section-line">
              {line}
            </div>
          ))}
          {card.groups.map((group) => (
            <div key={group.head}>
              <div className="pgv-section-head">{group.head}</div>
              {group.lines.map((line) => (
                <div key={line} className="pgv-section-node">
                  {line}
                </div>
              ))}
              {group.lines.length === 0 && (
                <div className="pgv-section-line">none</div>
              )}
            </div>
          ))}
        </FloatingCard>
      )}
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
