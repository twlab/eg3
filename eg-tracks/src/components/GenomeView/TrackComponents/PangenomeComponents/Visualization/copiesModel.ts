/* ══════════════════════════════════════════════════════════════════════════
   A haplotype's copies, as the view draws them (PLAN-remastered-2.md
   sections 1b and 3, in eg3/claude-memory).

   A haplotype whose own sequence holds a stretch of the reference more
   than once comes through the view's nodes once per copy: each time is a
   pass, and each pass a row. The duplication finder (getRemoteData/gbz/
   duplications.ts) walks the haplotype's path and says where its copies
   are. This is the view's own description of that answer, per contig:

   - the ruler's span, in the haplotype's own coordinates, and the anchor
     sites at its ends: the reference just outside the duplicated stretch,
     read once; with them, all the walk reads in place outside the copies
     (`outside`): in a wide view a row runs on from the copy in place over
     reference far outside the stretch, and the anchor site is where the
     walk stopped, at that row's end;
   - the copies in own order. The copy in place - the one the walk runs
     into straight from an anchor site - is named so and not numbered; the
     others are numbered from 1 in own order (the user, 2026-11-15: "In
     place, then copy 1 etc"). None is chosen over the others. Each says how it follows the copy before it
     (tandem, with a spacer, dispersed, across a cut), how much of the
     duplicated stretch of the reference it covers (a share of the
     reference's own bases there, each counted once; no copy is measured
     against another, and none is called whole or partial: the user,
     2026-11-15), and what lies between it and the copy before: that goes on
     the line between them, not on the copy's tab;
   - what else the walk found: cuts (holes in the graph, where one of the
     contig's paths ends and the next starts) and the haplotype's own
     sequence that reads no reference;
   - where nothing is in place, no copies at all: one uncut stretch, and
     the tab says the number of copies is unknown (the user, 2026-11-14).

   `copiesOf` is the one place that reads the finder's answer, so a change
   of the finder changes this adapter and nothing else of the view.
   ══════════════════════════════════════════════════════════════════════════ */

/** A stretch of own sequence, lowest coordinate first. */
export type OwnRange = [number, number];

/** One part of a copy: read forward, or backward (on the other strand). */
export interface CopyPart {
  own: OwnRange;
  backward: boolean;
}

/** How a copy follows the one before it; the first is "first" unless it
    is the copy in place. */
export type CopyKind = "in place" | "tandem" | "tandem with a spacer" | "dispersed" | "across a cut" | "another contig" | "unknown" | "first";

/** What lies between a copy and the copy before it. */
export interface CopyBetween {
  /** Own bases between them; 0 when it follows straight on. */
  bp: number;
  /** A cut lies there: a hole in the graph. */
  cut: boolean;
  /** The cut's own size, when the finder says; the rest of `bp` is the
      haplotype's own sequence. Null when it does not say. */
  cutBp: number | null;
}

export interface ViewCopy {
  /** Its number among the contig's copies in own order, from 1; null for
      the copy in place, which is named and not numbered. */
  n: number | null;
  own: OwnRange;
  parts: CopyPart[];
  kind: CopyKind;
  /** The share of the duplicated stretch of the reference it covers, 0 to
      1, each reference base counted once. */
  covers: number;
  /** Null for the first copy. */
  between: CopyBetween | null;
}

/** A stretch of the ruler that is no copy and no anchor site: a cut (a
    hole in the graph), or a stretch not placed on CHM13 - one that reads
    none of the CHM13 the finder read (the region fetched and 150 kb either
    side, duplications.ts `knownBp`). That may be the haplotype's own
    sequence or CHM13 farther away (in a segmental duplication often
    another copy): nothing tells the two apart. The ruler labels it own
    sequence all the same, and its hover says it is not read in this CHM13
    region (the user, 2026-11-15: drawn as nothing, it read as a deletion).
    What lies between two copies is split by the finder's cuts, so each
    stretch is one or the other. */
export interface OtherStretch {
  own: OwnRange;
  kind: "cut" | "unplaced";
}

export interface ContigCopies {
  contig: string;
  /** The ruler's span. */
  span: OwnRange;
  anchors: { left: OwnRange | null; right: OwnRange | null };
  /** What is read in place outside the copies, the anchor sites with it:
      the reference there is read once. In own order, none touching the
      next. */
  outside: OwnRange[];
  /** Empty where nothing is in place: see `uncut`. */
  copies: ViewCopy[];
  /** Nothing in place: the stretch the walk found reading the duplicated
      stretch, not cut into copies. */
  uncut: OwnRange | null;
  others: OtherStretch[];
  /** The walk stopped at one of its limits: there may be more. */
  mightBeMore: boolean;
}

/* ── The finder's answer, as far as this reads it ─────────────────────── */

interface FoundBetween {
  own: OwnRange;
  bp: number;
  /** Own bases of it that are a cut: not in the graph. */
  cutBp: number;
}
interface FoundCopy {
  /** "in place", or "copy n". */
  label: string;
  inPlace?: boolean;
  n?: number;
  own: OwnRange;
  parts: Array<{ own: OwnRange; strand: string }>;
  /** The share of the duplicated stretch it covers, and the bases. */
  coversOfTheStretch: number;
  coveredBp?: number;
  stretchBp?: number;
  /** Against the copy before it in the order the finder reads the contig. */
  arrangement?: { type?: string; against?: string; between?: FoundBetween };
}
/** An anchor site, and the chain in place that reaches it: its pieces
    read the reference in place, the copy in place among them. */
interface FoundSite {
  own: OwnRange;
  chain?: { pieces?: Array<{ own: OwnRange }> } | null;
}
interface FoundContig {
  contig: string;
  duplication?: boolean;
  /** Where each cluster's walk stopped, left and right. */
  clusters?: Array<{ own: OwnRange }>;
  /** Left and right as the reference runs. */
  anchorSites?: { left: FoundSite | null; right: FoundSite | null };
  /** Null where nothing is in place. */
  copies?: FoundCopy[] | null;
  /** Where nothing is in place: the stretches found, not cut into copies. */
  uncut?: Array<{ own: OwnRange; inside?: Array<{ kind: string; own: OwnRange }> }> | null;
  cuts?: Array<{ own: OwnRange; bp: number }>;
  flags?: { mightBeMore?: unknown[] };
}
/** What `copiesOf` reads of a haplotype's entry in the fetch's
    `duplications` (duplications.ts HaplotypeDuplications). */
export interface FoundDuplications {
  duplication?: boolean;
  /** Per contig walked; the contig the duplicated stretch was found on
      first. */
  contigs?: FoundContig[];
}

const KINDS = new Set<string>(["tandem", "tandem with a spacer", "dispersed", "across a cut", "another contig"]);

/**
 * A haplotype's copies per contig, from the finder's answer; none when it
 * found no duplication. The contig holding the duplicated stretch first.
 */
export function copiesOf(found: FoundDuplications | null | undefined): ContigCopies[] {
  if (!found || found.duplication === false || !found.contigs?.length) return [];
  return found.contigs.map(contigCopies).filter((one): one is ContigCopies => one !== null);
}

function contigCopies(found: FoundContig): ContigCopies | null {
  if (found.duplication === false) return null;
  const cuts = found.cuts ?? [];
  /* The cut bases inside a stretch of own sequence. */
  const cutIn = (from: number, to: number) => cuts.reduce((n, cut) => n + Math.max(0, Math.min(cut.own[1], to) - Math.max(cut.own[0], from)), 0);
  const mightBeMore = (found.flags?.mightBeMore?.length ?? 0) > 0;
  const stops = (found.clusters ?? []).flatMap((cluster) => cluster.own);
  /** From where the walk stopped on the left to where it stopped on the
      right, and no less than what is drawn. */
  const spanOf = (ranges: Array<OwnRange | null>): OwnRange => {
    const all = [...ranges.filter((range): range is OwnRange => !!range).flat(), ...stops];
    return [Math.min(...all), Math.max(...all)];
  };

  /* The anchor sites at the ruler's ends, in own order. The finder names
     them left and right as the reference runs; a contig read in reverse
     has them the other way round. */
  const sites = [found.anchorSites?.left?.own, found.anchorSites?.right?.own].filter((own): own is OwnRange => !!own).sort((p, q) => p[0] - q[0]);
  const drawn: OwnRange[] = found.copies?.length ? found.copies.map((copy) => copy.own) : (found.uncut ?? []).map((one) => one.own);
  if (!drawn.length) return null;
  const first = Math.min(...drawn.map((own) => own[0]));
  let left: OwnRange | null = null;
  let right: OwnRange | null = null;
  if (sites.length === 2) [left, right] = sites;
  else if (sites.length === 1) {
    if (sites[0][0] < first) left = sites[0];
    else right = sites[0];
  }

  /* What is read in place: the anchor sites, and the pieces of the chains
     that reach them; outside the copies, that is reference read once. */
  const inPlace: OwnRange[] = [found.anchorSites?.left, found.anchorSites?.right].flatMap((site) => (site ? [site.own, ...(site.chain?.pieces ?? []).map((piece) => piece.own)] : []));
  const outsideOf = (taken: OwnRange[]): OwnRange[] => {
    const out: OwnRange[] = [];
    for (const [from, to] of [...inPlace].sort((p, q) => p[0] - q[0])) {
      /* Joined to the one before where they touch. */
      const last = out[out.length - 1];
      if (last && from <= last[1]) last[1] = Math.max(last[1], to);
      else out.push([from, to]);
    }
    /* Less what the copies take. */
    return out.flatMap(([from, to]) => {
      const left: OwnRange[] = [];
      let at = from;
      for (const one of [...taken].sort((p, q) => p[0] - q[0])) {
        if (one[1] <= at || one[0] >= to) continue;
        if (one[0] > at) left.push([at, one[0]]);
        at = Math.max(at, one[1]);
      }
      if (to > at) left.push([at, to]);
      return left;
    });
  };

  /* Nothing in place: nothing is cut or numbered. The cuts and the own
     sequence inside the uncut stretch are still marked. */
  if (!found.copies?.length) {
    const uncut: OwnRange = [first, Math.max(...drawn.map((own) => own[1]))];
    const others: OtherStretch[] = (found.uncut ?? [])
      .flatMap((one) => one.inside ?? [])
      .filter((inside) => inside.kind === "cut" || inside.kind === "own sequence")
      .map((inside) => ({ own: inside.own, kind: inside.kind === "cut" ? ("cut" as const) : ("unplaced" as const) }));
    const outside = outsideOf([uncut]);
    return { contig: found.contig, span: spanOf([uncut, left, right, ...outside]), anchors: { left, right }, outside, copies: [], uncut, others, mightBeMore };
  }

  /* The copies in own order. The finder sets each against the copy before
     it in the order it reads the contig; in own order that is the copy
     before it, or, on a contig read in reverse, the copy after it. */
  const inOrder = [...found.copies].sort((p, q) => p.own[0] - q.own[0]);
  const copies: ViewCopy[] = inOrder.map((copy, k) => {
    const before = k > 0 ? inOrder[k - 1] : null;
    const how = !before ? null : copy.arrangement?.against === before.label ? copy.arrangement : before.arrangement?.against === copy.label ? before.arrangement : null;
    const type = how?.type ?? "";
    const bp = before ? Math.max(0, copy.own[0] - before.own[1]) : 0;
    const cutBp = before ? (how?.between?.cutBp ?? cutIn(before.own[1], copy.own[0])) : 0;
    return {
      n: copy.inPlace ? null : (copy.n ?? null),
      own: copy.own,
      parts: copy.parts.map((part) => ({ own: part.own, backward: part.strand === "backwards" })),
      kind: copy.inPlace ? "in place" : !before ? "first" : KINDS.has(type) ? (type as CopyKind) : "unknown",
      covers: Math.min(1, copy.coveredBp !== undefined && copy.stretchBp ? copy.coveredBp / copy.stretchBp : copy.coversOfTheStretch),
      between: before ? { bp, cut: cutBp > 0, cutBp: cutBp > 0 ? cutBp : null } : null,
    };
  });

  /* What else is on the ruler: between what is read in place and the
     copies. */
  const outside = outsideOf(copies.map((copy) => copy.own));
  const marked = [...outside, ...copies.map((copy) => copy.own)].sort((p, q) => p[0] - q[0]);
  const others: OtherStretch[] = [];
  for (let k = 1; k < marked.length; k++) {
    const from = marked[k - 1][1];
    const to = marked[k][0];
    if (to <= from) continue;
    /* Split at the cuts inside it. */
    let at = from;
    for (const cut of [...cuts].sort((p, q) => p.own[0] - q.own[0])) {
      const c0 = Math.max(cut.own[0], at);
      const c1 = Math.min(cut.own[1], to);
      if (c1 <= c0) continue;
      if (c0 > at) others.push({ own: [at, c0], kind: "unplaced" });
      others.push({ own: [c0, c1], kind: "cut" });
      at = c1;
    }
    if (to > at) others.push({ own: [at, to], kind: "unplaced" });
  }
  return { contig: found.contig, span: spanOf(marked), anchors: { left, right }, outside, copies, uncut: null, others, mightBeMore };
}

/** The copy a stretch of own sequence lies in: the one it overlaps most
    (a row may run from an anchor site through the copy in place and a
    little into the next); null where it overlaps none (an anchor site,
    own sequence, a cut). */
export function copyAt(contig: ContigCopies, from: number, to: number): ViewCopy | null {
  let found: ViewCopy | null = null;
  let most = 0;
  for (const copy of contig.copies) {
    const shared = Math.min(copy.own[1], to) - Math.max(copy.own[0], from);
    if (shared > most) {
      most = shared;
      found = copy;
    }
  }
  return found;
}

/** The title's count: "in place, 4 copies"; "unknown number of copies"
    where nothing is in place. */
export function copiesCount(contig: ContigCopies): string {
  if (contig.uncut) return "unknown number of copies";
  const others = contig.copies.filter((copy) => copy.kind !== "in place");
  return [others.length < contig.copies.length ? "in place" : "", others.length ? `${others.length} ${others.length === 1 ? "copy" : "copies"}` : ""]
    .filter(Boolean)
    .join(", ");
}

/** The share of the duplicated stretch a copy covers, as a tab says it:
    whole per cents, and 100 only when all of it is covered. */
export const coversText = (covers: number): string => `covers ${covers >= 1 ? 100 : Math.min(99, Math.round(covers * 100))}%`;

/** A numbered copy's Roman numeral, in own order: 1 -> I, 4 -> IV, 14 -> XIV
    (the user, 2026-11-15: "the label copy 1, I think it should be like region
    A, region B", then "Make the A, B, Roman Numerals instead"). */
export function regionNumeral(n: number): string {
  const steps: Array<[number, string]> = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  let left = n;
  for (const [value, numeral] of steps) {
    while (left >= value) {
      out += numeral;
      left -= value;
    }
  }
  return out;
}

/** A copy's name: "In place", "Region II". */
export const regionName = (copy: Pick<ViewCopy, "n">): string => (copy.n === null ? "In place" : `Region ${regionNumeral(copy.n)}`);

/** A copy's tab: "In place · 58.4 kb · covers 98%", "Region I · 80.9 kb ·
    covers 100%". How it follows the copy before (tandem, a spacer,
    dispersed) is not said (the user, 2026-11-15: "Remove the tandem,
    dispersed, in the legend"); a cut is said on the line between them. */
export function copyTab(copy: ViewCopy): string {
  const size = `${((copy.own[1] - copy.own[0]) / 1000).toFixed(1)} kb`;
  return [regionName(copy), size, coversText(copy.covers)].join(" · ");
}

/** What the line between a copy and the one before it says; empty where
    the copy follows straight on: a cut and its size, and what else lies
    there as its own sequence, as the ruler labels it. */
export function betweenText(between: CopyBetween | null): string {
  if (!between || between.bp <= 0) return "";
  const bp = (n: number) => (n >= 10_000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)} kb` : `${n.toLocaleString()} bp`);
  if (!between.cut) return `${bp(between.bp)} of its own sequence`;
  if (between.cutBp === null) return `${between.bp.toLocaleString()} bp between, a cut in it: part is not in the graph`;
  const rest = between.bp - between.cutBp;
  return `cut · ${between.cutBp.toLocaleString()} bp not in the graph${rest > 0 ? ` · then ${bp(rest)} of its own sequence` : ""}`;
}
