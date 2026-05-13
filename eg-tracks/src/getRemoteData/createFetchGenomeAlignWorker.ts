// Main processing function that can be used both as worker and regular function

import { fetchGenomeAlignData } from "./fetchFunctions";

// Worker message handler - only set up when we're actually in a worker context
// Check if we're in a Web Worker
if (
  typeof self !== "undefined" &&
  "postMessage" in self &&
  "onmessage" in self &&
  typeof (self as any).importScripts !== "undefined"
) {
  self.onmessage = async (event: MessageEvent) => {
    try {
      const result = await fetchGenomeAlignData(event.data);
      postMessage(result);
    } catch (error) {
      console.error("Worker error:", error);
      postMessage({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
