import { memo, useLayoutEffect, useMemo, useRef } from "react";
import type { MouseEvent } from "react";
import type { DrawFrame, GraphNode, PangenomeModel } from "./pangenomeModel";
import { deletionSize } from "./pangenomeModel";
import { LANE_H } from "./laneLayout";
import type { HoverTarget } from "./hoverTarget";
import {
  laneDetailLines,
  laneNeighbourLines,
  nodeDetailLines,
  sequenceSize,
} from "./nodeDetail";
import { nodeLetters } from "./letters";
import { fitCanvas, useScreenSize } from "./canvasScreen";
import type { FittedCanvas } from "./canvasScreen";
import {
  TUBE_LABEL_H,
  boxAt,
  buildTubeGeometry,
  tubeAt,
} from "./tubeLayout";
import type {
  TubeAxis,
  TubeBox,
  TubeGeometry,
  TubePiece,
  TubeStacks,
} from "./tubeLayout";

/* ══════════════════════════════════════════════════════════════════════════
   Tube map view - the shape of figure 2d in Eizenga et al. 2020.

   Every haplotype is a thick tube threaded through the nodes it visits. The
   alleles of a site are stacked directly under one another, so every node
   sits at about the same level, and a tube climbs or drops into whichever
   allele its haplotype carries. Where haplotypes part company their tubes
   cross, drawn taking turns over one another rather than one bundle lying
   wholly on top.

   The tubes bend in gaps between the nodes, each as wide as the number of
   haplotypes parting there needs. The gaps are paid for out of the window,
   so the region asked for still exactly fills the window on screen and the
   ruler and the pan still mean what they do in the linear view.
   tubeLayout.ts works out the stacks, the gaps and the axis; the container
   hands them in, since the pan needs the same axis the drawing uses.

   Painted on one canvas, as the bars are - the tubes are thousands of
   pieces - with the ruler drawn over it. What is under the pointer is worked
   out from the geometry rather than hit-tested.
   ══════════════════════════════════════════════════════════════════════════ */

/** How thick a tube is: two thirds of a linear view bar. */
export const TUBE_H = (LANE_H * 2) / 3;

/* Taken from the stylesheet's palette rather than read back out of it: a
   canvas has no cascade to ask. */
const BOX_FILL = "#eef2f8";
const ALT_FILL = "#f7f0e4";
/* The part of a grouped box its bases fill: the same hues, deeper. */
const BOX_INNER = "#d5deec";
const ALT_INNER = "#ecdcc0";
const BOX_EDGE = "#8d9ab3";
const ALT_EDGE = "#b89668";
const PICKED_EDGE = "#2e6fc4";
const LETTER_INK = "#26314a";
/** Along the edges of a bending tube, so where tubes cross it is clear which
    lies on top. The ground the drawing sits on. */

const DIM_ALPHA = 0.18;
/** A line carried through a box it does not read there: the same line,
    dashed. */
const CARRIED_DASH = [4, 3];
/** The thin solid line for a link between two alternative alleles. */
/** How thick a haplotype is drawn, wherever it goes. */
const PATH_WIDTH = 2;
/** How far inside its box a start or an end is marked, from the box's edge
    to the mark's own: on the edge, a mark ran into the box's outline and the
    seam leaving it. */
const MARK_INSET = 2;
const BOX_RADIUS = 4;
/** Below this a letter is a smudge, so no sequence is drawn. */
const SEQUENCE_MIN_SIZE = 4;
const MONO_STACK =
  'ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace';
const LETTER_SAMPLE = "ACGTN";
/** How much of a node's sequence the tooltip will show before cutting it. */
const LETTER_CAP = 150;
/* A deletion's size, on the stretch of tube passing over what it skips:
   small and grey, on a chip of the ground so the line breaks for it, as
   the bars write it in their white; see LaneCanvas. Small enough for its
   chip to stay inside the tube's own slot. */
const DELETION_FONT = 9;
const DELETION_INK = "#6b7280";
const DELETION_PAD = 4;
const SANS_STACK = 'system-ui, -apple-system, "Segoe UI", sans-serif';


interface TubeMapViewProps {
  model: PangenomeModel;
  /** The stacked columns and the tubes through them. */
  stacks: TubeStacks;
  /** Where the layout is drawn across, gaps included. */
  axis: TubeAxis;
  /** The model the ruler reads coordinates from, when it is not the one
      drawn; see `tubeAxis`. */
  rulerModel?: PangenomeModel;
  /** Text for a box's top strip in place of its letters - the grouped map's
      lengths, since its boxes are as wide as where they are. */
  boxLabels?: ReadonlyMap<string, string>;
  /** How much of each box its bases fill, drawn inside it from the middle. */
  boxFills?: ReadonlyMap<string, number>;
  /** A box clicked, with where on the screen. Given, a click inside a box
      is the box's even over a tube - the grouped map opens its site's card -
      and a tube is picked from the gaps between columns. */
  onBoxPick?: (id: string, x: number, y: number) => void;
  /** What the hover says about a box, when its node is not one of the
      fetched model's; see the grouped map. */
  boxLines?: (id: string) => { title: string; lines: string[] } | null;
  /** The band to fill. Without one the drawing falls back to its own size. */
  frame?: DrawFrame;
  highlight: string | null;
  onHighlight: (key: string | null) => void;
  onHover: (target: HoverTarget | null) => void;
  onSelectNode: (id: string | null) => void;
  selectedNode: string | null;
}

function TubeMapView({
  model,
  stacks,
  axis,
  boxLabels,
  boxFills,
  onBoxPick,
  boxLines,
  frame,
  highlight,
  onHighlight,
  onHover,
  onSelectNode,
  selectedNode,
}: TubeMapViewProps) {
  const width = frame ? frame.width : axis.width;
  const height = stacks.height;
  const geometry = useMemo(
    () => buildTubeGeometry(model, axis, stacks),
    [model, axis, stacks],
  );
  /* No ruler of its own: eg3's ruler track draws the coordinates, on the
     band the tubes are laid out on. */

  /* The dots and Xs where they are drawn, for the pointer to find. */
  const marks = useMemo(
    () => [
      ...routeStarts(geometry).map((m) => ({
        ...m,
        end: false,
        cx: m.x + MARK_INSET + markHalf(m.pass),
      })),
      ...routeEnds(geometry).map((m) => ({
        ...m,
        end: true,
        cx: m.x - MARK_INSET - markHalf(m.pass),
      })),
    ],
    [geometry],
  );
  const markAt = (x: number, y: number) => {
    let best: (typeof marks)[number] | null = null;
    let nearest = MARK_HIT;
    for (const mark of marks) {
      const d = Math.hypot(x - mark.cx, y - mark.y);
      if (d <= nearest) {
        nearest = d;
        best = mark;
      }
    }
    return best;
  };

  const ref = useRef<HTMLCanvasElement>(null);
  const nudge = useRef(0);
  const screen = useScreenSize(ref);

  /* What was last painted, so the observer's exact size - nearly always the
     size already guessed - does not paint the whole map a second time; see
     LaneCanvas. */
  const painted = useRef<{ inputs: unknown[]; pw: number; ph: number } | null>(
    null,
  );

  /* Before the browser paints, as LaneCanvas does: otherwise a new
     region's boxes go on screen over a frame of the last region's tubes. */
  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas || width <= 0 || height <= 0) return;
    const fitted = fitCanvas(canvas, width, height, screen, nudge);
    if (!fitted) return;
    const inputs = [model, geometry, width, highlight, selectedNode, boxLabels, boxFills];
    const last = painted.current;
    if (
      last &&
      last.pw === fitted.pw &&
      last.ph === fitted.ph &&
      inputs.every((input, i) => input === last.inputs[i])
    ) {
      return;
    }
    paint(fitted, {
      model,
      geometry,
      width,
      highlight,
      selectedNode,
      boxLabels,
      boxFills,
    });
    painted.current = { inputs, pw: fitted.pw, ph: fitted.ph };
  }, [model, geometry, width, height, highlight, selectedNode, boxLabels, boxFills, screen]);

  /* What is under the pointer. A tube wins over a box, since the tubes are
     drawn over the boxes. */
  const pointAt = (event: MouseEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    return {
      x,
      tube: tubeAt(geometry, x, y),
      box: boxAt(geometry, x, y),
    };
  };

  return (
    <div
      className="pgv-tube"
      style={{ width, height }}
      onMouseLeave={() => {
        onHover(null);
      }}
    >
      <canvas
        ref={ref}
        className="pgv-tube-canvas"
        style={{ width, height }}
        onMouseMove={(event) => {
          /* Nothing is asked while the button is down: the pan that
             follows stops the events reaching here, and the moment before
             it does is not a question either. */
          if (event.buttons !== 0) {
            onHover(null);
            return;
          }
          const { x, tube, box } = pointAt(event);
          /* A start or an end number first: where its pass starts and ends. */
          const hit = event.currentTarget.getBoundingClientRect();
          const mark = markAt(x, event.clientY - hit.top);
          if (mark) {
            onHover({
              x: event.clientX,
              y: event.clientY,
              title: model.lanes[mark.lane].label,
              lines: markLines(model, geometry, mark.lane, mark.pass, mark.end),
            });
          } else if (tube) {
            const target = tubeHover(
              model,
              geometry,
              tube.lane,
              tube.entry,
              x,
              event,
            );
            onHover(target);
          } else if (box) {
            /* What the box is: a node, or in the grouped map one of its
               walks, which a node's own lines would only call by its id. */
            const said = boxLines?.(box.node.id) ?? {
              title: `node ${box.node.id}`,
              lines: nodeDetailLines(box.node, model),
            };
            onHover({
              x: event.clientX,
              y: event.clientY,
              title: said.title,
              lines: said.lines,
            });
          } else {
            onHover(null);
          }
        }}
        onClick={(event) => {
          const { tube, box } = pointAt(event);
          if (box && onBoxPick) {
            onBoxPick(box.node.id, event.clientX, event.clientY);
          } else if (tube) {
            const key = model.lanes[tube.lane].key;
            onHighlight(highlight === key ? null : key);
          } else if (box) {
            onSelectNode(
              box.node.id === selectedNode ? null : box.node.id,
            );
          } else {
            onSelectNode(null);
          }
        }}
      />
    </div>
  );
}


/** The tooltip for a tube: where along its haplotype the pointer is. */
function tubeHover(
  model: PangenomeModel,
  geometry: TubeGeometry,
  laneIndex: number,
  entryIndex: number,
  x: number,
  event: MouseEvent<HTMLCanvasElement>,
): HoverTarget {
  const lane = model.lanes[laneIndex];
  const entry = geometry.stacks.tracks[laneIndex][entryIndex];
  /* Which of its passes over the window this is, where it has several:
     the number on its start and its end. */
  const { passOf, passCount } = linePasses(geometry);
  const pass = passOf[laneIndex]?.[entryIndex] ?? 1;
  const count = passCount[laneIndex] ?? 1;
  const repeatLines =
    count > 1
      ? [`pass ${pass} of ${count}: from the white ${pass} to the dark ${pass}`]
      : [];
  /* The node this haplotype walks here, or the box's own where it is only
     passing over. */
  const node = entry.node ?? entry.item.node;

  if (!node || entry.start === null) {
    /* Passing over what a deletion skips: how much, and where. */
    const deletion = geometry.stacks.deletions.find(
      (mark) =>
        mark.lane === laneIndex &&
        entryIndex >= mark.from &&
        entryIndex <= mark.to,
    );
    if (deletion) {
      const contig = model.reference?.contig ?? "";
      return {
        x: event.clientX,
        y: event.clientY,
        title: lane.label,
        lines: [
          `a deletion of ${deletionSize(deletion.bp)}: its walk skips ${contig}:${deletion.refFrom.toLocaleString()}–${deletion.refTo.toLocaleString()}`,
          ...(deletion.open ? ["which runs past this band"] : []),
          ...repeatLines,
          ...laneDetailLines(lane),
        ],
      };
    }
    /* Carried across this column by a step of the walk that jumps it: from
       the node it last read to the next. */
    const track = geometry.stacks.tracks[laneIndex];
    let before: GraphNode | null = null;
    for (let i = entryIndex - 1; i >= 0 && !before; i--) before = track[i].node;
    let after: GraphNode | null = null;
    for (let i = entryIndex + 1; i < track.length && !after; i++) after = track[i].node;
    const jump =
      before && after
        ? `its walk steps from node ${before.id} straight to node ${after.id}, over this site`
        : "passes over this site without entering its nodes";
    /* Drawn inside a box all the same where the haplotype reads that node
       at another point of its walk - a second copy of the stretch - since
       its line keeps to its own row in the box it has one in. */
    const elsewhere = entry.item.node
      ? [
          `it reads node ${entry.item.node.id} at another point of its walk, so its line runs through that node's box here`,
        ]
      : [];
    return {
      x: event.clientX,
      y: event.clientY,
      title: lane.label,
      lines: [jump, ...elsewhere, ...repeatLines, ...laneDetailLines(lane)],
    };
  }

  const { left, right } = geometry.spans[laneIndex][entryIndex];
  const perBase = node.length > 0 ? (right - left) / node.length : 0;
  /* Clamped, since a bend or the empty end of a short allele lies outside
     the node's own bases. */
  const offset =
    perBase > 0
      ? Math.min(node.length - 1, Math.max(0, Math.floor((x - left) / perBase)))
      : 0;
  const bp = entry.start + offset;

  return {
    x: event.clientX,
    y: event.clientY,
    title: lane.label,
    lines: [
      `${bp.toLocaleString()} on ${lane.contig}`,
      `node ${node.id}, ${node.length} bp`,
      node.onReference ? "on the reference walk" : "off the reference walk",
      ...repeatLines,
      /* This path's own way in and way out, which is what a reader
         following a tube is asking about. */
      ...laneNeighbourLines(lane, node.id),
    ],
    zoom:
      node.length > 0
        ? nodeLetters(
            {
              sequence: node.sequence,
              length: node.length,
              left,
              right,
              start: entry.start,
              offset,
              pixel: Math.round(x),
            },
            LETTER_CAP,
          )
        : null,
  };
}

interface PaintInput {
  model: PangenomeModel;
  geometry: TubeGeometry;
  width: number;
  highlight: string | null;
  selectedNode: string | null;
  boxLabels?: ReadonlyMap<string, string>;
  boxFills?: ReadonlyMap<string, number>;
}

/** How big a box's label is drawn, in CSS pixels. */
const BOX_LABEL_PX = 10;

/**
 * The whole drawing, back to front: the boxes, the straight runs, the seams,
 * the crossings in their woven order, the boxes' outlines over the tubes,
 * and the sequence along the top of each box.
 */
function paint(
  { ctx, pw, ph, sx, sy }: FittedCanvas,
  {
    model,
    geometry,
    width,
    highlight,
    selectedNode,
    boxLabels,
    boxFills,
  }: PaintInput,
) {
  /* A highlighted haplotype dims the rest. */
  const { passOf } = linePasses(geometry);
  const dimPass = (lane: number, _pass: number) =>
    highlight !== null && model.lanes[lane].key !== highlight;
  const dimPiece = (piece: TubePiece) =>
    dimPass(piece.lane, passOf[piece.lane]?.[piece.from] ?? 1);
  const dimBox = (box: TubeBox) =>
    highlight !== null && !box.node.lanes.includes(highlight);
  const inView = (x0: number, x1: number) => x1 >= 0 && x0 <= width;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, pw, ph);
  ctx.setTransform(sx, 0, 0, sy, 0, 0);

  for (const box of geometry.boxes) {
    if (!inView(box.left, box.right)) continue;
    ctx.globalAlpha = dimBox(box) ? DIM_ALPHA : 1;
    ctx.fillStyle = box.node.onReference ? BOX_FILL : ALT_FILL;
    boxPath(ctx, box, 0);
    ctx.fill();
    /* Its bases' share of its range, from the middle out: the box is as
       wide as where it is, and this is how long it is. */
    const fill = boxFills?.get(box.node.id);
    if (fill !== undefined && fill > 0) {
      const wide = (box.right - box.left) * fill;
      const middle = (box.left + box.right) / 2;
      ctx.fillStyle = box.node.onReference ? BOX_INNER : ALT_INNER;
      ctx.fillRect(
        middle - wide / 2,
        box.top + 2,
        Math.max(1, wide),
        box.bottom - box.top - 4,
      );
    }
  }


  /* Outlines too, before any tube: the boxes are behind the lines, which
     are what a reader follows. */
  for (const box of geometry.boxes) {
    if (box.right - box.left < 2 || !inView(box.left, box.right)) continue;
    const picked = box.node.id === selectedNode;
    ctx.globalAlpha = dimBox(box) && !picked ? DIM_ALPHA : 1;
    ctx.strokeStyle = picked
      ? PICKED_EDGE
      : box.node.onReference
        ? BOX_EDGE
        : ALT_EDGE;
    ctx.lineWidth = picked ? 2.5 : 1;
    boxPath(ctx, box, 0.5);
    ctx.stroke();
  }

  /* Every haplotype is a line of its own colour, the same weight wherever it
     goes: through an allele, across a column it only passes over, or on from
     one alternative to another. The ribbons this view used to draw filled a
     box so completely that the bases behind them could not be read, and a
     column of ten of them was a block of colour rather than ten paths.

     Half a pixel over at each end, tucked under whatever meets it, so no
     ground shows through a join. */
  /* Where each line starts and stops - its marks below - so it is drawn
     from its start number to its end number, | 1---1 |, rather than on
     through them to the box's edges. */
  const starts = routeStarts(geometry);
  const ends = routeEnds(geometry);
  const at = (lane: number, x: number, y: number) =>
    `${lane}:${x.toFixed(2)}:${y.toFixed(2)}`;
  const startAt = new Map(starts.map((p) => [at(p.lane, p.x, p.y), p.pass]));
  const endAt = new Map(ends.map((p) => [at(p.lane, p.x, p.y), p.pass]));
  /* A piece's two ends: pulled in to its marks where it has them, and half a
     pixel out otherwise, so it tucks under whatever meets it. */
  const trimmed = (piece: TubePiece) => {
    const from = startAt.get(at(piece.lane, piece.x0, piece.y0));
    const to = endAt.get(at(piece.lane, piece.x1, piece.y1));
    return {
      x0:
        from === undefined
          ? piece.x0 - 0.5
          : piece.x0 + MARK_INSET + 2 * markHalf(from),
      x1:
        to === undefined
          ? piece.x1 + 0.5
          : piece.x1 - MARK_INSET - 2 * markHalf(to),
    };
  };

  /* Where a line is carried through a box its haplotype does not read
     there - it reads that node at another point of its walk, and keeps its
     row in the box on the way past - it is the same line, dashed: the walk
     goes on through, but not into this node. */
  const carried = (lane: number, entry: number) => {
    const at = geometry.stacks.tracks[lane][entry];
    return !!at && at.start === null && at.item.node !== null;
  };
  const dashFor = (piece: TubePiece) =>
    carried(piece.lane, piece.from) && carried(piece.lane, piece.to)
      ? CARRIED_DASH
      : [];

  ctx.lineWidth = PATH_WIDTH;
  for (const run of geometry.runs) {
    if (!inView(run.x0, run.x1)) continue;
    const { x0, x1 } = trimmed(run);
    if (x1 <= x0) continue;
    ctx.globalAlpha = dimPiece(run) ? DIM_ALPHA : 1;
    ctx.strokeStyle = model.lanes[run.lane].color;
    ctx.setLineDash(dashFor(run));
    ctx.beginPath();
    ctx.moveTo(x0, run.y0);
    ctx.lineTo(x1, run.y1);
    ctx.stroke();
  }

  for (const crossing of geometry.crossings) {
    if (!inView(crossing.x0, crossing.x1)) continue;
    for (const piece of crossing.pieces) {
      /* ...and where it bends, in its turn among the lines around it: the
         weave still decides which crosses over which. */
      ctx.globalAlpha = dimPiece(piece) ? DIM_ALPHA : 1;
      ctx.strokeStyle = model.lanes[piece.lane].color;
      ctx.lineWidth = PATH_WIDTH;
      const { x0, x1 } = trimmed(piece);
      if (x1 <= x0) continue;
      ctx.setLineDash(dashFor(piece));
      centreLine(ctx, { ...piece, x0: Math.max(piece.x0, x0), x1: Math.min(piece.x1, x1) });
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);

  /* Each line's pass number on the end it starts from - where the
     haplotype first appears, and where it picks up again after a seam - and
     again on the end it stops at. A line that begins in the middle of the
     window has come from somewhere the window does not show, and without a
     mark there is nothing to say which end of it is the beginning. Inside
     the box, |1---1|, clear of its edges: a start on white, an end on dark. */
  for (const start of starts) {
    const half = markHalf(start.pass);
    const x = start.x + MARK_INSET + half;
    if (!inView(x - half, x + half)) continue;
    ctx.globalAlpha = dimPass(start.lane, start.pass) ? DIM_ALPHA : 1;
    passNumber(ctx, start.pass, x, start.y, model.lanes[start.lane].color);
  }
  for (const end of ends) {
    const half = markHalf(end.pass);
    const x = end.x - MARK_INSET - half;
    if (!inView(x - half, x + half)) continue;
    ctx.globalAlpha = dimPass(end.lane, end.pass) ? DIM_ALPHA : 1;
    passNumber(ctx, end.pass, x, end.y, model.lanes[end.lane].color, true);
  }

  /* Each deletion's size on its stretch of tube, where it fits there: at
     the end where the haplotype leaves the reference, or rejoins it, for
     one whose other end is outside the band; in the middle for one inside
     it. */
  ctx.font = `${DELETION_FONT}px ${SANS_STACK}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (const label of geometry.deletionLabels) {
    const { deletion } = label;
    const x0 = Math.max(0, label.x0);
    const x1 = Math.min(width, label.x1);
    const w = ctx.measureText(deletion.text).width;
    if (w + DELETION_PAD * 2 > x1 - x0) continue;
    const x =
      deletion.align === "start"
        ? x0 + DELETION_PAD
        : deletion.align === "end"
          ? x1 - DELETION_PAD - w
          : (x0 + x1 - w) / 2;
    ctx.globalAlpha = dimPass(
      deletion.lane,
      passOf[deletion.lane]?.[deletion.from] ?? 1,
    )
      ? DIM_ALPHA
      : 1;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x - 2, label.y - DELETION_FONT / 2 - 1, w + 4, DELETION_FONT + 2);
    ctx.fillStyle = DELETION_INK;
    ctx.fillText(deletion.text, x, label.y + 0.5);
  }

  /* The sequence, in screen pixels so each letter starts on a whole one, and
     no taller than the strip it sits in. Sized box by box: every node has
     the same room per base. */
  {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = LETTER_INK;
    let font = "";
    let advance = 0;

    for (const box of geometry.boxes) {
      const { node } = box;
      if (!inView(box.left, box.right)) continue;
      /* A label in place of the letters, centred, where it fits. */
      const label = boxLabels?.get(node.id);
      if (label !== undefined) {
        /* Its own size; the letters' font is set again after it. */
        ctx.font = `${Math.round(BOX_LABEL_PX * sy)}px ${MONO_STACK}`;
        font = "";
        const text = ctx.measureText(label).width;
        if (text + 4 * sx > (box.right - box.left) * sx) continue;
        ctx.globalAlpha = dimBox(box) ? DIM_ALPHA : 1;
        ctx.fillText(
          label,
          Math.round(((box.left + box.right) / 2) * sx - text / 2),
          Math.round((box.top + TUBE_LABEL_H / 2 + 1) * sy),
        );
        continue;
      }
      if (node.length <= 0) continue;
      const perBase = (box.right - box.left) / node.length;
      const size = Math.min(sequenceSize(perBase), TUBE_LABEL_H - 4);
      if (size < SEQUENCE_MIN_SIZE) continue;
      const wanted = `${Math.floor(size * sy)}px ${MONO_STACK}`;
      if (wanted !== font) {
        font = wanted;
        ctx.font = font;
        advance = ctx.measureText(LETTER_SAMPLE).width / LETTER_SAMPLE.length;
      }
      ctx.globalAlpha = dimBox(box) ? DIM_ALPHA : 1;
      const baseline = Math.round((box.top + TUBE_LABEL_H / 2 + 1) * sy);
      const first = Math.max(0, Math.floor(-box.left / perBase));
      const last = Math.min(
        node.length,
        Math.ceil((width - box.left) / perBase),
      );
      for (let i = first; i < last; i++) {
        ctx.fillText(
          node.sequence.charAt(i),
          Math.round((box.left + (i + 0.5) * perBase) * sx - advance / 2),
          baseline,
        );
      }
    }
  }
  ctx.globalAlpha = 1;
}

/** How near a start or an end number the pointer has to be to be on it. */
const MARK_HIT = 6;

/** Where one pass of a haplotype starts and ends: its first and last
    entries that read a node, and their coordinates. */
function passEnds(geometry: TubeGeometry, lane: number, pass: number) {
  const { passOf } = linePasses(geometry);
  const track = geometry.stacks.tracks[lane] ?? [];
  let first: (typeof track)[number] | null = null;
  let last: (typeof track)[number] | null = null;
  track.forEach((entry, k) => {
    if (passOf[lane]?.[k] !== pass || !entry.node || entry.start === null) return;
    first ??= entry;
    last = entry;
  });
  return { first, last } as {
    first: (typeof track)[number] | null;
    last: (typeof track)[number] | null;
  };
}

/** What a start or an end number says: its pass, where that starts and ends, and the
    pass before or after it. */
function markLines(
  model: PangenomeModel,
  geometry: TubeGeometry,
  lane: number,
  pass: number,
  end: boolean,
): string[] {
  const { passCount } = linePasses(geometry);
  const count = passCount[lane] ?? 1;
  const contig = model.lanes[lane]?.contig ?? "";
  const at = (
    entry: { node: GraphNode | null; start: number | null; end: number | null } | null,
    last: boolean,
  ) =>
    entry?.node && entry.start !== null
      ? `node ${entry.node.id}, ${(last
          ? (entry.end ?? entry.start)
          : entry.start
        ).toLocaleString()} on ${contig}`
      : "outside the window";
  const here = passEnds(geometry, lane, pass);
  const lines = [
    `${end ? "end" : "start"} of pass ${pass} of ${count}`,
    `starts at ${at(here.first, false)}`,
    `ends at ${at(here.last, true)}`,
  ];
  if (!end && pass > 1) {
    const before = passEnds(geometry, lane, pass - 1);
    lines.push(`before it, pass ${pass - 1} ended at ${at(before.last, true)}`);
  }
  if (end && pass < count) {
    const after = passEnds(geometry, lane, pass + 1);
    lines.push(`after it, pass ${pass + 1} starts at ${at(after.first, false)}`);
  }
  return lines;
}

/** How big a pass number is drawn, in CSS pixels, and how wide each of its
    monospace digits is. */
const PASS_LABEL_PX = 8;
const PASS_DIGIT_PX = PASS_LABEL_PX * 0.6;

/** Half the width of a pass number's chip: its digits and a little room. */
function markHalf(pass: number) {
  return (String(pass).length * PASS_DIGIT_PX + 4) / 2;
}

/**
 * A pass's number, as the mark on the end of its line: centred on the line
 * in a chip edged in the haplotype's colour. A start's is in that colour on
 * white; an end's is white on dark, so the two ends of a pass read apart at
 * a glance.
 */
function passNumber(
  ctx: CanvasRenderingContext2D,
  pass: number,
  x: number,
  y: number,
  color: string,
  end = false,
) {
  const text = String(pass);
  const half = markHalf(pass);
  const h = PASS_LABEL_PX + 3;
  ctx.save();
  ctx.font = `700 ${PASS_LABEL_PX}px ${MONO_STACK}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x - half, y - h / 2, 2 * half, h, 2);
  } else {
    ctx.rect(x - half, y - h / 2, 2 * half, h);
  }
  ctx.fillStyle = end ? END_LABEL_GROUND : "#ffffff";
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.fillStyle = end ? "#ffffff" : color;
  ctx.fillText(text, x, y + 0.5);
  ctx.restore();
}
/** The ground an end's number sits on. */
const END_LABEL_GROUND = "#1b1d21";

/** A box's outline, rounded, pulled in by `inset` so a stroke sits inside. */
function boxPath(ctx: CanvasRenderingContext2D, box: TubeBox, inset: number) {
  const x = box.left + inset;
  const y = box.top + inset;
  const w = Math.max(1, box.right - box.left - inset * 2);
  const h = Math.max(1, box.bottom - box.top - inset * 2);
  const r = Math.max(0, Math.min(BOX_RADIUS, w / 4, h / 4));
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

/**
 * Which pass over the window each track entry is in, from 1, and how many
 * passes each haplotype has. A pass runs from its start number to its end number: a
 * seam ends one and starts the next. Its number is both marks, so a
 * haplotype that breaks off and picks up again has its pairs told apart.
 */
function linePasses(geometry: TubeGeometry): {
  passOf: number[][];
  passCount: number[];
} {
  const known = passesByGeometry.get(geometry);
  if (known) return known;
  const passOf: number[][] = [];
  const passCount: number[] = [];
  geometry.stacks.tracks.forEach((track, lane) => {
    let pass = 1;
    passOf[lane] = track.map((entry, k) => {
      const here = pass;
      if (!entry.joined && k + 1 < track.length) pass += 1;
      return here;
    });
    passCount[lane] = track.length ? pass : 0;
  });
  const found = { passOf, passCount };
  passesByGeometry.set(geometry, found);
  return found;
}
const passesByGeometry = new WeakMap<
  TubeGeometry,
  { passOf: number[][]; passCount: number[] }
>();

/**
 * Every point a haplotype's line starts from.
 *
 * One for the whole route - the leftmost thing drawn for that haplotype -
 * and one at the far end of every seam, which is where it comes back after
 * leaving the window. The near end of a seam is where a line stops, and a
 * line that stops needs no mark: it is the one that starts out of nowhere
 * that a reader has to place.
 */
function routeStarts(geometry: TubeGeometry) {
  const { passOf } = linePasses(geometry);
  const starts: Array<{ lane: number; x: number; y: number; pass: number }> =
    [];
  geometry.byLane.forEach((pieces, lane) => {
    /* Sorted left to right where they were built, so the first is the one
       the reader meets first. */
    const first = pieces[0];
    if (first) {
      starts.push({
        lane,
        x: first.x0,
        y: first.y0,
        pass: passOf[lane]?.[first.from] ?? 1,
      });
    }
  });
  for (const seam of geometry.seams) {
    starts.push({
      lane: seam.lane,
      x: seam.x1,
      y: seam.y1,
      pass: passOf[seam.lane]?.[seam.entry + 1] ?? 1,
    });
  }
  return starts;
}

/**
 * Where each haplotype's line stops: the end of its last piece, and the
 * start of every seam, which is where it stops before picking up again.
 */
function routeEnds(geometry: TubeGeometry) {
  const { passOf } = linePasses(geometry);
  const ends: Array<{ lane: number; x: number; y: number; pass: number }> = [];
  geometry.byLane.forEach((pieces, lane) => {
    const last = pieces[pieces.length - 1];
    if (last) {
      ends.push({
        lane,
        x: last.x1,
        y: last.y1,
        pass: passOf[lane]?.[last.to] ?? 1,
      });
    }
  });
  for (const seam of geometry.seams) {
    ends.push({
      lane: seam.lane,
      x: seam.x0,
      y: seam.y0,
      pass: passOf[seam.lane]?.[seam.entry] ?? 1,
    });
  }
  return ends;
}

/** The line a piece is drawn as, straight or bending. */
function centreLine(ctx: CanvasRenderingContext2D, piece: TubePiece) {
  const mid = (piece.x0 + piece.x1) / 2;
  ctx.beginPath();
  ctx.moveTo(piece.x0, piece.y0);
  ctx.bezierCurveTo(mid, piece.y0, mid, piece.y1, piece.x1, piece.y1);
}


/**
 * Wrapped, because the drawing is the expensive part of this view and it
 * only changes when its props do.
 */
export default memo(TubeMapView);
