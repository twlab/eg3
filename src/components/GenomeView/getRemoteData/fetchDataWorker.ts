import _ from "lodash";

import getTabixData from "./tabixSource";
import { HicSource } from "./hicSource";
import getBigData from "./bigSource";
// import ChromosomeInterval from "../../model/interval/ChromosomeInterval";
import HicStraw from "hic-straw/dist/hic-straw.min.js";
const AWS_API = "https://lambda.epigenomegateway.org/v2";

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
  hic: function hicFetch(straw, options, loci, basesPerPixel) {
    console.log(loci);
    return straw.getData(loci, basesPerPixel, options);
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
  let genomicLoci = event.data.loci;
  let expandGenomicLoci = event.data.expandedLoci;
  let basesPerPixel = event.data.basesPerPixel;
  let regionLength = event.data.regionLength;
  let newtrackDefault = event.data.trackArray;
  console.log(newtrackDefault);
  await Promise.all(
    newtrackDefault.map(async (item, index) => {
      const trackName = item.name;
      const genomeName = item.genome;
      const id = item.id;
      const url = item.url;

      if (trackName === "hic") {
        if (!(id in strawCache)) {
          strawCache[id] = new HicSource(item.url, regionLength);
        }

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
          expandGenomicLoci,
          basesPerPixel
        );
        fetchResults.push({
          name: trackName,
          result,
          id,
        });
      } else if (trackName === "genomealign") {
        let result = await trackFetchFunction[trackName](
          basesPerPixel < 10 ? expandGenomicLoci : genomicLoci,
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
          result,
          genomeName: genomeName,
          querygenomeName: item.trackModel.querygenome,
          id,
        });
      } else if (trackName === "refGene") {
        let genRefResponses: Array<any> = [];
        if (event.data.initial === 1) {
          for (let i = 0; i < event.data.initialGenomicLoci.length; i++) {
            const genRefResponse = await Promise.all(
              event.data.initialGenomicLoci[i].map((item, index) =>
                trackFetchFunction[trackName]({
                  name: genomeName,
                  chr: item.chr,
                  start: item.start,
                  end: item.end,
                })
              )
            );
            genRefResponses.push({
              fetchData: _.flatten(genRefResponse),
              genomicLoci: event.data.initialGenomicLoci[i],
              navLoci: event.data.initialNavLoci[i],
              id,
            });
          }
        } else {
          genRefResponses = await Promise.all(
            genomicLoci.map((item, index) =>
              trackFetchFunction[trackName]({
                name: genomeName,
                chr: item.chr,
                start: item.start,
                end: item.end,
              })
            )
          );
        }
        fetchResults.push({
          name: trackName,
          result: _.flatten(genRefResponses),
          id: id,
        });
      } else {
        let result = await trackFetchFunction[trackName](
          genomicLoci,
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

        fetchResults.push({ name: trackName, result, id });
      }
    })
  );

  postMessage({
    fetchResults,
    side: event.data.trackSide,
    xDist: event.data.xDist,
    location: event.data.location,
    initial: event.data.initial,
    curRegionCoord: event.data.curRegionCoord,
  });
};
