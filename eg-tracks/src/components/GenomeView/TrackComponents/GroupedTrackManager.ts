import _ from "lodash";
import { ScaleChoices } from "../../../models/ScaleChoices";
import TrackModel from "../../../models/TrackModel";

import { NumericalAggregator } from "./commonComponents/numerical/NumericalAggregator";
import OpenInterval from "../../../models/OpenInterval";
import {
  DefaultAggregators,
  FeatureAggregator,
} from "../../../models/FeatureAggregator";
import MethylCRecord from "../../../models/MethylCRecord";
import FeatureArranger, {
  FeaturePlacementResult,
} from "../../../models/FeatureArranger";
import { SortItemsOptions } from "../../../models/SortItemsOptions";
import { trackOptionMap } from "./defaultOptionsMap";
import {
  FeaturePlacer,
  PlacedFeature,
  PlacementMode,
} from "../../../models/getXSpan/FeaturePlacer";
import DisplayedRegionModel from "../../../models/DisplayedRegionModel";
import { Fiber } from "../../../models/Feature";
import { FIBER_DENSITY_CUTOFF_LENGTH } from "./displayModeComponentMap";
import {
  FiberDisplayModes,
  NumericalDisplayModes,
  VcfColorScaleKeys,
} from "../../../trackConfigs/config-menu-models.tsx/DisplayModes";
import { scaleLinear } from "d3-scale";
import { config } from "process";
const featureArrange = new FeatureArranger();
const sortType = SortItemsOptions.NOSORT;
const TOP_PADDING = 2;
export const numericalTracks = {
  bigwig: "",
  bedgraph: "",
  methylc: "",
  boxplot: "",
  qbed: "",
  dynseq: "",
  matplot: "",
};
export const possibleNumericalTracks = {
  bigbed: "",
  geneannotation: "",
  vcf: "",
  modbed: "",
  refbed: "",
  bed: "",
  repeatmasker: "",
  omeroidr: "",
  bam: "",
  snp: "",
};
export const numericalTracksGroup = { bigwig: "", bedgraph: "" };
function getHeight(numRows: number, trackModel, configOptions): number {
  let rowHeight = trackOptionMap[`${trackModel.type}`]?.ROW_HEIGHT
    ? trackOptionMap[`${trackModel.type}`]?.ROW_HEIGHT
    : trackOptionMap[`${trackModel.type}`]?.rowHeight
      ? trackOptionMap[`${trackModel.type}`]?.rowHeight
      : 20;

  let options = configOptions;
  if (configOptions.rowHeight) {
    rowHeight = configOptions.rowHeight;
  }

  let rowsToDraw = Math.min(numRows, options.maxRows);
  if (options.hideMinimalItems) {
    rowsToDraw -= 1;
  }
  if (rowsToDraw < 1) {
    rowsToDraw = 1;
  }

  return trackModel.type === "modbed"
    ? (rowsToDraw + 1) * rowHeight + 2
    : rowsToDraw * rowHeight + TOP_PADDING;
}
export class GroupedTrackManager {
  /**
   * @returns list of groups found in the track list, their data, and their original indicies
   */
  public aggregator: NumericalAggregator;
  // dynseqAggregator: (
  //   data: any[],
  //   viewRegion: any,
  //   width: number,
  //   aggregatorId: string
  // ) => any;
  aggregateRecords: (data: any[], viewRegion: any, width: number) => any;
  aggregateFibers: (
    data: Fiber[],
    viewRegion: DisplayedRegionModel,
    width: number,
  ) => {
    xToFibers: Array<{ on: number; off: number; count: number }>;
    placements: FeaturePlacementResult["placements"];
  };
  // aggregateFeaturesMatplot: (
  //   data: any,
  //   viewRegion: any,
  //   width: any,
  //   aggregatorId: any
  // ) => any;

  constructor() {
    this.aggregator = new NumericalAggregator();

    this.aggregateRecords = (data: any[], viewRegion: any, width: number) => {
      const aggregator = new FeatureAggregator();
      const result = aggregator.makeXMap(data, viewRegion, width);
      const xToRecords: Array<any> = result["xToFeaturesForward"]
        ? result["xToFeaturesForward"]
        : [];
      return xToRecords.map(MethylCRecord.aggregateByStrand);
    };

    this.aggregateFibers = (
      data: Fiber[],
      viewRegion: DisplayedRegionModel,
      width: number,
    ) => {
      width = Math.round(width); // Sometimes it's juuust a little bit off from being an int
      const xToFibers = Array(width).fill(null);
      for (let x = 0; x < width; x++) {
        // Fill the array with empty arrays
        xToFibers[x] = { on: 0, off: 0, count: 0 };
      }
      const placer = new FeaturePlacer();
      const result: FeaturePlacementResult = placer.placeFeatures({
        features: data,
        viewRegion,
        width,
        mode: PlacementMode.PLACEMENT,
      }) as FeaturePlacementResult;

      const placements = result?.placements ?? [];
      if (result && placements) {
        for (const placedFeature of placements) {
          const { feature, xSpan, visiblePart } =
            placedFeature as PlacedFeature;
          const { relativeStart, relativeEnd } = visiblePart;
          const segmentWidth = relativeEnd - relativeStart;
          const startX = Math.max(0, Math.floor(xSpan.start));
          const endX = Math.min(width - 1, Math.ceil(xSpan.end));
          for (let x = startX; x <= endX; x++) {
            xToFibers[x].count += 1;
          }
          (feature as Fiber).ons!.forEach((rbs) => {
            const bs = Math.abs(rbs);
            if (bs >= relativeStart && bs < relativeEnd) {
              const x =
                startX +
                Math.floor(
                  ((bs - relativeStart) / segmentWidth) * (endX - startX),
                );
              xToFibers[x].on += 1;
            }
          });
          (feature as Fiber).offs!.forEach((rbs) => {
            const bs = Math.abs(rbs);
            if (bs >= relativeStart && bs < relativeEnd) {
              const x =
                startX +
                Math.floor(
                  ((bs - relativeStart) / segmentWidth) * (endX - startX),
                );
              xToFibers[x].off += 1;
            }
          });
        }
      }
      return { xToFibers, placements };
    };
  }

  getGroupScale(
    trackData: any,
    width: number,
    viewWindow: OpenInterval,
    dataIdx: number,
    trackManagerState: any,
  ): { [groupId: number]: { scale: TrackModel; min: {}; max: {} } } {
    if (trackData) {
      const grouping = {}; // key: group id, value: {scale: 'auto'/'fixed', min: {trackid: xx,,,}, max: {trackid: xx,,,,}}
      for (let i = 0; i < trackData.length; i++) {
        // if (tracks[i].options.hasOwnProperty("group") && tracks[i].options.group) { // check up already done at trackContainer
        // console.log(tracks[i]);
        const track = trackData[i];

        if (
          track.configOptions.group &&
          track.trackModel.type in numericalTracksGroup
        ) {
          const g = track.configOptions.group;
          const tid = track.id;
          if (track.configOptions.yScale === ScaleChoices.FIXED) {
            grouping[g] = {
              scale: ScaleChoices.FIXED,
              min: { [tid]: track.configOptions.yMin },
              max: { [tid]: track.configOptions.yMax },
            };
            break;
          }
          if (track.data) {
            const data = track.data;
            let xvalues;

            if (trackManagerState.current.caches[tid][dataIdx]["xvalues"]) {
              xvalues =
                trackManagerState.current.caches[tid][dataIdx]["xvalues"];
            } else {
              xvalues = this.aggregator.xToValueMaker(
                data,
                track.visRegion,
                width,
                track.configOptions,
              );
              if (!trackManagerState.current.caches[tid][dataIdx]) {
                trackManagerState.current.caches[tid][dataIdx] = {};
              }
              trackManagerState.current.caches[tid][dataIdx]["xvalues"] =
                xvalues;
            }
            let max = 0,
              min = 0;
            let revmax = 0,
              revmin = 0;
            if (xvalues[3]) {
              max =
                xvalues[0] && xvalues[0].length
                  ? _.max(xvalues[0].slice(viewWindow.start, viewWindow.end))
                  : 1;

              min =
                xvalues[0] && xvalues[0].length
                  ? _.min(xvalues[1].slice(viewWindow.start, viewWindow.end))
                  : 0;
            }
            if (xvalues[2]) {
              revmax =
                xvalues[1] && xvalues[1].length
                  ? _.max(xvalues[1].slice(viewWindow.start, viewWindow.end))
                  : 1;

              revmin =
                xvalues[1] && xvalues[1].length
                  ? _.min(xvalues[1].slice(viewWindow.start, viewWindow.end))
                  : 0;
            }

            max = Math.max(max, revmax) ? Math.max(max, revmax) : 0;
            min = Math.min(min, revmin) ? Math.min(min, revmin) : 0;

            if (!grouping.hasOwnProperty(g)) {
              grouping[g] = {
                scale: ScaleChoices.AUTO,
                min: { [tid]: min },
                max: { [tid]: max },
              };
            } else {
              grouping[g].min[tid] = min;
              grouping[g].max[tid] = max;
            }
          }
        } else if (
          track.trackModel.type in numericalTracks ||
          track?.trackModel?.options?.displayMode === "density"
        ) {
          const tid = track.id;

          if (track.data) {
            const data = track.data;
            let xvalues;
            if (
              trackManagerState.current.caches[tid][dataIdx]["xvalues"] &&
              track.usePrimaryNav
            ) {
              // continue;
            }

            // else {
            if (track.trackModel.type === "dynseq") {
              xvalues = this.aggregator.xToValueMaker(
                data,
                track.visRegion,
                width,
                track.configOptions,
              );
            } else if (track.trackModel.type === "methylc") {
              xvalues = this.aggregateRecords(data, track.visRegion, width);
            } else if (track.trackModel.type === "matplot") {
              xvalues = data.map(
                (d) =>
                  this.aggregator.xToValueMaker(
                    d,
                    track.visRegion,
                    width,
                    track.configOptions,
                  )[0],
              );
            } else {
              xvalues = this.aggregator.xToValueMaker(
                data,
                track.visRegion,
                width,
                track.configOptions,
              );
            }

            if (!trackManagerState.current.caches[tid][dataIdx]) {
              trackManagerState.current.caches[tid][dataIdx] = {};
            }
            trackManagerState.current.caches[tid][dataIdx]["xvalues"] = xvalues;
          }
          // }
        } else if (track?.trackModel?.options?.displayMode !== "density") {
          const tid = track.id;

          const curTrackModel = track.trackModel;
          const configOptions = trackOptionMap[curTrackModel.type]
            ? {
                ...trackOptionMap[`${curTrackModel.type}`].defaultOptions,
                ...curTrackModel.options,
              }
            : { ...trackOptionMap["error"].defaultOptions };

          if (track) {
            if (
              (track.trackModel.type === "modbed" &&
                track.visRegion.getWidth() > FIBER_DENSITY_CUTOFF_LENGTH &&
                configOptions.displayMode === FiberDisplayModes.AUTO) ||
              configOptions.displayMode === FiberDisplayModes.SUMMARY
            ) {
              const xvalues = this.aggregateFibers(
                track.data,
                track.visRegion,
                width,
              );

              if (!trackManagerState.current.caches[tid][dataIdx]) {
                trackManagerState.current.caches[tid][dataIdx] = {};
              }
              trackManagerState.current.caches[tid][dataIdx]["xvalues"] =
                xvalues;
            } else if (
              (track.trackModel.type === "vcf" &&
                (track.visRegion.getWidth() *
                  (viewWindow.end - viewWindow.start)) /
                  width >
                  100000 &&
                configOptions.displayMode === "auto") ||
              configOptions.displayMode === "density"
            ) {
              const xvalues = this.aggregator.xToValueMaker(
                track.data,
                track.visRegion,
                width,
                configOptions,
              );

              if (!trackManagerState.current.caches[tid][dataIdx]) {
                trackManagerState.current.caches[tid][dataIdx] = {};
              }
              trackManagerState.current.caches[tid][dataIdx]["xvalues"] =
                xvalues;
            } else {
              const data = track.data;

              const placeFeatureData = featureArrange.arrange(
                data,
                track.visRegion,
                width,
                trackOptionMap[`${curTrackModel.type}`]
                  ? trackOptionMap[`${curTrackModel.type}`].getGenePadding
                  : trackOptionMap["error"].getGenePadding,
                configOptions.hiddenPixels,
                sortType,
                viewWindow,
              );

              const height =
                curTrackModel.type === "repeatmasker" ||
                curTrackModel.type === "rmskv2" ||
                curTrackModel.type === "categorical"
                  ? configOptions?.height
                  : placeFeatureData.numRowsAssigned
                    ? getHeight(
                        placeFeatureData.numRowsAssigned,
                        curTrackModel,
                        configOptions,
                      )
                    : 40;

              if (!trackManagerState.current.caches[tid][dataIdx]) {
                trackManagerState.current.caches[tid][dataIdx] = {};
              }

              let scales;
              if (curTrackModel.type === "vcf") {
                function computeColorScales(
                  data: Array<any>,
                  colorKey: string,
                  lowValueColor: any,
                  highValueColor: any,
                ) {
                  let values: any[];

                  if (colorKey === VcfColorScaleKeys.QUAL) {
                    values = data.map((v) => v.feature.variant.QUAL);
                  } else if (colorKey === VcfColorScaleKeys.AF) {
                    values = data.map((v) => {
                      if (
                        v.feature?.variant?.INFO &&
                        v.feature?.variant?.INFO.hasOwnProperty("AF")
                      ) {
                        return v.feature.variant.INFO.AF[0];
                      }
                      return 0;
                    });
                  } else {
                    values = [];
                  }
                  const colorScale = scaleLinear()
                    .domain([0, _.max(values)])
                    .range([lowValueColor, highValueColor])
                    .clamp(true);
                  return colorScale;
                }

                scales = computeColorScales(
                  placeFeatureData.placements,
                  configOptions.colorScaleKey,
                  configOptions.lowValueColor,
                  configOptions.highValueColor,
                );
              }

              trackManagerState.current.caches[tid][dataIdx]["placeFeature"] = {
                placements: placeFeatureData,
                height,
                numHidden: placeFeatureData.numHidden,
                scales,
              };
            }
          }
        }
        // }
      }
      // console.log(grouping);

      return _.isEmpty(grouping) ? {} : grouping;
    }
    return {};
  }
}
