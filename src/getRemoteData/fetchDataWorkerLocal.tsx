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
import { MultiAlignmentViewCalculator } from "../components/GenomeView/GenomeAlignComponents/MultiAlignmentViewCalculator";
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

//TO_DOOOOOOOOO have a way to get option from trackManager for each track and set it here if custom options are defined while getting the fetched data
export async function processGenomicData(eventData: any): Promise<any> {
  const primaryGenName = eventData.primaryGenName;
  let fetchResults: Array<any> = [];
  const genomicLoci = eventData.genomicLoci;
  const expandGenomicLoci = eventData.expandedGenLoci;
  const initGenomicLoci = eventData.initGenomicLoci;
  const trackDefaults = eventData.trackModelArr;
  let genomicFetchCoord: any = {};
  const initNavLoci = eventData.initNavLoci;
  const useFineModeNav = eventData.useFineModeNav;

  genomicFetchCoord[primaryGenName] = {
    genomicLoci,
    expandGenomicLoci,
    initGenomicLoci,
    curFetchRegionNav: eventData.curFetchRegionNav,
    initNavLoci,
  };

  const genomeAlignTracks = trackDefaults.filter(
    (item) => item.type === "genomealign"
  );

  if (genomeAlignTracks.length > 0) {
    genomicFetchCoord[primaryGenName]["primaryVisData"] = [];

    const genomeAlignData = await getGenomeAlignment(
      eventData.visData.visRegion,
      genomeAlignTracks
    );

    for (const item of genomeAlignData) {
      genomicFetchCoord[primaryGenName]["primaryVisData"] =
        item.result.primaryVisData;
      genomicFetchCoord[item.queryName] = {
        queryGenomicCoord: new Array(item.queryGenomicCoord),
        id: item.id,
        queryRegion: item.result.queryRegion,
      };
      fetchResults.push(item);
    }
  } else {
    genomicFetchCoord[primaryGenName]["primaryVisData"] = eventData.visData;
  }

  async function getGenomeAlignment(curVisData: any, genomeAlignTracks: any[]) {
    let visRegionFeatures: Feature[] = [];
    let result: Array<any> = [];

    for (const feature of eventData.visData.visRegion._navContext._features) {
      const newChr = new ChromosomeInterval(
        feature.locus.chr,
        feature.locus.start,
        feature.locus.end
      );
      visRegionFeatures.push(new Feature(feature.name, newChr));
    }

    const visRegionNavContext = new NavigationContext(
      eventData.visData.visRegion._navContext._name,
      visRegionFeatures
    );

    const visRegion = new DisplayedRegionModel(
      visRegionNavContext,
      curVisData._startBase,
      curVisData._endBase
    );

    let viewWindowRegionFeatures: Feature[] = [];

    for (const feature of eventData.visData.viewWindowRegion._navContext
      ._features) {
      const newChr = new ChromosomeInterval(
        feature.locus.chr,
        feature.locus.start,
        feature.locus.end
      );
      viewWindowRegionFeatures.push(new Feature(feature.name, newChr));
    }

    const viewWindowRegionNavContext = new NavigationContext(
      eventData.visData.viewWindowRegion._navContext._name,
      viewWindowRegionFeatures
    );

    const viewWindowRegion = new DisplayedRegionModel(
      viewWindowRegionNavContext,
      curVisData._startBase + eventData.bpRegionSize,
      curVisData._endBase - eventData.bpRegionSize
    );

    const visData: ViewExpansion = {
      visWidth: eventData.windowWidth * 3,
      visRegion,
      viewWindow: new OpenInterval(
        eventData.windowWidth,
        eventData.windowWidth * 2
      ),
      viewWindowRegion,
    };

    const oldRecordsArray = await Promise.all(
      genomeAlignTracks.map(async (item) => {
        const curGenomeAlignRespond = await trackFetchFunction.genomealign(
          expandGenomicLoci,
          {
            height: 40,
            isCombineStrands: false,
            colorsForContext: {
              CG: { color: "rgb(100,139,216)", background: "#d9d9d9" },
              CHG: { color: "rgb(255,148,77)", background: "#ffe0cc" },
              CHH: { color: "rgb(255,0,255)", background: "#ffe5ff" },
            },
            depthColor: "#525252",
            depthFilter: 0,
            maxMethyl: 1,
            label: "",
          },
          item.url
        );

        const records: AlignmentRecord[] = [];
        const recordArr: any = curGenomeAlignRespond;

        for (const record of recordArr) {
          const data = JSON5.parse("{" + record[3] + "}");
          record[3] = data;
          records.push(new AlignmentRecord(record));
        }

        return {
          query: item.querygenome,
          records: records,
          isBigChain: false,
          id: item.id,
        };
      })
    );

    const multiCalInstance = new MultiAlignmentViewCalculator(
      eventData.primaryGenName
    );
    const alignment = multiCalInstance.multiAlign(visData, oldRecordsArray);

    for (const query in alignment) {
      if (!useFineModeNav) {
        const segmentArray = [].concat.apply(
          [],
          alignment[query].drawData.map((placement) => placement.segments)
        );
        const strandList = segmentArray.map(
          (segment: any) => segment.record.queryStrand
        );
        const targetXSpanList = segmentArray.map(
          (segment: any) => segment.targetXSpan
        );
        const queryXSpanList = segmentArray.map(
          (segment: any) => segment.queryXSpan
        );
        const targetLocusList = segmentArray.map((segment: any) =>
          segment.visiblePart.getLocus().toString()
        );
        const queryLocusList = segmentArray.map((segment: any) =>
          segment.visiblePart.getQueryLocus().toString()
        );
        const lengthList = segmentArray.map((segment: any) =>
          niceBpCount(segment.visiblePart.getLength())
        );
        const queryLengthList = segmentArray.map((segment: any) =>
          niceBpCount(segment.visiblePart.getQueryLocus().getLength())
        );

        alignment[query] = {
          ...alignment[query],
          strandList,
          targetXSpanList,
          queryXSpanList,
          targetLocusList,
          queryLocusList,
          lengthList,
          queryLengthList,
        };
      }

      for (let i = 0; i < alignment[query].drawData.length; i++) {
        const placement = alignment[query].drawData[i];
        let tempObj: any = {};
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
          const estimatedLabelWidth = placement.queryFeature.toString().length;
          tempObj = { estimatedLabelWidth };
        }

        alignment[query].drawData[i] = { ...placement, ...tempObj };
      }

      const queryGenomicCoords: Array<any> = [];
      const featuresForChr =
        alignment[query].queryRegion._navContext._featuresForChr;

      for (const chr in featuresForChr) {
        if (chr !== "") {
          const start = parseGenomicCoordinates(
            featuresForChr[chr][0].name
          ).start;
          const end = parseGenomicCoordinates(
            featuresForChr[chr][featuresForChr[chr].length - 1].name
          ).end;
          queryGenomicCoords.push({ chr, start, end });
        }
      }

      result.push({
        queryName: query,
        result: alignment[query],
        id: alignment[query].id,
        name: "genomealign",
        queryGenomicCoord: queryGenomicCoords,
      });
    }

    return result;
  }

  const normDefaultTracks = trackDefaults.filter(
    (item) => item.type !== "genomealign"
  );
  await Promise.all(
    normDefaultTracks.map(async (item) => {
      const trackType = item.type;
      const genomeName = item.genome;
      const id = item.id;
      const url = item.url;

      if (trackType === "hic" || trackType === "ruler") {
        fetchResults.push({
          name: trackType,
          id,
          metadata: item.metadata,
        });
      } else if (trackType === "geneannotation") {
        const genRefResponses = await fetchData(item, genomeName, id);
        fetchResults.push({
          name: trackType,
          result:
            eventData.initial !== 1 ? genRefResponses[0] : genRefResponses,
          id,
          metadata: item.metadata,
        });
      } else if (trackType === "matplot") {
        const tmpReponse = await Promise.all(
          item.tracks.map(async (trackItem) => {
            return eventData.initial !== 1
              ? (await fetchData(trackItem, genomeName, id)).flat(1)
              : fetchData(trackItem, genomeName, id);
          })
        );

        fetchResults.push({
          name: trackType,
          result: tmpReponse,
          id,
          metadata: item.metadata,
        });
      } else {
        const responses = await fetchData(item, genomeName, id);
        fetchResults.push({
          name: trackType,
          result: eventData.initial !== 1 ? responses[0] : responses,
          id,
          metadata: item.metadata,
        });
      }
    })
  );

  async function fetchData(
    trackModel: any,
    genomeName: string,
    id: string
  ): Promise<Array<any>> {
    const responses: any[] = [];
    let curFetchNav: any;

    if ("genome" in trackModel.metadata) {
      curFetchNav =
        genomicFetchCoord[trackModel.metadata.genome].queryGenomicCoord;
    } else if (
      useFineModeNav ||
      trackModel.type === "longrange" ||
      trackModel.type === "biginteract"
    ) {
      curFetchNav = [expandGenomicLoci];
    } else if (eventData.initial === 1) {
      curFetchNav = initGenomicLoci;
    } else {
      curFetchNav = [genomicLoci];
    }

    for (const nav of curFetchNav) {
      let curRespond: any;
      if (trackModel.type === "geneannotation") {
        curRespond = await Promise.all(
          nav.map((navPart: any) => {
            return trackFetchFunction[trackModel.type]({
              genomeName,
              name: trackModel.name,
              chr: navPart.chr,
              start: navPart.start,
              end: navPart.end,
              nav: navPart,
              trackModel,
              trackType: trackModel.type,
            });
          })
        );
      } else {
        curRespond = await trackFetchFunction[trackModel.type]({
          genomeName,
          name: trackModel.name,
          basesPerPixel: eventData.bpRegionSize / eventData.windowWidth,
          nav,
          trackModel,
          trackType: trackModel.type,
        });
      }

      responses.push(_.flatten(curRespond));
    }

    return responses;
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
    side: eventData.trackSide,
    xDist: eventData.xDist,
    initial: eventData.initial,
    curFetchRegionNav: eventData.curFetchRegionNav,
    genomicFetchCoord,
    bpX: eventData.bpX,
    useFineModeNav,
    genomicLoci,
    expandGenomicLoci,
  };
}
