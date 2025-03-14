import { createSession } from "../redux/slices/browserSlice";
import { useAppDispatch } from "../redux/hooks";
import { useEffect } from "react";
import { getGenomeConfig } from "@eg/tracks";
import { GenomeCoordinate } from "@eg/tracks";
import GenomeSerializer from "@eg/tracks/src/genome-hub/GenomeSerializer";

export default function useBrowserInitialization() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const genomeId = searchParams.get("genomeId");
        const viewRegion = searchParams.get("viewRegion");

        if (genomeId && viewRegion) {
            const genomeConfig = getGenomeConfig(genomeId);

            if (genomeConfig?.genome) {
                const genome = GenomeSerializer.serialize(genomeConfig);

                dispatch(createSession({
                    genome,
                    viewRegion: viewRegion as GenomeCoordinate
                }));

                window.history.replaceState({}, "", window.location.pathname);
            }
        }
    }, []);
}
