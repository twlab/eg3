//src/Worker/worker.ts

import _ from "lodash";
// this is makeXMap then to placeFeatures from eg 2

self.onmessage = (event: MessageEvent) => {
  function findFeatureInPixel(
    data: any,
    windowWidth: number,
    startRegionBp: number,
    bpToPx
  ) {
    const xToFeatures: Array<any> = Array.from(
      { length: Number(windowWidth * 2) },
      () => []
    );

    for (let j = 0; j < data.length; j++) {
      let singleStrand = data[j];

      if (Object.keys(singleStrand).length > 0) {
        let xSpanStart = (singleStrand.start - startRegionBp) / bpToPx!;
        let xSpanEnd = (singleStrand.end - startRegionBp) / bpToPx!;
        const startX = Math.max(0, Math.floor(xSpanStart));
        const endX = Math.min(windowWidth * 2 - 1, Math.ceil(xSpanEnd));

        for (let x = startX; x <= endX; x++) {
          xToFeatures[x].push(singleStrand);
        }
      }
    }

    return xToFeatures;
  }
  function avgHeightFeature(data: any) {
    let max = 0;
    let min = 0;

    for (let i = 0; i < data.length; i++) {
      let sum = 0;

      for (let j = 0; j < data[i].length; j++) {
        sum += data[i][j].score;
      }
      let avgPos = 0;
      if (data[i].length > 0) {
        avgPos = sum / data[i].length;
      }

      if (avgPos > max) {
        max = avgPos;
      }
      if (avgPos < min) {
        min = avgPos;
      }
      data[i] = avgPos;
    }
  }

  let trackData = event.data;
  let dataForward: Array<any> = [];
  let dataReverse: Array<any> = [];

  for (let j = 0; j < trackData.trackGene.length; j++) {
    let singleStrand = trackData.trackGene[j];

    if (singleStrand.score < 0) {
      dataReverse.push(singleStrand);
    } else {
      dataForward.push(singleStrand);
    }
  }

  let featureForward = findFeatureInPixel(
    dataForward,
    trackData.windowWidth,
    trackData.startBpRegion,
    trackData.bpToPx
  );

  let featureReverse = findFeatureInPixel(
    dataReverse,
    trackData.windowWidth,
    trackData.startBpRegion,
    trackData.bpToPx
  );

  avgHeightFeature(featureForward);
  avgHeightFeature(featureReverse);

  let aggResult = {};
  aggResult["forward"] = featureForward;
  aggResult["reverse"] = featureReverse;

  postMessage(aggResult);
};
