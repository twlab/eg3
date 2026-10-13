import {
  decodeEdges,
  decodePathAnchors,
  decodeSequence,
  ENDMARKER,
  RLEIter,
} from "./codec";
import type { PathAnchor, Pos } from "./codec";

/* ══════════════════════════════════════════════════════════════════════════
   One row of the Nodes table, decoded.

   A GBZ-base row holds a single GBWT node record: the outgoing edges, the
   run-length encoded BWT that says which edge each walk through this node
   takes, the sequence, and gbz-base's own index from GBWT offset to the path
   the walk belongs to.
   ══════════════════════════════════════════════════════════════════════════ */

/** The raw column values, as read from SQLite. */
export interface RawRecord {
  handle: number;
  edges: Uint8Array;
  bwt: Uint8Array;
  sequence: Uint8Array;
  pathHandles: Uint8Array | null;
}

export class GbzRecord {
  readonly handle: number;
  readonly edges: Pos[];
  readonly sequence: string;
  /** Sampled path positions in this record, ascending by `nodeOffset`. */
  readonly pathAnchors: PathAnchor[];
  private readonly bwt: Uint8Array;

  constructor(raw: RawRecord) {
    const edges = decodeEdges(raw.edges);
    if (edges === null) throw new Error(`Empty record for handle ${raw.handle}`);
    this.handle = raw.handle;
    this.edges = edges;
    this.bwt = raw.bwt;
    this.sequence = decodeSequence(raw.sequence);
    this.pathAnchors = raw.pathHandles
      ? decodePathAnchors(raw.pathHandles)
      : [];
  }

  get sequenceLength(): number {
    return this.sequence.length;
  }

  /**
   * The anchor at the given BWT offset, or null if that occurrence was not
   * sampled. Most offsets have none. Mirrors `GBZRecord::anchor_at` in Rust.
   */
  anchorAt(nodeOffset: number): PathAnchor | null {
    let low = 0;
    let high = this.pathAnchors.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      const found = this.pathAnchors[mid].nodeOffset;
      if (found === nodeOffset) return this.pathAnchors[mid];
      if (found < nodeOffset) low = mid + 1;
      else high = mid - 1;
    }
    return null;
  }

  /** Destination handles of the real outgoing edges. */
  successors(): number[] {
    return this.edges
      .filter((edge) => edge.node !== ENDMARKER)
      .map((edge) => edge.node);
  }

  /**
   * Expands the BWT into one successor position per walk through this node.
   * Offsets accumulate as the runs are consumed: the n-th walk taking a given
   * edge lands at the n-th position of the destination record.
   */
  decompress(): Pos[] {
    const edges = this.edges.map((edge) => ({ ...edge }));
    const result: Pos[] = [];
    const iter = new RLEIter(this.bwt, this.edges.length);
    for (let run = iter.next(); run !== null; run = iter.next()) {
      for (let i = 0; i < run.len; i++) {
        const edge = edges[run.value];
        result.push({ node: edge.node, offset: edge.offset });
        edge.offset += 1;
      }
    }
    return result;
  }

  /**
   * Follows the walk at offset `i` to its successor position, or null if the
   * walk ends here. The same accumulation as `decompress`, stopped early.
   */
  lf(i: number): Pos | null {
    const edges = this.edges.map((edge) => ({ ...edge }));
    let offset = 0;
    const iter = new RLEIter(this.bwt, this.edges.length);
    for (let run = iter.next(); run !== null; run = iter.next()) {
      if (offset + run.len > i) {
        const edge = edges[run.value];
        if (edge.node === ENDMARKER) return null;
        return { node: edge.node, offset: edge.offset + (i - offset) };
      }
      edges[run.value].offset += run.len;
      offset += run.len;
    }
    return null;
  }
}
