import { SequenceSegment } from "../models/AlignmentStringUtils";
import AlignmentRecord from "../models/AlignmentRecord";
import OpenInterval from "../models/OpenInterval";
import Feature from "../models/Feature";
import { ViewExpansion } from "../models/RegionExpander";
import DisplayedRegionModel from "../models/DisplayedRegionModel";
import fetchTypeMap from "./fetchTypeMap";
import {
  localFetchTypeMap,
  textFetchTypeMap,
} from "../getLocalData/localFetchTypeMap";

import { AlignmentSegment } from "../models/AlignmentSegment";
import { NavContextBuilder } from "../models/NavContextBuilder";

import ChromosomeInterval from "../models/ChromosomeInterval";

import NavigationContext from "../models/NavigationContext";

import { MultiAlignmentViewCalculator } from "../components/GenomeView/TrackComponents/GenomeAlignComponents/MultiAlignmentViewCalculator";

import { niceBpCount } from "../models/util";
import JSON5 from "json5";

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

export const chromAlias: Record<string, Set<string>> = {
  chr1: new Set([
    "1",
    "CM000663.1",
    "NC_000001.10",
    "CM000663.2",
    "NC_000001.11",
  ]),
  chr2: new Set([
    "2",
    "CM000664.1",
    "NC_000002.11",
    "CM000664.2",
    "NC_000002.12",
  ]),
  chr3: new Set([
    "3",
    "CM000665.1",
    "NC_000003.11",
    "CM000665.2",
    "NC_000003.12",
  ]),
  chr4: new Set([
    "4",
    "CM000666.1",
    "NC_000004.11",
    "CM000666.2",
    "NC_000004.12",
  ]),
  chr5: new Set([
    "5",
    "CM000667.1",
    "NC_000005.9",
    "CM000667.2",
    "NC_000005.10",
  ]),
  chr6: new Set([
    "6",
    "CM000668.1",
    "NC_000006.11",
    "CM000668.2",
    "NC_000006.12",
  ]),
  chr7: new Set([
    "7",
    "CM000669.1",
    "NC_000007.13",
    "CM000669.2",
    "NC_000007.14",
  ]),
  chr8: new Set([
    "8",
    "CM000670.1",
    "NC_000008.10",
    "CM000670.2",
    "NC_000008.11",
  ]),
  chr9: new Set([
    "9",
    "CM000671.1",
    "NC_000009.11",
    "CM000671.2",
    "NC_000009.12",
  ]),
  chr10: new Set([
    "10",
    "CM000672.1",
    "NC_000010.10",
    "CM000672.2",
    "NC_000010.11",
  ]),
  chr11: new Set([
    "11",
    "CM000673.1",
    "NC_000011.9",
    "CM000673.2",
    "NC_000011.10",
  ]),
  chr12: new Set([
    "12",
    "CM000674.1",
    "NC_000012.11",
    "CM000674.2",
    "NC_000012.12",
  ]),
  chr13: new Set([
    "13",
    "CM000675.1",
    "NC_000013.10",
    "CM000675.2",
    "NC_000013.11",
  ]),
  chr14: new Set([
    "14",
    "CM000676.1",
    "NC_000014.8",
    "CM000676.2",
    "NC_000014.9",
  ]),
  chr15: new Set([
    "15",
    "CM000677.1",
    "NC_000015.9",
    "CM000677.2",
    "NC_000015.10",
  ]),
  chr16: new Set([
    "16",
    "CM000678.1",
    "NC_000016.9",
    "CM000678.2",
    "NC_000016.10",
  ]),
  chr17: new Set([
    "17",
    "CM000679.1",
    "NC_000017.10",
    "CM000679.2",
    "NC_000017.11",
  ]),
  chr18: new Set([
    "18",
    "CM000680.1",
    "NC_000018.9",
    "CM000680.2",
    "NC_000018.10",
  ]),
  chr19: new Set([
    "19",
    "CM000681.1",
    "NC_000019.9",
    "CM000681.2",
    "NC_000019.10",
  ]),
  chr20: new Set([
    "20",
    "CM000682.1",
    "NC_000020.10",
    "CM000682.2",
    "NC_000020.11",
  ]),
  chr21: new Set([
    "21",
    "CM000683.1",
    "NC_000021.8",
    "CM000683.2",
    "NC_000021.9",
  ]),
  chr22: new Set([
    "22",
    "CM000684.1",
    "NC_000022.10",
    "CM000684.2",
    "NC_000022.11",
  ]),
  chrX: new Set([
    "X",
    "CM000685.1",
    "NC_000023.10",
    "CM000685.2",
    "NC_000023.11",
  ]),
  chrY: new Set([
    "Y",
    "CM000686.1",
    "NC_000024.9",
    "CM000686.2",
    "NC_000024.10",
  ]),
  chrM: new Set(["M", "MT", "NC_001807.4", "J01415.2", "NC_012920.1"]),
};
const componentMap: { [key: string]: any } = {
  geneannotation: "",
  bed: "",
  // bedcolor: "",
  bigbedcolor: "",
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

function isFetchError(r: unknown): r is { error: string } {
  return (
    r != null && !Array.isArray(r) && typeof r === "object" && "error" in r
  );
}

// Main processing function that can be used both as worker and regular function
export async function fetchGenomicData(data: any[]): Promise<any> {
  if (!Array.isArray(data)) {
    throw new Error(
      `fetchGenomicData expects an array, but received: ${typeof data}`,
    );
  }

  const objectPromises = data.map((dataItem) => {
    const primaryGenName = dataItem.primaryGenName;

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

    let genomicFetchCoord = dataItem.genomicFetchCoord || {
      [primaryGenName]: {
        genomicLoci,
        regionExpandLoci,
        initGenomicLoci,
        primaryVisData: dataItem.visData,
      },
    };

    const leftOverTrackModels = trackDefaults.filter(
      (items) => items && items.type !== "genomealign",
    );

    return Promise.all(
      leftOverTrackModels.map((item) => {
        const trackType = item?.type || item?.metadata["Track type"];
        const id = item.id;

        if (!(item.type in componentMap)) {
          return Promise.resolve({
            name: trackType,
            id: id,
            metadata: item.metadata,
            trackModel: item,
            result: [],
            errorType: "This track type is currently not supported. ",
          });
        } else if (
          item.metadata.genome &&
          !(item.metadata.genome in genomicFetchCoord)
        ) {
          return Promise.resolve({
            name: trackType,
            id: id,
            metadata: item.metadata,
            trackModel: item,
            result: [],
            errorType: `genomealign track with query genome "${item.metadata.genome}" is not found`,
          });
        } else if (item.error) {
          return Promise.resolve({
            name: trackType,
            id: id,
            metadata: item.metadata,
            trackModel: item,
            result: [],
            errorType: item.error,
          });
        } else if (trackType === "ruler") {
          return Promise.resolve({
            name: trackType,
            id: id,
            metadata: item.metadata,
            trackModel: item,
            result: [],
          });
        } else if (
          trackType in
          {
            matplot: "",
            dynamic: "",
            dynamicbed: "",
            dynamiclongrange: "",
            dynamichic: "",
          }
        ) {
          return Promise.all(
            item.tracks.map((trackItem) => {
              trackItem["shouldPlaceRegion"] = item.shouldPlaceRegion;
              return fetchData(trackItem);
            }),
          ).then((subTrackResults) => {
            let responses: Array<any> | { [key: string]: any } = [];
            let error: any = null;
            let fileInfos: any = null;
            for (const response of subTrackResults) {
              if (isFetchError(response)) {
                error = response.error;
                responses = [];
                break;
              }
              // dynamichic's sub-tracks are hic files, which resolve to
              // `{ data, fileInfos }` instead of a plain records array. Unwrap
              // so each sub-track contributes its interactions directly, the
              // same shape a lone hic track ends up with.
              if (
                trackType === "dynamichic" &&
                response &&
                typeof response === "object" &&
                !Array.isArray(response) &&
                "data" in response
              ) {
                fileInfos = fileInfos ?? response.fileInfos;
                responses.push(response.data);
              } else {
                responses.push(response);
              }
            }
            console.log(responses, item);
            return {
              name: trackType,
              result: responses,
              fileInfos,
              id: id,
              metadata: item.metadata,
              trackModel: item,
              errorType: error,
            };
          });
        } else {
          return fetchData(item).then((responses: any) => {
            let result;
            let error: any = null;
            if (isFetchError(responses)) {
              result = [];
              error = responses.error;
            } else {
              result =
                item.type === "hic" &&
                typeof responses === "object" &&
                !Array.isArray(responses) &&
                "data" in responses
                  ? responses.data
                  : responses;
            }

            return {
              name: trackType,
              result: Array.isArray(result) ? result : [],
              fileInfos:
                typeof responses === "object" &&
                !Array.isArray(responses) &&
                "fileInfos" in responses
                  ? responses.fileInfos
                  : null,
              id: id,
              metadata: item.metadata,
              trackModel: item,
              errorType: error,
            };
          });
        }
      }),
    ).then((resultsArray) => ({
      fetchResults: resultsArray,
      trackDataIdx,
      genomicFetchCoord,
      trackToDrawId,
      missingIdx,
      _workerIdx: dataItem._workerIdx,
    }));

    function fetchData(trackModel): Promise<Array<any>> {
      let curFetchNav;
      let visRegion =
        genomicFetchCoord[primaryGenName].primaryVisData.visRegion;
      const { genome } = trackModel.metadata;

      if (genome && genome !== "" && genome !== primaryGenName) {
        if (
          genomicFetchCoord[genome]?.queryGenomicCoord &&
          genomicFetchCoord[genome]?.queryRegion
        ) {
          curFetchNav = genomicFetchCoord[genome].queryGenomicCoord;
          visRegion = genomicFetchCoord[genome].queryRegion;
        } else if (
          trackModel.type === "longrange" ||
          trackModel.type === "biginteract" ||
          trackModel.type === "hic"
        ) {
          curFetchNav = regionExpandLoci;
        } else {
          curFetchNav = genomicLoci;
        }
      } else if (
        trackModel.type === "longrange" ||
        trackModel.type === "biginteract" ||
        trackModel.type === "hic"
      ) {
        curFetchNav = regionExpandLoci;
      } else if (trackModel.shouldPlaceRegion) {
        curFetchNav = regionExpandLoci;
      } else {
        curFetchNav = genomicLoci;
      }

      const isLocalFetch = trackModel.fileObj instanceof File;

      let fetchPromise: Promise<any>;

      if (isLocalFetch && trackModel.url === "") {
        fetchPromise = trackModel.isText
          ? textFetchTypeMap[trackModel.type]({
              basesPerPixel: bpRegionSize / windowWidth,
              nav: curFetchNav,
              trackModel,
            })
          : localFetchTypeMap[trackModel.type]({
              basesPerPixel: bpRegionSize / windowWidth,
              nav: curFetchNav,
              trackModel,
              visRegion: visRegion,
            });
      } else if (!isLocalFetch) {
        if (trackModel.type in { geneannotation: "", snp: "" }) {
          fetchPromise = fetchTypeMap[trackModel.type]({
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
          if (!trackModel.url) {
            fetchPromise = Promise.reject(
              new Error(`No URL provided for track ${trackModel.name}`),
            );
          } else {
            fetchPromise = fetchTypeMap[trackModel.type]({
              basesPerPixel: bpRegionSize / windowWidth,
              nav: curFetchNav,
              trackModel,
              visRegion: visRegion,
            });
          }
        }
      } else {
        fetchPromise = Promise.resolve(null);
      }

      return fetchPromise.catch((error) => ({
        error:
          error instanceof Error
            ? error.message
            : `Error fetching data for track ${trackModel.name}`,
      }));
    }
  });

  return Promise.all(objectPromises);
}

export async function fetchGenomeAlignData(data: any): Promise<any> {
  const {
    regionExpandLoci,
    trackToFetch,
    genomicLoci,
    useFineModeNav,
    primaryGenName,
    initGenomicLoci,
    viewWindowGenomicLoci,
    windowWidth,
    visData,
    trackDataIdx,
    missingIdx,
  } = data;

  const fetchResults: any = {};
  const trackToDrawId: any = {};
  const genomicFetchCoord: any = {
    [primaryGenName]: {
      genomicLoci,
      regionExpandLoci,
      initGenomicLoci,
    },
  };

  const fetchArrNav = useFineModeNav ? regionExpandLoci : viewWindowGenomicLoci;

  // Helper to map features to Feature objects
  const mapFeatures = (features: any[]) =>
    features.map(
      (feature) =>
        new Feature(
          feature.name,
          new ChromosomeInterval(
            feature.locus.chr,
            feature.locus.start,
            feature.locus.end,
          ),
        ),
    );

  async function getGenomeAlignment(curVisData, genomeAlignTracks) {
    const visRegionFeatures = mapFeatures(
      visData.visRegion._navContext._features,
    );
    const visRegionNavContext = new NavigationContext(
      visData.visRegion._navContext._name,
      visRegionFeatures,
    );
    const visRegion = new DisplayedRegionModel(
      visRegionNavContext,
      curVisData._startBase,
      curVisData._endBase,
    );

    const viewWindowRegionFeatures = mapFeatures(
      visData.viewWindowRegion._navContext._features,
    );
    const viewWindowRegionNavContext = new NavigationContext(
      visData.viewWindowRegion._navContext._name,
      viewWindowRegionFeatures,
    );
    const viewWindowRegion = new DisplayedRegionModel(
      viewWindowRegionNavContext,
      visData.viewWindowRegion._startBase,
      visData.viewWindowRegion._endBase,
    );

    const viewExpansion: ViewExpansion = {
      visWidth: visData.visWidth,
      visRegion,
      viewWindow: new OpenInterval(windowWidth, windowWidth * 2),
      viewWindowRegion,
    };

    await Promise.all(
      genomeAlignTracks.map(async (item, index) => {
        let rawRecords;
        let errorType: any = null;
        try {
          const responds = await fetchTypeMap["genomealign"]({
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

          // TabixSource now returns per-locus groups ({ chr, data }); flatten
          // back to the flat record list the alignment parser expects (matches
          // the old `_.flatten(dataForEachLocus)` shape).
          const flatRecords = responds.flatMap((entry: any) =>
            entry && Array.isArray(entry.data) ? entry.data : [entry],
          );

          const records = flatRecords.map((record) => {
            const parsedData = JSON5.parse("{" + record[3] + "}");
            if (!useFineModeNav) {
              parsedData.genomealign.targetseq = null;
              parsedData.genomealign.queryseq = null;
            }
            record[3] = parsedData;
            return new AlignmentRecord(record);
          });

          rawRecords = records;
          trackToDrawId[item.id] = "";
        } catch (error) {
          rawRecords = [];
          errorType =
            error instanceof Error
              ? error.message
              : `Error fetching genome align track with id ${item.id}`;
        }

        fetchResults[item.id] = {
          name: item.name,
          records: rawRecords,
          query: item.querygenome,
          id: item.id,
          trackModel: item,
          metadata: item.metadata,
          isBigChain: false,
          errorType,
        };
      }),
    );

    // step 3 sent the array of genomealign fetched data to find the gaps and get drawData

    const successFetch = Object.values(fetchResults).filter(
      (result: any) => !result.errorType,
    );

    const multiCalInstance = new MultiAlignmentViewCalculator(primaryGenName);
    const alignment = multiCalInstance.multiAlign(viewExpansion, successFetch);

    // in old epigenome these data are calcualted while in the component, but we calculate the data here using the instantiated class
    // because class don't get sent over Workers and Internet so we have to get the data here.

    for (const query in alignment) {
      const queryAlignment = alignment[query];

      if (!useFineModeNav) {
        const segmentArray = queryAlignment.drawData.flatMap(
          (placement) => placement.segments,
        );

        alignment[query] = {
          ...queryAlignment,
          strandList: segmentArray.map((segment) => segment.record.queryStrand),
          targetXSpanList: segmentArray.map((segment) => segment.targetXSpan),
          queryXSpanList: segmentArray.map((segment) => segment.queryXSpan),
          targetLocusList: segmentArray.map((segment) =>
            segment.visiblePart.getLocus().toString(),
          ),
          queryLocusList: segmentArray.map((segment) =>
            segment.visiblePart.getQueryLocus().toString(),
          ),
          lengthList: segmentArray.map((segment) =>
            niceBpCount(segment.visiblePart.getLength()),
          ),
          queryLengthList: segmentArray.map((segment) =>
            niceBpCount(segment.visiblePart.getQueryLocus().getLength()),
          ),
        };
      }

      genomicFetchCoord[query] = {
        queryGenomicCoord: queryAlignment.queryRegion
          .getGenomeIntervals()
          .map((locus) => locus.serialize()),
        id: queryAlignment.id,
        queryRegion: queryAlignment.queryRegion,
      };

      alignment[query].drawData = queryAlignment.drawData.map((placement) => {
        const { targetXSpan } = placement;

        if (useFineModeNav) {
          const targetSequence = placement.visiblePart.getTargetSequence();
          const querySequence = placement.visiblePart.getQuerySequence();

          return {
            ...placement,
            targetSequence,
            querySequence,
            nonGapsQuery: placement.querySegments.filter(
              (segment) => !segment.isGap,
            ),
            baseWidth: targetXSpan.getLength() / targetSequence.length,
            targetLocus: placement.visiblePart.getLocus().toString(),
            queryLocus: placement.visiblePart.getQueryLocus().toString(),
            nonGapsTarget: placement.targetSegments.filter(
              (segment) => !segment.isGap,
            ),
            isReverseStrandQuery: placement.record.getIsReverseStrandQuery(),
            queryLocusFine: placement.visiblePart.getQueryLocusFine(),
          };
        } else {
          return {
            ...placement,
            estimatedLabelWidth: placement.queryFeature.toString().length,
          };
        }
      });

      // step 4 create obj that holds primary and query genome genomic coordinate because some other tracks might
      // align to the query coord

      genomicFetchCoord[primaryGenName].primaryVisData =
        queryAlignment.primaryVisData;
      genomicFetchCoord[primaryGenName].navContextBuilder =
        queryAlignment?.navContextBuilder;

      //save the genomic location so that track that has query as parent can use that data to get data

      fetchResults[queryAlignment.id].records = alignment[query];
    }
  }

  if (trackToFetch.length > 0) {
    await getGenomeAlignment(visData.visRegion, trackToFetch);
  }

  return {
    fetchResults,
    navData: {
      ...data,
      genomicFetchCoord,
      trackToDrawId,
      trackDataIdx,
      missingIdx,
      regionSetStartBp:
        visData?.visRegion?._endBase - visData?.visRegion?._startBase ===
        data.bpRegionSize
          ? 0
          : null,
      fetchNewRegion: data.fetchNewRegion,
      dragX: data.dragX,
    },
    dragX: data.dragX,
  };
}
