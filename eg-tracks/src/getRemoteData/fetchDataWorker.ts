import _, { padEnd } from "lodash";
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
import {
  localTrackFetchFunction,
  textFetchFunction,
} from "@/getLocalData/localFetchData";
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
const componentMap: { [key: string]: any } = {
  geneannotation: "",
  bed: "",
  bigwig: "",
  dynseq: "",
  methylc: "",
  hic: "",
  genomealign: "",

  categorical: "",
  longrange: "",
  biginteract: "",
  repeatmasker: "",
  bigbed: "",
  refbed: "",
  matplot: "",
  ruler: "",
  modbed: "",
  dynamic: "",
  bedgraph: "",
  qbed: "",
  boxplot: "",
  jaspar: "",
  dynamichic: "",
  dynamicbed: "",
  dbedgraph: "",
  dynamiclongrange: "",
  snp: "",
  bam: "",
  omeroidr: "",
  error: "",
};
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
  let primaryGenName = event.data.primaryGenName;
  let fetchResults: Array<any> = [];
  let genomicLoci = event.data.genomicLoci;
  let expandGenomicLoci = event.data.expandedGenLoci;
  let initGenomicLoci = event.data.initGenomicLoci;
  let trackDefaults = event.data.trackModelArr;
  let genomicFetchCoord = {};

  let useFineModeNav = event.data.useFineModeNav;

  genomicFetchCoord[`${primaryGenName}`] = {
    genomicLoci,
    expandGenomicLoci,
    initGenomicLoci,
  };
  genomicFetchCoord[`${primaryGenName}`]["primaryVisData"] = event.data.visData;
  //____________________________________________________________________________________________________________________________________________________________________
  //____________________________________________________________________________________________________________________________________________________________________
  //____________________________________________________________________________________________________________________________________________________________________
  // step 1: check if there genome align tracks because it alters other track positions because of gaps
  let genomeAlignTracks = trackDefaults.filter((items, index) => {
    return items.type === "genomealign";
  });
  const tmpQueryGenObj: { [key: string]: any } = {};
  tmpQueryGenObj[`${primaryGenName}`] = "";
  genomeAlignTracks.map((items, index) => {
    if (items.querygenome) {
      tmpQueryGenObj[`${items.querygenome}`] = "";
    } else if (items.metadata && items.metadata.genome) {
      tmpQueryGenObj[`${items.metadata.genome}`] = "";
    }
  });

  if (genomeAlignTracks.length > 0) {
    event.data.visData.visRegion;

    // step 2: fetch genome align data and put them into an array
    //group all the genomealign track and fetch once in getGenomealign
    //return all the genomealign in an array
    (
      await getGenomeAlignment(event.data.visData.visRegion, genomeAlignTracks)
    ).map((item) => {
      // if there is a genomealigntrack and its in fine mode then
      // we change the primaryVisdata because other tracks relies on the visdata
      if (!("error" in item.result)) {
        genomicFetchCoord[`${primaryGenName}`]["primaryVisData"] =
          item.result.primaryVisData;

        //save the genomic location so that track that has query as parent can use that data to get data\

        genomicFetchCoord[`${item.queryName}`] = {
          queryGenomicCoord: new Array(item.queryGenomicCoord),
          id: item.id,
          queryRegion: item.result.queryRegion,
        };
      }
      item["metadata"] = { "track type": "genomealign" };
      item["result"] = [item.result];
      fetchResults.push(item);
    });
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
    let oldRecordsArray;
    try {
      oldRecordsArray = await Promise.all(
        genomeAlignTracks.map(async (item, index) => {
          try {
            let curGenomeAlignRespond = await trackFetchFunction.genomealign({
              nav: expandGenomicLoci,
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
            let recordArr: any = curGenomeAlignRespond;

            for (const record of recordArr) {
              let data = JSON5.parse("{" + record[3] + "}");
              record[3] = data;
              records.push(new AlignmentRecord(record));
            }
            // Added trackId for genomeAlign tracks so we can put the correct data to the correct track after we send the data back

            return {
              query: item.querygenome,
              records: records,
              isBigChain: false,
              id: item.id,
            };
          } catch (error) {
            return {
              query: item.querygenome,
              name: item.querygenome,
              isBigChain: false,
              id: item.id,
              result: {
                error: `Error processing genome align track with id ${
                  item.id
                }: ${"Error"}`,
              },
              error: `Error processing genome align track with id ${
                item.id
              }: ${"Error"}`,
            };
          }
        })
      );

      // Handle the oldRecordsArray as needed
    } catch (error) {
      console.error("Error fetching genome align tracks:", error);
      // Handle the situation where the entire Promise.all fails, if necessary
    }
    // step 3 sent the array of genomealign fetched data to find the gaps and get drawData

    let successFetch: Array<any> = [];
    for (let curGenomeAlign of oldRecordsArray) {
      if (!("error" in curGenomeAlign)) {
        successFetch.push(curGenomeAlign);
      } else {
        result.push(curGenomeAlign);
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
  let leftOverTrackModels = trackDefaults.filter((items, index) => {
    return items.type !== "genomealign";
  });

  await Promise.all(
    leftOverTrackModels.map(async (item, index) => {
      const trackType = item?.type || item?.metadata["Track type"];
      const genomeName = item.genome ? item.genome : event.data.primaryGenName;
      const id = item.id;
      const url = item.url;
      let foundInvalidTrack = false;
      if (
        (item.metadata.genome && !(item.metadata.genome in tmpQueryGenObj)) ||
        !(item.type in componentMap)
      ) {
        foundInvalidTrack = true;
      }
      if (foundInvalidTrack) {
        fetchResults.push({
          name: trackType,
          id: id,
          metadata: item.metadata,
          trackModel: item,
        });
      } else if (trackType in { hic: "", ruler: "", dynamichic: "" }) {
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
      } else if (trackType === "bam") {
        let curFetchNav;

        if (
          "genome" in item.metadata &&
          item.metadata.genome !== undefined &&
          item.metadata.genome !== event.data.primaryGenName
        ) {
          curFetchNav =
            genomicFetchCoord[`${item.metadata.genome}`].queryGenomicCoord;
        } else if (
          useFineModeNav ||
          item.type === "longrange" ||
          item.type === "biginteract"
        ) {
          curFetchNav = new Array(expandGenomicLoci);
        } else if (event.data.initial === 1) {
          curFetchNav = initGenomicLoci;
        } else {
          curFetchNav = new Array(genomicLoci);
        }
        fetchResults.push({
          name: trackType,
          id: id,
          metadata: item.metadata,
          trackModel: item,
          curFetchNav,
        });
      } else if (
        trackType in
        {
          matplot: "",
          dynamic: "",
          dynamicbed: "",
          dynamiclongrange: "",
        }
      ) {
        let tmpResults = await Promise.all(
          item.tracks.map(async (trackItem, index) => {
            return event.data.initial !== 1
              ? (await fetchData(trackItem, genomeName, id)).flat(1)
              : fetchData(trackItem, genomeName, id);
          })
        );
        if (event.data.initial === 1 && trackType === "dynamiclongrange") {
          tmpResults = tmpResults.flat(1);
        }
        fetchResults.push({
          name: trackType,
          result: tmpResults,
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
      trackModel.type === "longrange" ||
      trackModel.type === "biginteract"
    ) {
      curFetchNav = new Array(expandGenomicLoci);
    } else if (event.data.initial === 1) {
      curFetchNav = initGenomicLoci;
    } else {
      curFetchNav = new Array(genomicLoci);
    }

    if (trackModel.fileObj !== "" && trackModel.url === "") {
      for (let i = 0; i < curFetchNav.length; i++) {
        let curRespond;

        curRespond = await Promise.all(
          trackModel.isText
            ? await textFetchFunction[trackModel.type]({
                basesPerPixel: event.data.bpRegionSize / event.data.windowWidth,
                nav: curFetchNav[i],
                trackModel,
              })
            : await localTrackFetchFunction[trackModel.type]({
                basesPerPixel: event.data.bpRegionSize / event.data.windowWidth,
                nav: curFetchNav[i],
                trackModel,
              })
        );

        responses.push(_.flatten(curRespond));
      }
    } else {
      for (let i = 0; i < curFetchNav.length; i++) {
        let curRespond;
        try {
          if (trackModel.type in { geneannotation: "", snp: "" }) {
            curRespond = await Promise.all(
              curFetchNav[i].map(async (nav, index) => {
                return await trackFetchFunction[trackModel.type]({
                  genomeName:
                    "genome" in trackModel.metadata
                      ? trackModel.metadata.genome
                      : primaryGenName,
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
            curRespond = await Promise.all([
              trackFetchFunction[trackModel.type]({
                basesPerPixel: event.data.bpRegionSize / event.data.windowWidth,
                nav: curFetchNav[i],
                trackModel,
              }),
            ]);
          }

          responses.push(_.flatten(curRespond));
        } catch (error) {
          console.error(
            `Error fetching data for track model type ${trackModel.type}:`,
            error
          );
          responses.push({ error: `Error fetching data: ${"ERERER"}` });
        }
      }
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
    trackDataIdx: event.data.trackDataIdx,
    genomicFetchCoord,
    bpX: event.data.bpX,
    useFineModeNav,
    genomicLoci,
    expandGenomicLoci,
  });
};
