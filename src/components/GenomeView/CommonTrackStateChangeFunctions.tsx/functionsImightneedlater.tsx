// function checkCacheData() {
//   // if (
//   //   useFineModeNav ||
//   //   genomeArr![genomeIdx!].genome._name !== parentGenome.current
//   // ) {
//   // CHANGE LEFT  NOT SUBTREACT BY 1 ANMORE
//   let dataValid = false;

//   if (useFineOrSecondaryParentNav.current) {
//     // CHANGE LEFT  NOT SUBTREACT BY 1 ANMORE
//     if (dataIdx! > rightIdx.current && dataIdx! <= 0) {
//       dataValid = true;
//     } else if (dataIdx! < leftIdx.current && dataIdx! > 0) {
//       dataValid = true;
//     }
//   } else {
//     if (
//       (dataIdx! > rightIdx.current + 1 && dataIdx! <= 0) ||
//       (dataIdx! < leftIdx.current - 1 && dataIdx! > 0)
//     ) {
//       dataValid = true;
//     }
//   }

//   if (dataValid) {
//     if (
//       dataIdx! in displayCache.current[`${configOptions.current.displayMode}`]
//     ) {
//       let displayType = `${configOptions.current.displayMode}`;

//       updatedLegend.current = (
//         <TrackLegend
//           height={displayCache.current[`${displayType}`][dataIdx!].height}
//           trackModel={trackModel}
//         />
//       );
//       xPos.current = displayCache.current[`${displayType}`][dataIdx!].xPos;
//       updateSide.current = side;
//       if (displayType === "full") {
//         setSvgComponents(
//           displayCache.current[`${displayType}`][dataIdx!].svgDATA
//         );

//         svgHeight.current =
//           displayCache.current[`${displayType}`][dataIdx!].height;
//       } else {
//         console.log(
//           displayCache.current[`${displayType}`][dataIdx!].height,
//           "HERERERERER"
//         );
//         setCanvasComponents(
//           displayCache.current[`${displayType}`][dataIdx!].canvasData
//         );
//       }
//     } else {
//       let viewData: Array<any> = [];

//       if (useFineOrSecondaryParentNav.current) {
//         // CHANGE LEFT  NOT SUBTREACT BY 1 ANMORE
//         if (dataIdx! > rightIdx.current && dataIdx! <= 0) {
//           viewData = fetchedDataCache.current[dataIdx!].refGenes;
//         } else if (dataIdx! < leftIdx.current && dataIdx! > 0) {
//           viewData = fetchedDataCache.current[dataIdx!].refGenes;
//         }
//       } else {
//         if (
//           (dataIdx! > rightIdx.current + 1 && dataIdx! <= 0) ||
//           (dataIdx! < leftIdx.current - 1 && dataIdx! > 0)
//         ) {
//           viewData = [
//             fetchedDataCache.current[dataIdx! + 1],
//             fetchedDataCache.current[dataIdx!],
//             fetchedDataCache.current[dataIdx! - 1],
//           ];
//           let refGenesArray = viewData.map((item) => item.refGenes).flat(1);
//           viewData = removeDuplicates(refGenesArray, "id");
//         }
//       }
//       if (viewData.length > 0) {
//         createSVGOrCanvas(
//           fetchedDataCache.current[dataIdx!].trackState,
//           viewData,

//           dataIdx!
//         );
//       }
//     }
//   }
// }

// if (curTrackData.initial === 1 || curTrackData.index === 1) {
//   xPos.current = fine ? -curTrackData.startWindow : -windowWidth;
// } else if (curTrackData.side === "right") {
//   xPos.current = fine
//     ? (Math.floor(-curTrackData.xDist / windowWidth) - 1) * windowWidth -
//       windowWidth +
//       curTrackData.startWindow
//     : Math.floor(-curTrackData.xDist / windowWidth) * windowWidth;
// } else if (curTrackData.side === "left") {
//   xPos.current = fine
//     ? (Math.floor(curTrackData.xDist / windowWidth) - 1) * windowWidth -
//       windowWidth +
//       curTrackData.startWindow
//     : Math.floor(curTrackData.xDist / windowWidth) * windowWidth;
// }

//   const primaryVisData =
//     trackData!.trackState.genomicFetchCoord[
//       trackData!.trackState.primaryGenName
//     ].primaryVisData;

//   if (trackData!.trackState.initial === 1) {
//     let visRegion =
//       "genome" in trackData![`${id}`].metadata
//         ? trackData!.trackState.genomicFetchCoord[
//             trackData![`${id}`].metadata.genome
//           ].queryRegion
//         : primaryVisData.visRegion;

//     const createTrackState = (index: number, side: string) => ({
//       initial: index === 1 ? 1 : 0,
//       side,
//       xDist: 0,

//       visRegion: visRegion,
//       startWindow: primaryVisData.viewWindow.start,
//       visWidth: primaryVisData.visWidth,
//     });

//     fetchedDataCache.current[rightIdx.current] = {
//       refGenes: trackData![`${id}`].result[0],
//       trackState: createTrackState(1, "right"),
//     };
//     rightIdx.current--;

//     const curDataArr = fetchedDataCache.current[0].refGenes;

//     createSVGOrCanvas(
//       createTrackState(1, "right"),
//       curDataArr,
//       rightIdx.current + 1
//     );
//   } else {
//     let visRegion;
//     if ("genome" in trackData![`${id}`].metadata) {
//       visRegion =
//         trackData!.trackState.genomicFetchCoord[
//           `${trackData![`${id}`].metadata.genome}`
//         ].queryRegion;
//     } else {
//       visRegion = primaryVisData.visRegion;
//     }
//     let newTrackState = {
//       initial: 0,
//       side: trackData!.trackState.side,
//       xDist: trackData!.trackState.xDist,
//       visRegion: visRegion,
//       startWindow: primaryVisData.viewWindow.start,
//       visWidth: primaryVisData.visWidth,
//     };

//     if (trackData!.trackState.side === "right") {
//       newTrackState["index"] = rightIdx.current;
//       fetchedDataCache.current[rightIdx.current] = {
//         refGenes: trackData![`${id}`].result,
//         trackState: newTrackState,
//       };

//       rightIdx.current--;

//       createSVGOrCanvas(
//         newTrackState,
//         fetchedDataCache.current[rightIdx.current + 1].refGenes,

//         rightIdx.current + 1
//       );
//     } else if (trackData!.trackState.side === "left") {
//       trackData!.trackState["index"] = leftIdx.current;
//       fetchedDataCache.current[leftIdx.current] = {
//         refGenes: trackData![`${id}`].result,
//         trackState: newTrackState,
//       };

//       leftIdx.current++;

//       createSVGOrCanvas(
//         newTrackState,
//         fetchedDataCache.current[leftIdx.current - 1].refGenes,

//         leftIdx.current - 1
//       );
//     }
//   }
// } else {
//   //_________________________________________________________________________________________________________________________________________________
//   const primaryVisData =
//     trackData!.trackState.genomicFetchCoord[
//       `${trackData!.trackState.primaryGenName}`
//     ];

//   if (trackData!.initial === 1) {
//     const visRegionArr = primaryVisData.initNavLoci.map(
//       (item) =>
//         new DisplayedRegionModel(
//           genomeArr![genomeIdx!].navContext,
//           item.start,
//           item.end
//         )
//     );
//     let trackState0 = {
//       initial: 0,
//       side: "left",
//       xDist: 0,
//       regionNavCoord: visRegionArr[0],
//       index: 1,
//       startWindow: primaryVisData.primaryVisData.viewWindow.start,
//       visWidth: primaryVisData.primaryVisData.visWidth,
//     };
//     let trackState1 = {
//       initial: 1,
//       side: "right",
//       xDist: 0,
//       regionNavCoord: visRegionArr[1],
//       index: 0,
//       startWindow: primaryVisData.primaryVisData.viewWindow.start,
//       visWidth: primaryVisData.primaryVisData.visWidth,
//     };
//     let trackState2 = {
//       initial: 0,
//       side: "right",
//       xDist: 0,
//       regionNavCoord: visRegionArr[2],
//       index: -1,
//       startWindow: primaryVisData.primaryVisData.viewWindow.start,
//       visWidth: primaryVisData.primaryVisData.visWidth,
//     };

//     fetchedDataCache.current[leftIdx.current] = {
//       refGenes: trackData![`${id}`].result[0],
//       trackState: trackState0,
//     };
//     leftIdx.current++;

//     fetchedDataCache.current[rightIdx.current] = {
//       refGenes: trackData![`${id}`].result[1],
//       trackState: trackState1,
//     };
//     rightIdx.current--;
//     fetchedDataCache.current[rightIdx.current] = {
//       refGenes: trackData![`${id}`].result[2],
//       trackState: trackState2,
//     };
//     rightIdx.current--;

//     let testData = [
//       fetchedDataCache.current[1],
//       fetchedDataCache.current[0],
//       fetchedDataCache.current[-1],
//     ];

//     let refGenesArray = testData.map((item) => item.refGenes).flat(1);

//     let deDupRefGenesArr = removeDuplicates(refGenesArray, "id");

//     createSVGOrCanvas(
//       trackState1,
//       deDupRefGenesArr,

//       rightIdx.current + 2
//     );
//   } else {
//     let testData: Array<any> = [];
//     let newTrackState = {
//       ...trackData!.trackState,
//       startWindow: primaryVisData.primaryVisData.viewWindow.start,
//       visWidth: primaryVisData.primaryVisData.visWidth,
//     };
//     if (trackData!.trackState.side === "right") {
//       trackData!.trackState["index"] = rightIdx.current;
//       fetchedDataCache.current[rightIdx.current] = {
//         refGenes: trackData![`${id}`].result,
//         trackState: newTrackState,
//       };
//       let currIdx = rightIdx.current + 2;
//       for (let i = 0; i < 3; i++) {
//         testData.push(fetchedDataCache.current[currIdx]);
//         currIdx--;
//       }

//       let refGenesArray = testData.map((item) => item.refGenes).flat(1);
//       let deDupRefGenesArr = removeDuplicates(refGenesArray, "id");

//       rightIdx.current--;

//       createSVGOrCanvas(
//         fetchedDataCache.current[rightIdx.current + 2].trackState,
//         deDupRefGenesArr,

//         rightIdx.current + 2
//       );
//     } else if (trackData!.trackState.side === "left") {
//       trackData!.trackState["index"] = leftIdx.current;
//       fetchedDataCache.current[leftIdx.current] = {
//         refGenes: trackData![`${id}`].result,
//         trackState: newTrackState,
//       };

//       let currIdx = leftIdx.current;
//       for (let i = 0; i < 3; i++) {
//         testData.push(fetchedDataCache.current[currIdx]);
//         currIdx--;
//       }

//       let refGenesArray = testData.map((item) => item.refGenes).flat(1);
//       let deDupRefGenesArr = removeDuplicates(refGenesArray, "id");

//       leftIdx.current++;

//       createSVGOrCanvas(
//         fetchedDataCache.current[leftIdx.current - 2].trackState,
//         deDupRefGenesArr,

//         leftIdx.current - 2
//       );
//     }
//   }
