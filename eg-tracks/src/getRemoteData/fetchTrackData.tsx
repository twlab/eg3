import TabixSource from "./tabixSource";
import BigSourceWorkerGmod from "./BigSourceWorkerGmod";
import VcfSource from "./VcfSource";

const apiConfigMap = { WashU: "https://lambda.epigenomegateway.org/v3" };

// Map track types to their data source types

let cachedFetchInstance: { [key: string]: any } = {};
export const trackFetchFunction: { [key: string]: any } = {
  geneannotation: async function refGeneFetch(regionData: any) {
    let genomeName;
    let apiConfigPrefix;
    const trackModel = regionData.trackModel;
    if (trackModel["apiConfig"] && trackModel["apiConfig"]["genome"]) {
      genomeName = trackModel["apiConfig"]["genome"];
    } else {
      genomeName = regionData.genomeName;
    }

    if (
      trackModel["apiConfig"] &&
      trackModel["apiConfig"]["format"] in apiConfigMap
    ) {
      apiConfigPrefix = apiConfigMap[`${trackModel["apiConfig"]["format"]}`];
    } else {
      apiConfigPrefix = apiConfigMap.WashU;
    }

    let url = `${apiConfigPrefix}/${genomeName}/genes/${regionData.name}/queryRegion?chr=${regionData.chr}&start=${regionData.start}&end=${regionData.end}`;

    // Retry logic for intermittent CORS errors
    const maxRetries = 2;
    const retryDelay = 500; // ms

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const genRefResponse = await fetch(url, {
          method: "GET",
          mode: "cors",
          cache: "default",
          credentials: "omit", // Don't send credentials which can cause CORS issues
        });

        if (!genRefResponse.ok) {
          throw new Error(`HTTP error! status: ${genRefResponse.status}`);
        }

        return genRefResponse.json();
      } catch (error) {
        const isCorsError =
          error instanceof TypeError && error.message.includes("fetch");
        const isLastAttempt = attempt === maxRetries;

        if (isCorsError && !isLastAttempt) {
          console.warn(`CORS error on attempt ${attempt + 1}, retrying...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }

        if (isLastAttempt) {
          console.error(
            "Failed to fetch gene annotation data after retries:",
            error
          );
        }
        return [];
      }
    }
    return [];
  },
  snp: async function snpFetch(regionData: any) {
    const SNP_REGION_API: { [key: string]: any } = {
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
        regionData.end
      }?content-type=application%2Fjson&feature=variation`;

      return fetch(url, {
        headers,
        mode: "cors",
        cache: "default",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .catch((error) => {
          console.error("There was a problem with the fetch operation:", error);
          return [];
        });
    } else {
      return [];
    }
  },
  bed: async function bedFetch(regionData: any) {
    return getRemoteData(regionData, "bedOrTabix");
  },
  bedcolor: async function bedFetch(regionData: any) {
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
    return getRemoteData(regionData, "bigbed");
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

  rmskv2: async function rmskv2Fetch(regionData: any) {
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
  vcf: function vcfFetch(regionData: any) {
    return getRemoteData(regionData, "vcf");
  },
};

async function getRemoteData(regionData: any, trackType: string) {
  const indexUrl = regionData.trackModel.indexUrl || null;
  let fetchInstance: any = null;
  if (!cachedFetchInstance[regionData.trackModel.url]) {
    if (trackType === "bedOrTabix") {
      cachedFetchInstance[regionData.trackModel.url] = new TabixSource(
        regionData.trackModel.url,
        indexUrl
      );
    } else if (trackType === "vcf") {
      cachedFetchInstance[regionData.trackModel.url] = new VcfSource(
        regionData.trackModel.url,
        indexUrl
      );
    } else if (trackType === "bigbed") {
      cachedFetchInstance[regionData.trackModel.url] = new BigSourceWorkerGmod(
        regionData.trackModel.url
      );
    } else if (trackType === "big") {
      cachedFetchInstance[regionData.trackModel.url] = new BigSourceWorkerGmod(
        regionData.trackModel.url
      );
    } else if (trackType === "repeat") {
      cachedFetchInstance[regionData.trackModel.url] = new BigSourceWorkerGmod(
        regionData.trackModel.url
      );
    } else if (trackType === "jaspar") {
      cachedFetchInstance[regionData.trackModel.url] = new BigSourceWorkerGmod(
        regionData.trackModel.url
      );
    } else {
      throw new Error(`Unsupported track type: ${trackType}`);
    }
  }
  fetchInstance = cachedFetchInstance[regionData.trackModel.url];
  if (fetchInstance) {
    try {
      const needsBasesPerPixel =
        ((trackType === "repeat" || trackType === "rmskv2") &&
          regionData.basesPerPixel <= 1000) ||
        (trackType === "jaspar" && regionData.basesPerPixel <= 2);

      if (trackType === "jaspar" && regionData.basesPerPixel > 2) {
        return [];
      }
      if (
        (trackType === "repeat" || trackType === "rmskv2") &&
        regionData.basesPerPixel > 1000
      ) {
        return [];
      }
      if (needsBasesPerPixel || trackType === "bigbed") {
        return fetchInstance
          .getData(
            regionData.nav,
            regionData.basesPerPixel,
            regionData.trackModel.options
          )
          .then((data: any) => {
            cachedFetchInstance[regionData.trackModel.url] = null;
            fetchInstance = null;
            return data;
          })
          .catch(() => {
            return { error: "Failed to fetch data. " };
          });
      } else {
        return fetchInstance
          .getData(regionData.nav, regionData.trackModel.options)
          .then((data: any) => {
            cachedFetchInstance[regionData.trackModel.url] = null;
            fetchInstance = null;
            return data;
          })
          .catch(() => {
            return { error: "Failed to fetch data. " };
          });
      }
    } catch (error: any) {
      return { error: "Failed to fetch data. " };
    }
  }
  return { error: "Failed to fetch data. " };
}

export default trackFetchFunction;
