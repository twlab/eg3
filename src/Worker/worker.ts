//src/Worker/worker.ts

const workerFunction = function () {
  // Set up event listener for messages from the worker
  // const worker = new Worker('./worker', {
  //   name: 'runSetStrand',
  //   type: 'module',
  // });
  // const { setStrand } = wrap<import('./worker').runSetStrand>(worker);
  // trackGeneData['bpToPx'] = bpToPx;
  // console.log(await setStrand(trackGeneData));

  //we perform every operation we want in this function right here
  self.onmessage = (event: MessageEvent) => {
    function aggregateRecords(records: Array<any>) {
      if (records.length === 0) {
        return { depth: 0, contextValues: [] };
      }
      // const depth = _.meanBy(records, 'depth');
      // for (let i = 0; i < records.length; i++) {
      //   console.log(records[i]['6']);
      // }
      const depth =
        records.reduce((sum, record) => {
          const value = parseFloat(record['6']); // Convert the value to a number
          return isNaN(value) ? sum : sum + value;
        }, 0) / records.length;

      const groupedByContext: Record<string, Array<{}>> = records.reduce(
        (result, record) => {
          const context = record['3'] || 'default'; // Default context if 'context' property is missing
          result[context] = result[context] || [];
          result[context].push(record);
          return result;
        },
        {}
      );

      const contextValues: Array<any> = [];
      for (const contextName in groupedByContext) {
        const recordsOfThatContext: Array<any> = groupedByContext[contextName];
        contextValues.push({
          context: contextName,
          value:
            recordsOfThatContext.reduce((sum, record) => {
              const value = parseFloat(record['4']); // Convert the value to a number
              return isNaN(value) ? sum : sum + value;
            }, 0) / recordsOfThatContext.length,
        });
      }
      return {
        depth,
        contextValues,
      };
    }
    function aggregateByStrand(records) {
      let forwardStrandRecords = records.filter(
        (record) => record['5'] === '+'
      );
      let reverseStrandRecords = records.filter(
        (record) => record['5'] !== '+'
      );
      return {
        combined: aggregateRecords(records),
        forward: aggregateRecords(forwardStrandRecords),
        reverse: aggregateRecords(reverseStrandRecords),
      };
    }
    function findFeatureInPixel(data: any, windowWidth: number, bpToPx) {
      let xToFeatures: Array<Array<any>> = [];

      const newArr: Array<any> = Array.from(
        { length: Number(windowWidth * 2) },
        () => []
      );

      xToFeatures.push(newArr);

      let lastIdx = data.length - 1;
      for (let j = 0; j < data[lastIdx][0].length; j++) {
        let singleStrand = data[lastIdx][0][j];

        {
          if (Object.keys(singleStrand).length > 0) {
            let xSpanStart = (singleStrand.start - data[lastIdx][1]) / bpToPx!;
            let xSpanEnd = (singleStrand.end - data[lastIdx][1]) / bpToPx!;
            const startX = Math.max(0, Math.floor(xSpanStart));
            const endX = Math.min(windowWidth * 2 - 1, Math.ceil(xSpanEnd));

            for (let x = startX; x <= endX; x++) {
              xToFeatures[0][x].push(singleStrand);
            }
          }
        }
      }
      return xToFeatures;
    }
    let data = event.data;

    let xToRecords = findFeatureInPixel(
      data.trackGene,
      data.windowWidth,
      data.bpToPx
    );

    let aggregatedRecords: Array<any> = [];
    if (xToRecords.length > 0) {
      for (let i = 0; i < xToRecords.length; i++) {
        aggregatedRecords.push(
          xToRecords[i].map((item, index) => aggregateByStrand(item))
        );
      }
    }

    postMessage(aggregatedRecords);
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
