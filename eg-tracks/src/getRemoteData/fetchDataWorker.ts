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
  const primaryGenName = event.data.primaryGenName;
  const fetchResults: Array<any> = [];
  const genomicLoci = event.data.genomicLoci;
  const regionExpandLoci = event.data.regionExpandLoci;
  const initGenomicLoci = event.data.initGenomicLoci;
  const trackDefaults = event.data.trackModelArr;
  const trackToDrawId = event.data.trackToDrawId
    ? event.data.trackToDrawId
    : {};
  const useFineModeNav = event.data.useFineModeNav;
  let genomicFetchCoord;

  if (event.data.genomicFetchCoord) {
    genomicFetchCoord = event.data.genomicFetchCoord;
  } else {
    genomicFetchCoord = {};
    genomicFetchCoord[`${primaryGenName}`] = {
      genomicLoci,
      regionExpandLoci,
      initGenomicLoci,
    };
    genomicFetchCoord[`${primaryGenName}`]["primaryVisData"] =
      event.data.visData;
  }
  const tmpQueryGenObj: { [key: string]: any } = {};
  tmpQueryGenObj[`${primaryGenName}`] = "";
  let genomeAlignTracks = trackDefaults.filter((items, index) => {
    return items.type === "genomealign";
  });
  genomeAlignTracks.map((items, index) => {
    if (items.querygenome) {
      tmpQueryGenObj[`${items.querygenome}`] = "";
    } else if (items.metadata && items.metadata.genome) {
      tmpQueryGenObj[`${items.metadata.genome}`] = "";
    }
  });

  let leftOverTrackModels = trackDefaults.filter((items, index) => {
    return items.type !== "genomealign";
  });

  await Promise.all(
    leftOverTrackModels.map(async (item, index) => {
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
          result: { error: "This track type is currently not support" },
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
        let genRefResponses: Array<any> = await fetchData(item);
        fetchResults.push({
          name: trackType,
          // I fetch three sections so I need to have an array with 3 different section data [{},{},{}]
          // when moving left and right get only 1 region so [{}] I just sent {}
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
          item.metadata.genome !== event.data.primaryGenName
        ) {
          curFetchNav =
            genomicFetchCoord[
              `${
                item.metadata.genome === ""
                  ? event.data.primaryGenName
                  : item.metadata.genome
              }`
            ].queryGenomicCoord;
        } else if (
          useFineModeNav ||
          item.type === "longrange" ||
          item.type === "biginteract"
        ) {
          curFetchNav = new Array(regionExpandLoci);
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
            return (await fetchData(trackItem)).flat(1);
          })
        );
        // if (event.data.initial === 1 && trackType === "dynamiclongrange") {
        //   tmpResults = tmpResults.flat(1);
        // }
        fetchResults.push({
          name: trackType,
          result: tmpResults,
          id: id,
          metadata: item.metadata,
          trackModel: item,
        });
      } else {
        let responses: Array<any> = await fetchData(item);
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

  async function fetchData(trackModel): Promise<Array<any>> {
    let responses: Array<any> = [];
    let curFetchNav;
    const { genome } = trackModel.metadata;

    if (genome && genome !== "" && genome !== event.data.primaryGenName) {
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
      for (let i = 0; i < curFetchNav.length; i++) {
        // Assuming getData is bounded to the right context.
        const curRespond = trackModel.isText
          ? await textFetchFunction[trackModel.type]({
              basesPerPixel: event.data.bpRegionSize / event.data.windowWidth,
              nav: curFetchNav[i],
              trackModel,
            })
          : await localTrackFetchFunction[trackModel.type]({
              basesPerPixel: event.data.bpRegionSize / event.data.windowWidth,
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

  postMessage({
    fetchResults,
    trackDataIdx: event.data.trackDataIdx,
    genomicFetchCoord,
    trackToDrawId,
    missingIdx: event.data.missingIdx,
  });
};
