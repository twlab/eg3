import _ from "lodash";
import JSON5 from "json5";
import { SequenceSegment } from "../models/AlignmentStringUtils";
import AlignmentRecord from "../models/AlignmentRecord";

import { AlignmentSegment } from "../models/AlignmentSegment";
import { NavContextBuilder } from "../models/NavContextBuilder";
import ChromosomeInterval from "../models/ChromosomeInterval";
import OpenInterval from "../models/OpenInterval";
import NavigationContext from "../models/NavigationContext";
import Feature from "../models/Feature";
import { ViewExpansion } from "../models/RegionExpander";
import DisplayedRegionModel from "../models/DisplayedRegionModel";
import { MultiAlignmentViewCalculator } from "../components/GenomeView/TrackComponents/GenomeAlignComponents/MultiAlignmentViewCalculator";
import trackFetchFunction from "./fetchTrackData";

import { niceBpCount } from "../models/util";

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

// Main processing function that can be used both as worker and regular function
export async function fetchGenomeAlignData(data: any): Promise<any> {
  const regionExpandLoci = data.regionExpandLoci;
  const trackToFetch = data.trackToFetch;
  const genomicLoci = data.genomicLoci;

  const fetchResults = {};
  const trackToDrawId = {};
  const genomicFetchCoord = {};
  const useFineModeNav = data.useFineModeNav;
  const primaryGenName = data.primaryGenName;
  const initGenomicLoci = data.initGenomicLoci;

  genomicFetchCoord[`${primaryGenName}`] = {
    genomicLoci,
    regionExpandLoci,
    initGenomicLoci,
  };
  const genomeAlignTracks = trackToFetch;

  const fetchArrNav = [regionExpandLoci];

  if (genomeAlignTracks.length > 0) {
    await getGenomeAlignment(data.visData.visRegion, genomeAlignTracks);
  }

  async function getGenomeAlignment(curVisData, genomeAlignTracks) {
    let visRegionFeatures: Feature[] = [];

    for (let feature of data.visData.visRegion._navContext._features) {
      let newChr = new ChromosomeInterval(
        feature.locus.chr,
        feature.locus.start,
        feature.locus.end
      );
      visRegionFeatures.push(new Feature(feature.name, newChr));
    }

    let visRegionNavContext = new NavigationContext(
      data.visData.visRegion._navContext._name,
      visRegionFeatures
    );

    let visRegion = new DisplayedRegionModel(
      visRegionNavContext,
      curVisData._startBase,
      curVisData._endBase
    );

    let viewWindowRegionFeatures: Feature[] = [];

    for (let feature of data.visData.viewWindowRegion._navContext._features) {
      let newChr = new ChromosomeInterval(
        feature.locus.chr,
        feature.locus.start,
        feature.locus.end
      );
      viewWindowRegionFeatures.push(new Feature(feature.name, newChr));
    }

    let viewWindowRegionNavContext = new NavigationContext(
      data.visData.viewWindowRegion._navContext._name,
      viewWindowRegionFeatures
    );

    let viewWindowRegion = new DisplayedRegionModel(
      viewWindowRegionNavContext,
      data.visData.viewWindowRegion._startBase,
      data.visData.viewWindowRegion._endBase
    );

    let visData: ViewExpansion = {
      visWidth: data.visData.visWidth,

      visRegion,
      viewWindow: new OpenInterval(data.windowWidth, data.windowWidth * 2),

      viewWindowRegion,
    };

    await Promise.all(
      genomeAlignTracks.map(async (item, index) => {
        let rawRecords;
        await Promise.all(
          fetchArrNav.map(async (nav, index) => {
            try {
              const responds = await trackFetchFunction["genomealign"]({
                nav: nav,
                options: {
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

                url: item.url,
                trackModel: item,
              });

              let records: AlignmentRecord[] = [];

              for (const record of responds) {
                let data = JSON5.parse("{" + record[3] + "}");
                record[3] = data;
                records.push(new AlignmentRecord(record));
              }
              // Added trackId for genomeAlign tracks so we can put the correct data to the correct track after we send the data back

              rawRecords = records;
              trackToDrawId[`${item.id}`] = "";
            } catch (error) {
              rawRecords = {
                error: `Error processing genome align track with id ${
                  item.id
                }: ${"Error"}`,
              };
            }
          })
        );

        fetchResults[`${item.id}`] = {
          name: item.name,
          records: rawRecords,
          query: item.querygenome,
          id: item.id,
          trackModel: item,
          metadata: item.metadata,
          isBigChain: false,
        };
      })
    );

    // step 3 sent the array of genomealign fetched data to find the gaps and get drawData

    let successFetch: Array<any> = [];
    for (const key in fetchResults) {
      if (!("error" in fetchResults[key].records)) {
        successFetch.push(fetchResults[key]);
      }
    }

    let multiCalInstance = new MultiAlignmentViewCalculator(
      data.primaryGenName
    );

    let alignment = multiCalInstance.multiAlign(visData, successFetch);

    // in old epigenome these data are calcualted while in the component, but we calculate the data here using the instantiated class
    // because class don't get sent over Workers and Internet so we have to get the data here.

    for (let query in alignment) {
      let segmentArray;
      if (!useFineModeNav) {
        segmentArray = [].concat.apply(
          [],
          alignment[`${query}`].drawData.map(
            (placement) => placement.segments
          ) as any
        );
        const strandList = segmentArray.map(
          (segment) => segment.record.queryStrand
        );
        const targetXSpanList = segmentArray.map(
          (segment) => segment.targetXSpan
        );
        const queryXSpanList = segmentArray.map(
          (segment) => segment.queryXSpan
        );
        const targetLocusList = segmentArray.map((segment) =>
          segment.visiblePart.getLocus().toString()
        );
        const queryLocusList = segmentArray.map((segment) =>
          segment.visiblePart.getQueryLocus().toString()
        );
        const lengthList = segmentArray.map((segment) =>
          niceBpCount(segment.visiblePart.getLength())
        );
        const queryLengthList = segmentArray.map((segment) =>
          niceBpCount(segment.visiblePart.getQueryLocus().getLength())
        );
        let tempObj = {};
        tempObj = {
          strandList,
          targetXSpanList,
          queryXSpanList,
          targetLocusList,
          queryLocusList,
          lengthList,
          queryLengthList,
        };

        alignment[`${query}`] = { ...alignment[`${query}`], ...tempObj };
      }
      for (let i = 0; i < alignment[`${query}`].drawData.length; i++) {
        let placement = alignment[`${query}`].drawData[i];
        let tempObj = {};
        const { targetXSpan } = placement;
        if (useFineModeNav) {
          const targetSequence = placement.visiblePart.getTargetSequence();
          const querySequence = placement.visiblePart.getQuerySequence();
          const baseWidth = targetXSpan.getLength() / targetSequence.length;
          const targetLocus = placement.visiblePart.getLocus().toString();
          const queryLocus = placement.visiblePart.getQueryLocus().toString();
          const queryLocusFine = placement.visiblePart.getQueryLocusFine();
          const nonGapsTarget = placement.targetSegments.filter(
            (segment) => !segment.isGap
          );
          const nonGapsQuery = placement.querySegments.filter(
            (segment) => !segment.isGap
          );

          const isReverseStrandQuery =
            placement.record.getIsReverseStrandQuery();
          tempObj = {
            targetSequence,
            querySequence,
            nonGapsQuery,
            baseWidth,
            targetLocus,
            queryLocus,
            nonGapsTarget,
            isReverseStrandQuery,
            queryLocusFine,
          };
        } else {
          let estimatedLabelWidth = placement.queryFeature.toString().length;
          tempObj = { estimatedLabelWidth };
        }
        alignment[`${query}`].drawData[i] = {
          ...placement,
          ...tempObj,
        };
      }

      // step 4 create obj that holds primary and query genome genomic coordinate because some other tracks might
      // align to the query coord
      let queryGenomicCoords: Array<any> = [];

      let featuresForChr =
        alignment[`${query}`].queryRegion._navContext._featuresForChr;

      for (let chr in featuresForChr) {
        if (chr !== "") {
          let start = parseGenomicCoordinates(
            featuresForChr[`${chr}`][0].name
          ).start;
          let end = parseGenomicCoordinates(
            featuresForChr[`${chr}`][featuresForChr[`${chr}`].length - 1].name
          ).end;
          queryGenomicCoords.push({ chr, start, end });
        }
      }

      genomicFetchCoord[`${primaryGenName}`]["primaryVisData"] =
        alignment[`${query}`].primaryVisData;

      //save the genomic location so that track that has query as parent can use that data to get data\

      genomicFetchCoord[`${query}`] = {
        queryGenomicCoord: new Array(queryGenomicCoords),
        id: alignment[`${query}`].id,
        queryRegion: alignment[`${query}`].queryRegion,
      };
      fetchResults[`${alignment[`${query}`].id}`]["records"] =
        alignment[`${query}`];
    }
  }

  function parseGenomicCoordinates(input: string): {
    chr: string;
    start: number;
    end: number;
  } {
    const [chrPart, positionPart] = input.split(":");
    const [startStr, endStr] = positionPart.split("-");

    const chr = chrPart.slice(3); // Remove the 'chr' prefix
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);

    return { chr, start, end };
  }

  return {
    fetchResults,

    navData: {
      ...data,
      genomicFetchCoord,
      trackToDrawId,
      regionSetStartBp:
        data.visData.visRegion._endBase - data.visData.visRegion._startBase ===
        data.bpRegionSize
          ? 0
          : null,
    },
  };
}

// Worker message handler - only set up when we're actually in a worker context
// Check if we're in a Web Worker by looking for the WorkerGlobalScope
if (
  typeof self !== "undefined" &&
  "postMessage" in self &&
  "onmessage" in self &&
  typeof window === "undefined"
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
