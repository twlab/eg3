/* ══════════════════════════════════════════════════════════════════════════
   Three fetched windows into one subgraph.

   The browser fetches a tile either side of the one you are looking at, so
   panning has something to show before the next fetch lands. Drawn as three
   separate canvases those tiles read as three unrelated pictures: a haplotype
   is laid out afresh in each, the same node can sit at a different height in
   each, and the seams between them are indistinguishable from real breaks in a
   walk.

   Merged first, they lay out once. The graph is a set - the same node fetched
   twice is one node - so the union is the whole of it, and the only care
   needed is over the walks: two windows that abut describe one continuous
   stretch of a haplotype and have to be spliced, while two that do not are
   left as the separate segments they are.
   ══════════════════════════════════════════════════════════════════════════ */

interface Step {
  id: string;
  is_reverse?: boolean;
}

interface Path {
  name?: string;
  sample?: string;
  contig?: string;
  haplotype?: number;
  is_reference?: boolean;
  path?: Step[];
  [key: string]: unknown;
}

interface Subgraph {
  nodes: Array<{ id: string; sequence?: string }>;
  edges: Array<{
    from: string;
    to: string;
    from_is_reverse?: boolean;
    to_is_reverse?: boolean;
  }>;
  paths: Path[];
}

/** `SAMPLE#HAP#CONTIG[start-end]`, the same shape pangenomeModel reads. */
const WALK_NAME = /^(.*?)#(\d+)#([^[\]]+?)(?:\[(\d+)-(\d+)\])?$/;

interface Named {
  sample: string;
  haplotype: number;
  contig: string;
  start: number | null;
  end: number | null;
}

function parseName(path: Path): Named {
  const match = path.name ? WALK_NAME.exec(path.name) : null;
  if (match) {
    return {
      sample: path.sample ?? match[1],
      haplotype: path.haplotype ?? Number(match[2]),
      contig: path.contig ?? match[3],
      start: match[4] === undefined ? null : Number(match[4]),
      end: match[5] === undefined ? null : Number(match[5]),
    };
  }
  return {
    sample: path.sample ?? path.name ?? "?",
    haplotype: path.haplotype ?? 0,
    contig: path.contig ?? "?",
    start: null,
    end: null,
  };
}

const laneKey = (named: Named) =>
  `${named.sample}#${named.haplotype}#${named.contig}`;

const rename = (named: Named, start: number | null, end: number | null) =>
  start === null || end === null
    ? `${named.sample}#${named.haplotype}#${named.contig}`
    : `${named.sample}#${named.haplotype}#${named.contig}[${start}-${end}]`;

/** The lowest coordinate any walk in a window reaches, for ordering windows. */
function windowStart(graph: Subgraph): number {
  let lowest = Infinity;
  for (const path of graph.paths ?? []) {
    const named = parseName(path);
    if (named.start !== null && named.start < lowest) lowest = named.start;
  }
  return lowest;
}

/**
 * Merges fetched windows into one subgraph, in genomic order.
 *
 * Windows are ordered by where their walks actually start rather than by the
 * order they arrive in: the fetch order depends on which way you last panned,
 * and a picture that reverses itself depending on that would be worse than
 * three separate ones.
 *
 * Anything that is not a subgraph - an error placeholder, an empty tile - is
 * skipped. Returns null when nothing usable is left.
 */
export function mergeSubgraphs(results: unknown[]): Subgraph | null {
  const graphs = results
    .map((entry) => {
      const result = (entry as { result?: unknown })?.result ?? entry;
      const graph = result as Subgraph;
      return graph && Array.isArray(graph.nodes) && graph.nodes.length
        ? graph
        : null;
    })
    .filter((graph): graph is Subgraph => graph !== null)
    .sort((a, b) => windowStart(a) - windowStart(b));

  if (!graphs.length) return null;
  if (graphs.length === 1) return graphs[0];

  /* ── The graph itself is a set ────────────────────────────────────────── */
  const nodes = new Map<string, { id: string; sequence?: string }>();
  const edges = new Map<string, Subgraph["edges"][number]>();

  for (const graph of graphs) {
    for (const node of graph.nodes ?? []) {
      /* A node fetched twice is one node, but only one copy carries its
         sequence if a window happened to clip it. Keep the longer. */
      const seen = nodes.get(node.id);
      if (!seen || (node.sequence?.length ?? 0) > (seen.sequence?.length ?? 0)) {
        nodes.set(node.id, node);
      }
    }
    for (const edge of graph.edges ?? []) {
      edges.set(
        `${edge.from}:${edge.from_is_reverse ? 1 : 0}>${edge.to}:${
          edge.to_is_reverse ? 1 : 0
        }`,
        edge,
      );
    }
  }

  /* ── Walks need more care than a set ─────────────────────────────────── */
  const byLane = new Map<string, Array<{ named: Named; path: Path }>>();
  const order: string[] = [];

  for (const graph of graphs) {
    for (const path of graph.paths ?? []) {
      const named = parseName(path);
      const key = laneKey(named);
      let walks = byLane.get(key);
      if (!walks) {
        walks = [];
        byLane.set(key, walks);
        order.push(key);
      }
      walks.push({ named, path });
    }
  }

  const paths: Path[] = [];
  for (const key of order) {
    const walks = byLane.get(key)!;
    walks.sort((a, b) => (a.named.start ?? 0) - (b.named.start ?? 0));

    let current: { named: Named; path: Path } | null = null;
    for (const walk of walks) {
      if (!current) {
        current = { named: { ...walk.named }, path: { ...walk.path } };
        continue;
      }
      if (joinable(current, walk)) {
        current.path.path = absorb(
          current.path.path ?? [],
          walk.path.path ?? [],
        );
        current.named.end =
          walk.named.end === null
            ? current.named.end
            : Math.max(current.named.end ?? walk.named.end, walk.named.end);
        current.path.name = rename(
          current.named,
          current.named.start,
          current.named.end,
        );
        current.path.is_reference =
          current.path.is_reference || walk.path.is_reference;
        continue;
      }
      paths.push(current.path);
      current = { named: { ...walk.named }, path: { ...walk.path } };
    }
    if (current) paths.push(current.path);
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()], paths };
}

/**
 * Whether two walks of one haplotype describe one stretch rather than two.
 *
 * Coordinates settle it: windows that abut or overlap are one stretch, and a
 * haplotype that genuinely left the window and came back is not. Where a walk
 * name carries no coordinates, a shared node is the only evidence there is.
 */
function joinable(
  left: { named: Named; path: Path },
  right: { named: Named; path: Path },
): boolean {
  if (!left.path.path?.length || !right.path.path?.length) return false;

  if (left.named.end !== null && right.named.start !== null) {
    return right.named.start <= left.named.end;
  }
  return sharesNode(left.path.path, right.path.path);
}

/** Whether the two walks touch the same node anywhere near their join. */
function sharesNode(left: Step[], right: Step[]): boolean {
  const near = new Set(left.map((step) => step.id));
  return right.some((step) => near.has(step.id));
}

/**
 * Folds the second walk into the first.
 *
 * The windows are fetched with context and the browser holds three of them at
 * once, so the second walk is usually not the continuation it looks like: it
 * can repeat the tail of the first, or - before anything has been panned - be
 * the very same window over again. Splicing at the last place the second walk
 * starts inside the first covers all three cases, and a walk that adds nothing
 * leaves the first unchanged rather than doubling it.
 */
function absorb(left: Step[], right: Step[]): Step[] {
  if (!right.length) return left;
  if (!left.length) return right;

  let head = -1;
  for (let i = left.length - 1; i >= 0; i--) {
    if (left[i].id === right[0].id) {
      head = i;
      break;
    }
  }
  /* Nothing in common: a real break in the walk, kept as one. */
  if (head === -1) return [...left, ...right];

  /* What the first walk already holds from that point on. If the second adds
     nothing beyond it, it is a repeat and is dropped. */
  const covered = left.length - head;
  if (covered > right.length) return left;
  return [...left.slice(0, head), ...right];
}
