import type { GraphNode, Lane, PangenomeModel } from "./pangenomeModel";
import { laneTotal } from "./pangenomeModel";

/* ══════════════════════════════════════════════════════════════════════════
   Shared between the two views, so a node reads the same in both.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Font size that makes a monospace glyph exactly one base wide, so sequence
 * text lines up with the bases underneath it without being distorted.
 *
 * Forcing the width with `textLength` and `lengthAdjust="spacingAndGlyphs"`
 * also aligns it, but stretches the glyph shapes to do it, which is what made
 * the letters look squashed. Choosing the size instead keeps them intact.
 */
const MONO_ADVANCE = 0.6; // advance width of a monospace glyph, as a fraction of its size
/** How much of a node's sequence its tooltip spells out: some five lines of
    the tooltip's width. */
const SEQUENCE_SHOWN = 300;
export const SEQUENCE_MAX_SIZE = 15;

/**
 * How big to draw sequence text at a given zoom.
 *
 * Large enough to fill a base, capped so a wide zoom does not turn the
 * sequence into a headline. Where the letters go is a separate question,
 * answered by baseCentres - the size only decides whether a letter fits in
 * the space its base occupies.
 */
export function sequenceSize(pxPerBase: number): number {
  return Math.min(SEQUENCE_MAX_SIZE, pxPerBase / MONO_ADVANCE);
}

/**
 * The centre of every base in a run, for SVG's per-glyph `x` list.
 *
 * A `<text>` given a list of coordinates places one glyph at each, so this
 * pins every letter to the base it spells rather than letting the font
 * decide. That matters because the font is not known: the stack falls
 * through to Consolas on Windows, whose glyphs advance 0.55em against the
 * 0.6em the other faces use, and a per-glyph error of a few percent walks
 * the end of a long node clean off its bases.
 *
 * `perBase` is the width one base occupies *in the view asking* - not always
 * the zoom, since a view may draw a short node wider than its sequence.
 */
export function baseCentres(
  startX: number,
  length: number,
  perBase: number,
): string {
  const centres: number[] = [];
  for (let i = 0; i < length; i++) {
    centres.push(Math.round((startX + (i + 0.5) * perBase) * 100) / 100);
  }
  return centres.join(" ");
}

/** A half-open coordinate range, phrased for a reader. */
export const rangeLabel = (start: number, end: number) =>
  `${start.toLocaleString()}–${end.toLocaleString()}`;

/** What one haplotype occupies here, in its own coordinates. */
export function laneDetailLines(lane: Lane): string[] {
  const lines = [
    `${lane.sample} · haplotype ${lane.haplotype} · ${lane.contig}`,
    lane.interval
      ? `${rangeLabel(lane.interval.start, lane.interval.end)} in its own coordinates`
      : "position unknown",
    `${lane.bp} bp here`,
  ];
  if (lane.segments.length > 1) {
    lines.push(
      `in ${lane.segments.length} pieces here, leaving the window between them`,
    );
  }
  return lines;
}

/** Where a haplotype came from and went to at each node it walks. */
export interface LaneNeighbours {
  prev: string[];
  next: string[];
}

/**
 * Worked out once per haplotype and kept, since both views ask for it a
 * node at a time while the pointer moves.
 */
const neighbours = new WeakMap<Lane, Map<string, LaneNeighbours>>();

/**
 * Where one haplotype comes from and goes to at every node it walks.
 *
 * Its own steps, so the answer is about the path a reader is following and
 * not about the graph, where nearly every node has ways on that nothing
 * here takes. Usually one each way; more where this haplotype walks the
 * same node more than once.
 *
 * Only within a walk: the step before a walk's first is where the haplotype
 * was before it left the window, not a way into this node.
 */
export function laneNeighbourMap(lane: Lane): Map<string, LaneNeighbours> {
  const had = neighbours.get(lane);
  if (had) return had;
  const prev = new Map<string, Set<string>>();
  const next = new Map<string, Set<string>>();
  const reach = (at: Map<string, Set<string>>, id: string) => {
    let set = at.get(id);
    if (!set) {
      set = new Set<string>();
      at.set(id, set);
    }
    return set;
  };
  lane.steps.forEach((step, index) => {
    reach(prev, step.node);
    reach(next, step.node);
    const before = lane.steps[index - 1];
    const after = lane.steps[index + 1];
    if (before && before.segment === step.segment) {
      reach(prev, step.node).add(before.node);
    }
    if (after && after.segment === step.segment) {
      reach(next, step.node).add(after.node);
    }
  });
  const map = new Map<string, LaneNeighbours>();
  for (const id of prev.keys()) {
    map.set(id, {
      prev: [...(prev.get(id) ?? [])],
      next: [...(next.get(id) ?? [])],
    });
  }
  neighbours.set(lane, map);
  return map;
}

/** The same, for one node. */
export function laneNeighbours(lane: Lane, nodeId: string): LaneNeighbours {
  return laneNeighbourMap(lane).get(nodeId) ?? { prev: [], next: [] };
}

/** Those two, phrased for a reader. */
export function laneNeighbourLines(lane: Lane, nodeId: string): string[] {
  const { prev, next } = laneNeighbours(lane, nodeId);
  const list = (ids: string[]) => ids.map((id) => `node ${id}`).join(", ");
  return [
    prev.length ? `prev: ${list(prev)}` : "prev: enters the window here",
    next.length ? `next: ${list(next)}` : "next: leaves the window here",
  ];
}

/** Where a node sits on the reference, phrased for a reader. */
export function nodeInterval(node: GraphNode): string {
  if (node.refEnd > node.refStart) {
    return `${node.refStart.toLocaleString()}–${node.refEnd.toLocaleString()}`;
  }
  // A site the reference walks straight past: the allele sits between bases.
  return `inserted at ${node.refStart.toLocaleString()}`;
}

/** The lines shown for a node, in a tooltip or the detail bar. */
export function nodeDetailLines(
  node: GraphNode,
  model: PangenomeModel,
): string[] {
  const lines = [
    `${node.length} bp · ${nodeInterval(node)}`,
    node.onReference
      ? "on the reference walk"
      : "an alternative to the reference here",
    `carried by ${node.lanes.length} of ${laneTotal(model)} haplotypes`,
  ];
  /* The whole allele, wrapped in the tooltip, up to a length a tooltip can
     still be read at: past that the rest is counted rather than shown. */
  if (node.sequence) {
    lines.push(
      node.sequence.length > SEQUENCE_SHOWN
        ? `${node.sequence.slice(0, SEQUENCE_SHOWN)}… (${(
            node.sequence.length - SEQUENCE_SHOWN
          ).toLocaleString()} more bp)`
        : node.sequence,
    );
  }
  lines.push(...sameSequenceLines(node, model));
  return lines;
}

/** How many other same-sequence nodes are spelled out before the rest are cut. */
const TWIN_CAP = 2;
/** How many of a node's neighbours are named before the rest are cut. */
const NEIGHBOUR_CAP = 3;

/**
 * The other nodes in this node's column with exactly its sequence, and what
 * tells them apart.
 *
 * A column is a depth in the graph rather than a site, so two nodes in one can
 * carry the same bases and still be different places. In the MHC every such
 * pair looked at had a haplotype walking through both, a couple of thousand
 * bases apart - a second copy of the stretch, not an allele beside the first -
 * so they stay separate nodes, and this says which is which: where each joins
 * the graph, and how far apart a haplotype through both meets them.
 */
export function sameSequenceLines(
  node: GraphNode,
  model: PangenomeModel,
): string[] {
  const column = model.columns[node.column];
  if (!column || !node.sequence) return [];
  const twins = column.nodeIds
    .map((id) => model.nodeById.get(id))
    .filter(
      (other): other is GraphNode =>
        !!other && other.id !== node.id && other.sequence === node.sequence,
    );
  if (!twins.length) return [];

  const lines = [
    `same sequence here: node ${twins.map((twin) => twin.id).join(", ")}`,
    `node ${node.id}: ${joins(node.id, model)}`,
  ];
  for (const twin of twins.slice(0, TWIN_CAP)) {
    lines.push(`node ${twin.id}: ${joins(twin.id, model)}`);
    const both = model.lanes.find(
      (lane) => lane.nodeSet.has(node.id) && lane.nodeSet.has(twin.id),
    );
    const here = both?.steps.find((step) => step.node === node.id);
    const there = both?.steps.find((step) => step.node === twin.id);
    lines.push(
      both && here && there
        ? `${both.label} walks both, ${Math.abs(
            there.start - here.start,
          ).toLocaleString()} bp apart`
        : "no haplotype walks both",
    );
  }
  if (twins.length > TWIN_CAP) {
    lines.push(`and ${twins.length - TWIN_CAP} more`);
  }
  return lines;
}

/** Where a node joins the graph: the nodes just before it and just after. */
function joins(id: string, model: PangenomeModel): string {
  const from: string[] = [];
  const to: string[] = [];
  for (const edge of model.edges) {
    if (edge.to === id) from.push(edge.from);
    if (edge.from === id) to.push(edge.to);
  }
  const list = (ids: string[]) =>
    !ids.length
      ? "–"
      : ids.length > NEIGHBOUR_CAP
        ? `${ids.slice(0, NEIGHBOUR_CAP).join(", ")}…`
        : ids.join(", ");
  return `after ${list(from)}, before ${list(to)}`;
}
