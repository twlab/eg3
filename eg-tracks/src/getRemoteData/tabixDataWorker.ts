// Worker entry point for tabix-based tracks (bed, bedgraph, methylc, etc.)
// Bundles only @gmod/tabix — not @gmod/bbi, hic-straw, or @gmod/bam.

import { fetchTabixTrackData } from "./fetchTabixData";

if (
    typeof self !== "undefined" &&
    "postMessage" in self &&
    "onmessage" in self &&
    typeof (self as any).importScripts !== "undefined"
) {
    self.onmessage = async (event: MessageEvent) => {
        try {
            let results = await fetchTabixTrackData(event.data);
            if (results) {
                postMessage(results);
            }
            results = null;
        } catch (error) {
            postMessage({
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };
}
