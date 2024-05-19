//src/Worker/worker.ts

const workerFunction = function () {
  self.onmessage = (event: MessageEvent) => {
    function findFeatureInPixel(
      data: any,
      windowWidth: number,
      startRegionBp: number,
      bpToPx
    ) {
      let xToFeatures: Array<Array<any>> = [];

      const newArr: Array<any> = Array.from(
        { length: Number(windowWidth * 2) },
        () => []
      );
      xToFeatures.push(newArr);

      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          let singleStrand = data[i][j];

          if (Object.keys(singleStrand).length > 0) {
            let xSpanStart = (singleStrand.start - startRegionBp) / bpToPx!;
            let xSpanEnd = (singleStrand.end - startRegionBp) / bpToPx!;
            const startX = Math.max(0, Math.floor(xSpanStart));
            const endX = Math.min(windowWidth * 2 - 1, Math.ceil(xSpanEnd));

            for (let x = startX; x <= endX; x++) {
              xToFeatures[i][x].push(singleStrand);
            }
          }
        }
      }

      return xToFeatures;
    }
    function avgHeightFeature(data: any) {
      let max = 0;
      let min = 0;

      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          let sum = 0;

          for (let x = 0; x < data[i][j].length; x++) {
            sum += data[i][j][x].score;
          }
          let avgPos = 0;
          if (data[i][j].length > 0) {
            avgPos = sum / data[i][j].length;
          }

          if (avgPos > max) {
            max = avgPos;
          }
          if (avgPos < min) {
            min = avgPos;
          }
          data[i][j] = avgPos;
        }
      }
    }

    let trackData = event.data;
    let dataForward: Array<any> = [];
    let dataReverse: Array<any> = [];

    const newArr: Array<any> = [];
    dataForward.push(newArr);
    const newArr2: Array<any> = [];
    dataReverse.push(newArr2);

    let lastIdx = trackData.trackGene.length - 1;

    let startRegionBp = trackData.trackGene[lastIdx][1];

    for (let j = 0; j < trackData.trackGene[lastIdx][0].length; j++) {
      let singleStrand = trackData.trackGene[lastIdx][0][j];
      if (singleStrand.score < 0) {
        dataReverse[0].push(singleStrand);
      } else {
        dataForward[0].push(singleStrand);
      }
    }

    let featureForward = findFeatureInPixel(
      dataForward,
      trackData.windowWidth,
      startRegionBp,
      trackData.bpToPx
    );

    let featureReverse = findFeatureInPixel(
      dataReverse,
      trackData.windowWidth,
      startRegionBp,
      trackData.bpToPx
    );

    avgHeightFeature(featureForward);
    avgHeightFeature(featureReverse);

    let newResult: Array<any> = [];

    newResult.push(featureForward);
    newResult.push(featureReverse);

    postMessage(newResult);
  };
};

//This stringifies the whole function
let codeToString = workerFunction.toString();
//This brings out the code in the bracket in string
let mainCode = codeToString.substring(
  codeToString.indexOf('{') + 1,
  codeToString.lastIndexOf('}')
);
//convert the code into a raw data
let blob = new Blob([mainCode], { type: 'application/javascript' });
//A url is made out of the blob object and we're good to go
let worker_script = URL.createObjectURL(blob);

export default worker_script;
