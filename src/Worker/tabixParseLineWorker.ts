//src/Worker/worker.ts

const workerFunction = function () {
  self.onmessage = (event: MessageEvent) => {
    function parseLine(line) {
      const columns = line.split('\t');
      if (columns.length < 3) {
        return;
      }
      let feature = {
        chr: columns[0],
        start: Number.parseInt(columns[1], 10),
        end: Number.parseInt(columns[2], 10),
        n: columns.length, // number of columns in initial data row
      };
      for (let i = 3; i < columns.length; i++) {
        // Copy the rest of the columns to the feature
        feature[i] = columns[i];
      }

      return feature;
    }
    postMessage(event.data.map(parseLine));
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
