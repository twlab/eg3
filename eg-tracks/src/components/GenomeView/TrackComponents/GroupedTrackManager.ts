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
import FeatureArranger from "../../../models/FeatureArranger";
import { SortItemsOptions } from "../../../models/SortItemsOptions";
import { objToInstanceAlign } from "../TrackManager";
import { trackOptionMap } from "./defaultOptionsMap";
const TOP_PADDING = 2;
export const numericalTracks = {
  bigwig: "",
  bedgraph: "",
  methylc: "",
  boxplot: "",
  qbed: "",
  vcf: "",
  dynseq: "",
  matplot: "",
  longrange: "",
  hic: "",
};
export const possibleNumericalTracks = {
  bigbed: "",
  geneannotation: "",

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
  let rowHeight = trackOptionMap[`${trackModel.type}`].ROW_HEIGHT;
  let options = configOptions;
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
  dynseqAggregator: (
    data: any[],
    viewRegion: any,
    width: number,
    aggregatorId: string
  ) => any;
  aggregateRecords: (data: any[], viewRegion: any, width: number) => any;
  aggregateFeaturesMatplot: (
    data: any,
    viewRegion: any,
    width: any,
    aggregatorId: any
  ) => any;

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
  }

  getGroupScale(
    tracks: TrackModel[],
    trackData: any,
    width: number,
    viewWindow: OpenInterval,
    dataIdx: number,
    trackFetchedDataCache: any
  ): { [groupId: number]: { scale: TrackModel; min: {}; max: {} } } {
    // console.log(tracks);
    if (trackData) {
      const grouping = {}; // key: group id, value: {scale: 'auto'/'fixed', min: {trackid: xx,,,}, max: {trackid: xx,,,,}}
      for (let i = 0; i < tracks.length; i++) {
        // if (tracks[i].options.hasOwnProperty("group") && tracks[i].options.group) { // check up already done at trackContainer
        // console.log(tracks[i]);

        if (tracks[i].options.group && tracks[i].type in numericalTracksGroup) {
          const g = tracks[i].options.group;
          const tid = tracks[i].id;
          if (tracks[i].options.yScale === ScaleChoices.FIXED) {
            grouping[g] = {
              scale: ScaleChoices.FIXED,
              min: { [tid]: tracks[i].options.yMin },
              max: { [tid]: tracks[i].options.yMax },
            };
            break;
          }
          if (trackData[tid]) {
            const data = trackData[tid].data;
            let xvalues;
            // console.log(data);
            if (trackFetchedDataCache.current[tid][dataIdx]["xvalues"]) {
              xvalues = trackFetchedDataCache.current[tid][dataIdx]["xvalues"];
            } else {
              xvalues = this.aggregator.xToValueMaker(
                data,
                trackData[tid].visRegion,
                width,
                trackData[tid].configOptions
              );
              if (!trackFetchedDataCache.current[tid][dataIdx]) {
                trackFetchedDataCache.current[tid][dataIdx] = {};
              }
              trackFetchedDataCache.current[tid][dataIdx]["xvalues"] = xvalues;
            }

            const max =
              xvalues[0] && xvalues[0].length
                ? _.max(xvalues[0].slice(viewWindow.start, viewWindow.end))
                : 1;
            const min =
              xvalues[1] && xvalues[1].length
                ? _.min(xvalues[1].slice(viewWindow.start, viewWindow.end))
                : 0;

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
        } else if (tracks[i].type in numericalTracks) {
          const tid = tracks[i].id;

          if (trackData[tid]) {
            const data = trackData[tid].data;
            let xvalues;
            if (
              trackFetchedDataCache.current[tid][dataIdx]["xvalues"] &&
              trackData[tid].usePrimaryNav
            ) {
              continue;
            } else {
              if (tracks[i].type === "dynseq") {
                xvalues = this.aggregator.xToValueMaker(
                  data,
                  trackData[tid].visRegion,
                  width,
                  trackData[tid].configOptions
                );
              } else if (tracks[i].type === "methylc") {
                xvalues = this.aggregateRecords(
                  data,
                  trackData[tid].visRegion,
                  width
                );
              } else if (tracks[i].type === "matplot") {
                xvalues = data.map(
                  (d) =>
                    this.aggregator.xToValueMaker(
                      d,
                      trackData[tid].visRegion,
                      width,
                      trackData[tid].configOptions
                    )[0]
                );
              } else {
                xvalues = this.aggregator.xToValueMaker(
                  data,
                  trackData[tid].visRegion,
                  width,
                  trackData[tid].configOptions
                );
              }

              if (!trackFetchedDataCache.current[tid][dataIdx]) {
                trackFetchedDataCache.current[tid][dataIdx] = {};
              }
              trackFetchedDataCache.current[tid][dataIdx]["xvalues"] = xvalues;
            }
          }
        }

        else {

          let featureArrange = new FeatureArranger();
          let sortType = SortItemsOptions.NOSORT;
          const tid = tracks[i].id;
          if (
            trackFetchedDataCache.current[tid][dataIdx]["xvalues"] &&
            trackData[tid].usePrimaryNav
          ) {
            continue;
          }
          const curTrackModel = tracks[i];
          const configOptions = trackOptionMap[curTrackModel.type]
            ? { ...trackOptionMap[`${curTrackModel.type}`].defaultOptions, ...curTrackModel.options }
            : { ...trackOptionMap["error"].defaultOptions }

          if (trackData[tid]) {
            const data = trackData[tid].data;

            const placeFeatureData = featureArrange.arrange(
              data,
              trackData[tid].visRegion,
              width,
              trackOptionMap[`${curTrackModel.type}`]
                ? trackOptionMap[`${curTrackModel.type}`].getGenePadding
                : trackOptionMap["error"].getGenePadding,
              configOptions.hiddenPixels,
              sortType,
              viewWindow,
            );

            let height;
            height =
              curTrackModel.type === "repeatmasker" ||
                curTrackModel.type === "rmskv2" ||
                curTrackModel.type === "categorical" ||
                curTrackModel.type === "modbed"
                ? configOptions?.height
                : placeFeatureData.numRowsAssigned
                  ? getHeight(placeFeatureData.numRowsAssigned, curTrackModel, configOptions)
                  : 40;

            if (!trackFetchedDataCache.current[tid][dataIdx]) {
              console.log("wut", dataIdx, trackFetchedDataCache.current)
              trackFetchedDataCache.current[tid][dataIdx] = {};
            }

            trackFetchedDataCache.current[tid][dataIdx]["xvalues"] = { placements: placeFeatureData, height, numHidden: placeFeatureData.numHidden };
          }
        }
        // }
      }
      // console.log(grouping);
      return _.isEmpty(grouping) ? {} : grouping;
    }
    return {};
  }

  getGroupScaleWithXvalues(
    tracks: TrackModel[],
    trackData: any,
    viewWindow: OpenInterval
  ): { [groupId: number]: { scale: TrackModel; min: {}; max: {} } } {
    // console.log(tracks);
    if (trackData) {
      const grouping = {}; // key: group id, value: {scale: 'auto'/'fixed', min: {trackid: xx,,,}, max: {trackid: xx,,,,}}
      for (let i = 0; i < tracks.length; i++) {
        // if (tracks[i].options.hasOwnProperty("group") && tracks[i].options.group) { // check up already done at trackContainer
        // console.log(tracks[i]);
        if (
          !(tracks[i].type in numericalTracksGroup) ||
          !tracks[i].options.group
        ) {
          continue;
        }
        const g = tracks[i].options.group;
        const tid = tracks[i].id;
        if (tracks[i].options.yScale === ScaleChoices.FIXED) {
          grouping[g] = {
            scale: ScaleChoices.FIXED,
            min: { [tid]: tracks[i].options.yMin },
            max: { [tid]: tracks[i].options.yMax },
          };
          break;
        }
        if (trackData[tid]) {
          const xvalues = trackData[tid];
          // console.log(data);
          const max =
            xvalues[0] && xvalues[0].length
              ? _.max(xvalues[0].slice(viewWindow.start, viewWindow.end))
              : 1;
          const min =
            xvalues[1] && xvalues[1].length
              ? _.min(xvalues[1].slice(viewWindow.start, viewWindow.end))
              : 0;

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
        // }
      }
      // console.log(grouping);
      return _.isEmpty(grouping) ? {} : grouping;
    }
    return {};
  }
}
