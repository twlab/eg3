// // Worker message handler - only set up when we're actually in a worker context

// class MyDataProcessor {
//   data: number[];
//   constructor(data: number[]) {
//     this.data = data;
//   }

//   process() {
//     return this.data.map((item) => item * 2);
//   }
// }
// const processor = new MyDataProcessor([1, 2, 3, 4, 5]);
// const cacheInstance = { test: processor };
// // Check if we're in a Web Worker
// if (
//   typeof self !== "undefined" &&
//   "postMessage" in self &&
//   "onmessage" in self &&
//   typeof (self as any).importScripts !== "undefined"
// ) {
//   self.onmessage = async (event: MessageEvent) => {
//     try {
//       console.log("got in worker", event.data);
//       const processor = new MyDataProcessor([1, 2, 3, 4, 5]);

//       // Use the class methods
//       const results = await cacheInstance.test.process();
//       postMessage({ results, data: event.data });
//     } catch (error) {
//       postMessage({
//         error: error instanceof Error ? error.message : "Unknown error",
//       });
//     }
//   };
// }
// Worker message handler - only set up when we're actually in a worker context

import { fetchGenomicData } from "./fetchFunctions";
if (
  typeof self !== "undefined" &&
  "postMessage" in self &&
  "onmessage" in self &&
  typeof (self as any).importScripts !== "undefined"
) {
  self.onmessage = async (event: MessageEvent) => {
    try {
      const results = await fetchGenomicData(event.data);
      postMessage(results);
    } catch (error) {
      postMessage({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
