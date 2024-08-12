import _, { initial } from "lodash";

import getTabixData from "./tabixSource2";
import GetHicData from "./hicSource2";
import getBigData from "./bigSource2";
// import ChromosomeInterval from "../../model/interval/ChromosomeInterval";
import HicStraw from "hic-straw/dist/hic-straw.min.js";
const AWS_API = "https://lambda.epigenomegateway.org/v2";
/**
 * A DataSource that gets BedRecords from remote bed files.  Designed to run in webworker context.  Only indexed bed
 * files supported.
 *
 * @author Daofeng Li based on Silas's version
 */
const trackFetchFunction: { [key: string]: any } = {
  refGene: async function refGeneFetch(regionData: any) {
    const genRefResponse = await fetch(
      `${AWS_API}/${regionData.name}/genes/refGene/queryRegion?chr=${regionData.chr}&start=${regionData.start}&end=${regionData.end}`,
      { method: "GET" }
    );

    return await genRefResponse.json();
  },
  bed: async function bedFetch(
    loci: Array<{ [key: string]: any }>,
    options: { [key: string]: any },
    url: string
  ) {
    return getTabixData(loci, options, url);
  },

  bigWig: function bigWigFetch(
    loci: Array<{ [key: string]: any }>,
    options: { [key: string]: any },
    url: string
  ) {
    return getBigData(loci, options, url);
  },

  dynseq: function dynseqFetch(
    loci: Array<{ [key: string]: any }>,
    options: { [key: string]: any },
    url: string
  ) {
    return getBigData(loci, options, url);
  },
  methylc: function methylcFetch(
    loci: Array<{ [key: string]: any }>,
    options: { [key: string]: any },
    url: string
  ) {
    return getTabixData(loci, options, url);
  },
  hic: function hicFetch(straw, options, start, end) {
    return GetHicData(straw, options, start, end);
  },
  genomealign: function genomeAlignFetch(
    loci: Array<{ [key: string]: any }>,
    options: { [key: string]: any },
    url: string
  ) {
    return getTabixData(loci, options, url);
  },
};
let strawCache: { [key: string]: any } = {};

self.onmessage = async (event: MessageEvent) => {
  let fetchResults: Array<any> = [];
  const regionStart = event.data.loci[0].start;
  const regionEnd = event.data.loci[0].end;
  const regionChr = event.data.loci[0].chr;
  console.log(regionStart, regionEnd, regionChr);
  let newtrackDefault = event.data.trackArray;
  await Promise.all(
    newtrackDefault.map(async (item, index) => {
      const trackName = item.name;
      const genomeName = item.genome;
      const id = item.id;
      const url = item.url;

      if (trackName === "hic") {
        if (!(id in strawCache)) {
          //   let metadata = straw.getMetaData();
          //   let normOptions = straw.getNormalizationOptions();
          strawCache[id] = new HicStraw({
            url: item.url,
          });
        }
        // CHANGE THIS PART TO GET A LIST OF GENOMIC COORD
        let result = await trackFetchFunction[trackName](
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
          regionStart,
          regionEnd
        );
        fetchResults.push({ name: trackName, nameResult: "hicResult", result });
      } else if (trackName === "genomealign") {
        let result = await trackFetchFunction[trackName](
          event.data.loci,
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
          },
          url
        );
        fetchResults.push({
          name: trackName,
          nameResult: "genomealignResult",
          result,
          genomeName: genomeName,
          querygenomeName: item.trackModel.querygenome,
        });

        // CHANGE THIS PART TO GET A LIST OF GENOMIC COORD
      } else if (trackName === "refGene") {
        const genRefResponse = await trackFetchFunction[trackName]({
          name: genomeName,
          chr: regionChr,
          start: regionStart,
          end: regionEnd,
        });

        fetchResults.push({ name: trackName, result: genRefResponse });
      } else {
        let result = await trackFetchFunction[trackName](
          event.data.loci,
          {
            displayMode: "full",
            color: "blue",
            color2: "red",
            maxRows: 20,
            height: 40,
            hideMinimalItems: false,
            sortItems: false,
            label: "",
          },
          url
        );

        fetchResults.push({ name: trackName, result });
      }
    })
  );

  postMessage({
    fetchResults,
    side: event.data.trackSide,
    xDist: event.data.xDist,
    location: event.data.location,
    initial: event.data.initial,
  });
};
