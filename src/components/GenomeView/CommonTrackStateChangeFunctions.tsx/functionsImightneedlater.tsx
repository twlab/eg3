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

//  useEffect(() => {
//    if (Math.floor(prevSize.current) !== Math.floor(size.width)) {
//      if (stateChangeCount.current === 0) {
//        // second state change we set genomeList with the new size width, or if there a session data we can set it here, or if theres no data from homepage or session can set empty track, or link back to homepagea

//        // FOR TESTTING________________________________________________________________________________________
//        let curGenome = getGenomeConfig("hg38");
//        curGenome["genomeID"] = uuidv4();
//        curGenome["windowWidth"] = size.width;
//        setGenomeList(new Array<any>(curGenome));

//        curNavRegion.current.start = curGenome.defaultRegion.start;
//        curNavRegion.current.end = curGenome.defaultRegion.end;
//        // uncomment this when we are done
//        // getSelectedGenome(size.width);
//      } else if (stateChangeCount.current > 0) {
//        // every state change after 1 will be resizing, need to get navCoord from trackmanager and set it with new genome object and new key to sent

//        //______ for test
//        // let chrObj = {};
//        // for (const chromosome of ChromosomeData["HG38"]) {
//        //   chrObj[chromosome.getName()] = chromosome.getLength();
//        // }

//        // let featureArray = makeNavContext("HG38");

//        // let testGen: any = {
//        //   name: "hg38",
//        //   species: "human",
//        //   id: uuidv4(),
//        //   windowWidth: size.width,
//        //   visData: "",
//        //   // testing mutiple chr 'chr7:150924404-152924404'

//        //   //chr7:27053397-27373765
//        //   // chr7:10000-20000
//        //   //testing finemode  27213325-27213837
//        //   //chr7:159159564-chr8:224090
//        //   featureArray,
//        //   defaultRegion: "chr7:27053397-27373765",
//        //   chrOrder: items,
//        //   chromosomes: chrObj,
//        //   size: false,
//        //   defaultTracks: [
//        //     new TrackModel({
//        //       type: "geneAnnotation",
//        //       name: "refGene",
//        //       genome: "hg38",
//        //     }),
//        //     // {
//        //     //   name: "bed",
//        //     //   genome: "hg19",
//        //     //   url: "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz",
//        //     // },

//        //     {
//        //       name: "bigWig",
//        //       genome: "hg19",
//        //       url: "https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig",
//        //     },

//        //     {
//        //       name: "dynseq",
//        //       genome: "hg19",
//        //       url: "https://target.wustl.edu/dli/tmp/deeplift.example.bw",
//        //     },
//        //     {
//        //       name: "methylc",
//        //       genome: "hg19",
//        //       url: "https://vizhub.wustl.edu/public/hg19/methylc2/h1.liftedtohg19.gz",
//        //     },
//        //     {
//        //       name: "hic",
//        //       url: "https://epgg-test.wustl.edu/dli/long-range-test/test.hic",
//        //       genome: "hg19",
//        //     },
//        //     {
//        //       name: "hic",
//        //       url: "https://epgg-test.wustl.edu/dli/long-range-test/test.hic",
//        //       genome: "hg19",
//        //     },
//        //     {
//        //       name: "genomealign",
//        //       genome: "hg38",
//        //       url: "https://vizhub.wustl.edu/public/hg38/weaver/hg38_mm10_axt.gz",
//        //       trackModel: {
//        //         name: "hg38tomm10",
//        //         label: "Query mouse mm10 to hg38 blastz",
//        //         querygenome: "mm10",
//        //         filetype: "genomealign",
//        //         url: "https://vizhub.wustl.edu/public/hg38/weaver/hg38_mm10_axt.gz",
//        //       },
//        //     },
//        //   ],
//        //   annotationTrackData: AnnotationTrackData["HG19"],
//        //   publicHubData: PublicHubAllData["HG19"]["publicHubData"],
//        //   publicHubList: PublicHubAllData["HG19"]["publicHubList"],
//        //   twoBitURL: TwoBitUrlData["HG19"],
//        // };

//        //   let tempGenomeArr = new Array<any>(testGen);

//        //   setGenomeList([...tempGenomeArr]);
//        let curGenome = getGenomeConfig("hg38");
//        curGenome["genomeID"] = uuidv4();
//        curGenome["windowWidth"] = size.width;
//        curGenome["defaultRegion"] = new OpenInterval(
//          Math.round(curNavRegion.current.start),
//          Math.round(curNavRegion.current.end)
//        );

//        setGenomeList(new Array<any>(curGenome));
//      }

//      stateChangeCount.current++;

//      // if(props.selectedGenome.length === 0)
//      // const storedArray = sessionStorage.getItem("myArray");
//      // const chrOrderStorage = sessionStorage.getItem("chrOrder");
//      // if (storedArray !== null) {
//      //   const parsedArray = JSON.parse(storedArray);
//      //   if (chrOrderStorage !== null) {
//      //     setItems([...JSON.parse(chrOrderStorage)]);
//      //     parsedArray.chrOrder = [...JSON.parse(chrOrderStorage)];
//      //   }
//      //   setGenomeList(new Array<any>(parsedArray));
//      // } else

//      //  else else {
//      //     initialRender.current = false;
//      //   }
//      //   // }
//      // }
//    }
//    prevSize.current = size.width;
//  }, [size]);
