import { getDeDupeArrMatPlot, trackUsingExpandedLoci } from "./cacheTrackData";
interface GetCacheDataParams {
  rightIdx: number;
  leftIdx: number;
  dataIdx: number;
  displayCache?: any;
  fetchedDataCache: any;
  displayType?: string;
  displaySetter?: any;
  svgHeight?: { current: number };
  xPos: { current: number };
  updatedLegend: { current: any };
  trackModel: any;
  createSVGOrCanvas: (
    trackState: any,
    viewData: any[],
    isError: boolean,
    dataIdx: number,
    signal: any
  ) => void;
  side: string;
  updateSide: { current: string };
  usePrimaryNav: boolean;
  signal?: any;
  isError?: boolean;
}

export function getCacheData({
  rightIdx,
  leftIdx,
  dataIdx,
  displayCache,
  fetchedDataCache,
  displayType,
  displaySetter,
  svgHeight,
  xPos,
  updatedLegend,
  trackModel,
  createSVGOrCanvas,
  side,
  updateSide,
  usePrimaryNav,
  signal,
  isError,
}: GetCacheDataParams) {
  let dataValid = false;
  if (trackModel.type in trackUsingExpandedLoci || !usePrimaryNav) {
    if (dataIdx! > rightIdx && dataIdx! <= 0) {
      dataValid = true;
    } else if (dataIdx! < leftIdx && dataIdx! > 0) {
      dataValid = true;
    }
  } else {
    if (
      (dataIdx! > rightIdx + 1 && dataIdx! <= 0) ||
      (dataIdx! < leftIdx - 1 && dataIdx! > 0)
    ) {
      dataValid = true;
    }
  }

  if (
    trackModel.type in
    {
      bigwig: "",
      hic: "",
      biginteract: "",
      longrange: "",
      modbed: "",
      dynamichic: "",
      dynamiclongrange: "",
      dynseq: "",
      bedgraph: "",
    }
  ) {
    displayType = "density";
  }

  if (dataValid) {
    // take too much memory to save displaycache also
    // if (displayCache && dataIdx! in displayCache[`${displayType}`]) {
    //   updatedLegend.current = (
    //     <TrackLegend
    //       height={displayCache[`${displayType}`][dataIdx!].height}
    //       trackModel={trackModel}
    //     />
    //   );

    //   xPos.current = displayCache[`${displayType}`][dataIdx!].xPos;
    //   updateSide.current = side;
    //   if (displayType === "full") {
    //     displaySetter.full.setComponents({
    //       ...displayCache[`${displayType}`][dataIdx!].svgDATA,
    //     });
    //     if (trackModel.type === "genomealign") {
    //       // handle specific logic for genomealign type if needed
    //     }
    //     svgHeight!.current = displayCache[`${displayType}`][dataIdx!].height;
    //   } else {
    //     displaySetter.density.setComponents(
    //       displayCache[`${displayType}`][dataIdx!].canvasData
    //     );
    //   }
    // } else {
    let viewData: any[] = [];

    if (trackModel.type in trackUsingExpandedLoci) {
      // CHANGE LEFT NOT SUBTRACT BY 1 ANYMORE
      if (dataIdx! > rightIdx && dataIdx! <= 0) {
        viewData = fetchedDataCache[dataIdx!].dataCache;
      } else if (dataIdx! < leftIdx && dataIdx! > 0) {
        viewData = fetchedDataCache[dataIdx!].dataCache;
      }
    } else {
      if (
        (dataIdx! > rightIdx + 1 && dataIdx! <= 0) ||
        (dataIdx! < leftIdx - 1 && dataIdx! > 0)
      ) {
        viewData = [
          fetchedDataCache[dataIdx! + 1],
          fetchedDataCache[dataIdx!],
          fetchedDataCache[dataIdx! - 1],
        ];

        if (trackModel.type in { matplot: "", dynamic: "", dynamicbed: "" }) {
          viewData = getDeDupeArrMatPlot(viewData);
        } else {
          viewData = viewData.map((item) => item.dataCache).flat(1);
        }
      }
    }

    let newIntanceTrackState = { ...fetchedDataCache[dataIdx!].trackState };
    newIntanceTrackState["recreate"] = true;
    createSVGOrCanvas(
      newIntanceTrackState,
      viewData,
      isError!,
      dataIdx,
      signal
    );
  }
  // }
}
