import type { BandAxis, PangenomeModel } from "./pangenomeModel";

/* ══════════════════════════════════════════════════════════════════════════
   The variants view: each site drawn once, as its unique walks.

   A window of the MHC across hundreds of haplotypes is thousands of
   one-base bubbles, and drawing every haplotype through every one of them is
   hundreds of thousands of lines that all say "most people have the
   reference here". What a reader wants from a site is how many different
   ways through it there are and how common each is.

   So the window is cut into stretches nobody diverges in and the sites
   between them. At each site every haplotype's walk through it is a key -
   the nodes it takes, in order - and haplotypes with the same key are one
   unique walk: drawn as one circle, as wide as the site and bigger the more
   haplotypes take it. The stretches between sites are drawn as a short line,
   much shorter than their length, since they are what everyone shares.

   How long a shared stretch has to be to separate two sites decides how
   much is one site. At 1 bp every bubble is its own, with a walk or two
   each; past that, neighbouring bubbles are taken together, and their
   combinations are the walks. Auto picks the shortest that leaves each site
   room to be drawn at the zoom.
   ══════════════════════════════════════════════════════════════════════════ */

/** One way through a site, and the haplotypes that take it. */
export interface VariantWalk {
  /** 1-based, most common first. */
  index: number;
  nodes: string[];
  lanes: string[];
  sequence: string;
  /** The reference's own walk through the site. */
  isReference: boolean;
  /** Spells the same bases as another walk here, through other nodes. */
  sameSpelling: boolean;
  /** Where along the layout it is drawn: its whole site, as every other
      walk there is, since they are alternatives for one place. Its width
      says nothing about its length - `label` and `fill` do. */
  x0: number;
  x1: number;
  /** Its length, and how it differs from the reference's allele here. */
  label: string;
  /** How much of its range its own bases would fill, 0 to 1: drawn as an
      inner part of its bubble or box, since the width is the range. */
  fill: number;
}

export interface VariantSegment {
  kind: "same" | "site";
  fromColumn: number;
  toColumn: number;
  /** In layout units, as the model's columns are. */
  x0: number;
  x1: number;
  refStart: number;
  refEnd: number;
  /** Most common first; empty for a shared stretch. */
  walks: VariantWalk[];
  /** How many walks spell the same bases as another, through other nodes. */
  sameSpelling: number;
  /** How many haplotypes pass through the site at all. */
  haplotypes: number;
}

/** A length for a label: "12 bp", "1.2 kb". */
export function bpLabel(bp: number): string {
  if (bp < 1000) return `${bp} bp`;
  if (bp < 1_000_000) return `${(bp / 1000).toFixed(bp < 10_000 ? 1 : 0)} kb`;
  return `${(bp / 1_000_000).toFixed(1)} Mb`;
}

/** A walk's length, and how far it is from the reference's allele there:
    "12 bp +9", "1 bp −4", or just "1 bp" when the two are as long. */
function walkLabel(bp: number, referenceBp: number): string {
  const delta = bp - referenceBp;
  if (delta === 0) return bpLabel(bp);
  return `${bpLabel(bp)} ${delta > 0 ? "+" : "−"}${Math.abs(delta).toLocaleString()}`;
}

/** Shared stretches tried by auto, shortest first: 1 is every bubble alone. */
const AUTO_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
/** The least room, in pixels of the band, auto leaves each site. */
const SITE_PX = 28;

/**
 * Each step of a walk that jumps over columns: from the column of one node
 * to a later one, within one of the walk's pieces, with columns between.
 * That is a deletion - the haplotype going straight past what is there. A
 * walk that leaves the window and comes back is two pieces, and the columns
 * it is away for are not jumped: it says nothing about them.
 */
/** The longest deletion that is a site of its own, in bases jumped. A
    longer one would make one site of everything it passes over - in the
    MHC a single haplotype's long deletion swallowed the whole window - so
    its haplotypes' lines are drawn over the sites it skips instead. */
const SITE_JUMP_BP = 50;

function eachJump(
  model: PangenomeModel,
  visit: (lane: string, from: number, to: number) => void,
) {
  for (const lane of model.lanes) {
    const steps = lane.steps;
    for (let i = 0; i + 1 < steps.length; i++) {
      if (steps[i].segment !== steps[i + 1].segment) continue;
      const node = model.nodeById.get(steps[i].node);
      const next = model.nodeById.get(steps[i + 1].node);
      const from = node?.column;
      const to = next?.column;
      if (!node || !next || from === undefined || to === undefined || to - from < 2) continue;
      /* From where the one node ends to where the next starts: nodes start
         where each is led to, not at their column's start. */
      const bp = next.x - (node.x + node.length);
      if (bp > SITE_JUMP_BP) continue;
      visit(lane.key, from, to);
    }
  }
}

/**
 * Columns nobody diverges in: one node there at most carries anyone, and
 * nobody jumps over it. Without the second, a deletion - the reference's
 * node, and haplotypes stepping straight past it - looked shared, since only
 * the one node carries anybody.
 */
function sharedColumns(model: PangenomeModel): boolean[] {
  /* How many jumps pass over each column, by a running sum. */
  const jumped = new Int32Array(model.columns.length + 1);
  eachJump(model, (_, from, to) => {
    jumped[from + 1] += 1;
    jumped[to] -= 1;
  });
  let running = 0;
  return model.columns.map((column, c) => {
    running += jumped[c];
    if (running > 0) return false;
    let carriers = 0;
    for (const id of column.nodeIds) {
      if ((model.nodeById.get(id)?.lanes.length ?? 0) > 0) carriers += 1;
    }
    return carriers <= 1;
  });
}

/** The column ranges of the sites, given how long a shared stretch has to be
    to separate two of them. */
function siteRanges(
  model: PangenomeModel,
  shared: boolean[],
  minBp: number,
): Array<[number, number]> {
  const { columns } = model;
  const separates = new Array<boolean>(columns.length).fill(false);
  for (let i = 0; i < columns.length; ) {
    if (!shared[i]) {
      i += 1;
      continue;
    }
    let j = i;
    while (j + 1 < columns.length && shared[j + 1]) j += 1;
    if (columns[j].x + columns[j].width - columns[i].x >= minBp) {
      for (let k = i; k <= j; k++) separates[k] = true;
    }
    i = j + 1;
  }
  const ranges: Array<[number, number]> = [];
  for (let i = 0; i < columns.length; ) {
    if (separates[i]) {
      i += 1;
      continue;
    }
    let j = i;
    while (j + 1 < columns.length && !separates[j + 1]) j += 1;
    ranges.push([i, j]);
    i = j + 1;
  }
  return ranges;
}

/**
 * The shortest shared stretch that separates sites, for `grouping`: 0 is
 * auto - the shortest of `AUTO_STEPS` leaving no more sites than the band
 * has room for at `SITE_PX` each.
 */
export function separatorBp(
  model: PangenomeModel,
  grouping: number,
  bandPx: number,
): number {
  if (grouping > 0) return grouping;
  const shared = sharedColumns(model);
  const room = Math.max(1, Math.floor(bandPx / SITE_PX));
  for (const step of AUTO_STEPS) {
    if (siteRanges(model, shared, step).length <= room) return step;
  }
  return AUTO_STEPS[AUTO_STEPS.length - 1];
}

/** The window as shared stretches and sites, in order along the layout. */
export function variantSegments(
  model: PangenomeModel,
  minBp: number,
): VariantSegment[] {
  const { columns } = model;
  if (!columns.length) return [];
  const shared = sharedColumns(model);
  const ranges = siteRanges(model, shared, minBp);

  const siteOf = (column: number) =>
    model.nodeById.get(columns[column].nodeIds[0]);
  const make = (
    kind: VariantSegment["kind"],
    from: number,
    to: number,
  ): VariantSegment => ({
    kind,
    fromColumn: from,
    toColumn: to,
    /* As far as any of its columns reaches, either way: a column's nodes
       start where each is led to. */
    x0: Math.min(...columns.slice(from, to + 1).map((column) => column.x)),
    x1: Math.max(
      ...columns.slice(from, to + 1).map((column) => column.x + column.width),
    ),
    refStart: siteOf(from)?.refStart ?? 0,
    refEnd: siteOf(to)?.refEnd ?? 0,
    walks: [],
    sameSpelling: 0,
    haplotypes: 0,
  });

  /* Sites and the shared stretches between them, covering every column. */
  const segments: VariantSegment[] = [];
  const segmentOfColumn = new Int32Array(columns.length).fill(-1);
  let next = 0;
  for (const [from, to] of ranges) {
    if (from > next) segments.push(make("same", next, from - 1));
    for (let c = from; c <= to; c++) segmentOfColumn[c] = segments.length;
    segments.push(make("site", from, to));
    next = to + 1;
  }
  if (next < columns.length) {
    segments.push(make("same", next, columns.length - 1));
  }

  /* Every haplotype's walk through every site, in one pass over its steps. */
  const keys = segments.map(() => new Map<string, string[]>());
  const walkNodes = new Map<string, string[]>();
  /* Sites a haplotype jumps clean over - a deletion, which is a walk of its
     own: the empty one. */
  const skipped = new Map<string, Set<number>>();
  eachJump(model, (lane, from, to) => {
    for (let c = from + 1; c < to; c++) {
      const at = segmentOfColumn[c];
      if (at < 0) continue;
      const segment = segments[at];
      if (segment.fromColumn <= from || segment.toColumn >= to) continue;
      let sites = skipped.get(lane);
      if (!sites) skipped.set(lane, (sites = new Set()));
      sites.add(at);
      c = segment.toColumn;
    }
  });

  for (const lane of model.lanes) {
    const through = new Map<number, string[]>();
    for (const id of lane.order) {
      const node = model.nodeById.get(id);
      if (!node) continue;
      const at = segmentOfColumn[node.column];
      if (at < 0) continue;
      const walk = through.get(at);
      if (walk) walk.push(id);
      else through.set(at, [id]);
    }
    for (const at of skipped.get(lane.key) ?? []) {
      if (!through.has(at)) through.set(at, []);
    }
    for (const [at, walk] of through) {
      const key = walk.join(",");
      const lanes = keys[at].get(key);
      if (lanes) lanes.push(lane.key);
      else {
        keys[at].set(key, [lane.key]);
        walkNodes.set(key, walk);
      }
    }
  }

  const referenceKey = model.reference?.key;
  const walkBases = (nodes: string[]) =>
    nodes.reduce((sum, id) => sum + (model.nodeById.get(id)?.length ?? 0), 0);
  segments.forEach((segment, at) => {
    if (segment.kind !== "site") return;
    const walks = [...keys[at]].map(([key, lanes]) => {
      const nodes = walkNodes.get(key)!;
      /* Every walk of a site across all of it: they are alternatives for
         the same place, so they are as wide as each other, and how much of
         it a walk's own bases make up is its fill. */
      const x0 = segment.x0;
      const x1 = segment.x1;
      return {
        index: 0,
        x0,
        x1,
        label: "",
        fill: x1 > x0 ? Math.min(1, walkBases(nodes) / (x1 - x0)) : 0,
        nodes,
        lanes,
        sequence: nodes
          .map((id) => model.nodeById.get(id)?.sequence ?? "")
          .join(""),
        isReference: referenceKey !== undefined && lanes.includes(referenceKey),
        sameSpelling: false,
      };
    });
    /* Ties by the nodes they take, which are the graph's: by the order the
       haplotypes' walks arrived in, the same site numbered its walks one
       way loaded there and another panned to. */
    const path = (walk: { nodes: string[] }) => walk.nodes.join(">");
    walks.sort(
      (a, b) =>
        b.lanes.length - a.lanes.length ||
        (path(a) < path(b) ? -1 : path(a) > path(b) ? 1 : 0),
    );
    const spellings = new Map<string, number>();
    for (const walk of walks) {
      spellings.set(walk.sequence, (spellings.get(walk.sequence) ?? 0) + 1);
    }
    /* The reference's allele here: its own walk, or the bases it spans. */
    const referenceLength =
      walks.find((walk) => walk.isReference)?.sequence.length ??
      Math.max(0, segment.refEnd - segment.refStart);
    walks.forEach((walk, i) => {
      walk.index = i + 1;
      walk.sameSpelling = (spellings.get(walk.sequence) ?? 0) > 1;
      walk.label = walkLabel(walk.sequence.length, referenceLength);
    });
    segment.walks = walks;
    segment.sameSpelling = walks.filter((walk) => walk.sameSpelling).length;
    segment.haplotypes = walks.reduce((sum, walk) => sum + walk.lanes.length, 0);
  });
  return segments;
}

/** A walk's bubble, in the band's pixels: as wide as its site, and as tall
    as it is common. A site narrow enough makes it a circle. */
export interface WalkCircle {
  segment: number;
  walk: VariantWalk;
  cx: number;
  cy: number;
  /** Half its height. */
  r: number;
  /** Half its width. */
  rx: number;
}

export interface VariantLayout {
  circles: WalkCircle[];
  /** Sites whose walks did not all fit, and how many are left out. */
  more: Array<{ segment: number; cx: number; y: number; count: number }>;
  /** Haplotypes going from one walk at a site to one at the next: a line
      each, as thick as how many of them do. */
  links: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    haplotypes: number;
    width: number;
    /** Which walk at the first site it leaves, for its colour. */
    from: number;
    /** Goes over sites between, past a long deletion. */
    skips: boolean;
  }>;
  /** Where the most common walks sit, and the shared stretches with them. */
  spineY: number;
  height: number;
}

/** The most walks a site stacks before saying how many more there are. */
export const MAX_STACK = 5;
/** Room between stacked bubbles, for the lines leaving them and the length
    written under each. */
const GAP = 18;
/** The thickest a line between two walks is drawn, in pixels. */
const LINK_MAX = 8;
const MIN_R = 3;
/** The narrowest a bubble is drawn, so one over a single base still shows. */
const MIN_WIDTH = 3;
const MAX_R = 22;
/** A strip for the shared stretches' dashes, then the bubbles. No ruler:
    eg3's ruler track draws the coordinates. */
export const VARIANT_SAME_Y = 14;
export const VARIANT_TOP = 28;
const FOOT = 22;

/**
 * Where every circle goes. A site's walks are stacked down from the line
 * through the window, most common on it; each is as wide as the site has
 * room for and shrinks with how few haplotypes take it.
 */
export function variantLayout(
  segments: VariantSegment[],
  axis: BandAxis,
): VariantLayout {
  /* Where a walk's own nodes are drawn, wherever that is: a walk starting a
     base before the window starts a base before its edge, and one starting
     part way into its site starts there. */
  const spanOf = (walk: VariantWalk) => ({
    left: axis.px(walk.x0),
    right: axis.px(walk.x1),
  });
  const sites = segments
    .map((segment, i) => ({ segment, i }))
    .filter(({ segment }) => segment.kind === "site");
  /* Half its width: its range on screen and nothing else - not how many
     take it - so two walks over the same place are as wide as each other. */
  const roomOf = (walk: VariantWalk) => {
    const { left, right } = spanOf(walk);
    return Math.max(MIN_WIDTH / 2, (right - left) / 2 - 0.5);
  };
  /* How tall: as common as it is, within what its site has room for - the
     site's width rather than the walk's, so a walk over one base of a wide
     site is not drawn as a speck. */
  const radiusOf = (segment: VariantSegment, walk: VariantWalk) => {
    const share = walk.lanes.length / Math.max(1, segment.haplotypes);
    const room = Math.max(
      MIN_R,
      (axis.px(segment.x1) - axis.px(segment.x0)) / 2 - 1,
    );
    return Math.max(
      MIN_R,
      Math.min(MAX_R, room) * (0.55 + 0.45 * Math.sqrt(share)),
    );
  };
  const spineR = sites.reduce(
    (most, { segment }) =>
      segment.walks.length ? Math.max(most, radiusOf(segment, segment.walks[0])) : most,
    MIN_R,
  );
  const spineY = VARIANT_TOP + spineR;

  const circles: WalkCircle[] = [];
  const more: VariantLayout["more"] = [];
  let bottom = spineY + spineR;
  for (const { segment, i } of sites) {
    let y = spineY;
    let previous = 0;
    segment.walks.slice(0, MAX_STACK).forEach((walk, k) => {
      const r = radiusOf(segment, walk);
      if (k > 0) y += previous + GAP + r;
      const { left, right } = spanOf(walk);
      circles.push({
        segment: i,
        walk,
        cx: (left + right) / 2,
        cy: y,
        r,
        rx: roomOf(walk),
      });
      previous = r;
    });
    /* Past the last bubble's length label. */
    let end = y + previous + 13;
    if (segment.walks.length > MAX_STACK) {
      more.push({
        segment: i,
        cx: (axis.px(segment.x0) + axis.px(segment.x1)) / 2,
        y: end + 11,
        count: segment.walks.length - MAX_STACK,
      });
      end += 14;
    }
    bottom = Math.max(bottom, end);
  }
  /* From each walk to the walk its haplotypes take at the next site they
     enter - the next one along, or past a long deletion one further on - and
     how many go that way. Only between walks that are drawn; one past the
     stack has nowhere to start from. */
  const circleAt = new Map<string, WalkCircle>();
  for (const circle of circles) {
    circleAt.set(`${circle.segment}:${circle.walk.index}`, circle);
  }
  const most = Math.max(1, ...sites.map(({ segment }) => segment.haplotypes));
  const lastSeen = new Map<string, string>();
  const counts = new Map<string, number>();
  for (const { segment, i } of sites) {
    for (const walk of segment.walks) {
      const here = `${i}:${walk.index}`;
      for (const lane of walk.lanes) {
        const before = lastSeen.get(lane);
        if (before !== undefined) {
          const key = `${before}>${here}`;
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        lastSeen.set(lane, here);
      }
    }
  }
  const links: VariantLayout["links"] = [];
  for (const [key, haplotypes] of counts) {
    const [a, b] = key.split(">");
    const from = circleAt.get(a);
    const to = circleAt.get(b);
    if (!from || !to) continue;
    links.push({
      x1: from.cx + from.rx,
      y1: from.cy,
      x2: to.cx - to.rx,
      y2: to.cy,
      haplotypes,
      width: Math.max(1, LINK_MAX * Math.sqrt(haplotypes / most)),
      from: from.walk.index,
      /* Over sites it skips: drawn as an arc, so it does not run through
         the bubbles between. */
      skips: sites.findIndex(({ i }) => i === to.segment) -
        sites.findIndex(({ i }) => i === from.segment) > 1,
    });
  }
  return { circles, more, links, spineY, height: Math.ceil(bottom + FOOT) };
}

