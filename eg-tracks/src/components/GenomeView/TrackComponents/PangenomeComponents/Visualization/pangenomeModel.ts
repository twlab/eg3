import type { Carriers } from "../../../../../getRemoteData/gbz/subgraph";
import { niceBpCount } from "../../../../../models/util";

/* ══════════════════════════════════════════════════════════════════════════
   Shared model behind both pangenome renderings.

   The gbz-base subgraph JSON is turned into a *linearized* graph: nodes are
   sorted into columns by their longest-path topological level, and every
   column is given a width in bases. Alternative alleles of the same site land
   in the same column and are stacked into rows, so the reference walk runs
   along row 0 and bubbles hang below it.

   That single layout drives both views:

     - the "vg viz" view uses the column x-offsets as a base-level coordinate
       and paints one bar per haplotype (figure 2c of Eizenga et al. 2020)
     - the tube map view uses the column x-offsets *and* the row assignment,
       and threads each haplotype through the nodes as a tube (figure 2d)

   A haplotype reaches us as several walks rather than one, because a walk
   that leaves the extracted window is cut there and resumes when it comes
   back. Those pieces are stitched into one lane, and the seams are kept so
   both views can draw the haplotype leaving the window.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Incoming data shapes (gbz-base subgraph JSON) ─────────────────────── */
export interface RawStep {
  id: string;
  is_reverse?: boolean;
}

export interface RawPath {
  name?: string;
  sample?: string;
  contig?: string;
  haplotype?: number;
  is_reference?: boolean;
  path?: RawStep[];
}

export interface RawEdge {
  from: string;
  to: string;
  from_is_reverse?: boolean;
  to_is_reverse?: boolean;
}

/* ── Derived model ─────────────────────────────────────────────────────── */
export interface GraphNode {
  id: string;
  sequence: string;
  length: number;
  /** Column index: nodes sharing a column are alleles of the same site. */
  column: number;
  /** Linearized offset of the column, in bases from the left edge. */
  x: number;
  /** 0 for the reference allele, 1+ for the alternatives hanging below it. */
  row: number;
  /** Lane keys traversing this node, in lane order. */
  lanes: string[];
  onReference: boolean;
  /**
   * The stretch of the reference this node's site covers, in haplotype
   * coordinates. A node the reference walks through reports its own span; an
   * allele beside it reports the span of the site it is an alternative to. A
   * site the reference skips entirely is an insertion point, and reports a
   * zero-width span at the position it sits between.
   */
  refStart: number;
  refEnd: number;
  /** Nothing on the reference leads to it and it leads to nothing on the
      reference, in what was fetched: it has no place against the
      reference here, and is not drawn in the bars. */
  untied?: boolean;
  /** Where on the reference the reference's own path reads this node,
      when that is outside this band: its place is there, not here. Such a
      node is untied here too. */
  elsewhere?: number;
}

/**
 * A haplotype jumping over reference: the white in its bar, and how much
 * it skips. An end is null where it lies outside the band - a deletion
 * running to a node the reference's path only reads elsewhere.
 */
export interface LaneDeletion {
  /** Where the white starts and ends, along the layout. */
  left: number | null;
  right: number | null;
  /** The reference it skips: `refFrom` up to `refTo`. */
  refFrom: number;
  refTo: number;
  bp: number;
  /** The visit on the reference here it leaves or rejoins at, as an index
      into the lane's steps, and the two nodes the jump is between, in
      walk order. */
  step: number;
  walk: [string, string];
  /** Which end is outside the band, if either: the end whose white runs
      to the band's edge. */
  open: "left" | "right" | null;
  /** Whether the haplotype reads the reference forwards here, its walk
      running left to right along the layout. */
  forward: boolean;
}

/** A deletion's size, as genomealign gives a gap's: Kb from 10,000, Mb
    from 750,000, below that the count itself. */
export function deletionSize(bp: number): string {
  return bp >= 10000 ? niceBpCount(bp) : `${bp.toLocaleString()} bp`;
}

/** A deletion's label: "−5,045 bp →" for one running out of the band to
    the right, "← −980 bp" to the left, "−12 bp" for one inside it. */
export function deletionText(
  bp: number,
  open: "left" | "right" | null,
): string {
  const size = `−${deletionSize(bp)}`;
  return open === "left" ? `← ${size}` : open === "right" ? `${size} →` : size;
}

export interface LaneSegment {
  nodes: string[];
  /** Haplotype coordinates of the walk, when the walk name carries them. */
  start: number | null;
  end: number | null;
}

export interface Lane {
  key: string;
  label: string;
  sample: string;
  contig: string;
  haplotype: number;
  isReference: boolean;
  color: string;
  /** Vertical rank, shared by both views so a haplotype keeps its position. */
  index: number;
  segments: LaneSegment[];
  /** Every node the lane visits, in order, with the seams flattened out. */
  order: string[];
  /**
   * The same visits, each carrying its position in *this haplotype's* own
   * coordinates - which are not the reference's. Walks arrive named
   * `SAMPLE#HAP#CONTIG[start-end]`, and those starts are what these count from.
   */
  steps: LaneStep[];
  nodeSet: Set<string>;
  /** Bases of this haplotype inside the window. */
  bp: number;
  /** First to last position this haplotype occupies here, in its own coordinates. */
  interval: { start: number; end: number } | null;
  /** Where it jumps over the reference; see laneDeletions. */
  deletions?: LaneDeletion[];
}

/** One node visit by one haplotype, placed in that haplotype's coordinates. */
export interface LaneStep {
  node: string;
  start: number;
  end: number;
  /** Which of the lane's walks this visit belongs to. */
  segment: number;
}

export interface GraphEdge {
  key: string;
  from: string;
  to: string;
  lanes: string[];
}

export interface Column {
  index: number;
  x: number;
  /** From its first node's start to its last node's end. Its nodes start
      where each is led to, not all at x - see buildModel; the tube map
      keeps a column as wide as its widest node, its nodes at its start:
      see columnarModel. */
  width: number;
  nodeIds: string[];
}

/* ── The band a drawing has to fill ─────────────────────────────────────
   A window is windowWidth pixels of the reference, and the browser keeps
   three of them fetched, so the band is windowWidth * 3. Pixels and bases
   are locked together by that: a drawing of any other width would mean
   panning by a window did not move by a window of bases, and every
   conversion between the two would be off by the difference.

   The extraction does not stop where the band does - it returns whole
   nodes, so it overshoots at both ends, by 0.4% of the band in a busy
   window and 13% in a quiet one where the nodes are long. Those bases are
   drawn where they belong, off the end of the band, and clipped. */
export interface DrawFrame {
  /** The base at x = 0. */
  startBp: number;
  /** The base at x = width. */
  endBp: number;
  /** How wide the band is in pixels: windowWidth per window fetched. */
  width: number;
  /* Which slice of the band the reader is actually looking at - the
     middle window of the three, the other two being runway. The drawing
     is fitted to this rather than to the band as a whole, because this is
     the part that has to show the region that was asked for. */
  viewFromPx: number;
  viewToPx: number;
}

export interface PangenomeModel {
  nodes: GraphNode[];
  nodeById: Map<string, GraphNode>;
  columns: Column[];
  lanes: Lane[];
  edges: GraphEdge[];
  reference: Lane | null;
  /** Total width of the linearized layout, in bases. */
  totalBp: number;
  rowCount: number;
  /** The stretch of the reference this whole subgraph covers. */
  referenceInterval: { start: number; end: number } | null;
  /** How many haplotypes the graph has, when `lanes` holds only some of
      them - a track row drawing one haplotype, or the strip alone. */
  laneCount?: number;
  /** How common each node and allele is in the whole pangenome, counted
      over every haplotype in the window rather than the lanes drawn. */
  carriers?: Carriers;
}

/**
 * Where a lane jumps over the reference: from a node on it to the next one
 * it reads further along - inside the band, or outside it where the next
 * is a node the reference's path reads elsewhere. Read on the reference's
 * strand, so a walk against the reference says the same; a jump back
 * along it is a rearrangement, not a deletion, and is left out.
 */
function laneDeletions(
  lane: Lane,
  nodeById: Map<string, GraphNode>,
): LaneDeletion[] {
  const steps = lane.steps;
  const at = (i: number) => nodeById.get(steps[i].node);
  const known = (node: GraphNode | undefined): node is GraphNode =>
    !!node && (node.onReference || node.elsewhere !== undefined);
  const startOn = (node: GraphNode) =>
    node.onReference ? node.refStart : node.elsewhere!;
  const endOn = (node: GraphNode) =>
    node.onReference ? node.refEnd : node.elsewhere! + node.length;
  const joined = (i: number) => steps[i].segment === steps[i + 1].segment;
  /* Which way this haplotype reads the reference. */
  let drift = 0;
  for (let i = 0; i + 1 < steps.length; i++) {
    const a = at(i);
    const b = at(i + 1);
    if (joined(i) && known(a) && known(b)) drift += startOn(b) - startOn(a);
  }
  const forward = drift >= 0;
  const out: LaneDeletion[] = [];
  for (let i = 0; i + 1 < steps.length; i++) {
    if (!joined(i)) continue;
    const a = at(i);
    const b = at(i + 1);
    if (!known(a) || !known(b)) continue;
    /* Both elsewhere: nothing of it is here. */
    if (!a.onReference && !b.onReference) continue;
    const [low, high] = forward ? [a, b] : [b, a];
    const bp = startOn(high) - endOn(low);
    if (bp <= 0) continue;
    out.push({
      left: low.onReference ? low.x + low.length : null,
      right: high.onReference ? high.x : null,
      refFrom: endOn(low),
      refTo: startOn(high),
      bp,
      step: a.onReference ? i : i + 1,
      walk: [a.id, b.id],
      open: !low.onReference ? "left" : !high.onReference ? "right" : null,
      forward,
    });
  }
  return out;
}

/** How many haplotypes the graph has, however many lanes this model draws. */
export const laneTotal = (model: PangenomeModel) =>
  model.laneCount ?? model.lanes.length;

/* ── Palette ───────────────────────────────────────────────────────────── */
/* The reference is the line every other haplotype is read against, so it
   gets the one colour nothing else is allowed near. */
export const REF_COLOR = "#30afff";

/**
 * A haplotype's own pastel, from its name: the same name gets the same
 * colour whatever else is loaded, in whatever order, in any session. Colours
 * used to be handed out from a list in the order haplotypes arrived, so
 * loading one more changed everybody's.
 *
 * The name is hashed (FNV-1a, then mixed so names a character apart land
 * far apart) and the hash picks the hue - leaving out the 25 degrees around
 * the reference's blue, so no haplotype is taken for it - and nudges the
 * saturation and lightness within a pastel's range, so two names of near
 * hues still differ. Light enough to read the letters' black chips on, dark
 * enough for the ivory hatching to show.
 */
export function pastelColor(name: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  hash >>>= 0;
  let hue = hash % 335;
  if (hue >= 188) hue += 25;
  const saturation = 45 + ((hash >>> 12) % 21);
  const lightness = 68 + ((hash >>> 20) % 11);
  return hslToHex(hue, saturation, lightness);
}

/** An HSL colour - degrees, per cent, per cent - as #rrggbb. */
function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12;
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

const numericCompare = (a: string, b: string) =>
  String(a).localeCompare(String(b), undefined, { numeric: true });

/** `MHC-GRCh38#0#MHC[4073899-4074353]` -> its parts. */
const WALK_NAME = /^(.*?)#(\d+)#([^[\]]+?)(?:\[(\d+)-(\d+)\])?$/;

function parseWalkName(raw: RawPath, fallback: string) {
  const match = raw.name ? WALK_NAME.exec(raw.name) : null;
  if (match) {
    return {
      sample: raw.sample ?? match[1],
      haplotype: raw.haplotype ?? Number(match[2]),
      contig: raw.contig ?? match[3],
      start: match[4] !== undefined ? Number(match[4]) : null,
      end: match[5] !== undefined ? Number(match[5]) : null,
    };
  }
  return {
    sample: raw.sample ?? raw.name ?? fallback,
    haplotype: raw.haplotype ?? 0,
    contig: raw.contig ?? "?",
    start: null,
    end: null,
  };
}

/**
 * Builds the layout. Returns null when there is nothing to draw, which is the
 * normal answer for a tile that falls outside the part of the graph covered by
 * the queried haplotype.
 */
export function buildModel(queryResult: any): PangenomeModel | null {
  const result = queryResult?.result ?? queryResult;
  console.log(result);
  const rawNodes: Array<{ id: string; sequence?: string }> =
    result?.nodes ?? [];
  const rawPaths: RawPath[] = result?.paths ?? [];
  const rawEdges: RawEdge[] = result?.edges ?? [];
  if (!rawNodes.length) return null;

  const sequences = new Map<string, string>();
  rawNodes.forEach((n) => sequences.set(n.id, n.sequence ?? ""));

  /* ── Lanes: stitch each haplotype's walks back together ──────────────── */
  interface Draft {
    sample: string;
    contig: string;
    haplotype: number;
    isReference: boolean;
    firstSeen: number;
    segments: LaneSegment[];
  }

  const drafts = new Map<string, Draft>();

  /* The queried reference walk is the one flagged is_reference. A result
     without the flag falls back on its first walk, which is where
     gbz-base writes it. */
  const flaggedAt = rawPaths.findIndex((raw) => raw.is_reference === true);
  const queriedAt = flaggedAt >= 0 ? flaggedAt : rawPaths.length ? 0 : -1;
  const isQueried = (raw: RawPath, i: number) =>
    flaggedAt >= 0 ? raw.is_reference === true : i === 0;
  /** Which path a walk is on: its sample, haplotype and contig. */
  const pathKeyOf = (walk: {
    sample: string;
    haplotype: number;
    contig: string;
  }) => `${walk.sample}#${walk.haplotype}#${walk.contig}`;
  console.log(rawPaths);
  const referenceKey =
    queriedAt < 0
      ? null
      : pathKeyOf(parseWalkName(rawPaths[queriedAt], `walk-${queriedAt}`));

  rawPaths.forEach((raw, i) => {
    const parsed = parseWalkName(raw, `walk-${i}`);
    const isReference = isQueried(raw, i);
    const pathKey = pathKeyOf(parsed);
    /* The reference is the walk over the queried region, and only that.
       The same path can come back elsewhere through context - CHM13's own
       chr6 at 32,370,665, a repeat of 32,365,933 - and joined to the
       reference lane it was numbered as if it went on from there, 4.7 kb
       out. It is a walk like any haplotype's, placed by the graph. */
    const key =
      !isReference && pathKey === referenceKey
        ? `${pathKey}#elsewhere`
        : pathKey;

    let draft = drafts.get(key);
    if (!draft) {
      draft = {
        sample: parsed.sample,
        contig: parsed.contig,
        haplotype: parsed.haplotype,
        isReference,
        firstSeen: i,
        segments: [],
      };
      drafts.set(key, draft);
    }
    draft.isReference = draft.isReference || isReference;
    draft.segments.push({
      nodes: (raw.path ?? []).map((s) => s.id),
      start: parsed.start,
      end: parsed.end,
    });
  });
  console.log(drafts);
  const lanes: Lane[] = Array.from(drafts.entries())
    /* Reference first, then in the order the walks arrived. */
    .sort(([, a], [, b]) => {
      if (a.isReference !== b.isReference) return a.isReference ? -1 : 1;
      return a.firstSeen - b.firstSeen;
    })
    .map(([key, draft], index) => {
      /* Walks of one haplotype arrive out of order; genomic start restores it. */
      const segments = draft.segments
        .slice()
        .sort((a, b) => (a.start ?? 0) - (b.start ?? 0))
        .filter((s) => s.nodes.length > 0);
      /* Each walk carries its own start, so positions are counted from there
         rather than from the reference. A walk whose name had no coordinates
         continues from wherever the previous one ended. */
      const order: string[] = [];
      const steps: LaneStep[] = [];
      let cursor = segments[0]?.start ?? 0;
      segments.forEach((segment, segmentIndex) => {
        if (segment.start !== null) cursor = segment.start;
        segment.nodes.forEach((id) => {
          const length = (sequences.get(id) ?? "").length;
          order.push(id);
          steps.push({
            node: id,
            start: cursor,
            end: cursor + length,
            segment: segmentIndex,
          });
          cursor += length;
        });
      });

      const nodeSet = new Set(order);
      let bp = 0;
      nodeSet.forEach((id) => {
        bp += (sequences.get(id) ?? "").length;
      });
      const interval = steps.length
        ? { start: steps[0].start, end: steps[steps.length - 1].end }
        : null;
      return {
        key,
        label: `${draft.sample}#${draft.haplotype}`,
        sample: draft.sample,
        contig: draft.contig,
        haplotype: draft.haplotype,
        isReference: draft.isReference,
        color: draft.isReference
          ? REF_COLOR
          : pastelColor(`${draft.sample}#${draft.haplotype}`),
        index,
        segments,
        order,
        steps,
        nodeSet,
        bp,
        interval,
      };
    });

  const reference = lanes.find((l) => l.isReference) ?? null;

  /* ── Nodes: which lanes touch them ───────────────────────────────────── */
  const laneKeys = new Map<string, string[]>();
  rawNodes.forEach((n) => laneKeys.set(n.id, []));

  /* The lanes are walked one after another, so a node already holds this
     lane exactly when this lane was the last to add itself. Asking that
     rather than searching the list keeps this linear: HPRC v2 has 392 lanes
     and a million and a half steps between them. */
  const lastLane = new Map<string, string>();
  lanes.forEach((lane) => {
    lane.order.forEach((id) => {
      const at = laneKeys.get(id);
      if (!at) return; // a step into a node the subgraph does not carry
      if (lastLane.get(id) !== lane.key) {
        lastLane.set(id, lane.key);
        at.push(lane.key);
      }
    });
  });
  console.log(lanes);
  /* ── Edges ───────────────────────────────────────────────────────────── */
  /* Found by where it starts and then where it ends, rather than by its key:
     every step of every haplotype asks, millions in a busy window, and
     building "from>to" for each was most of the time this took. The key is
     made once, with the edge. The insertion order the edges come out in is
     kept by the list. */
  const edgesFrom = new Map<string, Map<string, GraphEdge>>();
  const edgeList: GraphEdge[] = [];
  const touchEdge = (from: string, to: string) => {
    let out = edgesFrom.get(from);
    if (!out) {
      out = new Map();
      edgesFrom.set(from, out);
    }
    let edge = out.get(to);
    if (!edge) {
      edge = { key: `${from}>${to}`, from, to, lanes: [] };
      out.set(to, edge);
      edgeList.push(edge);
    }
    return edge;
  };

  rawEdges.forEach((e) => {
    if (sequences.has(e.from) && sequences.has(e.to)) touchEdge(e.from, e.to);
  });
  /* As for the nodes: the last lane to cross an edge is the only one it
     could already list. */
  const lastCrossed = new Map<GraphEdge, string>();
  lanes.forEach((lane) => {
    lane.segments.forEach((segment) => {
      for (let i = 0; i + 1 < segment.nodes.length; i++) {
        const from = segment.nodes[i];
        const to = segment.nodes[i + 1];
        if (!sequences.has(from) || !sequences.has(to)) continue;
        const edge = touchEdge(from, to);
        if (lastCrossed.get(edge) !== lane.key) {
          lastCrossed.set(edge, lane.key);
          edge.lanes.push(lane.key);
        }
      }
    });
  });
  const edges = edgeList;
  console.log(edges);
  /* ── Columns: longest-path level, from the graph alone ────────────────
     Where a node is drawn is where the graph puts it against the
     reference: after everything it is reached from, the reference's own
     walk in order, and nothing else. Levels used to start from how far
     into some haplotype's walk a node was, which keeps nodes that no edge
     reaches off column 0 - but a count of steps is a property of what was
     fetched, not of the graph: the same allele came out 67 bp from where
     it joins the reference in one window, and over reference bases past
     where it leaves in another (the MHC's 2 kb insertion at 4,074,838-849,
     loaded straight there and panned to). What such a node is tied to is
     said below instead. The pass cap stops a cyclic subgraph from looping
     forever. */
  const ids = rawNodes.map((n) => n.id);
  const level = new Map<string, number>();
  ids.forEach((id) => level.set(id, 0));
  console.log(level, rawNodes);
  const onReferenceWalk = reference?.nodeSet ?? new Set<string>();
  const referenceOrder = reference?.order ?? [];

  /* Two constraints have to hold together, so they are applied in turn until
     neither moves anything:

       - a successor sits after its predecessor (the edges)
       - the reference's own walk order is strictly increasing

     The second matters across a seam. Where the reference leaves the window
     and comes back, the returning node has no edge tying it to what came
     before, so the edges alone cannot order it and two different reference
     positions collapse into one column. Both rules only ever push levels up,
     so this converges. */

  /* Pushing successors past their predecessors, edge after edge, until
     nothing moves took as many sweeps of every edge as the longest chain is
     long - thousands, in a window of thousands of nodes. Where the edges
     have no cycle, one sweep in an order that puts every node after its
     predecessors reaches the same levels, so that is used; a cyclic
     subgraph keeps the sweeps and their cap. */
  /* What a haplotype in pieces says about where they go. One piece ending
     off the reference and the next one starting off it is the haplotype
     going from the one to the other through sequence the window does not
     hold - the middle of an insertion longer than the window - so the
     second is laid out after the first, as one allele: from where the
     haplotype last left the reference to where it next rejoins it - which
     can be pieces away, a piece in the middle being the insertion alone
     (HG002#1 at chr6:32,340,254, in three). Only where that runs forward
     along the reference; a piece coming back earlier than the last one
     left is a rearrangement, and tying it would bend the reference to it.
     For laying out only - it is no edge of the graph's. */
  const referenceIndex = new Map<string, number>();
  referenceOrder.forEach((id, index) => {
    if (!referenceIndex.has(id)) referenceIndex.set(id, index);
  });
  /* Nodes the reference's own path reads outside this band, and where;
     see referenceElsewhere in subgraph.ts. Their place is there, so they
     tie nothing here: a haplotype that took a 5 kb deletion out of the
     window carried on into them, and laid out from where it left they
     were drawn as 5 kb of novel sequence, spelled against the wrong
     reference. Without their edges they are untied, and so is whatever
     only they tie, and the haplotype's bar is white past where it left. */
  const referenceAt: Record<string, number> = result?.referenceAt ?? {};
  const elsewhereAt = new Map<string, number>();
  for (const [id, at] of Object.entries(referenceAt)) {
    if (level.has(id) && !onReferenceWalk.has(id)) elsewhereAt.set(id, at);
  }

  const layoutEdges: Array<{ from: string; to: string }> = edges
    .filter(({ from, to }) => !elsewhereAt.has(from) && !elsewhereAt.has(to))
    .map(({ from, to }) => ({ from, to }));

  for (const lane of lanes) {
    if (lane.isReference) continue;
    const pieces = lane.segments.map((segment) => segment.nodes);
    /* Where the haplotype was last on the reference by the end of each
       piece, and where it is next on it from the start of each. */
    const lastOn: Array<number | undefined> = [];
    pieces.forEach((nodes, k) => {
      const own = [...nodes].reverse().find((id) => referenceIndex.has(id));
      lastOn[k] =
        own !== undefined
          ? referenceIndex.get(own)
          : k > 0
            ? lastOn[k - 1]
            : undefined;
    });
    const nextOn: Array<number | undefined> = [];
    for (let k = pieces.length - 1; k >= 0; k--) {
      const own = pieces[k].find((id) => referenceIndex.has(id));
      nextOn[k] =
        own !== undefined
          ? referenceIndex.get(own)
          : k + 1 < pieces.length
            ? nextOn[k + 1]
            : undefined;
    }
    for (let k = 0; k + 1 < pieces.length; k++) {
      const last = pieces[k][pieces[k].length - 1];
      const first = pieces[k + 1][0];
      if (onReferenceWalk.has(last) || onReferenceWalk.has(first)) continue;
      if (elsewhereAt.has(last) || elsewhereAt.has(first)) continue;
      if (!level.has(last) || !level.has(first)) continue;
      const leaves = lastOn[k];
      const rejoins = nextOn[k + 1];
      if (leaves === undefined || rejoins === undefined) continue;
      if (leaves >= rejoins) continue;
      layoutEdges.push({ from: last, to: first });
    }
  }

  const successors = new Map<string, string[]>();
  const waiting = new Map<string, number>();
  for (const edge of layoutEdges) {
    if (!level.has(edge.from) || !level.has(edge.to)) continue;
    const out = successors.get(edge.from);
    if (out) out.push(edge.to);
    else successors.set(edge.from, [edge.to]);
    waiting.set(edge.to, (waiting.get(edge.to) ?? 0) + 1);
  }
  const ordered: string[] = ids.filter((id) => !waiting.has(id));
  for (let at = 0; at < ordered.length; at++) {
    for (const next of successors.get(ordered[at]) ?? []) {
      const left = waiting.get(next)! - 1;
      waiting.set(next, left);
      if (left === 0) ordered.push(next);
    }
  }
  const acyclic = ordered.length === ids.length;

  for (let round = 0; round < 8; round++) {
    let movedThisRound = false;

    if (acyclic) {
      for (const id of ordered) {
        const from = level.get(id)!;
        for (const next of successors.get(id) ?? []) {
          if (level.get(next)! < from + 1) {
            level.set(next, from + 1);
            movedThisRound = true;
          }
        }
      }
    } else {
      for (let pass = 0; pass < ids.length; pass++) {
        let changed = false;
        for (const edge of layoutEdges) {
          const from = level.get(edge.from);
          const to = level.get(edge.to);
          if (from === undefined || to === undefined) continue;
          if (to < from + 1) {
            level.set(edge.to, from + 1);
            changed = true;
          }
        }
        if (!changed) break;
        movedThisRound = true;
      }
    }

    for (let i = 1; i < referenceOrder.length; i++) {
      const previous = level.get(referenceOrder[i - 1]);
      const current = level.get(referenceOrder[i]);
      if (previous === undefined || current === undefined) continue;
      if (current <= previous) {
        level.set(referenceOrder[i], previous + 1);
        movedThisRound = true;
      }
    }

    if (!movedThisRound) break;
  }

  /* A node nothing on the reference leads to - a haplotype coming into the
     window off the reference, its way in outside it - is tied only to
     where it joins. Laid out as late as that allows, so it sits against
     the node it joins rather than wherever its own predecessors would have
     started it, which is nowhere: column 0. A node leaving the window off
     the reference needs nothing of the kind - the longest path already
     puts it just past where it leaves. */
  const reached = new Set<string>();
  const reach = [...onReferenceWalk].filter((id) => level.has(id));
  for (const id of reach) reached.add(id);
  while (reach.length) {
    for (const next of successors.get(reach.pop()!) ?? []) {
      if (reached.has(next)) continue;
      reached.add(next);
      reach.push(next);
    }
  }
  /* And what leads to the reference: with what it leads from, what is
     tied to it at all. A node tied to neither has no place against it in
     what was fetched - in a small window, HG002#1 at chr6:32,365,590 had a
     piece of itself from 180 kb on, joined only to its own nodes, which
     the longest path started at the window's left edge. */
  const leadsTo = new Set<string>();
  {
    const into = new Map<string, string[]>();
    for (const [from, nexts] of successors) {
      for (const to of nexts) {
        const list = into.get(to);
        if (list) list.push(from);
        else into.set(to, [from]);
      }
    }
    const back = [...onReferenceWalk].filter((id) => level.has(id));
    for (const id of back) leadsTo.add(id);
    while (back.length) {
      for (const from of into.get(back.pop()!) ?? []) {
        if (leadsTo.has(from)) continue;
        leadsTo.add(from);
        back.push(from);
      }
    }
  }
  const pullUp = (id: string) => {
    if (reached.has(id)) return false;
    const next = successors.get(id);
    if (!next?.length) return false;
    const latest = Math.min(...next.map((other) => level.get(other)!)) - 1;
    if (latest <= level.get(id)!) return false;
    level.set(id, latest);
    return true;
  };
  if (acyclic) {
    for (let at = ordered.length - 1; at >= 0; at--) pullUp(ordered[at]);
  } else {
    for (let pass = 0; pass < ids.length; pass++) {
      let changed = false;
      for (const id of ids) changed = pullUp(id) || changed;
      if (!changed) break;
    }
  }

  const byLevel = new Map<number, string[]>();
  ids.forEach((id) => {
    const lv = level.get(id) ?? 0;
    const bucket = byLevel.get(lv);
    if (bucket) bucket.push(id);
    else byLevel.set(lv, [id]);
  });

  const refNodes = reference?.nodeSet ?? new Set<string>();

  /* The reference always takes row 0 and every alternative hangs below it.
     That is what lets a haplotype following the reference run dead straight:
     it never changes row, so it never has to curve. Ordering by traffic
     instead would keep the rows shallower, but it lets the reference itself
     get bumped down wherever it is the minority allele, and then the spine of
     the picture wanders. Alternatives are ranked by traffic among themselves. */
  const byRow = (a: string, b: string) => {
    const aRef = refNodes.has(a);
    const bRef = refNodes.has(b);
    if (aRef !== bRef) return aRef ? -1 : 1;
    const d = (laneKeys.get(b)?.length ?? 0) - (laneKeys.get(a)?.length ?? 0);
    if (d !== 0) return d;
    return numericCompare(a, b);
  };

  const columns: Column[] = [];
  const nodeById = new Map<string, GraphNode>();
  let rowCount = 1;

  /* Reference coordinates advance only where the reference actually walks, so
     a column it skips is an insertion point and keeps the running position.

     Counted from the reference's longest piece, not its first. The reference
     can come back in more than one piece, and one can be a stray copy of a
     stretch from far away - in the MHC, 80 bp of CHM13 from 51 kb before
     the window, which it has twice. Counting on from that one put every
     base of the window 51 kb out. The longest is the window itself, so the
     count is set to agree with its own start where it begins. */
  const levels = Array.from(byLevel.keys()).sort((a, b) => a - b);
  const main = longestPiece(reference);
  let referenceOrigin =
    reference?.segments.find((s) => s.start !== null)?.start ?? 0;
  if (main && main.start !== null && main.nodes.length) {
    const mainLevel = level.get(main.nodes[0]);
    let before = 0;
    for (const lv of levels) {
      if (lv === mainLevel) break;
      const onRef = (byLevel.get(lv) ?? []).find((id) => refNodes.has(id));
      if (onRef) before += (sequences.get(onRef) ?? "").length;
    }
    referenceOrigin = main.start - before;
  }
  let cursor = referenceOrigin;

  /* ── Where each node starts, in bases ────────────────────────────────
     Each node on its own: where the latest of what leads into it ends, and
     the reference's walk in order. A column used to give all its nodes one
     start, as wide as its widest node, and an allele standing in for more
     than one reference node could not then lie over them. In the MHC, TG in
     place of the reference's A, A - two nodes, since other haplotypes read
     C, A - took the first A's column 2 bp wide and left a base of nothing
     in the reference and in every bar reading C. Starting columns by bases
     fixed that one but not two alleles a step apart that start at
     different bases: at chr6:32,357,609 on the HPRC graph X stands in for
     B, the reference's 1 bp after P, and Z for P's second base, after Y -
     one column, so Z started where P ended, a base late, and pushed B on.
     Placed node by node, X lies over B and Z over P's second base, and the
     reference moves on only where an allele is longer than what it stands
     in for - the room an insertion takes. Columns stay, for what is an
     alternative to what: sites, the strip's rows, the tube map. */
  const predecessors = new Map<string, string[]>();
  for (const [from, nexts] of successors) {
    for (const to of nexts) {
      const into = predecessors.get(to);
      if (into) into.push(from);
      else predecessors.set(to, [from]);
    }
  }
  const referencePrevious = new Map<string, string>();
  for (let i = 1; i < referenceOrder.length; i++) {
    if (!referencePrevious.has(referenceOrder[i])) {
      referencePrevious.set(referenceOrder[i], referenceOrder[i - 1]);
    }
  }
  /* A node of no sequence still takes a base, as a column did. */
  const roomOf = (id: string) => Math.max(1, (sequences.get(id) ?? "").length);
  const startOf = new Map<string, number>();
  /* In column order, which is an order every edge runs forward in - in a
     cyclic subgraph too, where an edge back is one the levels could not
     honour, and is left out here as well. */
  for (const lv of levels) {
    for (const id of byLevel.get(lv) ?? []) {
      let at = 0;
      for (const from of predecessors.get(id) ?? []) {
        if ((level.get(from) ?? 0) >= lv) continue;
        at = Math.max(at, (startOf.get(from) ?? 0) + roomOf(from));
      }
      const previous = referencePrevious.get(id);
      if (previous !== undefined && (level.get(previous) ?? 0) < lv) {
        at = Math.max(at, (startOf.get(previous) ?? 0) + roomOf(previous));
      }
      startOf.set(id, at);
    }
  }
  /* What nothing on the reference leads to, as late as where it joins
     allows - as its column was pulled up, and for the same reason. */
  for (let at = levels.length - 1; at >= 0; at--) {
    for (const id of byLevel.get(levels[at]) ?? []) {
      if (reached.has(id)) continue;
      let latest = Infinity;
      for (const next of successors.get(id) ?? []) {
        if ((level.get(next) ?? 0) <= levels[at]) continue;
        latest = Math.min(latest, (startOf.get(next) ?? 0) - roomOf(id));
      }
      if (latest !== Infinity && latest > startOf.get(id)!)
        startOf.set(id, latest);
    }
  }
  let totalBp = 0;
  for (const [id, start] of startOf)
    totalBp = Math.max(totalBp, start + roomOf(id));

  levels.forEach((lv, columnIndex) => {
    const nodeIds = (byLevel.get(lv) ?? []).sort(byRow);
    /* A column is as far as its nodes reach. */
    const x = Math.min(...nodeIds.map((id) => startOf.get(id) ?? 0));
    const width =
      Math.max(...nodeIds.map((id) => (startOf.get(id) ?? 0) + roomOf(id))) - x;

    const onRef = nodeIds.find((id) => refNodes.has(id));
    const refStart = cursor;
    const refEnd = onRef
      ? cursor + (sequences.get(onRef) ?? "").length
      : cursor;
    cursor = refEnd;

    /* Row 0 belongs to the reference and to nothing else. Where the
         reference walks straight past a site - an insertion, which it has no
         allele for - the alternatives would otherwise take row 0 and be drawn
         level with the reference elsewhere. Pushing them down by one keeps the
         rule true everywhere: anything below row 0 is an alternative, and an
         alternative is always below the reference. */
    const indent = onRef ? 0 : 1;

    nodeIds.forEach((id, position) => {
      const sequence = sequences.get(id) ?? "";
      nodeById.set(id, {
        id,
        sequence,
        length: sequence.length,
        column: columnIndex,
        x: startOf.get(id) ?? x,
        row: position + indent,
        lanes: laneKeys.get(id) ?? [],
        onReference: refNodes.has(id),
        refStart,
        refEnd,
        ...(reached.has(id) || leadsTo.has(id) ? {} : { untied: true }),
        ...(elsewhereAt.has(id) ? { elsewhere: elsewhereAt.get(id) } : {}),
      });
    });
    rowCount = Math.max(rowCount, nodeIds.length + indent);
    columns.push({ index: columnIndex, x, width, nodeIds });
  });

  const referenceInterval = reference
    ? {
        start: referenceOrigin,
        end: cursor,
      }
    : null;

  for (const lane of lanes) {
    if (!lane.isReference) lane.deletions = laneDeletions(lane, nodeById);
  }

  return {
    nodes: ids.map((id) => nodeById.get(id)!).filter(Boolean),
    nodeById,
    columns,
    lanes,
    edges,
    reference,
    totalBp,
    rowCount,
    referenceInterval,
    carriers: result?.carriers,
  };
}

/**
 * The model without the nodes that have no place against the reference in
 * this band - the untied ones, among them those the reference's own path
 * reads outside it: what the tube map and the variants view are drawn
 * from. The bars leave such nodes out as they draw (see laneRaster); these
 * views lay out every node they are given, so they are given only the
 * placed ones. Left in, the tube map gave them boxes at the band's left
 * edge and ran a haplotype's tube back across the band to them, and the
 * variants view made a site of them there.
 *
 * A haplotype's walk is cut where it went through one, as where it leaves
 * the window, so nothing is joined across it; its deletions are carried
 * over to the steps that are left.
 */
const placedByModel = new WeakMap<PangenomeModel, PangenomeModel>();
export function placedModel(model: PangenomeModel): PangenomeModel {
  const known = placedByModel.get(model);
  if (known) return known;
  if (!model.nodes.some((node) => node.untied)) {
    placedByModel.set(model, model);
    return model;
  }
  /* The columns that still hold a node, numbered again, each as far as its
     nodes reach. */
  const nodeById = new Map<string, GraphNode>();
  const columns: Column[] = [];
  for (const column of model.columns) {
    const nodes = column.nodeIds
      .map((id) => model.nodeById.get(id))
      .filter((node): node is GraphNode => !!node && !node.untied);
    if (!nodes.length) continue;
    const index = columns.length;
    for (const node of nodes) nodeById.set(node.id, { ...node, column: index });
    const x = Math.min(...nodes.map((node) => node.x));
    columns.push({
      ...column,
      index,
      x,
      width: Math.max(...nodes.map((node) => node.x + node.length)) - x,
      nodeIds: nodes.map((node) => node.id),
    });
  }
  const lanes = model.lanes.map((lane): Lane => {
    if (lane.steps.every((step) => nodeById.has(step.node))) return lane;
    const steps: LaneStep[] = [];
    /* Where each step that is left went, for the deletions. */
    const moved = new Map<number, number>();
    let piece = -1;
    let walk = -1;
    let cut = true;
    lane.steps.forEach((step, i) => {
      if (!nodeById.has(step.node)) {
        cut = true;
        return;
      }
      if (cut || step.segment !== walk) piece += 1;
      cut = false;
      walk = step.segment;
      moved.set(i, steps.length);
      steps.push({ ...step, segment: piece });
    });
    const segments: LaneSegment[] = [];
    for (const step of steps) {
      const at = segments[step.segment];
      if (at) {
        at.nodes.push(step.node);
        at.end = step.end;
      } else {
        segments[step.segment] = {
          nodes: [step.node],
          start: step.start,
          end: step.end,
        };
      }
    }
    const order = steps.map((step) => step.node);
    const nodeSet = new Set(order);
    let bp = 0;
    nodeSet.forEach((id) => {
      bp += nodeById.get(id)?.length ?? 0;
    });
    return {
      ...lane,
      segments,
      order,
      steps,
      nodeSet,
      bp,
      interval: steps.length
        ? { start: steps[0].start, end: steps[steps.length - 1].end }
        : null,
      deletions: lane.deletions?.flatMap((deletion) => {
        const step = moved.get(deletion.step);
        return step === undefined ? [] : [{ ...deletion, step }];
      }),
    };
  });
  const out: PangenomeModel = {
    ...model,
    nodes: model.nodes.flatMap((node) => {
      const kept = nodeById.get(node.id);
      return kept ? [kept] : [];
    }),
    nodeById,
    columns,
    lanes,
    edges: model.edges.filter(
      (edge) => nodeById.has(edge.from) && nodeById.has(edge.to),
    ),
    reference: lanes.find((lane) => lane.isReference) ?? null,
  };
  placedByModel.set(model, out);
  return out;
}

/**
 * The same layout with every column as wide as its widest node, and every
 * node at its column's start: what the tube map is drawn from. A tube map is
 * a column at a time - a stack of boxes, and the tubes moving between one
 * column and the next - so a node there stays in its own column rather
 * than running on over the next, as it does in the linear view. Of the
 * placed nodes only; see placedModel. The lanes' deletions keep their
 * steps, but their `left` and `right` are the linear view's.
 */
const columnar = new WeakMap<PangenomeModel, PangenomeModel>();
export function columnarModel(model: PangenomeModel): PangenomeModel {
  const known = columnar.get(model);
  if (known) return known;
  const base = placedModel(model);
  let x = 0;
  const nodeById = new Map<string, GraphNode>();
  const columns: Column[] = base.columns.map((column) => {
    const width = Math.max(
      1,
      ...column.nodeIds.map((id) => base.nodeById.get(id)?.length ?? 0),
    );
    for (const id of column.nodeIds) {
      const node = base.nodeById.get(id);
      if (node) nodeById.set(id, { ...node, x });
    }
    const at = { ...column, x, width };
    x += width;
    return at;
  });
  const out: PangenomeModel = {
    ...base,
    nodes: base.nodes.map((node) => nodeById.get(node.id) ?? node),
    nodeById,
    columns,
    totalBp: x,
  };
  columnar.set(model, out);
  return out;
}

/** How a band converts between the reference and its own pixels. */
export interface BandAxis {
  /** Pixels per unit of layout. */
  scale: number;
  /** The place along the layout drawn at x = 0. */
  originX: number;
  /** Where a place along the layout is drawn. */
  px: (graphX: number) => number;
  /** Where a reference coordinate is drawn. */
  pxAtBp: (bp: number) => number | null;
  /** Which coordinate is drawn at a pixel of this band. */
  bpAtPx: (atPx: number) => number | null;
}

/**
 * Fit a band to the window it has to show.
 *
 * The window keeps the pixels it was given and the region it was asked
 * for, and between them those fix the scale; the runway either side is
 * drawn at the same scale and comes out however wide its own sites need.
 *
 * Lifted out of the drawing because the pan needs it too: two
 * neighbouring bands do not agree on how many pixels a base is worth, so
 * crossing from one to the other means asking each of them separately.
 *
 * Null when the window's bases are not in this graph, which leaves the
 * drawing to lay itself out.
 */
export function bandAxis(
  model: PangenomeModel,
  frame: DrawFrame | undefined,
): BandAxis | null {
  if (!frame) return null;
  const bandBp = frame.endBp - frame.startBp;
  if (!(bandBp > 0) || !(frame.width > 0)) return null;

  const anchors = referenceTicks(model);
  if (anchors.length < 2) return null;

  /* The band is three equal windows of the reference, so a slice of its
     pixels is the same slice of its bases. */
  const bpAtBandPx = (atPx: number) =>
    frame.startBp + (atPx / frame.width) * bandBp;

  const viewFrom = graphXAtBp(anchors, bpAtBandPx(frame.viewFromPx));
  const viewTo = graphXAtBp(anchors, bpAtBandPx(frame.viewToPx));
  if (viewFrom === null || viewTo === null || viewTo <= viewFrom) {
    return null;
  }

  const scale = (frame.viewToPx - frame.viewFromPx) / (viewTo - viewFrom);
  /* Put the window's first base at the window's own left edge. */
  const originX = viewFrom - frame.viewFromPx / scale;
  const px = (graphX: number) => (graphX - originX) * scale;

  return {
    scale,
    originX,
    px,
    pxAtBp: (bp) => {
      const at = graphXAtBp(anchors, bp);
      return at === null ? null : px(at);
    },
    bpAtPx: (atPx) => bpAtGraphX(anchors, originX + atPx / scale),
  };
}

/**
 * Maps linearized offsets back to haplotype coordinates along the reference
 * walk, so the ruler can be labelled with real positions. Only the reference
 * contributes ticks; a column it skips has no coordinate to show.
 */
/**
 * Where a reference coordinate falls along the layout.
 *
 * The two are not the same measure. A column is as wide as its widest
 * allele, so a site where a haplotype carries more sequence than the
 * reference takes room the reference spends no coordinate on, and the
 * layout runs ahead. Only the reference's own walk says where a
 * coordinate really is, and `referenceTicks` is that walk.
 *
 * Inside one reference node a base is a unit of layout, so a position
 * within it is that node's offset plus the remainder - which is what
 * finds the node a coordinate lands in as well as where in it. Null when
 * the coordinate is off the front of what was extracted.
 */
/**
 * Which coordinate is drawn at a place along the layout - the other
 * direction, and the one a pan offset needs.
 *
 * Inside a reference node a base is a unit of layout, so the two advance
 * together. Past the end of one they do not: the rest of that column is
 * room for a longer allele some haplotype carries, and the reference
 * spends no coordinate crossing it, so the map is flat there. An offset
 * landing in one of those comes back as the coordinate at its near edge.
 */
export function bpAtGraphX(
  anchors: Array<{ x: number; bp: number }>,
  graphX: number,
): number | null {
  if (!anchors.length) return null;
  /* Before the reference's first node, and after its last, there is
     nothing to say otherwise, so they run together. */
  if (graphX <= anchors[0].x) return anchors[0].bp + (graphX - anchors[0].x);
  let lo = 0;
  let hi = anchors.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (anchors[mid].x <= graphX) lo = mid;
    else hi = mid - 1;
  }
  const anchor = anchors[lo];
  const next = anchors[lo + 1];
  const advance = next ? next.bp - anchor.bp : Infinity;
  return anchor.bp + Math.min(graphX - anchor.x, advance);
}

export function graphXAtBp(
  anchors: Array<{ x: number; bp: number }>,
  bp: number,
): number | null {
  if (!anchors.length || bp < anchors[0].bp) return null;
  let lo = 0;
  let hi = anchors.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (anchors[mid].bp <= bp) lo = mid;
    else hi = mid - 1;
  }
  return anchors[lo].x + (bp - anchors[lo].bp);
}

export function referenceTicks(
  model: PangenomeModel,
): Array<{ x: number; bp: number }> {
  const known = ticksByModel.get(model);
  if (known) return known;
  const ref = model.reference;
  if (!ref) return [];

  /* Each piece of the reference at its own coordinates, rather than one
     count running on from the first: the reference can come back in pieces,
     and one can be a stray copy from far away (see `buildModel`). Where
     pieces disagree - a copy laid over the same place as the window but
     with coordinates 51 kb off - the longest wins, and a piece is kept only
     where it runs the same way as those already kept, so the anchors go up
     together in both the layout and the coordinate. */
  const pieces = new Map<number, Array<{ x: number; bp: number }>>();
  for (const step of ref.steps) {
    const node = model.nodeById.get(step.node);
    if (!node) continue;
    let piece = pieces.get(step.segment);
    if (!piece) pieces.set(step.segment, (piece = []));
    piece.push({ x: node.x, bp: step.start });
  }
  const spans = [...pieces.values()]
    .filter((ticks) => ticks.length)
    .map((ticks) => ({
      ticks,
      x0: Math.min(...ticks.map((t) => t.x)),
      x1: Math.max(...ticks.map((t) => t.x)),
      bp0: Math.min(...ticks.map((t) => t.bp)),
      bp1: Math.max(...ticks.map((t) => t.bp)),
    }))
    .sort((a, b) => b.bp1 - b.bp0 - (a.bp1 - a.bp0));
  const kept: typeof spans = [];
  for (const span of spans) {
    const fits = kept.every(
      (other) =>
        (span.bp1 < other.bp0 && span.x1 < other.x0) ||
        (span.bp0 > other.bp1 && span.x0 > other.x1),
    );
    if (fits) kept.push(span);
  }

  /* In coordinate order, and only while the layout moves on with it: a node
     the reference walks twice in a piece would otherwise send it back. */
  const ticks: Array<{ x: number; bp: number }> = [];
  for (const tick of kept
    .flatMap((span) => span.ticks)
    .sort((a, b) => a.bp - b.bp || a.x - b.x)) {
    const last = ticks[ticks.length - 1];
    if (last && (tick.x < last.x || tick.bp <= last.bp)) continue;
    ticks.push(tick);
  }
  ticksByModel.set(model, ticks);
  return ticks;
}
/* A model never changes once built, and the ruler and every axis ask. */
const ticksByModel = new WeakMap<
  PangenomeModel,
  Array<{ x: number; bp: number }>
>();

/** The reference's longest piece with coordinates, by bases. */
function longestPiece(lane: Lane | null): LaneSegment | null {
  let best: LaneSegment | null = null;
  for (const piece of lane?.segments ?? []) {
    if (piece.start === null || piece.end === null) continue;
    if (!best || piece.end - piece.start > best.end! - best.start!)
      best = piece;
  }
  return best;
}
