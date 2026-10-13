import { useState } from "react";

import LocalDatabaseCard from "./LocalDatabaseCard";
import type { DatabaseSummary } from "@/core/gbz/worker/protocol";
import type { GraphFetchConfig } from "../genome-view/graphFetchConfig";

/* ══════════════════════════════════════════════════════════════════════════
   The start page when the title is switched to the Pangenome Browser: open
   a GBZ-base database and choose what to query in it.

   Load hands back the database and the query, the way pangenomeBrowser
   makes a session of them. eg3 has no pangenome view to draw that session
   yet, so for now the page keeps it and says what was chosen.
   ══════════════════════════════════════════════════════════════════════════ */

export default function PangenomePicker({
  mode,
  onLoad,
}: {
  /** A hosted database, or one from disk; see LocalDatabaseCard. */
  mode: "choose" | "upload";
  onLoad?: (summary: DatabaseSummary, config: GraphFetchConfig) => void;
}) {
  const [loaded, setLoaded] = useState<{
    summary: DatabaseSummary;
    config: GraphFetchConfig;
  } | null>(null);

  const handleLoad = (summary: DatabaseSummary, config: GraphFetchConfig) => {
    setLoaded({ summary, config });
    onLoad?.(summary, config);
  };

  const [start, end] = loaded?.config.interval.split("..").map(Number) ?? [];

  return (
    <div className="max-w-xl mx-auto px-4 py-4">
      <LocalDatabaseCard mode={mode} onLoad={handleLoad} />
      {loaded && (
        <div className="mt-4 rounded-md border border-gray-200 dark:border-gray-700 p-3 text-sm">
          <p className="font-medium">Ready to view</p>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            {loaded.summary.name} · {loaded.config.sample}{" "}
            {loaded.config.contig}:{start.toLocaleString()}–
            {end.toLocaleString()} · context {loaded.config.context} bp ·{" "}
            {loaded.config.haplotypes
              ? `${loaded.config.haplotypes.length} alternate path${
                  loaded.config.haplotypes.length === 1 ? "" : "s"
                }`
              : "every alternate path"}
            {loaded.config.tracks?.length
              ? ` · ${loaded.config.tracks.length} HPRC track${
                  loaded.config.tracks.length === 1 ? "" : "s"
                }`
              : ""}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            The pangenome view is not in this browser yet; this is what it
            will open on.
          </p>
        </div>
      )}
    </div>
  );
}
