import _ from "lodash";
import TabixSource from "./tabixSource";
import BigSourceWorkerGmod from "./BigSourceWorkerGmod";
import RepeatSource from "./RepeatSource";

import JasparSource from "./JasparSource";

const AWS_API = "https://lambda.epigenomegateway.org/v2";
let cachedFetchInstance: { [key: string]: any } = {};
const trackFetchFunction: { [key: string]: any } = {
  geneannotation: async function refGeneFetch(regionData: any) {
    const genRefResponse = await fetch(
      `${AWS_API}/${regionData.genomeName}/genes/${regionData.name}/queryRegion?chr=${regionData.chr}&start=${regionData.start}&end=${regionData.end}`,
      { method: "GET" }
    );

    return await genRefResponse.json();
  },
  snp: async function snpFetch(regionData: any) {
    const SNP_REGION_API = {
      hg19: "https://grch37.rest.ensembl.org/overlap/region/human",
      hg38: "https://rest.ensembl.org/overlap/region/human",
    };

    const api =
      regionData.genomeName in SNP_REGION_API
        ? SNP_REGION_API[`${regionData.genomeName}`]
        : null;

    if (!api) {
      return [];
    }

    const headers = {
      "Content-Type": "application/json",
    };

    if (regionData.end - regionData.start <= 30000) {
      const url = `${api}/${regionData.chr.substr(3)}:${regionData.start}-${
        regionData.end + "?content-type=application%2Fjson&feature=variation"
      }`;

      return fetch(url, { headers })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .catch((error) => {
          console.error("There was a problem with the fetch operation:", error);
          return { data: [] };
        });
    } else {
      return [];
    }
  },
  bed: async function bedFetch(regionData: any) {
    return getRemoteData(regionData, "bedOrTabix");
  },

  omeroidr: async function bedFetch(regionData: any) {
    return getRemoteData(regionData, "bedOrTabix");
  },
  bedgraph: async function bedgraphFetch(regionData: any) {
    return getRemoteData(regionData, "bedOrTabix");
  },

  qbed: async function qbedFetch(regionData: any) {
    return getRemoteData(regionData, "bedOrTabix");
  },
  dbedgraph: async function dbedgraphFetch(regionData: any) {
    return getRemoteData(regionData, "bedOrTabix");
  },

  boxplot: async function boxplotFetch(regionData: any) {
    return getRemoteData(regionData, "big");
  },
  modbed: async function bedFetch(regionData: any) {
    return getRemoteData(regionData, "bedOrTabix");
  },

  jaspar: async function jasparFetch(regionData: any) {
    return getRemoteData(regionData, "jaspar");
  },
  bigbed: async function bigbedFetch(regionData: any) {
    return getRemoteData(regionData, "big");
  },
  refbed: async function refbedFetch(regionData: any) {
    return getRemoteData(regionData, "bedOrTabix");
  },
  matplot: async function matplotFetch(regionData: any) {
    return getRemoteData(regionData, "bedOrTabix");
  },
  bigwig: async function bigwigFetch(regionData: any) {
    return getRemoteData(regionData, "big");
  },

  categorical: async function coolFetch(regionData: any) {
    return getRemoteData(regionData, "bedOrTabix");
  },
  longrange: async function coolFetch(regionData: any) {
    return getRemoteData(regionData, "bedOrTabix");
  },
  dynseq: async function dynseqFetch(regionData: any) {
    return getRemoteData(regionData, "big");
  },

  repeatmasker: async function repeatmaskerFetch(regionData: any) {
    return getRemoteData(regionData, "repeat");
  },
  biginteract: async function biginteractFetch(regionData: any) {
    return getRemoteData(regionData, "big");
  },
  methylc: async function methylcFetch(regionData: any) {
    return getRemoteData(regionData, "bedOrTabix");
  },

  genomealign: function genomeAlignFetch(regionData: any) {
    return getRemoteData(regionData, "bedOrTabix");
  },
};

function getRemoteData(regionData: any, trackType: string) {
  if (regionData.trackModel.id in cachedFetchInstance) {
  } else {
    if (trackType === "bedOrTabix") {
      cachedFetchInstance[`${regionData.trackModel.id}`] = new TabixSource(
        regionData.trackModel.url
      );
    } else if (trackType === "big") {
      cachedFetchInstance[`${regionData.trackModel.id}`] =
        new BigSourceWorkerGmod(regionData.trackModel.url);
    } else if (trackType === "repeat") {
      cachedFetchInstance[`${regionData.trackModel.id}`] = new RepeatSource(
        regionData.trackModel.url
      );
    } else if (trackType === "jaspar") {
      cachedFetchInstance[`${regionData.trackModel.id}`] = new JasparSource(
        regionData.trackModel.url
      );
    }
  }
  let fetchInstance = cachedFetchInstance[`${regionData.trackModel.id}`];

  if (trackType in { repeat: "", jaspar: "" }) {
    return fetchInstance.getData(
      regionData.nav,
      regionData.basesPerPixel,
      regionData.trackModel.options
    );
  }
  return fetchInstance.getData(regionData.nav, regionData.trackModel.options);
}

export default trackFetchFunction;
