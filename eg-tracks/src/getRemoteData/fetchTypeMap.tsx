import TabixSource from "./tabixSource";
import BigSourceWorkerGmod from "./BigSourceWorkerGmod";
import VcfSource from "./VcfSource";
import { HicSource } from "./hicSource";
import BamSource from "./BamSource";
import Feature from "../models/Feature";
import ChromosomeInterval from "../models/ChromosomeInterval";
import NavigationContext from "../models/NavigationContext";
import DisplayedRegionModel from "../models/DisplayedRegionModel";
import BigSourceWorker from "./BigSourceWorker";
function objToInstanceAlign(alignment: { [key: string]: any }) {
  let visRegionFeatures: Feature[] = [];

  for (let feature of alignment._navContext._features) {
    let newChr = new ChromosomeInterval(
      feature.locus.chr,
      feature.locus.start,
      feature.locus.end,
    );
    visRegionFeatures.push(new Feature(feature.name, newChr));
  }

  let visRegionNavContext = new NavigationContext(
    alignment._navContext._name,
    visRegionFeatures,
  );

  let visRegion = new DisplayedRegionModel(
    visRegionNavContext,
    alignment._startBase,
    alignment._endBase,
  );
  return visRegion;
}
const apiConfigMap = { WashU: "https://lambda.epigenomegateway.org/v3" };

// How long any single fetch is allowed to run before we give up. Hic-based
// tracks are heavier, so they get a longer budget than everything else.
const DEFAULT_TIMEOUT_MS = 8000;
const HIC_TIMEOUT_MS = 20000;
const LONG_TIMEOUT_TYPES = new Set(["hic", "dynamichic"]);

function timeoutForType(type: string) {
  return LONG_TIMEOUT_TYPES.has(type) ? HIC_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
}

// Track types grouped by the data source they fetch through. A type only needs
// to appear in one set; getRemoteData uses these to pick the fetch strategy.
const BED_OR_TABIX = new Set([
  "bed",
  "bedcolor",
  "omeroidr",
  "bedgraph",
  "qbed",
  "dbedgraph",
  "modbed",
  "refbed",
  "matplot",
  "categorical",
  "longrange",
  "methylc",
  "genomealign",
]);
const BIG = new Set(["boxplot", "bigwig", "dynseq", "biginteract"]);
const BIGBED = new Set(["bigbed", "bigbedcolor"]);
const JASPAR = new Set(["jaspar"]);
const REPEATMASKER = new Set(["repeatmasker"]);
const RMSKV2 = new Set(["rmskv2"]);
const VCF = new Set(["vcf"]);
const HIC = new Set(["hic"]);
const BAM = new Set(["bam"]);
const GENE_ANNOTATION = new Set(["geneannotation"]);
const SNP = new Set(["snp"]);

// Every supported track type routes through getRemoteData; the strategy is
// derived from regionData.trackModel.type, so no second argument is needed.
const ALL_TYPES = [
  ...BED_OR_TABIX,
  ...BIG,
  ...BIGBED,
  ...JASPAR,
  ...REPEATMASKER,
  ...RMSKV2,
  ...VCF,
  ...HIC,
  ...BAM,
  ...GENE_ANNOTATION,
  ...SNP,
];

let cachedFetchInstance: { [key: string]: any } = {};

export const fetchTypeMap: { [key: string]: any } = ALL_TYPES.reduce(
  (map, type) => {
    map[type] = (regionData: any) => getRemoteData(regionData);
    return map;
  },
  {} as { [key: string]: any },
);

// Reject if the wrapped promise doesn't settle within `ms` milliseconds.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: any;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Request timed out after ${ms / 1000} seconds. `)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function refGeneFetch(regionData: any) {
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

  try {
    const fetchPromises = regionData.nav.map(async (region: any) => {
      const url = `${apiConfigPrefix}/${genomeName}/genes/${regionData.name}/queryRegion?chr=${region.chr}&start=${region.start}&end=${region.end}`;

      try {
        const genRefResponse = await fetch(url, {
          method: "GET",
          mode: "cors",
          cache: "default",
          credentials: "omit",
        });

        if (!genRefResponse.ok) {
          throw new Error(`HTTP error! status: ${genRefResponse.status}`);
        }

        return genRefResponse.json();
      } catch (error) {
        console.error(
          `Error fetching data for region ${region.chr}:${region.start}-${region.end}:`,
          error,
        );
        throw error;
      }
    });

    const results = await Promise.all(fetchPromises);
    return regionData.nav.map((locus, index) => ({
      chr: locus.chr,
      locus: locus,
      data: results[index],
    }));
  } catch (error) {
    console.error("Error in refGeneFetch:", error);
    throw error;
  }
}

async function snpFetch(regionData: any) {
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

  try {
    const fetchPromises = regionData.nav.map(async (region: any) => {
      if (region.end - region.start > 30000) {
        throw new Error("Please zoom in to see content. ");
      }

      const url = `${api}/${region.chr.substr(3)}:${region.start}-${
        region.end
      }?content-type=application%2Fjson&feature=variation`;

      try {
        const response = await fetch(url, {
          headers,
          mode: "cors",
          cache: "default",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
      } catch (error) {
        if (region.end - region.start > 30000) {
          throw new Error("Please zoom in to see content. ");
        } else {
          console.error(
            `Error fetching SNP data for region ${region.chr}:${region.start}-${region.end}: `,
            error,
          );
          throw error;
        }
      }
    });

    const results = await Promise.all(fetchPromises);
    // Normalize the Ensembl API shape to placeable raw records: browser chr
    // and 0-based start (the Snp model used `chr${seq_region_name}` and
    // start-1). Rendered straight from these via the getFeature* accessors.
    return results.flat().map((record: any) => ({
      ...record,
      chr: `chr${record.seq_region_name}`,
      start: record.start - 1,
    }));
  } catch (error) {
    console.error("Error in snpFetch:", error);
    throw error;
  }
}

// Build (or reuse) the data source instance for a track type.
function createFetchInstance(type: string, url: string, indexUrl: any) {
  if (BED_OR_TABIX.has(type)) return new TabixSource(url, indexUrl);
  if (VCF.has(type)) return new VcfSource(url, indexUrl);
  if (BIGBED.has(type)) return new BigSourceWorker(url);
  if (BIG.has(type)) return new BigSourceWorkerGmod(url);
  if (REPEATMASKER.has(type)) return new BigSourceWorker(url);
  if (RMSKV2.has(type)) return new BigSourceWorkerGmod(url);
  if (JASPAR.has(type)) return new BigSourceWorkerGmod(url);
  if (HIC.has(type)) return new HicSource(url);
  if (BAM.has(type)) return new BamSource(url);
  throw new Error(`Unsupported track type: ${type}. `);
}

async function fetchFromSource(regionData: any) {
  const type = regionData.trackModel.type;
  const indexUrl = regionData.trackModel.indexUrl || null;
  const url = regionData.trackModel.url;

  if (!cachedFetchInstance[url]) {
    cachedFetchInstance[url] = createFetchInstance(type, url, indexUrl);
  }
  const fetchInstance = cachedFetchInstance[url];

  try {
    if (!fetchInstance) {
      return;
    }
    const options = {
      ...regionData.trackModel.options,
      trackType: regionData.trackModel.type,
    };
    if (JASPAR.has(type) && regionData.basesPerPixel > 2) {
      throw new Error("Please zoom in to see content. ");
    }
    if (
      (REPEATMASKER.has(type) || RMSKV2.has(type)) &&
      regionData.basesPerPixel > 1000
    ) {
      throw new Error("Please zoom in to see content. ");
    }
    if (BIGBED.has(type)) {
      return fetchInstance
        .getData(regionData.nav, regionData.basesPerPixel, options)
        .then((data: any) => {
          cachedFetchInstance[url] = null;

          return data;
        })
        .catch((error) => {
          cachedFetchInstance[url] = null;
          throw error;
        });
    } else if (HIC.has(type)) {
      return fetchInstance
        .getData(
          objToInstanceAlign(regionData.visRegion),
          regionData.basesPerPixel,
          options,
        )
        .then((data: any) => {
          // cachedFetchInstance[url] = null;
          const fileInfos = cachedFetchInstance[url].getFileInfo();
          const result = { data, fileInfos };
          return result;
        })
        .catch((error) => {
          cachedFetchInstance[url] = null;
          throw error;
        });
    } else {
      return fetchInstance
        .getData(regionData.nav, regionData.basesPerPixel, options)
        .then((data: any) => {
          cachedFetchInstance[url] = null;

          return data;
        })
        .catch((error) => {
          cachedFetchInstance[url] = null;
          throw error;
        });
    }
  } catch (error) {
    cachedFetchInstance[url] = null;
    throw error;
  }
}

function getRemoteData(regionData: any) {
  const type = regionData.trackModel.type;

  let dataPromise: Promise<any>;
  if (GENE_ANNOTATION.has(type)) {
    dataPromise = refGeneFetch(regionData);
  } else if (SNP.has(type)) {
    dataPromise = snpFetch(regionData);
  } else {
    dataPromise = fetchFromSource(regionData);
  }
  if (type === "bam") {
    console.log(dataPromise);
  }

  return withTimeout(dataPromise, timeoutForType(type));
}

export default fetchTypeMap;
