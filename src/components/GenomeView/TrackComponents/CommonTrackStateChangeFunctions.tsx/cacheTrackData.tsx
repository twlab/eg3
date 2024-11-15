import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";

import {
  removeDuplicates,
  removeDuplicatesWithoutId,
} from "../commonComponents/check-obj-dupe";
function getDeDupeArrMatPlot(data: Array<any>) {
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
export function cacheTrackData(
  useFineOrSecondaryParentNav,
  id,
  trackData,
  fetchedDataCache,
  rightIdx,
  leftIdx,
  createViewElement,
  genome,
  keyDupe,
  trackModel: any = ""
) {
  if (useFineOrSecondaryParentNav) {
    const primaryVisData =
      trackData!.trackState.genomicFetchCoord[
        trackData!.trackState.primaryGenName
      ].primaryVisData;

    if (trackData!.trackState.initial === 1) {
      let visRegion =
        "genome" in trackData![`${id}`].metadata
          ? trackData!.trackState.genomicFetchCoord[
              trackData![`${id}`].metadata.genome
            ].queryRegion
          : primaryVisData.visRegion;

      const createTrackState = (index: number, side: string) => ({
        initial: index === 1 ? 1 : 0,
        side,
        xDist: 0,

        visRegion: visRegion,
        startWindow: primaryVisData.viewWindow.start,
        visWidth: primaryVisData.visWidth,
      });

      fetchedDataCache.current[rightIdx.current] = {
        dataCache:
          trackModel !== "" && trackModel.type === "matplot"
            ? trackData![`${id}`].result.flat(1)
            : trackData![`${id}`].result[0],
        trackState: createTrackState(1, "right"),
      };
      rightIdx.current--;

      const curDataArr = fetchedDataCache.current[0].dataCache;

      createViewElement(
        createTrackState(1, "right"),
        curDataArr,
        rightIdx.current + 1
      );
    } else {
      let visRegion;
      if ("genome" in trackData![`${id}`].metadata) {
        visRegion =
          trackData!.trackState.genomicFetchCoord[
            `${trackData![`${id}`].metadata.genome}`
          ].queryRegion;
      } else {
        visRegion = primaryVisData.visRegion;
      }
      let newTrackState = {
        initial: 0,
        side: trackData!.trackState.side,
        xDist: trackData!.trackState.xDist,
        visRegion: visRegion,
        startWindow: primaryVisData.viewWindow.start,
        visWidth: primaryVisData.visWidth,
      };

      if (trackData!.trackState.side === "right") {
        newTrackState["index"] = rightIdx.current;
        fetchedDataCache.current[rightIdx.current] = {
          dataCache:
            trackData![`${id}`].metadata["track type"] === "genomealign"
              ? trackData![`${id}`].result[0]
              : trackData![`${id}`].result,
          trackState: newTrackState,
        };

        rightIdx.current--;

        createViewElement(
          newTrackState,
          fetchedDataCache.current[rightIdx.current + 1].dataCache,

          rightIdx.current + 1
        );
      } else if (trackData!.trackState.side === "left") {
        trackData!.trackState["index"] = leftIdx.current;
        fetchedDataCache.current[leftIdx.current] = {
          dataCache:
            trackData![`${id}`].metadata["track type"] === "genomealign"
              ? trackData![`${id}`].result[0]
              : trackData![`${id}`].result,
          trackState: newTrackState,
        };

        leftIdx.current++;

        createViewElement(
          newTrackState,
          fetchedDataCache.current[leftIdx.current - 1].dataCache,

          leftIdx.current - 1
        );
      }
    }
  } else {
    //_________________________________________________________________________________________________________________________________________________
    const primaryVisData =
      trackData!.trackState.genomicFetchCoord[
        `${trackData!.trackState.primaryGenName}`
      ];

    if (trackData!.initial === 1) {
      const visRegionArr = primaryVisData.initNavLoci.map(
        (item) =>
          new DisplayedRegionModel(genome.navContext, item.start, item.end)
      );
      let trackState0 = {
        initial: 0,
        side: "left",
        xDist: 0,
        regionNavCoord: visRegionArr[0],
        index: 1,
        startWindow: primaryVisData.primaryVisData.viewWindow.start,
        visWidth: primaryVisData.primaryVisData.visWidth,
      };
      let trackState1 = {
        initial: 1,
        side: "right",
        xDist: 0,
        regionNavCoord: visRegionArr[1],
        index: 0,
        startWindow: primaryVisData.primaryVisData.viewWindow.start,
        visWidth: primaryVisData.primaryVisData.visWidth,
      };

      let trackState2 = {
        initial: 0,
        side: "right",
        xDist: 0,
        regionNavCoord: visRegionArr[2],
        index: -1,
        startWindow: primaryVisData.primaryVisData.viewWindow.start,
        visWidth: primaryVisData.primaryVisData.visWidth,
      };

      fetchedDataCache.current[leftIdx.current] = {
        dataCache:
          trackModel !== "" && trackModel.type === "matplot"
            ? trackData![`${id}`].result.map((item, index) => {
                return item[0];
              })
            : trackData![`${id}`].result[0],
        trackState: trackState0,
      };
      leftIdx.current++;

      fetchedDataCache.current[rightIdx.current] = {
        dataCache:
          trackModel !== "" && trackModel.type === "matplot"
            ? trackData![`${id}`].result.map((item, index) => {
                return item[1];
              })
            : trackData![`${id}`].result[1],
        trackState: trackState1,
      };
      rightIdx.current--;
      fetchedDataCache.current[rightIdx.current] = {
        dataCache:
          trackModel !== "" && trackModel.type === "matplot"
            ? trackData![`${id}`].result.map((item, index) => {
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
      if (trackModel.type === "matplot") {
        viewData = getDeDupeArrMatPlot(testData);
      } else {
        let dataCacheArray = testData.map((item) => item.dataCache).flat(1);
        viewData =
          keyDupe !== "none"
            ? removeDuplicates(dataCacheArray, keyDupe)
            : removeDuplicatesWithoutId(dataCacheArray);
      }

      createViewElement(
        trackState1,
        viewData,

        rightIdx.current + 2
      );
    } else {
      let testData: Array<any> = [];
      let newTrackState = {
        ...trackData!.trackState,
        startWindow: primaryVisData.primaryVisData.viewWindow.start,
        visWidth: primaryVisData.primaryVisData.visWidth,
      };
      if (trackData!.trackState.side === "right") {
        trackData!.trackState["index"] = rightIdx.current;
        fetchedDataCache.current[rightIdx.current] = {
          dataCache: trackData![`${id}`].result,
          trackState: newTrackState,
        };
        let currIdx = rightIdx.current + 2;
        for (let i = 0; i < 3; i++) {
          testData.push(fetchedDataCache.current[currIdx]);
          currIdx--;
        }

        let viewData;
        if (trackModel.type === "matplot") {
          viewData = getDeDupeArrMatPlot(testData);
        } else {
          let dataCacheArray = testData.map((item) => item.dataCache).flat(1);
          viewData =
            keyDupe !== "none"
              ? removeDuplicates(dataCacheArray, keyDupe)
              : removeDuplicatesWithoutId(dataCacheArray);
        }
        rightIdx.current--;

        createViewElement(
          fetchedDataCache.current[rightIdx.current + 2].trackState,
          viewData,

          rightIdx.current + 2
        );
      } else if (trackData!.trackState.side === "left") {
        trackData!.trackState["index"] = leftIdx.current;
        fetchedDataCache.current[leftIdx.current] = {
          dataCache: trackData![`${id}`].result,
          trackState: newTrackState,
        };

        let currIdx = leftIdx.current;
        for (let i = 0; i < 3; i++) {
          testData.push(fetchedDataCache.current[currIdx]);
          currIdx--;
        }

        let viewData;
        if (trackModel.type === "matplot") {
          viewData = getDeDupeArrMatPlot(testData);
        } else {
          let dataCacheArray = testData.map((item) => item.dataCache).flat(1);
          viewData =
            keyDupe !== "none"
              ? removeDuplicates(dataCacheArray, keyDupe)
              : removeDuplicatesWithoutId(dataCacheArray);
        }

        leftIdx.current++;

        createViewElement(
          fetchedDataCache.current[leftIdx.current - 2].trackState,
          viewData,

          leftIdx.current - 2
        );
      }
    }
  }
}
