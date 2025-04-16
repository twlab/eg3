import _ from "lodash";
import { ScaleChoices } from "../../../models/ScaleChoices";
import TrackModel from "../../../models/TrackModel";

import { NumericalAggregator } from "./commonComponents/numerical/NumericalAggregator";
import OpenInterval from "../../../models/OpenInterval";
import { DefaultAggregators, FeatureAggregator } from "../../../models/FeatureAggregator";
import MethylCRecord from "../../../models/MethylCRecord";
export const numericalTracks = {
  bigwig: "",
  bedgraph: "",
  methylc: "",
  boxplot: "",
  qbed: "",
  vcf: "",
  dynseq: "",
  matplot: ""
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
  dynseqAggregator: (data: any[], viewRegion: any, width: number, aggregatorId: string) => any;
  aggregateRecords: (data: any[], viewRegion: any, width: number) => any;
  aggregateFeaturesMatplot: (data: any, viewRegion: any, width: any, aggregatorId: any) => any;
  constructor() {
    this.aggregator = new NumericalAggregator();
    this.dynseqAggregator = (
      data: any[],
      viewRegion: any,
      width: number,
      aggregatorId: string
    ) => {
      const aggregator = new FeatureAggregator();
      const xToFeatures = aggregator.makeXMap(data, viewRegion, width);
      return xToFeatures.map(DefaultAggregators.fromId(aggregatorId));
    };
    this.aggregateRecords = (data: any[], viewRegion: any, width: number) => {
      const aggregator = new FeatureAggregator();
      const xToRecords = aggregator.makeXMap(data, viewRegion, width);
      return xToRecords.map(MethylCRecord.aggregateByStrand);
    };
    this.aggregateFeaturesMatplot = (data, viewRegion, width, aggregatorId) => {
      const aggregator = new FeatureAggregator();
      const xToFeatures = aggregator.makeXMap(data, viewRegion, width);
      return xToFeatures.map(DefaultAggregators.fromId(aggregatorId));
    };
  }

  getGroupScale(
    tracks: TrackModel[],
    trackData: any,
    width: number,
    viewWindow: OpenInterval,
    dataIdx: number,
    trackFetchedDataCache: any,

  ): { [groupId: number]: { scale: TrackModel; min: {}; max: {} } } {
    // console.log(tracks);
    if (trackData) {
      console.log(trackData)
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
        } else {
          const tid = tracks[i].id;


          if (trackData[tid]) {
            const data = trackData[tid].data;
            let xvalues;
            if (
              trackFetchedDataCache.current[tid][dataIdx]["xvalues"]

            ) {
              if (tracks[i].type === "matplot") {
                console.log(tracks[i], "HUIH", trackFetchedDataCache.current[tid][dataIdx]["xvalues"])
              }
            }
            else {

              if (tracks[i].type === "dynseq") {
                let hasReverse = false
                let xToValue
                let xToValue2
                const dataForward = data.filter(
                  (feature) => feature.value === undefined || feature.value >= 0
                );
                const dataReverse = data.filter((feature) => feature.value < 0);

                if (dataReverse.length > 0) {
                  hasReverse = true;
                  xToValue2! = this.dynseqAggregator(
                    dataReverse,
                    trackData[tid].visRegion,
                    width,
                    trackData[tid].configOptions.aggregateMethod
                  );
                } else {
                  xToValue2 = [];
                }

                xToValue! =
                  dataForward.length > 0
                    ? this.dynseqAggregator(
                      dataForward,
                      trackData[tid].visRegion,
                      width,
                      trackData[tid].configOptions.aggregateMethod
                    )
                    : [];
                xvalues = [xToValue, xToValue2, hasReverse]
              }
              else if (tracks[i].type === "methylc") {
                xvalues = this.aggregateRecords(data, trackData[tid].visRegion, width);
              }
              else if (tracks[i].type === "matplot") {

                xvalues = data.map((d) =>
                  this.aggregateFeaturesMatplot(d, trackData[tid].visRegion, width, trackData[tid].configOptions.aggregateMethod))


              }

              else {
                xvalues = this.aggregator.xToValueMaker(
                  data,
                  trackData[tid].visRegion,
                  width,
                  trackData[tid].configOptions
                );

              }
              trackFetchedDataCache.current[tid][dataIdx]["xvalues"] = xvalues;
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
