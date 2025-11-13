import TabixSource from "./tabixSource";
import BigSourceWorkerGmod from "./BigSourceWorkerGmod";
import JasparSource from "./JasparSource";
import VcfSource from "./VcfSource";

const apiConfigMap = { WashU: "https://lambda.epigenomegateway.org/v3" };

// Map track types to their data source types
const TRACK_TYPE_MAP: { [key: string]: string } = {
  bed: "bedOrTabix",
  bedcolor: "bedOrTabix",
  omeroidr: "bedOrTabix",
  bedgraph: "bedOrTabix",
  qbed: "bedOrTabix",
  dbedgraph: "bedOrTabix",
  modbed: "bedOrTabix",
  refbed: "bedOrTabix",
  matplot: "bedOrTabix",
  categorical: "bedOrTabix",
  longrange: "bedOrTabix",
  methylc: "bedOrTabix",
  genomealign: "bedOrTabix",
  boxplot: "big",
  bigwig: "big",
  dynseq: "big",
  biginteract: "big",
  repeatmasker: "repeat",
  rmskv2: "rmskv2",
  jaspar: "jaspar",
  bigbed: "bigbed",
  vcf: "vcf",
};

// Create fetch functions dynamically for standard track types
const createStandardFetchFunctions = () => {
  const functions: { [key: string]: any } = {};

  for (const [trackType, sourceType] of Object.entries(TRACK_TYPE_MAP)) {
    functions[trackType] = async function (regionData: any) {
      return getRemoteData(regionData, sourceType);
    };
  }

  return functions;
};

export const trackFetchFunction: { [key: string]: any } = {
  // Custom implementations
  geneannotation: async function refGeneFetch(regionData: any) {
    const trackModel = regionData.trackModel;
    const genomeName = trackModel.apiConfig?.genome || regionData.genomeName;
    const apiConfigPrefix =
      trackModel.apiConfig?.format && apiConfigMap[trackModel.apiConfig.format]
        ? apiConfigMap[trackModel.apiConfig.format]
        : apiConfigMap.WashU;

    const url = `${apiConfigPrefix}/${genomeName}/genes/${regionData.name}/queryRegion?chr=${regionData.chr}&start=${regionData.start}&end=${regionData.end}`;

    const genRefResponse = await fetch(url, {
      method: "GET",
    });

    return genRefResponse.json();
  },
  snp: async function snpFetch(regionData: any) {
    const SNP_REGION_API: { [key: string]: string } = {
      hg19: "https://grch37.rest.ensembl.org/overlap/region/human",
      hg38: "https://rest.ensembl.org/overlap/region/human",
    };

    const api = SNP_REGION_API[regionData.genomeName];

    if (!api || regionData.end - regionData.start > 30000) {
      return [];
    }

    const url = `${api}/${regionData.chr.substr(3)}:${regionData.start}-${
      regionData.end
    }?content-type=application%2Fjson&feature=variation`;

    try {
      const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      return response.json();
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
      return { data: [] };
    }
  },

  // Spread all standard track type functions
  ...createStandardFetchFunctions(),
};

function getRemoteData(regionData: any, trackType: string) {
  const indexUrl = regionData.trackModel.indexUrl || null;
  let fetchInstance: any = null;

  const trackTypeMap: { [key: string]: any } = {
    bedOrTabix: () => new TabixSource(regionData.trackModel.url, indexUrl),
    vcf: () => new VcfSource(regionData.trackModel.url, indexUrl),
    bigbed: () => new BigSourceWorkerGmod(regionData.trackModel.url),
    big: () => new BigSourceWorkerGmod(regionData.trackModel.url),
    repeat: () => new BigSourceWorkerGmod(regionData.trackModel.url),
    rmskv2: () => new BigSourceWorkerGmod(regionData.trackModel.url),
    jaspar: () => new BigSourceWorkerGmod(regionData.trackModel.url),
  };

  if (trackTypeMap[trackType]) {
    fetchInstance = trackTypeMap[trackType]();
  }

  if (!fetchInstance) {
    return null;
  }

  const needsBasesPerPixel =
    (trackType === "repeat" || trackType === "rmskv2") &&
    regionData.basesPerPixel <= 1000;
  const isJaspar = trackType === "jaspar" && regionData.basesPerPixel <= 2;
  const isBigbed = trackType === "bigbed";

  if (needsBasesPerPixel || isJaspar || isBigbed) {
    return fetchInstance.getData(
      regionData.nav,
      regionData.basesPerPixel,
      regionData.trackModel.options
    );
  } else {
    return fetchInstance.getData(regionData.nav, regionData.trackModel.options);
  }
}

export default trackFetchFunction;
