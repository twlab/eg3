import { reverseComplement } from "./alignment";
import type { Step } from "./alignment";
import { axisOf, siteReads, stepsBetween } from "../../../../../getRemoteData/gbz/pointer";
import type { Carriers, JunctionVersions } from "../../../../../getRemoteData/gbz/subgraph";
import type { LinearLane } from "./linearModel";
import type { RefAxis } from "./rowAlign";

/* ══════════════════════════════════════════════════════════════════════════
   Rule D: a nested allele inside a bubble (PLAN-nested.md in
   eg3/claude-memory, built on the rows 2026-11-03 for insertion sites;
   PLAN-bubble-sites.md, the same day, for any bubble; PLAN-merge.md, the
   same day, for the merge of overlapping sites; the pictures are
   diagrams/nested-on-rows.html, nested-bubbles.html, nested-merge.html).

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

   The merge: where pairs overlap on the reference and the stretch between
   the outer anchors is sealed in the graph (a snarl: every walk through
   it enters by the one anchor and leaves by the other), the worker
   tallies one merged site under the outer anchors, every walk's version
   its steps between the two, reference nodes included. On a row, the
   first bubble inside a merged site carries the merged reading; its other
   bubbles there carry none. The pairs inside that are sealed themselves
   are the site's sites inside, listed on the card as vg deconstruct lists
   nested snarls.

   Every haplotype in the band counts, through the worker's tally; the
   marks are worked out here once per model and drawn by barRaster.ts.
   ══════════════════════════════════════════════════════════════════════════ */

/** One version at a site, as the card lists it. */
export interface NestedVersion {
  /** The nodes, as handles on the reference's strand; "" for nothing. */
  key: string;
  nodes: Step[];
  bases: number;
  /** Its bases ("" for nothing); null when they are not in the band and
      too long to have been sent (VERSION_BASES_CAP). */
  seq: string | null;
  /** Haplotypes reading it. */
  count: number;
  commonest: boolean;
  /** The row's own. */
  mine: boolean;
}

/** A sealed pair inside a merged site, as the card lists it. */
export interface InsideSite {
  key: string;
  /** Its reference stretch, absolute; refLen 0 at an insertion site. */
  refAt: number;
  refLen: number;
  versions: Array<{ seq: string | null; bases: number; count: number }>;
  straight: number;
  /** Readers of the merged site that do not read this pair's two anchors
      with a bubble between nor straight across it: they skip it. */
  skip: number;
}

/** What a nested mark shows. */
export interface NestedMark {
  /** "left>right" by the two anchors' node ids. */
  site: string;
  /** The reference between the anchors, in bases: 0 at an insertion site. */
  refLen: number;
  /** How many versions there are. */
  versions: number;
  /** The row's version's place among them, 1 the commonest. */
  rank: number;
  /** Haplotypes reading the row's version; of how many. */
  count: number;
  total: number;
  /** Reading straight across. */
  straight: number;
  /** Anchoring other nodes over the stretch. */
  others: number;
  list: NestedVersion[];
  /** The row's version's bases. */
  seq: string;
  /** What the mark's label says: the row's bases against the reference's
      between the anchors, "+6" or "−4"; nothing when they are as many. */
  label: string;
  /** A merged site: how many pairs it was made from, how many haplotypes
      anchor only one or neither outer anchor, and the sealed pairs
      inside. */
  merged?: { pairs: number; partial: number; inside: InsideSite[]; source: "band" | "chains" };
}

const handle = (s: Step) => `${s.id}${s.reverse ? "-" : "+"}`;
const versionKey = (steps: Step[]) => steps.map(handle).join(" ");

/** What a mark's label says (the user, 2026-11-10: "just have + or -
    comparing to ref in that bubble, nothing for same"): the row's bases
    against the reference's between the anchors, "+6", "−4", or nothing
    when they are as many. The spelled forms with chips on what differed
    from the commonest reading are gone. */
export const labelOf = (bases: number, refLen: number): string =>
  bases > refLen ? `+${(bases - refLen).toLocaleString("en-US")}` : bases < refLen ? `−${(refLen - bases).toLocaleString("en-US")}` : "";

/* ── The model's pass ───────────────────────────────────────────────── */

interface Tallied {
  key: string;
  nodes: Step[];
  bases: number;
  count: number;
}

type Reads = ReturnType<typeof siteReads<{ node: string; reverse: boolean }>>;

/**
 * Rule D over a model's lanes: every bubble that is a site (its bases
 * differ from the reference's between its anchors) gets its nested
 * reading each way of counting (`nested` on the bubble's first changed
 * part: the mark of an insertion, the white of a deletion, the letters of
 * the rest), where that way finds two or more versions. Inside a merged
 * site the row's first bubble carries the merged reading. `refSample` is
 * the reference sample, whose own walks count nowhere.
 */
export function addNestedMarks(lanes: LinearLane[], axis: RefAxis, seqOf: (s: Step) => string, carriers: Carriers | undefined, refSample: string): void {
  const kAt = new Map<number, number>();
  axis.pos.forEach((at, k) => kAt.set(at, k));
  const siteKey = (k0: number, k1: number) => `${axis.steps[k0].id}>${axis.steps[k1].id}`;
  const onScreen = lanes.filter((lane) => !lane.isReference && lane.sample !== refSample && lane.rows.length);
  const pointerAxis = axisOf(axis.steps);

  /* What each lane on screen reads, row by row, by the same pass the
     worker tallies the band with. */
  const laneReads = new Map<string, Reads[]>();
  for (const lane of onScreen) laneReads.set(lane.key, lane.rows.map((row) => siteReads(pointerAxis, row.steps)));

  /* The merged sites by the pairs they hold, with their anchors' step
     indexes: the first place the reference reads the left node, and the
     first it reads the right node after it. */
  const mergedByPair = new Map<string, { key: string; k0: number; k1: number; site: NonNullable<Carriers["merged"]>[string] }>();
  for (const [key, site] of Object.entries(carriers?.merged ?? {})) {
    const [left, right] = key.split(">");
    const k0 = axis.steps.findIndex((s) => s.id === left);
    const k1 = axis.steps.findIndex((s, k) => k > k0 && s.id === right);
    if (k0 < 0 || k1 < 0) continue;
    for (const pair of site.pairs) mergedByPair.set(pair, { key, k0, k1, site });
  }

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
  const tallied = (versions: JunctionVersions["versions"]): Tallied[] =>
    versions.map((v) => ({ key: versionKey(v.nodes), nodes: v.nodes, bases: v.bases, count: v.count })).sort(bandOrder);

  /** The sealed pairs inside a merged site, from the worker's pair
      tallies, with how many of the merged site's readers skip each. */
  const insideOf = (k0: number, k1: number, readers: number): InsideSite[] => {
    const out: InsideSite[] = [];
    for (const [key, pair] of Object.entries(carriers?.versions ?? {})) {
      if (!pair.sealed) continue;
      const [left, right] = key.split(">");
      const p0 = axis.steps.findIndex((s, k) => k >= k0 && s.id === left);
      const p1 = axis.steps.findIndex((s, k) => k > p0 && s.id === right);
      if (p0 < k0 || p1 < 0 || p1 > k1) continue;
      const own = pair.versions.reduce((n, v) => n + v.count, 0);
      out.push({
        key,
        refAt: axis.pos[p0 + 1],
        refLen: pair.refLen,
        versions: pair.versions.map((v) => ({ seq: seqOfVersion(v.nodes), bases: v.bases, count: v.count })),
        straight: pair.straight,
        skip: Math.max(0, readers - own - pair.straight),
      });
    }
    return out.sort((a, b) => a.refAt - b.refAt || a.refLen - b.refLen);
  };

  const mark = (
    k0: number,
    k1: number,
    refLen: number,
    mine: string,
    ranked: Tallied[],
    straight: number,
    others: number,
    total: number,
    merged?: NestedMark["merged"],
  ): NestedMark | null => {
    if (ranked.length < 2) return null;
    const list: NestedVersion[] = ranked.map((v, i) => ({
      key: v.key,
      nodes: v.nodes,
      bases: v.bases,
      seq: seqOfVersion(v.nodes),
      count: v.count,
      commonest: i === 0,
      mine: v.key === mine,
    }));
    const own = list.find((v) => v.mine);
    const seq = own?.seq ?? "";
    const label = labelOf(own?.bases ?? 0, refLen);
    return {
      site: siteKey(k0, k1),
      refLen,
      versions: list.length,
      rank: list.findIndex((v) => v.mine) + 1,
      count: own?.count ?? 0,
      total,
      straight,
      others,
      list,
      seq,
      label,
      ...(merged ? { merged } : {}),
    };
  };

  for (const lane of onScreen) {
    lane.rows.forEach((row, n) => {
      const reads = laneReads.get(lane.key)![n];
      const mergedDone = new Set<string>();
      row.bubbles.forEach((bubble, b) => {
        if (bubble.cls === "inversion" || bubble.cls === "match") return;
        const k0 = (kAt.get(bubble.refAt) ?? 0) - 1;
        const k1 = kAt.get(bubble.refAt + bubble.refLen);
        if (k0 < 0 || k1 === undefined || k1 >= axis.steps.length) return;
        /* The bubble's first changed part carries the reading. */
        const first = row.parts.filter((part) => part.bubble === b && part.kind !== "match").sort((x, y) => x.ref - y.ref)[0];
        if (!first) return;
        const key = siteKey(k0, k1);

        /* Inside a merged site: the row's first bubble there carries the
           merged reading, its steps between the outer anchors. */
        const mg = mergedByPair.get(key);
        if (mg) {
          if (mergedDone.has(mg.key)) return;
          mergedDone.add(mg.key);
          const own = stepsBetween(reads, row.steps, mg.k0, mg.k1);
          if (!own) return;
          const between: Step[] = own.map((s) => ({ id: s.node, reverse: s.reverse }));
          const mine = versionKey(between);
          const bandList = tallied(mg.site.versions);
          const readers = mg.site.versions.reduce((t, v) => t + v.count, 0) + mg.site.straight;
          const inside = insideOf(mg.k0, mg.k1, readers);
          const all = mark(mg.k0, mg.k1, mg.site.refLen, mine, bandList, mg.site.straight, 0, carriers?.versionTotal ?? carriers?.total ?? 0, {
            pairs: mg.site.pairs.length,
            partial: mg.site.partial,
            inside,
            source: mg.site.source ?? "band",
          });
          if (all) first.nested = all;
          return;
        }

        let steps: Step[] = row.steps.slice(bubble.steps[0], bubble.steps[1]).map((s) => ({ id: s.node, reverse: s.reverse }));
        if (bubble.inverted) steps = [...steps].reverse().map((s) => ({ id: s.id, reverse: !s.reverse }));
        const mine = versionKey(steps);

        /* Every haplotype in the band: the worker's tally. */
        const band = carriers?.versions?.[key];
        const bandList: Tallied[] = tallied(band?.versions ?? []);
        const refLen = band?.refLen ?? bubble.refLen;
        const all = band
          ? mark(k0, k1, refLen, mine, bandList, band.straight, band.others ?? 0, carriers?.versionTotal ?? carriers?.total ?? 0)
          : null;
        if (all) first.nested = all;

      });
    });
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
