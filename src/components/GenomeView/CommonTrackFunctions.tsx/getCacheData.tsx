import { removeDuplicates } from "../commonComponents/check-obj-dupe";
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
  trackModel
) {
  let dataValid = false;
  if (useFineOrSecondaryParentNav) {
    // CHANGE LEFT  NOT SUBTREACT BY 1 ANMORE
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
  if (!dataValid) {
    return { dataValid };
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
      return { dataValid, buildNew: false };
    } else {
      let viewData: Array<any> = [];

      if (useFineOrSecondaryParentNav) {
        // CHANGE LEFT  NOT SUBTREACT BY 1 ANMORE
        if (dataIdx! > rightIdx && dataIdx! <= 0) {
          viewData = fetchedDataCache[dataIdx!].refGenes;
        } else if (dataIdx! < leftIdx && dataIdx! > 0) {
          viewData = fetchedDataCache[dataIdx!].refGenes;
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
          let refGenesArray = viewData.map((item) => item.refGenes).flat(1);
          viewData = removeDuplicates(refGenesArray, "id");
        }
      }

      return {
        dataValid,
        buildNew: true,
        data: {
          trackState: fetchedDataCache[dataIdx!].trackState,
          viewData,

          dataIdx,
        },
      };
    }
  }
}
