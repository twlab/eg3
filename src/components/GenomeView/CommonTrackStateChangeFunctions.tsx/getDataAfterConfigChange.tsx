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
