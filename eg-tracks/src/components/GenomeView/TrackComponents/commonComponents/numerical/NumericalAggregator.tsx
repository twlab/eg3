import memoizeOne from "memoize-one";
import Smooth from "array-smooth";
import {
  DefaultAggregators,
  FeatureAggregator,
} from "../../../../../models/FeatureAggregator";
import { ScaleChoices } from "../../../../../models/ScaleChoices";
import { DEFAULT_OPTIONS } from "./NumericalTrack";

export class NumericalAggregator {
  constructor() {
    this.xToValueMaker = memoizeOne(this.xToValueMaker);
  }

  // aggregateFeatures(data, viewRegion, width, aggregatorId) {
  //   const aggregator = new FeatureAggregator();
  //   let newAggregatorId = aggregatorId;
  //   if (aggregatorId === "IMAGECOUNT" || !aggregatorId) {
  //     newAggregatorId = "MEAN";
  //   } else {
  //     newAggregatorId = aggregatorId;
  //   }

  //   const aggregateFunc = DefaultAggregators.fromId(newAggregatorId);

  //   // Use optimized method that combines placement and aggregation in one pass
  //   return aggregator.makeXMapWithAggregation(
  //     data,
  //     viewRegion,
  //     width,
  //     aggregateFunc
  //   );
  // }

  xToValueMaker(data, viewRegion, width, options, viewWindow) {
    const withDefaultOptions = Object.assign({}, DEFAULT_OPTIONS, options);
    const { aggregateMethod, smooth, yScale, yMin } = withDefaultOptions;

    let xToValue,
      xToValue2,
      hasReverse = false,
      hasForward = false;
    if (data) {
      const aggregator = new FeatureAggregator();
      let newAggregatorId = aggregateMethod;
      if (aggregateMethod === "IMAGECOUNT" || !aggregateMethod) {
        newAggregatorId = "MEAN";
      }
      const aggregateFunc = DefaultAggregators.fromId(newAggregatorId);

      const [xToValueBeforeSmooth, xToValue2BeforeSmooth] = aggregator.makeXMap(
        data,
        viewRegion,
        width,
        aggregateFunc,
        true,
        viewWindow
      );

      const smoothNumber = Number.parseInt(smooth) || 0;
      xToValue =
        smoothNumber === 0
          ? xToValueBeforeSmooth
          : Smooth(xToValueBeforeSmooth, smoothNumber);
      xToValue2 =
        smoothNumber === 0
          ? xToValue2BeforeSmooth
          : Smooth(xToValue2BeforeSmooth, smoothNumber);

      for (let i = 0; i < xToValue.length; i++) {
        if (!hasForward && xToValue[i]) {
          hasForward = true;
        }
        if (
          !hasReverse &&
          xToValue2[i] &&
          (yScale === ScaleChoices.AUTO ||
            (yScale === ScaleChoices.FIXED && yMin < 0))
        ) {
          hasReverse = true;
        }

        if (hasForward && hasReverse) {
          break;
        }
      }
    }
    return [xToValue, xToValue2, hasReverse, hasForward];
  }
}
