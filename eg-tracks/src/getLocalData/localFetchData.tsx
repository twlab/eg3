import _ from "lodash";
import LocalBigSourceGmod from "./LocalBigSourceGmod";
import LocalTabixSource from "./localTabixSource";
import TextSource from "./localTextSource";
import BedTextSource from "./BedTextSource";
import LongrangeAndreaTextSource from "./LongrangeAndreaTextSource";

let cachedLocalFetchInstance: { [key: string]: any } = {};

export const localTrackFetchFunction: { [key: string]: any } = {
  bed: async function bedFetch(regionData: any) {
    return getLocalData(regionData, "bedOrTabix");
  },
  bedgraph: async function bedgraphFetch(regionData: any) {
    return getLocalData(regionData, "bedOrTabix");
  },
  qbed: async function qbedFetch(regionData: any) {
    return getLocalData(regionData, "bedOrTabix");
  },
  bigbed: async function bigbedFetch(regionData: any) {
    return getLocalData(regionData, "big");
  },
  refbed: async function refbedFetch(regionData: any) {
    return getLocalData(regionData, "bedOrTabix");
  },
  matplot: async function matplotFetch(regionData: any) {
    return getLocalData(regionData, "bedOrTabix");
  },
  bigwig: async function bigwigFetch(regionData: any) {
    return getLocalData(regionData, "big");
  },
  categorical: async function coolFetch(regionData: any) {
    return getLocalData(regionData, "bedOrTabix");
  },
  longrange: async function longrangeFetch(regionData: any) {
    return getLocalData(regionData, "bedOrTabix");
  },
  dynseq: async function dynseqFetch(regionData: any) {
    return getLocalData(regionData, "big");
  },
  biginteract: async function biginteractFetch(regionData: any) {
    return getLocalData(regionData, "big");
  },
  methylc: async function methylcFetch(regionData: any) {
    return getLocalData(regionData, "bedOrTabix");
  },
};

export const textFetchFunction: { [key: string]: any } = {
  bed: async function bedFetch(regionData: any) {
    return getTextData(regionData);
  },
  bedgraph: async function bedgraphFetch(regionData: any) {
    return getTextData(regionData);
  },
  qbed: async function qbedFetch(regionData: any) {
    return getTextData(regionData);
  },
  refbed: async function refbedFetch(regionData: any) {
    return getTextData(regionData);
  },
  longrange: async function coolFetch(regionData: any) {
    return getTextData(regionData);
  },
};

async function getTextData(regionData: any) {
  if (!(regionData.trackModel.id in cachedLocalFetchInstance)) {
    if (regionData.trackModel.type === "longrange") {
      cachedLocalFetchInstance[`${regionData.trackModel.id}`] =
        new LongrangeAndreaTextSource({
          blob: regionData.trackModel.fileObj,
          textConfig: regionData.trackModel.textConfig,
          url: "",
        });
    } else {
      cachedLocalFetchInstance[`${regionData.trackModel.id}`] =
        new BedTextSource({
          blob: regionData.trackModel.fileObj,
          textConfig: regionData.trackModel.textConfig,
          url: "",
        });
    }
  }

  let fetchInstance = cachedLocalFetchInstance[`${regionData.trackModel.id}`];

  return await fetchInstance.getData(regionData.nav);
}

async function getLocalData(regionData: any, trackType: string) {
  if (!(regionData.trackModel.id in cachedLocalFetchInstance)) {
    if (trackType === "big") {
      cachedLocalFetchInstance[`${regionData.trackModel.id}`] =
        new LocalBigSourceGmod(regionData.trackModel.fileObj);
    } else if (trackType === "bedOrTabix") {
      cachedLocalFetchInstance[`${regionData.trackModel.id}`] =
        new LocalTabixSource(regionData.trackModel);
    }
  }

  let fetchInstance = cachedLocalFetchInstance[`${regionData.trackModel.id}`];

  // if (trackType in { repeat: "", jaspar: "" }) {
  //   return fetchInstance.getData(
  //     regionData.nav,
  //     regionData.basesPerPixel,
  //     regionData.trackModel.options
  //   );
  // }

  return await fetchInstance.getData(
    regionData.nav,
    regionData.trackModel.options
  );
}
