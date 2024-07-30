//src/Worker/worker.ts
// methylc  this is makeXMap then to placeFeatures from eg 2

import _ from "lodash";

self.onmessage = (event: MessageEvent) => {
  function aggregateRecords(records: Array<any>) {
    if (records.length === 0) {
      return { depth: 0, contextValues: [] };
    }

    const depth =
      records.reduce((sum, record) => {
        const value = parseFloat(record["6"]); // Convert the value to a number
        return isNaN(value) ? sum : sum + value;
      }, 0) / records.length;

    // const groupedByContext = _.groupBy(records, "context") is equal to below;
    const groupedByContext: Record<string, Array<{}>> = records.reduce(
      (result, record) => {
        const context = record["3"] || "default"; // Default context if 'context' property is missing
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
            const value = parseFloat(record["4"]); // Convert the value to a number
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
    let forwardStrandRecords = records.filter((record) => record["5"] === "+");
    let reverseStrandRecords = records.filter((record) => record["5"] !== "+");
    return {
      combined: aggregateRecords(records),
      forward: aggregateRecords(forwardStrandRecords),
      reverse: aggregateRecords(reverseStrandRecords),
    };
  }
  function findFeatureInPixel(regionData) {
    const xToFeatures: Array<any> = Array.from(
      { length: event.data.windowWidth * 2 },
      () => []
    );

    let startPos = event.data.startBpRegion;
    for (let j = 0; j < event.data.trackGene.length; j++) {
      let singleStrand = event.data.trackGene[j];

      {
        if (Object.keys(singleStrand).length > 0) {
          let xSpanStart = (singleStrand.start - startPos) / event.data.bpToPx!;
          let xSpanEnd = (singleStrand.start - startPos) / event.data.bpToPx!;
          const startX = Math.max(0, Math.floor(xSpanStart));
          const endX = Math.min(
            event.data.windowWidth * 2 - 1,
            Math.ceil(xSpanEnd)
          );

          for (let x = startX; x <= endX; x++) {
            xToFeatures[x].push(singleStrand);
          }
        }
      }
    }
    return xToFeatures;
  }

  let xToRecords = findFeatureInPixel(event.data);

  postMessage(xToRecords.map((item, index) => aggregateByStrand(item)));
};
