import { removeDuplicates } from "../commonComponents/check-obj-dupe";

export function getConfigChangeData(
  useFineOrSecondaryParentNav,
  fetchedDataCache,
  dataIdx,
  createViewElement
) {
  let viewData;
  if (useFineOrSecondaryParentNav) {
    viewData = fetchedDataCache[dataIdx!].refGenes;
  } else {
    let viewData = [
      fetchedDataCache[dataIdx! + 1],
      fetchedDataCache[dataIdx!],
      fetchedDataCache[dataIdx! - 1],
    ];

    let refGenesArray = viewData.map((item) => item.refGenes).flat(1);
    viewData = removeDuplicates(refGenesArray, "id");
  }

  createViewElement(
    fetchedDataCache[dataIdx!].trackState,
    viewData,

    dataIdx
  );
}
