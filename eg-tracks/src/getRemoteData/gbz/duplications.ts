import { encodeNode, isReverse, nodeId } from "./codec";
import type { Pos } from "./codec";
import { pathsOf } from "./bounds";
import type { GbzPath, GbzSource, RecordCache } from "./store";
import type { PathInfo } from "./subgraph";
import { after, before, enumerateReference } from "./walkOn";
import type { Context } from "./walkOn";

/* ══════════════════════════════════════════════════════════════════════════
   Finding a haplotype's duplications by walking its path
   (claude-memory/PLAN-remastered-2.md, section 1b; what 1b does not change
   is section 1's).

   A haplotype whose passes read some CHM13 node twice has copies: the
   graph build aligned them onto CHM13's one copy. Each of its contigs
   with a pass in view is walked from the fetched passes outward:

   - the passes of a contig 100 kb or less apart are one cluster, and the
     gaps between them are walked whole;
   - then each end of each cluster goes outward a step at a time until it
     reads an anchor site (2 kb of CHM13 nothing walked so far has read,
     going away from what was read), or 120 kb of own sequence with nothing
     read again (the window), or the contig's end, or 1 Mb walked for the
     cluster (the cap);
   - a stop on an anchor site is provisional: when another walk reads the
     same CHM13 as well, the side goes on from where it stopped.

   What was walked is cut into pieces (runs that read CHM13 in order on
   one strand) and the pieces joined into chains (pieces read once in
   place). The duplicated stretch is the CHM13 the contig reads twice or
   more. The chain an outward walk ended on an anchor site through is in
   place: a fact of the walk, never a choice. Its reading of the stretch
   is the copy in place; the other readings are cut into copies where the
   walk takes again the junction by which it leaves the in-place chain.
   With nothing in place nothing is cut or numbered: the finder reports
   one uncut stretch.

   The walk (stepping the GBWT) is kept apart from the analysis, so the
   same code runs on the saved fetches the predictor reads
   (testing/tools/dupCheck.ts) and its answer is compared field by field.
   Both read the haplotype through DupInput: GbwtInput below steps the
   database; the test harness steps the saved arrays.

   Coordinates: CHM13 0-based half-open; own = the contig's coordinates.
   A contig whose in-place chain reads CHM13's other strand is read in
   reverse orientation inside the analysis (own order reversed, strands
   flipped), so it gives the answer its mirror gives; everything reported
   is in the contig's own coordinates.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Limits ─────────────────────────────────────────────────────────── */

export interface DupLimits {
  /** Two neighbouring passes this far apart or less are one cluster (a
      cut's bp not counted). */
  clusterBp: number;
  /** A side stops after this much own sequence with nothing read again
      (a cut not counted). */
  windowBp: number;
  /** Own bp walked for one cluster, gaps and sides (a cut not counted). */
  capBp: number;
  /** Bases of an anchor site, counted in whole nodes. */
  anchorBp: number;
  /** An inversion in place: each end within this of the gap it fills. */
  inversionEndBp: number;
  /** Another contig is walked to the first stretch this long that does
      not read the duplicated stretch. */
  otherContigBp: number;
  /** CHM13 is known over the band widened by this much each way. */
  knownBp: number;
}

export const DUP_LIMITS: DupLimits = {
  clusterBp: 100_000,
  windowBp: 120_000,
  capBp: 1_000_000,
  anchorBp: 2_000,
  inversionEndBp: 50,
  otherContigBp: 1_000,
  knownBp: 150_000,
};

/** Gaps in the duplicated stretch shorter than this are bridged. */
const BRIDGE_BP = 1_000;
/** Own bp between two copies that still makes them one copy, or tandem. */
const SPACER_MAX = 1_000;
/** How far CHM13 may step back between two pieces of one chain. */
const CHAIN_OVERLAP = 1_000;
/** Same and other strand within this fraction of each other: mixed. */
const MIXED = 0.1;
/** CHM13 skipped inside a piece from this size on is not read. */
const STRUCTURAL = 50;
/** A piece bends over an own run whose size differs from the CHM13 it
    skips by at most this, or 10% of the piece so far. */
const PIECE_TOL = 1_000;
/** A copy reading this much of a piece of the stretch ends when the next
    piece reads it again. */
const PIECE_AGAIN = 0.9;
/** Two copies with this much or less between them are local. */
const LOCAL_BP = 1_000_000;

/* ── What the analysis reads ────────────────────────────────────────── */

/** Where CHM13 reads a node: its start, length, and the strand it reads
    it on. Known only over the band widened by knownBp. */
export interface Chm13Node {
  pos: number;
  len: number;
  reverse: boolean;
}
export type KnownChm13 = Map<number, Chm13Node>;

/** One step of a haplotype's path, in own coordinates [lo, hi), read in
    the contig's forward order: `reverse` is the strand it reads the node
    on. `n`: how many of its bases are N. */
export interface DupStep {
  kind: "step";
  lo: number;
  hi: number;
  id: number;
  reverse: boolean;
  path: number;
  n: number;
}

/** A stretch of own sequence the walk has no steps for: a cut between two
    GBWT paths of the contig; a stretch outside the saved data (read as
    other sequence of known length); or a stretch between two clusters
    that no walk went into. */
export interface DupHole {
  kind: "hole";
  lo: number;
  hi: number;
  why: "cut" | "outside" | "not walked";
  /** The GBWT paths either side, in own order, where known. */
  from?: number;
  to?: number;
  /** For a stretch outside the saved data cut at a limit: all of it. */
  of?: Range;
}

export type DupItem = DupStep | DupHole;

/** Where a walk ends: the contig's start or end, the end of the saved
    data, or where it cannot go on because the walk could not be placed on
    the GBWT (a pass whose positions do not check out, or a cut with no
    way back across it). */
export interface DupEnd {
  kind: "end";
  own: number;
  why: "contig start" | "contig end" | "outside the saved data" | "walk not placed";
  /** For "walk not placed": why. */
  reason?: string;
}

/** Steps along one haplotype's sequence from a pass's end outward. */
export interface DupWalker {
  next(): DupItem | DupEnd;
}

/** One array the worker returns for the haplotype: a pass. */
export interface DupPass {
  name: string;
  contig: string;
  path: number;
  lo: number;
  hi: number;
  /** In own order. */
  steps: DupStep[];
}

/** One haplotype, read either from the GBWT or from saved data. */
export interface DupInput {
  haplotype: string;
  passes: DupPass[];
  /** Walk from a pass's end outward: right (+1) from its end, left (-1)
      from its start. */
  walk(pass: DupPass, dir: 1 | -1): DupWalker;
  /** The cuts between two GBWT paths of one contig, the first before the
      second in own order: the holes between each path's end and the next
      one's start. Null where an end is not known. */
  cutsBetween(from: number, to: number): Range[] | null;
}

export interface DupOptions {
  /** The region view, CHM13 [from, to). */
  view: [number, number];
  /** The nodes of the band's CHM13 path. */
  band: Set<number>;
  /** Context nodes the fetch gives a CHM13 position for. Reading a node
      of the band or one of these twice is the trigger. */
  positioned?: Set<number>;
  limits: DupLimits;
}

/* ── What the finder reports ────────────────────────────────────────── */

export type Range = [number, number];
type StrandWord = "CHM13's" | "other";

export interface DupCutOut {
  own: Range;
  bp: number;
  paths: number[];
}

export interface DupAnchorOut {
  chm13: Range;
  /** The CHM13 nodes read, in whole nodes. */
  bp: number;
  own: Range;
  strand: StrandWord;
  beyond: string;
}

export interface DupSideOut {
  ends: string;
  at: number;
  walkedBp: number;
  steps: number;
  longestOwnStretchWithNothingReRead: number;
  cutBp?: number;
  cuts?: Range[];
  outsideSavedDataBp?: number;
  outsideSavedData?: Array<{ own: Range; bp: number; of?: Range }>;
  anchorSite?: DupAnchorOut;
  /** Stops on CHM13 another walk of the contig read as well. */
  notAnchorSites?: Array<{ chm13: Range; own: Range; at: number; readAgainBp: number; why: string }>;
  ownBpWithNothingReRead?: number;
  clusterWalkedBp?: number;
  capBp?: number;
  ownBpNotReadingIt?: number;
  mightBeMore?: boolean;
  reason?: string;
}

export interface DupClusterOut {
  n: number;
  passes: string[];
  own: Range;
  walkedBp: number;
  clustersMerged?: number;
  capBp?: number;
  cutBp?: number;
  outsideSavedDataBp?: number;
  gaps: Array<{ own: Range; bp: number; cutBp?: number; walkedBp: number; steps: number; outsideSavedDataBp?: number; notWalkedBp?: number }>;
  walksMet?: Array<{ at: number; by: string }>;
  left: DupSideOut;
  right: DupSideOut;
}

export interface DupSkipOut {
  kind: "deletion" | "deletion-insertion";
  chm13: Range;
  chm13Bp: number;
  ownBp: number;
  own: number;
}

export interface DupPieceOut {
  path: number;
  own: Range;
  ownBp: number;
  chm13: Range;
  strand: StrandWord;
  readBp: number;
  skips?: DupSkipOut[];
}

export interface DupInversionOut {
  contig?: string;
  pass?: string;
  path: number;
  chm13: Range;
  bp: number;
  own: Range;
  ownBp: number;
  fillsItsGapExactly: boolean;
  /** What lies at each break: the junction, its own bp, and the CHM13
      between the inversion's end and the piece beside it. */
  breaks: Array<{ junction: string; ownBp: number; chm13NotReadBp: number; chm13At?: number; chm13?: Range; chm13OverlapBp?: number }>;
}

export interface DupLinkOut {
  kind: string;
  own: Range;
  ownBp?: number;
  cutBp?: number;
  chm13?: Range;
  junction?: string;
}

export interface DupChainOut {
  own: Range;
  ownBp: number;
  chm13: Range;
  strand: StrandWord;
  paths: number[];
  pieces: DupPieceOut[];
  links: DupLinkOut[];
  inversionsInPlace?: DupInversionOut[];
}

export interface DupJunctionOut {
  sides: string;
  kind: "direct" | "inverted";
  type: "edge" | "spacer" | "cut";
  own: Range;
  ownBp: number;
  cutBp?: number;
  cuts?: DupCutOut[];
  outsideSavedDataBp?: number;
  nBases?: number;
  allNnodes?: string[];
  where?: string;
}

export interface DupBetweenOut {
  own: Range;
  bp: number;
  cutBp: number;
  ownSequenceBp: number;
  parts: Array<{ kind: "cut" | "own sequence" | "not walked"; own: Range; bp: number; paths?: number[] }>;
  outsideSavedDataBp?: number;
  notWalkedBp?: number;
}

export interface DupPartOut {
  path: number;
  own: Range;
  ownBp: number;
  chm13: Range;
  /** Against the in-place chain's strand. */
  strand: "forwards" | "backwards";
  sReadBp: number;
  inPlaceOnTheRight?: boolean;
}

export interface DupCopyOut {
  /** "in place", or "copy n". */
  label: string;
  inPlace?: boolean;
  /** Its number among the copies in own order; none for the copy in place. */
  n?: number;
  contig: string;
  paths: number[];
  own: Range;
  ownBp: number;
  chm13: Range[];
  chm13Bp: number;
  startsAt?: string;
  parts: DupPartOut[];
  /** The share of the duplicated stretch it covers, each CHM13 base once. */
  coversOfTheStretch: number;
  coveredBp: number;
  stretchBp: number;
  /** The stretch's bases as often as the copy reads them. */
  readBp: number;
  coveredByThisCopyAloneBp?: number;
  byPiece: Array<{ piece: number; chm13: Range; pieceBp: number; coveredBp: number }>;
  mightBeMore?: boolean;
  stoppedBy?: string;
  /** The copy itself reaches its contig's end. */
  atContigEnd?: boolean;
  arrangement: {
    type: string;
    against?: string;
    strandsCompared?: { sameStrandBp: number; otherStrandBp: number; orientation: string | null; by: string };
    orientation?: string | null;
    orientationNote?: string;
    between?: DupBetweenOut;
    junction?: DupJunctionOut;
    piecesBetween?: Array<{ own: Range; chm13: Range; strand: StrandWord }>;
    spacerBp?: number;
    spacerN?: number;
    local?: boolean;
  };
}

export interface DupUncutOut {
  cluster: number;
  own: Range;
  bp: number;
  copies: string;
  piecesReadingTheStretch: number;
  stretchBasesRead: number;
  stretchReadTimes: number;
  /** How many stretches of own sequence under 50 bp lie between its
      pieces: too short to list. */
  ownSequenceUnder50bp?: number;
  /** Cuts, own sequence of 50 bp or more between pieces, and pieces
      reading CHM13 outside the stretch. */
  inside: Array<{ kind: string; own: Range; bp: number; chm13?: Range; paths?: number[] }>;
  pieces: DupPieceOut[];
}

export interface DupPassBlock {
  own: Range;
  chm13: Range;
  strand: StrandWord;
}

export interface DupPassOut {
  name: string;
  contig?: string;
  own: Range;
  /** The CHM13 its known nodes span; null for a seam. */
  chm13: Range | null;
  strandBp?: { chm13Strand: number; otherStrand: number };
  /** The role of the part holding most of its bases. */
  role: string;
  copy?: number;
  roles: Array<{ own: Range; role: string; copy?: number }>;
  /** The pieces the pass reads, in own order: own range inside the pass,
      the CHM13 its steps there read, and the strand. For the view. */
  blocks: DupPassBlock[];
}

export interface DupAnchorSiteOut extends Omit<DupAnchorOut, "beyond"> {
  reachedBy: string;
  inPlace: boolean;
  chain: DupChainOut;
  /** Where the chain reads no part of the stretch: what it has instead.
      A deletion or a deletion-insertion over the stretch (`own`: where
      it starts); a reading that stops before the stretch (the chain's
      ranges); or no duplicated stretch on the contig at all. */
  instead?: { kind: string; chm13?: Range; chm13Bp?: number; ownBp?: number; cutBp?: number; own?: Range | number };
  /** Other anchor sites on this side of CHM13, nearer the stretch. */
  others?: Array<{ chm13: Range; own: Range }>;
}

export interface DupStretchOut {
  hull: Range;
  bp: number;
  pieces: Array<{
    chm13: Range;
    bp: number;
    edgeTakenIn?: Array<{ edge: "left" | "right"; chm13: Range; bp: number }>;
    profile: Array<{ chm13: Range; bp: number; reads: number }>;
  }>;
}

export interface DupFlags {
  mightBeMore: Array<{ cluster?: number; side?: "left" | "right"; at?: number; copy?: string; by: string }>;
  acrossCut: Array<{ copy: string; after: string; cuts: DupCutOut[] }>;
  atContigEnd: Array<{ cluster?: number; side?: "left" | "right"; at?: number; uncut?: number; copy?: string; what: string }>;
  lowerBound: Array<{ cluster: number; side: "left" | "right"; at: number; what: string }>;
}

export interface ContigDuplications {
  contig: string;
  walked: boolean;
  /** For a contig walked only while it reads another contig's stretch. */
  walkedOnlyWhileItReads?: string;
  clusters: DupClusterOut[];
  provisionalRounds: number;
  outsideSavedData?: Array<{ own: Range; bp: number; path: number }>;
  cuts?: DupCutOut[];
  duplicatedStretch?: DupStretchOut;
  duplication: boolean;
  anchorSites: { left: DupAnchorSiteOut | null; right: DupAnchorSiteOut | null };
  anchorSitesOnDifferentStrands?: boolean;
  inversionsInPlace: DupInversionOut[];
  inPlace: null | {
    by: string;
    reading: { own: Range; ownBp: number; coversOfTheStretch: number; note: string };
    onTheRight?: { chain: DupChainOut; note: string };
    contigReadIn: string;
    passes: Array<{ pass: string; viewReadBp: number; part: Range }>;
    chain: DupChainOut;
  };
  /** In own order read in the in-place chain's direction, the copy in
      place among them. Null where nothing is in place. */
  copies: DupCopyOut[] | null;
  /** Where nothing is in place: one uncut stretch per cluster. */
  uncut: DupUncutOut[] | null;
  whyUncut?: string;
  crossesTheInPlaceJunction?: number;
  leavingJunction?: DupJunctionOut | null;
  title?: { copies: number; inPlace: boolean; mightBeMore?: number; text: string; note: string };
  passes: DupPassOut[];
  flags: DupFlags;
  trigger: boolean;
}

export interface DupTriggerContig {
  contig: string;
  fired: boolean;
  passes: number;
  seams: number;
  nodesReadTwice: number;
  bpReadTwice: number;
  ofThemOnTheBandsCHM13Path: number;
  passesReadingANodeTwice: string[];
}

export interface HaplotypeDuplications {
  haplotype: string;
  trigger: { fired: boolean; contigs: DupTriggerContig[] };
  /** Per contig walked: those with a trigger first, by name. Absent with
      no trigger. */
  contigs?: ContigDuplications[];
  duplication: boolean;
  walked: boolean;
  inversionsInPlace: DupInversionOut[];
  passes: DupPassOut[];
}

/* ── Small helpers ──────────────────────────────────────────────────── */

const fmt = (n: number) => n.toLocaleString("en-US");
const round4 = (x: number) => Math.round(x * 10_000) / 10_000;
const word = (strand: 1 | -1): StrandWord => (strand > 0 ? "CHM13's" : "other");

/** Sorted, disjoint, merged. */
function union(intervals: Range[]): Range[] {
  const sorted = intervals.filter(([a, b]) => b > a).sort((p, q) => p[0] - q[0]);
  const out: Range[] = [];
  for (const [a, b] of sorted) {
    const last = out[out.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

const total = (intervals: Range[]) => intervals.reduce((n, [a, b]) => n + (b - a), 0);

/** Bases two sorted disjoint lists share. */
function shared(x: Range[], y: Range[]): number {
  let i = 0;
  let j = 0;
  let n = 0;
  while (i < x.length && j < y.length) {
    const lo = Math.max(x[i][0], y[j][0]);
    const hi = Math.min(x[i][1], y[j][1]);
    if (hi > lo) n += hi - lo;
    if (x[i][1] < y[j][1]) i++;
    else j++;
  }
  return n;
}

/** How many of the intervals cover each base: segments [lo, hi, count],
    count > 0, ascending. */
type Profile = Array<[number, number, number]>;
function profileOf(intervals: Range[]): Profile {
  const events: Array<[number, number]> = [];
  for (const [a, b] of intervals) {
    if (b <= a) continue;
    events.push([a, 1], [b, -1]);
  }
  events.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const out: Profile = [];
  let count = 0;
  let at = 0;
  for (const [x, d] of events) {
    if (x > at && count > 0) {
      const last = out[out.length - 1];
      if (last && last[1] === at && last[2] === count) last[1] = x;
      else out.push([at, x, count]);
    }
    count += d;
    at = x;
  }
  return out;
}

/** The profile's segments inside [lo, hi), clipped. */
function clip(profile: Profile, lo: number, hi: number): Profile {
  const out: Profile = [];
  for (const [a, b, c] of profile) {
    const x = Math.max(a, lo);
    const y = Math.min(b, hi);
    if (y > x) out.push([x, y, c]);
  }
  return out;
}


/* ── The walk: clusters, their gaps, then each end outward ──────────── */

class Peek {
  private held: DupItem | DupEnd | null = null;
  constructor(private readonly walker: DupWalker) {}
  peek(): DupItem | DupEnd {
    if (!this.held) this.held = this.walker.next();
    return this.held;
  }
  take(): DupItem | DupEnd {
    const x = this.peek();
    this.held = null;
    return x;
  }
  /** Puts back what is left of an item read in part. */
  replace(x: DupItem): void {
    this.held = x;
  }
}

/** A run of one side's steps that may become an anchor site: CHM13 nodes
    on one strand, CHM13 moving one way, none read before, held together
    by the piece rule. */
interface Run {
  strand: 1 | -1;
  /** How CHM13 moves along the walk: up (+1) or down (-1). */
  cdir: 1 | -1;
  path: number;
  /** Own position where the run starts, in walking order. */
  ownStart: number;
  first: DupStep;
  last: { step: DupStep; pos: number; len: number };
  clo: number;
  chi: number;
  bp: number;
  nodes: number[];
}

interface AnchorFound {
  chm13: Range;
  bp: number;
  own: Range;
  strand: 1 | -1;
  cdir: 1 | -1;
  nodes: number[];
}

type SideEnds = "anchor site" | "window" | "cap" | "contig end" | "no longer reads the duplicated stretch" | "outside the saved data" | "walk not placed";

/** One end of a cluster, walked outward. */
interface SideWalk {
  dir: 1 | -1;
  pass: DupPass;
  walker: Peek | null;
  /** In walking order. */
  items: DupItem[];
  at: number;
  steps: number;
  /** Own bp walked, cuts not counted. */
  walkedBp: number;
  /** Own bp since this side last read a CHM13 node read before. */
  window: number;
  longest: number;
  /** Own bp since this side last read the duplicated stretch (a contig
      walked only while it reads it). */
  notReading: number;
  run: Run | null;
  stop: null | { ends: SideEnds; at: number; anchor?: AnchorFound; counted?: number; reason?: string };
  notAnchors: Array<{ chm13: Range; own: Range; at: number; readAgainBp: number }>;
  cluster: Cluster;
  /** Its cluster met another on this side: the two are one. */
  gone: boolean;
}

interface GapWalk {
  /** The pass it is walked from. */
  from: DupPass;
  lo: number;
  hi: number;
  items: DupItem[];
  steps: number;
}

interface Cluster {
  passes: DupPass[];
  gaps: GapWalk[];
  /** Everything between the two sides, in own order. */
  core: DupItem[];
  left: SideWalk;
  right: SideWalk;
  /** Own bp walked for it, gaps and sides, cuts not counted. */
  walked: number;
  capBp: number;
  merged: number;
  walksMet: Array<{ at: number; by: string }>;
}

interface ContigWalk {
  contig: string;
  /** In own order. */
  passes: DupPass[];
  clusters: Cluster[];
  /** How often each known CHM13 node was read on this contig. */
  counts: Map<number, number>;
  /** The outer bounds of the CHM13 read so far. */
  readLo: number;
  readHi: number;
  rounds: number;
  /** For a contig walked only while it reads another contig's stretch:
      that stretch's pieces. */
  only: Range[] | null;
}

const holeBp = (items: DupItem[], why: DupHole["why"]) => items.reduce((n, it) => n + (it.kind === "hole" && it.why === why ? it.hi - it.lo : 0), 0);

/** Counts a step's node as read; says whether it was read before. */
function readStep(w: ContigWalk, st: DupStep, known: KnownChm13): { c: Chm13Node | undefined; before: number; lo: number; hi: number } {
  const c = known.get(st.id);
  const lo = w.readLo;
  const hi = w.readHi;
  if (!c) return { c, before: 0, lo, hi };
  const before = w.counts.get(st.id) ?? 0;
  w.counts.set(st.id, before + 1);
  w.readLo = Math.min(w.readLo, c.pos);
  w.readHi = Math.max(w.readHi, c.pos + c.len);
  return { c, before, lo, hi };
}

/** A contig's passes in own order, cut into clusters: two neighbours
    clusterBp or less apart, a cut's bp not counted, are one cluster. */
function clustersOf(contig: string, all: DupPass[], input: DupInput, known: KnownChm13, limits: DupLimits, only: Range[] | null): ContigWalk {
  const passes = [...all].sort((p, q) => p.lo - q.lo || q.hi - p.hi);
  const w: ContigWalk = { contig, passes, clusters: [], counts: new Map(), readLo: Infinity, readHi: -Infinity, rounds: 0, only };
  /* The passes count as read from the start. A step two passes overlap
     on is one reading. */
  const counted = new Set<string>();
  for (const pass of passes) {
    for (const st of pass.steps) {
      const key = `${st.path}:${st.lo}`;
      if (counted.has(key)) continue;
      counted.add(key);
      readStep(w, st, known);
    }
  }
  const side = (pass: DupPass, dir: 1 | -1, cluster: Cluster): SideWalk => ({
    dir,
    pass,
    walker: null,
    items: [],
    at: dir > 0 ? pass.hi : pass.lo,
    steps: 0,
    walkedBp: 0,
    window: 0,
    longest: 0,
    notReading: 0,
    run: null,
    stop: null,
    notAnchors: [],
    cluster,
    gone: false,
  });
  let far: DupPass | null = null;
  let cluster: Cluster | null = null;
  const close = () => {
    if (!cluster || !far) return;
    cluster.left = side(cluster.passes[0], -1, cluster);
    cluster.right = side(far, 1, cluster);
    w.clusters.push(cluster);
  };
  for (const pass of passes) {
    if (cluster && far) {
      if (pass.lo <= far.hi) {
        cluster.passes.push(pass);
        if (pass.hi > far.hi) far = pass;
        continue;
      }
      const cuts = far.path === pass.path ? [] : (input.cutsBetween(far.path, pass.path) ?? []);
      const apart = pass.lo - far.hi - total(cuts.map(([a, b]) => [Math.max(a, far!.hi), Math.min(b, pass.lo)] as Range).filter(([a, b]) => b > a));
      if (apart <= limits.clusterBp) {
        cluster.gaps.push({ from: far, lo: far.hi, hi: pass.lo, items: [], steps: 0 });
        cluster.passes.push(pass);
        far = pass;
        continue;
      }
      close();
    }
    cluster = { passes: [pass], gaps: [], core: [], left: null as unknown as SideWalk, right: null as unknown as SideWalk, walked: 0, capBp: limits.capBp, merged: 1, walksMet: [] };
    far = pass;
  }
  close();
  return w;
}

/** The inside first: a gap between two passes of a cluster is walked
    whole, from the end of one pass to the start of the next. */
function walkGap(w: ContigWalk, cluster: Cluster, gap: GapWalk, input: DupInput, known: KnownChm13): void {
  const walker = new Peek(input.walk(gap.from, 1));
  let at = gap.lo;
  while (at < gap.hi) {
    const x = walker.take();
    if (x.kind === "end" || x.lo >= gap.hi) {
      gap.items.push({ kind: "hole", lo: at, hi: gap.hi, why: "not walked" });
      break;
    }
    if (x.kind === "hole") {
      const hi = Math.min(x.hi, gap.hi);
      gap.items.push(hi < x.hi ? { ...x, hi } : x);
      if (x.why !== "cut") cluster.walked += hi - x.lo;
      at = hi;
      continue;
    }
    gap.items.push(x);
    gap.steps += 1;
    cluster.walked += x.hi - x.lo;
    at = x.hi;
    readStep(w, x, known);
  }
}

/** A cluster's passes and gaps, in own order. A step two passes overlap
    on is kept once. */
function coreOf(cluster: Cluster): DupItem[] {
  const all: DupItem[] = [...cluster.passes.flatMap((p) => p.steps), ...cluster.gaps.flatMap((g) => g.items)].sort((p, q) => p.lo - q.lo);
  const out: DupItem[] = [];
  for (const it of all) {
    const last = out[out.length - 1];
    if (last && it.lo < last.hi) continue;
    out.push(it);
  }
  return out;
}

/** Two clusters whose walks meet are one: their caps add. */
function mergeClusters(w: ContigWalk, a: Cluster, b: Cluster, at: number, by: string): void {
  a.core = [...a.core, ...a.right.items, ...[...b.left.items].reverse(), ...b.core];
  a.passes.push(...b.passes);
  a.gaps.push(...b.gaps);
  a.walked += b.walked;
  a.capBp += b.capBp;
  a.merged += b.merged;
  a.walksMet.push(...b.walksMet, { at, by });
  a.right.gone = true;
  b.left.gone = true;
  a.right = b.right;
  a.right.cluster = a;
  w.clusters.splice(w.clusters.indexOf(b), 1);
  /* A side the cap had stopped goes on. */
  for (const side of [a.left, a.right]) if (side.stop?.ends === "cap") side.stop = null;
}

/**
 * One side outward, a step at a time, until it stops at the first of: an
 * anchor site, the window, the contig's end, the cap; or it reaches own
 * sequence another cluster walked, and the two clusters are one. A limit
 * falls at an exact own base: a step that starts before it is read whole;
 * a stretch with no steps (outside the saved data) is cut at the limit.
 * A contig walked only while it reads another contig's stretch stops at
 * the first otherContigBp that do not read it instead.
 */
function walkSide(w: ContigWalk, side: SideWalk, input: DupInput, known: KnownChm13, limits: DupLimits): void {
  const { dir } = side;
  for (;;) {
    const cluster = side.cluster;
    const k = w.clusters.indexOf(cluster);
    const nb = w.clusters[k + dir] as Cluster | undefined;
    const edge = nb ? (dir > 0 ? nb.left.at : nb.right.at) : null;
    if (nb && edge !== null && (dir > 0 ? side.at >= edge : side.at <= edge)) {
      if (dir > 0) mergeClusters(w, cluster, nb, side.at, "the walk rightwards");
      else mergeClusters(w, nb, cluster, side.at, "the walk leftwards");
      return;
    }
    if (w.only) {
      if (side.notReading >= limits.otherContigBp) {
        side.stop = { ends: "no longer reads the duplicated stretch", at: side.at, counted: side.notReading };
        return;
      }
    } else {
      if (side.window >= limits.windowBp) {
        side.stop = { ends: "window", at: side.at, counted: side.window };
        return;
      }
      if (cluster.walked >= cluster.capBp) {
        side.stop = { ends: "cap", at: side.at };
        return;
      }
    }
    if (!side.walker) side.walker = new Peek(input.walk(side.pass, dir));
    const x = side.walker.peek();
    if (x.kind === "end") {
      side.walker.take();
      side.stop = { ends: x.why === "contig start" ? "contig end" : x.why, at: side.at, ...(x.reason ? { reason: x.reason } : {}) };
      return;
    }
    if (x.kind === "hole") {
      if (x.why === "cut") {
        /* A cut is not counted, and ends a run. */
        side.walker.take();
        side.items.push(x);
        side.at = dir > 0 ? x.hi : x.lo;
        side.run = null;
        continue;
      }
      /* Own sequence of known length: a limit inside it falls at its
         exact base. */
      const len = x.hi - x.lo;
      let budget = w.only ? limits.otherContigBp - side.notReading : Math.min(limits.windowBp - side.window, cluster.capBp - cluster.walked);
      if (edge !== null) budget = Math.min(budget, Math.abs(edge - side.at));
      const take = Math.min(len, budget);
      if (take < len) {
        const cutAt = dir > 0 ? x.lo + take : x.hi - take;
        const of: Range = x.of ?? [x.lo, x.hi];
        side.items.push({ ...x, lo: dir > 0 ? x.lo : cutAt, hi: dir > 0 ? cutAt : x.hi, of });
        side.walker.replace({ ...x, lo: dir > 0 ? cutAt : x.lo, hi: dir > 0 ? x.hi : cutAt, of });
        side.at = cutAt;
      } else {
        side.walker.take();
        side.items.push(x);
        side.at = dir > 0 ? x.hi : x.lo;
      }
      side.walkedBp += take;
      cluster.walked += take;
      side.window += take;
      side.notReading += take;
      side.longest = Math.max(side.longest, side.window);
      continue;
    }
    side.walker.take();
    const len = x.hi - x.lo;
    side.items.push(x);
    side.at = dir > 0 ? x.hi : x.lo;
    side.steps += 1;
    side.walkedBp += len;
    cluster.walked += len;
    const read = readStep(w, x, known);
    const c = read.c;
    if (w.only) {
      const readsIt = !!c && w.only.some(([a, b]) => c.pos < b && c.pos + c.len > a);
      side.notReading = readsIt ? 0 : side.notReading + len;
      side.window = c && read.before > 0 ? 0 : side.window + len;
      side.longest = Math.max(side.longest, side.window);
      continue;
    }
    if (!c) {
      side.window += len;
      side.longest = Math.max(side.longest, side.window);
      continue;
    }
    if (read.before > 0) {
      /* Read again: the window starts over, and no anchor site here. */
      side.window = 0;
      side.run = null;
      continue;
    }
    side.window += len;
    side.longest = Math.max(side.longest, side.window);
    const strand: 1 | -1 = x.reverse === c.reverse ? 1 : -1;
    const cdir = (dir * strand) as 1 | -1;
    let run = side.run;
    if (run && run.strand === strand && run.path === x.path) {
      const last = run.last;
      const N = dir > 0 ? x.lo - last.step.hi : last.step.lo - x.hi;
      const M = cdir > 0 ? c.pos - (last.pos + last.len) : last.pos - (c.pos + c.len);
      const soFar = dir > 0 ? last.step.hi - run.ownStart : run.ownStart - last.step.lo;
      const tol = Math.max(PIECE_TOL, 0.1 * soFar);
      if (!(M >= 0 && (N <= tol || Math.abs(N - M) <= tol))) run = null;
    } else run = null;
    if (!run) {
      /* Its first node at or past the outer bound of all the CHM13 read
         so far, on the side the run moves to. */
      const past = cdir > 0 ? c.pos >= read.hi : c.pos + c.len <= read.lo;
      if (past) run = { strand, cdir, path: x.path, ownStart: dir > 0 ? x.lo : x.hi, first: x, last: { step: x, pos: c.pos, len: c.len }, clo: c.pos, chi: c.pos + c.len, bp: 0, nodes: [] };
    }
    side.run = run;
    if (!run) continue;
    run.last = { step: x, pos: c.pos, len: c.len };
    run.clo = Math.min(run.clo, c.pos);
    run.chi = Math.max(run.chi, c.pos + c.len);
    run.bp += c.len;
    run.nodes.push(x.id);
    if (run.bp >= limits.anchorBp) {
      const own: Range = dir > 0 ? [run.first.lo, x.hi] : [x.lo, run.first.hi];
      side.stop = { ends: "anchor site", at: side.at, anchor: { chm13: [run.clo, run.chi], bp: run.bp, own, strand, cdir, nodes: run.nodes } };
      return;
    }
  }
}

/**
 * Walks one contig: the gaps of every cluster first, then the clusters in
 * own order, the left side then the right. Stops are provisional: when
 * every side has stopped, an anchor site of which any node has been read
 * again is none, and that side goes on from where it stopped, its window
 * at 0; until no anchor site is undone. Nothing is walked twice.
 */
function walkContig(contig: string, passes: DupPass[], input: DupInput, known: KnownChm13, limits: DupLimits, only: Range[] | null): ContigWalk {
  const w = clustersOf(contig, passes, input, known, limits, only);
  for (const cluster of w.clusters) {
    for (const gap of cluster.gaps) walkGap(w, cluster, gap, input, known);
    cluster.core = coreOf(cluster);
  }
  for (;;) {
    const todo = w.clusters.flatMap((c) => [c.left, c.right]).filter((s) => !s.stop);
    if (!todo.length) break;
    w.rounds += 1;
    for (const side of todo) if (!side.gone && !side.stop) walkSide(w, side, input, known, limits);
    for (const cluster of w.clusters) {
      for (const side of [cluster.left, cluster.right]) {
        const a = side.stop?.anchor;
        if (!a) continue;
        let again = 0;
        for (const id of a.nodes) if ((w.counts.get(id) ?? 0) > 1) again += known.get(id)?.len ?? 0;
        if (!again) continue;
        side.notAnchors.push({ chm13: a.chm13, own: a.own, at: side.stop!.at, readAgainBp: again });
        side.stop = null;
        side.window = 0;
        side.run = null;
      }
    }
  }
  return w;
}

/** Everything walked on the contig, in own order; between two clusters
    whose walks did not meet, a stretch not walked. */
function contigItems(w: ContigWalk): DupItem[] {
  const out: DupItem[] = [];
  const push = (it: DupItem) => {
    const last = out[out.length - 1];
    if (last && last.kind === "hole" && it.kind === "hole" && last.why === "outside" && it.why === "outside" && last.hi === it.lo && last.from === it.from) {
      out[out.length - 1] = { ...last, hi: it.hi };
      return;
    }
    out.push(it);
  };
  w.clusters.forEach((c, k) => {
    if (k > 0) {
      const before = w.clusters[k - 1];
      if (c.left.at > before.right.at) push({ kind: "hole", lo: before.right.at, hi: c.left.at, why: "not walked" });
    }
    for (const it of [...c.left.items].reverse()) push(it);
    for (const it of c.core) push(it);
    for (const it of c.right.items) push(it);
  });
  return out;
}

/* ── The contig's items, oriented ───────────────────────────────────── */

/** A contig's walked stretch in the analysis's frame: own order read in
    the contig's orientation. For a contig in reverse orientation every
    position is mirrored (o = -own) and every strand flipped. */
interface Frame {
  contig: string;
  reverse: boolean;
  items: DupItem[];
  /** Every pass of the contig, in the frame's order. */
  passes: DupPass[];
}

function flipItem(it: DupItem): DupItem {
  if (it.kind === "step") return { ...it, lo: -it.hi, hi: -it.lo, reverse: !it.reverse };
  return { ...it, lo: -it.hi, hi: -it.lo, from: it.to, to: it.from };
}

const toReal = (f: { reverse: boolean }, r: Range): Range => (f.reverse ? [-r[1], -r[0]] : [r[0], r[1]]);

function frameOf(contig: string, items: DupItem[], passes: DupPass[], reverse: boolean): Frame {
  if (!reverse) return { contig, reverse, items, passes };
  const flipPass = (p: DupPass): DupPass => ({ ...p, lo: -p.hi, hi: -p.lo, steps: [...p.steps].reverse().map((st) => flipItem(st) as DupStep) });
  return {
    contig,
    reverse,
    items: [...items].reverse().map(flipItem),
    passes: [...passes].reverse().map(flipPass),
  };
}

/* ── Pieces, junctions, chains ──────────────────────────────────────── */

interface Anchor {
  k: number;
  st: DupStep;
  pos: number;
  len: number;
}

/** A run of own sequence reading CHM13 in order on one strand (section
    1's block). */
interface Piece {
  index: number;
  path: number;
  strand: 1 | -1;
  anchors: Anchor[];
  lo: number;
  hi: number;
  clo: number;
  chi: number;
  reads: Range[];
  readBp: number;
  /** CHM13 of 50 bp or more skipped inside: not read. `at`: where the
      own run over it starts, in the frame. */
  skips: Array<{ chm13: Range; chm13Bp: number; ownBp: number; at: number }>;
  k0: number;
  k1: number;
}

/**
 * Pieces: runs of own sequence reading CHM13 in order, one strand
 * relation, CHM13 moving one way. Inside a piece an own run of N bp where
 * CHM13 skips M bp with |N - M| within the tolerance (a substitution or
 * deletion-insertion), or N itself within it (a deletion), bends the
 * piece; anything larger ends it, as does a cut or a stretch not walked.
 * Skipped CHM13 of 50 bp or more is not read; less is.
 */
function piecesOf(frame: Frame, known: KnownChm13): Piece[] {
  const pieces: Piece[] = [];
  let cur: Piece | null = null;
  let broken = false;
  const close = () => {
    if (cur) pieces.push(cur);
    cur = null;
  };
  frame.items.forEach((it, k) => {
    if (it.kind === "hole") {
      if (it.why !== "outside") broken = true;
      return;
    }
    const c = known.get(it.id);
    if (!c) return;
    const a: Anchor = { k, st: it, pos: c.pos, len: c.len };
    const strand: 1 | -1 = it.reverse === c.reverse ? 1 : -1;
    const b = cur as Piece | null;
    if (b && !broken && b.path === it.path && b.strand === strand) {
      const last = b.anchors[b.anchors.length - 1];
      const N = it.lo - last.st.hi;
      const M = strand > 0 ? a.pos - (last.pos + last.len) : last.pos - (a.pos + a.len);
      const tol = Math.max(PIECE_TOL, 0.1 * (last.st.hi - b.lo));
      if (M >= 0 && (N <= tol || Math.abs(N - M) <= tol)) {
        b.anchors.push(a);
        b.hi = it.hi;
        b.k1 = k;
        b.clo = Math.min(b.clo, a.pos);
        b.chi = Math.max(b.chi, a.pos + a.len);
        if (M > 0) {
          const gap: Range = strand > 0 ? [last.pos + last.len, a.pos] : [a.pos + a.len, last.pos];
          if (M >= STRUCTURAL) b.skips.push({ chm13: gap, chm13Bp: M, ownBp: N, at: last.st.hi });
          else b.reads.push(gap);
        }
        b.reads.push([a.pos, a.pos + a.len]);
        broken = false;
        return;
      }
    }
    close();
    broken = false;
    cur = {
      index: 0,
      path: it.path,
      strand,
      anchors: [a],
      lo: it.lo,
      hi: it.hi,
      clo: a.pos,
      chi: a.pos + a.len,
      reads: [[a.pos, a.pos + a.len]],
      readBp: 0,
      skips: [],
      k0: k,
      k1: k,
    };
  });
  close();
  pieces.forEach((b, i) => {
    b.index = i;
    b.reads = union(b.reads);
    b.readBp = total(b.reads);
  });
  return pieces;
}

/** What joins two consecutive pieces of the walk. */
interface Junction {
  type: "edge" | "spacer" | "cut" | "not walked";
  lo: number;
  hi: number;
  ownBp: number;
  /** The two node sides joined, as an unordered pair: the key. */
  key: string;
  text: string;
  kind: "direct" | "inverted";
  nBases: number;
  /** Nodes between that are all N. */
  allN: number[];
  notWalked: number;
  cut: boolean;
}

function junctionOf(frame: Frame, a: Piece, b: Piece): Junction {
  let nBases = 0;
  let notWalked = 0;
  let cut = a.path !== b.path;
  const allN: number[] = [];
  for (let k = a.k1 + 1; k < b.k0; k++) {
    const it = frame.items[k];
    if (it.kind === "step") {
      nBases += it.n;
      if (it.n > 0 && it.n === it.hi - it.lo) allN.push(it.id);
    } else if (it.why === "not walked") notWalked += it.hi - it.lo;
    else if (it.why === "cut") cut = true;
  }
  const x = a.anchors[a.anchors.length - 1].st;
  const y = b.anchors[0].st;
  const exit = x.reverse ? "start" : "end";
  const entry = y.reverse ? "end" : "start";
  const p = `${x.id}.${exit}`;
  const q = `${y.id}.${entry}`;
  const ownBp = b.lo - a.hi;
  return {
    type: cut ? "cut" : notWalked ? "not walked" : ownBp === 0 && b.k0 === a.k1 + 1 ? "edge" : "spacer",
    lo: a.hi,
    hi: b.lo,
    ownBp,
    key: p < q ? `${p}~${q}` : `${q}~${p}`,
    text: `${p}~${q}`,
    /* end~start direct; end~end or start~start inverted. */
    kind: exit === entry ? "inverted" : "direct",
    nBases,
    allN,
    notWalked,
    cut,
  };
}

/** An inversion in place: a piece on the other strand between two pieces
    of one chain, with the CHM13 between each of its ends and the piece
    beside it (0: it fills its gap exactly; below 0: an overlap). */
interface Inversion {
  piece: Piece;
  j1: Junction;
  j2: Junction;
  gap1: number;
  gap2: number;
  /** The CHM13 position of each break, on the chain's side of it. */
  at1: number;
  at2: number;
}

interface Chain {
  pieces: Piece[];
  strand: 1 | -1;
  lo: number;
  hi: number;
  inversions: Inversion[];
}

const shortSpacer = (j: Junction) => j.type === "edge" || (j.type === "spacer" && j.ownBp <= SPACER_MAX);

/**
 * Chains: pieces read once in place. Two consecutive same-strand pieces
 * join when CHM13 moves on (stepping back at most 1 kb) and what lies
 * between reads no known CHM13 (own sequence of any size, a cut, or both;
 * never a stretch not walked); and across an inversion in place: a piece
 * on the other strand between two of one strand on one GBWT path, each of
 * its ends within endBp of the gap it fills, as a gap or as an overlap,
 * joined by an edge or a short spacer at each break.
 */
function chainsOf(pieces: Piece[], junctions: Junction[], endBp: number): Chain[] {
  const chains: Chain[] = [];
  let i = 0;
  while (i < pieces.length) {
    const first = pieces[i];
    const chain: Chain = { pieces: [first], strand: first.strand, lo: first.lo, hi: first.hi, inversions: [] };
    let k = i;
    for (;;) {
      const a = pieces[k];
      const b = pieces[k + 1];
      if (!b) break;
      const j = junctions[k];
      const movesOn = (x: Piece, y: Piece) => (x.strand > 0 ? y.clo >= x.chi - CHAIN_OVERLAP : y.chi <= x.clo + CHAIN_OVERLAP);
      if (b.strand === a.strand && j.type !== "not walked" && j.notWalked === 0 && movesOn(a, b)) {
        chain.pieces.push(b);
        k += 1;
        continue;
      }
      const c = pieces[k + 2];
      if (b.strand !== a.strand && c && c.strand === a.strand && a.path === b.path && b.path === c.path) {
        const j2 = junctions[k + 1];
        const gap1 = a.strand > 0 ? b.clo - a.chi : a.clo - b.chi;
        const gap2 = a.strand > 0 ? c.clo - b.chi : b.clo - c.chi;
        if (Math.abs(gap1) <= endBp && Math.abs(gap2) <= endBp && shortSpacer(j) && shortSpacer(j2)) {
          chain.pieces.push(b, c);
          chain.inversions.push({ piece: b, j1: j, j2, gap1, gap2, at1: a.strand > 0 ? a.chi : a.clo, at2: a.strand > 0 ? c.clo : c.chi });
          k += 2;
          continue;
        }
      }
      break;
    }
    chain.hi = pieces[k].hi;
    chains.push(chain);
    i = k + 1;
  }
  return chains;
}

/* ── The duplicated stretch ─────────────────────────────────────────── */

interface StretchPiece {
  lo: number;
  hi: number;
  profile: Profile;
  taken: Array<{ edge: "left" | "right"; chm13: Range; bp: number }>;
}

/** The CHM13 read two or more times, gaps under 1 kb bridged, each piece
    with its count profile. An edge takes in the stretch read once that
    touches it when that is shorter than an anchor site. */
function stretchOf(profile: Profile, anchorBp: number): StretchPiece[] {
  const runs: Array<{ lo: number; hi: number; taken: StretchPiece["taken"] }> = [];
  for (const [a, b, c] of profile) {
    if (c < 2) continue;
    const last = runs[runs.length - 1];
    if (last && a - last.hi < BRIDGE_BP) last.hi = b;
    else runs.push({ lo: a, hi: b, taken: [] });
  }
  const once = (at: number, side: "left" | "right"): Range | null => {
    const seg = profile.find(([a, b, c]) => c === 1 && (side === "left" ? b === at : a === at));
    return seg ? [seg[0], seg[1]] : null;
  };
  for (const run of runs) {
    const left = once(run.lo, "left");
    const right = once(run.hi, "right");
    if (left && left[1] - left[0] < anchorBp) {
      run.taken.push({ edge: "left", chm13: left, bp: left[1] - left[0] });
      run.lo = left[0];
    }
    if (right && right[1] - right[0] < anchorBp) {
      run.taken.push({ edge: "right", chm13: right, bp: right[1] - right[0] });
      run.hi = right[1];
    }
  }
  /* A stretch read once between two pieces, shorter than an anchor site,
     is taken in by both edges: the two are one piece. */
  for (let k = runs.length - 1; k > 0; k--) {
    if (runs[k - 1].hi < runs[k].lo) continue;
    runs[k - 1].hi = Math.max(runs[k - 1].hi, runs[k].hi);
    runs[k - 1].taken.push(...runs[k].taken);
    runs.splice(k, 1);
  }
  /* A bridged gap read by nothing shows in the profile as read 0 times. */
  return runs.map(({ lo, hi, taken }) => {
    const out: Profile = [];
    for (const seg of clip(profile, lo, hi)) {
      const last = out[out.length - 1];
      if (last && seg[0] > last[1]) out.push([last[1], seg[0], 0]);
      out.push(seg);
    }
    return { lo, hi, profile: out, taken };
  });
}

function stretchOut(stretch: StretchPiece[]): DupStretchOut {
  return {
    hull: [stretch[0].lo, stretch[stretch.length - 1].hi],
    bp: stretch.reduce((n, p) => n + (p.hi - p.lo), 0),
    pieces: stretch.map((p) => ({
      chm13: [p.lo, p.hi] as Range,
      bp: p.hi - p.lo,
      ...(p.taken.length ? { edgeTakenIn: p.taken } : {}),
      profile: p.profile.map(([a, b, c]) => ({ chm13: [a, b] as Range, bp: b - a, reads: c })),
    })),
  };
}

/* ── Reporting pieces, chains, inversions ───────────────────────────── */

/** A frame strand in the contig's own terms. */
const realStrand = (frame: Frame, strand: 1 | -1): 1 | -1 => (frame.reverse ? (-strand as 1 | -1) : strand);

function pieceOut(frame: Frame, b: Piece): DupPieceOut {
  return {
    path: b.path,
    own: toReal(frame, [b.lo, b.hi]),
    ownBp: b.hi - b.lo,
    chm13: [b.clo, b.chi],
    strand: word(realStrand(frame, b.strand)),
    readBp: b.readBp,
    ...(b.skips.length
      ? {
          skips: b.skips.map((s) => ({
            kind: s.ownBp > 0 ? ("deletion-insertion" as const) : ("deletion" as const),
            chm13: s.chm13,
            chm13Bp: s.chm13Bp,
            ownBp: s.ownBp,
            own: toReal(frame, [s.at, s.at + s.ownBp])[0],
          })),
        }
      : {}),
  };
}

function inversionOut(frame: Frame, x: Inversion): DupInversionOut {
  const brk = (j: Junction, gap: number, at: number, first: boolean) => {
    /* The CHM13 between the inversion's end and the piece beside it. */
    const lo = Math.min(at, first === x.piece.strand < 0 ? at + gap : at - gap);
    return {
      junction: j.text,
      ownBp: j.ownBp,
      chm13NotReadBp: Math.max(0, gap),
      ...(gap > 0 ? { chm13: [lo, lo + gap] as Range } : gap < 0 ? { chm13At: at, chm13OverlapBp: -gap } : { chm13At: at }),
    };
  };
  return {
    path: x.piece.path,
    chm13: [x.piece.clo, x.piece.chi],
    bp: x.piece.chi - x.piece.clo,
    own: toReal(frame, [x.piece.lo, x.piece.hi]),
    ownBp: x.piece.hi - x.piece.lo,
    fillsItsGapExactly: x.gap1 === 0 && x.gap2 === 0,
    breaks: [brk(x.j1, x.gap1, x.at1, true), brk(x.j2, x.gap2, x.at2, false)],
  };
}

function chainOut(frame: Frame, c: Chain, junctions: Junction[]): DupChainOut {
  const links: DupLinkOut[] = [];
  const inverted = new Set(c.inversions.map((x) => x.piece));
  for (let i = 0; i + 1 < c.pieces.length; i++) {
    const a = c.pieces[i];
    const b = c.pieces[i + 1];
    const j = junctions[a.index];
    if (inverted.has(b)) {
      links.push({ kind: "inversion in place", own: toReal(frame, [b.lo, b.hi]), chm13: [b.clo, b.chi] });
      continue;
    }
    if (inverted.has(a)) {
      links.push({ kind: "inversion in place (its far end)", own: toReal(frame, [j.lo, j.hi]) });
      continue;
    }
    const gap: Range = c.strand > 0 ? [a.chi, b.clo] : [b.chi, a.clo];
    const cutBp = holeBp(frame.items.slice(a.k1 + 1, b.k0), "cut");
    links.push({
      /* All that lies between the two pieces is a cut, a hole in the graph:
         what the haplotype has there is not known, so it is neither a
         deletion nor a deletion-insertion. */
      kind: cutBp > 0 && j.ownBp - cutBp === 0 ? "a cut" : gap[1] > gap[0] ? (j.ownBp > 0 ? "deletion-insertion" : "deletion") : "insertion",
      own: toReal(frame, [j.lo, j.hi]),
      ownBp: j.ownBp,
      ...(cutBp ? { cutBp } : {}),
      chm13: gap,
      junction: j.type,
    });
  }
  /* Reported in the contig's own order. */
  const inOwnOrder = <T>(list: T[]): T[] => (frame.reverse ? [...list].reverse() : list);
  return {
    own: toReal(frame, [c.lo, c.hi]),
    ownBp: c.hi - c.lo,
    chm13: [Math.min(...c.pieces.map((b) => b.clo)), Math.max(...c.pieces.map((b) => b.chi))],
    strand: word(realStrand(frame, c.strand)),
    paths: inOwnOrder([...new Set(c.pieces.map((b) => b.path))]),
    pieces: inOwnOrder(c.pieces.map((b) => pieceOut(frame, b))),
    links: inOwnOrder(links),
    ...(c.inversions.length ? { inversionsInPlace: c.inversions.map((x) => inversionOut(frame, x)) } : {}),
  };
}

/** A pass's share of the pieces, in the contig's own terms. */
function passBlocks(frame: Frame, pieces: Piece[], pass: DupPass): DupPassBlock[] {
  const out: DupPassBlock[] = [];
  for (const b of pieces) {
    if (b.hi <= pass.lo || b.lo >= pass.hi) continue;
    const inside = b.anchors.filter((a) => a.st.lo >= pass.lo && a.st.hi <= pass.hi);
    if (!inside.length) continue;
    out.push({
      own: toReal(frame, [Math.max(b.lo, pass.lo), Math.min(b.hi, pass.hi)]),
      chm13: [Math.min(...inside.map((a) => a.pos)), Math.max(...inside.map((a) => a.pos + a.len))],
      strand: word(realStrand(frame, b.strand)),
    });
  }
  if (frame.reverse) out.reverse();
  return out;
}

/** The CHM13 a pass's known nodes span. */
function passChm13(pass: DupPass, known: KnownChm13): Range | null {
  let lo = Infinity;
  let hi = -Infinity;
  for (const st of pass.steps) {
    const c = known.get(st.id);
    if (!c) continue;
    lo = Math.min(lo, c.pos);
    hi = Math.max(hi, c.pos + c.len);
  }
  return hi > lo ? [lo, hi] : null;
}

/* ── The analysis of one contig's walk ──────────────────────────────── */

interface Located {
  frame: Frame;
  pieces: Piece[];
  junctions: Junction[];
  chains: Chain[];
  chainOf: Map<Piece, Chain>;
}

function locate(w: ContigWalk, items: DupItem[], reverse: boolean, known: KnownChm13, limits: DupLimits): Located {
  const frame = frameOf(w.contig, items, w.passes, reverse);
  const pieces = piecesOf(frame, known);
  const junctions = pieces.slice(1).map((b, i) => junctionOf(frame, pieces[i], b));
  const chains = chainsOf(pieces, junctions, limits.inversionEndBp);
  const chainOf = new Map<Piece, Chain>();
  for (const c of chains) for (const b of c.pieces) chainOf.set(b, c);
  return { frame, pieces, junctions, chains, chainOf };
}

/** What the contig that has an anchor site on both sides hands to the
    haplotype's other contigs: its stretch, and the junction by which its
    walk leaves its in-place chain. */
interface Setter {
  contig: string;
  stretch: StretchPiece[];
  junction: { key: string; text: string } | null;
  lastN: number;
  lastLabel: string;
}

/** One reading of the stretch by one piece: a part of a copy. */
interface CopyPart {
  piece: Piece;
  lo: number;
  hi: number;
  clo: number;
  chi: number;
  reads: Range[];
  strand: 1 | -1;
  inPlaceRight: boolean;
  holdsStart: boolean;
}

interface CopyWork {
  parts: CopyPart[];
  lo: number;
  hi: number;
  inPlace: boolean;
  because: string;
  n: number;
  label: string;
}

const cutOut = (frame: Frame, it: DupHole): DupCutOut => {
  const own = toReal(frame, [it.lo, it.hi]);
  const paths = [it.from, it.to].filter((p): p is number => p !== undefined);
  return { own, bp: it.hi - it.lo, paths: frame.reverse ? paths.reverse() : paths };
};

function sideOut(side: SideWalk, mightBeMore: DupFlags["mightBeMore"], n: number, name: "left" | "right"): DupSideOut {
  const stop = side.stop!;
  const cuts = side.items.filter((it): it is DupHole => it.kind === "hole" && it.why === "cut");
  const outside = side.items.filter((it): it is DupHole => it.kind === "hole" && it.why === "outside");
  const out: DupSideOut = {
    ends: stop.ends,
    at: stop.at,
    walkedBp: side.walkedBp,
    steps: side.steps,
    longestOwnStretchWithNothingReRead: side.longest,
    ...(cuts.length ? { cutBp: total(cuts.map((c) => [c.lo, c.hi] as Range)), cuts: cuts.map((c) => [c.lo, c.hi] as Range) } : {}),
    ...(outside.length
      ? {
          outsideSavedDataBp: outside.reduce((s, c) => s + (c.hi - c.lo), 0),
          outsideSavedData: outside.map((c) => ({ own: [c.lo, c.hi] as Range, bp: c.hi - c.lo, ...(c.of && (c.of[0] !== c.lo || c.of[1] !== c.hi) ? { of: c.of } : {}) })),
        }
      : {}),
  };
  if (stop.anchor) {
    const a = stop.anchor;
    out.anchorSite = { chm13: a.chm13, bp: a.bp, own: a.own, strand: word(a.strand), beyond: a.cdir < 0 ? "the left bound of the CHM13 read" : "the right bound of the CHM13 read" };
  }
  if (side.notAnchors.length) {
    out.notAnchorSites = side.notAnchors.map((x) => ({ ...x, why: "another walk of the contig read it as well: not an anchor site; the side goes on from where it stopped" }));
  }
  if (stop.ends === "window") {
    out.ownBpWithNothingReRead = stop.counted;
    out.mightBeMore = true;
    mightBeMore.push({ cluster: n, side: name, at: stop.at, by: `the window: ${fmt(stop.counted ?? 0)} bp of own sequence with nothing re-read` });
  } else if (stop.ends === "cap") {
    out.clusterWalkedBp = side.cluster.walked;
    out.capBp = side.cluster.capBp;
    out.mightBeMore = true;
    mightBeMore.push({ cluster: n, side: name, at: stop.at, by: `the cap: ${fmt(side.cluster.walked)} bp walked for the cluster` });
  } else if (stop.ends === "no longer reads the duplicated stretch") {
    out.ownBpNotReadingIt = stop.counted;
  } else if (stop.ends === "walk not placed") {
    out.mightBeMore = true;
    if (stop.reason) out.reason = stop.reason;
    mightBeMore.push({ cluster: n, side: name, at: stop.at, by: `the walk could not be placed: ${stop.reason ?? "it could not go on"}` });
  }
  return out;
}

function clusterOut(c: Cluster, n: number, flags: DupFlags): DupClusterOut {
  const items = [...c.left.items, ...c.core, ...c.right.items];
  const cutBp = holeBp(items, "cut");
  const outsideBp = holeBp(items, "outside");
  const left = sideOut(c.left, flags.mightBeMore, n, "left");
  const right = sideOut(c.right, flags.mightBeMore, n, "right");
  for (const [name, side] of [["left", c.left], ["right", c.right]] as const) {
    const stop = side.stop!;
    if (stop.ends === "contig end") flags.atContigEnd.push({ cluster: n, side: name, at: stop.at, what: "the walk reached the contig's end" });
    if (stop.ends === "outside the saved data") flags.lowerBound.push({ cluster: n, side: name, at: stop.at, what: "the saved data stop here: the result past it is a lower bound" });
  }
  return {
    n,
    passes: c.passes.map((p) => p.name),
    own: [c.left.stop!.at, c.right.stop!.at],
    walkedBp: c.walked,
    ...(c.merged > 1 ? { clustersMerged: c.merged, capBp: c.capBp } : {}),
    ...(cutBp ? { cutBp } : {}),
    ...(outsideBp ? { outsideSavedDataBp: outsideBp } : {}),
    gaps: c.gaps.map((g) => {
      const cut = holeBp(g.items, "cut");
      const out_ = holeBp(g.items, "outside");
      const not = holeBp(g.items, "not walked");
      return {
        own: [g.lo, g.hi] as Range,
        bp: g.hi - g.lo,
        ...(cut ? { cutBp: cut } : {}),
        walkedBp: g.hi - g.lo - cut - not,
        steps: g.steps,
        ...(out_ ? { outsideSavedDataBp: out_ } : {}),
        ...(not ? { notWalkedBp: not } : {}),
      };
    }),
    ...(c.walksMet.length ? { walksMet: c.walksMet } : {}),
    left,
    right,
  };
}

/** Where nothing is in place: per cluster, the stretch of own sequence
    from the first to the last piece reading the duplicated stretch. */
function uncutOf(w: ContigWalk, loc: Located, sRanges: Range[]): DupUncutOut[] {
  const out: DupUncutOut[] = [];
  const { frame, pieces, junctions } = loc;
  w.clusters.forEach((c, k) => {
    const lo = c.left.stop!.at;
    const hi = c.right.stop!.at;
    const here = pieces.filter((b) => b.lo >= lo && b.hi <= hi);
    const reading = here.filter((b) => shared(b.reads, sRanges) > 0);
    if (!reading.length) return;
    const own: Range = [reading[0].lo, reading[reading.length - 1].hi];
    const inside: DupUncutOut["inside"] = [];
    let short = 0;
    for (const it of frame.items) {
      if (it.kind === "hole" && it.why === "cut" && it.lo >= own[0] && it.hi <= own[1]) inside.push({ kind: "cut", own: [it.lo, it.hi], bp: it.hi - it.lo, paths: cutOut(frame, it).paths });
    }
    for (const b of here) {
      if (b.lo < own[0] || b.hi > own[1]) continue;
      if (!reading.includes(b)) inside.push({ kind: "a piece reading CHM13 outside the stretch", own: [b.lo, b.hi], bp: b.hi - b.lo, chm13: [b.clo, b.chi] });
      const j = junctions[b.index];
      if (j && b.hi < own[1] && j.type === "spacer" && j.ownBp >= STRUCTURAL) inside.push({ kind: "own sequence", own: [j.lo, j.hi], bp: j.ownBp });
      else if (j && b.hi < own[1] && j.type === "spacer" && j.ownBp > 0) short += 1;
    }
    inside.sort((p, q) => p.own[0] - q.own[0]);
    const read = reading.reduce((n, b) => n + shared(b.reads, sRanges), 0);
    out.push({
      cluster: k + 1,
      own,
      bp: own[1] - own[0],
      copies: "unknown number of copies: nothing is in place, so nothing is cut or numbered",
      piecesReadingTheStretch: reading.length,
      stretchBasesRead: read,
      stretchReadTimes: round4(read / Math.max(1, total(sRanges))),
      ...(short ? { ownSequenceUnder50bp: short } : {}),
      inside,
      pieces: reading.map((b) => pieceOut(frame, b)),
    });
  });
  return out;
}

interface Paint {
  lo: number;
  hi: number;
  role: string;
  copy?: number;
}

/** Each pass's roles: the paints laid over it in order, the later over
    the earlier; a pass reading no known CHM13 is a seam. */
function passesOut(loc: Located, paints: Paint[], known: KnownChm13, fallback: string): DupPassOut[] {
  const f = loc.frame;
  const out: DupPassOut[] = [];
  for (const pass of f.passes) {
    const seam = !pass.steps.some((s) => known.has(s.id));
    let parts: Paint[] = [{ lo: pass.lo, hi: pass.hi, role: seam ? "seam" : fallback }];
    if (!seam) {
      for (const p of paints) {
        const next: Paint[] = [];
        for (const q of parts) {
          if (p.hi <= q.lo || p.lo >= q.hi) {
            next.push(q);
            continue;
          }
          if (q.lo < p.lo) next.push({ ...q, hi: p.lo });
          next.push({ lo: Math.max(q.lo, p.lo), hi: Math.min(q.hi, p.hi), role: p.role, ...(p.copy !== undefined ? { copy: p.copy } : {}) });
          if (q.hi > p.hi) next.push({ ...q, lo: p.hi });
        }
        parts = next;
      }
    }
    const merged: Paint[] = [];
    for (const q of parts) {
      const last = merged[merged.length - 1];
      if (last && last.role === q.role && last.hi === q.lo) last.hi = q.hi;
      else merged.push({ ...q });
    }
    const roles = merged.map((q) => ({ own: toReal(f, [q.lo, q.hi]), role: q.role, ...(q.copy !== undefined ? { copy: q.copy } : {}) }));
    if (f.reverse) roles.reverse();
    let best = roles[0];
    for (const r of roles) if (r.own[1] - r.own[0] > best.own[1] - best.own[0]) best = r;
    out.push({
      name: pass.name,
      own: toReal(f, [pass.lo, pass.hi]),
      chm13: passChm13(pass, known),
      role: best.role,
      ...(best.copy !== undefined ? { copy: best.copy } : {}),
      roles,
      blocks: passBlocks(f, loc.pieces, pass),
    });
  }
  if (f.reverse) out.reverse();
  return out;
}

/**
 * What one contig's walk shows: the duplicated stretch, the anchor sites,
 * what is in place, the copies or the uncut stretch, each pass's roles
 * and the flags. `setter`: for a contig walked only while it reads
 * another contig's stretch.
 */
function analyseContig(w: ContigWalk, known: KnownChm13, options: DupOptions, fired: boolean, setter: Setter | null): { out: ContigDuplications; setter: Setter | null } {
  const { limits, view } = options;
  const items = contigItems(w);
  const flags: DupFlags = { mightBeMore: [], acrossCut: [], atContigEnd: [], lowerBound: [] };
  const clusters = w.clusters.map((c, k) => clusterOut(c, k + 1, flags));
  let loc = locate(w, items, false, known, limits);
  const real = loc;
  const stretch = setter ? setter.stretch : stretchOf(profileOf(loc.pieces.flatMap((b) => b.reads)), limits.anchorBp);
  const sRanges = stretch.map((p) => [p.lo, p.hi] as Range);
  const stretchBp = total(sRanges);
  const hull: Range | null = stretch.length ? [stretch[0].lo, stretch[stretch.length - 1].hi] : null;
  const readsS = (reads: Range[]) => shared(reads, sRanges);

  const outside = items.filter((it): it is DupHole => it.kind === "hole" && it.why === "outside");
  const cuts = items.filter((it): it is DupHole => it.kind === "hole" && it.why === "cut");
  const base: ContigDuplications = {
    contig: w.contig,
    walked: true,
    ...(setter ? { walkedOnlyWhileItReads: `the duplicated stretch of contig ${setter.contig}, which has an anchor site on both sides` } : {}),
    clusters,
    provisionalRounds: w.rounds,
    ...(outside.length ? { outsideSavedData: outside.map((it) => ({ own: [it.lo, it.hi] as Range, bp: it.hi - it.lo, path: (it.from ?? it.to)! })) } : {}),
    ...(cuts.length ? { cuts: cuts.map((it) => cutOut(real.frame, it)) } : {}),
    ...(!setter && hull ? { duplicatedStretch: stretchOut(stretch) } : {}),
    duplication: false,
    anchorSites: { left: null, right: null },
    inversionsInPlace: [],
    inPlace: null,
    copies: null,
    uncut: null,
    passes: [],
    flags,
    trigger: fired,
  };

  /* ── What is in place ────────────────────────────────────────────── */
  /* Per CHM13 side, the anchor site farthest out; its chain is in place
     when it reads part of the stretch. */
  const found: Array<{ n: number; side: "left" | "right"; a: AnchorFound }> = [];
  w.clusters.forEach((c, k) => {
    if (c.left.stop?.anchor) found.push({ n: k + 1, side: "left", a: c.left.stop.anchor });
    if (c.right.stop?.anchor) found.push({ n: k + 1, side: "right", a: c.right.stop.anchor });
  });
  const lefts = found.filter((x) => x.a.cdir < 0).sort((p, q) => p.a.chm13[0] - q.a.chm13[0]);
  const rights = found.filter((x) => x.a.cdir > 0).sort((p, q) => q.a.chm13[1] - p.a.chm13[1]);
  const left = setter ? null : (lefts[0] ?? null);
  const right = setter ? null : (rights[0] ?? null);
  const chainAt = (at: Located, a: AnchorFound): Chain | null => {
    const [lo, hi] = at.frame.reverse ? [-a.own[1], -a.own[0]] : a.own;
    let best: Piece | null = null;
    let most = 0;
    for (const b of at.pieces) {
      const over = Math.min(b.hi, hi) - Math.max(b.lo, lo);
      if (over > most) {
        most = over;
        best = b;
      }
    }
    return best ? (at.chainOf.get(best) ?? null) : null;
  };
  const readsStretch = (c: Chain | null) => !!c && c.pieces.some((b) => readsS(b.reads) > 0);
  let leftChain = left ? chainAt(loc, left.a) : null;
  let rightChain = right ? chainAt(loc, right.a) : null;
  let inPlaceChain = readsStretch(leftChain) ? leftChain : readsStretch(rightChain) ? rightChain : null;
  if (inPlaceChain && inPlaceChain.strand < 0) {
    /* The in-place chain reads CHM13's other strand: the contig is read
       in reverse orientation. */
    loc = locate(w, items, true, known, limits);
    leftChain = left ? chainAt(loc, left.a) : null;
    rightChain = right ? chainAt(loc, right.a) : null;
    inPlaceChain = readsStretch(leftChain) ? leftChain : readsStretch(rightChain) ? rightChain : null;
  }
  const { frame, pieces, junctions } = loc;
  const leftIn = readsStretch(leftChain);
  const rightIn = readsStretch(rightChain);
  const rightCopyChain = leftIn && rightIn && rightChain !== leftChain ? rightChain : null;
  /* What a chain by an anchor site has where it reads no part of the
     stretch: a deletion or a deletion-insertion over it, or a reading
     that stops before it. */
  const insteadOf = (chain: Chain): NonNullable<DupAnchorSiteOut["instead"]> => {
    if (!hull) return { kind: "no duplicated stretch on this contig" };
    /* `ownBp`: own bases in the graph; `cutBp`: those of a cut beside them
       (between two pieces only). All cut: "a cut", what is there is not
       known. */
    const over = (gap: Range, ownBp: number, at: number, cutBp = 0): NonNullable<DupAnchorSiteOut["instead"]> | null =>
      gap[0] < hull[1] && gap[1] > hull[0]
        ? { kind: cutBp > 0 && ownBp === 0 ? "a cut" : ownBp > 0 ? "deletion-insertion" : "deletion", chm13: gap, chm13Bp: gap[1] - gap[0], ownBp, ...(cutBp ? { cutBp } : {}), own: toReal(frame, [at, at + ownBp + cutBp])[0] }
        : null;
    for (let i = 0; i < chain.pieces.length; i++) {
      const a = chain.pieces[i];
      for (const s of a.skips) {
        const inside = over(s.chm13, s.ownBp, s.at);
        if (inside) return inside;
      }
      const b = chain.pieces[i + 1];
      const cutBp = b ? holeBp(frame.items.slice(a.k1 + 1, b.k0), "cut") : 0;
      const between = b ? over(chain.strand > 0 ? [a.chi, b.clo] : [b.chi, a.clo], b.lo - a.hi - cutBp, a.hi, cutBp) : null;
      if (between) return between;
    }
    return {
      kind: "the reading from the anchor site stops before the duplicated stretch",
      chm13: [Math.min(...chain.pieces.map((b) => b.clo)), Math.max(...chain.pieces.map((b) => b.chi))],
      own: toReal(frame, [chain.lo, chain.hi]),
    };
  };
  const anchorOut = (x: { n: number; side: "left" | "right"; a: AnchorFound } | null, chain: Chain | null, inPlace: boolean, rest: typeof found): DupAnchorSiteOut | null => {
    if (!x || !chain) return null;
    return {
      chm13: x.a.chm13,
      bp: x.a.bp,
      own: x.a.own,
      strand: word(x.a.strand),
      reachedBy: `cluster ${x.n}, its ${x.side} side (own order)`,
      inPlace,
      chain: chainOut(frame, chain, junctions),
      ...(inPlace ? {} : { instead: insteadOf(chain) }),
      ...(rest.length ? { others: rest.map((o) => ({ chm13: o.a.chm13, own: o.a.own })) } : {}),
    };
  };
  base.anchorSites = { left: anchorOut(left, leftChain, leftIn, lefts.slice(1)), right: anchorOut(right, rightChain, rightIn, rights.slice(1)) };
  if (left && right && left.a.strand !== right.a.strand) base.anchorSitesOnDifferentStrands = true;
  base.inversionsInPlace = loc.chains.flatMap((c) => c.inversions.map((x) => inversionOut(frame, x)));

  /* ── The junction by which the walk leaves the in-place chain ────── */
  let leaving: { j: Junction; where: string } | null = null;
  if (inPlaceChain) {
    const first = inPlaceChain.pieces[0];
    const last = inPlaceChain.pieces[inPlaceChain.pieces.length - 1];
    /* At the chain's end away from its anchor site; for a chain reaching
       both anchor sites, on the side where its copies lie. */
    const bothSides = leftIn && rightIn && leftChain === rightChain;
    const after = bothSides ? pieces.some((b) => b.lo >= inPlaceChain!.hi && readsS(b.reads) > 0) : leftIn;
    const j = after ? junctions[last.index] : first.index > 0 ? junctions[first.index - 1] : undefined;
    if (j && j.type !== "not walked" && j.notWalked === 0) leaving = { j, where: after ? "after the in-place chain in own order" : "before the in-place chain in own order (its copies lie before it)" };
  }
  const cutKey = inPlaceChain ? (leaving?.j.key ?? null) : setter?.junction ? setter.junction.key : null;
  const crossings = setter && setter.junction ? junctions.filter((j) => shortSpacer(j) && j.key === setter.junction!.key).length : 0;
  if (setter) base.crossesTheInPlaceJunction = crossings;
  const cutting = !!hull && (!!inPlaceChain || crossings > 0);

  /* ── Nothing in place: nothing is cut or numbered ────────────────── */
  if (!cutting || !hull) {
    const uncut = hull ? uncutOf(w, real, sRanges) : [];
    base.duplication = uncut.length > 0;
    base.uncut = uncut.length ? uncut : null;
    if (uncut.length) {
      base.whyUncut = setter
        ? `this contig does not cross the junction by which contig ${setter.contig}'s walk leaves its in-place chain`
        : found.length
          ? "an anchor site was reached, but the chain from it reads nothing of the duplicated stretch"
          : "nothing in place found: no side of the walk ended on an anchor site";
      uncut.forEach((u) => {
        const ends = flags.atContigEnd.filter((e) => e.cluster === u.cluster && (e.at === u.own[0] || e.at === u.own[1]));
        if (ends.length) flags.atContigEnd.push({ uncut: u.cluster, what: "the uncut stretch reaches the contig's end" });
      });
    }
    base.passes = passesOut(real, uncut.map((u) => ({ lo: u.own[0], hi: u.own[1], role: "in the uncut stretch" })), known, hull ? "other sequence" : "no duplicated stretch");
    return { out: base, setter: null };
  }

  /* ── Copies ───────────────────────────────────────────────────────── */
  /* A piece's reading of the stretch: from its first to its last CHM13
     node inside the stretch's outer bounds. */
  const clipPart = (b: Piece, inPlaceRight: boolean): CopyPart | null => {
    const inside = b.anchors.filter((a) => a.pos >= hull[0] && a.pos < hull[1]);
    if (!inside.length || readsS(b.reads) === 0) return null;
    const clo = Math.min(...inside.map((a) => a.pos));
    const chi = Math.max(...inside.map((a) => a.pos + a.len));
    const reads = b.reads.map(([x, y]) => [Math.max(x, clo), Math.min(y, chi)] as Range).filter(([x, y]) => y > x);
    const lo = inside[0].st.lo;
    return { piece: b, lo, hi: inside[inside.length - 1].st.hi, clo, chi, reads, strand: b.strand, inPlaceRight, holdsStart: lo === b.lo };
  };
  const entries: Array<{ piece: Piece; part: CopyPart | null }> = pieces.map((b) => {
    if (inPlaceChain && inPlaceChain.pieces.includes(b)) return { piece: b, part: null };
    if (rightCopyChain && rightCopyChain.pieces.includes(b)) return { piece: b, part: clipPart(b, true) };
    if (readsS(b.reads) > 0) return { piece: b, part: { piece: b, lo: b.lo, hi: b.hi, clo: b.clo, chi: b.chi, reads: b.reads, strand: b.strand, inPlaceRight: false, holdsStart: true } };
    return { piece: b, part: null };
  });
  /* A new copy at each recrossing of the leaving junction (an edge or up
     to 1 kb), at another GBWT path, at other sequence over 1 kb or other
     pieces between, and where 90% of a piece of the stretch is read
     again. */
  const pieceCover = (reads: Range[], p: StretchPiece) => shared(reads, [[p.lo, p.hi]]) / (p.hi - p.lo);
  const works: CopyWork[] = [];
  let prev: CopyPart | null = null;
  let gapSince = true;
  for (const e of entries) {
    if (!e.part) {
      gapSince = true;
      continue;
    }
    let because: string | null = null;
    if (!prev) because = "first";
    else if (e.piece.path !== prev.piece.path) because = "another GBWT path (a cut)";
    else if (gapSince || e.piece.index !== prev.piece.index + 1) because = "other pieces between";
    else {
      const j = junctions[prev.piece.index];
      if (!shortSpacer(j)) because = j.cut ? "another GBWT path (a cut)" : j.type === "not walked" ? "not walked between" : "other sequence between";
      else if (!e.part.holdsStart && e.part.inPlaceRight) because = "other sequence between";
      else if (cutKey && j.key === cutKey) because = `the junction ${leaving && leaving.j.key === j.key ? leaving.j.text : j.text}`;
      else {
        const work = works[works.length - 1];
        const reads = union(work.parts.flatMap((p) => p.reads));
        const k = stretch.findIndex((p) => pieceCover(reads, p) >= PIECE_AGAIN && pieceCover(e.part!.reads, p) >= PIECE_AGAIN);
        if (k >= 0) because = `a second copy of piece ${k + 1} of the duplicated stretch (90% or more of it read again)`;
      }
    }
    if (because) works.push({ parts: [e.part], lo: e.part.lo, hi: e.part.hi, inPlace: false, because, n: 0, label: "" });
    else {
      const work = works[works.length - 1];
      work.parts.push(e.part);
      work.hi = e.part.hi;
    }
    prev = e.part;
    gapSince = false;
  }
  /* The in-place chain's reading of the stretch is the copy in place. */
  if (inPlaceChain) {
    const parts = inPlaceChain.pieces.map((b) => clipPart(b, false)).filter((p): p is CopyPart => !!p);
    if (parts.length) works.push({ parts, lo: parts[0].lo, hi: parts[parts.length - 1].hi, inPlace: true, because: "", n: 0, label: "in place" });
  }
  works.sort((p, q) => p.lo - q.lo);
  /* Numbered from 1 in own order, skipping the copy in place; another
     contig's copies go on from the last number. */
  let n = setter ? setter.lastN : 0;
  for (const work of works) {
    if (work.inPlace) continue;
    work.n = ++n;
    work.label = `copy ${work.n}`;
  }

  /* What stopped a side on a limit, by where. */
  const limitStops = new Map<number, string>();
  flags.mightBeMore.forEach((m) => {
    if (m.at !== undefined) limitStops.set(m.at, m.by);
  });
  flags.lowerBound.forEach((m) => limitStops.set(m.at, "the end of the saved data"));

  const coverOf = (work: CopyWork) => union(work.parts.flatMap((p) => p.reads));
  const covers = works.map(coverOf);
  const cutsBetween = (lo: number, hi: number) => frame.items.filter((it): it is DupHole => it.kind === "hole" && it.why === "cut" && it.lo >= lo && it.hi <= hi);

  const copies: DupCopyOut[] = works.map((work, k) => {
    const cover = intersect(covers[k], sRanges);
    const coveredBp = total(cover);
    const chm = union(work.parts.map((p) => [p.clo, p.chi] as Range));
    const own = toReal(frame, [work.lo, work.hi]);
    const stopped = limitStops.get(own[0]) ?? limitStops.get(own[1]);
    const out: DupCopyOut = {
      label: work.label,
      ...(work.inPlace ? { inPlace: true } : { n: work.n }),
      contig: w.contig,
      paths: [...new Set(work.parts.map((p) => p.piece.path))],
      own,
      ownBp: work.hi - work.lo,
      chm13: chm,
      chm13Bp: total(chm),
      ...(work.inPlace ? {} : { startsAt: work.because }),
      parts: work.parts.map((p) => ({
        path: p.piece.path,
        own: toReal(frame, [p.lo, p.hi]),
        ownBp: p.hi - p.lo,
        chm13: [p.clo, p.chi] as Range,
        strand: p.strand > 0 ? ("forwards" as const) : ("backwards" as const),
        sReadBp: readsS(p.reads),
        ...(p.inPlaceRight ? { inPlaceOnTheRight: true } : {}),
      })),
      coversOfTheStretch: round4(coveredBp / stretchBp),
      coveredBp,
      stretchBp,
      readBp: work.parts.reduce((s, p) => s + readsS(p.reads), 0),
      byPiece: stretch
        .map((p, i) => ({ piece: i + 1, chm13: [p.lo, p.hi] as Range, pieceBp: p.hi - p.lo, coveredBp: shared(cover, [[p.lo, p.hi]]) }))
        .filter((x) => x.coveredBp > 0),
      ...(stopped ? { mightBeMore: true, stoppedBy: stopped } : {}),
      arrangement: { type: "first in own order" },
    };
    const before = works[k - 1];
    if (!before) {
      if (setter) out.arrangement = { against: setter.lastLabel, type: "another contig", orientation: null, orientationNote: "on another contig: which way that contig runs against this one is not known" };
      return out;
    }
    /* Against the copy before it in own order. A reading by a chain in
       place, by either anchor site, is taken on its chain's strand: an
       inversion in place is a variant of it, not a change of strand. */
    let same = 0;
    let other = 0;
    for (const p of work.parts) {
      for (const q of before.parts) {
        const bp = shared(p.reads, q.reads);
        const ps = work.inPlace ? 1 : p.inPlaceRight && rightCopyChain ? rightCopyChain.strand : p.strand;
        const qs = before.inPlace ? 1 : q.inPlaceRight && rightCopyChain ? rightCopyChain.strand : q.strand;
        if (ps === qs) same += bp;
        else other += bp;
      }
    }
    const orientation = same === 0 && other === 0 ? null : Math.min(same, other) >= (1 - MIXED) * Math.max(same, other) ? "mixed" : same > other ? "direct" : "inverted";
    const lo = before.hi;
    const hi = work.lo;
    const between: DupBetweenOut = { own: toReal(frame, [lo, hi]), bp: hi - lo, cutBp: 0, ownSequenceBp: 0, parts: [] };
    let outsideBp = 0;
    let notWalked = 0;
    let nBases = 0;
    for (const it of frame.items) {
      if (it.hi <= lo || it.lo >= hi) continue;
      const a = Math.max(it.lo, lo);
      const b = Math.min(it.hi, hi);
      const kind = it.kind === "step" || it.why === "outside" ? "own sequence" : it.why === "cut" ? "cut" : "not walked";
      if (it.kind === "step") nBases += it.n;
      else if (it.why === "outside") outsideBp += b - a;
      if (kind === "cut") between.cutBp += b - a;
      else if (kind === "own sequence") between.ownSequenceBp += b - a;
      else notWalked += b - a;
      const last = between.parts[between.parts.length - 1];
      const range = toReal(frame, [a, b]);
      if (last && last.kind === kind && kind !== "cut") {
        last.own = [Math.min(last.own[0], range[0]), Math.max(last.own[1], range[1])];
        last.bp += b - a;
      } else between.parts.push({ kind, own: range, bp: b - a, ...(it.kind === "hole" && it.why === "cut" ? { paths: cutOut(frame, it).paths } : {}) });
    }
    /* Listed in the contig's own order. */
    if (frame.reverse) between.parts.reverse();
    if (outsideBp) between.outsideSavedDataBp = outsideBp;
    if (notWalked) between.notWalkedBp = notWalked;
    /* The two facing pieces: the copy in place faces its neighbours with
       its chain's ends. The arrangement's word is judged between them. */
    const facing = before.inPlace && inPlaceChain ? inPlaceChain.pieces[inPlaceChain.pieces.length - 1] : before.parts[before.parts.length - 1].piece;
    const mine = work.inPlace && inPlaceChain ? inPlaceChain.pieces[0] : work.parts[0].piece;
    const cutList = cutsBetween(lo, hi).map((it) => cutOut(frame, it));
    out.arrangement = { against: before.label, strandsCompared: { sameStrandBp: same, otherStrandBp: other, orientation, by: orientation === null ? "no CHM13 in common" : orientation === "mixed" ? "same-strand and other-strand shared bases within 10% of each other" : "where they read the same CHM13" }, orientation, between, type: "" };
    const arr = out.arrangement;
    if (cutList.length) flags.acrossCut.push({ copy: work.label, after: before.label, cuts: cutList });
    {
      /* The pieces lying between the two copies' readings, the in-place
         chain's own pieces outside the stretch among them. */
      const from = before.parts[before.parts.length - 1].piece.index;
      const to = work.parts[0].piece.index;
      const lying = pieces.filter((b) => b.index > from && b.index < to);
      if (lying.length) arr.piecesBetween = lying.map((b) => ({ own: toReal(frame, [b.lo, b.hi]), chm13: [b.clo, b.chi] as Range, strand: word(realStrand(frame, b.strand)) }));
    }
    if (notWalked > 0) {
      arr.type = "unknown (not walked between)";
      return out;
    }
    if (mine.index === facing.index + 1) {
      const j = junctions[facing.index];
      arr.junction = {
        sides: j.text,
        kind: j.kind,
        type: j.cut ? "cut" : j.type === "edge" ? "edge" : "spacer",
        own: toReal(frame, [j.lo, j.hi]),
        ownBp: j.ownBp,
        ...(cutList.length ? { cutBp: between.cutBp, cuts: cutList } : {}),
        ...(outsideBp ? { outsideSavedDataBp: outsideBp } : {}),
        ...(j.nBases ? { nBases: j.nBases } : {}),
        ...(j.allN.length ? { allNnodes: j.allN.map(String) } : {}),
      };
    }
    const apart = Math.max(0, mine.lo - facing.hi);
    if (cutList.length || facing.path !== mine.path) arr.type = "across a cut";
    else if (apart === 0) arr.type = "tandem";
    else if (apart <= SPACER_MAX) {
      arr.type = "tandem with a spacer";
      arr.spacerBp = apart;
      arr.spacerN = nBases;
    } else {
      arr.type = "dispersed";
      arr.local = hi - lo <= LOCAL_BP;
    }
    return out;
  });
  copies.forEach((c, k) => coverOfCopy.set(c, { cover: intersect(covers[k], sRanges), stretch }));
  for (const c of copies) if (c.startsAt === "other sequence between" && c.arrangement.between) c.startsAt = `other sequence between (${fmt(c.arrangement.between.bp)} bp)`;
  for (const c of copies) if (c.mightBeMore) flags.mightBeMore.push({ copy: c.label, by: c.stoppedBy ?? "" });

  base.duplication = true;
  base.copies = copies;
  const numbered = copies.filter((c) => !c.inPlace);
  const more = numbered.filter((c) => c.mightBeMore).length;
  base.title = {
    copies: numbered.length,
    inPlace: copies.some((c) => c.inPlace),
    ...(more ? { mightBeMore: more } : {}),
    text: `${numbered.length} ${numbered.length === 1 ? "copy" : "copies"}${more ? `, ${more} might be more` : ""}`,
    note: "the numbered copies only; the copy in place has no number and is not counted",
  };
  if (leaving) {
    const j = leaving.j;
    base.leavingJunction = {
      sides: j.text,
      kind: j.kind,
      type: j.cut ? "cut" : j.type === "edge" ? "edge" : "spacer",
      own: toReal(frame, [j.lo, j.hi]),
      ownBp: j.ownBp,
      ...(j.cut ? { cutBp: total(cutsBetween(j.lo, j.hi).map((it) => [it.lo, it.hi] as Range)), cuts: cutsBetween(j.lo, j.hi).map((it) => cutOut(frame, it)) } : {}),
      ...(j.nBases ? { nBases: j.nBases } : {}),
      ...(j.allN.length ? { allNnodes: j.allN.map(String) } : {}),
      where: leaving.where,
    };
  } else if (inPlaceChain) base.leavingJunction = null;

  /* ── What is in place, reported ──────────────────────────────────── */
  const inPlaceCopy = copies.find((c) => c.inPlace);
  if (inPlaceChain) {
    const chain = inPlaceChain;
    /** CHM13 bases of known nodes inside the view a pass reads on the chain. */
    const viewRead = (pass: DupPass) => {
      let bp = 0;
      for (const st of pass.steps) {
        if (st.lo < chain.lo || st.hi > chain.hi) continue;
        const c = known.get(st.id);
        if (c) bp += Math.max(0, Math.min(c.pos + c.len, view[1]) - Math.max(c.pos, view[0]));
      }
      return bp;
    };
    const on = frame.passes
      .filter((pass) => pass.hi > chain.lo && pass.lo < chain.hi)
      .map((pass) => ({ pass: pass.name, viewReadBp: viewRead(pass), part: toReal(frame, [Math.max(pass.lo, chain.lo), Math.min(pass.hi, chain.hi)]) }));
    on.sort((p, q) => q.viewReadBp - p.viewReadBp);
    base.inPlace = {
      by: leftIn ? (rightIn && leftChain === rightChain ? "both anchor sites" : "the left anchor site") : "the right anchor site",
      reading: {
        own: inPlaceCopy?.own ?? toReal(frame, [chain.lo, chain.hi]),
        ownBp: inPlaceCopy?.ownBp ?? 0,
        coversOfTheStretch: inPlaceCopy?.coversOfTheStretch ?? 0,
        note: "the in-place chain's reading of the duplicated stretch: the copy in place, not numbered",
      },
      ...(rightCopyChain
        ? {
            onTheRight: {
              chain: chainOut(frame, rightCopyChain, junctions),
              note: "another chain is in place by the right anchor site: its readings of the duplicated stretch are copies, the rest of it is in place on the right",
            },
          }
        : {}),
      contigReadIn: frame.reverse ? "reverse orientation (the in-place chain reads CHM13's other strand): own order is read backwards" : "forward orientation",
      passes: on,
      chain: chainOut(frame, chain, junctions),
    };
  }

  /* ── Roles ────────────────────────────────────────────────────────── */
  const paints: Paint[] = [];
  if (rightCopyChain) paints.push({ lo: rightCopyChain.lo, hi: rightCopyChain.hi, role: "in place on the right" });
  for (const work of works) {
    if (work.inPlace) continue;
    /* Part by part: what lies between two parts of a copy is not it. */
    for (const p of work.parts) paints.push({ lo: p.lo, hi: p.hi, role: p.inPlaceRight ? `in place on the right (${work.label})` : work.label, copy: work.n });
  }
  if (inPlaceChain) paints.push({ lo: inPlaceChain.lo, hi: inPlaceChain.hi, role: "in place" });
  base.passes = passesOut(loc, paints, known, "other sequence");

  /* A copy at its contig's end: the copy itself reaching it. */
  for (const c of copies) {
    if (!flags.atContigEnd.some((e) => e.at !== undefined && (e.at === c.own[0] || e.at === c.own[1]))) continue;
    c.atContigEnd = true;
    flags.atContigEnd.push({ copy: c.label, what: "the copy reaches the contig's end" });
  }

  /* A contig with an anchor site on both sides sets the stretch and the
     junction for the haplotype's other contigs. */
  const sets: Setter | null =
    !setter && base.anchorSites.left && base.anchorSites.right
      ? { contig: w.contig, stretch, junction: leaving && shortSpacer(leaving.j) ? { key: leaving.j.key, text: leaving.j.text } : null, lastN: n, lastLabel: works[works.length - 1]?.label ?? "" }
      : null;
  if (setter) {
    setter.lastN = n;
    if (works.length) setter.lastLabel = works[works.length - 1].label;
  }
  return { out: base, setter: sets };
}

/** The bases of the stretch each copy covers, with the stretch they are
    of: kept until every contig is done. */
const coverOfCopy = new WeakMap<DupCopyOut, { cover: Range[]; stretch: StretchPiece[] }>();

/** What each copy covers alone: the bases of the stretch that no other
    copy of the haplotype covers. Copies of one stretch are judged
    together, whatever contig they lie on. */
function coveredAlone(contigs: ContigDuplications[]): void {
  const all = contigs.flatMap((c) => c.copies ?? []);
  for (const copy of all) {
    const mine = coverOfCopy.get(copy);
    if (!mine) continue;
    const others = union(all.flatMap((other) => (other !== copy && coverOfCopy.get(other)?.stretch === mine.stretch ? coverOfCopy.get(other)!.cover : [])));
    const alone = total(mine.cover) - shared(mine.cover, others);
    if (alone > 0) copy.coveredByThisCopyAloneBp = alone;
  }
}

/** The parts of `x` inside `y`: both sorted and disjoint. */
function intersect(x: Range[], y: Range[]): Range[] {
  const out: Range[] = [];
  let i = 0;
  let j = 0;
  while (i < x.length && j < y.length) {
    const lo = Math.max(x[i][0], y[j][0]);
    const hi = Math.min(x[i][1], y[j][1]);
    if (hi > lo) out.push([lo, hi]);
    if (x[i][1] < y[j][1]) i++;
    else j++;
  }
  return out;
}

/* ── The finder ─────────────────────────────────────────────────────── */

/**
 * One haplotype: the trigger per contig, the walk of each contig with a
 * pass in view, and what each walk shows. Pure but for `input`, which the
 * walk reads.
 */
export function findDuplications(input: DupInput, known: KnownChm13, options: DupOptions): HaplotypeDuplications {
  const { limits } = options;
  const byContig = new Map<string, DupPass[]>();
  for (const pass of input.passes) {
    const list = byContig.get(pass.contig);
    if (list) list.push(pass);
    else byContig.set(pass.contig, [pass]);
  }
  for (const list of byContig.values()) list.sort((p, q) => p.lo - q.lo || q.hi - p.hi);
  const names = [...byContig.keys()].sort();

  /* ── 1. The trigger, per contig, from the fetch alone ────────────── */
  /* Its passes read twice a node the fetch gives a CHM13 position for: a
     node of the band's CHM13 path or a context node; in two passes, or
     in one pass reading back over it. */
  const positioned = (id: number) => options.band.has(id) || (options.positioned?.has(id) ?? false);
  const trigger: DupTriggerContig[] = names.map((contig) => {
    const passes = byContig.get(contig)!;
    const counts = new Map<number, { n: number; len: number }>();
    /* A step two passes overlap on is one reading, counted once. */
    const counted = new Set<string>();
    const again: string[] = [];
    let seams = 0;
    for (const pass of passes) {
      const seen = new Set<number>();
      let twice = false;
      if (!pass.steps.some((st) => known.has(st.id))) seams += 1;
      for (const st of pass.steps) {
        if (!positioned(st.id)) continue;
        if (seen.has(st.id)) twice = true;
        seen.add(st.id);
        const key = `${st.path}:${st.lo}`;
        if (counted.has(key)) continue;
        counted.add(key);
        const have = counts.get(st.id);
        if (have) have.n += 1;
        else counts.set(st.id, { n: 1, len: st.hi - st.lo });
      }
      if (twice) again.push(pass.name);
    }
    let nodes = 0;
    let bp = 0;
    let onBand = 0;
    for (const [id, c] of counts) {
      if (c.n < 2) continue;
      nodes += 1;
      bp += c.len;
      if (options.band.has(id)) onBand += 1;
    }
    return { contig, fired: nodes > 0, passes: passes.length, seams, nodesReadTwice: nodes, bpReadTwice: bp, ofThemOnTheBandsCHM13Path: onBand, passesReadingANodeTwice: again };
  });
  const fired = trigger.some((t) => t.fired);
  if (!fired) return noTrigger(input, known, { fired, contigs: trigger }, names, byContig, limits);

  /* ── 2-10. Each contig: those with a trigger first, by name ──────── */
  const order = [...trigger.filter((t) => t.fired), ...trigger.filter((t) => !t.fired)];
  const contigs: ContigDuplications[] = [];
  let setter: Setter | null = null;
  for (const t of order) {
    const only: Range[] | null = setter ? setter.stretch.map((p) => [p.lo, p.hi] as Range) : null;
    const w = walkContig(t.contig, byContig.get(t.contig)!, input, known, limits, only);
    const done = analyseContig(w, known, options, t.fired, setter);
    contigs.push(done.out);
    if (!setter && done.setter) setter = done.setter;
  }
  coveredAlone(contigs);
  return {
    haplotype: input.haplotype,
    trigger: { fired, contigs: trigger },
    contigs,
    duplication: contigs.some((c) => c.duplication),
    walked: true,
    inversionsInPlace: contigs.flatMap((c) => c.inversionsInPlace.map((x) => ({ contig: c.contig, ...x }))),
    passes: contigs.flatMap((c) => c.passes.map((p) => ({ contig: c.contig, ...p }))),
  };
}

/** No trigger: nothing is walked. The passes are reported as they are,
    with any inversion in place inside one. */
function noTrigger(
  input: DupInput,
  known: KnownChm13,
  trigger: HaplotypeDuplications["trigger"],
  names: string[],
  byContig: Map<string, DupPass[]>,
  limits: DupLimits,
): HaplotypeDuplications {
  const inversionsInPlace: DupInversionOut[] = [];
  const passes: DupPassOut[] = [];
  for (const contig of names) {
    for (const pass of byContig.get(contig)!) {
      const frame: Frame = { contig, reverse: false, items: pass.steps, passes: [pass] };
      const pieces = piecesOf(frame, known);
      const junctions = pieces.slice(1).map((b, i) => junctionOf(frame, pieces[i], b));
      for (const c of chainsOf(pieces, junctions, limits.inversionEndBp)) {
        for (const x of c.inversions) inversionsInPlace.push({ contig, pass: pass.name, ...inversionOut(frame, x) });
      }
      let same = 0;
      let other = 0;
      for (const st of pass.steps) {
        const c = known.get(st.id);
        if (!c) continue;
        if (c.reverse === st.reverse) same += c.len;
        else other += c.len;
      }
      const role = pass.steps.some((s) => known.has(s.id)) ? "pass, not walked" : "seam";
      passes.push({
        name: pass.name,
        contig,
        own: [pass.lo, pass.hi],
        chm13: passChm13(pass, known),
        strandBp: { chm13Strand: same, otherStrand: other },
        role,
        roles: [{ own: [pass.lo, pass.hi], role }],
        blocks: passBlocks(frame, pieces, pass),
      });
    }
  }
  return { haplotype: input.haplotype, trigger, duplication: false, walked: false, inversionsInPlace, passes };
}

/* ══════════════════════════════════════════════════════════════════════════
   The walk on the database: the GBWT.
   ══════════════════════════════════════════════════════════════════════════ */

const flip = (handle: number): number => encodeNode(nodeId(handle), !isReverse(handle));

/** A place on a haplotype's path: a GBWT position, on its path's forward
    sequence or (rev) its reverse one. Either way `fwd` is the handle the
    forward path reads there. */
interface Cursor {
  pos: Pos;
  rev: boolean;
}

const fwdOf = (c: Cursor) => (c.rev ? flip(c.pos.node) : c.pos.node);

/** One step along the path: right (own increasing) or left. */
function stepCursor(cache: RecordCache, c: Cursor, dir: 1 | -1): Cursor | null {
  const forwardOnSequence = (dir > 0) !== c.rev;
  const next = forwardOnSequence ? after(cache, c.pos) : before(cache, c.pos);
  return next ? { pos: next, rev: c.rev } : null;
}

/** The handles of a walk in its path's forward order (see toJson). */
const forwardOrder = (info: PathInfo): number[] => (info.backward ? info.path.map(flip).reverse() : info.path);

/** The database side of one haplotype. */
export class GbwtInput implements DupInput {
  readonly haplotype: string;
  passes: DupPass[] = [];
  private readonly cursors = new Map<DupPass, { left: Cursor; right: Cursor } | null>();
  private readonly infos = new Map<DupPass, { info: PathInfo; handles: number[] }>();
  private readonly ends = new Map<number, number>();
  private readonly contigPaths = new Map<string, GbzPath[]>();

  constructor(
    private readonly cache: RecordCache,
    private readonly source: GbzSource,
    private readonly sample: string,
    private readonly hap: number,
  ) {
    this.haplotype = `${sample}#${hap}`;
  }

  private lenOf(handle: number): number {
    return this.cache.get(handle)?.sequenceLength ?? 0;
  }

  private nOf(handle: number): number {
    const seq = this.cache.get(handle)?.sequence ?? "";
    let n = 0;
    for (let i = 0; i < seq.length; i++) if (seq[i] === "N" || seq[i] === "n") n++;
    return n;
  }

  private stepAt(handle: number, lo: number, path: number): DupStep {
    const len = this.lenOf(handle);
    return { kind: "step", lo, hi: lo + len, id: nodeId(handle), reverse: isReverse(handle), path, n: this.nOf(handle) };
  }

  /** Adds an array the worker returns, as a pass. */
  addPass(info: PathInfo, path: GbzPath): void {
    if (info.pathHandle === null || info.fragmentStart === null) return;
    const handles = forwardOrder(info);
    const lo = path.fragment + info.fragmentStart;
    const steps: DupStep[] = [];
    let at = lo;
    for (const h of handles) {
      const st = this.stepAt(h, at, path.handle);
      steps.push(st);
      at = st.hi;
    }
    const pass: DupPass = { name: `${path.sample}#${path.haplotype}#${path.contig}[${lo}-${lo + info.len}]`, contig: path.contig, path: path.handle, lo, hi: at, steps };
    this.passes.push(pass);
    this.infos.set(pass, { info, handles });
  }

  /** The GBWT positions at a pass's first and last steps. A joined walk
      keeps the position of the fragment it started from (see
      mergeFragments), so the one its `start` names is found among its
      steps and checked by stepping along them. */
  private cursorsOf(pass: DupPass): { left: Cursor; right: Cursor } | null {
    if (this.cursors.has(pass)) return this.cursors.get(pass)!;
    const { info, handles } = this.infos.get(pass)!;
    const candidates: Array<{ c: Cursor; k: number }> = [];
    const last = handles.length - 1;
    if (!info.tail && !info.backward && handles[0] === info.start.node) candidates.push({ c: { pos: info.start, rev: false }, k: 0 });
    if (!info.tail && info.backward && handles[last] === flip(info.start.node)) candidates.push({ c: { pos: info.start, rev: true }, k: last });
    handles.forEach((h, k) => {
      if (h === info.start.node) candidates.push({ c: { pos: info.start, rev: false }, k });
      if (h === flip(info.start.node)) candidates.push({ c: { pos: info.start, rev: true }, k });
    });
    let found: { left: Cursor; right: Cursor } | null = null;
    for (const { c, k } of candidates) {
      const toward = (dir: 1 | -1, until: number): Cursor | null => {
        let cur: Cursor | null = c;
        for (let i = k; i !== until; i += dir) {
          cur = cur ? stepCursor(this.cache, cur, dir) : null;
          if (!cur || fwdOf(cur) !== handles[i + dir]) return null;
        }
        return cur;
      };
      const left = toward(-1, 0);
      const right = left ? toward(1, last) : null;
      if (left && right) {
        found = { left, right };
        break;
      }
    }
    this.cursors.set(pass, found);
    return found;
  }

  private pathsOfContig(contig: string): GbzPath[] {
    let list = this.contigPaths.get(contig);
    if (!list) {
      list = pathsOf(this.source)
        .filter((p) => p.sample === this.sample && p.haplotype === this.hap && p.contig === contig)
        .sort((p, q) => p.fragment - q.fragment);
      this.contigPaths.set(contig, list);
    }
    return list;
  }

  private pathRow(handle: number): GbzPath | null {
    return this.source.getPath(handle);
  }

  walk(pass: DupPass, dir: 1 | -1): DupWalker {
    const cursors = this.cursorsOf(pass);
    const contig = pass.contig;
    let path = this.pathRow(pass.path);
    let cur: Cursor | null = cursors ? (dir > 0 ? cursors.right : cursors.left) : null;
    let own = dir > 0 ? pass.hi : pass.lo;
    let pending: DupItem | null = null;
    return {
      next: (): DupItem | DupEnd => {
        if (pending) {
          const p = pending;
          pending = null;
          return p;
        }
        if (!cur || !path) return { kind: "end", own, why: "walk not placed", reason: "the pass's positions on the GBWT do not check out" };
        const next = stepCursor(this.cache, cur, dir);
        if (next) {
          cur = next;
          const h = fwdOf(next);
          const len = this.lenOf(h);
          const st = this.stepAt(h, dir > 0 ? own : own - len, path.handle);
          own = dir > 0 ? own + len : own - len;
          return st;
        }
        const list = this.pathsOfContig(contig);
        const k = list.findIndex((p) => p.handle === path!.handle);
        if (dir > 0) {
          this.ends.set(path.handle, own);
          const to = list[k + 1];
          if (!to) return { kind: "end", own, why: "contig end" };
          const hole: DupHole = { kind: "hole", lo: own, hi: to.fragment, why: "cut", from: path.handle, to: to.handle };
          cur = { pos: { node: to.fwNode, offset: to.fwOffset }, rev: false };
          path = to;
          own = to.fragment;
          const st = this.stepAt(fwdOf(cur), own, to.handle);
          own = st.hi;
          pending = st;
          return hole;
        }
        const from = list[k - 1];
        if (!from) return { kind: "end", own, why: "contig start" };
        if (from.revNode === undefined || from.revOffset === undefined) {
          return { kind: "end", own, why: "walk not placed", reason: `the source gives no way back onto GBWT path ${from.handle} across the cut` };
        }
        const start: Cursor = { pos: { node: from.revNode, offset: from.revOffset }, rev: true };
        const end = this.pathEnd(from);
        if (end === null) return { kind: "end", own, why: "walk not placed", reason: `no sampled position within 100 steps of GBWT path ${from.handle}'s end` };
        this.ends.set(from.handle, end);
        const hole: DupHole = { kind: "hole", lo: end, hi: own, why: "cut", from: from.handle, to: path.handle };
        cur = start;
        path = from;
        const st = this.stepAt(fwdOf(start), 0, from.handle);
        const len = st.hi;
        pending = { ...st, lo: end - len, hi: end };
        own = end - len;
        return hole;
      },
    };
  }

  /** Where a GBWT path ends in own coordinates, read from its reverse
      sequence; null where the source gives no way onto it. */
  private pathEnd(row: GbzPath): number | null {
    const have = this.ends.get(row.handle);
    if (have !== undefined) return have;
    const end = pathEndOf(this.cache, row);
    if (end !== null) this.ends.set(row.handle, end);
    return end;
  }

  cutsBetween(from: number, to: number): Range[] | null {
    const a = this.pathRow(from);
    if (!a) return null;
    const list = this.pathsOfContig(a.contig);
    const i = list.findIndex((p) => p.handle === from);
    const j = list.findIndex((p) => p.handle === to);
    if (i < 0 || j < 0 || j < i) return null;
    const out: Range[] = [];
    for (let k = i; k < j; k++) {
      const end = this.pathEnd(list[k]);
      if (end === null) return null;
      out.push([end, list[k + 1].fragment]);
    }
    return out;
  }
}

/** Where a GBWT path ends in own coordinates: walking its reverse
    sequence from its start (the path's last node), the first sampled
    visit within 100 steps names its own position, as nameWalksPastEdge
    does. Null where the source does not read the reverse start, or no
    sampled visit lies that near. */
export function pathEndOf(cache: RecordCache, path: GbzPath): number | null {
  if (path.revNode === undefined || path.revOffset === undefined) return null;
  let pos: Pos | null = { node: path.revNode, offset: path.revOffset };
  let bp = 0;
  for (let i = 0; i < 100 && pos; i++) {
    const record = cache.get(pos.node);
    if (!record) return null;
    bp += record.sequenceLength;
    const anchor = record.anchorAt(pos.offset);
    if (anchor && anchor.seqId === 2 * path.handle + 1) return path.fragment + anchor.bpOffset + bp;
    const next = after(cache, pos);
    if (!next) return path.fragment + bp;
    pos = next;
  }
  return null;
}

/** CHM13 over [from, to) of the reference path, with each node's strand
    from the walk. */
export function knownFromReference(
  cache: RecordCache,
  source: GbzSource,
  reference: GbzPath,
  refWalk: PathInfo,
  window: [number, number],
  from: number,
  to: number,
): KnownChm13 {
  /* Its own cover, not the one kept per source across queries: what the
     finder enumerates must not change a later fetch without it. */
  const ctx: Context = { cache, source, reference, cover: { covered: [], at: new Map() }, onWalk: new Set(refWalk.path.map(nodeId)), window };
  const known: KnownChm13 = new Map();
  enumerateReference(ctx, from, to, (id, record, at, pos) => {
    if (at < from || at >= to) return;
    if (!known.has(id)) known.set(id, { pos: at, len: record.sequenceLength, reverse: isReverse(pos.node) });
  });
  return known;
}

/** What the last bandDuplications cost, for runWorker's report: in all,
    for the known CHM13, and per haplotype. */
export const dupStats: { ms: number; knownMs: number; knownNodes: number; perHaplotype: Record<string, number> } = { ms: 0, knownMs: 0, knownNodes: 0, perHaplotype: {} };

/**
 * The finder for the shown haplotypes of one fetch (subgraph.ts): CHM13
 * enumerated over the band +- knownBp (a node known when its CHM13 start
 * lies inside, its strand from the walk), each haplotype's arrays as its
 * passes, walked on the GBWT. Keyed `sample#haplotype`.
 */
export function bandDuplications(args: {
  cache: RecordCache;
  source: GbzSource;
  reference: GbzPath;
  refWalk: PathInfo;
  paths: PathInfo[];
  /** The reference walk's interval, contig coordinates. */
  band: [number, number];
  view: [number, number];
  haplotypes: string[];
  /** Context nodes the fetch gives a CHM13 position for (its
      referenceAt), as far as known here. */
  positioned?: Iterable<number>;
  limits?: Partial<DupLimits>;
}): Record<string, HaplotypeDuplications> {
  const t0 = performance.now();
  const limits: DupLimits = { ...DUP_LIMITS, ...(args.limits ?? {}) };
  const { cache, source, reference, refWalk, band } = args;
  const wanted = new Set(args.haplotypes);
  const from = Math.max(reference.fragment, band[0] - limits.knownBp);
  const to = band[1] + limits.knownBp;
  const bandNodes = new Set(refWalk.path.map(nodeId));
  const positioned = new Set(args.positioned ?? []);
  const inputs = new Map<string, GbwtInput>();
  const seen = new Set<string>();
  for (const info of args.paths) {
    if (info === refWalk || info.pathHandle === null || info.fragmentStart === null) continue;
    const key = `${info.pathHandle}:${info.fragmentStart}:${info.len}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const row = source.getPath(info.pathHandle);
    if (!row) continue;
    /* Another walk of the reference: the fetch places its nodes on CHM13. */
    if (row.sample === reference.sample && row.haplotype === reference.haplotype && row.contig === reference.contig) {
      for (const h of info.path) if (!bandNodes.has(nodeId(h))) positioned.add(nodeId(h));
      continue;
    }
    const hap = `${row.sample}#${row.haplotype}`;
    if (!wanted.has(hap)) continue;
    let input = inputs.get(hap);
    if (!input) inputs.set(hap, (input = new GbwtInput(cache, source, row.sample, row.haplotype)));
    input.addPass(info, row);
  }
  const out: Record<string, HaplotypeDuplications> = {};
  dupStats.knownMs = 0;
  dupStats.knownNodes = 0;
  dupStats.perHaplotype = {};
  /* No shown haplotype with an array here: nothing to find, nothing read. */
  if (![...inputs.values()].some((input) => input.passes.length)) {
    dupStats.ms = performance.now() - t0;
    return out;
  }
  const tKnown = performance.now();
  const known = knownFromReference(cache, source, reference, refWalk, band, from, to);
  dupStats.knownMs = performance.now() - tKnown;
  dupStats.knownNodes = known.size;
  for (const hap of args.haplotypes) {
    const input = inputs.get(hap);
    if (!input || !input.passes.length) continue;
    const t1 = performance.now();
    out[hap] = findDuplications(input, known, { view: args.view, band: bandNodes, positioned, limits });
    dupStats.perHaplotype[hap] = performance.now() - t1;
  }
  dupStats.ms = performance.now() - t0;
  return out;
}

/** What the finder says of one array: its role, its parts' roles when
    it has several, and its blocks. */
export interface ArrayRole {
  role: string;
  parts?: Array<{ start: number; end: number; role: string }>;
  blocks: Array<{ start: number; end: number; chm13: Range; strand: "CHM13's" | "other" }>;
}

/** Each array's role, from its haplotype's report: the role of the part
    holding most of its bases, its parts when it has several, and the
    blocks it reads (own range, the CHM13 they read, strand). */
export function rolesOf(report: HaplotypeDuplications): Map<string, ArrayRole> {
  const out = new Map<string, ArrayRole>();
  for (const pass of report.passes) {
    out.set(pass.name, {
      role: pass.role,
      ...(pass.roles.length > 1 ? { parts: pass.roles.map((r) => ({ start: r.own[0], end: r.own[1], role: r.role })) } : {}),
      blocks: pass.blocks.map((b) => ({ start: b.own[0], end: b.own[1], chm13: b.chm13, strand: b.strand })),
    });
  }
  return out;
}
