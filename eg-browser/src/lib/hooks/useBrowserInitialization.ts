import { createSession, upsertSession, setCurrentSession } from "../redux/slices/browserSlice";
import { useAppDispatch } from "../redux/hooks";
import { useEffect } from "react";
import { getGenomeConfig, ITrackModel } from "@eg/tracks";
import { GenomeCoordinate } from "@eg/tracks";
import GenomeSerializer from "@eg/tracks/src/genome-hub/GenomeSerializer";
import { addSessionsFromBundleId, importOneSession } from "../redux/thunk/session";

function decompressString(compressed: string): string {
    const dec = compressed.replace(/\./g, '+').replace(/_/g, '/').replace(/-/g, '=');
    const binary = atob(dec);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
}

export default function useBrowserInitialization() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const genome = searchParams.get("genome");
        const hub = searchParams.get("hub");
        const position = searchParams.get("position");
        const bundleId = searchParams.get("bundleId");
        const blob = searchParams.get("blob");
        const sessionFile = searchParams.get("sessionFile");

        if (sessionFile) {
            (async () => {
                const file = await fetch(sessionFile).then(r => r.json());

                dispatch(importOneSession({ session: file, navigatingToSession: true }));

                searchParams.delete("sessionFile");
                const newUrl = searchParams.toString()
                    ? `${window.location.pathname}?${searchParams.toString()}`
                    : window.location.pathname;
                window.history.replaceState({}, "", newUrl);
            })();
        }

        if (blob) {
            try {
                const decompressed = decompressString(blob);
                const sessionData = JSON.parse(decompressed);

                sessionData.id = crypto.randomUUID();

                dispatch(upsertSession(sessionData));
                dispatch(setCurrentSession(sessionData.id));

                searchParams.delete("blob");
                const newUrl = searchParams.toString()
                    ? `${window.location.pathname}?${searchParams.toString()}`
                    : window.location.pathname;
                window.history.replaceState({}, "", newUrl);
            } catch (error) {
                console.error("Failed to process blob data:", error);
            }
        }

        if (bundleId) {
            dispatch(addSessionsFromBundleId(bundleId))
                .catch(error => console.error("Failed to import bundle:", error))
                .finally(() => {
                    searchParams.delete("bundleId");
                    const newUrl = searchParams.toString()
                        ? `${window.location.pathname}?${searchParams.toString()}`
                        : window.location.pathname;
                    window.history.replaceState({}, "", newUrl);
                });
        }

        if (genome) {
            (async () => {
                const genomeConfig = getGenomeConfig(genome);

                if (genomeConfig?.genome) {
                    const genome = GenomeSerializer.serialize(genomeConfig);

                    let additionalTracks: ITrackModel[] = [];

                    if (hub) {
                        const hubData = await fetch(hub)
                            .then(r => r.json())
                            .then(tracks => tracks.filter((t: any) => t.showOnHubLoad === true));

                        additionalTracks = hubData.map((t: any) => ({
                            ...t,
                            id: crypto.randomUUID(),
                            genome: genome,
                            isSelected: false,
                        }));
                    }

                    genome.defaultTracks = genome.defaultTracks?.map(t => JSON.parse(JSON.stringify(t)));

                    dispatch(createSession({
                        genome,
                        viewRegion: position ? position as GenomeCoordinate : undefined,
                        additionalTracks,
                    }));

                    searchParams.delete("genome");
                    searchParams.delete("hub");
                    searchParams.delete("position");
                    window.history.replaceState({}, "", window.location.pathname);
                }
            })();
        }
    }, []);
}
