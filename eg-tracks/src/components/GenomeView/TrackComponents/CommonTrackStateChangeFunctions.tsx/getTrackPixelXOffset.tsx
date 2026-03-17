export function getTrackXOffset(
  trackState: { [key: string]: any },
  windowWidth: number,
) {
  let resXPos;
  console.log(trackState);
  if (trackState.initial === 1) {
    resXPos = -trackState.visData.viewWindow.start;
  } else if (trackState.side === "right") {
    resXPos =
      Math.floor(-trackState.xDist / windowWidth) *
        trackState.visData.viewWindow.start -
      trackState.visData.viewWindow.start;
  } else if (trackState.side === "left") {
    resXPos =
      Math.floor(trackState.xDist / windowWidth) *
        trackState.visData.viewWindow.start -
      trackState.visData.viewWindow.start;
  }

  return resXPos;
}
