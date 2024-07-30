import _ from "lodash";

import getTabixData from "./tabixSource2";
import GetHicData from "./hicSource2";
// import ChromosomeInterval from "../../model/interval/ChromosomeInterval";
import HicStraw from "hic-straw/dist/hic-straw.min.js";
/**
 * A DataSource that gets BedRecords from remote bed files.  Designed to run in webworker context.  Only indexed bed
 * files supported.
 *
 * @author Daofeng Li based on Silas's version
 */

let strawCache: { [key: string]: any } = {};

self.onmessage = async (event: MessageEvent) => {
  let resultResult: Array<any> = [];

  let newtrackDefault = event.data.trackArray;
  await Promise.all(
    newtrackDefault.map(async (item, index) => {
      const trackName = item.name;

      const id = item.id;

      if (trackName === "hic") {
        if (!(id in strawCache)) {
          //   let metadata = straw.getMetaData();
          //   let normOptions = straw.getNormalizationOptions();
          strawCache[id] = new HicStraw({
            url: item.url,
          });
        }
        let result = await GetHicData(
          strawCache[id],
          {
            color: "#B8008A",
            color2: "#006385",
            backgroundColor: "var(--bg-color)",
            displayMode: "heatmap",
            scoreScale: "auto",
            scoreMax: 10,
            scalePercentile: 95,
            scoreMin: 0,
            height: 500,
            lineWidth: 2,
            greedyTooltip: false,
            fetchViewWindowOnly: false,
            bothAnchorsInView: false,
            isThereG3dTrack: false,
            clampHeight: false,
            binSize: 0,
            normalization: "NONE",
            label: "",
          },
          event.data.loci.start,
          event.data.loci.end
        );
        resultResult.push({ name: "hicResult", result });
      } else if (trackName === "genomealign") {
        let result = await getTabixData(
          [
            {
              url: item.url,
              chr: event.data.loci.chr,
              start: event.data.loci.start,
              end: event.data.loci.end,
            },
          ],
          {
            height: 40,
            isCombineStrands: false,
            colorsForContext: {
              CG: {
                color: "rgb(100,139,216)",
                background: "#d9d9d9",
              },
              CHG: {
                color: "rgb(255,148,77)",
                background: "#ffe0cc",
              },
              CHH: {
                color: "rgb(255,0,255)",
                background: "#ffe5ff",
              },
            },
            depthColor: "#525252",
            depthFilter: 0,
            maxMethyl: 1,
            label: "",
          }
        );
        resultResult.push({ name: "genomealignResult", result });
      }
    })
  );

  postMessage(resultResult);
};
