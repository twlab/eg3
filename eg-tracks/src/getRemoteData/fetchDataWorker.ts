import _ from "lodash";
import { SequenceSegment } from "../models/AlignmentStringUtils";
import AlignmentRecord from "../models/AlignmentRecord";
import { AlignmentSegment } from "../models/AlignmentSegment";
import { NavContextBuilder } from "../models/NavContextBuilder";
import OpenInterval from "../models/OpenInterval";
import Feature from "../models/Feature";
import { ViewExpansion } from "../models/RegionExpander";
import DisplayedRegionModel from "../models/DisplayedRegionModel";
import trackFetchFunction from "./fetchTrackData";
import {
  localTrackFetchFunction,
  textFetchFunction,
} from "../getLocalData/localFetchData";

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
  bedcolor: "",
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
  const objectPromises = event.data.map(async (dataItem) => {
    const primaryGenName = dataItem.primaryGenName;
    const initial = dataItem.initial;
    const fetchResults: Array<any> = [];
    const genomicLoci = dataItem.genomicLoci;
    const regionExpandLoci = dataItem.regionExpandLoci;
    const initGenomicLoci = dataItem.initGenomicLoci;
    const trackDefaults = dataItem.trackModelArr;
    const bpRegionSize = dataItem.bpRegionSize;
    const windowWidth = dataItem.windowWidth;
    const trackToDrawId = dataItem.trackToDrawId ? dataItem.trackToDrawId : {};
    const trackDataIdx = dataItem.trackDataIdx;
    const missingIdx = dataItem.missingIdx;
    const useFineModeNav = dataItem.useFineModeNav;
    let genomicFetchCoord;

    if (dataItem.genomicFetchCoord) {
      genomicFetchCoord = dataItem.genomicFetchCoord;
    } else {
      genomicFetchCoord = {};
      genomicFetchCoord[`${primaryGenName}`] = {
        genomicLoci,
        regionExpandLoci,
        initGenomicLoci,
      };
      genomicFetchCoord[`${primaryGenName}`]["primaryVisData"] =
        dataItem.visData;
    }

    let leftOverTrackModels = trackDefaults.filter(
      (items) => items && items.type !== "genomealign"
    );

    await Promise.all(
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
            result: { error: "This track type is currently not supported" },
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
          // Only await the fetchData call, not the array
          let genRefResponses = await fetchData(item);
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
                `${
                  item.metadata.genome === ""
                    ? primaryGenName
                    : item.metadata.genome
                }`
              ].queryGenomicCoord;
          } else if (
            useFineModeNav ||
            item.type === "longrange" ||
            item.type === "biginteract"
          ) {
            curFetchNav = new Array(regionExpandLoci);
          } else if (initial === 1) {
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
          // Parallelize track fetches
          let hasError = false;
          let tmpResults = await Promise.all(
            item.tracks.map((trackItem) =>
              fetchData(trackItem).then((result) => {
                if (typeof result[0] === "object" && "error" in result[0]) {
                  hasError = true;
                }
                return result;
              })
            )
          );

          fetchResults.push({
            name: trackType,
            result: hasError
              ? {
                  error: "Fetch failed: data source is not valid",
                }
              : tmpResults,
            id: id,
            metadata: item.metadata,
            trackModel: item,
          });
        } else {
          // Only await fetchData once
          let responses = await fetchData(item);
          fetchResults.push({
            name: trackType,
            result: responses[0],
            id: id,
            metadata: item.metadata,
            trackModel: item,
          });
        }
      })
    );

    // Optimize fetchData: use Promise.all for parallel fetches
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
        curFetchNav = new Array(regionExpandLoci);
      } else {
        curFetchNav = new Array(genomicLoci);
      }

      const isLocalFetch = trackModel.fileObj instanceof File;
      if (isLocalFetch && trackModel.url === "") {
        // Parallelize local fetches
        const localFetches = curFetchNav.map((nav, i) => {
          if (trackModel.isText) {
            return textFetchFunction[trackModel.type]({
              basesPerPixel: bpRegionSize / windowWidth,
              nav,
              trackModel,
            });
          } else {
            return localTrackFetchFunction[trackModel.type]({
              basesPerPixel: bpRegionSize / windowWidth,
              nav,
              trackModel,
            });
          }
        });
        const localResults = await Promise.all(localFetches);
        for (const curRespond of localResults) {
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
        }
      } else if (!isLocalFetch) {
        // Parallelize remote fetches
        const remoteFetches = curFetchNav.map((nav, i) => {
          if (trackModel.type in { geneannotation: "", snp: "" }) {
            return Promise.all(
              nav.map(async (n) => {
                return trackFetchFunction[trackModel.type]({
                  genomeName:
                    "genome" in trackModel.metadata
                      ? trackModel.metadata.genome
                      : trackModel.genome
                      ? trackModel.genome
                      : primaryGenName,
                  name: trackModel.name,
                  chr: n.chr,
                  start: n.start,
                  end: n.end,
                  nav: n,
                  trackModel,
                  trackType: trackModel.type,
                });
              })
            ).then((result) => _.flatten(result));
          } else {
            return trackFetchFunction[trackModel.type]({
              basesPerPixel: bpRegionSize / windowWidth,
              nav,
              trackModel,
            });
          }
        });
        const remoteResults = await Promise.all(remoteFetches);
        for (const curRespond of remoteResults) {
          responses.push(_.flatten([curRespond]));
        }
      } else {
        responses.push({
          error: "Fetch failed: data source is not valid",
        });
      }

      return responses;
    }

    return {
      fetchResults,
      trackDataIdx,
      genomicFetchCoord,
      trackToDrawId,
      missingIdx,
    };
  });

  const results = await Promise.all(objectPromises);
  postMessage(results);
};
