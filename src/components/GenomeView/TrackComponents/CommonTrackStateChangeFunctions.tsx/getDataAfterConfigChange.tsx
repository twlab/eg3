import {
  removeDuplicates,
  removeDuplicatesWithoutId,
} from "../commonComponents/check-obj-dupe";

export function getConfigChangeData(
  useFineOrSecondaryParentNav,
  fetchedDataCache,
  dataIdx,
  createViewElement,
  keyDupe
) {
  //unlike getting cached data for the SVG that was created for eg2, the return svgDATA is not a react component but instead an SVG
  // so when props change like how the density component are created it doesn't trigger a rebuild, only when it gets taken out of view,
  // and back into view is when the svg rebuilds and have the correct configOptions. So here we cant use react.clone like
  // in density component but to recreate the component again, and the saved components will automacally changed when ot scroll into
  // view and get rebuilt again.
  let viewData;
  if (useFineOrSecondaryParentNav) {
    viewData = fetchedDataCache[dataIdx!].dataCache;
  } else {
    viewData = [
      fetchedDataCache[dataIdx! + 1],
      fetchedDataCache[dataIdx!],
      fetchedDataCache[dataIdx! - 1],
    ];

    let dataCacheArray = viewData.map((item) => item.dataCache).flat(1);
    viewData =
      keyDupe !== "none"
        ? removeDuplicates(dataCacheArray, keyDupe)
        : removeDuplicatesWithoutId(dataCacheArray);
  }

  createViewElement(
    fetchedDataCache[dataIdx!].trackState,
    viewData,

    dataIdx
  );
}
