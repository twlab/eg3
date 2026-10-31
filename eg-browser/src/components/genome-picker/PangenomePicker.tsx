import { useState } from "react";

import LocalDatabaseCard from "./LocalDatabaseCard";
import {
  GenomeHubManager,
  localPathBounds,
  GRAPH_PART,
  PANGENOME_TRACK_TYPE,
} from "wuepgg3-track";
import type { DatabaseSummary, IGenome } from "wuepgg3-track";
import type { GraphFetchConfig } from "../genome-view/graphFetchConfig";
import { useAppDispatch } from "@/lib/redux/hooks";
import { createSession } from "@/lib/redux/slices/browserSlice";

/* ══════════════════════════════════════════════════════════════════════════
   The start page when the title is switched to the Pangenome Browser: open
   a GBZ-base database, choose what to query in it, and Load.

   Load opens it the way eg3 opens any genome: a genome whose chromosome is
   the reference path's contig, as long as the graph has it, with the graph
   as a track - TrackManager lays every other track out along the graph, the
   way it does along an alignment (see fetchPangenomeData).
   ══════════════════════════════════════════════════════════════════════════ */

export default function PangenomePicker({
  mode,
}: {
  /** A hosted database, or one from disk; see LocalDatabaseCard. */
  mode: "choose" | "upload";
}) {
  const dispatch = useAppDispatch();
  const [problem, setProblem] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  const handleLoad = async (
    summary: DatabaseSummary,
    config: GraphFetchConfig,
  ) => {
    setProblem(null);
    setOpening(true);
    try {
      /* The picked path's range, which sets how long the contig is - and
         so how far the view can pan. The start page measures it when the
         path is picked; only a Load before that has finished measures it. */
      const bounds =
        config.range ??
        (await localPathBounds(summary.id, {
          sample: config.sample,
          contig: config.contig,
        }));
      const [start, end] = config.interval.split("..").map(Number);
      /* Every row of the graph asks the same of the same database, so the
         band is fetched once for all of them. */
      const graph = {
        database: summary.id,
        ...(summary.url ? { url: summary.url } : {}),
        sample: config.sample,
        context: config.context,
        ...(config.haplotypes ? { haplotypes: config.haplotypes } : {}),
        /* And handed to the graph's fetches, which clip to it. */
        ...(bounds
          ? { range: { contig: config.contig, start: bounds.start, end: bounds.end } }
          : {}),
      };
      const hprc = config.tracks ?? [];
      const genome: IGenome = {
        id: `pangenome:${summary.name}:${config.sample}:${config.contig}`,
        name: `${config.sample} · ${summary.name}`,
        chromosomes: [
          { name: config.contig, length: Math.max(bounds?.end ?? end, end) },
        ],
        defaultRegion: `${config.contig}:${start}-${end}`,
        defaultTracks: [
          { type: "ruler", name: "Ruler" },
          /* The graph's own row, on the reference. */
          {
            type: PANGENOME_TRACK_TYPE,
            name: config.sample,
            options: { ...graph, part: GRAPH_PART, label: config.sample },
          },
          /* The sample tracks in the reference's own coordinates. */
          ...hprc.filter((track) => track.onReference),
          /* Each haplotype a row of its own, and its tracks under it: in
             its own coordinates, as a query genome the graph places. */
          ...(config.lanes ?? []).flatMap((key) => [
            {
              type: PANGENOME_TRACK_TYPE,
              name: key,
              options: { ...graph, part: key, label: key },
            },
            ...hprc
              .filter((track) => track.altPath === key)
              .map((track) => ({
                ...track,
                querygenome: key,
                metadata: { ...(track.metadata ?? {}), genome: key },
              })),
          ]),
        ],
        customGenome: true,
      };
      await GenomeHubManager.getInstance().putGenome(genome);
      dispatch(createSession({ genome }));
    } catch (error) {
      setProblem(error instanceof Error ? error.message : String(error));
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4">
      <LocalDatabaseCard mode={mode} onLoad={handleLoad} />
      {opening && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Opening the view…
        </p>
      )}
      {problem && (
        <p className="mt-3 rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
          {problem}
        </p>
      )}
    </div>
  );
}
