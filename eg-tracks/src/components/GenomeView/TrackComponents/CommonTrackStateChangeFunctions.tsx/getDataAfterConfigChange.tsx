import { trackUsingExpandedLoci } from "./cacheTrackData";

interface GetConfigChangeDataParams {
  fetchedDataCache: any;
  dataIdx: number;
  createSVGOrCanvas: (
    trackState: any,
    viewData: any[],
    dataIdx: number,
    signal: any
  ) => void;
  trackType: string;
  usePrimaryNav: boolean;
  signal?: any;
}

export function getConfigChangeData({
  fetchedDataCache,
  dataIdx,
  createSVGOrCanvas,
  trackType,
  usePrimaryNav,
  signal,
}: GetConfigChangeDataParams) {
  // unlike getting cached data for the SVG that was created for eg2, the return svgDATA is not a react component but instead an SVG
  // so when props change like how the density component are created it doesn't trigger a rebuild, only when it gets taken out of view,
  // and back into view is when the svg rebuilds and have the correct configOptions. So here we cant use react.clone like
  // in density component but to recreate the component again, and the saved components will automatically change when it scrolls into
  // view and get rebuilt again.

  let viewData;

  if (trackType in trackUsingExpandedLoci || !usePrimaryNav) {
    viewData = fetchedDataCache[dataIdx!].dataCache;
  } else {
    viewData = [
      fetchedDataCache[dataIdx! + 1],
      fetchedDataCache[dataIdx!],
      fetchedDataCache[dataIdx! - 1],
    ];

    viewData = viewData.map((item) => item.dataCache).flat(1);
  }
  let newIntanceTrackState = { ...fetchedDataCache[dataIdx!].trackState };
  newIntanceTrackState["recreate"] = true;
  createSVGOrCanvas(newIntanceTrackState, viewData, dataIdx, signal);
}
