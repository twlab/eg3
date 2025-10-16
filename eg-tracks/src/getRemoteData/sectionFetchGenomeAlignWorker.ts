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

self.onmessage = async (event: MessageEvent) => {
  const cacheData = event.data.cacheData;
  const expandGenomicLoci = event.data.expandedGenLoci;
  const trackToFetch = event.data.trackToFetch;
  const genomicLoci = event.data.genomicLoci;
  const visData = event.data.visData;
  const fetchResults = {};
  const trackToDrawId = {};
  const genomicFetchCoord = {};
  const useFineModeNav = event.data.useFineModeNav;
  const primaryGenName = event.data.primaryGenName;
  const initGenomicLoci = event.data.initGenomicLoci;

  genomicFetchCoord[`${primaryGenName}`] = {
    genomicLoci,
    expandGenomicLoci,
    initGenomicLoci,
  };
  const genomeAlignTracks = trackToFetch;
  genomicFetchCoord[`${primaryGenName}`]["primaryVisData"] = event.data.visData;

  const fetchArrNav = event.data.initial ? initGenomicLoci : [genomicLoci];

  if (genomeAlignTracks.length > 0) {
    await getGenomeAlignment(event.data.visData.visRegion, genomeAlignTracks);
  }

  async function getGenomeAlignment(curVisData, genomeAlignTracks) {
    let visRegionFeatures: Feature[] = [];
    let result: Array<any> = [];
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
      curVisData._startBase,
      curVisData._endBase
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
      curVisData._startBase + event.data.bpRegionSize,
      curVisData._endBase - event.data.bpRegionSize
    );

    let visData: ViewExpansion = {
      visWidth: event.data.windowWidth * 3,

      visRegion,
      viewWindow: new OpenInterval(
        event.data.windowWidth,
        event.data.windowWidth * 2
      ),

      viewWindowRegion,
    };

    await Promise.all(
      genomeAlignTracks.map(async (item, index) => {
        var fetchRes: Array<any> = [];
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

              fetchRes.push(records);
              trackToDrawId[`${item.id}`] = "";
            } catch (error) {
              fetchRes.push({
                result: {
                  error: `Error fetching genome align track with id ${item.id
                    }`,
                },
                error: `Error fetching genome align track with id ${item.id
                  }`,
              });
            }
          })
        );

        fetchResults[`${item.id}`] = {
          name: item.name,
          result: fetchRes,
          query: item.querygenome,
          id: item.id,
          trackModel: item,
          metadata: item.metadata,
          isBigChain: false,
        };

        return fetchRes;
      })
    );

    // step 3 sent the array of genomealign fetched data to find the gaps and get drawData

    let successFetch: Array<any> = [];

    for (let key in fetchResults) {
      let tmpObj = { ...fetchResults[key] };
      tmpObj.result = [...fetchResults[key].result];
      if (!("error" in fetchResults[key])) {
        if (key in cacheData) {
          for (const data of cacheData[`${key}`]) {
            const newAlignment: Array<any> = [];
            for (const alignmentData of data) {
              const record = {
                chr: alignmentData.locus.chr,
                start: alignmentData.locus.start,
                end: alignmentData.locus.end,
                strand: alignmentData.strand,
                3: {
                  id: alignmentData.name,
                  genomealign: {
                    strand: alignmentData.queryStrand,

                    chr: alignmentData.queryLocus.chr,
                    start: alignmentData.queryLocus.start,
                    stop: alignmentData.queryLocus.end,

                    queryseq: alignmentData.querySeq,

                    targetseq: alignmentData.targetSeq,
                  },
                },
              };

              newAlignment.push(new AlignmentRecord(record));
            }

            tmpObj.result.unshift([...newAlignment]);
          }
        }
        successFetch.push(tmpObj);
      }
    }
    let multiCalInstance = new MultiAlignmentViewCalculator(
      event.data.primaryGenName
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
  postMessage({
    fetchResults,

    navData: {
      ...event.data,
      genomicFetchCoord,
      trackToDrawId,
      side: event.data.trackSide,
    },
  });
};
