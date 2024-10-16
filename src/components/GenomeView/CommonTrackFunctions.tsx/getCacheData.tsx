export function getTrackXOffset(
  trackState: { [key: string]: any },
  windowWidth: number
) {
  let resXPos;
  console.log(trackState.startWindow, windowWidth);
  if (trackState.initial === 1 || trackState.index === 1) {
    resXPos = -trackState.startWindow;
  } else if (trackState.side === "right") {
    resXPos =
      Math.floor(-trackState.xDist / windowWidth) * windowWidth -
      windowWidth +
      trackState.startWindow;
  } else if (trackState.side === "left") {
    resXPos =
      Math.floor(trackState.xDist / windowWidth) * windowWidth -
      windowWidth +
      trackState.startWindow;
  }
  return resXPos;
}
