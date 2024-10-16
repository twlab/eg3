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
