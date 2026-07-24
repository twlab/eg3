import _ from "lodash";
import LocalBigSourceGmod from "./LocalBigSourceGmod";
import LocalTabixSource from "./localTabixSource";
import TextSource from "./localTextSource";
import BedTextSource from "./BedTextSource";
import LongrangeAndreaTextSource from "./LongrangeAndreaTextSource";
import LocalBigSource from "./LocalBigSource";
import { HicSource } from "../getRemoteData/hicSource";
import Feature from "../models/Feature";
import ChromosomeInterval from "../models/ChromosomeInterval";
import NavigationContext from "../models/NavigationContext";
import DisplayedRegionModel from "../models/DisplayedRegionModel";

function objToInstanceAlign(alignment: { [key: string]: any }) {
  const visRegionFeatures: Feature[] = [];
  for (const feature of alignment._navContext._features) {
    const newChr = new ChromosomeInterval(
      feature.locus.chr,
      feature.locus.start,
      feature.locus.end,
    );
    visRegionFeatures.push(new Feature(feature.name, newChr));
  }
  const visRegionNavContext = new NavigationContext(
    alignment._navContext._name,
    visRegionFeatures,
  );
  return new DisplayedRegionModel(
    visRegionNavContext,
    alignment._startBase,
    alignment._endBase,
  );
}

// How long any single fetch is allowed to run before we give up. Hic-based
// tracks are heavier, so they get a longer budget than everything else.
const DEFAULT_TIMEOUT_MS = 8000;
const HIC_TIMEOUT_MS = 20000;
const LONG_TIMEOUT_TYPES = new Set(["hic", "dynamichic"]);

function timeoutForType(type: string) {
  return LONG_TIMEOUT_TYPES.has(type) ? HIC_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
}

// Track types grouped by the data source they fetch through. A type only needs
// to appear in one set; getLocalData uses these to pick the fetch strategy.
const BED_OR_TABIX = new Set([
  "bed",
  "bedgraph",
  "qbed",
  "refbed",
  "matplot",
  "categorical",
  "longrange",
  "methylc",
]);
const BIG = new Set(["bigwig", "dynseq", "biginteract"]);
const BIGBED = new Set(["bigbed"]);
const HIC = new Set(["hic"]);

// Every supported local track type routes through getLocalData; the strategy is
// derived from regionData.trackModel.type, so no second argument is needed.
const LOCAL_TYPES = [...BED_OR_TABIX, ...BIG, ...BIGBED, ...HIC];

// Track types served from an in-browser text blob via getTextData.
const TEXT_TYPES = ["bed", "bedgraph", "qbed", "refbed", "longrange"];

let cachedLocalFetchInstance: { [key: string]: any } = {};

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

export const localFetchTypeMap: { [key: string]: any } = LOCAL_TYPES.reduce(
  (map, type) => {
    map[type] = (regionData: any) => getLocalData(regionData);
    return map;
  },
  {} as { [key: string]: any },
);

export const textFetchTypeMap: { [key: string]: any } = TEXT_TYPES.reduce(
  (map, type) => {
    map[type] = (regionData: any) =>
      withTimeout(getTextData(regionData), timeoutForType(type));
    return map;
  },
  {} as { [key: string]: any },
);

async function getTextData(regionData: any) {
  if (!(regionData.trackModel.id in cachedLocalFetchInstance)) {
    if (
      regionData.trackModel.type === "longrange" &&
      regionData.trackModel.textConfig.subType === "AndreaGillespie"
    ) {
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
          type: regionData.trackModel.type,
        });
    }
  }

  let fetchInstance = cachedLocalFetchInstance[`${regionData.trackModel.id}`];

  return await fetchInstance.getData(regionData.nav);
}

function getLocalData(regionData: any) {
  const type = regionData.trackModel.type;
  const dataPromise = HIC.has(type)
    ? fetchLocalHic(regionData)
    : fetchLocalSource(regionData);
  return withTimeout(dataPromise, timeoutForType(type));
}

async function fetchLocalSource(regionData: any) {
  const type = regionData.trackModel.type;

  if (!(regionData.trackModel.id in cachedLocalFetchInstance)) {
    if (BIGBED.has(type)) {
      cachedLocalFetchInstance[`${regionData.trackModel.id}`] =
        new LocalBigSource(regionData.trackModel.fileObj);
    } else if (BIG.has(type)) {
      cachedLocalFetchInstance[`${regionData.trackModel.id}`] =
        new LocalBigSourceGmod(regionData.trackModel.fileObj);
    } else if (BED_OR_TABIX.has(type)) {
      cachedLocalFetchInstance[`${regionData.trackModel.id}`] =
        new LocalTabixSource(regionData.trackModel);
    }
  }

  let fetchInstance = cachedLocalFetchInstance[`${regionData.trackModel.id}`];

  if (BIGBED.has(type)) {
    return await fetchInstance.getData(
      regionData.nav,
      regionData.basesPerPixel,
      regionData.trackModel.options,
    );
  }

  return await fetchInstance.getData(
    regionData.nav,
    regionData.trackModel.options,
  );
}

async function fetchLocalHic(regionData: any) {
  if (!(regionData.trackModel.id in cachedLocalFetchInstance)) {
    cachedLocalFetchInstance[`${regionData.trackModel.id}`] = new HicSource(
      regionData.trackModel.fileObj,
    );
  }

  const fetchInstance = cachedLocalFetchInstance[`${regionData.trackModel.id}`];
  const data = await fetchInstance.getData(
    objToInstanceAlign(regionData.visRegion),
    regionData.basesPerPixel,
    regionData.trackModel.options,
  );
  const fileInfos = fetchInstance.getFileInfo();
  return { data, fileInfos };
}
