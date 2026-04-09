// Fetch orchestration for big binary tracks.
// Only imports @gmod/bbi (BigSourceWorkerGmod, BigSourceWorker) —
// keeps this worker's bundle isolated from @gmod/tabix, hic-straw, etc.
//
// Handled track types:
//   bigwig, dynseq, boxplot, biginteract, bigbed, repeatmasker, rmskv2, jaspar

import BigSourceWorkerGmod from "./BigSourceWorkerGmod";
import BigSourceWorker from "./BigSourceWorker";
import LocalBigSourceGmod from "../getLocalData/LocalBigSourceGmod";
import LocalBigSource from "../getLocalData/LocalBigSource";

export const BIG_TRACK_TYPES = new Set([
    "bigwig",
    "dynseq",
    "boxplot",
    "biginteract",
    "bigbed",
    "repeatmasker",
    "rmskv2",
    "jaspar",
]);

let cachedRemote: { [key: string]: any } = {};
let cachedLocal: { [key: string]: any } = {};

function isFetchError(r: unknown): r is { error: string } {
    return (
        r != null && !Array.isArray(r) && typeof r === "object" && "error" in r
    );
}

function getRemoteFetchType(type: string): string {
    if (type === "bigbed") return "bigbed";
    if (type === "repeatmasker" || type === "rmskv2") return "repeat";
    if (type === "jaspar") return "jaspar";
    return "big";
}

async function getRemoteData(regionData: any, fetchType: string): Promise<any> {
    const url = regionData.trackModel.url;
    if (!cachedRemote[url]) {
        cachedRemote[url] =
            fetchType === "bigbed"
                ? new BigSourceWorker(url)
                : new BigSourceWorkerGmod(url);
    }
    const instance = cachedRemote[url];
    regionData.trackModel.options["trackType"] = regionData.trackModel.type;
    if (fetchType === "jaspar" && regionData.basesPerPixel > 2) return [];
    if (fetchType === "repeat" && regionData.basesPerPixel > 1000) return [];

    if (fetchType === "bigbed") {
        return instance
            .getData(
                regionData.nav,
                regionData.basesPerPixel,
                regionData.trackModel.options
            )
            .catch((err: any) => {
                cachedRemote[url] = null;
                throw err;
            });
    }
    return instance
        .getData(
            regionData.nav,
            regionData.basesPerPixel,
            regionData.trackModel.options
        )
        .then((data: any) => {
            if (fetchType === "big") {
                const fileInfos =
                    cachedRemote[url] &&
                        typeof cachedRemote[url].getFileInfo === "function"
                        ? cachedRemote[url].getFileInfo()
                        : null;
                return fileInfos ? { data, fileInfos } : data;
            }
            return data;
        })
        .catch((err: any) => {
            cachedRemote[url] = null;
            throw err;
        });
}

async function getLocalData(regionData: any, fetchType: string): Promise<any> {
    const id = regionData.trackModel.id;
    if (!cachedLocal[id]) {
        cachedLocal[id] =
            fetchType === "bigbed"
                ? new LocalBigSource(regionData.trackModel.fileObj)
                : new LocalBigSourceGmod(regionData.trackModel.fileObj);
    }
    return cachedLocal[id].getData(
        regionData.nav,
        regionData.basesPerPixel,
        regionData.trackModel.options
    );
}

async function fetchData(trackModel: any, context: any): Promise<any> {
    const {
        primaryGenName,
        genomicFetchCoord,
        genomicLoci,
        regionExpandLoci,
        bpRegionSize,
        windowWidth,
    } = context;

    let curFetchNav: any;
    const { genome } = trackModel.metadata;

    // Resolve the navigation loci to fetch (mirrors fetchFunctions.tsx logic)
    if (genome && genome !== "" && genome !== primaryGenName) {
        if (
            genomicFetchCoord[genome]?.queryGenomicCoord &&
            genomicFetchCoord[genome]?.queryRegion
        ) {
            curFetchNav = genomicFetchCoord[genome].queryGenomicCoord;
        } else if (trackModel.type === "biginteract") {
            curFetchNav = regionExpandLoci;
        } else {
            curFetchNav = genomicLoci;
        }
    } else if (trackModel.type === "biginteract") {
        curFetchNav = regionExpandLoci;
    } else if (trackModel.shouldPlaceRegion) {
        curFetchNav = regionExpandLoci;
    } else {
        curFetchNav = genomicLoci;
    }

    const regionData = {
        basesPerPixel: bpRegionSize / windowWidth,
        nav: curFetchNav,
        trackModel,
    };

    const fetchType = getRemoteFetchType(trackModel.type);
    const isLocalFetch = trackModel.fileObj instanceof File;

    try {
        if (isLocalFetch && trackModel.url === "") {
            return await getLocalData(regionData, fetchType);
        } else if (!isLocalFetch) {
            return await getRemoteData(regionData, fetchType);
        }
        return [];
    } catch (error) {
        return {
            error:
                error instanceof Error
                    ? error.message
                    : `Error fetching ${trackModel.name}`,
        };
    }
}

export async function fetchBigTrackData(data: any[]): Promise<any> {
    if (!Array.isArray(data)) {
        throw new Error("fetchBigTrackData expects an array");
    }

    return Promise.all(
        data.map((dataItem) => {
            const { primaryGenName } = dataItem;
            const fetchResults: any[] = [];
            const genomicLoci = dataItem.genomicLoci;
            const regionExpandLoci =
                dataItem.regionExpandLoci ?? dataItem.genomicLoci;
            const initGenomicLoci = dataItem.initGenomicLoci;
            const bpRegionSize = dataItem.bpRegionSize;
            const windowWidth = dataItem.windowWidth;
            const trackToDrawId = dataItem.trackToDrawId ?? {};
            const trackDataIdx = dataItem.trackDataIdx;
            const missingIdx = dataItem.missingIdx;

            const genomicFetchCoord = dataItem.genomicFetchCoord ?? {
                [primaryGenName]: {
                    genomicLoci,
                    regionExpandLoci,
                    initGenomicLoci,
                    primaryVisData: dataItem.visData,
                },
            };

            const bigTracks: any[] = (dataItem.trackModelArr ?? []).filter(
                (t: any) => t && BIG_TRACK_TYPES.has(t.type)
            );

            const context = {
                primaryGenName,
                genomicFetchCoord,
                genomicLoci,
                regionExpandLoci,
                bpRegionSize,
                windowWidth,
            };

            return Promise.all(
                bigTracks.map(async (item: any) => {
                    const trackType = item?.type ?? item?.metadata["Track type"];
                    const id = item.id;

                    if (item.error) {
                        fetchResults.push({
                            name: trackType,
                            id,
                            metadata: item.metadata,
                            trackModel: item,
                            result: [],
                            errorType: item.error,
                        });
                        return;
                    }

                    const responses = await fetchData(item, context);
                    let result;
                    let error: string | null = null;
                    if (isFetchError(responses)) {
                        result = [];
                        error = responses.error;
                    } else {
                        result = responses;
                    }

                    fetchResults.push({
                        name: trackType,
                        result,
                        fileInfos:
                            typeof responses === "object" &&
                                !Array.isArray(responses) &&
                                responses !== null &&
                                "fileInfos" in responses
                                ? (responses as any).fileInfos
                                : null,
                        id,
                        metadata: item.metadata,
                        trackModel: item,
                        errorType: error,
                    });
                })
            ).then(() => ({
                fetchResults,
                trackDataIdx,
                genomicFetchCoord,
                trackToDrawId,
                missingIdx,
            }));
        })
    );
}
