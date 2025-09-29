import {
  createSession,
  upsertSession,
  setCurrentSession,
  selectCurrentSession,
} from "../redux/slices/browserSlice";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { useEffect } from "react";
import {
  GenomeCoordinate,
  GenomeSerializer,
  getGenomeConfig,
  ITrackModel,
} from "wuepgg3-track";
import {
  addSessionsFromBundleId,
  importOneSession,
} from "../redux/thunk/session";
import { generateUUID } from "wuepgg3-track";

import { addCustomTracksPool, selectCustomTracksPool } from "../redux/slices/hubSlice";
const IDEMPOTENCY_STORAGE_KEY = "_eg-query-idempotency-key";

export default function useBrowserInitialization() {
  const dispatch = useAppDispatch();

  const customTracksPool = useAppSelector(selectCustomTracksPool);
  const currentSession = useAppSelector(selectCurrentSession);
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const genome = searchParams.get("genome");
    const hub = searchParams.get("hub");
    const position = searchParams.get("position");
    const bundleId = searchParams.get("bundleId");
    const blob = searchParams.get("blob");
    const sessionFile = searchParams.get("sessionFile");
    const idempotencyToken = searchParams.get("idempotencyToken");

    // MARK: - Legacy URL Handling
    const session = searchParams.get("session");
    const statusId = searchParams.get("statusId");
    const datahub = searchParams.get("datahub");
    const coordinate = searchParams.get("coordinate");
    const publichub = searchParams.get("publichub");

    if (session) {
      window.location.href = `https://epigenomegateway.wustl.edu/legacy/?genome=${genome}&session=${session}&statusId=${statusId}`;
      return;
    }
    if (datahub) {
      if (coordinate) {
        window.location.href = `https://epigenomegateway.wustl.edu/legacy/?genome=${genome}&datahub=${datahub}&coordinate=${coordinate}`;
      } else {
        window.location.href = `https://epigenomegateway.wustl.edu/legacy/?genome=${genome}&datahub=${datahub}`;
      }
      return;
    }
    if (publichub) {
      window.location.href = `https://epigenomegateway.wustl.edu/legacy/?genome=${genome}&publichub=${publichub}`;
      return;
    }

    // MARK: - Idempotency Check

    if (idempotencyToken) {
      const currentIdempotencyToken = localStorage.getItem(
        IDEMPOTENCY_STORAGE_KEY
      );

      if (currentIdempotencyToken === idempotencyToken) {
        return;
      }
    }

    // MARK: - Session Loading

    if (sessionFile) {
      (async () => {
        const file = await fetch(sessionFile).then((r) => r.json());

        dispatch(
          importOneSession({ session: file, navigatingToSession: true })
        );

        generateAndSetIdempotencyToken();
      })();
    }

    if (blob) {
      try {
        const decompressed = decompressString(blob);
        const sessionData = JSON.parse(decompressed);

        sessionData.id = generateUUID();

        dispatch(upsertSession(sessionData));
        dispatch(setCurrentSession(sessionData.id));

        generateAndSetIdempotencyToken();
      } catch (error) {
        console.error("Failed to process blob data:", error);
      }
    }

    if (bundleId) {
      dispatch(addSessionsFromBundleId(bundleId))
        .catch((error) => console.error("Failed to import bundle:", error))
        .finally(() => {
          generateAndSetIdempotencyToken();
        });
    }

    if (genome) {
      (async () => {
        const genomeConfig = getGenomeConfig(genome);

        if (genomeConfig?.genome) {
          const genome = GenomeSerializer.serialize(genomeConfig);

          let additionalTracks: ITrackModel[] = [];

          if (hub) {
            try {
              const hubData = await fetch(hub)
                .then((r) => r.json())
                .then((tracks) => tracks
                );



              additionalTracks = hubData.map((t: any) => ({
                ...t,
                id: generateUUID(),

                isSelected: false,
              }));

            } catch (error) {
              console.error("Failed to load hub data:", error);
              alert("Error: Unable to load hub data. The hub file appears to be malformed or inaccessible. Loading default tracks instead.");
            }
          }

          genome.defaultTracks = genome.defaultTracks?.map((t) =>
            JSON.parse(JSON.stringify(t))
          );

          dispatch(addCustomTracksPool([...customTracksPool, ...additionalTracks]));
          dispatch(
            createSession({
              genome,
              viewRegion: position ? (position as GenomeCoordinate) : undefined,
              additionalTracks,
            })
          );

          generateAndSetIdempotencyToken();
        }
      })();
    }
  }, []);
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

function generateAndSetIdempotencyToken() {
  const idempotencyToken = generateUUID();
  localStorage.setItem(IDEMPOTENCY_STORAGE_KEY, idempotencyToken);

  // Get current URL parameters without automatic encoding
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set("idempotencyToken", idempotencyToken);

  // Manually construct URL to avoid encoding existing parameters
  const params = new URLSearchParams();
  for (const [key, value] of currentUrl.searchParams.entries()) {
    params.append(key, value);
  }

  // Build URL string manually to preserve original parameter formatting
  const paramString = params.toString().replace(/https%3A%2F%2F/g, 'https://').replace(/%2F/g, '/').replace(/%3A/g, ':');

  const newUrl = paramString
    ? `${window.location.pathname}?${paramString}`
    : window.location.pathname;

  window.history.replaceState({}, "", newUrl);
  return idempotencyToken;
}
