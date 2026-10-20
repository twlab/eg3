import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import FileInput from "../ui/input/FileInput";
import {
  localPathBounds,
  closeLocalDatabase,
  openLocalDatabase,
  openRemoteDatabase,
} from "wuepgg3-track";
import type {
  DatabaseSummary,
  HaplotypeSummary,
  PathBounds,
} from "wuepgg3-track";
import { exampleRegions, initialWindow } from "../genome-view/graphFetchConfig";
import type { GraphFetchConfig } from "../genome-view/graphFetchConfig";
import { toEgTrack } from "@/core/hprc/hprcCatalog";
import type { HprcTrack } from "@/core/hprc/hprcCatalog";
import HprcTrackPicker from "./HprcTrackPicker";

/* ══════════════════════════════════════════════════════════════════════════
   Opens a GBZ-base database from disk and asks what to query.

   The file is read in the browser and queried by the gbz worker; nothing is
   uploaded. The form is prefilled from the file itself - its indexed paths and
   the region it covers - so Load works without touching anything.
   ══════════════════════════════════════════════════════════════════════════ */

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
};

const pathKey = (h: HaplotypeSummary) =>
  `${h.sample}#${h.haplotype}#${h.contig}`;

/** How many alternate paths the card lists at a time. */
const ALT_PAGE = 15;

const formatRange = (b: PathBounds) =>
  `${b.start.toLocaleString()}–${b.end.toLocaleString()}` +
  (b.fragments.length > 1 ? ` (${b.fragments.length} pieces)` : "");

/* Databases hosted where anyone can open them, the way eg3's genome configs
   name their tracks by URL: each is its file name after the last / of the
   folder they are served from. Read by range requests, so a button here
   costs nothing until a query needs the pages. */
const HOSTED_FOLDER = "https://wangcluster.wustl.edu/~cseng/scratch/";
const HOSTED_DATABASES: Array<{ label: string; url: string }> = [
  "yut2tTest.gbz.db",
  "hprc-v2.0-mc-chm13.gbz.db",
  "mhc.gbz.db",
].map((file) => ({ label: file, url: new URL(file, HOSTED_FOLDER).href }));

interface FormState {
  path: string;
  start: string;
  end: string;
  context: string;
}

export default function LocalDatabaseCard({
  onLoad,
  mode,
}: {
  onLoad: (summary: DatabaseSummary, config: GraphFetchConfig) => void;
  /** Where the database comes from: one of the hosted ones or a URL
      ("choose"), or a file from disk ("upload"). The rest of the card -
      what to query in it - is the same either way. */
  mode: "choose" | "upload";
}) {
  const [summary, setSummary] = useState<DatabaseSummary | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    path: "",
    start: "",
    end: "",
    context: "32",
  });

  /* Only an indexed path can start an interval query. */
  const queryable = useMemo(
    () => summary?.haplotypes.filter((h) => h.isReference) ?? [],
    [summary],
  );
  const selected = useMemo(
    () => queryable.find((h) => pathKey(h) === form.path) ?? null,
    [queryable, form.path],
  );

  /* ── The reference genome, then its paths ──────────────────────────
     The genomes a query can start from - CHM13 and GRCh38 in HPRC v2 - are
     the samples of the indexed paths. Which one is chosen is read off the
     selected path rather than kept apart from it, so picking a region of
     the other genome below switches the genome too. */
  const referenceGenomes = useMemo(
    () => [...new Set(queryable.map((h) => h.sample))],
    [queryable],
  );
  const referenceGenome = selected?.sample ?? referenceGenomes[0] ?? "";
  const genomePaths = useMemo(
    () => queryable.filter((h) => h.sample === referenceGenome),
    [queryable, referenceGenome],
  );
  /* A genome chosen: its path on the same contig if it has one, its first
     otherwise. */
  const chooseGenome = (genome: string) => {
    const paths = queryable.filter((h) => h.sample === genome);
    const next =
      paths.find((h) => h.contig === selected?.contig) ?? paths[0] ?? null;
    if (next) setForm((f) => ({ ...f, path: pathKey(next) }));
  };

  /* ── The alternate paths that genome has ───────────────────────────
     Every haplotype in the file but the reference genome's own, once each:
     a sample's haplotype assembled as many contigs is one line in the
     drawing. Picked here, the query returns only their walks - see
     keepHaplotypes - so nothing else is fetched, laid out or drawn. None to
     start: the reference alone, until the reader picks what to compare. */
  const alternates = useMemo(() => {
    const keys = new Set<string>();
    for (const h of summary?.haplotypes ?? []) {
      if (h.sample !== referenceGenome) keys.add(`${h.sample}#${h.haplotype}`);
    }
    return [...keys].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  }, [summary, referenceGenome]);
  /* Null is every one of them, which asks for no filter at all. */
  const [picked, setPicked] = useState<Set<string> | null>(() => new Set());
  const [altQuery, setAltQuery] = useState("");
  const [altPage, setAltPage] = useState(0);
  useEffect(() => {
    setPicked(new Set());
    setAltQuery("");
  }, [summary, referenceGenome]);
  const altNeedle = altQuery.trim().toLowerCase();
  const altListed = altNeedle
    ? alternates.filter((key) => key.toLowerCase().includes(altNeedle))
    : alternates;
  useEffect(() => setAltPage(0), [altQuery, summary, referenceGenome]);
  const altPages = Math.max(1, Math.ceil(altListed.length / ALT_PAGE));
  const altShown = altListed.slice(
    altPage * ALT_PAGE,
    (altPage + 1) * ALT_PAGE,
  );
  const isPicked = (key: string) => picked === null || picked.has(key);
  const pickedCount = picked === null ? alternates.length : picked.size;
  /* Some of them on or off together - one, a page, or all of them. */
  const setMany = (keys: string[], on: boolean) =>
    setPicked((was) => {
      const next = new Set(was ?? alternates);
      for (const key of keys) {
        if (on) next.add(key);
        else next.delete(key);
      }
      return next.size === alternates.length ? null : next;
    });

  /* The HPRC tracks of the picked haplotypes, from the picker below them. */
  const pickedKeys = useMemo(
    () => (picked === null ? alternates : [...picked]),
    [picked, alternates],
  );
  const [hprcTracks, setHprcTracks] = useState<HprcTrack[]>([]);
  /* Bumped by the alignment test region: the repeat tracks go off. */
  const [repeatsOff, setRepeatsOff] = useState(0);
  /* The alignment test region: the other reference genomes' haplotypes
     unpicked - GRCh38 against CHM13 - and the repeat tracks off. */
  const pickForTest = () => {
    const references = new Set(referenceGenomes);
    const isReference = (key: string) => references.has(key.split("#")[0]);
    setPicked((was) => {
      const from = was === null ? alternates : [...was];
      return new Set(from.filter((key) => !isReference(key)));
    });
    setRepeatsOff((n) => n + 1);
  };

  /* Only the regions this file can answer: it has to carry that sample and
     contig on a path an interval query can start from. */
  const offered = useMemo(
    () =>
      exampleRegions.flatMap((region) => {
        const path = queryable.find(
          (h) => h.sample === region.sample && h.contig === region.contig,
        );
        return path ? [{ region, path }] : [];
      }),
    [queryable],
  );

  /* The range of the path picked, and only that: each is a walk to the end
     of its path, record by record over the network. Measuring every one -
     198 in HPRC v2, one after another - took minutes after a file was
     picked, and Load waited behind them in the worker. Measured when the
     reader picks the path in the dropdown, once per path, and kept for Load
     and the graph's fetches to reuse; a path never picked there (the first,
     or a preset's) is measured by Load. */
  const [rangeOf, setRangeOf] = useState<Map<string, PathBounds>>(new Map());
  const asked = useRef(new Set<string>());
  useEffect(() => {
    setRangeOf(new Map());
    asked.current = new Set();
  }, [summary]);
  const measure = (key: string) => {
    const path = queryable.find((h) => pathKey(h) === key);
    if (!summary || !path || asked.current.has(key)) return;
    asked.current.add(key);
    void localPathBounds(summary.id, path)
      .catch(() => null)
      .then((found) => {
        if (found) setRangeOf((was) => new Map(was).set(key, found));
      });
  };

  const bounds = selected ? (rangeOf.get(pathKey(selected)) ?? null) : null;

  /* Prefill from the file: its reference path, and the same window the bundled
     examples use when this database is one of them. */
  useEffect(() => {
    if (!summary?.reference) return;
    const window = initialWindow(summary.reference, summary.referenceBounds);

    setForm({
      path: pathKey(summary.reference),
      start: String(window.start),
      end: String(window.end),
      context: "32",
    });
  }, [summary]);

  /* One way to open, whether the database is a file picked from disk or one
     hosted on a server: only the opener differs. */
  const openWith = async (
    label: string,
    opener: () => Promise<DatabaseSummary>,
  ) => {
    setOpenError(null);
    setOpening(label);
    try {
      if (summary) await closeLocalDatabase(summary.id);
      const opened = await opener();
      setSummary(opened);
      if (!opened.reference) {
        setOpenError(
          `${opened.name} has no indexed path, so it cannot answer interval queries. Rebuild it with gbz2db so a reference path is indexed.`,
        );
      }
    } catch (problem) {
      setSummary(null);
      setOpenError(
        problem instanceof Error ? problem.message : String(problem),
      );
    } finally {
      setOpening(null);
    }
  };

  const handleFile = (file: File | null) => {
    if (file) void openWith(file.name, () => openLocalDatabase(file));
  };

  const [url, setUrl] = useState("");
  const handleUrl = (address: string) => {
    const trimmed = address.trim();
    try {
      new URL(trimmed);
    } catch {
      setOpenError(`"${trimmed}" is not a URL.`);
      return;
    }
    void openWith(trimmed, () => openRemoteDatabase(trimmed));
  };

  const start = Number(form.start);
  const end = Number(form.end);
  const context = Number(form.context);

  const problem = useMemo(() => {
    if (!summary) return null;
    if (!selected) return "Choose a path to query.";
    if (!Number.isInteger(start) || !Number.isInteger(end))
      return "Start and end must be whole numbers.";
    if (start < 0) return "Start cannot be negative.";
    if (end <= start) return "End must be greater than start.";
    if (!Number.isInteger(context) || context < 0)
      return "Context must be zero or more.";
    if (bounds && (start < bounds.start || end > bounds.end)) {
      return `Outside the region this file covers (${bounds.start.toLocaleString()}-${bounds.end.toLocaleString()}).`;
    }
    return null;
  }, [summary, selected, start, end, context, bounds]);

  const handleLoad = () => {
    if (!summary || !selected || problem) return;
    onLoad(summary, {
      database: summary.id,
      format: "json",
      contig: selected.contig,
      sample: selected.sample,
      interval: `${start}..${end}`,
      context,
      ...(picked === null ? {} : { haplotypes: [...picked] }),
      /* Named either way: each is a row of the view. */
      lanes: pickedKeys,
      ...(hprcTracks.length ? { tracks: hprcTracks.map(toEgTrack) } : {}),
      /* Measured already, so Load need not measure it again. */
      ...(bounds ? { range: { start: bounds.start, end: bounds.end } } : {}),
    });
  };

  const field =
    "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-tint";
  const label =
    "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

  return (
    <motion.div
      layout
      className="rounded-xl shadow-lg dark:bg-dark-surface overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      <div className="p-6">
        {mode === "choose" ? (
          <>
            <h2 className="mb-1 text-3xl font-semibold">Choose a pangenome</h2>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              A GBZ-base database (<code>.gbz.db</code>) hosted online. It is
              read in your browser a page at a time, as a query needs it, so
              even a large graph opens at once.
            </p>
            <div className="flex flex-col gap-2">
              {HOSTED_DATABASES.map((hosted) => (
                <button
                  key={hosted.url}
                  type="button"
                  title={hosted.url}
                  disabled={!!opening}
                  onClick={() => handleUrl(hosted.url)}
                  className={`rounded-md border px-3 py-2 text-left text-sm cursor-pointer disabled:opacity-50 disabled:cursor-default ${
                    summary?.url === hosted.url
                      ? "border-tint bg-tint text-white"
                      : "border-gray-300 dark:border-gray-600 hover:border-tint hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {opening === hosted.url
                    ? `Opening ${hosted.label}…`
                    : hosted.label}
                </button>
              ))}
            </div>
            <form
              className="mt-4"
              onSubmit={(event) => {
                event.preventDefault();
                handleUrl(url);
              }}
            >
              <label className={label} htmlFor="pgv-url">
                Or open one by its URL
              </label>
              <div className="flex gap-2">
                <input
                  id="pgv-url"
                  className={field}
                  type="url"
                  placeholder="https://…/graph.gbz.db"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                />
                <button
                  type="submit"
                  disabled={!!opening || !url.trim()}
                  className="shrink-0 rounded-md bg-tint px-3 py-1.5 text-sm text-white disabled:opacity-50"
                >
                  Open
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="mb-1 text-3xl font-semibold">Upload a pangenome</h2>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              A GBZ-base database (<code>.gbz.db</code>), built from a{" "}
              <code>.gbz</code> with <code>gbz2db</code>, from disk. It is read
              in your browser, a page at a time, and never leaves your computer.
            </p>
            <FileInput
              accept=".db"
              onFileChange={handleFile}
              containerClassName="w-full"
              className="h-28"
              dragMessage={
                summary
                  ? `${summary.name} — drop another to replace`
                  : "Drop a .gbz.db file here"
              }
              clickMessage={
                opening ? `Opening ${opening}…` : "Click to select one"
              }
            />
          </>
        )}

        {openError && (
          <p className="mt-3 rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
            {openError}
          </p>
        )}

        {summary && summary.reference && (
          <>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              {formatBytes(summary.bytes)} · {summary.tags.nodes ?? "?"} nodes ·{" "}
              {summary.haplotypes.length} haplotype
              {summary.haplotypes.length === 1 ? "" : "s"}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <span className={label}>Reference genome</span>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {referenceGenomes.map((genome) => (
                    <button
                      key={genome}
                      type="button"
                      onClick={() => chooseGenome(genome)}
                      className={`rounded-md border px-3 py-1 text-sm cursor-pointer ${
                        genome === referenceGenome
                          ? "border-tint bg-tint text-white"
                          : "border-gray-300 dark:border-gray-600 hover:border-tint"
                      }`}
                    >
                      {genome}
                    </button>
                  ))}
                </div>
                <label className={label} htmlFor="pgv-path">
                  {referenceGenome} path
                </label>
                <select
                  id="pgv-path"
                  className={field}
                  value={form.path}
                  onChange={(e) => {
                    const key = e.target.value;
                    setForm((f) => ({ ...f, path: key }));
                    measure(key);
                  }}
                >
                  {genomePaths.map((h) => (
                    <option key={pathKey(h)} value={pathKey(h)}>
                      {h.sample} · haplotype {h.haplotype} · {h.contig}
                      {rangeOf.has(pathKey(h))
                        ? ` · ${formatRange(rangeOf.get(pathKey(h))!)}`
                        : ""}
                    </option>
                  ))}
                </select>
                {summary.haplotypes.length > queryable.length && (
                  <p className="mt-1 text-xs text-gray-400">
                    {summary.haplotypes.length - queryable.length} other
                    haplotype
                    {summary.haplotypes.length - queryable.length === 1
                      ? " is"
                      : "s are"}{" "}
                    in the graph but not indexed, so a query cannot start from
                    {summary.haplotypes.length - queryable.length === 1
                      ? " it"
                      : " them"}
                    . They still appear in the view.
                  </p>
                )}
              </div>

              {alternates.length > 0 && (
                <div className="col-span-2">
                  <div className="flex items-baseline justify-between">
                    <span className={label}>
                      Alternate paths for {referenceGenome} ·{" "}
                      {pickedCount.toLocaleString()} of{" "}
                      {alternates.length.toLocaleString()} picked
                    </span>
                    {altPages > 1 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        <button
                          type="button"
                          className="px-1 text-tint disabled:text-gray-300 cursor-pointer disabled:cursor-default"
                          disabled={altPage <= 0}
                          onClick={() => setAltPage(altPage - 1)}
                          aria-label="Previous page"
                        >
                          ‹
                        </button>
                        {altPage + 1} of {altPages}
                        <button
                          type="button"
                          className="px-1 text-tint disabled:text-gray-300 cursor-pointer disabled:cursor-default"
                          disabled={altPage >= altPages - 1}
                          onClick={() => setAltPage(altPage + 1)}
                          aria-label="Next page"
                        >
                          ›
                        </button>
                      </span>
                    )}
                  </div>
                  <input
                    className={field}
                    type="search"
                    placeholder="search, e.g. HG002 or #2"
                    value={altQuery}
                    onChange={(event) => setAltQuery(event.target.value)}
                  />
                  <div className="mt-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 grid grid-cols-3 gap-x-3 text-xs">
                    {altShown.map((key) => (
                      <label
                        key={key}
                        className="flex items-center gap-1.5 py-0.5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isPicked(key)}
                          onChange={() => setMany([key], !isPicked(key))}
                        />
                        <span className="truncate" title={key}>
                          {key}
                        </span>
                      </label>
                    ))}
                    {altShown.length === 0 && (
                      <span className="col-span-3 text-gray-400">
                        no haplotype matches
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs">
                    <button
                      type="button"
                      className="text-tint hover:underline cursor-pointer"
                      onClick={() => setMany(altShown, true)}
                    >
                      add all on this page
                    </button>
                    <button
                      type="button"
                      className="text-tint hover:underline cursor-pointer"
                      onClick={() => setPicked(null)}
                    >
                      all
                    </button>
                    <button
                      type="button"
                      className="text-tint hover:underline cursor-pointer"
                      onClick={() => setMany(alternates, false)}
                    >
                      none
                    </button>
                  </div>
                </div>
              )}

              <HprcTrackPicker
                referenceGenome={referenceGenome}
                haplotypes={pickedKeys}
                onChange={setHprcTracks}
                repeatsOff={repeatsOff}
              />

              <div>
                <label className={label} htmlFor="pgv-start">
                  Start
                </label>
                <input
                  id="pgv-start"
                  className={field}
                  inputMode="numeric"
                  value={form.start}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, start: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className={label} htmlFor="pgv-end">
                  End
                </label>
                <input
                  id="pgv-end"
                  className={field}
                  inputMode="numeric"
                  value={form.end}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, end: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className={label} htmlFor="pgv-context">
                  Context (bp)
                </label>
                <input
                  id="pgv-context"
                  className={field}
                  inputMode="numeric"
                  value={form.context}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, context: e.target.value }))
                  }
                />
                <p className="mt-1 text-xs text-gray-400">
                  Pulls in the alleles other haplotypes branch out to.
                </p>
              </div>

              <div className="flex items-end">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {bounds
                    ? `${selected?.contig} covers ${formatRange(bounds)}`
                    : selected && asked.current.has(pathKey(selected))
                      ? "Measuring this path's range…"
                      : "Range measured on Load"}
                  {end > start ? ` · ${(end - start).toLocaleString()} bp` : ""}
                </p>
              </div>
            </div>

            {offered.length > 0 && (
              <div className="mt-3">
                <span className={label}>Regions in this graph</span>
                <div className="flex flex-wrap gap-1.5">
                  {offered.map(({ region, path }) => {
                    const key = pathKey(path);
                    const on =
                      form.path === key &&
                      form.start === String(region.start) &&
                      form.end === String(region.end);
                    return (
                      <button
                        key={`${key}:${region.start}`}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({
                            ...f,
                            path: key,
                            start: String(region.start),
                            end: String(region.end),
                          }));
                          if (region.alignmentTest) pickForTest();
                          if (region.haplotypes)
                            setPicked(new Set(region.haplotypes));
                        }}
                        className={`rounded-md border px-2 py-1 text-xs cursor-pointer ${
                          on
                            ? "border-tint bg-tint text-white"
                            : "border-gray-300 dark:border-gray-600 hover:border-tint"
                        }`}
                        title={`${region.contig}:${region.start.toLocaleString()}-${region.end.toLocaleString()} on ${region.sample} - ${region.note}`}
                      >
                        {region.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {problem && (
              <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                {problem}
              </p>
            )}

            <button
              className="mt-4 w-full rounded-md bg-tint px-4 py-2 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              onClick={handleLoad}
              disabled={!!problem}
            >
              Load
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
