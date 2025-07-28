import { dynamicMatplotTracks } from "../displayModeComponentMap";
import { getDeDupeArrMatPlot } from "./cacheFetchedData";
import { trackUsingExpandedLoci } from "./cacheFetchedData";

interface GetConfigChangeDataParams {
  fetchedDataCache: any;
  dataIdx: number;
  createSVGOrCanvas: (
    trackState: any,
    viewData: any[],
    isError: boolean,
    trackIndex: number,
    xvalues: any
  ) => void;
  trackType: string;
  usePrimaryNav: boolean;
  signal?: any;
  trackState: any;
}

export function getConfigChangeData({
  fetchedDataCache,
  dataIdx,
  trackState,
  createSVGOrCanvas,
  trackType,
  usePrimaryNav,
}: GetConfigChangeDataParams) {
  // unlike getting cached data for the SVG that was created for eg2, the return svgDATA is not a react component but instead an SVG
  // so when props change like how the density component are created it doesn't trigger a rebuild, only when it gets taken out of view,
  // and back into view is when the svg rebuilds and have the correct configOptions. So here we cant use react.clone like
  // in density component but to recreate the component again, and the saved components will automatically change when it scrolls into
  // view and get rebuilt again.

  let viewData;
  let newIntanceTrackState = trackState;
  if (trackType in trackUsingExpandedLoci || !usePrimaryNav) {
    viewData = fetchedDataCache[dataIdx!].dataCache;
  } else {
    viewData = [
      fetchedDataCache[dataIdx! + 1],
      fetchedDataCache[dataIdx!],
      fetchedDataCache[dataIdx! - 1],
    ];

    if (dynamicMatplotTracks.has(trackType)) {
      viewData = getDeDupeArrMatPlot(viewData, false);
    } else {
      viewData = viewData.map((item) => item.dataCache).flat(1);
    }
  }

  newIntanceTrackState["recreate"] = true;
  createSVGOrCanvas(
    newIntanceTrackState,
    viewData,
    newIntanceTrackState.isError,
    dataIdx,
    fetchedDataCache[dataIdx].xvalues
  );
}
