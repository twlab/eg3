import { GbzRecord } from "./record";

/* ══════════════════════════════════════════════════════════════════════════
   The four SQL statements the interval query needs, behind an interface so
   the same query code runs over node:sqlite (for the parity test) and over
   sql.js or wa-sqlite (in a worker).

   Only `Nodes` holds encoded blobs. `Paths` and `ReferenceIndex` are plain
   columns, which is what makes this tractable: SQL does the index lookup and
   only the handful of node records actually touched are ever decoded.
   ══════════════════════════════════════════════════════════════════════════ */

export interface GbzPath {
  handle: number;
  sample: string;
  contig: string;
  haplotype: number;
  fragment: number;
  isIndexed: boolean;
  /** GBWT position the path starts at, for walking an unindexed path. */
  fwNode: number;
  fwOffset: number;
}

export interface IndexedPosition {
  pathOffset: number;
  node: number;
  offset: number;
}

/** Anything that can answer the four queries, however it reaches the file. */
export interface GbzSource {
  /** `Paths` row for the fragment of this haplotype covering `fragment`. */
  findPath(
    sample: string,
    contig: string,
    haplotype: number,
    fragment: number,
  ): GbzPath | null;

  /** `Paths` row by handle, used to name the walks that come back. */
  getPath(handle: number): GbzPath | null;

  /** Every `Paths` row. The table has one row per haplotype fragment. */
  listPaths(): GbzPath[];

  /** Last indexed position at or before `pathOffset`. */
  indexedPosition(
    pathHandle: number,
    pathOffset: number,
  ): IndexedPosition | null;

  /** One decoded `Nodes` row. */
  getRecord(handle: number): GbzRecord | null;
}

/**
 * Caches decoded records for the lifetime of a query. A record is read once
 * and reused: `insert_context` walks both orientations of every node and the
 * path extraction then revisits all of them.
 */
export class RecordCache {
  private readonly cache = new Map<number, GbzRecord | null>();

  constructor(private readonly source: GbzSource) {}

  get(handle: number): GbzRecord | null {
    const hit = this.cache.get(handle);
    if (hit !== undefined) return hit;
    const record = this.source.getRecord(handle);
    this.cache.set(handle, record);
    return record;
  }
}
