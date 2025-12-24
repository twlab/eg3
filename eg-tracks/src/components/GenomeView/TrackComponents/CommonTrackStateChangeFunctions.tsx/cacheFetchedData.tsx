// import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";

import {
  removeDuplicates,
  removeDuplicatesWithoutId,
} from "../commonComponents/check-obj-dupe";
import { dynamicMatplotTracks } from "../displayModeComponentMap";

export function groupTracksArrMatPlot(data: Array<any>) {
  // Pre-determine the size to avoid dynamic resizing
  const maxIndex =
    data.length > 0
      ? Math.max(...data.map((d) => d.dataCache?.length || 0))
      : 0;
  const groupedArrays: any[][] = new Array(maxIndex);

  // Initialize arrays once
  for (let i = 0; i < maxIndex; i++) {
    groupedArrays[i] = [];
  }

  // Use for loops for better performance and flatten during grouping
  for (let i = 0; i < data.length; i++) {
    const dataItem = data[i];
    const dataCache = dataItem.dataCache;

    for (let j = 0; j < dataCache.length; j++) {
      const featArr = dataCache[j];

      groupedArrays[j].push(featArr);
    }
  }

  return groupedArrays;
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
        dataCache: dynamicMatplotTracks.has(trackType)
          ? trackData.map((item: any, index: number) => {
              return item[0];
            })
          : trackData[0],
      };
      trackFetchedDataCache.current[`${id}`].cacheDataIdx["leftIdx"]++;

      trackFetchedDataCache.current[`${id}`][
        trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"]
      ] = {
        dataCache: dynamicMatplotTracks.has(trackType)
          ? trackData.map((item: any, index: number) => {
              return item[1];
            })
          : trackData[1],
      };
      trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"]--;
      trackFetchedDataCache.current[`${id}`][
        trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"]
      ] = {
        dataCache: dynamicMatplotTracks.has(trackType)
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
