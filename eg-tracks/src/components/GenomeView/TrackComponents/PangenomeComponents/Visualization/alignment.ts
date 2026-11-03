/* ══════════════════════════════════════════════════════════════════════════
   gbz-base's rule for what a bubble is, and the placement of a bubble on
   the reference: what rowAlign.ts builds the linear view's rows on.

   A bubble is one stretch where a haplotype's walk and the reference's
   differ: the haplotype's bases on one side, the reference's on the other.
   The rule is gbz-base's (`align` in its subgraph.rs), followed exactly,
   so that what the browser draws can be checked against `query --cigar`:
   both sides' bases are joined; the matching prefix and suffix come off
   base by base, across node boundaries; what is left is classified by its
   two lengths with vg's scores (match +1, mismatch -4, gap open -6, gap
   extend -1): nothing on the haplotype's side is a deletion, nothing on
   the reference's an insertion, both nothing a match (the same bases
   through other nodes); otherwise the shorter side is paired base for
   base and the surplus is one gap after it, unless an insertion plus a
   deletion scores better, which makes it a replacement with no pairing at
   all. gbz-base writes the pairs before the gap, and M for match and
   mismatch alike.

   Placement (rule C of the browser's own): the bubble's reference span is
   filled from its left end; bases beyond it are shown after the bases
   they replace, as a mark that takes no room on the reference axis;
   reference the haplotype lacks is white. `Part` is that placement, in
   bases along the reference, and is the only placement anything draws.

   Where the bubbles are - which steps anchor and which are a bubble's
   haplotype side - is rowAlign.ts's pointer rule, not gbz-base's
   weighted longest common subsequence (PLAN-rows.md, 2026-11-03).
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

/* ── gbz-base's bubble rule ───────────────────────────────────────── */

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

/** The placement of a closed bubble from its alignment: rule C. */
export function placeClosed(aligned: Aligned, refAt: number, hapSeq: string): Part[] {
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
