// Worker message handler - only set up when we're actually in a worker context

import { fetchGenomicData } from "./fetchFunctions";

// Check if we're in a Web Worker
if (
  typeof self !== "undefined" &&
  "postMessage" in self &&
  "onmessage" in self &&
  typeof (self as any).importScripts !== "undefined"
) {
  self.onmessage = (event: MessageEvent) => {
    const dataArr: any[] = event.data;

    for (const dataItem of dataArr) {
      const { trackModelArr, ...rest } = dataItem;

      for (const trackModel of trackModelArr) {
        // Fire each track independently — post result as soon as it resolves
        // instead of waiting for the whole chunk
        fetchGenomicData([{ ...rest, trackModelArr: [trackModel] }])
          .then((results) => {
            if (results) postMessage(results);
          })
          .catch((err) => {
            postMessage([
              {
                fetchResults: [
                  {
                    id: trackModel.id,
                    result: [],
                    errorType:
                      err instanceof Error ? err.message : "fetch error",
                    trackModel,
                    metadata: trackModel.metadata,
                    name: trackModel.type,
                  },
                ],
                trackDataIdx: dataItem.trackDataIdx,
                missingIdx: dataItem.missingIdx,
                genomicFetchCoord: dataItem.genomicFetchCoord ?? {},
                trackToDrawId: {},
              },
            ]);
          });
      }
    }
  };
}
