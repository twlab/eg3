import _ from "lodash";
import { HicSource } from "./hicSource";
import JSON5 from "json5";
import { SequenceSegment } from "../../../models/AlignmentStringUtils";
import AlignmentRecord from "../../../models/AlignmentRecord";
import { AlignmentSegment } from "../../../models/AlignmentSegment";
import { NavContextBuilder } from "../../../models/NavContextBuilder";
import ChromosomeInterval from "../../../models/ChromosomeInterval";
import OpenInterval from "../../../models/OpenInterval";
import NavigationContext from "../../../models/NavigationContext";
import Feature from "../../../models/Feature";
import { ViewExpansion } from "../../../models/RegionExpander";
import DisplayedRegionModel from "../../../models/DisplayedRegionModel";
import { MultiAlignmentViewCalculator } from "../GenomeAlign/MultiAlignmentViewCalculator";
import trackFetchFunction from "./fetchTrackData";

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

let strawCache: { [key: string]: any } = {};

//TO_DOOOOOOOOO have a way to get option from trackManager for each track and set it here if custom options are defined while getting the fetched data
self.onmessage = async (event: MessageEvent) => {
  let primaryGenName = event.data.primaryGenName;
  let fetchResults: Array<any> = [];
  let genomicLoci = event.data.genomicLoci;
  let expandGenomicLoci = event.data.expandedGenLoci;
  let initGenomicLoci = event.data.initGenomicLoci;
  let basesPerPixel = event.data.basesPerPixel;
  let regionLength = event.data.regionLength;
  let trackDefaults = event.data.trackModelArr;
  let genomicFetchCoord = {};
  let hasGenomeAlignTrack = false;

  let initGenalignNavLoci = event.data.initGenalignNavLoci;
  let initGenalignGenomicLoci = event.data.initGenalignGenomicLoci;

  genomicFetchCoord[`${primaryGenName}`] = {
    genomicLoci,
    expandGenomicLoci,
    initGenomicLoci,
    initGenalignGenomicLoci,
  };

  //____________________________________________________________________________________________________________________________________________________________________
  //____________________________________________________________________________________________________________________________________________________________________
  //____________________________________________________________________________________________________________________________________________________________________
  // step 1: check if there genome align tracks because it alters other track positions because of gaps
  let genomeAlignTracks = trackDefaults.filter((items, index) => {
    return items.filetype === "genomealign";
  });

  if (genomeAlignTracks.length > 0) {
    genomicFetchCoord[`${primaryGenName}`]["primaryVisData"] = [];

    hasGenomeAlignTrack = true;
    // step 2: fetch genome align data and put them into an array

    if (event.data.initial === 1) {
      let initialData: Array<any> = [];
      for (let i = 0; i < initGenalignNavLoci.length; i++) {
        let res = await getGenomeAlignment(
          initGenalignNavLoci[i],
          genomeAlignTracks
        );

        genomicFetchCoord[`${primaryGenName}`]["primaryVisData"].push(
          res[0].result.primaryVisData
        );

        initialData.push(res);
      }
      let tempObj = {};
      for (let dataArr of initialData) {
        dataArr.map((item, index) => {
          if (item.id in tempObj) {
            tempObj[`${item.id}`].push(item);
          } else {
            tempObj[`${item.id}`] = new Array(item);
          }
        });
      }

      for (let alignment in tempObj) {
        let queryName = tempObj[`${alignment}`][0].queryName;
        genomicFetchCoord[`${queryName}`] = {};
        genomicFetchCoord[`${queryName}`]["id"] = tempObj[`${alignment}`][0].id;
        genomicFetchCoord[`${queryName}`]["queryGenomicCoord"] = [];
        genomicFetchCoord[`${queryName}`]["queryRegion"] = [];
        tempObj[`${alignment}`].map((item) => {
          genomicFetchCoord[`${queryName}`].queryGenomicCoord.push(
            item.queryGenomicCoord
          );
          genomicFetchCoord[`${queryName}`].queryRegion.push(
            item.result.queryRegion
          );
        });

        fetchResults.push({ id: alignment, result: tempObj[`${alignment}`] });
      }
    } else {
      (
        await getGenomeAlignment(
          event.data.visData.visRegion,
          genomeAlignTracks
        )
      ).map((item) => {
        genomicFetchCoord[`${primaryGenName}`]["primaryVisData"] =
          item.result.primaryVisData;
        genomicFetchCoord[`${item.queryName}`] = {
          queryGenomicCoord: new Array(item.queryGenomicCoord),
          id: item.id,
          queryRegion: item.result.queryRegion,
        };
        fetchResults.push(item);
      });
    }
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
          // if (options.isRoughMode) {

          // }
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
      for (let i = 0; i < alignment[`${query}`].drawData.length; i++) {
        let placement = alignment[`${query}`].drawData[i];

        const { targetXSpan } = placement;
        const targetSequence = placement.visiblePart.getTargetSequence();
        const querySequence = placement.visiblePart.getQuerySequence();
        const baseWidth = targetXSpan.getLength() / targetSequence.length;
        const targetLocus = placement.visiblePart.getLocus().toString();
        const queryLocus = placement.visiblePart.getQueryLocus().toString();
        const nonGapsTarget = placement.targetSegments.filter(
          (segment) => !segment.isGap
        );
        const nonGapsQuery = placement.querySegments.filter(
          (segment) => !segment.isGap
        );

        const isReverseStrandQuery = placement.record.getIsReverseStrandQuery();
        let tempObj = {
          targetSequence,
          querySequence,
          nonGapsQuery,
          baseWidth,
          targetLocus,
          queryLocus,
          nonGapsTarget,
          isReverseStrandQuery,
        };
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
          //   genomicCoords.push(  )                                                                                                                                                           )
          //  genomicFetchCoord[`${chr}`] = {expandGenomicLoci: {start: , end: , chr}}
        }
      }
      // genomicFetchCoord[`${query}`] = { expandGenomicLoci: queryGenomicCoords };

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
    return items.filetype !== "genomealign";
  });
  await Promise.all(
    normDefaultTracks.map(async (item, index) => {
      const trackName = item.name;
      const genomeName = item.genome;
      const id = item.id;
      const url = item.url;

      if (trackName === "hic") {
        if (!(id in strawCache)) {
          strawCache[id] = new HicSource(item.url, regionLength);
        }

        let result = await trackFetchFunction[trackName](
          strawCache[id],
          {
            color: "#B8008A",
            color2: "#006385",
            backgroundColor: "var(--bg-color)",
            displayMode: "heatmap",
            scoreScale: "auto",
            scoreMax: 10,
            scalePercentile: 95,
            scoreMin: 0,
            height: 500,
            lineWidth: 2,
            greedyTooltip: false,
            fetchViewWindowOnly: false,
            bothAnchorsInView: false,
            isThereG3dTrack: false,
            clampHeight: false,
            binSize: 0,
            normalization: "NONE",
            label: "",
          },
          expandGenomicLoci,
          basesPerPixel
        );
        fetchResults.push({
          name: trackName,
          result,
          id,
        });
      } else if (trackName === "refGene" || trackName === "gencodeV39") {
        let genRefResponses: Array<any> = [];
        let curFetchNav;

        if ("genome" in item.metadata) {
          curFetchNav =
            genomicFetchCoord[`${item.metadata.genome}`].queryGenomicCoord;
        } else if (event.data.initial === 1) {
          curFetchNav = initGenalignGenomicLoci;
        } else {
          curFetchNav = new Array(expandGenomicLoci);
        }

        for (let i = 0; i < curFetchNav.length; i++) {
          const genRefResponse = await Promise.all(
            await curFetchNav[i].map((item, index) =>
              trackFetchFunction[trackName]({
                name: genomeName,
                chr: item.chr,
                start: item.start,
                end: item.end,
                trackName,
              })
            )
          );

          genRefResponses.push({
            name: trackName,
            fetchData: _.flatten(genRefResponse),
            id,
            metadata: item.metadata,
          });
        }
        fetchResults.push({
          name: trackName,
          result:
            event.data.initial !== 1
              ? _.flatten(genRefResponses)[0].fetchData
              : genRefResponses,
          id: id,
          metadata: item.metadata,
        });
      } else {
        let result = await trackFetchFunction[trackName](
          genomicLoci,
          {
            displayMode: "full",
            color: "blue",
            color2: "red",
            maxRows: 20,
            height: 40,
            hideMinimalItems: false,
            sortItems: false,
            label: "",
          },
          url
        );
      }
    })
  );
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
    location: event.data.location,
    initial: event.data.initial,
    curRegionCoord: event.data.curRegionCoord,
    genomicFetchCoord,
    bpX: event.data.bpX,
    hasGenomeAlignTrack,
  });
};
