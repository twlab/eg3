import _ from "lodash";
import LocalBigSourceGmod from "./LocalBigSourceGmod";
import LocalTabixSource from "./localTabixSource";

let cachedLocalFetchInstance: { [key: string]: any } = {};
const localTrackFetchFunction: { [key: string]: any } = {
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
  longrange: async function coolFetch(regionData: any) {
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

function getLocalData(regionData: any, trackType: string) {
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
  return fetchInstance.getData(regionData.nav, regionData.trackModel.options);
}

export default localTrackFetchFunction;
