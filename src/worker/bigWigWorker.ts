//src/Worker/worker.ts

const workerFunction = function () {
  self.onmessage = (event: MessageEvent) => {
    function getPixelAvg(regionData) {
      const xToFeatures: Array<any> = Array.from(
        { length: regionData.windowWidth * 2 },
        () => []
      );

      let startPos = regionData.startBpRegion;
      for (let j = 0; j < regionData.trackGene.length; j++) {
        let singleStrand = regionData.trackGene[j];

        if (Object.keys(singleStrand).length > 0) {
          let xSpanStart = (singleStrand.start - startPos) / regionData.bpToPx!;
          let xSpanEnd = (singleStrand.end - startPos) / regionData.bpToPx!;
          const startX = Math.max(0, Math.floor(xSpanStart));
          const endX = Math.min(
            regionData.windowWidth * 2 - 1,
            Math.ceil(xSpanEnd)
          );

          for (let x = startX; x <= endX; x++) {
            xToFeatures[x].push(singleStrand);
          }
        }
      }

      for (let j = 0; j < xToFeatures.length; j++) {
        let sum = 0;

        for (let x = 0; x < xToFeatures[j].length; x++) {
          sum += xToFeatures[j][x].score;
        }
        let avg = 0;
        if (xToFeatures[j].length > 0) {
          avg = sum / xToFeatures[j].length;
        }

        xToFeatures[j] = avg;
      }

      return xToFeatures;
    }

    postMessage(getPixelAvg(event.data));
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
