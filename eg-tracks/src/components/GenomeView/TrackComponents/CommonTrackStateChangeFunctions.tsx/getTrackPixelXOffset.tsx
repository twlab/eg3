export function getTrackXOffset(
  trackState: { [key: string]: any },
  windowWidth: number,
) {
  let resXPos;

  if (trackState.initial === 1) {
    resXPos = -trackState.visData.viewWindow.start;
  } else if (trackState.side === "right") {
    resXPos =
      Math.floor(-trackState.xDist / trackState.visData.viewWindow.start) *
      trackState.visData.viewWindow.start -
      trackState.visData.viewWindow.start;
  } else if (trackState.side === "left") {
    const rawXPos =
      Math.floor(trackState.xDist / trackState.visData.viewWindow.start) *
      trackState.visData.viewWindow.start;
    resXPos = -2 * trackState.visData.viewWindow.start - rawXPos;
  }

  return resXPos;
}
