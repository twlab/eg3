import { createSession, upsertSession, setCurrentSession } from "../redux/slices/browserSlice";
import { useAppDispatch } from "../redux/hooks";
import { useEffect } from "react";
import { getGenomeConfig } from "@eg/tracks";
import { GenomeCoordinate } from "@eg/tracks";
import GenomeSerializer from "@eg/tracks/src/genome-hub/GenomeSerializer";
import { addSessionsFromBundleId } from "../redux/thunk/session";

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
        const genomeId = searchParams.get("genomeId");
        const viewRegion = searchParams.get("viewRegion");
        const bundleId = searchParams.get("bundleId");
        const blob = searchParams.get("blob");

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

        if (genomeId && viewRegion) {
            const genomeConfig = getGenomeConfig(genomeId);

            if (genomeConfig?.genome) {
                const genome = GenomeSerializer.serialize(genomeConfig);

                dispatch(createSession({
                    genome,
                    viewRegion: viewRegion as GenomeCoordinate
                }));

                searchParams.delete("genomeId");
                searchParams.delete("viewRegion");
                window.history.replaceState({}, "", window.location.pathname);
            }
        }
    }, []);
}
