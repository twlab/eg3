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
  }

  getGroupScale(

    trackData: any,
    width: number,
    viewWindow: OpenInterval,
    dataIdx: number,
    trackFetchedDataCache: any
  ): { [groupId: number]: { scale: TrackModel; min: {}; max: {} } } {
    // console.log(tracks);
    if (trackData) {

      const grouping = {}; // key: group id, value: {scale: 'auto'/'fixed', min: {trackid: xx,,,}, max: {trackid: xx,,,,}}
      for (let i = 0; i < trackData.length; i++) {
        // if (tracks[i].options.hasOwnProperty("group") && tracks[i].options.group) { // check up already done at trackContainer
        // console.log(tracks[i]);
        const track = trackData[i];
        console.log(track)
        if (track.configOptions.group && track.trackModel.type in numericalTracksGroup) {

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

            if (trackFetchedDataCache.current[tid][dataIdx]["xvalues"]) {
              xvalues = trackFetchedDataCache.current[tid][dataIdx]["xvalues"];
            } else {
              xvalues = this.aggregator.xToValueMaker(
                data,
                track.visRegion,
                width,
                track.configOptions
              );
              if (!trackFetchedDataCache.current[tid][dataIdx]) {
                trackFetchedDataCache.current[tid][dataIdx] = {};
              }
              trackFetchedDataCache.current[tid][dataIdx]["xvalues"] = xvalues;
            }
            let max = 0, min = 0;
            let revmax = 0, revmin = 0;
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
        } else {
          const tid = track.id;

          if (track.data) {
            const data = track.data;
            let xvalues;
            if (
              trackFetchedDataCache.current[tid][dataIdx]["xvalues"] &&
              track.usePrimaryNav
            ) {
              continue;
            } else {
              if (track.trackModel.type === "dynseq") {
                xvalues = this.aggregator.xToValueMaker(
                  data,
                  track.visRegion,
                  width,
                  track.configOptions
                );
              } else if (track.trackModel.type === "methylc") {
                xvalues = this.aggregateRecords(
                  data,
                  track.visRegion,
                  width
                );
              } else if (track.trackModel.type === "matplot") {
                xvalues = data.map(
                  (d) =>
                    this.aggregator.xToValueMaker(
                      d,
                      track.visRegion,
                      width,
                      track.configOptions
                    )[0]
                );
              } else {
                xvalues = this.aggregator.xToValueMaker(
                  data,
                  track.visRegion,
                  width,
                  track.configOptions
                );
              }

              if (!trackFetchedDataCache.current[tid][dataIdx]) {
                trackFetchedDataCache.current[tid][dataIdx] = {};
              }
              trackFetchedDataCache.current[tid][dataIdx]["xvalues"] = xvalues;
            }
          }
        }
        // }
      }

      return _.isEmpty(grouping) ? {} : grouping;
    }
    return {};
  }


}
