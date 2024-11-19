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

//TO_DOOOOOOOOO have a way to get option from trackManager for each track and set it here if custom options are defined while getting the fetched data
self.onmessage = async (event: MessageEvent) => {
  let primaryGenName = event.data.primaryGenName;
  let fetchResults: Array<any> = [];
  let genomicLoci = event.data.genomicLoci;
  let expandGenomicLoci = event.data.expandedGenLoci;
  let initGenomicLoci = event.data.initGenomicLoci;
  let trackDefaults = event.data.trackModelArr;
  let genomicFetchCoord = {};
  let initNavLoci = event.data.initNavLoci;
  let useFineModeNav = event.data.useFineModeNav;

  genomicFetchCoord[`${primaryGenName}`] = {
    genomicLoci,
    expandGenomicLoci,
    initGenomicLoci,
    curFetchRegionNav: event.data.curFetchRegionNav,
    initNavLoci,
  };

  //____________________________________________________________________________________________________________________________________________________________________
  //____________________________________________________________________________________________________________________________________________________________________
  //____________________________________________________________________________________________________________________________________________________________________
  // step 1: check if there genome align tracks because it alters other track positions because of gaps
  let genomeAlignTracks = trackDefaults.filter((items, index) => {
    return items.type === "genomealign";
  });

  if (genomeAlignTracks.length > 0) {
    genomicFetchCoord[`${primaryGenName}`]["primaryVisData"] = [];

    // step 2: fetch genome align data and put them into an array

    (
      await getGenomeAlignment(event.data.visData.visRegion, genomeAlignTracks)
    ).map((item) => {
      genomicFetchCoord[`${primaryGenName}`]["primaryVisData"] =
        item.result.primaryVisData;
      //save the genomic location so that track that has query as parent can use that data to get data
      genomicFetchCoord[`${item.queryName}`] = {
        queryGenomicCoord: new Array(item.queryGenomicCoord),
        id: item.id,
        queryRegion: item.result.queryRegion,
      };
      item["metadata"] = { "track type": "genomealign" };
      item["result"] = [item.result];
      fetchResults.push(item);
    });
  } else {
    genomicFetchCoord[`${primaryGenName}`]["primaryVisData"] =
      event.data.visData;
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

      result.push({
        queryName: query,
        result: alignment[`${query}`],
        id: alignment[`${query}`].id,
        name: "genomealign",
        queryGenomicCoord: queryGenomicCoords,
      });
    }

    return result;
  }

  // step 5 if there are normal tracks assciated with query coord then we use query genomic coord to fetch their data
  //____________________________________________________________________________________________________________________________________________________________________
  //____________________________________________________________________________________________________________________________________________________________________
  //____________________________________________________________________________________________________________________________________________________________________
  let normDefaultTracks = trackDefaults.filter((items, index) => {
    return items.type !== "genomealign";
  });

  await Promise.all(
    normDefaultTracks.map(async (item, index) => {
      const trackType = item.type;
      const genomeName = item.genome ? item.genome : event.data.primaryGenName;
      const id = item.id;
      const url = item.url;

      if (trackType in { hic: "", ruler: "", dynamichic: "" }) {
        fetchResults.push({
          name: trackType,
          id: id,
          metadata: item.metadata,
          trackModel: item,
        });
      } else if (trackType === "geneannotation") {
        let genRefResponses: Array<any> = await fetchData(item, genomeName, id);
        fetchResults.push({
          name: trackType,
          // I fetch three sections so I need to have an array with 3 different section data [{},{},{}]
          // when moving left and right get only 1 region so [{}] I just sent {}
          result:
            event.data.initial !== 1 ? genRefResponses[0] : genRefResponses,
          id: id,
          metadata: item.metadata,
        });
      } else if (trackType in { matplot: "", dynamic: "" }) {
        let tmpReponse = await Promise.all(
          item.tracks.map(async (trackItem, index) => {
            return event.data.initial !== 1
              ? (await fetchData(trackItem, genomeName, id)).flat(1)
              : fetchData(trackItem, genomeName, id);
          })
        );

        fetchResults.push({
          name: trackType,
          result: tmpReponse,
          id: id,
          metadata: item.metadata,
        });
      } else {
        let responses: Array<any> = await fetchData(item, genomeName, id);
        fetchResults.push({
          name: trackType,
          result: event.data.initial !== 1 ? responses[0] : responses,
          id: id,
          metadata: item.metadata,
        });
      }
    })
  );

  async function fetchData(trackModel, genomeName, id): Promise<Array<any>> {
    let responses: Array<any> = [];
    let curFetchNav;

    if (
      "genome" in trackModel.metadata &&
      trackModel.metadata.genome !== undefined &&
      trackModel.metadata.genome !== event.data.primaryGenName
    ) {
      curFetchNav =
        genomicFetchCoord[`${trackModel.metadata.genome}`].queryGenomicCoord;
    } else if (
      useFineModeNav ||
      trackModel.type === "longrange" ||
      trackModel.type === "biginteract"
    ) {
      curFetchNav = new Array(expandGenomicLoci);
    } else if (event.data.initial === 1) {
      curFetchNav = initGenomicLoci;
    } else {
      curFetchNav = new Array(genomicLoci);
    }
    console.log(curFetchNav, "individial genomic fetch interval");
    for (let i = 0; i < curFetchNav.length; i++) {
      let curRespond;
      if (trackModel.type === "geneannotation") {
        curRespond = await Promise.all(
          await curFetchNav[i].map((nav, index) => {
            return trackFetchFunction[trackModel.type]({
              genomeName,
              name: trackModel.name,
              chr: nav.chr,
              start: nav.start,
              end: nav.end,
              nav,
              trackModel,
              trackType: trackModel.type,
            });
          })
        );
      } else {
        curRespond = await Promise.all(
          await trackFetchFunction[trackModel.type]({
            genomeName,
            name: trackModel.name,
            basesPerPixel: event.data.bpRegionSize / event.data.windowWidth,
            nav: curFetchNav[i],
            trackModel,
            trackType: trackModel.type,
          })
        );
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

  postMessage({
    fetchResults,
    side: event.data.trackSide,
    xDist: event.data.xDist,
    initial: event.data.initial,
    curFetchRegionNav: event.data.curFetchRegionNav,
    genomicFetchCoord,
    bpX: event.data.bpX,
    useFineModeNav,
    genomicLoci,
    expandGenomicLoci,
  });
};
