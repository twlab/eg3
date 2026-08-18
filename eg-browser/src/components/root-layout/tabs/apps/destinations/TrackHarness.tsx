/**
 * Dev-only harness for loading track examples without editing source.
 *
 * Replaces the uncomment-save-reload loop that the commented-out `TrackModel`
 * blocks in the genome configs used to require. Everything here is driven by
 * the shared catalog in `trackExamples.ts`, so an example added there shows up
 * both in this panel and in the Playwright smoke tests.
 */
import { useMemo, useState } from "react";
import {
  TRACK_EXAMPLES,
  getTrackExampleTags,
  getExampleGenomes,
  NOTABLE_REGIONS,
  type TrackExample,
  type TrackExampleTag,
} from "wuepgg3-track";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  selectCurrentSession,
  updateCurrentSession,
} from "@/lib/redux/slices/browserSlice";
import useExpandedNavigationTab from "@/lib/hooks/useExpandedNavigationTab";
import useCurrentGenome from "@/lib/hooks/useCurrentGenome";
import { generateUUID } from "wuepgg3-track";

export default function TrackHarness() {
  useExpandedNavigationTab();
  const dispatch = useAppDispatch();
  const currentSession = useAppSelector(selectCurrentSession);
  const genomeConfig = useCurrentGenome();
  const currentGenome = genomeConfig?.name ?? genomeConfig?.id ?? null;

  const [tagFilter, setTagFilter] = useState<TrackExampleTag | "all">("all");
  const [genomeFilter, setGenomeFilter] = useState<string>("current");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<string>("");

  const tags = useMemo(() => getTrackExampleTags(), []);
  const genomes = useMemo(() => getExampleGenomes(), []);

  const visible = useMemo(() => {
    return TRACK_EXAMPLES.filter((e) => {
      if (tagFilter !== "all" && !e.tags.includes(tagFilter)) return false;
      if (genomeFilter === "all") return true;
      if (genomeFilter === "current") {
        return currentGenome ? e.genome === currentGenome : true;
      }
      return e.genome === genomeFilter;
    });
  }, [tagFilter, genomeFilter, currentGenome]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Tracks need an id and a selection flag before the container will render
  // them, matching what createSession does for a session's initial tracks.
  const initTracks = (examples: TrackExample[]) =>
    examples.map((e) => ({
      ...e.track,
      id: generateUUID(),
      isSelected: false,
    }));

  const addExamples = (examples: TrackExample[], jumpTo?: string) => {
    if (!currentSession || examples.length === 0) return;

    const mismatched = examples.filter(
      (e) => currentGenome && e.genome !== currentGenome,
    );

    const update: Record<string, any> = {
      tracks: [...currentSession.tracks, ...initTracks(examples)],
    };
    if (jumpTo) {
      update.viewRegion = jumpTo;
      update.userViewRegion = jumpTo;
    }
    dispatch(updateCurrentSession(update));

    setStatus(
      `Added ${examples.length} track${examples.length === 1 ? "" : "s"}` +
        (jumpTo ? ` and jumped to ${jumpTo}` : "") +
        (mismatched.length
          ? ` — ${mismatched.length} built for a different genome, so may not render`
          : ""),
    );
  };

  const goTo = (region: string) => {
    if (!currentSession) return;
    dispatch(
      updateCurrentSession({
        viewRegion: region as any,
        userViewRegion: region as any,
      }),
    );
    setStatus(`Jumped to ${region}`);
  };

  const removeAllTracks = () => {
    if (!currentSession) return;
    dispatch(updateCurrentSession({ tracks: [] }));
    setStatus("Removed all tracks");
  };

  if (!currentSession) {
    return (
      <div className="p-4 text-sm text-gray-600 dark:text-dark-primary">
        Open a session first — the harness adds tracks to the active session.
      </div>
    );
  }

  const selectedExamples = TRACK_EXAMPLES.filter((e) => selected.has(e.id));

  return (
    <div
      className="flex flex-col gap-3 p-3 text-sm text-gray-800 dark:text-dark-primary"
      data-testid="track-harness"
    >
      {/* Filters */}
      <div className="flex flex-row flex-wrap items-center gap-2">
        <select
          aria-label="Filter by genome"
          data-testid="harness-genome-filter"
          value={genomeFilter}
          onChange={(e) => setGenomeFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-dark-secondary"
        >
          <option value="current">
            Current genome{currentGenome ? ` (${currentGenome})` : ""}
          </option>
          <option value="all">All genomes</option>
          {genomes.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by tag"
          data-testid="harness-tag-filter"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value as any)}
          className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-dark-secondary"
        >
          <option value="all">All types</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk actions */}
      <div className="flex flex-row flex-wrap items-center gap-2">
        <button
          data-testid="harness-add-selected"
          disabled={selected.size === 0}
          onClick={() => addExamples(selectedExamples)}
          className={`rounded-md px-2 py-1 border border-gray-300 dark:border-gray-600 ${
            selected.size === 0
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-secondary"
          }`}
        >
          Add selected ({selected.size})
        </button>
        <button
          data-testid="harness-add-visible"
          onClick={() => addExamples(visible)}
          className="rounded-md px-2 py-1 border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-secondary"
        >
          Add all {visible.length} shown
        </button>
        <button
          data-testid="harness-clear-tracks"
          onClick={removeAllTracks}
          className="rounded-md px-2 py-1 border border-red-300 text-red-700 dark:text-red-400 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          Remove all tracks
        </button>
        {selected.size > 0 && (
          <button
            onClick={() => setSelected(new Set())}
            className="rounded-md px-2 py-1 border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-secondary"
          >
            Clear selection
          </button>
        )}
      </div>

      {status && (
        <div
          data-testid="harness-status"
          className="rounded-md bg-blue-50 dark:bg-dark-secondary px-2 py-1 text-xs"
        >
          {status}
        </div>
      )}

      {/* Example list */}
      <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
        {visible.map((example) => (
          <div
            key={example.id}
            data-testid={`harness-example-${example.id}`}
            className="flex flex-row items-start gap-2 py-2"
          >
            <input
              type="checkbox"
              aria-label={`Select ${example.id}`}
              checked={selected.has(example.id)}
              onChange={() => toggle(example.id)}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-row items-center gap-2 flex-wrap">
                <span className="font-semibold">{example.id}</span>
                <span className="text-xs text-gray-500">{example.genome}</span>
                {example.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] rounded-full bg-gray-200 dark:bg-dark-secondary px-1.5 py-0.5"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {example.description}
              </div>
              {example.note && (
                <div className="text-xs italic text-amber-700 dark:text-amber-400">
                  {example.note}
                </div>
              )}
              <div className="text-[11px] font-mono text-gray-500">
                {example.region}
              </div>
            </div>
            <button
              data-testid={`harness-load-${example.id}`}
              onClick={() => addExamples([example], example.region)}
              className="rounded-md px-2 py-1 border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-secondary whitespace-nowrap"
              title="Add this track and jump to its region"
            >
              Load
            </button>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="py-4 text-xs text-gray-500">
            No examples match these filters.
          </div>
        )}
      </div>

      {/* Notable regions */}
      <div className="flex flex-col gap-1 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="font-semibold">Jump to a notable region</div>
        <div className="flex flex-row flex-wrap gap-1">
          {Object.entries(NOTABLE_REGIONS)
            .filter(([key]) =>
              currentGenome && genomeFilter === "current"
                ? key.startsWith(currentGenome)
                : true,
            )
            .map(([key, value]) => (
              <button
                key={key}
                data-testid={`harness-region-${key}`}
                onClick={() => goTo(value.region)}
                title={`${value.description} (${value.region})`}
                className="rounded-md px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-secondary"
              >
                {key}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
