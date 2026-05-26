export function getTrackXOffset(
  trackState: { [key: string]: any },
  windowWidth: number,
) {
  let resXPos;

  if (trackState.initial === 1) {
    resXPos =
      -trackState?.genomicFetchCoord[trackState.primaryGenName]?.primaryVisData
        ?.viewWindow?.start;
  } else if (trackState.side === "right") {
    resXPos =
      Math.floor(-trackState.xDist / trackState.visData.viewWindow.start) *
        trackState.visData.viewWindow.start -
      trackState?.genomicFetchCoord[trackState.primaryGenName]?.primaryVisData
        ?.viewWindow?.start;
  } else if (trackState.side === "left") {
    const rawXPos =
      Math.floor(trackState.xDist / trackState.visData.viewWindow.start) *
        trackState.visData.viewWindow.start +
      trackState.visData.viewWindow.start;
    resXPos =
      -1 *
        trackState?.genomicFetchCoord[trackState.primaryGenName]?.primaryVisData
          ?.viewWindow?.start -
      rawXPos;
  }

  return resXPos;
}
