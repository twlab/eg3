// Fetch orchestration for tabix-based tracks.
// Only imports @gmod/tabix (TabixSource, VcfSource) —
// keeps this worker's bundle isolated from @gmod/bbi, hic-straw, @gmod/bam.
//
// Handled track types:
//   bed, bedcolor, bedgraph, qbed, dbedgraph, modbed, methylc, categorical,
//   longrange, refbed, omeroidr, vcf, genomealign

import TabixSource from "./tabixSource";
import VcfSource from "./VcfSource";
import LocalTabixSource from "../getLocalData/localTabixSource";
import BedTextSource from "../getLocalData/BedTextSource";
import LongrangeAndreaTextSource from "../getLocalData/LongrangeAndreaTextSource";

export const TABIX_TRACK_TYPES = new Set([
    "bed",
    "bedcolor",
    "bedgraph",
    "qbed",
    "dbedgraph",
    "modbed",
    "methylc",
    "categorical",
    "longrange",
    "refbed",
    "omeroidr",
    "vcf",
    "genomealign",
]);

let cachedRemote: { [key: string]: any } = {};
let cachedLocal: { [key: string]: any } = {};
let cachedText: { [key: string]: any } = {};

function isFetchError(r: unknown): r is { error: string } {
    return (
        r != null && !Array.isArray(r) && typeof r === "object" && "error" in r
    );
}

async function getRemoteData(regionData: any, isVcf: boolean): Promise<any> {
    const url = regionData.trackModel.url;
    const indexUrl = regionData.trackModel.indexUrl || null;
    if (!cachedRemote[url]) {
        cachedRemote[url] = isVcf
            ? new VcfSource(url, indexUrl)
            : new TabixSource(url, indexUrl);
    }
    regionData.trackModel.options["trackType"] = regionData.trackModel.type;
    return cachedRemote[url]
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

async function getLocalData(regionData: any): Promise<any> {
    const id = regionData.trackModel.id;
    if (!cachedLocal[id]) {
        cachedLocal[id] = new LocalTabixSource(regionData.trackModel);
    }
    return cachedLocal[id].getData(
        regionData.nav,
        regionData.basesPerPixel,
        regionData.trackModel.options
    );
}

async function getTextData(regionData: any): Promise<any> {
    const id = regionData.trackModel.id;
    if (!cachedText[id]) {
        if (
            regionData.trackModel.type === "longrange" &&
            regionData.trackModel.textConfig?.subType === "AndreaGillespie"
        ) {
            cachedText[id] = new LongrangeAndreaTextSource({
                blob: regionData.trackModel.fileObj,
                textConfig: regionData.trackModel.textConfig,
                url: "",
            });
        } else {
            cachedText[id] = new BedTextSource({
                blob: regionData.trackModel.fileObj,
                textConfig: regionData.trackModel.textConfig,
                url: "",
                type: regionData.trackModel.type,
            });
        }
    }
    return cachedText[id].getData(regionData.nav);
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

    // Resolve navigation loci (mirrors fetchFunctions.tsx logic for tabix types)
    if (genome && genome !== "" && genome !== primaryGenName) {
        if (
            genomicFetchCoord[genome]?.queryGenomicCoord &&
            genomicFetchCoord[genome]?.queryRegion
        ) {
            curFetchNav = genomicFetchCoord[genome].queryGenomicCoord;
        } else if (trackModel.type === "longrange") {
            curFetchNav = regionExpandLoci;
        } else {
            curFetchNav = genomicLoci;
        }
    } else if (trackModel.type === "longrange") {
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

    const isLocalFetch = trackModel.fileObj instanceof File;

    try {
        if (isLocalFetch && trackModel.url === "") {
            return trackModel.isText
                ? await getTextData(regionData)
                : await getLocalData(regionData);
        } else if (!isLocalFetch) {
            return await getRemoteData(regionData, trackModel.type === "vcf");
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

export async function fetchTabixTrackData(data: any[]): Promise<any> {
    if (!Array.isArray(data)) {
        throw new Error("fetchTabixTrackData expects an array");
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

            const tabixTracks: any[] = (dataItem.trackModelArr ?? []).filter(
                (t: any) => t && TABIX_TRACK_TYPES.has(t.type)
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
                tabixTracks.map(async (item: any) => {
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
                        fileInfos: null,
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
