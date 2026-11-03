import { alignDiverging, placeClosed, reverseComplement } from "./alignment";
import type { Step } from "./alignment";
import { axisOf, layOut, readsSite, siteReads } from "../../../../../getRemoteData/gbz/pointer";
import type { Carriers } from "../../../../../getRemoteData/gbz/subgraph";
import { labelForms, labelPrefix, runsOf } from "./markLabel";
import type { InnerDiff, LabelRun } from "./markLabel";
import type { LinearLane } from "./linearModel";
import type { RefAxis } from "./rowAlign";

/* ══════════════════════════════════════════════════════════════════════════
   Rule D: a nested allele inside a bubble (PLAN-nested.md in
   eg3/claude-memory, built on the rows 2026-11-03 for insertion sites;
   PLAN-bubble-sites.md, the same day, for any bubble; the pictures are
   diagrams/nested-on-rows.html and diagrams/nested-bubbles.html).

   A site inside an insertion has no reference base, so every row carrying
   the insertion gets the same "+6" mark, and TTTTGT cannot be told from
   TTTCGT. Rule D is the row's own rule one level down. A site is a pair
   of anchors, the anchor before and the anchor after (the code's word:
   junction), that a walk reads with a bubble between: an insertion when
   the two are consecutive reference steps, a deletion or a
   deletion-insertion when they are not. The worker tallies what every
   haplotype in the band reads there (subgraph.ts, countCarriers, by the
   same pointer pass the rows are placed with): each version, the run of
   nodes between the two anchors on the reference's strand (nothing, for
   a deletion), with how many haplotypes read it; how many read straight
   across; and how many anchor other nodes over the stretch. Two or more
   versions make the site nested. The commonest version (most haplotypes;
   ties to fewer nodes, then the node list) stands where the reference
   would: the row's version is placed over it by the pointer, both
   bracketed by the site's two anchors, and each bubble between nodes the
   two share is classed by gbz-base's rule, as on the bar. So a chip in
   the label marks a base that differs from the commonest between shared
   nodes, which is what the graph states; two versions with no node in
   common are one deletion-insertion, nothing guessed.

   Who counts is a switch (pangenomeViewState, countOver): every haplotype
   in the band, the default, or only the lanes on screen. In the second
   the versions, the commonest and the counts come from the model's own
   rows; a site is nested only when the lanes carry two or more
   versions; ties go to the all-haplotypes order. Both are worked out
   here, once per model, and the raster picks one (barRaster.ts).
   ══════════════════════════════════════════════════════════════════════════ */

export type CountOver = "all" | "selected";

/** One version at a site, as the card lists it. */
export interface NestedVersion {
  /** The nodes, as handles on the reference's strand; "" for nothing. */
  key: string;
  nodes: Step[];
  bases: number;
  /** Its bases ("" for nothing); null when they are not in the band and
      too long to have been sent (VERSION_BASES_CAP). */
  seq: string | null;
  /** Haplotypes, or lanes, reading it. */
  count: number;
  /** The lanes on screen reading it. */
  lanes: string[];
  commonest: boolean;
  /** The row's own. */
  mine: boolean;
}

/** What a nested mark shows, counted one way. */
export interface NestedMark {
  /** "left>right" by the two anchors' node ids. */
  site: string;
  /** The reference between the anchors, in bases: 0 at an insertion site. */
  refLen: number;
  /** How many versions there are. */
  versions: number;
  /** The row's version's place among them, 1 the commonest. */
  rank: number;
  /** Haplotypes, or lanes, reading the row's version; of how many. */
  count: number;
  total: number;
  /** Reading straight across. */
  straight: number;
  straightLanes: string[];
  /** Anchoring other nodes over the stretch. */
  others: number;
  /** "haplotypes" or "lanes": what count and total count. */
  unit: "haplotypes" | "lanes";
  list: NestedVersion[];
  /** The row's version's bases. */
  seq: string;
  /** What differs from the commonest; null where it could not be placed
      over the commonest (its bases not sent). */
  diffs: InnerDiff[] | null;
  /** The label's forms, longest first. */
  forms: LabelRun[][];
  /** The places inside where the versions differ, in words:
      "at base 4: T in 162, C in 118". */
  sites: string[];
}

/** A part's nested reading each way of counting; null where the count
    finds one version only, so the part is drawn plain. */
export interface NestedAt {
  all: NestedMark | null;
  selected: NestedMark | null;
}

const handle = (s: Step) => `${s.id}${s.reverse ? "-" : "+"}`;
const versionKey = (steps: Step[]) => steps.map(handle).join(" ");

/* ── The row's version against the commonest ────────────────────────── */

/** What differs between a row's version and the commonest: the row's
    placed over the commonest by the pointer (pointer.ts), both bracketed
    by the site's two anchors, each bubble classed by gbz-base's rule
    (alignment.ts). Offsets are into the two versions' own bases. Either
    version may be nothing. */
export function innerDiffs(seqOf: (s: Step) => string, lane: Step[], commonest: Step[], ends: [Step, Step]): InnerDiff[] {
  const [left, right] = ends;
  const axisSteps = [left, ...commonest, right];
  const axis = axisOf(axisSteps);
  const laneSteps = [left, ...lane, right].map((s) => ({ node: s.id, reverse: s.reverse, step: s }));
  const shift = seqOf(left).length;
  const laneBases = lane.reduce((n, s) => n + seqOf(s).length, 0);
  const comBases = commonest.reduce((n, s) => n + seqOf(s).length, 0);
  const comAt: number[] = [];
  let at = -shift;
  for (const s of axisSteps) {
    comAt.push(at);
    at += seqOf(s).length;
  }
  comAt.push(at);
  const laid = layOut(axis, laneSteps, 0, axisSteps.length, false);
  if (laid.head.length || laid.tail.length || !laid.pieces.length) {
    return [{ kind: "replacement", at: 0, len: laneBases, gone: comBases, comAt: 0 }];
  }
  const diffs: InnerDiff[] = [];
  let hapAt = -shift;
  for (const piece of laid.pieces) {
    if (piece.kind === "anchor") {
      hapAt += seqOf(piece.step.step).length;
      continue;
    }
    if (piece.kind !== "bubble") continue;
    const hapSeq = piece.pending.map((s) => seqOf(s.step)).join("");
    let refSeq = "";
    for (let k = piece.ref[0]; k < piece.ref[1]; k++) refSeq += seqOf(axisSteps[k]);
    const aligned = alignDiverging(hapSeq, refSeq);
    let cursor = 0;
    for (const part of placeClosed(aligned, comAt[piece.ref[0]], hapSeq)) {
      if (part.hap) cursor = part.hap[1];
      const from = hapAt + (part.hap ? part.hap[0] : cursor);
      if (part.kind === "mismatch") diffs.push({ kind: "substitution", at: from, len: part.len, gone: part.len, comAt: part.ref });
      else if (part.kind === "replaced") diffs.push({ kind: "replacement", at: from, len: part.len, gone: part.len, comAt: part.ref });
      else if (part.kind === "mark") diffs.push({ kind: "insertion", at: from, len: part.len, gone: 0, comAt: part.ref });
      else if (part.kind === "white") diffs.push({ kind: "deletion", at: from, len: 0, gone: part.len, comAt: part.ref });
    }
    hapAt += hapSeq.length;
  }
  return diffs.sort((x, y) => x.at - y.at || x.comAt - y.comAt);
}

/* ── The places inside, for the card ────────────────────────────────── */

/** Where the versions differ, each place in words, the commonest's bases
    first: "at base 4: T in 162, C in 118". A version with no difference
    over a place reads the commonest's bases there. */
function sitesOf(list: NestedVersion[], diffsOf: (v: NestedVersion) => InnerDiff[] | null): string[] {
  const commonest = list.find((v) => v.commonest);
  if (!commonest || commonest.seq === null) return [];
  const comSeq = commonest.seq;
  const places = new Map<string, { comAt: number; gone: number; kind: InnerDiff["kind"]; len: number }>();
  const byVersion = new Map<NestedVersion, InnerDiff[] | null>();
  for (const v of list) {
    const diffs = v.commonest ? [] : diffsOf(v);
    byVersion.set(v, diffs);
    for (const d of diffs ?? []) {
      /* Insertions at one place are one place, whatever their lengths. */
      const key = d.kind === "insertion" ? `insertion:${d.comAt}` : `${d.kind}:${d.comAt}:${d.gone}`;
      if (!places.has(key)) places.set(key, { comAt: d.comAt, gone: d.gone, kind: d.kind, len: d.len });
    }
  }
  const out: string[] = [];
  for (const place of [...places.values()].sort((a, b) => a.comAt - b.comAt)) {
    const tally = new Map<string, number>();
    const add = (bases: string, count: number) => tally.set(bases, (tally.get(bases) ?? 0) + count);
    for (const v of list) {
      const diffs = byVersion.get(v);
      if (diffs === null || diffs === undefined || v.seq === null) continue;
      const over =
        place.kind === "insertion"
          ? diffs.find((d) => d.kind === "insertion" && d.comAt === place.comAt)
          : diffs.find((d) => d.kind !== "insertion" && d.comAt <= place.comAt && d.comAt + d.gone >= place.comAt + place.gone);
      if (place.kind === "insertion") add(over ? `+${v.seq.slice(over.at, over.at + over.len)}` : "nothing more", v.count);
      else if (!over) add(comSeq.slice(place.comAt, place.comAt + place.gone), v.count);
      else if (over.kind === "deletion") add("nothing", v.count);
      else {
        const from = over.at + (place.comAt - over.comAt);
        add(v.seq.slice(from, from + place.gone), v.count);
      }
    }
    const comBases = place.kind === "insertion" ? "nothing more" : comSeq.slice(place.comAt, place.comAt + place.gone);
    const ordered = [...tally.entries()].sort((a, b) => (a[0] === comBases ? -1 : b[0] === comBases ? 1 : b[1] - a[1]));
    const where =
      place.kind === "insertion"
        ? `after base ${place.comAt}`
        : place.gone === 1
          ? `at base ${place.comAt + 1}`
          : `at bases ${place.comAt + 1}–${place.comAt + place.gone}`;
    out.push(`${where}: ${ordered.map(([bases, count]) => `${bases} in ${count.toLocaleString()}`).join(", ")}`);
  }
  return out;
}

/* ── The model's pass ───────────────────────────────────────────────── */

interface Tallied {
  key: string;
  nodes: Step[];
  bases: number;
  count: number;
  lanes: Set<string>;
}

type Reads = ReturnType<typeof siteReads<{ node: string; reverse: boolean }>>;

/**
 * Rule D over a model's lanes: every bubble that is a site (its bases
 * differ from the reference's between its anchors) gets its nested
 * reading each way of counting (`nested` on the bubble's first changed
 * part: the mark of an insertion, the white of a deletion, the letters of
 * the rest), where that way finds two or more versions. `refSample` is
 * the reference sample, whose own walks count nowhere.
 */
export function addNestedMarks(lanes: LinearLane[], axis: RefAxis, seqOf: (s: Step) => string, carriers: Carriers | undefined, refSample: string): void {
  const kAt = new Map<number, number>();
  axis.pos.forEach((at, k) => kAt.set(at, k));
  const siteKey = (k0: number, k1: number) => `${axis.steps[k0].id}>${axis.steps[k1].id}`;
  const onScreen = lanes.filter((lane) => !lane.isReference && lane.sample !== refSample && lane.rows.length);

  /* What each lane on screen reads, row by row, by the same pass the
     worker tallies the band with. */
  const pointerAxis = axisOf(axis.steps);
  const laneReads = new Map<string, Reads[]>();
  for (const lane of onScreen) laneReads.set(lane.key, lane.rows.map((row) => siteReads(pointerAxis, row.steps)));

  /* The lanes' count at a site: versions by the lanes reading them, the
     straight readers, those anchoring other nodes. A lane with several
     rows counts once, by its first row that reads the site's own pair,
     else by its first that reads the stretch at all. */
  const selectedAt = (k0: number, k1: number) => {
    const versions = new Map<string, Tallied>();
    const straight = new Set<string>();
    const others = new Set<string>();
    for (const lane of onScreen) {
      let how: "own" | "straight" | "others" | "none" = "none";
      for (const reads of laneReads.get(lane.key) ?? []) {
        const h = readsSite(reads, k0, k1);
        if (h === "own") {
          how = "own";
          for (const b of reads.bubbles) {
            if (b.k0 !== k0 || b.k1 !== k1) continue;
            const nodes: Step[] = b.version.map((s) => ({ id: s.node, reverse: s.reverse }));
            const key = versionKey(nodes);
            let version = versions.get(key);
            if (!version) versions.set(key, (version = { key, nodes, bases: nodes.reduce((n, s) => n + seqOf(s).length, 0), count: 0, lanes: new Set() }));
            version.lanes.add(lane.key);
            version.count = version.lanes.size;
          }
        } else if (how === "none" && h !== "none") how = h;
      }
      if (how === "straight") straight.add(lane.key);
      else if (how === "others") others.add(lane.key);
    }
    return { versions, straight, others };
  };

  const bandOrder = (a: { count: number; nodes: Step[]; key: string }, b: { count: number; nodes: Step[]; key: string }) =>
    b.count - a.count || a.nodes.length - b.nodes.length || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  const seqOfVersion = (nodes: Step[]): string | null => {
    let out = "";
    for (const s of nodes) {
      const bases = seqOf(s);
      if (!bases.length) return null;
      out += bases;
    }
    return out;
  };

  const mark = (
    k0: number,
    k1: number,
    refLen: number,
    mine: string,
    ranked: Tallied[],
    laneVersions: Map<string, Tallied>,
    straight: number,
    straightLanes: string[],
    others: number,
    total: number,
    unit: NestedMark["unit"],
  ): NestedMark | null => {
    if (ranked.length < 2) return null;
    const ends: [Step, Step] = [axis.steps[k0], axis.steps[k1]];
    const list: NestedVersion[] = ranked.map((v, i) => ({
      key: v.key,
      nodes: v.nodes,
      bases: v.bases,
      seq: seqOfVersion(v.nodes),
      count: v.count,
      lanes: [...(laneVersions.get(v.key)?.lanes ?? [])].sort(),
      commonest: i === 0,
      mine: v.key === mine,
    }));
    const commonest = list[0];
    const own = list.find((v) => v.mine);
    const seq = own?.seq ?? "";
    const diffsOf = (v: NestedVersion): InnerDiff[] | null =>
      v.commonest ? [] : v.seq !== null && commonest.seq !== null ? innerDiffs(seqOf, v.nodes, commonest.nodes, ends) : null;
    const diffs = own ? diffsOf(own) : null;
    const prefix = labelPrefix(seq.length, refLen);
    const forms = (diffs ? labelForms(seq, diffs, true, prefix) : [prefix]).map(runsOf);
    return {
      site: siteKey(k0, k1),
      refLen,
      versions: list.length,
      rank: list.findIndex((v) => v.mine) + 1,
      count: own?.count ?? 0,
      total,
      straight,
      straightLanes,
      others,
      unit,
      list,
      seq,
      diffs,
      forms,
      sites: sitesOf(list, diffsOf),
    };
  };

  for (const lane of onScreen) {
    for (const row of lane.rows) {
      row.bubbles.forEach((bubble, b) => {
        if (bubble.cls === "inversion" || bubble.cls === "match") return;
        const k0 = (kAt.get(bubble.refAt) ?? 0) - 1;
        const k1 = kAt.get(bubble.refAt + bubble.refLen);
        if (k0 < 0 || k1 === undefined || k1 >= axis.steps.length) return;
        /* The bubble's first changed part carries the reading. */
        const first = row.parts.filter((part) => part.bubble === b && part.kind !== "match").sort((x, y) => x.ref - y.ref)[0];
        if (!first) return;
        let steps: Step[] = row.steps.slice(bubble.steps[0], bubble.steps[1]).map((s) => ({ id: s.node, reverse: s.reverse }));
        if (bubble.inverted) steps = [...steps].reverse().map((s) => ({ id: s.id, reverse: !s.reverse }));
        const mine = versionKey(steps);
        const key = siteKey(k0, k1);
        const sel = selectedAt(k0, k1);

        /* Every haplotype in the band: the worker's tally. */
        const band = carriers?.versions?.[key];
        const bandList: Tallied[] = (band?.versions ?? []).map((v) => ({ key: versionKey(v.nodes), nodes: v.nodes, bases: v.bases, count: v.count, lanes: new Set<string>() }));
        bandList.sort(bandOrder);
        const bandCount = new Map(bandList.map((v) => [v.key, v.count]));
        const refLen = band?.refLen ?? bubble.refLen;
        const all = band
          ? mark(k0, k1, refLen, mine, bandList, sel.versions, band.straight, [...sel.straight].sort(), band.others ?? 0, carriers?.versionTotal ?? carriers?.total ?? 0, "haplotypes")
          : null;

        /* The lanes on screen: ties to the band's order. */
        const seen = [...sel.versions.values()].sort(
          (a, c) => c.count - a.count || bandOrder({ ...a, count: bandCount.get(a.key) ?? 0 }, { ...c, count: bandCount.get(c.key) ?? 0 }),
        );
        const selected = mark(k0, k1, refLen, mine, seen, sel.versions, sel.straight.size, [...sel.straight].sort(), sel.others.size, onScreen.length, "lanes");

        if (all || selected) first.nested = { all, selected };
      });
    }
  }
}

/** The bases a version's step holds, from the band's nodes or the
    worker's extra ones (versionNodes); "" when neither has them. */
export function versionSeqOf(seq: Map<string, string>, extra: Record<string, string> | undefined): (s: Step) => string {
  return (s) => {
    const forward = seq.get(s.id) ?? extra?.[s.id] ?? "";
    return s.reverse ? reverseComplement(forward) : forward;
  };
}
