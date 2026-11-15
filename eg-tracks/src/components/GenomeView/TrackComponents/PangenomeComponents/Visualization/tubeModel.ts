import { linearModelOf } from "./linearModel";
import type { Row } from "./linearModel";
import type { RowStep } from "./rowAlign";
import { buildModel } from "./pangenomeModel";
import type { GraphNode, LaneDeletion, LaneRow, PangenomeModel } from "./pangenomeModel";

/* ══════════════════════════════════════════════════════════════════════════
   The tube map's model, from the rows of the linear view: a tube is a row
   (PLAN-tube.md in eg3/claude-memory).

   The linear view places every walk of the fetch as a row (linearModel.ts):
   one per pass, a tail that turns back a further row, a pass that reads none
   of the band's reference no row. The tube map takes those rows and gives
   each a lane of its own layout (pangenomeModel.ts buildModel, a lane a
   path), so a haplotype that comes through the band five times is five
   tubes through the same boxes: nothing is stitched, and no node is drawn
   again for a later pass.

   A row is handed over as the stretch the band holds:

   1. Its own steps: the row's, less the steps of the row after it when that
      row is its tail.
   2. From its first to its last step on a node the band's reference walk
      reads. What the fetch followed outside that (walkOn.ts: on to the node
      where the walk rejoins the reference) is not drawn; a row with no such
      step, white over the whole band, has no tube.
   3. Where the row leaves the band by a deletion (rowAlign.ts OutOfBand,
      the pointer's rule 4), that is the lane's open deletion: the layout
      draws it out to the band's edge with its size, from the row's
      outermost reference node on that side (openDeletions below). Read off
      the row, not found again from the steps: the older rule
      (laneDeletions) finds none where the walk turns strand at the
      junction.
   4. Every inverted run (the pointer's rule 2: an inversion in place, or
      the whole of a reverse pass) is handed over read the other way: its
      steps back to front, each on the other strand, which is the same path
      read from its other end, and how the pointer reads it inside the run.
      The tube is then one line through the boxes, left to right; its own
      coordinates count down along the run (`descending`), which the view
      marks with chevrons, and a reverse pass has its start at its right end.
      Walked as it is, a run was a line a node: each step goes back along
      the layout.

   The result has the fetch's shape - nodes, edges, paths - holding only
   the nodes these steps and the reference read.
   ══════════════════════════════════════════════════════════════════════════ */

interface TubePath {
  name: string;
  sample: string;
  haplotype: number;
  contig: string;
  is_reference: false;
  path: Array<{ id: string; is_reverse: boolean }>;
  path_handle: string;
  own: Array<[number, number]>;
  descending?: boolean[];
  row: LaneRow;
}

/** A step as the tube map takes it: `descending` in an inverted run, read
    the other way. */
export interface TubeStep extends RowStep {
  descending?: boolean;
}

/** A step read the other way: the same bases, the other strand. */
const turned = (step: RowStep): TubeStep => ({
  ...step,
  reverse: !step.reverse,
  descending: true,
});

/**
 * A row's steps as the tube map draws them (the rule above), every
 * inverted run read the other way; null for a row with no node of the
 * band's reference.
 */
export function tubeSteps(
  row: Row,
  next: Row | undefined,
  onReference: ReadonlySet<string>,
): TubeStep[] | null {
  /* A tail laid out as the next row is the end of this row's steps. */
  const tail =
    next?.continued &&
    next.steps.length < row.steps.length &&
    row.steps[row.steps.length - next.steps.length] === next.steps[0]
      ? next.steps.length
      : 0;
  const own = tail ? row.steps.slice(0, row.steps.length - tail) : row.steps;
  let first = -1;
  let last = -1;
  own.forEach((step, i) => {
    if (!onReference.has(step.node)) return;
    if (first < 0) first = i;
    last = i;
  });
  if (first < 0) return null;
  /* Each inverted run, where it lies in the kept stretch: [from, to) of
     the row's steps (rowAlign.ts: the "inversion" bubble's own). */
  const runs = row.bubbles
    .filter((bubble) => bubble.cls === "inversion")
    .map(
      (bubble) =>
        [Math.max(first, bubble.steps[0]), Math.min(last + 1, bubble.steps[1])] as [
          number,
          number,
        ],
    )
    .filter(([from, to]) => to > from)
    .sort((a, b) => a[0] - b[0]);
  const steps: TubeStep[] = [];
  let at = first;
  for (const [from, to] of runs) {
    if (from < at) continue;
    for (let i = at; i < from; i++) steps.push(own[i]);
    for (let i = to - 1; i >= from; i--) steps.push(turned(own[i]));
    at = to;
  }
  for (let i = at; i <= last; i++) steps.push(own[i]);
  return steps;
}

/**
 * Each row lane's deletions running out of the band, from its row: the
 * layout's own between two nodes of the band stay, and its open ones are
 * replaced by the pointer's. `rows` are the lanes' rows, in the lanes'
 * order after the reference.
 */
function openDeletions(model: PangenomeModel, rows: Row[]) {
  const lanes = model.lanes.filter((lane) => !lane.isReference);
  lanes.forEach((lane, k) => {
    const row = rows[k];
    if (!row || !lane.row) return;
    const open: LaneDeletion[] = [];
    for (const out of row.outOfBand) {
      /* The row's reference node furthest that way: where its tube ends. */
      let at = -1;
      let edge: GraphNode | null = null;
      lane.steps.forEach((step, i) => {
        const node = model.nodeById.get(step.node);
        if (!node || !node.onReference || node.untied) return;
        if (!edge || (out.side === "right" ? node.x > edge.x : node.x < edge.x)) {
          edge = node;
          at = i;
        }
      });
      const from = edge as GraphNode | null;
      if (!from) continue;
      open.push({
        left: out.side === "right" ? from.x + from.length : null,
        right: out.side === "left" ? from.x : null,
        refFrom: out.refFrom,
        refTo: out.refTo,
        bp: out.bp,
        step: at,
        walk: out.side === "right" ? [from.id, out.node] : [out.node, from.id],
        open: out.side,
        forward: true,
      });
    }
    lane.deletions = [...(lane.deletions ?? []).filter((d) => d.open === null), ...open];
  });
}

/** The rows of a fetch as a fetch of their own: the reference walk, and a
    path a row; `rows`, the row each path after the reference's is. Null
    where the linear view has no model. */
export function tubeResultOf(queryResult: any): any | null {
  const result = queryResult?.result ?? queryResult;
  const linear = linearModelOf(queryResult);
  if (!linear) return null;
  const rawPaths: any[] = result?.paths ?? [];
  const flaggedAt = rawPaths.findIndex((raw) => raw?.is_reference === true);
  const reference = rawPaths[flaggedAt >= 0 ? flaggedAt : 0];
  if (!reference) return null;

  const onReference = new Set(linear.refSteps.map((step) => step.id));
  const used = new Set(onReference);
  const paths: any[] = [reference];
  const rows: Row[] = [];
  for (const lane of linear.lanes) {
    if (lane.isReference) continue;
    lane.rows.forEach((row, k) => {
      const steps = tubeSteps(row, lane.rows[k + 1], onReference);
      if (!steps) return;
      let from = Infinity;
      let to = -Infinity;
      for (const step of steps) {
        used.add(step.node);
        from = Math.min(from, step.start);
        to = Math.max(to, step.end);
      }
      const path: TubePath = {
        name: `${lane.sample}#${lane.haplotype}#${row.contig}[${from}-${to}]`,
        sample: lane.sample,
        haplotype: lane.haplotype,
        contig: row.contig,
        is_reference: false,
        path: steps.map((step) => ({ id: step.node, is_reverse: step.reverse })),
        path_handle: `row ${lane.label} ${row.pass.n}`,
        own: steps.map((step) => [step.start, step.end]),
        ...(steps.some((step) => step.descending)
          ? { descending: steps.map((step) => !!step.descending) }
          : {}),
        row: {
          n: row.pass.n,
          of: row.pass.of,
          reverse: row.flipped,
          continued: row.continued,
        },
      };
      paths.push(path);
      rows.push(row);
    });
  }

  const rawNodes: Record<string, string> = result?.nodes ?? {};
  const nodes: Record<string, string> = {};
  for (const id of used) {
    if (rawNodes[id] !== undefined) nodes[id] = rawNodes[id];
  }
  const rawEdges: Record<string, Array<{ to: string }>> = result?.edges ?? {};
  const edges: Record<string, Array<{ to: string }>> = {};
  for (const [from, links] of Object.entries(rawEdges)) {
    if (!used.has(from)) continue;
    const kept = links.filter((link) => used.has(String(link.to)));
    if (kept.length) edges[from] = kept;
  }
  return {
    nodes,
    edges,
    paths,
    rows,
    referenceAt: result?.referenceAt,
    carriers: result?.carriers,
  };
}

/* A model per fetched graph, as modelOf keeps one: the band's layout, the
   row's height and the drawing read the same one. */
const models = new WeakMap<object, PangenomeModel | null>();
export function tubeModelOf(queryResult: any): PangenomeModel | null {
  if (!queryResult || typeof queryResult !== "object") return null;
  if (!models.has(queryResult)) {
    const rows = tubeResultOf(queryResult);
    const model = rows ? buildModel(rows, { lanePerPath: true }) : null;
    if (model) openDeletions(model, rows.rows);
    models.set(queryResult, model);
  }
  return models.get(queryResult) ?? null;
}
