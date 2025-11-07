import memoizeOne from "memoize-one";
import Smooth from "array-smooth";
import {
  DefaultAggregators,
  FeatureAggregator,
} from "../../../../../models/FeatureAggregator";
import { ScaleChoices } from "../../../../../models/ScaleChoices";
import { DEFAULT_OPTIONS } from "./NumericalTrack";

/*
separate aggregate function out
*/

export class NumericalAggregator {
  constructor() {
    this.aggregateFeatures = memoizeOne(this.aggregateFeatures);
    this.xToValueMaker = memoizeOne(this.xToValueMaker);
  }

  aggregateFeatures(data, viewRegion, width, aggregatorId) {
    const aggregator = new FeatureAggregator();
    let newAggregatorId = aggregatorId;
    if (aggregatorId === "IMAGECOUNT" || !aggregatorId) {
      newAggregatorId = "MEAN";
    } else {
      newAggregatorId = aggregatorId;
    }

    const aggregateFunc = DefaultAggregators.fromId(newAggregatorId);
    
    // Use optimized method that combines placement and aggregation in one pass
    return aggregator.makeXMapWithAggregation(
      data,
      viewRegion,
      width,
      aggregateFunc
    );
  }

  xToValueMaker(data, viewRegion, width, options) {
    const withDefaultOptions = Object.assign({}, DEFAULT_OPTIONS, options);
    const { aggregateMethod, smooth, yScale, yMin } = withDefaultOptions;

    let xToValue2BeforeSmooth,
      xToValue,
      xToValue2,
      hasReverse = false;
    if (data) {
      // Use a single loop to separate data and remove duplicates based on locus
      const seenLoci = new Set<string>();
      const dataForward: typeof data = [];
      const dataReverse: typeof data = [];

      for (const feature of data) {
        // Create unique identifier from locus start and end
        const locusId = `${feature.locus.start}-${feature.locus.end}`;

        // Skip if we've already seen this locus
        if (seenLoci.has(locusId)) {
          continue;
        }

        seenLoci.add(locusId);

        // Separate into forward and reverse based on value
        if (feature.value === undefined || feature.value >= 0) {
          dataForward.push(feature); // bed track to density mode
        } else {
          dataReverse.push(feature);
        }
      }

      if (dataReverse.length) {
        xToValue2BeforeSmooth = this.aggregateFeatures(
          dataReverse,
          viewRegion,
          width,
          aggregateMethod
        );
      } else {
        xToValue2BeforeSmooth = [];
      }
      const smoothNumber = Number.parseInt(smooth) || 0;
      xToValue2 =
        smoothNumber === 0
          ? xToValue2BeforeSmooth
          : Smooth(xToValue2BeforeSmooth, smoothNumber);
      const xValues2 = xToValue2.filter((x) => x);
      if (
        xValues2.length &&
        (yScale === ScaleChoices.AUTO ||
          (yScale === ScaleChoices.FIXED && yMin < 0))
      ) {
        hasReverse = true;
      }
      const xToValueBeforeSmooth =
        dataForward.length > 0
          ? this.aggregateFeatures(
            dataForward,
            viewRegion,
            width,
            aggregateMethod
          )
          : [];
      xToValue =
        smoothNumber === 0
          ? xToValueBeforeSmooth
          : Smooth(xToValueBeforeSmooth, smoothNumber);
    }

    return [xToValue, xToValue2, hasReverse];
  }
}
