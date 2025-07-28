import _ from "lodash";
import NavigationContext from "./NavigationContext";
import { Feature } from "./Feature";
import { FeatureSegment } from "./FeatureSegment";

export interface Gap {
  contextBase: number;
  length: number;
}
function niceBpCount(bases: number, useMinus = false) {
  const rounded = bases >= 1000 ? Math.floor(bases) : Math.round(bases);
  if (rounded >= 750000) {
    return `${(rounded / 1000000).toFixed(1)} Mb`;
  } else if (rounded >= 10000) {
    return `${(rounded / 1000).toFixed(1)} Kb`;
  } else if (rounded > 0) {
    return `${rounded} bp`;
  } else {
    if (useMinus) {
      return "<1 bp";
    } else {
      return "0 bp";
    }
  }
}

export class NavContextBuilder {
  private _baseNavContext: NavigationContext;
  private _gaps: Array<any> | undefined;
  private _cumulativeGapBases: number[];

  constructor(baseNavContext: NavigationContext) {
    this._baseNavContext = baseNavContext;
    this._cumulativeGapBases = [];
  }

  /**
   * @param gaps
   */
  setGaps(gaps: Array<any>) {
    this._gaps = gaps.slice().sort((a, b) => a.contextBase - b.contextBase);
    this._cumulativeGapBases = [];
    let sum = 0;
    for (const gap of this._gaps) {
      this._cumulativeGapBases.push(sum);
      sum += gap.length;
    }
    this._cumulativeGapBases.push(sum);
  }

  build(): NavigationContext {
    const baseFeatures = this._baseNavContext.getFeatures();

    const indexForFeature = new Map();
    for (let i = 0; i < baseFeatures.length; i++) {
      indexForFeature.set(baseFeatures[i], i);
    }

    const resultFeatures: Feature[] = [];
    let prevSplitIndex = -1;
    let prevSplitBase = 0;
    for (const gap of this._gaps!) {
      const featureCoordinate =
        this._baseNavContext.convertBaseToFeatureCoordinate(gap.contextBase);
      const featureToSplit = featureCoordinate.feature;
      const indexToSplit = indexForFeature.get(featureToSplit);
      const splitBase = featureCoordinate.relativeStart;

      resultFeatures.push(
        ...baseFeatures.slice(prevSplitIndex + 1, indexToSplit)
      ); // Might push nothing
      if (indexToSplit === prevSplitIndex && prevSplitBase > 0) {
        // We're splitting the same feature again.  Due to sorting, this split lies within the last feature of
        // resultFeatures.  Remove it.
        resultFeatures.pop();
      }

      prevSplitBase = prevSplitBase > splitBase ? 0 : prevSplitBase;

      const leftLocus = new FeatureSegment(
        featureToSplit,
        prevSplitBase,
        splitBase
      ).getLocus();
      const rightLocus = new FeatureSegment(
        featureToSplit,
        splitBase
      ).getLocus();
      if (leftLocus.getLength() > 0) {
        resultFeatures.push(
          new Feature(
            featureToSplit.getName(),
            leftLocus,
            featureToSplit.getStrand()
          )
        );
      }
      resultFeatures.push(
        NavigationContext.makeGap(gap.length, `${niceBpCount(gap.length)} gap`)
      );
      if (rightLocus.getLength() > 0) {
        resultFeatures.push(
          new Feature(
            featureToSplit.getName(),
            rightLocus,
            featureToSplit.getStrand()
          )
        );
      }

      prevSplitIndex = indexToSplit;
      prevSplitBase = splitBase;
    }

    resultFeatures.push(...baseFeatures.slice(prevSplitIndex + 1));

    return new NavigationContext(
      this._baseNavContext.getName(),
      resultFeatures
    );
  }

  convertOldCoordinates(base: number): number {
    const index = _.sortedIndexBy(
      this._gaps,
      { contextBase: base },
      "contextBase"
    );
    const gapBases = this._cumulativeGapBases[index] || 0; // Out-of-bounds index can happen if there are no gaps.
    return base + gapBases;
  }
}
