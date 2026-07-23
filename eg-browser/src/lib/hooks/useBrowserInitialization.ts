import {
  createSession,
  upsertSession,
  setCurrentSession,
} from "../redux/slices/browserSlice";
import { useAppDispatch } from "../redux/hooks";
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

import { addCustomTracksPool } from "../redux/slices/hubSlice";

export default function useBrowserInitialization() {
  const dispatch = useAppDispatch();

  // const customTracksPool = useAppSelector(selectCustomTracksPool);
  // const currentSession = useAppSelector(selectCurrentSession);
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const genome = searchParams.get("genome");
    const hub = searchParams.get("hub");
    const position = searchParams.get("position");
    // Accept both `bundleId` and the shorthand `bundle`.
    const bundleId = searchParams.get("bundleId") || searchParams.get("bundle");
    const blob = searchParams.get("blob");
    const sessionFile = searchParams.get("sessionFile");

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
          alert(
            "Failed to load the session file. Loading the genome picker instead.",
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
          alert(
            "Failed to fetch the session bundle. Loading the genome picker instead.",
          );
          dispatch(setCurrentSession(null));
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
                .then((tracks) => tracks);

              additionalTracks = hubData.map((t: any) => ({
                ...t,
                id: generateUUID(),

                isSelected: false,
              }));
            } catch (error) {
              console.error("Failed to load hub data:", error);
              alert(
                "Error: Unable to load hub data. The hub file appears to be malformed or inaccessible. Loading default tracks instead.",
              );
            }
          }

          genome.defaultTracks = genome.defaultTracks?.map((t) =>
            JSON.parse(JSON.stringify(t)),
          );

          dispatch(addCustomTracksPool([...additionalTracks]));
          dispatch(
            createSession({
              genome,
              viewRegion: position ? (position as GenomeCoordinate) : undefined,
              additionalTracks,
            }),
          );
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
