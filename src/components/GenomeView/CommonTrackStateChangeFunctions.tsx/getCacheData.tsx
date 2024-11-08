import {
  removeDuplicates,
  removeDuplicatesWithoutId,
} from "../commonComponents/check-obj-dupe";
import TrackLegend from "../commonComponents/TrackLegend";

export function getCacheData(
  useFineOrSecondaryParentNav,
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
  createViewElement,
  side,
  updateSide,
  keyDupe = "none"
) {
  let dataValid = false;
  if (useFineOrSecondaryParentNav) {
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
    { bigwig: "", hic: "", biginteract: "", longrange: "", modbed: "" }
  ) {
    displayType = "density";
  }
  if (dataValid) {
    if (dataIdx! in displayCache[`${displayType}`]) {
      updatedLegend.current = (
        <TrackLegend
          height={displayCache[`${displayType}`][dataIdx!].height}
          trackModel={trackModel}
        />
      );

      xPos.current = displayCache[`${displayType}`][dataIdx!].xPos;
      updateSide.current = side;
      if (displayType === "full") {
        displaySetter.full.setComponents(
          displayCache[`${displayType}`][dataIdx!].svgDATA
        );
        svgHeight.current = displayCache[`${displayType}`][dataIdx!].height;
      } else {
        displaySetter.density.setComponents(
          displayCache[`${displayType}`][dataIdx!].canvasData
        );
      }
    } else {
      let viewData: Array<any> = [];

      if (useFineOrSecondaryParentNav) {
        // CHANGE LEFT  NOT SUBTREACT BY 1 ANMORE
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
          let dataCacheArray = viewData.map((item) => item.dataCache).flat(1);

          viewData =
            keyDupe !== "none"
              ? removeDuplicates(dataCacheArray, keyDupe)
              : removeDuplicatesWithoutId(dataCacheArray);
        }
      }

      createViewElement(
        fetchedDataCache[dataIdx!].trackState,
        viewData,

        dataIdx
      );
    }
  }
}
