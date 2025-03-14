// import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";

import DisplayedRegionModel from "../../../models/DisplayedRegionModel";
import {
  removeDuplicates,
  removeDuplicatesWithoutId,
} from "../commonComponents/check-obj-dupe";

export function getDeDupeArrMatPlot(data: Array<any>, isError) {
  if (isError) {
    return;
  }
  let tempMap = new Map<number, any[]>();

  data.forEach((data) => {
    data.dataCache.forEach((featArr, j) => {
      if (tempMap.has(j)) {
        tempMap.get(j)!.push(featArr);
      } else {
        tempMap.set(j, [featArr]);
      }
    });
  });

  let deDupcacheDataArr: Array<any> = [];
  tempMap.forEach((value, key) => {
    deDupcacheDataArr.push(removeDuplicatesWithoutId(value.flat(1)));
  });

  return deDupcacheDataArr;
}
function isObject(variable) {
  return variable !== null && typeof variable === "object";
}

interface cacheFetchedDataParams {
  id: string;
  trackData: any;
  trackFetchedDataCache: any;

  trackState: any;
  trackType: string;
  usePrimaryNav: boolean;
  metadata: any;
  navContext: any;
  bpRegionSize: number;
}
export const trackUsingExpandedLoci = {
  biginteract: "",
  dynamichic: "",
  dynamiclongrange: "",
  hic: "",
  longrange: "",
  genomealign: "",
};

function checkFetchError(trackData) {
  let detectError = false;
  if (Array.isArray(trackData)) {
    trackData.map((item) => {
      if (Array.isArray(item)) {
        item.map((innerItem) => {
          if ("error" in innerItem) {
            detectError = true;
          }
        });
      } else if ("error" in item) {
        detectError = true;
      }
    });
  } else {
    if (isObject(trackData) && "error" in trackData) {
      detectError = true;
    }
  }

  return detectError;
}

export function cacheFetchedData({
  id,
  trackData,
  trackFetchedDataCache,
  trackState,
  trackType = "",
  usePrimaryNav,
  metadata,
  navContext,
  bpRegionSize,
}: cacheFetchedDataParams) {
  const isError = checkFetchError(trackData);
  // Passing rawData to the correct tracks and saving it to cache to be displayed

  if (trackState.initial === 1) {
    if (trackType in trackUsingExpandedLoci || !usePrimaryNav) {
      trackFetchedDataCache.current[`${id}`][
        trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"]
      ] = {
        dataCache:
          trackType in
          {
            dynamichic: "",
            dynamiclongrange: "",
            hic: "",
          }
            ? trackData
            : trackType === "genomealign"
            ? trackData
            : trackData.flat(1),
      };
      trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"]--;
    }
    // tracks that dont use expanded nav loci_____________________________________________________________________________________________________________________________________________________________________
    //__________________________________________________________________________________________________________________________________________________________
    else {
      trackFetchedDataCache.current[`${id}`][
        trackFetchedDataCache.current[`${id}`].cacheDataIdx["leftIdx"]
      ] = {
        dataCache:
          trackType in { matplot: "", dynamic: "", dynamicbed: "" }
            ? trackData.map((item: any, index: number) => {
                return item[0];
              })
            : trackData[0],
      };
      trackFetchedDataCache.current[`${id}`].cacheDataIdx["leftIdx"]++;

      trackFetchedDataCache.current[`${id}`][
        trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"]
      ] = {
        dataCache:
          trackType in { matplot: "", dynamic: "", dynamicbed: "" }
            ? trackData.map((item: any, index: number) => {
                return item[1];
              })
            : trackData[1],
      };
      trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"]--;
      trackFetchedDataCache.current[`${id}`][
        trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"]
      ] = {
        dataCache:
          trackType in { matplot: "", dynamic: "", dynamicbed: "" }
            ? trackData.map((item: any, index: number) => {
                return item[2];
              })
            : trackData[2],
      };
      trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"]--;
    }
  }

  // NON INITIAL POSITION DATA
  //__________________________________________________________________________________________________________@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  //__________________________________________________________________________________________________________@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  //__________________________________________________________________________________________________________@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  //__________________________________________________________________________________________________________@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  else {
    // console.log(
    //   newTrackState,
    //   trackData,
    //   { ...trackFetchedDataCache.current[`${id}`].cacheDataIdx },
    //   "cachnew"
    // );
    if (trackType in trackUsingExpandedLoci || !usePrimaryNav) {
      if (trackState.side === "right") {
        trackFetchedDataCache.current[`${id}`][
          trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"]
        ] = {
          dataCache:
            metadata["track type"] === "genomealign" ? trackData[0] : trackData,
        };
        trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"]--;
      } else if (trackState.side === "left") {
        trackFetchedDataCache.current[`${id}`][
          trackFetchedDataCache.current[`${id}`].cacheDataIdx["leftIdx"]
        ] = {
          dataCache:
            metadata["track type"] === "genomealign" ? trackData[0] : trackData,
        };

        trackFetchedDataCache.current[`${id}`].cacheDataIdx["leftIdx"]++;
      }
    }
    // tracks that dont use expanded nav loci_____________________________________________________________________________________________________________________________________________________________________
    //__________________________________________________________________________________________________________________________________________________________
    else {
      if (trackType === "genomealign") {
      }
      if (trackState.side === "right") {
        trackFetchedDataCache.current[`${id}`][
          trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"]
        ] = {
          dataCache: trackData,
        };

        trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"]--;
      } else if (trackState.side === "left") {
        trackFetchedDataCache.current[`${id}`][
          trackFetchedDataCache.current[`${id}`].cacheDataIdx["leftIdx"]
        ] = {
          dataCache: trackData,
        };

        trackFetchedDataCache.current[`${id}`].cacheDataIdx["leftIdx"]++;
      }
    }
  }
}

export function transformArray(arr: any[][][]) {
  // Determine the number of subarrays in each inner array (assuming all inner arrays have the same structure)
  const numberOfSubArrays = arr[0].length;

  // Initialize the result array with empty arrays for each subarray
  const result: any[][][] = new Array(numberOfSubArrays)
    .fill(null)
    .map(() => []);

  // Iterate over the input array
  arr.forEach((innerArray) => {
    innerArray.forEach((subArray, index) => {
      result[index].push(subArray);
    });
  });

  return result;
}
