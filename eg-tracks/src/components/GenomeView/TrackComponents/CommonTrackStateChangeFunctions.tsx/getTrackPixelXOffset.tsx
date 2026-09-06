export function getTrackXOffset(
  trackState: { [key: string]: any },
  windowWidth: number,
) {
  // The track container is translateX(xPos) inside a wrapper translated by
  // dragX, so for the strip position viewWindow.start to sit at viewport 0:
  //
  //     dragX + xPos = -(stripInset + s)        s = sub-window offset
  //
  // On the right side dragX = -(n*w + s), which gives xPos = n*w - stripInset,
  // and n is just this region's own window index: n = -dataIdx. Working the
  // left side through the same way lands on -dataIdx*w - stripInset as well, so
  // both directions - and the initial case, where dataIdx is 0 - are one
  // expression.
  //
  // This used to quantise trackState.xDist instead. xDist is captured when
  // createRegionTrackState runs, not at the current position, so
  // Math.floor(-xDist / step) * step produced a stale window index: the track
  // painted in the wrong place on a region's first load and only came right
  // once scrolling routed it through TrackFactory's viewWindowConfigChange
  // path, which places it a different way. Reading dataIdx directly cannot go
  // stale. The step was also visData.viewWindow.start - a gap-inflated strip
  // measurement standing in for a screen-space window width, which drifted
  // further the more windows were panned.
  const stripInset =
    trackState?.genomicFetchCoord?.[trackState.primaryGenName]?.primaryVisData
      ?.viewWindow?.start ?? 0;
  const regionIdx = Number.isFinite(trackState?.dataIdx)
    ? trackState.dataIdx
    : 0;

  return -regionIdx * windowWidth - stripInset;
}
