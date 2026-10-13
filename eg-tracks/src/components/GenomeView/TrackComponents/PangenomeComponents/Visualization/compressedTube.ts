import type {
  Column,
  GraphEdge,
  GraphNode,
  Lane,
  LaneSegment,
  LaneStep,
  PangenomeModel,
} from "./pangenomeModel";
import type { VariantSegment } from "./variantBubbles";
import { bpLabel } from "./variantBubbles";

/* ══════════════════════════════════════════════════════════════════════════
   The tube map, compressed the way the variants view is.

   A busy window is thousands of one-base bubbles, and a tube map of it is
   every haplotype bending through every one. Drawn from sites instead - see
   variantBubbles.ts - each shared stretch is one box and each unique walk
   through a site is one box, and every haplotype is still a tube of its own,
   running from box to box in its own order so it can be followed the whole
   way across.

   This builds that as a model of its own: a node per shared stretch and per
   walk, a column per segment, and each haplotype's steps rewritten onto
   them. The tube map's own layout and drawing then take it as they take any
   other model, so the style is the tube map's and nothing of it is copied.
   ══════════════════════════════════════════════════════════════════════════ */

const sameId = (segment: number) => `stretch:${segment}`;
const walkId = (segment: number, walk: number) => `walk:${segment}:${walk}`;

/**
 * The compressed model for `segments`, which must be `variantSegments` of
 * `model`. Columns keep the layout's own coordinates, so the ruler and the
 * pan read them as they read the model.
 */
export function compressedModel(
  model: PangenomeModel,
  segments: VariantSegment[],
): PangenomeModel {
  const segmentOfColumn = new Int32Array(model.columns.length).fill(-1);
  segments.forEach((segment, at) => {
    for (let c = segment.fromColumn; c <= segment.toColumn; c++) {
      segmentOfColumn[c] = at;
    }
  });
  /* Which walk each haplotype takes at each site. */
  const walkOf = segments.map((segment) => {
    const byLane = new Map<string, number>();
    for (const walk of segment.walks) {
      for (const lane of walk.lanes) byLane.set(lane, walk.index);
    }
    return byLane;
  });

  /* The reference's own bases in a shared stretch: its length is what the
     ruler counts along it. */
  const referenceBp = (segment: VariantSegment) => {
    let sequence = "";
    for (let c = segment.fromColumn; c <= segment.toColumn; c++) {
      for (const id of model.columns[c].nodeIds) {
        const node = model.nodeById.get(id);
        if (node?.onReference) sequence += node.sequence;
      }
    }
    return sequence;
  };

  /* The nodes, a column per segment. */
  const nodeById = new Map<string, GraphNode>();
  const columns: Column[] = segments.map((segment, at) => {
    const ids: string[] = [];
    /* Placed where its nodes are, first to last, so a walk over the end of
       a site is drawn at the end of it: its length is that stretch of the
       layout, not its bases. A walk taking none of them - a deletion - has
       the site's, so its tubes still have a box to run through. */
    const add = (
      id: string,
      sequence: string,
      onReference: boolean,
      x0: number,
      x1: number,
    ) => {
      nodeById.set(id, {
        id,
        sequence,
        length: Math.max(0, x1 - x0),
        column: at,
        x: x0,
        row: ids.length,
        lanes: [],
        onReference,
        refStart: segment.refStart,
        refEnd: segment.refEnd,
      });
      ids.push(id);
    };
    if (segment.kind === "same") {
      add(sameId(at), referenceBp(segment), true, segment.x0, segment.x1);
    } else {
      for (const walk of segment.walks) {
        add(walkId(at, walk.index), walk.sequence, walk.isReference, walk.x0, walk.x1);
      }
    }
    return {
      index: at,
      x: segment.x0,
      width: segment.x1 - segment.x0,
      nodeIds: ids,
    };
  });

  /* Each haplotype's steps onto those nodes: one per segment it enters,
     and the empty walk of a site it jumps clean over. */
  const edges = new Map<string, GraphEdge>();
  const lanes: Lane[] = model.lanes.map((lane) => {
    const steps: LaneStep[] = [];
    const push = (id: string, start: number, piece: number, end: number) => {
      const node = nodeById.get(id);
      if (!node) return;
      const last = steps[steps.length - 1];
      /* The same box twice running is one visit, whatever piece of the walk
         each came from: the band's windows overlap, and a walk ending in a
         box and the next starting in it are the same stretch. It ends where
         the last of the haplotype's own bases in it does. */
      if (last && last.node === id) {
        last.end = Math.max(last.end, end);
        return;
      }
      if (last && last.segment === piece) {
        const key = `${last.node}>${id}`;
        let edge = edges.get(key);
        if (!edge) {
          edge = { key, from: last.node, to: id, lanes: [] };
          edges.set(key, edge);
        }
        if (edge.lanes[edge.lanes.length - 1] !== lane.key) {
          edge.lanes.push(lane.key);
        }
      }
      /* In the haplotype's own coordinates: its bases, not the box. */
      steps.push({ node: id, start, end, segment: piece });
      if (node.lanes[node.lanes.length - 1] !== lane.key) {
        node.lanes.push(lane.key);
      }
    };
    let previous = -1;
    for (const step of lane.steps) {
      const column = model.nodeById.get(step.node)?.column;
      if (column === undefined) continue;
      const at = segmentOfColumn[column];
      if (at < 0) continue;
      /* Sites jumped over between the last segment and this one, read as
         the walk that takes nothing. */
      const last = steps[steps.length - 1];
      if (last && last.segment === step.segment && previous >= 0) {
        for (let between = previous + 1; between < at; between++) {
          const index = walkOf[between].get(lane.key);
          const walk = index && segments[between].walks[index - 1];
          if (walk && walk.nodes.length === 0) {
            push(walkId(between, index), step.start, step.segment, step.start);
          }
        }
      }
      const segment = segments[at];
      if (segment.kind === "same") {
        push(sameId(at), step.start, step.segment, step.end);
      } else {
        const index = walkOf[at].get(lane.key);
        if (index) push(walkId(at, index), step.start, step.segment, step.end);
      }
      previous = at;
    }

    /* Its pieces, as the model's lanes carry them. */
    const pieces: LaneSegment[] = [];
    for (const step of steps) {
      const piece = pieces[step.segment];
      if (piece) {
        piece.nodes.push(step.node);
        piece.end = step.end;
      } else {
        pieces[step.segment] = {
          nodes: [step.node],
          start: step.start,
          end: step.end,
        };
      }
    }
    const order = steps.map((step) => step.node);
    return {
      ...lane,
      segments: pieces.filter(Boolean),
      order,
      steps,
      nodeSet: new Set(order),
      bp: steps.reduce((sum, step) => sum + (step.end - step.start), 0),
      interval: steps.length
        ? { start: steps[0].start, end: steps[steps.length - 1].end }
        : null,
    };
  });

  const nodes = columns.flatMap((column) =>
    column.nodeIds.map((id) => nodeById.get(id)!),
  );
  return {
    nodes,
    nodeById,
    columns,
    lanes,
    edges: [...edges.values()],
    reference: lanes.find((lane) => lane.isReference) ?? null,
    totalBp: model.totalBp,
    rowCount: Math.max(1, ...columns.map((column) => column.nodeIds.length)),
    referenceInterval: model.referenceInterval,
  };
}

/**
 * What each box of the compressed model says about its length, since its
 * width is where it is and not how long: a shared stretch's length, a walk's
 * and how it differs from the reference's allele there.
 */
export function boxLabels(segments: VariantSegment[]): Map<string, string> {
  const labels = new Map<string, string>();
  segments.forEach((segment, at) => {
    if (segment.kind === "same") {
      const bp = segment.refEnd - segment.refStart;
      if (bp > 0) labels.set(sameId(at), bpLabel(bp));
      return;
    }
    for (const walk of segment.walks) labels.set(walkId(at, walk.index), walk.label);
  });
  return labels;
}

/** How much of each box its walk's bases would fill, for the grouped map's
    inner fill; see `VariantWalk.fill`. A shared stretch fills its box. */
export function boxFills(segments: VariantSegment[]): Map<string, number> {
  const fills = new Map<string, number>();
  segments.forEach((segment, at) => {
    if (segment.kind !== "site") return;
    for (const walk of segment.walks) fills.set(walkId(at, walk.index), walk.fill);
  });
  return fills;
}

/** Which segment, and which of its walks, a box of the compressed model is:
    the walk is null for a shared stretch. Null for an id that is not one. */
export function boxSegment(
  id: string,
): { segment: number; walk: number | null } | null {
  const walk = id.match(/^walk:(\d+):(\d+)$/);
  if (walk) return { segment: Number(walk[1]), walk: Number(walk[2]) };
  const stretch = id.match(/^stretch:(\d+)$/);
  return stretch ? { segment: Number(stretch[1]), walk: null } : null;
}
