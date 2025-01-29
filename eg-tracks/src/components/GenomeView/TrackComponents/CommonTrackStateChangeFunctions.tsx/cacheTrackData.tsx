// import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";

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
  dataSide: string;
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
  dataSide,
}: cacheFetchedDataParams) {
  const isError = checkFetchError(trackData);
  // Passing rawData to the correct tracks and saving it to cache to be displayed

  const primaryVisData =
    trackState.genomicFetchCoord[trackState.primaryGenName].primaryVisData;

  if (trackState.initial === 1) {
    let visRegion = !usePrimaryNav
      ? trackState.genomicFetchCoord[metadata.genome].queryRegion
      : primaryVisData.visRegion;

    if (trackType in trackUsingExpandedLoci || !usePrimaryNav) {
      let newTrackState = {
        ...trackState,
        initial: 1,
        side: "right",
        xDist: 0,
        visRegion: visRegion,
        startWindow: primaryVisData.viewWindow.start,
        visWidth: primaryVisData.visWidth,
        isError: isError,
      };

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
            ? trackData[0]
            : trackData.flat(1),
        trackState: newTrackState,
      };
      trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"]--;
    }
    // tracks that dont use expanded nav loci_____________________________________________________________________________________________________________________________________________________________________
    //__________________________________________________________________________________________________________________________________________________________
    else {
      let trackState0 = {
        initial: 0,
        side: "left",
        xDist: 0,
        index: 1,
        isError: isError,
      };
      let trackState1 = {
        ...trackState,
        initial: 1,
        side: "right",
        xDist: 0,
        visRegion: visRegion,
        index: 0,
        startWindow: primaryVisData.viewWindow.start,
        visWidth: primaryVisData.visWidth,
        isError: isError,
      };

      let trackState2 = {
        initial: 0,
        side: "right",
        xDist: 0,
        index: -1,
        isError: isError,
      };

      trackFetchedDataCache.current[`${id}`][
        trackFetchedDataCache.current[`${id}`].cacheDataIdx["leftIdx"]
      ] = {
        dataCache:
          trackType in { matplot: "", dynamic: "", dynamicbed: "" }
            ? trackData.map((item: any, index: number) => {
                return item[0];
              })
            : trackData[0],
        trackState: trackState0,
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
        trackState: trackState1,
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
        trackState: trackState2,
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
    let visRegion;
    if (!usePrimaryNav) {
      visRegion =
        trackState.genomicFetchCoord[`${metadata.genome}`].queryRegion;
    } else {
      visRegion = primaryVisData.visRegion;
    }

    let newTrackState = {
      ...trackState,
      initial: 0,
      side: trackState.side,
      xDist: trackState.xDist,
      visRegion: visRegion,
      startWindow: primaryVisData.viewWindow.start,
      visWidth: primaryVisData.visWidth,
      isError: isError,
    };

    if (trackType in trackUsingExpandedLoci || !usePrimaryNav) {
      if (dataSide === "right") {
        newTrackState.index =
          trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"];
        trackFetchedDataCache.current[`${id}`][
          trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"]
        ] = {
          dataCache:
            metadata["track type"] === "genomealign" ? trackData[0] : trackData,
          trackState: newTrackState,
        };
        trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"]--;
      } else if (dataSide === "left") {
        trackState.index =
          trackFetchedDataCache.current[`${id}`].cacheDataIdx["leftIdx"];

        trackFetchedDataCache.current[`${id}`][
          trackFetchedDataCache.current[`${id}`].cacheDataIdx["leftIdx"]
        ] = {
          dataCache:
            metadata["track type"] === "genomealign" ? trackData[0] : trackData,
          trackState: newTrackState,
        };

        trackFetchedDataCache.current[`${id}`].cacheDataIdx["leftIdx"]++;
      }
    }
    // tracks that dont use expanded nav loci_____________________________________________________________________________________________________________________________________________________________________
    //__________________________________________________________________________________________________________________________________________________________
    else {
      if (dataSide === "right") {
        trackState.index =
          trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"];

        trackFetchedDataCache.current[`${id}`][
          trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"]
        ] = {
          dataCache: trackData,
          trackState: newTrackState,
        };

        trackFetchedDataCache.current[`${id}`][
          trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"] + 1
        ]["trackState"] = newTrackState;

        trackFetchedDataCache.current[`${id}`].cacheDataIdx["rightIdx"]--;
      } else if (dataSide === "left") {
        trackState.index =
          trackFetchedDataCache.current[`${id}`].cacheDataIdx["leftIdx"];
        trackFetchedDataCache.current[`${id}`][
          trackFetchedDataCache.current[`${id}`].cacheDataIdx["leftIdx"]
        ] = {
          dataCache: trackData,
          trackState: newTrackState,
        };
        trackFetchedDataCache.current[`${id}`][
          trackFetchedDataCache.current[`${id}`].cacheDataIdx["leftIdx"] - 1
        ]["trackState"] = newTrackState;

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
