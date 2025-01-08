import _ from "lodash";
import { ScaleChoices } from "@/models/ScaleChoices";
import TrackModel from "@/models/TrackModel";

import NumericalTrack from "../TrackComponents/commonComponents/numerical/NumericalTrack";
import OpenInterval from "@/models/OpenInterval";
import { NumericalAggregator } from "../TrackComponents/commonComponents/numerical/NumericalAggregator";

export class GroupedTrackManager {
  /**
   * @returns list of groups found in the track list, their data, and their original indicies
   */
  public aggregator: NumericalAggregator;
  constructor() {
    this.aggregator = new NumericalAggregator();
  }

  getGroupScale(
    tracks: TrackModel[],
    trackData: any,
    width: number,
    viewWindow: OpenInterval
  ): { [groupId: number]: { scale: TrackModel; min: {}; max: {} } } {
    // console.log(tracks);
    const grouping = {}; // key: group id, value: {scale: 'auto'/'fixed', min: {trackid: xx,,,}, max: {trackid: xx,,,,}}
    for (let i = 0; i < tracks.length; i++) {
      // if (tracks[i].options.hasOwnProperty("group") && tracks[i].options.group) { // check up already done at trackContainer
      // console.log(tracks[i]);
      if (tracks[i].type !== "bigwig") {
        continue;
      }
      const g = tracks[i].options.group;
      const tid = tracks[i].getId();
      if (tracks[i].options.yScale === ScaleChoices.FIXED) {
        grouping[g] = {
          scale: ScaleChoices.FIXED,
          min: { [tid]: tracks[i].options.yMin },
          max: { [tid]: tracks[i].options.yMax },
        };
        break;
      }
      const data = trackData[tid].data;
      // console.log(data);
      const xvalues = this.aggregator.xToValueMaker(
        data,
        trackData[tid].visRegion,
        width,
        tracks[i].options
      );
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
      // }
    }
    // console.log(grouping);
    return _.isEmpty(grouping) ? undefined : grouping;
  }
}
