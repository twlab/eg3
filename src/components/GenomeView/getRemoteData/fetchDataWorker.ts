import _ from "lodash";
import getTabixData from "./tabixSource";
import { HicSource } from "./hicSource";
import getBigData from "./bigSource";
import JSON5 from "json5";
import { SequenceSegment } from "../../../models/AlignmentStringUtils";
import AlignmentRecord from "../../../models/AlignmentRecord";
import { AlignmentSegment } from "../../../models/AlignmentSegment";
import { NavContextBuilder } from "../../../models/NavContextBuilder";
import ChromosomeInterval from "../../../models/ChromosomeInterval";
import OpenInterval from "../../../models/OpenInterval";
import NavigationContext from "../../../models/NavigationContext";
import Feature from "../../../models/Feature";
import { ViewExpansion } from "../../../models/RegionExpander";
import DisplayedRegionModel from "../../../models/DisplayedRegionModel";
import { MultiAlignmentViewCalculator } from "../GenomeAlign/MultiAlignmentViewCalculator";

export interface PlacedAlignment {
  record: AlignmentRecord;
  visiblePart: AlignmentSegment;
  contextSpan: OpenInterval;
  targetXSpan: OpenInterval;
  queryXSpan: OpenInterval | null;
  targetSegments?: PlacedSequenceSegment[]; // These only present in fine mode
  querySegments?: PlacedSequenceSegment[];
}

export interface PlacedSequenceSegment extends SequenceSegment {
  xSpan: OpenInterval;
}

interface QueryGenomePiece {
  queryFeature: Feature;
  queryXSpan: OpenInterval;
}

export interface PlacedMergedAlignment extends QueryGenomePiece {
  segments: PlacedAlignment[];
  targetXSpan: OpenInterval;
}

export interface GapText {
  targetGapText: string;
  targetXSpan: OpenInterval;
  targetTextXSpan: OpenInterval;
  queryGapText: string;
  queryXSpan: OpenInterval;
  queryTextXSpan: OpenInterval;
  shiftTarget: boolean; // Whether target txt width > gap width
  shiftQuery: boolean; // Whether query txt width > gap width
}

export interface Alignment {
  isFineMode: boolean;
  primaryVisData: ViewExpansion;
  queryRegion: DisplayedRegionModel;

  drawData: PlacedAlignment[] | PlacedMergedAlignment[];
  drawGapText?: GapText[];
  plotStrand?: string;
  primaryGenome: string;
  queryGenome: string;
  basesPerPixel: number;
  navContextBuilder?: NavContextBuilder;
}

export interface MultiAlignment {
  [genome: string]: Alignment;
}

const AWS_API = "https://lambda.epigenomegateway.org/v2";

const trackFetchFunction: { [key: string]: any } = {
  refGene: async function refGeneFetch(regionData: any) {
    const genRefResponse = await fetch(
      `${AWS_API}/${regionData.name}/genes/${regionData.trackName}/queryRegion?chr=${regionData.chr}&start=${regionData.start}&end=${regionData.end}`,
      { method: "GET" }
    );

    return await genRefResponse.json();
  },
  gencodeV39: async function refGeneFetch(regionData: any) {
    const genRefResponse = await fetch(
      `${AWS_API}/${regionData.name}/genes/${regionData.trackName}/queryRegion?chr=${regionData.chr}&start=${regionData.start}&end=${regionData.end}`,
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

//TO_DOOOOOOOOO have a way to get option from trackManager for each track and set it here if custom options are defined while getting the fetched data
self.onmessage = async (event: MessageEvent) => {
  let fetchResults: Array<any> = [];
  let genomicLoci = event.data.loci;
  let expandGenomicLoci = event.data.expandedLoci;
  let basesPerPixel = event.data.basesPerPixel;
  let regionLength = event.data.regionLength;
  let trackDefaults = event.data.trackModelArr;
  let genomicFetchCoord = {};
  genomicFetchCoord[`${event.data.primaryGenName}`] = genomicLoci;
  //____________________________________________________________________________________________________________________________________________________________________
  //____________________________________________________________________________________________________________________________________________________________________
  //____________________________________________________________________________________________________________________________________________________________________
  // step 1: check if there genome align tracks because it alters other track positions because of gaps
  let genomeAlignTracks = trackDefaults.filter((items, index) => {
    return items.filetype === "genomealign";
  });

  if (genomeAlignTracks.length > 0) {
    // step 2: fetch genome align data and put them into an array
    let visRegionFeatures: Feature[] = [];

    for (let feature of event.data.visData.visRegion._navContext._features) {
      let newChr = new ChromosomeInterval(
        feature.locus.chr,
        feature.locus.start,
        feature.locus.end
      );
      visRegionFeatures.push(new Feature(feature.name, newChr));
    }

    let visRegionNavContext = new NavigationContext(
      event.data.visData.visRegion._navContext._name,
      visRegionFeatures
    );

    let visRegion = new DisplayedRegionModel(
      visRegionNavContext,
      event.data.visData.visRegion._startBase,
      event.data.visData.visRegion._endBase
    );

    let viewWindowRegionFeatures: Feature[] = [];

    for (let feature of event.data.visData.viewWindowRegion._navContext
      ._features) {
      let newChr = new ChromosomeInterval(
        feature.locus.chr,
        feature.locus.start,
        feature.locus.end
      );
      viewWindowRegionFeatures.push(new Feature(feature.name, newChr));
    }

    let viewWindowRegionNavContext = new NavigationContext(
      event.data.visData.viewWindowRegion._navContext._name,
      viewWindowRegionFeatures
    );
    let viewWindowRegion = new DisplayedRegionModel(
      viewWindowRegionNavContext,
      event.data.visData.viewWindowRegion._startBase,
      event.data.visData.viewWindowRegion._endBase
    );

    let visData: ViewExpansion = {
      visWidth: event.data.visData.visWidth,

      visRegion,

      viewWindow: new OpenInterval(
        event.data.visData.viewWindow.start,
        event.data.visData.viewWindow.end
      ),

      viewWindowRegion,
    };

    const oldRecordsArray = await Promise.all(
      genomeAlignTracks.map(async (item, index) => {
        let curGenomeAlignRespond = await trackFetchFunction.genomealign(
          expandGenomicLoci,
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
          item.url
        );

        let records: AlignmentRecord[] = [];
        let recordArr: any = curGenomeAlignRespond;

        for (const record of recordArr) {
          let data = JSON5.parse("{" + record[3] + "}");
          // if (options.isRoughMode) {

          // }
          record[3] = data;
          records.push(new AlignmentRecord(record));
        }
        // added trackId genomeAlign tracks so we can put the correct data to the correct track after we sent the data back
        return {
          query: item.querygenome,
          records: records,
          isBigChain: false,
          id: item.id,
        };
      })
    );

    // step 3 sent the array of genomealign fetched data to find the gaps and get drawData

    let multiCalInstance = new MultiAlignmentViewCalculator(
      event.data.primaryGenName
    );
    let alignment = multiCalInstance.multiAlign(visData, oldRecordsArray);
    // in old epigenome these data are calcualted while in the component, but we calculate the data here using the instantiated class
    // because class don't get sent over Workers and Internet so we have to get the data here.
    for (let query in alignment) {
      alignment[`${query}`]["name"] = "genomealign";
      for (let i = 0; i < alignment[`${query}`].drawData.length; i++) {
        let placement = alignment[`${query}`].drawData[i];

        const { targetXSpan } = placement;
        const targetSequence = placement.visiblePart.getTargetSequence();
        const querySequence = placement.visiblePart.getQuerySequence();
        const baseWidth = targetXSpan.getLength() / targetSequence.length;
        const targetLocus = placement.visiblePart.getLocus().toString();
        const queryLocus = placement.visiblePart.getQueryLocus().toString();
        const nonGaps = placement.targetSegments.filter(
          (segment) => !segment.isGap
        );

        const isReverseStrandQuery = placement.record.getIsReverseStrandQuery();
        let tempObj = {
          targetSequence,
          querySequence,
          baseWidth,
          targetLocus,
          queryLocus,
          nonGaps,
          isReverseStrandQuery,
        };
        alignment[`${query}`].drawData[i] = {
          ...placement,
          ...tempObj,
        };
      }

      // step 4 create obj that holds primary and query genome genomic coordinate because some other tracks might
      // align to the query coord

      fetchResults.push(alignment[`${query}`]);
    }

    console.log(fetchResults);
  }

  // step 5 if there are normal tracks assciated with query coord then we use query genomic coord to fetch their data
  //____________________________________________________________________________________________________________________________________________________________________
  //____________________________________________________________________________________________________________________________________________________________________
  //____________________________________________________________________________________________________________________________________________________________________
  console.log(genomeAlignTracks);
  await Promise.all(
    trackDefaults.map(async (item, index) => {
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
      } else if (trackName === "refGene" || trackName === "gencodeV39") {
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
                  trackName,
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
                trackName,
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
    bpX: event.data.bpX,
  });
};
