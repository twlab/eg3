import {
  createSession,
  upsertSession,
  selectSessionById,
  setCurrentSession,
} from "../redux/slices/browserSlice";
import { useAppDispatch } from "../redux/hooks";
import { useEffect } from "react";
import { useStore } from "react-redux";
import type { RootState } from "../redux/createStore";
import { showNotice } from "../redux/slices/utilitySlice";
import {
  convertLegacyCoordinate,
  convertLegacyHub,
  GenomeCoordinate,
  GenomeSerializer,
  getGenomeConfig,
  getLegacyVocabularyUrls,
  ITrackModel,
  LegacyVocabulary,
  normalizeLegacyHubUrl,
  parseLegacyGftk,
  parseLegacyHubText,
} from "wuepgg3-track";
import {
  addSessionsFromBundleId,
  importOneSession,
} from "../redux/thunk/session";
import { generateUUID } from "wuepgg3-track";

import { addCustomTracksPool } from "../redux/slices/hubSlice";
import { refreshLocalGenomes } from "../redux/thunk/genome-hub";

export default function useBrowserInitialization() {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();

  // Load custom genomes from IndexedDB on startup. The `genomeHub` slice is
  // blacklisted from persistence, but `settings.customCollections` is persisted
  // — so after a refresh a collection still lists its custom genomes while the
  // genome data itself is gone until something reloads it. Without this, clicking
  // a persisted custom genome in the picker resolves to nothing (no session is
  // created) until the user opens a hub panel or uploads another genome.
  useEffect(() => {
    dispatch(refreshLocalGenomes());
  }, [dispatch]);

  // const customTracksPool = useAppSelector(selectCustomTracksPool);
  // const currentSession = useAppSelector(selectCurrentSession);
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    // Messages about the link go to a banner rather than a blocking dialog, so
    // they never hold up the page that is loading underneath.
    const notify = (message: string, level: "info" | "error" = "error") =>
      dispatch(showNotice({ message, level }));

    // Reloading a link must not pile up sessions: if this tab already made a
    // session from this exact link and it still exists, go back to it (with
    // whatever the user changed since) instead of creating another copy.
    const linkedSessionId = readLinkedSessionId();
    if (
      linkedSessionId &&
      selectSessionById(store.getState(), linkedSessionId)
    ) {
      dispatch(setCurrentSession(linkedSessionId));
      return;
    }

    const genome = searchParams.get("genome");
    const hub = searchParams.get("hub");
    // with `hub`: display the hub's tracks without the genome's default tracks
    const noDefaultTracks = searchParams.has("noDefaultTracks");
    const position = searchParams.get("position");
    // Accept both `bundleId` and the shorthand `bundle`.
    const bundleId = searchParams.get("bundleId") || searchParams.get("bundle");
    const blob = searchParams.get("blob");
    const sessionFile = searchParams.get("sessionFile");

    // MARK: - Legacy URL Handling
    // Links written for the retired 1st-generation browser (/legacy/) are
    // redirected here by the web server with their query string intact.
    // `datahub` + `coordinate` are converted on the fly (see the genome block
    // below); `session` and `publichub` pointed at data that only existed on
    // the legacy server, so the best we can do is explain and load the genome.
    const session = searchParams.get("session");
    // the legacy browser accepted three names for the hub URL
    const datahub =
      searchParams.get("datahub") ||
      searchParams.get("datahub_jsonfile") ||
      searchParams.get("datahub_json");
    const coordinate = searchParams.get("coordinate");
    const publichub = searchParams.get("publichub");
    // `forceshowall`: display hub tracks that have no display mode set
    const forceShowAll = searchParams.has("forceshowall");
    // `gftk`: annotation tracks of the genome, as "name,mode,name,mode"
    const gftkEntry = parseLegacyGftk(searchParams.get("gftk"));

    if (session) {
      notify(
        "This link points to a session saved in the retired 1st-generation WashU Epigenome Browser. Those sessions can no longer be restored." +
          (genome ? " The genome is loaded with its default tracks instead." : ""),
        "info",
      );
    } else if (publichub) {
      notify(
        "This link points to a public hub of the retired 1st-generation WashU Epigenome Browser." +
          (genome ? " The genome is loaded with its default tracks instead;" : "") +
          " public hubs are available from the Tracks menu.",
        "info",
      );
    }

    // MARK: - Session Loading
    // if we have a session file, or a session file downloaded from a server,
    // then we should check retreiving the bundleId first,
    // if success update the session then importOneSession
    // if fail then null bundleId for currentSession and try to importOneSession because
    // there are still info that can still build the track view.

    if (sessionFile) {
      (async () => {
        try {
          const file = await fetch(sessionFile).then((r) => r.json());

          await dispatch(
            importOneSession({ session: file, navigatingToSession: true }),
          ).unwrap();
        } catch (error) {
          console.error("Failed to load session file:", error);
          notify(
            "Failed to load the session file. Showing the genome picker instead.",
          );
          dispatch(setCurrentSession(null));
        }
      })();
    }

    if (blob) {
      try {
        const decompressed = decompressString(blob);
        const sessionData = JSON.parse(decompressed);

        sessionData.id = generateUUID();

        dispatch(upsertSession(sessionData));
        dispatch(setCurrentSession(sessionData.id));
        rememberLinkedSessionId(sessionData.id);
      } catch (error) {
        console.error("Failed to process blob data:", error);
      }
    }
    // addSessionsFromBundleId will try to fetch the bundleID first, then > importOneSession
    // and if fails then doesnt load any session because we only have the id
    if (bundleId) {
      dispatch(addSessionsFromBundleId(bundleId))
        .unwrap()
        .catch((error: unknown) => {
          console.error("Failed to import bundle:", error);
          notify(
            "Failed to fetch the session bundle. Showing the genome picker instead.",
          );
          dispatch(setCurrentSession(null));
        });
    }

    if (genome) {
      (async () => {
        const genomeConfig = getGenomeConfig(genome);

        if (genomeConfig?.genome) {
          const genome = GenomeSerializer.serialize(genomeConfig);

          // What the session displays. Left empty, the session shows the
          // genome's default tracks.
          let displayedTracks: ITrackModel[] = [];
          // Every track of the hub, displayed or not, for the track table.
          let hubTracks: ITrackModel[] = [];
          let legacyPosition = convertLegacyCoordinate(coordinate);
          const withIds = (tracks: any[]): ITrackModel[] =>
            tracks.map((t) => ({
              ...t,
              id: generateUUID(),
              isSelected: false,
            }));

          genome.defaultTracks = genome.defaultTracks?.map((t) =>
            JSON.parse(JSON.stringify(t)),
          );

          if (hub) {
            try {
              const hubData = await fetch(hub)
                .then((r) => r.json())
                .then((tracks) => tracks);

              // Same rule as loading a hub from the Tracks menu: the genome's
              // default tracks stay, and of the hub only the tracks marked
              // `showOnHubLoad` are displayed; the rest wait in the track
              // table. `noDefaultTracks` drops the default tracks.
              hubTracks = withIds(hubData);
              const tracksToShow = hubTracks.filter(
                (t: any) => t.showOnHubLoad,
              );
              if (tracksToShow.length > 0) {
                displayedTracks = noDefaultTracks
                  ? tracksToShow
                  : [...withIds(genome.defaultTracks ?? []), ...tracksToShow];
              }
            } catch (error) {
              console.error("Failed to load hub data:", error);
              notify(
                "Unable to load hub data. The hub file appears to be malformed or inaccessible. Default tracks are loaded instead.",
              );
            }
          } else if (datahub || gftkEntry) {
            // Legacy (1st-generation) datahub: relaxed JSON in the old track
            // vocabulary. Convert it to current tracks instead of failing.
            try {
              const hubUrl = datahub ? normalizeLegacyHubUrl(datahub) : undefined;
              const legacyHub = hubUrl
                ? parseLegacyHubText(await fetchLegacyHubText(hubUrl))
                : [];
              if (gftkEntry) {
                legacyHub.push(gftkEntry);
              }
              const converted = convertLegacyHub(legacyHub, {
                genome: genomeConfig.genome.getName(),
                hubUrl,
                nativeTracks: genome.defaultTracks ?? [],
                forceShowAll,
                vocabularies: await fetchLegacyVocabularies(legacyHub),
              });
              // a legacy hub names its own annotation tracks, so it replaces
              // the default tracks rather than adding to them
              displayedTracks = withIds(converted.tracks);
              hubTracks = [
                ...displayedTracks,
                ...withIds(converted.hiddenTracks),
              ];
              legacyPosition = legacyPosition ?? converted.position;
              if (converted.warnings.length > 0) {
                console.warn(
                  "Legacy datahub converted with warnings:\n" +
                    converted.warnings.join("\n"),
                );
              }
            } catch (error) {
              console.error("Failed to load legacy datahub:", error);
              notify(
                "Unable to load the datahub from this legacy link. The hub file appears to be malformed or inaccessible. Default tracks are loaded instead.",
              );
            }
          }

          const viewRegion = position || legacyPosition;

          dispatch(addCustomTracksPool(hubTracks));
          const sessionId = generateUUID();
          dispatch(
            createSession({
              id: sessionId,
              genome,
              viewRegion: viewRegion
                ? (viewRegion as GenomeCoordinate)
                : undefined,
              additionalTracks: displayedTracks,
            }),
          );
          rememberLinkedSessionId(sessionId);
        }
      })();
    }
  }, []);
}

// Which session this tab created from the link in its address bar. Kept in
// sessionStorage, so it lasts across reloads of the tab but is not shared with
// other tabs or later visits, which get their own fresh session from the link.
const LINKED_SESSION_KEY = "eg3:linkedSession";

function readLinkedSessionId(): string | null {
  try {
    const stored = JSON.parse(
      window.sessionStorage.getItem(LINKED_SESSION_KEY) || "null",
    );
    return stored &&
      window.location.search &&
      stored.search === window.location.search
      ? stored.sessionId
      : null;
  } catch (error) {
    return null; // storage unavailable or unreadable: just load the link
  }
}

function rememberLinkedSessionId(sessionId: string) {
  try {
    window.sessionStorage.setItem(
      LINKED_SESSION_KEY,
      JSON.stringify({ search: window.location.search, sessionId }),
    );
  } catch (error) {
    // storage unavailable: a reload will create a new session, as before
  }
}

/**
 * Fetches the text of a legacy datahub. Hubs from that era are often linked
 * with http://, which a page served over https may not load, so a failed
 * http request is retried over https.
 */
async function fetchLegacyHubText(url: string): Promise<string> {
  const fetchText = async (target: string) => {
    const response = await fetch(target);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching ${target}`);
    }
    return response.text();
  };
  try {
    return await fetchText(url);
  } catch (error) {
    if (url.startsWith("http://")) {
      return fetchText(url.replace("http://", "https://"));
    }
    throw error;
  }
}

/**
 * Fetches the metadata vocabularies a legacy hub links to, so track metadata
 * shows term names instead of numeric ids. Best effort: a vocabulary that
 * cannot be loaded in time is left out, and its ids are then dropped.
 */
async function fetchLegacyVocabularies(
  legacyHub: any[],
): Promise<{ [key: string]: LegacyVocabulary }> {
  const urls = getLegacyVocabularyUrls(legacyHub);
  const vocabularies: { [key: string]: LegacyVocabulary } = {};
  await Promise.all(
    Object.keys(urls).map(async (key) => {
      try {
        const response = await fetch(urls[key], {
          signal: AbortSignal.timeout(10000),
        });
        if (response.ok) {
          vocabularies[key] = await response.json();
        }
      } catch (error) {
        console.warn(`Could not load metadata vocabulary "${key}":`, error);
      }
    }),
  );
  return vocabularies;
}

function decompressString(compressed: string): string {
  const dec = compressed
    .replace(/\./g, "+")
    .replace(/_/g, "/")
    .replace(/-/g, "=");
  const binary = atob(dec);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}
