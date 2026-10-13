import type { HaplotypeSummary, PathBounds } from "../bounds";
import type { IntervalQuery, SubgraphJson } from "../subgraph";

/* ══════════════════════════════════════════════════════════════════════════
   Messages between the page and the worker that owns the opened databases.

   Requests carry a `token` that the reply echoes back, so several queries can
   be in flight at once.
   ══════════════════════════════════════════════════════════════════════════ */

export interface DatabaseSummary {
  id: string;
  name: string;
  /** Size of the file, in bytes. */
  bytes: number;
  /** Where it is hosted, when it was opened from a URL rather than disk. */
  url?: string;
  /** Everything the graph carries, from the `Tags` table. */
  tags: Record<string, string>;
  haplotypes: HaplotypeSummary[];
  /** The indexed haplotype an interval query can start from, if there is one. */
  reference: HaplotypeSummary | null;
  referenceBounds: PathBounds | null;
}

export type GbzRequest =
  | { token: number; type: "open"; id: string; name: string; file: File }
  | { token: number; type: "openUrl"; id: string; name: string; url: string }
  | { token: number; type: "close"; id: string }
  | { token: number; type: "interval"; id: string; query: IntervalQuery }
  | {
      token: number;
      type: "pathBounds";
      id: string;
      query: { sample: string; contig: string; haplotype?: number };
    };

export type GbzResponse =
  | { token: number; ok: true; type: "open"; summary: DatabaseSummary }
  | { token: number; ok: true; type: "close" }
  | { token: number; ok: true; type: "interval"; result: SubgraphJson }
  | { token: number; ok: true; type: "pathBounds"; result: PathBounds | null }
  | { token: number; ok: false; error: string };
