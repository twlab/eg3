// Worker entry point for big binary tracks (bigwig, dynseq, bigbed, etc.)
// Bundles only @gmod/bbi — not @gmod/tabix, hic-straw, or @gmod/bam.

import { fetchBigTrackData } from "./fetchBigData";

if (
    typeof self !== "undefined" &&
    "postMessage" in self &&
    "onmessage" in self &&
    typeof (self as any).importScripts !== "undefined"
) {
    self.onmessage = async (event: MessageEvent) => {
        try {
            let results = await fetchBigTrackData(event.data);
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
