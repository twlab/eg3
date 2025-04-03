export function getTrackXOffset(
  trackState: { [key: string]: any },
  windowWidth: number
) {
  let resXPos;

  if (trackState.initial === 1) {
    resXPos = -trackState.startWindow;
  } else if (trackState.side === "right") {
    resXPos =
      ((Math.floor(-trackState.xDist / windowWidth)) * windowWidth) -

      trackState.startWindow;
  } else if (trackState.side === "left") {
    resXPos =
      ((Math.floor(trackState.xDist / windowWidth)) * windowWidth) -
      trackState.startWindow;
  }
  return resXPos;
}
