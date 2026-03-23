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

// Main processing function that can be used both as worker and regular function
export async function fetchGenomicData(data: any[]): Promise<any> {
  if (!Array.isArray(data)) {
    throw new Error(
      `fetchGenomicData expects an array, but received: ${typeof data}`,
    );
  }

  const objectPromises = data.map((dataItem) => {
    const primaryGenName = dataItem.primaryGenName;
    const initialLoad = dataItem.initialLoad;
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
      (items) => items && items.type !== "genomealign",
    );

    return Promise.all(
      leftOverTrackModels.map(async (item) => {
        const trackType = item?.type || item?.metadata["Track type"];
        const id = item.id;

        if (!(item.type in componentMap)) {
          fetchResults.push({
            name: trackType,
            id: id,
            metadata: item.metadata,
            trackModel: item,
            result: {
              error: "This track type is currently not supported. ",
              Error: "UnsupportedTrack",
            },
          });
        } else if (
          item.metadata.genome &&
          !(item.metadata.genome in genomicFetchCoord)
        ) {
          fetchResults.push({
            name: trackType,
            id: id,
            metadata: item.metadata,
            trackModel: item,
            result: {
              error: `genomealign track with query genome "${item.metadata.genome}" is not found`,
              Error: "UnsupportedTrack",
            },
          });
        } else if (item.Error) {
          fetchResults.push({
            name: trackType,
            id: id,
            metadata: item.metadata,
            trackModel: item,
            result: item.Error,
          });
        } else if (trackType === "ruler") {
          fetchResults.push({
            name: trackType,
            id: id,
            metadata: item.metadata,
            trackModel: item,
            result: [],
          });
        }
        // else if (trackType === "geneannotation") {
        //   // Only await here, not in the map above
        //   const genRefResponses = await fetchData(item);

        //   fetchResults.push({
        //     name: trackType,
        //     result: genRefResponses,
        //     id: id,
        //     metadata: item.metadata,
        //     trackModel: item,
        //   });
        // }
        else if (
          trackType in
          {
            matplot: "",
            dynamic: "",
            dynamicbed: "",
            dynamiclongrange: "",
            dynamichic: "",
          }
        ) {
          let hasError = false;
          let responses: Array<any> | { [key: string]: any } = [];
          for (const trackItem of item.tracks) {
            trackItem["shouldPlaceRegion"] = item.shouldPlaceRegion;
            const response: any = await fetchData(trackItem);
            if (typeof response === "object" && "Error" in response) {
              hasError = true;
              responses = response;
              break; // Stop processing remaining tracks
            }
            responses.push(response);
          }

          fetchResults.push({
            name: trackType,
            result: responses,
            id: id,
            metadata: item.metadata,
            trackModel: item,
          });
        } else {
          const responses = await fetchData(item);
          const result =
            typeof responses === "object" && "data" in responses
              ? responses.data
              : responses;
          fetchResults.push({
            name: trackType,
            result: result,
            fileInfos:
              typeof responses === "object" && "fileInfos" in responses
                ? responses.fileInfos
                : null,
            id: id,
            metadata: item.metadata,
            trackModel: item,
          });
        }
      }),
    ).then(() => ({
      fetchResults,
      trackDataIdx,
      genomicFetchCoord,
      trackToDrawId,
      missingIdx,
    }));

    async function fetchData(trackModel): Promise<Array<any>> {
      let responses: any = null;
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
      try {
        if (isLocalFetch && trackModel.url === "") {
          responses = trackModel.isText
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
        } else if (!isLocalFetch) {
          if (trackModel.type in { geneannotation: "", snp: "" }) {
            responses = await trackFetchFunction[trackModel.type]({
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
            responses = await trackFetchFunction[trackModel.type]({
              basesPerPixel: bpRegionSize / windowWidth,
              nav: curFetchNav,
              trackModel,
              visRegion: visRegion,
            });
          }
        }
      } catch (error) {

        responses = {
          error: error["message"] || `Error fetching data for track ${trackModel.name}`,
          Error: error,
          trackModel: trackModel,
        };
      }
      return responses;
    }
  });

  const results = await Promise.all(objectPromises);

  return results;
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
    const visRegionFeatures = mapFeatures(visData.visRegion._navContext._features);
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

          const records = responds.map((record) => {
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
          rawRecords = {
            error: `Error fetching genome align track with id ${item.id}`,
          };
        }

        fetchResults[item.id] = {
          name: item.name,
          records: rawRecords,
          query: item.querygenome,
          id: item.id,
          trackModel: item,
          metadata: item.metadata,
          isBigChain: false,
        };
      }),
    );

    // step 3 sent the array of genomealign fetched data to find the gaps and get drawData

    const successFetch = Object.values(fetchResults).filter(
      (result: any) => !("error" in result.records),
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
