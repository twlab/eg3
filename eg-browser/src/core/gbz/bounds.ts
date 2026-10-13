import { RecordCache } from "./store";
import type { GbzPath, GbzSource } from "./store";

/* ══════════════════════════════════════════════════════════════════════════
   Path bounds - the equivalent of `query --path-bounds`.

   The graph covers only a slice of each haplotype, so a caller that pans past
   the edge needs to know where the slice starts and ends before querying.
   ══════════════════════════════════════════════════════════════════════════ */

export interface PathFragment {
  start: number;
  end: number;
}

export interface PathBounds {
  sample: string;
  contig: string;
  haplotype: number;
  start: number;
  end: number;
  fragments: PathFragment[];
}

/* Every path in a database, listed once per open source. A picker asks for
   the bounds of each of its paths in turn, and HPRC v2 has 94,554 of them:
   listing them all again for every one of 198 references was most of the
   time those answers took. */
const pathLists = new WeakMap<GbzSource, GbzPath[]>();
function pathsOf(source: GbzSource): GbzPath[] {
  let paths = pathLists.get(source);
  if (!paths) {
    paths = source.listPaths();
    pathLists.set(source, paths);
  }
  return paths;
}

/**
 * Length of one path fragment in base pairs.
 *
 * An indexed path is walked only from its last indexed position, which is a
 * single index interval. An unindexed path has to be walked from the start,
 * so this is proportional to the length of the path - fine for the short
 * haplotype fragments, best avoided for a whole reference.
 */
export function pathLength(source: GbzSource, path: GbzPath): number {
  const cache = new RecordCache(source);

  let offset = 0;
  let pos = { node: path.fwNode, offset: path.fwOffset };
  if (path.isIndexed) {
    const last = source.indexedPosition(path.handle, Number.MAX_SAFE_INTEGER);
    if (last) {
      offset = last.pathOffset;
      pos = { node: last.node, offset: last.offset };
    }
  }

  for (;;) {
    const record = cache.get(pos.node);
    if (!record) break;
    offset += record.sequenceLength;
    const next = record.lf(pos.offset);
    if (!next) break;
    pos = next;
  }
  return offset;
}

/**
 * Bounds of a haplotype inside the graph, in haplotype coordinates. A
 * haplotype stored as several fragments reports each of them, and the outer
 * start/end span the lot.
 */
export function pathBounds(
  source: GbzSource,
  query: { sample: string; contig: string; haplotype?: number },
): PathBounds | null {
  const haplotype = query.haplotype ?? 0;
  const rows = pathsOf(source)
    .filter(
      (p) =>
        p.sample === query.sample &&
        p.contig === query.contig &&
        p.haplotype === haplotype,
    )
    .sort((a, b) => a.fragment - b.fragment);

  if (rows.length === 0) return null;

  const fragments = rows.map((row) => ({
    start: row.fragment,
    end: row.fragment + pathLength(source, row),
  }));

  return {
    sample: query.sample,
    contig: query.contig,
    haplotype,
    start: fragments[0].start,
    end: fragments[fragments.length - 1].end,
    fragments,
  };
}

/**
 * The haplotypes a database contains, one entry per sample/contig/haplotype,
 * so a picker can show what is inside a file before anything is queried.
 */
export interface HaplotypeSummary {
  sample: string;
  contig: string;
  haplotype: number;
  isReference: boolean;
  fragments: number;
}

export function listHaplotypes(source: GbzSource): HaplotypeSummary[] {
  const grouped = new Map<string, HaplotypeSummary>();
  for (const path of pathsOf(source)) {
    const key = `${path.sample}#${path.haplotype}#${path.contig}`;
    const seen = grouped.get(key);
    if (seen) {
      seen.fragments += 1;
      seen.isReference = seen.isReference || path.isIndexed;
    } else {
      grouped.set(key, {
        sample: path.sample,
        contig: path.contig,
        haplotype: path.haplotype,
        isReference: path.isIndexed,
        fragments: 1,
      });
    }
  }
  /* Indexed paths first: those are the ones an interval query can start from. */
  return [...grouped.values()].sort((a, b) => {
    if (a.isReference !== b.isReference) return a.isReference ? -1 : 1;
    return a.sample.localeCompare(b.sample) || a.haplotype - b.haplotype;
  });
}
