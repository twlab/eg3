import { useEffect, useMemo, useState } from "react";

import {
  HPRC_LAYERS,
  hprcReferenceOf,
  hprcTracksFor,
  loadHprcCatalog,
  trackPath,
} from "@/core/hprc/hprcCatalog";
import type { HprcTrack } from "@/core/hprc/hprcCatalog";

/* ══════════════════════════════════════════════════════════════════════════
   The HPRC epigenome tracks of the haplotypes picked to draw.

   The layers are chosen the way the HPRC Epigenome Browser chooses them;
   the tracks they come to are listed under, each on or off as the site
   starts it. Only shown for a graph on a reference the catalog knows -
   CHM13 or GRCh38.
   ══════════════════════════════════════════════════════════════════════════ */

export default function HprcTrackPicker({
  referenceGenome,
  haplotypes,
  onChange,
  repeatsOff = 0,
}: {
  /** The sample of the reference path the graph is queried on. */
  referenceGenome: string;
  /** The haplotypes picked, as `sample#haplotype`. */
  haplotypes: string[];
  /** The tracks to draw, every time the choice changes. */
  onChange: (tracks: HprcTrack[]) => void;
  /** Bumped to turn every repeat track off - RepeatMasker - for the
      haplotypes picked now and any picked after; each can still be
      turned back on by hand. */
  repeatsOff?: number;
}) {
  const reference = hprcReferenceOf(referenceGenome);
  const wanted = reference !== null && haplotypes.length > 0;

  const [catalog, setCatalog] = useState<HprcTrack[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => {
    if (!wanted || catalog) return;
    let live = true;
    loadHprcCatalog()
      .then((loaded) => live && setCatalog(loaded))
      .catch(
        (error) =>
          live &&
          setProblem(error instanceof Error ? error.message : String(error)),
      );
    return () => {
      live = false;
    };
  }, [wanted, catalog]);

  const [layers, setLayers] = useState<Set<string>>(() => new Set());
  const toggleLayer = (id: string) =>
    setLayers((was) => {
      const next = new Set(was);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const listed = useMemo(
    () =>
      catalog && reference
        ? hprcTracksFor(catalog, reference, haplotypes, layers)
        : [],
    [catalog, reference, haplotypes, layers],
  );
  /* What the reader turned on or off by hand, over the site's defaults. */
  const [flipped, setFlipped] = useState<Map<string, boolean>>(new Map());
  const isRepeat = (track: HprcTrack) =>
    /repeat/i.test(track.name) || /repeat/i.test(track.dataType);
  /* Off by default once asked, and what was turned on by hand goes off. */
  useEffect(() => {
    if (!repeatsOff) return;
    setFlipped((was) => {
      const next = new Map(was);
      for (const [id] of was) {
        if (listed.some((track) => track.id === id && isRepeat(track))) next.delete(id);
      }
      return next;
    });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [repeatsOff]);
  /* Repeat tracks start off for every haplotype picked - on by the site's
     rules, they came on with each one and buried the bars - and are a
     tick away for whoever wants them. */
  const defaultOn = (track: HprcTrack) => (isRepeat(track) ? false : track.on);
  const isOn = (track: HprcTrack) => flipped.get(track.id) ?? defaultOn(track);
  const chosen = useMemo(
    () => listed.filter((track) => flipped.get(track.id) ?? defaultOn(track)),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [listed, flipped, repeatsOff],
  );
  useEffect(() => onChange(wanted ? chosen : []), [chosen, wanted, onChange]);

  /* How many tracks each layer would add, for the picked haplotypes. */
  const perLayer = useMemo(() => {
    const counts = new Map<string, number>();
    if (!catalog || !reference) return counts;
    const all = hprcTracksFor(
      catalog,
      reference,
      haplotypes,
      new Set(HPRC_LAYERS.map((layer) => layer.id)),
    );
    for (const track of all) {
      counts.set(track.dataType, (counts.get(track.dataType) ?? 0) + 1);
    }
    return counts;
  }, [catalog, reference, haplotypes]);

  if (!reference) return null;

  const label =
    "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

  return (
    <div className="col-span-2">
      <span className={label}>
        Epigenome tracks from the HPRC ({reference})
        {wanted && catalog ? ` · ${chosen.length} of ${listed.length} on` : ""}
      </span>
      {!wanted ? (
        <p className="text-xs text-gray-400">
          Pick alternate paths above to add their tracks.
        </p>
      ) : problem ? (
        <p className="text-xs text-red-600">{problem}</p>
      ) : !catalog ? (
        <p className="text-xs text-gray-400">Loading the HPRC track list…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            {HPRC_LAYERS.map((layer) => {
              const on = layers.has(layer.id);
              const count = perLayer.get(layer.id) ?? 0;
              return (
                <button
                  key={layer.id}
                  type="button"
                  disabled={count === 0}
                  onClick={() => toggleLayer(layer.id)}
                  className={`rounded-md border px-2 py-1.5 text-left cursor-pointer disabled:cursor-default disabled:opacity-40 ${
                    on
                      ? "border-tint bg-tint/10"
                      : "border-gray-300 dark:border-gray-600 hover:border-tint"
                  }`}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold">{layer.title}</span>
                    <span className="text-[11px] text-gray-500">
                      {count} track{count === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="block text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                    {layer.description}
                  </span>
                  <span className="block text-[11px] text-tint">
                    {layer.platform}
                  </span>
                </button>
              );
            })}
          </div>
          {listed.length > 0 && (
            <div className="mt-1.5 max-h-44 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs">
              {listed.map((track, index) => (
                <div key={track.id}>
                  {/* A heading where the bar the tracks follow changes: the
                      reference's first, then each haplotype's. */}
                  {(index === 0 ||
                    trackPath(listed[index - 1]) !== trackPath(track)) && (
                    <div className="mt-1 first:mt-0 font-medium text-gray-500 dark:text-gray-400">
                      {track.haplotype === null
                        ? `On the reference (${reference}) - the sample's reads mapped to it, drawn along its bar`
                        : `On ${trackPath(track)} - drawn along its bar`}
                    </div>
                  )}
                <label
                  className="flex items-center gap-1.5 py-0.5 cursor-pointer"
                  title={track.url}
                >
                  <input
                    type="checkbox"
                    checked={isOn(track)}
                    onChange={() =>
                      setFlipped((was) => new Map(was).set(track.id, !isOn(track)))
                    }
                  />
                  <span className="w-20 shrink-0 text-gray-500">
                    {track.haplotype === null
                      ? track.sample
                      : `${track.sample}#${track.haplotype}`}
                  </span>
                  <span className="truncate">{track.name}</span>
                  <span className="ml-auto shrink-0 text-gray-400">
                    {track.type}
                  </span>
                </label>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
