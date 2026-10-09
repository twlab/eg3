/* The browser's fetch workers, bundled into this file so they work however
   the page is served. Post one the same request `fetchGenomicData` or
   `fetchGenomeAlignData` takes and it answers with their result, or with
   `{ error }`. */

import FetchWorker from "../../eg-tracks/src/getRemoteData/createFetchWorker.ts?worker&inline";
import GenomeAlignWorker from "../../eg-tracks/src/getRemoteData/createFetchGenomeAlignWorker.ts?worker&inline";

/** A worker running `fetchGenomicData`: every track but genome alignments. */
export function createFetchWorker(): Worker {
  return new FetchWorker();
}

/** A worker running `fetchGenomeAlignData`, for genome alignment tracks. */
export function createGenomeAlignWorker(): Worker {
  return new GenomeAlignWorker();
}

/**
 * Posts one request to a worker and resolves with its answer - or rejects
 * with the error it reports. One request at a time per worker: the answer
 * is whichever message comes back next.
 */
export function askWorker<T = any>(worker: Worker, request: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const done = () => {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
    };
    const onMessage = (event: MessageEvent) => {
      done();
      const data = event.data;
      if (data && typeof data === "object" && !Array.isArray(data) && "error" in data) {
        reject(new Error(String(data.error)));
      } else {
        resolve(data as T);
      }
    };
    const onError = (event: ErrorEvent) => {
      done();
      reject(new Error(event.message || "Worker failed"));
    };
    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.postMessage(request);
  });
}
