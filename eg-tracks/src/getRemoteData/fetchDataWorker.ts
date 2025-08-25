// Worker message handler - only set up when we're actually in a worker context

import { fetchGenomicData } from "./fetchFunctions";

// Check if we're in a Web Worker
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
