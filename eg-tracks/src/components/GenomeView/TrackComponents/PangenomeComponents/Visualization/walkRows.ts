import type { GraphNode, Lane, LaneDeletion, LaneStep, PangenomeModel } from "./pangenomeModel";

/* ══════════════════════════════════════════════════════════════════════════
   One haplotype's walk as rows of readings: what "Show walks" draws in
   place of its bar.

   A reading is a run of the walk along the reference - the reference's next
   node, or its previous one read backwards - on one strand, within one piece
   of the walk, either all bases the haplotype reads here for the first time
   or all bases it has read before. Read before is by the graph's own nodes:
   the graph puts matching sequence on one node, so a walk back on a node is
   the haplotype having that stretch again. Counted over every piece of the
   haplotype in the band, in its own order - its main contig's first, see
   oneLanePerHaplotype - and over the reference a reading passes over, so a
   copy reading a site the first reading carried another allele of, or left
   out, is still a copy there.

   A skip forward along the reference is a deletion inside the reading,
   however long. A reading ends where the walk goes back along the
   reference, turns over, goes from what it reads first to what it has read
   before, or its piece of the walk ends - or goes where nothing has a place
   in this band. There it takes with it the piece's own bases off the
   reference laid out from its end, as the bar draws them: the end of an
   insertion the walk leaves the band in, or of one it comes back from.

   Row 0 holds the first readings; each copy gets a row of its own, in the
   order the walk reads them. Each reading is drawn where the reference
   bases it reads are - a copy over the stretch it copies - which is why it
   needs no room of its own.
   ══════════════════════════════════════════════════════════════════════════ */

/** A run of the walk's alleles with no room where the reading draws them:
    an insertion in a copy, which the layout has no room for at the place
    the copy is drawn - or an allele longer than what it stands in for. */
export interface WalkMark {
  /** Along the layout, where it goes in. */
  x: number;
  bp: number;
  /** The reference it stands in for; 0 for an insertion. */
  replaces: number;
}

export interface WalkReading {
  /** Which piece of the lane's walk. */
  segment: number;
  reverse: boolean;
  /** Bases the haplotype has read before here. */
  copy: boolean;
  /** Where on the reference: its first base up to its last. */
  lo: number;
  hi: number;
  /** Where it is drawn along the layout: its reference nodes' own places. */
  xLo: number;
  xHi: number;
  /** In the haplotype's own coordinates. */
  ownFrom: number;
  ownTo: number;
  /** How the walk came into it: its piece starts here (or comes back from
      where nothing has a place in this band), it runs on from the reading
      before - into bases read before, or out of them - or it jumps. */
  entry: "start" | "continues" | "jump";
  /** Whether the walk leaves this region after it: its piece ends, or it
      goes on through nodes with no place in this band. */
  leaves: boolean;
  /** Where it leaves by jumping from its last node straight on along the
      reference, past this band: a deletion running out of it, as a bar
      draws one - HG02698#1 from chr17:38,989,381 on to 38,990,440. The
      node it lands on, and the reference it leaves out. */
  out?: { to: string; refFrom: number; refTo: number; bp: number };
  /** An inversion in place - read first, backwards, between two readings
      of its row that run forward to it and on from it - drawn in its row
      with no lines, as the bar draws it. */
  inline: boolean;
  /** The steps it draws, as indices into the lane's steps. */
  steps: number[];
  marks: WalkMark[];
  row: number;
}

export interface WalkRows {
  readings: WalkReading[];
  /** Readings by row, row 0 first; each in walk order. None when nothing
      of the haplotype here is on the reference. */
  rows: WalkReading[][];
  /** Pieces of the walk with nothing on the reference here, nor outside
      it: no place to draw them, only where they are in the haplotype. */
  unplaced: Array<{ segment: number; ownFrom: number; ownTo: number }>;
  /** A lane per row, for laneRaster to draw: its steps on the nodes the row
      draws, a copy's on the node it copies. */
  rowLanes: Lane[];
  /** The model the row lanes are drawn from: the band's, with a stand-in
      node for each run of a copy's alleles drawn over what it replaces. */
  model: PangenomeModel;
  /** Which readings read each reference node, by its id, in walk order. */
  readsOf: Map<string, number[]>;
  /** Row 0 is the haplotype in place, unless the first of what it reads
      first it reads backwards. */
  inPlace: boolean;
}

const byLane = new WeakMap<Lane, WalkRows>();

/** One haplotype's readings, in rows. Worked out once per band and lane: a
    new band is a new model, and with it new lanes. */
export function walkRows(model: PangenomeModel, lane: Lane): WalkRows {
  const known = byLane.get(lane);
  if (known) return known;
  const made = buildWalkRows(model, lane);
  byLane.set(lane, made);
  return made;
}

function buildWalkRows(model: PangenomeModel, lane: Lane): WalkRows {
  const node = (id: string) => model.nodeById.get(id);
  /* The node a step is drawn on: a copy's original. */
  const original = (n: GraphNode) => (n.copyOf ? (node(n.copyOf) ?? n) : n);
  const placedOnReference = (n: GraphNode) => n.onReference && !n.untied;

  /* The reference's nodes in reference order, for what a reading passes
     over. */
  const along = model.nodes
    .filter(placedOnReference)
    .sort((a, b) => a.refStart - b.refStart);
  const passedOver = (from: number, to: number) => {
    let lo = 0;
    let hi = along.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (along[mid].refStart < from) lo = mid + 1;
      else hi = mid;
    }
    const out: GraphNode[] = [];
    for (let i = lo; i < along.length && along[i].refEnd <= to; i++) out.push(along[i]);
    return out;
  };

  const seen = new Set<string>();
  const readings: WalkReading[] = [];
  /* Stand-ins for a copy's alleles, by the steps they stand in for. */
  const standIns: Array<{ steps: number[]; node: GraphNode }> = [];
  const deletions: Array<{ reading: WalkReading; after: number; deletion: Omit<LaneDeletion, "step"> }> = [];

  let cur: WalkReading | null = null;
  let prev: { index: number; o: GraphNode; step: LaneStep } | null = null;
  let between: number[] = [];
  let away = false;

  const steps = lane.steps;

  /* A piece's own bases off the reference at the end of a reading where the
     walk leaves the band, or at the start of one where it comes back: the
     ends of an insertion whose middle is past what was fetched (the fetch
     keeps 32 bp either side of the reference, so HG002#1 at chr6:32,340,255
     leaves in a 705 bp insertion and comes back 478 bp on). The bar draws
     them where the layout has them, and so does the reading - the steps
     touching its end node, unbroken and in its piece, as far as each is the
     haplotype's own and in the room its insertion has there.

     That room is measured as it is between two nodes of one reading: from
     the end node to the nearest reference node the haplotype reads, that
     way - past any it skips. In a repeat the graph often leaves a few
     reference letters on the far side of an insertion that are letters the
     insertion has too: HG01943#1 comes back into its TTAGGG at chr1 on the
     T at 248,385,713, skipping the G before it, and its insertion is in the
     609 bp the layout made before that G. Bounded, so it is not wherever the
     layout has them: HG002#2's piece of chr17 from 38,989,253 starts on 60
     bp the layout put 60 kb back, with another walk's copy of them, among
     reference this haplotype reads. A run laid against the end node, each
     node against the one before, is the haplotype's too - over reference
     it has an allele for, chr6 at 32,339,279. */
  const alongAt = new Map(along.map((n, k) => [n.id, k]));
  const readHere = new Set<string>();
  for (const step of lane.steps) {
    const n = node(step.node);
    if (n && placedOnReference(original(n))) readHere.add(original(n).id);
  }
  const flank = (
    end: { index: number; o: GraphNode; step: LaneStep },
    after: boolean,
  ) => {
    /* Outward from the end node: on after it, or back before it. */
    const run: number[] = [];
    let expect = after ? end.index + 1 : end.index - 1;
    for (let j = 0; j < between.length; j++) {
      const k = between[after ? j : between.length - 1 - j];
      if (k !== expect || steps[k].segment !== end.step.segment) break;
      run.push(k);
      expect += after ? 1 : -1;
    }
    /* The way the walk runs out of the end node: past its right edge going
       forward out of it, or past its left edge going back. */
    const right = after !== !!end.step.reverse;
    const way = right ? 1 : -1;
    const at = alongAt.get(end.o.id);
    let next: GraphNode | undefined;
    if (at !== undefined) {
      for (let k = at + way; k >= 0 && k < along.length; k += way) {
        if (readHere.has(along[k].id)) {
          next = along[k];
          break;
        }
      }
    }
    const roomFrom = right ? end.o.x + end.o.length : next ? next.x + next.length : -Infinity;
    const roomTo = right ? (next ? next.x : Infinity) : end.o.x;
    const laid: number[] = [];
    let edge = right ? end.o.x + end.o.length : end.o.x;
    for (const k of run) {
      const a = node(steps[k].node)!;
      if (a.copyOf || a.untied) break;
      const against = Math.abs((right ? a.x : a.x + a.length) - edge) <= 0.5;
      const inRoom = a.x >= roomFrom - 0.5 && a.x + a.length <= roomTo + 0.5;
      if (!against && !inRoom) break;
      laid.push(k);
      edge = right ? a.x + a.length : a.x;
    }
    return after ? laid : laid.reverse();
  };
  const widen = (reading: WalkReading, run: number[]) => {
    for (const k of run) {
      const a = node(steps[k].node)!;
      reading.xLo = Math.min(reading.xLo, a.x);
      reading.xHi = Math.max(reading.xHi, a.x + a.length);
      reading.ownFrom = Math.min(reading.ownFrom, steps[k].start);
      reading.ownTo = Math.max(reading.ownTo, steps[k].end);
    }
  };
  const close = (reading: WalkReading) => {
    if (prev) {
      const tail = flank(prev, true);
      reading.steps.push(...tail);
      widen(reading, tail);
    }
    reading.leaves = true;
    readings.push(reading);
  };
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const n = node(step.node);
    if (!n) continue;
    const o = original(n);
    if (!placedOnReference(o)) {
      /* Reference the reference's own walk reads outside this band is
         somewhere else; an allele, even one the layout found no place for
         - a copy's, on chr17 at 38.9 Mb - is part of the reading it is in. */
      const elsewhere = n.elsewhere ?? o.elsewhere;
      if (elsewhere !== undefined) {
        /* Straight there from the reading's last node, on along the
           reference on its strand: a deletion running out of the band, as
           laneDeletions finds one for the bar. */
        if (
          cur &&
          prev &&
          !away &&
          i === prev.index + 1 &&
          step.segment === prev.step.segment &&
          !step.reverse === !prev.step.reverse
        ) {
          const [refFrom, refTo] = step.reverse
            ? [elsewhere + n.length, prev.o.refStart]
            : [prev.o.refEnd, elsewhere];
          if (refTo > refFrom) cur.out = { to: n.id, refFrom, refTo, bp: refTo - refFrom };
        }
        away = true;
      } else between.push(i);
      continue;
    }
    const reverse = !!step.reverse;
    const copy = seen.has(o.id);
    let gap = -1;
    if (cur && prev && !away && prev.step.segment === step.segment && !prev.step.reverse === !reverse) {
      gap = reverse ? prev.o.refStart - o.refEnd : o.refStart - prev.o.refEnd;
    }
    const along = gap >= 0;

    if (cur && prev && along && cur.copy === copy) {
      /* Inside the reading: what lies between its last reference node and
         this one - nothing, alleles, or reference it leaves out. */
      const leftX = reverse ? o.x + o.length : prev.o.x + prev.o.length;
      const rightX = reverse ? prev.o.x : o.x;
      const at = reverse ? o.refEnd : prev.o.refEnd;
      if (gap > 0) for (const skipped of passedOver(at, at + gap)) seen.add(skipped.id);
      if (between.length) {
        const alleles = between.map((k) => node(steps[k].node)!);
        const bp = alleles.reduce((sum, a) => sum + a.length, 0);
        /* Drawn where the layout has them, when that is between the two
           nodes either side: a first reading's alleles, given room there. */
        const inPlace = alleles.every(
          (a) =>
            !a.copyOf &&
            !a.untied &&
            a.x >= leftX - 0.5 &&
            a.x + a.length <= rightX + 0.5,
        );
        if (inPlace) {
          cur.steps.push(...between);
        } else if (gap > 0 && bp <= rightX - leftX) {
          /* Over the reference they stand in for, at its start: a copy's
             SNP, or an allele shorter than what it replaces. */
          const inOrder = reverse ? [...alleles].reverse() : alleles;
          const standIn: GraphNode = {
            id: `${alleles[0].id}@walk${standIns.length}`,
            sequence: inOrder.map((a) => a.sequence).join(""),
            length: bp,
            column: -1,
            x: leftX,
            row: 0,
            lanes: [],
            onReference: false,
            refStart: at,
            refEnd: at + gap,
          };
          standIns.push({ steps: [...between], node: standIn });
          cur.steps.push(-standIns.length);
        } else {
          cur.marks.push({ x: reverse ? rightX : leftX, bp, replaces: gap });
        }
      } else if (gap > 0) {
        deletions.push({
          reading: cur,
          after: cur.steps.length - 1,
          deletion: {
            left: leftX,
            right: rightX,
            refFrom: at,
            refTo: at + gap,
            bp: gap,
            walk: [prev.o.id, o.id],
            open: null,
            forward: !reverse,
          },
        });
      }
      cur.steps.push(i);
    } else {
      /* Where the walk leaves the band, or comes back into it. */
      const edge: boolean = !cur || !prev || away || prev.step.segment !== step.segment;
      if (cur) {
        if (edge) close(cur);
        else readings.push(cur);
      }
      const entry: WalkReading["entry"] = edge ? "start" : along ? "continues" : "jump";
      const head: number[] = edge ? flank({ index: i, o, step }, false) : [];
      cur = {
        segment: step.segment,
        reverse,
        copy,
        lo: o.refStart,
        hi: o.refEnd,
        xLo: o.x,
        xHi: o.x + o.length,
        ownFrom: step.start,
        ownTo: step.end,
        entry,
        leaves: false,
        inline: false,
        steps: [...head, i],
        marks: [],
        row: -1,
      };
      widen(cur, head);
    }
    seen.add(o.id);
    cur.lo = Math.min(cur.lo, o.refStart);
    cur.hi = Math.max(cur.hi, o.refEnd);
    cur.xLo = Math.min(cur.xLo, o.x);
    cur.xHi = Math.max(cur.xHi, o.x + o.length);
    cur.ownFrom = Math.min(cur.ownFrom, step.start);
    cur.ownTo = Math.max(cur.ownTo, step.end);
    prev = { index: i, o, step };
    between = [];
    away = false;
  }
  if (cur) close(cur);

  /* Rows: what it reads first on row 0 where it fits, every copy a row of
     its own, in the order the walk reads them. */
  const rows: WalkReading[][] = readings.length ? [[]] : [];
  const fits = (row: WalkReading[], r: WalkReading) =>
    row.every((o) => r.xHi <= o.xLo || r.xLo >= o.xHi);
  for (const r of readings) {
    if (!r.copy && fits(rows[0], r)) {
      r.row = 0;
      rows[0].push(r);
      continue;
    }
    r.row = rows.length;
    rows.push([r]);
  }

  /* The pieces no reading came from - but not those that read the
     reference outside this band. The fetch reaches those through jumps
     along the reference, a step for the context however far they go:
     HG02698#1's deletions carry it from chr17:38,989,375, in the band, to
     38,990,440, 38,991,637 and 38,994,525, and every haplotype reading the
     reference there comes back with a scrap of it - HG002#1 three, in place
     and none a copy. What lies outside the band has no row here; a jump
     out to it is drawn as the deletion it is, see `out`. */
  const placedPieces = new Set(readings.map((r) => r.segment));
  const unplaced: Array<WalkRows["unplaced"][number] & { outside: boolean }> = [];
  for (const step of steps) {
    if (placedPieces.has(step.segment)) continue;
    const n = node(step.node);
    const outside = !!n && (n.elsewhere !== undefined || original(n).elsewhere !== undefined);
    const last = unplaced[unplaced.length - 1];
    if (last && last.segment === step.segment) {
      last.ownFrom = Math.min(last.ownFrom, step.start);
      last.ownTo = Math.max(last.ownTo, step.end);
      last.outside = last.outside || outside;
    } else {
      unplaced.push({ segment: step.segment, ownFrom: step.start, ownTo: step.end, outside });
    }
  }
  const unknown = unplaced
    .filter((piece) => !piece.outside)
    .map(({ segment, ownFrom, ownTo }) => ({ segment, ownFrom, ownTo }));

  /* An inversion in place stays in its row, unlined. */
  readings.forEach((r, k) => {
    const before = readings[k - 1];
    const after = readings[k + 1];
    r.inline =
      !r.copy &&
      r.reverse &&
      r.row === 0 &&
      !!before &&
      !!after &&
      before.row === 0 &&
      after.row === 0 &&
      !before.reverse &&
      !after.reverse &&
      before.segment === r.segment &&
      after.segment === r.segment &&
      r.entry === "jump" &&
      after.entry === "jump" &&
      before.hi <= r.lo &&
      after.lo >= r.hi;
  });

  const readsOf = new Map<string, number[]>();
  readings.forEach((r, k) => {
    for (const index of r.steps) {
      if (index < 0) continue;
      const n = node(steps[index].node);
      if (!n) continue;
      const o = original(n);
      if (!placedOnReference(o)) continue;
      const list = readsOf.get(o.id);
      if (!list) readsOf.set(o.id, [k]);
      else if (list[list.length - 1] !== k) list.push(k);
    }
  });

  /* The model the rows are drawn from: the band's, and the stand-ins. */
  const nodeById = new Map(model.nodeById);
  for (const { node: standIn } of standIns) nodeById.set(standIn.id, standIn);
  const drawn: PangenomeModel = { ...model, nodeById };

  const rowLanes = rows.map((row, r) => {
    const rowSteps: LaneStep[] = [];
    const rowDeletions: LaneDeletion[] = [];
    for (const reading of row) {
      const firstOfReading = rowSteps.length;
      for (const index of reading.steps) {
        if (index < 0) {
          const { steps: stood, node: standIn } = standIns[-index - 1];
          const from = Math.min(...stood.map((k) => steps[k].start));
          const to = Math.max(...stood.map((k) => steps[k].end));
          rowSteps.push({
            node: standIn.id,
            start: from,
            end: to,
            segment: steps[stood[0]].segment,
            reverse: steps[stood[0]].reverse,
          });
          continue;
        }
        const step = steps[index];
        const n = node(step.node)!;
        rowSteps.push({ ...step, node: original(n).id });
      }
      for (const { reading: of, after, deletion } of deletions) {
        if (of !== reading) continue;
        rowDeletions.push({ ...deletion, step: firstOfReading + after });
      }
      /* A jump out of the band from its last node: open at the end that is
         outside it, so the row labels it as a bar does - "−1,059 bp →" -
         where the label fits in the white it leaves. */
      if (reading.out) {
        const last = reading.steps.length - 1;
        const at = reading.steps[last];
        const from = at >= 0 ? node(steps[at].node) : undefined;
        if (from) {
          const o = original(from);
          rowDeletions.push({
            left: reading.reverse ? null : o.x + o.length,
            right: reading.reverse ? o.x : null,
            refFrom: reading.out.refFrom,
            refTo: reading.out.refTo,
            bp: reading.out.bp,
            step: firstOfReading + last,
            walk: [o.id, reading.out.to],
            open: reading.reverse ? "left" : "right",
            forward: !reading.reverse,
          });
        }
      }
    }
    return {
      ...lane,
      key: `${lane.key} walk ${r}`,
      steps: rowSteps,
      order: rowSteps.map((s) => s.node),
      nodeSet: new Set(rowSteps.map((s) => s.node)),
      deletions: rowDeletions,
    };
  });

  /* By its first reading rather than by how much of each it has: a band
     a few hundred bases wide around an inversion can hold more of the
     inverted stretch than of the haplotype in place. */
  const inPlace = !rows[0]?.[0]?.reverse;

  return { readings, rows, unplaced: unknown, rowLanes, model: drawn, readsOf, inPlace };
}
