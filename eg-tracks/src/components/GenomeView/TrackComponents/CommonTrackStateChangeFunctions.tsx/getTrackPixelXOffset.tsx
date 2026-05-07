export function getTrackXOffset(
  trackState: { [key: string]: any },
  windowWidth: number,
  leftSectionSize: any,
  rightSectionSize: any,
  dataIdx: any,
) {
  let resXPos;
  console.log(trackState);
  if (dataIdx === 0) {
    resXPos =
      -trackState.genomicFetchCoord[trackState.primaryGenName].primaryVisData
        .viewWindow.start;
  } else if (trackState.side === "right") {
    let cumulativeOffsetX = 0;
    let rightDataIdx = -dataIdx - 1;
    for (let i = 0; i < rightDataIdx; i++) {
      cumulativeOffsetX += rightSectionSize[i] || 0;
    }
    resXPos = cumulativeOffsetX;
  } else {
    let cumulativeOffsetX = 0;
    let leftDataIdx = dataIdx + 1;
    for (let i = 0; i < leftDataIdx; i++) {
      cumulativeOffsetX += leftSectionSize[i] || 0;
    }
    resXPos = -cumulativeOffsetX;
  }

  // if (trackState.initial === 1) {
  //   resXPos = -trackState.visData.viewWindow.start;
  // } else if (trackState.side === "right") {
  //   resXPos =
  //     Math.floor(-trackState.xDist / trackState.visData.viewWindow.start) *
  //       trackState.visData.viewWindow.start -
  //     trackState.visData.viewWindow.start;
  // } else if (trackState.side === "left") {
  //   const rawXPos =
  //     Math.floor(trackState.xDist / trackState.visData.viewWindow.start) *
  //     trackState.visData.viewWindow.start;
  //   resXPos = -1 * trackState.visData.viewWindow.start - rawXPos;
  // }
  console.log(resXPos);
  return resXPos;
}
