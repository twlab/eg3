/* ══════════════════════════════════════════════════════════════════════════
   A haplotype's walk against the reference's: the alignment the linear
   view is drawn from.

   The rule is gbz-base's (`align_to_ref` and `align` in its subgraph.rs),
   followed exactly where it applies, so that what the browser draws can be
   checked against `query --cigar`:

     1. Anchors. The longest common subsequence of the two walks over
        oriented nodes, weighted by node length. Each pair of consecutive
        anchors closes a bubble.
     2. Inside a bubble. Both sides' bases are joined; the matching prefix
        and suffix come off base by base, across node boundaries; what is
        left is classified by its two lengths with vg's scores (match +1,
        mismatch -4, gap open -6, gap extend -1): nothing on the haplotype's
        side is a deletion, nothing on the reference's an insertion, both
        nothing a match (the same bases through other nodes); otherwise the
        shorter side is paired base for base and the surplus is one gap after
        it, unless an insertion plus a deletion scores better, which makes it
        a replacement with no pairing at all. gbz-base writes the pairs before
        the gap, and M for match and mismatch alike.

   And three rules of the browser's own, which gbz-base does not have:

     A. Open ends. The run before the first anchor, or after the last, is
        placed outward from the junction and gets no alignment and no class:
        gbz-base pads it against whatever reference is in the window, which
        is noise. The ops gbz-base would write are still produced, for the
        check, and `closedCigar` leaves them out.
     B. Inversions. A closed bubble whose haplotype side anchors to the
        reference side only when flipped (read back to front, each node on
        the other strand) is an inversion: the reference span between its
        anchors, drawn arrowed, with whatever differs inside it aligned on
        the flipped strand by the same rule. gbz-base, matching oriented
        nodes, sees unrelated nodes there and writes mismatches or an
        insertion plus a deletion. A whole piece read backwards - a contig
        stored on the other strand, a window inside an inversion - is aligned
        flipped as a whole, when it anchors nothing on its own strand. A
        piece that does anchor on its own strand is never turned over,
        however much of it is inverted. The gbz worker writes every piece in
        its path's own direction (its `backward` flag only says the piece was
        found through the path's reverse sequence), so a contig on the other
        strand arrives with every step reversed and no forward anchor.
     C. Placement. The bubble's reference span is filled from the left
        anchor; bases beyond it are shown after the bases they replace, as a
        mark that takes no room on the reference axis; reference the
        haplotype lacks is white. `parts` is that placement, in bases along
        the reference walk, and is the only placement anything draws.

   The reference implementation this was lifted from, and the checks that
   hold it to gbz-base's output on the HPRC database, are in
   eg3/claude-memory/rule.
   ══════════════════════════════════════════════════════════════════════════ */

/** One step of a walk: a node, and whether it is read on the other strand. */
export interface Step {
  id: string;
  reverse: boolean;
}

/** One piece of a haplotype's walk through the band, or the reference's. */
export interface Walk {
  name: string;
  /** `SAMPLE#HAP`, from the name. */
  key: string;
  steps: Step[];
  isReference: boolean;
  /** The worker found the piece through its path's reverse sequence. It
      is written in the path's own direction either way, so this changes
      nothing here; kept for the record. */
  backward?: boolean;
  /** gbz-base's own CIGAR, when the JSON carries one (`query --cigar`):
      what the check compares against. */
  cigar?: string;
}

/** What the alignment needs of a subgraph. */
export interface Graph {
  /** Node id -> its forward-strand sequence. */
  seq: Map<string, string>;
  walks: Walk[];
  reference: Walk | null;
  /** Carried through from a fixture, for the check. */
  note?: string;
  expect?: Record<string, { cigar?: string; classes?: string[] }>;
}

/* ── Loading ─────────────────────────────────────────────────────────── */

/**
 * A graph from subgraph JSON - the gbz worker's, with nodes and edges
 * keyed by node id, or gbz-base's `query --format json`, which lists them.
 * The reference is the walk flagged `is_reference`, or the first walk where
 * nothing is flagged, which is where gbz-base writes it.
 */
export function loadGraph(json: any): Graph {
  const seq = new Map<string, string>();
  if (Array.isArray(json.nodes)) {
    for (const node of json.nodes) seq.set(String(node.id), String(node.sequence ?? ""));
  } else {
    for (const [id, sequence] of Object.entries(json.nodes ?? {})) seq.set(id, String(sequence));
  }
  const raw: any[] = json.paths ?? [];
  const flagged = raw.some((p) => p.is_reference === true);
  const walks: Walk[] = raw.map((p, i) => {
    const name = String(p.name ?? `walk-${i}`);
    const match = /^(.*?)#(\d+)#/.exec(name);
    return {
      name,
      key: match ? `${match[1]}#${match[2]}` : name,
      steps: (p.path ?? []).map((s: any) => ({ id: String(s.id), reverse: !!s.is_reverse })),
      isReference: flagged ? p.is_reference === true : i === 0,
      ...(p.backward === true ? { backward: true } : {}),
      ...(p.cigar ? { cigar: String(p.cigar) } : {}),
    };
  });
  return {
    seq,
    walks,
    reference: walks.find((w) => w.isReference) ?? null,
    note: json.note,
    expect: json.expect,
  };
}

/* ── Sequences ───────────────────────────────────────────────────────── */

const COMPLEMENT: Record<string, string> = {
  A: "T", C: "G", G: "C", T: "A", N: "N",
  a: "t", c: "g", g: "c", t: "a", n: "n",
};

export function reverseComplement(s: string): string {
  let out = "";
  for (let i = s.length - 1; i >= 0; i--) out += COMPLEMENT[s[i]] ?? s[i];
  return out;
}

/** A step's bases as the walk reads them. */
export const stepSeq = (g: Graph, s: Step): string => {
  const forward = g.seq.get(s.id) ?? "";
  return s.reverse ? reverseComplement(forward) : forward;
};

/** An oriented node, as gbz-base's handles are: `12+` and `12-` differ. */
export const handle = (s: Step) => `${s.id}${s.reverse ? "-" : "+"}`;

/** A run of steps read the other way: back to front, each on the other
    strand. What the reference sees of an inverted stretch. */
export const flip = (steps: Step[]): Step[] =>
  [...steps].reverse().map((s) => ({ id: s.id, reverse: !s.reverse }));

/* ── Weighted LCS ────────────────────────────────────────────────────── */

/**
 * Which longest-common-subsequence to run. Both give the same anchors; the
 * naive one is the definition, kept for the check, and the fast one is
 * what the browser runs.
 */
export type LcsMode = "fast" | "dp";

/**
 * The definition: dynamic programming over every pair of positions, O(n·m).
 * The traceback walks back from the end and skips a haplotype step, then a
 * reference step, whenever that keeps the weight, so among equal-weight
 * subsequences it lands on the one whose anchors come earliest. In
 * `A B A B C` against `A B C` the first `A B` is anchored and the second is
 * the insertion, as gbz-base's greedy LCS has it.
 */
export function weightedLcsDp(a: string[], b: string[], wa: number[]): Array<[number, number]> {
  const n = a.length;
  const m = b.length;
  const W = m + 1;
  const L = new Int32Array((n + 1) * (m + 1));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      let best = Math.max(L[(i - 1) * W + j], L[i * W + j - 1]);
      if (a[i - 1] === b[j - 1]) best = Math.max(best, L[(i - 1) * W + j - 1] + wa[i - 1]);
      L[i * W + j] = best;
    }
  }
  const out: Array<[number, number]> = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    const here = L[i * W + j];
    if (L[(i - 1) * W + j] === here) {
      i -= 1;
      continue;
    }
    if (L[i * W + j - 1] === here) {
      j -= 1;
      continue;
    }
    out.push([i - 1, j - 1]);
    i -= 1;
    j -= 1;
  }
  return out.reverse();
}

/** One anchor and the chain before it. Chains are never changed once made,
    so a chain built on another stays true when a better one later ends at
    the same place. */
interface Chain {
  i: number;
  j: number;
  weight: number;
  prev: Chain | null;
}

/**
 * The same subsequence in O((n + r) log m), r being the number of pairs of
 * steps that match at all: Hunt and Szymanski's form. Each haplotype step
 * is taken in order; for each place in the reference run it matches, from
 * the last to the first so the step cannot build on itself, the best chain
 * ending before that place is extended by it. A Fenwick tree over the
 * reference's places answers "the best chain ending before here", where
 * best is the greatest weight and, at equal weight, the earliest last
 * anchor (haplotype step first, then reference step) - the same choice the
 * definition's traceback makes.
 *
 * A band of the MHC has hundreds of walks of thousands of steps each, and
 * the definition's n·m cells per walk is seconds the browser cannot spend.
 * The pairs that match are nearly all one per step, so this is linear-ish.
 */
export function weightedLcsFast(a: string[], b: string[], wa: number[]): Array<[number, number]> {
  const m = b.length;
  if (!a.length || !m) return [];
  /* Where each oriented node occurs in the reference run, in order. */
  const at = new Map<string, number[]>();
  b.forEach((h, j) => {
    const list = at.get(h);
    if (list) list.push(j);
    else at.set(h, [j]);
  });
  const better = (x: Chain, y: Chain | null) =>
    !y ||
    x.weight > y.weight ||
    (x.weight === y.weight && (x.i < y.i || (x.i === y.i && x.j < y.j)));
  /* The tree is 1-based over the reference's places; a chain ending at
     place j is held at index j + 1. */
  const tree: Array<Chain | null> = new Array(m + 1).fill(null);
  const raise = (j: number, chain: Chain) => {
    for (let k = j + 1; k <= m; k += k & -k) {
      if (better(chain, tree[k])) tree[k] = chain;
    }
  };
  /* The best chain ending before place j. */
  const before = (j: number): Chain | null => {
    let best: Chain | null = null;
    for (let k = j; k > 0; k -= k & -k) {
      const chain = tree[k];
      if (chain && better(chain, best)) best = chain;
    }
    return best;
  };
  const ending: Array<Chain | null> = new Array(m).fill(null);
  let overall: Chain | null = null;
  for (let i = 0; i < a.length; i++) {
    const places = at.get(a[i]);
    if (!places) continue;
    for (let k = places.length - 1; k >= 0; k--) {
      const j = places[k];
      const prev = before(j);
      const chain: Chain = { i, j, weight: (prev?.weight ?? 0) + wa[i], prev };
      if (better(chain, ending[j])) {
        ending[j] = chain;
        raise(j, chain);
      }
      if (better(chain, overall)) overall = chain;
    }
  }
  const out: Array<[number, number]> = [];
  for (let chain = overall; chain; chain = chain.prev) out.push([chain.i, chain.j]);
  return out.reverse();
}

/* ── Inside a bubble: gbz-base's align() ─────────────────────────────── */

export type OpKind = "M" | "I" | "D";
export interface Op {
  op: OpKind;
  len: number;
}

export function pushOp(ops: Op[], op: OpKind, len: number): void {
  if (len <= 0) return;
  const last = ops[ops.length - 1];
  if (last && last.op === op) last.len += len;
  else ops.push({ op, len });
}

export const cigarOf = (ops: Op[]) => ops.map((o) => `${o.len}${o.op}`).join("");

/* vg's scores, as gbz-base applies them: a mismatch costs 4 a base, a gap
   6 to open and 1 for each further base. */
export const mismatchPenalty = (len: number) => 4 * len;
export const gapPenalty = (len: number) => (len === 0 ? 0 : 6 + (len - 1));

export function prefixMatches(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  let k = 0;
  while (k < n && a[k] === b[k]) k += 1;
  return k;
}

export function suffixMatches(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  let k = 0;
  while (k < n && a[a.length - 1 - k] === b[b.length - 1 - k]) k += 1;
  return k;
}

/** What a closed bubble is, by the two lengths left after trimming. */
export type BubbleClass =
  | "match"
  | "deletion"
  | "insertion"
  | "substitution"
  | "mismatch+gap"
  | "replacement";

export interface Aligned {
  prefix: number;
  suffix: number;
  hapMiddle: number;
  refMiddle: number;
  cls: BubbleClass;
  /** Bases paired one over one in the middle: the shorter side for a
      substitution or a mismatch+gap, none otherwise. */
  paired: number;
  /** The two scores the choice was made on, where there was one. */
  score: { mismatchIndel: number; insertionDeletion: number } | null;
  ops: Op[];
}

/** gbz-base's `align` on the bases of two diverging stretches. */
export function alignDiverging(hapSeq: string, refSeq: string): Aligned {
  const hapLen = hapSeq.length;
  const refLen = refSeq.length;
  const prefix = prefixMatches(hapSeq, refSeq);
  let suffix = suffixMatches(hapSeq, refSeq);
  if (prefix + suffix > hapLen) suffix = hapLen - prefix;
  if (prefix + suffix > refLen) suffix = refLen - prefix;
  const ops: Op[] = [];
  pushOp(ops, "M", prefix);
  const h = hapLen - prefix - suffix;
  const r = refLen - prefix - suffix;
  let cls: BubbleClass;
  let paired = 0;
  let score: Aligned["score"] = null;
  if (h === 0 && r === 0) cls = "match";
  else if (h === 0) {
    cls = "deletion";
    pushOp(ops, "D", r);
  } else if (r === 0) {
    cls = "insertion";
    pushOp(ops, "I", h);
  } else {
    const mm = Math.min(h, r);
    const mismatchIndel = mismatchPenalty(mm) + gapPenalty(h - mm) + gapPenalty(r - mm);
    const insertionDeletion = gapPenalty(h) + gapPenalty(r);
    score = { mismatchIndel, insertionDeletion };
    if (mismatchIndel <= insertionDeletion) {
      cls = h === r ? "substitution" : "mismatch+gap";
      paired = mm;
      pushOp(ops, "M", mm);
      pushOp(ops, "I", h - mm);
      pushOp(ops, "D", r - mm);
    } else {
      cls = "replacement";
      pushOp(ops, "I", h);
      pushOp(ops, "D", r);
    }
  }
  pushOp(ops, "M", suffix);
  return { prefix, suffix, hapMiddle: h, refMiddle: r, cls, paired, score, ops };
}

/* ── A walk against the reference ────────────────────────────────────── */

/** A bubble's class as the browser says it: gbz-base's, or one of its own. */
export type BrowserClass = BubbleClass | "inversion" | "open";

/**
 * One stretch of a haplotype's bar, in bases along the reference walk.
 * The only placement anything draws from.
 */
export type Part = PartBody & {
  /** The bases it holds, as a range of its bubble's haplotype side; a white
      part holds none. */
  hap?: [number, number];
};
type PartBody =
  /** Bases that equal the reference under them: plain bar. */
  | { kind: "match"; ref: number; len: number }
  /** Paired base for base and differing: letters. */
  | { kind: "mismatch"; ref: number; len: number; seq: string }
  /** The haplotype's bases over reference they replace with no pairing
      claimed: letters in the hatched style. */
  | { kind: "replaced"; ref: number; len: number; seq: string }
  /** Reference the haplotype skips: white, its size written in it. */
  | { kind: "white"; ref: number; len: number }
  /** Bases with no room: a mark at `ref`, after the bases they replace. */
  | { kind: "mark"; ref: number; len: number; seq: string }
  /** A reference stretch read on the other strand: arrowed. The parts of
      what differs inside it follow, on the same span. */
  | { kind: "inverted"; ref: number; len: number; seq: string }
  /** A run touching the reference at one end only, placed outward from
      the junction at `ref` - leftward for side "left" - with no class. */
  | { kind: "open"; ref: number; len: number; seq: string; side: "left" | "right" };

export interface Bubble {
  open: null | "left" | "right" | "both";
  /** Step index ranges, [from, to), in the walk as it was aligned - the
      flipped walk inside an inversion or a piece read backwards. */
  hap: [number, number];
  ref: [number, number];
  hapSeq: string;
  refSeq: string;
  /** Bases along the reference walk where the bubble's reference side
      starts; for an open end, where the junction is. */
  refAt: number;
  /** Bases along the haplotype's own walk where its side starts. */
  hapAt: number;
  /** gbz-base's alignment of the interval. For an open end or an inversion
      it is what gbz-base would write and the browser does not draw. */
  aligned: Aligned;
  cls: BrowserClass;
  parts: Part[];
  /** An inversion's inside: its own bubbles on the flipped strand, in
      reference order. */
  inside?: Bubble[];
  /** The bubble's haplotype bases run backwards against the haplotype's
      own coordinates: it is in a piece aligned flipped, or inside an
      inversion, but not both, which cancel. `hapAt` is still the lowest
      own offset of its bases. */
  flipped: boolean;
}

export interface WalkAlignment {
  walk: Walk;
  /** gbz-base's CIGAR for the piece, open ends included: the check. */
  cigar: string;
  ops: Op[];
  /** The CIGAR between the first and last anchor only. */
  closedCigar: string;
  anchors: Array<[number, number]>;
  bubbles: Bubble[];
  parts: Part[];
  /** Bases anchored. */
  weight: number;
  /** The piece was aligned flipped as a whole: everything is drawn
      arrowed, and its own coordinates run down along the reference. */
  reversed: boolean;
}

export interface AlignOptions {
  lcs?: LcsMode;
}

interface Core {
  anchors: Array<[number, number]>;
  bubbles: Bubble[];
  parts: Part[];
  ops: Op[];
  closedOps: Op[];
  weight: number;
}

/** The placement of a closed bubble from its alignment: rule C. */
function placeClosed(aligned: Aligned, refAt: number, hapSeq: string): Part[] {
  const parts: Part[] = [];
  const { prefix, suffix, hapMiddle: h, refMiddle: r, cls, paired } = aligned;
  if (prefix) parts.push({ kind: "match", ref: refAt, len: prefix, hap: [0, prefix] });
  const ref0 = refAt + prefix;
  const middle = hapSeq.slice(prefix, hapSeq.length - suffix);
  if (cls === "deletion") parts.push({ kind: "white", ref: ref0, len: r });
  else if (cls === "insertion") parts.push({ kind: "mark", ref: ref0, len: h, seq: middle, hap: [prefix, prefix + h] });
  else if (cls === "substitution") parts.push({ kind: "mismatch", ref: ref0, len: h, seq: middle, hap: [prefix, prefix + h] });
  else if (cls === "mismatch+gap") {
    parts.push({ kind: "mismatch", ref: ref0, len: paired, seq: middle.slice(0, paired), hap: [prefix, prefix + paired] });
    if (h > paired) parts.push({ kind: "mark", ref: ref0 + paired, len: h - paired, seq: middle.slice(paired), hap: [prefix + paired, prefix + h] });
    if (r > paired) parts.push({ kind: "white", ref: ref0 + paired, len: r - paired });
  } else if (cls === "replacement") {
    const over = Math.min(h, r);
    parts.push({ kind: "replaced", ref: ref0, len: over, seq: middle.slice(0, over), hap: [prefix, prefix + over] });
    if (h > over) parts.push({ kind: "mark", ref: ref0 + over, len: h - over, seq: middle.slice(over), hap: [prefix + over, prefix + h] });
    if (r > over) parts.push({ kind: "white", ref: ref0 + over, len: r - over });
  }
  if (suffix) parts.push({ kind: "match", ref: refAt + prefix + r, len: suffix, hap: [hapSeq.length - suffix, hapSeq.length] });
  return parts;
}

/**
 * A run of haplotype steps against a run of reference steps: the anchors,
 * and every interval between them as a bubble.
 *
 * `refBase` is where the reference run starts along the reference walk.
 * `ownAt` maps an offset and a length within the haplotype run to the
 * haplotype's own offset, which runs the other way inside a flipped run.
 * With `openEnds` the intervals before the first anchor and after the last
 * are open ends; inside an inversion they are closed by the inversion's
 * own anchors. `depth` stops an inversion being looked for inside one.
 */
function alignCore(
  g: Graph,
  hapSteps: Step[],
  refSteps: Step[],
  refBase: number,
  ownAt: (start: number, len: number) => number,
  openEnds: boolean,
  depth: number,
  lcs: LcsMode,
  flipped: boolean,
): Core {
  const lenOf = (s: Step) => (g.seq.get(s.id) ?? "").length;
  const hapHandles = hapSteps.map(handle);
  const refHandles = refSteps.map(handle);
  const hapWeights = hapSteps.map(lenOf);
  const refWeights = refSteps.map(lenOf);
  const refStart: number[] = [0];
  for (const s of refSteps) refStart.push(refStart[refStart.length - 1] + lenOf(s));
  const hapStart: number[] = [0];
  for (const s of hapSteps) hapStart.push(hapStart[hapStart.length - 1] + lenOf(s));
  const join = (steps: Step[]) => steps.map((s) => stepSeq(g, s)).join("");

  /* Over just the stretch of the reference run the haplotype's shared
     nodes span: every anchor is a shared node, so it lies between the first
     and last place one occurs, and nothing outside can change the answer. */
  const firstAt = new Map<string, number>();
  const lastAt = new Map<string, number>();
  refHandles.forEach((h, j) => {
    if (!firstAt.has(h)) firstAt.set(h, j);
    lastAt.set(h, j);
  });
  let lo = Infinity;
  let hi = -Infinity;
  for (const h of hapHandles) {
    const first = firstAt.get(h);
    if (first === undefined) continue;
    lo = Math.min(lo, first);
    hi = Math.max(hi, lastAt.get(h)!);
  }
  const run = lo === Infinity ? [] : refHandles.slice(lo, hi + 1);
  const found =
    lcs === "dp" ? weightedLcsDp(hapHandles, run, hapWeights) : weightedLcsFast(hapHandles, run, hapWeights);
  const anchors: Array<[number, number]> = found.map(([i, j]) => [i, j + lo]);
  let weight = 0;
  for (const [i] of anchors) weight += hapWeights[i];

  const ops: Op[] = [];
  const closedOps: Op[] = [];
  const bubbles: Bubble[] = [];
  const parts: Part[] = [];

  const interval = (ha: number, hb: number, ra: number, rb: number, open: Bubble["open"]) => {
    const hs = hapSteps.slice(ha, hb);
    const rs = refSteps.slice(ra, rb);
    if (!hs.length && !rs.length) return;
    const hapSeq = join(hs);
    const refSeq = join(rs);
    const aligned = alignDiverging(hapSeq, refSeq);
    for (const op of aligned.ops) pushOp(ops, op.op, op.len);
    const hapAt = ownAt(hapStart[ha], hapSeq.length);
    let cls: BrowserClass;
    let placed: Part[];
    let inside: Bubble[] | undefined;
    let refAt = refBase + refStart[ra];
    if (open) {
      /* Rule A: from the junction outward. A left end ends where the first
         anchor starts; a right end starts where the last anchor ended. */
      cls = "open";
      refAt = refBase + (open === "left" ? refStart[rb] : refStart[ra]);
      placed =
        hapSeq.length && open !== "both"
          ? [{ kind: "open", ref: refAt, len: hapSeq.length, seq: hapSeq, side: open, hap: [0, hapSeq.length] }]
          : [];
    } else {
      for (const op of aligned.ops) pushOp(closedOps, op.op, op.len);
      /* Rule B: the haplotype side, flipped, against the reference side.
         Its inside is the flipped side's own alignment, every interval
         closed by the inversion's anchors or by this bubble's. */
      const inner =
        depth === 0 && rs.length && hs.some((s) => s.reverse)
          ? alignCore(
              g,
              flip(hs),
              rs,
              refAt,
              /* Flipped once more: against its own coordinates the inside
                 runs forward again if this level was flipped, backwards if
                 it was not. */
              flipped
                ? (start) => hapAt + start
                : (start, len) => hapAt + (hapSeq.length - start - len),
              false,
              depth + 1,
              lcs,
              !flipped,
            )
          : null;
      if (inner && inner.anchors.length) {
        cls = "inversion";
        inside = inner.bubbles;
        placed = [
          { kind: "inverted", ref: refAt, len: refSeq.length, seq: hapSeq, hap: [0, hapSeq.length] },
          ...inner.parts.filter((p) => p.kind !== "match"),
        ];
      } else {
        cls = aligned.cls;
        placed = placeClosed(aligned, refAt, hapSeq);
      }
    }
    bubbles.push({
      open,
      hap: [ha, hb],
      ref: [ra, rb],
      hapSeq,
      refSeq,
      refAt,
      hapAt,
      aligned,
      cls,
      parts: placed,
      ...(inside ? { inside } : {}),
      flipped,
    });
    parts.push(...placed);
  };

  if (!anchors.length) {
    interval(0, hapSteps.length, 0, refSteps.length, openEnds ? "both" : null);
  } else {
    let ha = 0;
    let ra = 0;
    anchors.forEach(([ia, ib], k) => {
      interval(ha, ia, ra, ib, k === 0 && openEnds ? "left" : null);
      const len = refWeights[ib];
      pushOp(ops, "M", len);
      pushOp(closedOps, "M", len);
      parts.push({ kind: "match", ref: refBase + refStart[ib], len });
      ha = ia + 1;
      ra = ib + 1;
    });
    interval(ha, hapSteps.length, ra, refSteps.length, openEnds ? "right" : null);
  }
  return { anchors, bubbles, parts, ops, closedOps, weight };
}

/**
 * One piece of a haplotype's walk against the reference walk.
 *
 * The CIGAR is always gbz-base's view of the piece as given - never of a
 * flipped one - so the check against `query --cigar` holds whichever way
 * the piece is drawn.
 */
export function alignWalk(g: Graph, walk: Walk, reference: Walk, options: AlignOptions = {}): WalkAlignment {
  const lcs = options.lcs ?? "fast";
  const lenOf = (s: Step) => (g.seq.get(s.id) ?? "").length;
  const forward = alignCore(g, walk.steps, reference.steps, 0, (start) => start, true, 0, lcs, false);
  let core = forward;
  let reversed = false;
  /* Rule B's whole-piece case. The strand is the data's where it says:
     HG002#1 at chr14:54,811,500 reads 5.5 kb of 8 backwards and stays a
     forward piece with an inversion in it, because it anchors forward. */
  if (!forward.anchors.length && walk.steps.some((s) => s.reverse)) {
    const total = walk.steps.reduce((n, s) => n + lenOf(s), 0);
    const flipped = alignCore(
      g,
      flip(walk.steps),
      reference.steps,
      0,
      (start, len) => total - start - len,
      true,
      0,
      lcs,
      true,
    );
    if (flipped.anchors.length) {
      core = flipped;
      reversed = true;
    }
  }
  return {
    walk,
    cigar: cigarOf(forward.ops),
    ops: forward.ops,
    closedCigar: cigarOf(forward.closedOps),
    anchors: core.anchors,
    bubbles: core.bubbles,
    parts: core.parts,
    weight: core.weight,
    reversed,
  };
}

/** Every non-reference walk of a graph against its reference. */
export function alignGraph(g: Graph, options: AlignOptions = {}): WalkAlignment[] {
  if (!g.reference) return [];
  const ref = g.reference;
  return g.walks.filter((w) => w !== ref).map((w) => alignWalk(g, w, ref, options));
}
