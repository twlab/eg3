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

interface CacheTrackDataParams {
  id: string;
  trackData: any;
  fetchedDataCache: any;
  rightIdx: { current: number };
  leftIdx: { current: number };
  createSVGOrCanvas: (
    trackState: any,
    dataCacheArray: any[],
    isError: boolean,
    currentIndex?: number,
    signal?: any
  ) => void;
  trackModel: any;
  usePrimaryNav: boolean;
  signal?: any;
}
export const trackUsingExpandedLoci = {
  biginteract: "",
  dynamichic: "",
  dynamiclongrange: "",
  hic: "",
  longrange: "",
  genomealign: "",
};

function checkFetchError(trackData, id) {
  let detectError = false;
  if (Array.isArray(trackData[`${id}`].result)) {
    trackData[`${id}`].result.map((item) => {
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
    if (
      isObject(trackData[`${id}`].result) &&
      "error" in trackData[`${id}`].result
    ) {
      detectError = true;
    }
  }

  return detectError;
}
export function cacheTrackData({
  id,
  trackData,
  fetchedDataCache,

  rightIdx,
  leftIdx,
  createSVGOrCanvas,
  trackModel = "",
  usePrimaryNav,
  signal = null,
}: CacheTrackDataParams) {
  // Passing rawData to the correct tracks and saving it to cache to be displayed
  let isError = checkFetchError(trackData, id);
  const primaryVisData =
    trackData!.trackState.genomicFetchCoord[
      trackData!.trackState.primaryGenName
    ].primaryVisData;

  if (trackData!.trackState.initial === 1) {
    let visRegion = !usePrimaryNav
      ? trackData!.trackState.genomicFetchCoord[
          trackData![`${id}`].metadata.genome
        ].queryRegion
      : primaryVisData.visRegion;

    if (trackModel.type in trackUsingExpandedLoci || !usePrimaryNav) {
      let newTrackState = {
        ...trackData.trackState,
        initial: 1,
        side: "right",
        xDist: 0,
        visRegion: visRegion,
        startWindow: primaryVisData.viewWindow.start,
        visWidth: primaryVisData.visWidth,
      };

      fetchedDataCache.current[rightIdx.current] = {
        dataCache:
          trackModel.type in
          {
            dynamichic: "",
            dynamiclongrange: "",
            hic: "",
          }
            ? trackData![`${id}`].result
            : trackModel !== "" && trackModel.type === "genomealign"
            ? trackData![`${id}`].result[0]
            : trackData![`${id}`].result.flat(1),
        trackState: newTrackState,
      };
      rightIdx.current--;

      const curDataArr = fetchedDataCache.current[0].dataCache;
      createSVGOrCanvas(
        newTrackState,
        curDataArr,
        isError,
        rightIdx.current + 1,
        signal
      );
    }
    // tracks that dont use expanded nav loci_____________________________________________________________________________________________________________________________________________________________________
    //__________________________________________________________________________________________________________________________________________________________
    else {
      let trackState0 = {
        initial: 0,
        side: "left",
        xDist: 0,
        index: 1,
      };
      let trackState1 = {
        ...trackData.trackState,
        initial: 1,
        side: "right",
        xDist: 0,
        visRegion: visRegion,
        index: 0,
        startWindow: primaryVisData.viewWindow.start,
        visWidth: primaryVisData.visWidth,
      };

      let trackState2 = {
        initial: 0,
        side: "right",
        xDist: 0,
        index: -1,
      };

      fetchedDataCache.current[leftIdx.current] = {
        dataCache:
          trackModel !== "" &&
          trackModel.type in { matplot: "", dynamic: "", dynamicbed: "" }
            ? trackData![`${id}`].result.map((item: any, index: number) => {
                return item[0];
              })
            : trackData![`${id}`].result[0],
        trackState: trackState0,
      };
      leftIdx.current++;

      fetchedDataCache.current[rightIdx.current] = {
        dataCache:
          trackModel !== "" &&
          trackModel.type in { matplot: "", dynamic: "", dynamicbed: "" }
            ? trackData![`${id}`].result.map((item: any, index: number) => {
                return item[1];
              })
            : trackData![`${id}`].result[1],
        trackState: trackState1,
      };
      rightIdx.current--;
      fetchedDataCache.current[rightIdx.current] = {
        dataCache:
          trackModel !== "" &&
          trackModel.type in { matplot: "", dynamic: "", dynamicbed: "" }
            ? trackData![`${id}`].result.map((item: any, index: number) => {
                return item[2];
              })
            : trackData![`${id}`].result[2],
        trackState: trackState2,
      };
      rightIdx.current--;

      let testData = [
        fetchedDataCache.current[1],
        fetchedDataCache.current[0],
        fetchedDataCache.current[-1],
      ];

      let viewData;
      if (trackModel.type in { matplot: "", dynamic: "", dynamicbed: "" }) {
        viewData = getDeDupeArrMatPlot(testData, isError);
      } else {
        viewData = testData.map((item) => item.dataCache).flat(1);
      }

      createSVGOrCanvas(
        trackState1,
        viewData,
        isError,
        rightIdx.current + 2,
        signal
      );
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
        trackData!.trackState.genomicFetchCoord[
          `${trackData![`${id}`].metadata.genome}`
        ].queryRegion;
    } else {
      visRegion = primaryVisData.visRegion;
    }

    let newTrackState = {
      ...trackData.trackState,
      initial: 0,
      side: trackData!.trackState.side,
      xDist: trackData!.trackState.xDist,
      visRegion: visRegion,
      startWindow: primaryVisData.viewWindow.start,
      visWidth: primaryVisData.visWidth,
    };

    if (trackModel.type in trackUsingExpandedLoci || !usePrimaryNav) {
      if (trackData!.trackState.side === "right") {
        newTrackState.index = rightIdx.current;
        fetchedDataCache.current[rightIdx.current] = {
          dataCache:
            trackData![`${id}`].metadata["track type"] === "genomealign"
              ? trackData![`${id}`].result[0]
              : trackData![`${id}`].result,
          trackState: newTrackState,
        };
        rightIdx.current--;
        createSVGOrCanvas(
          newTrackState,
          fetchedDataCache.current[rightIdx.current + 1].dataCache,
          isError,
          rightIdx.current + 1,
          signal
        );
      } else if (trackData!.trackState.side === "left") {
        trackData!.trackState.index = leftIdx.current;

        fetchedDataCache.current[leftIdx.current] = {
          dataCache:
            trackData![`${id}`].metadata["track type"] === "genomealign"
              ? trackData![`${id}`].result[0]
              : trackData![`${id}`].result,
          trackState: newTrackState,
        };

        leftIdx.current++;
        createSVGOrCanvas(
          newTrackState,
          fetchedDataCache.current[leftIdx.current - 1].dataCache,
          isError,
          leftIdx.current - 1,
          signal
        );
      }
    }
    // tracks that dont use expanded nav loci_____________________________________________________________________________________________________________________________________________________________________
    //__________________________________________________________________________________________________________________________________________________________
    else {
      let testData: Array<any> = [];

      if (trackData!.trackState.side === "right") {
        trackData!.trackState.index = rightIdx.current;

        fetchedDataCache.current[rightIdx.current] = {
          dataCache: trackData![`${id}`].result,
          trackState: newTrackState,
        };

        fetchedDataCache.current[rightIdx.current + 1]["trackState"] =
          newTrackState;

        let currIdx = rightIdx.current + 2;
        for (let i = 0; i < 3; i++) {
          testData.push(fetchedDataCache.current[currIdx]);
          currIdx--;
        }

        let viewData;
        if (trackModel.type in { matplot: "", dynamic: "", dynamicbed: "" }) {
          viewData = getDeDupeArrMatPlot(testData, isError);
        } else {
          viewData = testData.map((item) => item.dataCache).flat(1);
        }
        rightIdx.current--;
        createSVGOrCanvas(
          fetchedDataCache.current[rightIdx.current + 2].trackState,
          viewData,
          isError,
          rightIdx.current + 2,
          signal
        );
      } else if (trackData!.trackState.side === "left") {
        trackData!.trackState.index = leftIdx.current;
        fetchedDataCache.current[leftIdx.current] = {
          dataCache: trackData![`${id}`].result,
          trackState: newTrackState,
        };
        fetchedDataCache.current[leftIdx.current - 1]["trackState"] =
          newTrackState;
        let currIdx = leftIdx.current;
        for (let i = 0; i < 3; i++) {
          testData.push(fetchedDataCache.current[currIdx]);
          currIdx--;
        }
        console.log(fetchedDataCache.current);
        let viewData;
        if (trackModel.type in { matplot: "", dynamic: "", dynamicbed: "" }) {
          viewData = getDeDupeArrMatPlot(testData, isError);
        } else {
          viewData = testData.map((item) => item.dataCache).flat(1);
        }
        leftIdx.current++;
        createSVGOrCanvas(
          fetchedDataCache.current[leftIdx.current - 2].trackState,
          viewData,
          isError,
          leftIdx.current - 2,
          signal
        );
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
