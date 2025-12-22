import { SequenceSegment } from "../models/AlignmentStringUtils";
import AlignmentRecord from "../models/AlignmentRecord";
import OpenInterval from "../models/OpenInterval";
import Feature from "../models/Feature";
import { ViewExpansion } from "../models/RegionExpander";
import DisplayedRegionModel from "../models/DisplayedRegionModel";
import trackFetchFunction from "./fetchTrackData";
import {
  localTrackFetchFunction,
  textFetchFunction,
} from "../getLocalData/localFetchData";

import { AlignmentSegment } from "../models/AlignmentSegment";
import { NavContextBuilder } from "../models/NavContextBuilder";

import ChromosomeInterval from "../models/ChromosomeInterval";

import NavigationContext from "../models/NavigationContext";

import { MultiAlignmentViewCalculator } from "../components/GenomeView/TrackComponents/GenomeAlignComponents/MultiAlignmentViewCalculator";

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
  // bedcolor: "",
  bigwig: "",
  dynseq: "",
  methylc: "",
  hic: "",
  genomealign: "",
  vcf: "",
  categorical: "",
  longrange: "",
  biginteract: "",
  repeatmasker: "",
  rmskv2: "",
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

// Custom parser for genome align data format
function parseCustomFormat(str: string): any {
  // Remove outer braces
  str = str.slice(1, -1);

  const result: any = {};

  // Split by top-level commas (not inside nested objects)
  const parts = str.split(/,(?![^{]*})/);

  parts.forEach((part) => {
    const colonIndex = part.indexOf(":");
    const key = part.substring(0, colonIndex).trim();
    let value = part.substring(colonIndex + 1).trim();

    if (value.startsWith("{")) {
      // Parse nested object
      result[key] = parseNestedObject(value);
    } else {
      // Parse primitive value
      result[key] = isNaN(Number(value)) ? value : Number(value);
    }
  });

  return result;
}

function parseNestedObject(str: string): any {
  str = str.slice(1, -1); // Remove braces
  const obj: any = {};

  const regex = /(\w+):(".*?"|[\w+-]+)/g;
  let match;

  while ((match = regex.exec(str)) !== null) {
    const key = match[1];
    let value: any = match[2];

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1); // Remove quotes
    } else if (!isNaN(Number(value))) {
      value = Number(value);
    }

    obj[key] = value;
  }

  return obj;
}

// Main processing function that can be used both as worker and regular function
export async function fetchGenomicData(data: any[]): Promise<any> {
  // Ensure data is an array
  if (!Array.isArray(data)) {
    throw new Error(
      `fetchGenomicData expects an array, but received: ${typeof data}`
    );
  }

  const objectPromises = data.map((dataItem) => {
    const primaryGenName = dataItem.primaryGenName;
    const initial = dataItem.initial;
    const fetchResults: Array<any> = [];
    const genomicLoci = dataItem.genomicLoci;
    const regionExpandLoci = dataItem.regionExpandLoci
      ? dataItem.regionExpandLoci
      : dataItem.genomicLoci;
    const initGenomicLoci = dataItem.initGenomicLoci;
    const trackDefaults = dataItem.trackModelArr;
    const bpRegionSize = dataItem.bpRegionSize;
    const windowWidth = dataItem.windowWidth;
    const trackToDrawId = dataItem.trackToDrawId || {};
    const trackDataIdx = dataItem.trackDataIdx;
    const missingIdx = dataItem.missingIdx;
    const useFineModeNav = dataItem.useFineModeNav;
    let genomicFetchCoord = dataItem.genomicFetchCoord || {
      [primaryGenName]: {
        genomicLoci,
        regionExpandLoci,
        initGenomicLoci,
        primaryVisData: dataItem.visData,
      },
    };

    const leftOverTrackModels = trackDefaults.filter(
      (items) => items && items.type !== "genomealign"
    );

    // No await here, just return the promise
    return Promise.all(
      leftOverTrackModels.map(async (item) => {
        const trackType = item?.type || item?.metadata["Track type"];
        const id = item.id;
        let foundInvalidTrack = false;
        if (
          (item.metadata.genome &&
            !(item.metadata.genome in genomicFetchCoord)) ||
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
            result: { error: "This track type is currently not supported. " },
          });
        } else if (trackType in { hic: "", dynamichic: "" }) {
          fetchResults.push({
            name: trackType,
            id: id,
            metadata: item.metadata,
            trackModel: item,
          });
        } else if (trackType === "ruler") {
          fetchResults.push({
            name: trackType,
            id: id,
            metadata: item.metadata,
            trackModel: item,
            result: [],
          });
        } else if (trackType === "geneannotation") {
          // Only await here, not in the map above
          const genRefResponses = await fetchData(item);
          fetchResults.push({
            name: trackType,
            result: genRefResponses[0],
            id: id,
            metadata: item.metadata,
            trackModel: item,
          });
        } else if (trackType === "bam") {
          let curFetchNav;
          if (
            "genome" in item.metadata &&
            item.metadata.genome !== undefined &&
            item.metadata.genome !== primaryGenName
          ) {
            curFetchNav =
              genomicFetchCoord[
                item.metadata.genome === ""
                  ? primaryGenName
                  : item.metadata.genome
              ].queryGenomicCoord;
          } else if (initial === 1) {
            curFetchNav = initGenomicLoci;
          } else {
            curFetchNav = Array(genomicLoci);
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
          let hasError = false;
          // Use Promise.all for all tracks, no await inside map
          const tmpResults = await Promise.all(
            item.tracks.map(async (trackItem) => {
              const result = (await fetchData(trackItem)).flat(1);
              if (typeof result[0] === "object" && "error" in result[0]) {
                hasError = true;
              }
              return result;
            })
          );
          fetchResults.push({
            name: trackType,
            result: hasError
              ? { error: "Fetch failed: data source is not valid" }
              : tmpResults,
            id: id,
            metadata: item.metadata,
            trackModel: item,
          });
        } else {
          const responses = await fetchData(item);
          fetchResults.push({
            name: trackType,
            result: responses[0],
            id: id,
            metadata: item.metadata,
            trackModel: item,
          });
        }
      })
    ).then(() => ({
      fetchResults,
      trackDataIdx,
      genomicFetchCoord,
      trackToDrawId,
      missingIdx,
    }));

    async function fetchData(trackModel): Promise<Array<any>> {
      let responses: Array<any> = [];
      let curFetchNav;
      const { genome } = trackModel.metadata;

      if (genome && genome !== "" && genome !== primaryGenName) {
        curFetchNav = genomicFetchCoord[genome].queryGenomicCoord;
      } else if (
        trackModel.type === "longrange" ||
        trackModel.type === "biginteract"
      ) {
        curFetchNav = regionExpandLoci;
      } else {
        curFetchNav = genomicLoci;
      }

      const isLocalFetch = trackModel.fileObj instanceof File;
      if (isLocalFetch && trackModel.url === "") {
        const curRespond = trackModel.isText
          ? await textFetchFunction[trackModel.type]({
              basesPerPixel: bpRegionSize / windowWidth,
              nav: curFetchNav,
              trackModel,
            })
          : await localTrackFetchFunction[trackModel.type]({
              basesPerPixel: bpRegionSize / windowWidth,
              nav: curFetchNav,
              trackModel,
            });

        if (
          curRespond &&
          typeof curRespond === "object" &&
          curRespond.hasOwnProperty("error")
        ) {
          responses.push({
            error: curRespond.message,
          });
        } else {
          responses.push(curRespond);
        }
      } else if (!isLocalFetch) {
        let curRespond;
        try {
          if (trackModel.type in { geneannotation: "", snp: "" }) {
            curRespond = await trackFetchFunction[trackModel.type]({
              genomeName:
                "genome" in trackModel.metadata
                  ? trackModel.metadata.genome
                  : trackModel.genome
                  ? trackModel.genome
                  : primaryGenName,
              name: trackModel.name,

              nav: curFetchNav,
              trackModel,
              trackType: trackModel.type,
            });
          } else {
            curRespond = await Promise.all([
              trackFetchFunction[trackModel.type]({
                basesPerPixel: bpRegionSize / windowWidth,
                nav: curFetchNav,
                trackModel,
              }),
            ]);
          }

          responses.push(curRespond.flat());
        } catch (error) {
          console.error(
            `Error fetching data for track model type ${trackModel.type}:`,
            error
          );
          responses.push({
            error: "Data fetch failed.",
          });
        }
      } else {
        responses.push({
          error: "Fetch failed: data source is not valid",
        });
      }
      return responses;
    }
  });

  const results = await Promise.all(objectPromises);

  return results;
}

export async function fetchGenomeAlignData(data: any): Promise<any> {
  console.log(data);
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

  const fetchArrNav = useFineModeNav
    ? regionExpandLoci
    : data.viewWindowGenomicLoci;

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

        try {
          const responds = await trackFetchFunction["genomealign"]({
            nav: fetchArrNav,
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
            let data = parseCustomFormat("{" + record[3] + "}");

            record[3] = data;
            records.push(new AlignmentRecord(record));
          }
          // Added trackId for genomeAlign tracks so we can put the correct data to the correct track after we send the data back

          rawRecords = records;
          trackToDrawId[`${item.id}`] = "";
        } catch (error) {
          rawRecords = {
            error: `Error fetching genome align track with id ${item.id}`,
          };
        }

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

      genomicFetchCoord[`${query}`] = {
        queryGenomicCoord: alignment[`${query}`].queryRegion
          .getGenomeIntervals()
          .map((locus) => locus.serialize()),
        id: alignment[`${query}`].id,
        queryRegion: alignment[`${query}`].queryRegion,
      };

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

      genomicFetchCoord[`${primaryGenName}`]["primaryVisData"] =
        alignment[`${query}`].primaryVisData;

      //save the genomic location so that track that has query as parent can use that data to get data\

      fetchResults[`${alignment[`${query}`].id}`]["records"] =
        alignment[`${query}`];
    }
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
    dragX: data.dragX,
  };
}
