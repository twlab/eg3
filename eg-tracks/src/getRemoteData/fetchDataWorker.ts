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
  console.log(event, "worker");
  const objectPromises = event.data.map((dataItem) => {
    const primaryGenName = dataItem.primaryGenName;
    const initial = dataItem.initial;
    const fetchResults: Array<any> = [];
    const genomicLoci = dataItem.genomicLoci;
    const regionExpandLoci = dataItem.regionExpandLoci;
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
          } else if (
            useFineModeNav ||
            item.type === "longrange" ||
            item.type === "biginteract"
          ) {
            curFetchNav = Array(regionExpandLoci);
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

    // fetchData function remains unchanged
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
        curFetchNav = Array(regionExpandLoci);
      } else {
        curFetchNav = Array(genomicLoci);
      }

      const isLocalFetch = trackModel.fileObj instanceof File;
      if (isLocalFetch && trackModel.url === "") {
        for (let i = 0; i < curFetchNav.length; i++) {
          const curRespond = trackModel.isText
            ? await textFetchFunction[trackModel.type]({
                basesPerPixel: bpRegionSize / windowWidth,
                nav: curFetchNav[i],
                trackModel,
              })
            : await localTrackFetchFunction[trackModel.type]({
                basesPerPixel: bpRegionSize / windowWidth,
                nav: curFetchNav[i],
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
        }
      } else if (!isLocalFetch) {
        for (let i = 0; i < curFetchNav.length; i++) {
          let curRespond;
          try {
            if (trackModel.type in { geneannotation: "", snp: "" }) {
              curRespond = await Promise.all(
                curFetchNav[i].map(async (nav) => {
                  return await trackFetchFunction[trackModel.type]({
                    genomeName:
                      "genome" in trackModel.metadata
                        ? trackModel.metadata.genome
                        : trackModel.genome
                        ? trackModel.genome
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
                  basesPerPixel: bpRegionSize / windowWidth,
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
            responses.push({
              error: "Data fetch failed. Reload page or change view to retry",
            });
          }
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
  postMessage(results);
};
