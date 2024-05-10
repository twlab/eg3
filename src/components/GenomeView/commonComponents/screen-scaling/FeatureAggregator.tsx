import { scaleLinear } from "d3-scale";
export const DEFAULT_OPTIONS = {
  aggregateMethod: "mean",
  displayMode: "auto",
  height: 40,
  color: "blue",
  colorAboveMax: "red",
  color2: "darkorange",
  color2BelowMin: "darkgreen",
  yScale: "auto",
  yMax: 10,
  yMin: 0,
  smooth: 0,
  ensemblStyle: false,
};

const AUTO_HEATMAP_THRESHOLD = 21; // If pixel height is less than this, automatically use heatmap
const TOP_PADDING = 2;
const THRESHOLD_HEIGHT = 3; // the bar tip height which represet value above max or below min

export interface FeatureAggregator {
  makeXMap(trackGenes: Array<any>, bpToPx: number, windowWidth: number);
}

function computeScales(
  xToValue,
  xToValue2,
  regionStart,
  regionEnd,
  height: number = 40,
  yScale: string = "auto",
  yMin: number = 0,
  yMax: number = 10
) {
  /*
        All tracks get `PropsFromTrackContainer` (see `Track.ts`).

        `props.viewWindow` contains the range of x that is visible when no dragging.  
            It comes directly from the `ViewExpansion` object from `RegionExpander.ts`
        */

  // if (yMin >= yMax) {
  //   notify.show("Y-axis min must less than max", "error", 2000);
  // }
  // const { trackModel, groupScale } = this.props;
  let min: number,
    max: number,
    xValues2 = [];
  // if (groupScale) {
  //   if (trackModel.options.hasOwnProperty("group")) {
  //     gscale = groupScale[trackModel.options.group];
  //   }
  // }
  // if (!_.isEmpty(gscale)) {
  //   max = _.max(Object.values(gscale.max));
  //   min = _.min(Object.values(gscale.min));

  const visibleValues = xToValue.slice(regionStart, regionEnd);
  max = Math.max(...xToValue) || 1; // in case undefined returned here, cause maxboth be undefined too
  xValues2 = xToValue2.filter((x) => x);
  min =
    (xValues2.length ? Math.min(xToValue2.slice(regionStart, regionEnd)) : 0) ||
    0;
  const maxBoth = Math.max(Math.abs(max), Math.abs(min));
  max = maxBoth;
  min = xValues2.length ? -maxBoth : 0;
  if (yScale === "fixed") {
    max = yMax ? yMax : max;
    min = yMin !== undefined ? yMin : min;
    if (xValues2.length && yMin > 0) {
      // notify.show(
      //   "Please set Y-axis min <=0 when there are negative values",
      //   "warning",
      //   5000
      // );
      min = 0;
    }
  }

  // if (min > max) {
  //   notify.show("Y-axis min should less than Y-axis max", "warning", 5000);
  //   min = 0;
  // }

  // determines the distance of y=0 from the top, also the height of positive part
  const zeroLine =
    min < 0
      ? TOP_PADDING + ((height - 2 * TOP_PADDING) * max) / (max - min)
      : height;
  console.log(min, max, zeroLine);
  if (
    xValues2.length &&
    (yScale === "auto" || (yScale === "fixed" && yMin < 0))
  ) {
    return {
      axisScale: scaleLinear()
        .domain([max, min])
        .range([TOP_PADDING, height - TOP_PADDING])
        .clamp(true),
      valueToY: scaleLinear()
        .domain([max, 0])
        .range([TOP_PADDING, zeroLine])
        .clamp(true),
      valueToYReverse: scaleLinear()
        .domain([0, min])
        .range([0, height - zeroLine - TOP_PADDING])
        .clamp(true),
      valueToOpacity: scaleLinear().domain([0, max]).range([0, 1]).clamp(true),
      valueToOpacityReverse: scaleLinear()
        .domain([0, min])
        .range([0, 1])
        .clamp(true),
      min,
      max,
      zeroLine,
    };
  } else {
    return {
      axisScale: scaleLinear()
        .domain([max, min])
        .range([TOP_PADDING, height])
        .clamp(true),
      valueToY: scaleLinear()
        .domain([max, min])
        .range([TOP_PADDING, height])
        .clamp(true),
      valueToOpacity: scaleLinear()
        .domain([min, max])
        .range([0, 1])
        .clamp(true),
      // for group feature when there is only nagetiva data, to be fixed
      valueToYReverse: scaleLinear()
        .domain([0, min])
        .range([0, height - zeroLine - TOP_PADDING])
        .clamp(true),
      valueToOpacityReverse: scaleLinear()
        .domain([0, min])
        .range([0, 1])
        .clamp(true),
      min,
      max,
      zeroLine,
    };
  }
}

export const myFeatureAggregator: FeatureAggregator = {
  makeXMap(trackGenes, bpToPx, windowWidth) {
    function averagFeatureHeight(data: any) {
      let xToFeatures: Array<Array<any>> = [];
      for (let i = 0; i < data.length; i++) {
        const newArr: Array<any> = Array.from(
          { length: Number(windowWidth * 2) },
          () => []
        );
        xToFeatures.push(newArr);
      }

      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          let singleStrand = data[i][j];

          if (Object.keys(singleStrand).length > 0) {
            let xSpanStart = (singleStrand.start - trackGenes[i][1]) / bpToPx!;
            let xSpanEnd = (singleStrand.end - trackGenes[i][1]) / bpToPx!;
            const startX = Math.max(0, Math.floor(xSpanStart));
            const endX = Math.min(windowWidth * 2 - 1, Math.ceil(xSpanEnd));

            for (let x = startX; x <= endX; x++) {
              xToFeatures[i][x].push(singleStrand);
            }
          }
        }
      }

      return xToFeatures;
    }
    function xAvg(data: any) {
      let max = 0;
      let min = 0;

      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          let sum = 0;

          for (let x = 0; x < data[i][j].length; x++) {
            sum += data[i][j][x].score;
          }
          let avgPos = 0;
          if (data[i][j].length > 0) {
            avgPos = sum / data[i][j].length;
          }

          if (avgPos > max) {
            max = avgPos;
          }
          if (avgPos < min) {
            min = avgPos;
          }
          data[i][j] = avgPos;
        }
      }

      return [data, max, min];
    }
    function scaleX(data: any) {
      var scale = scaleLinear()
        .domain([-data[1], data[1]])
        .range([2, 20])
        .clamp(true);
      for (let i = 0; i < data[0].length; i++) {
        for (let j = 0; j < data[0][i].length; j++) {
          if (data[0][i][j] !== 0) {
            data[0][i][j] = scale(data[0][i][j]);
          }
        }
      }

      return data;
    }

    let dataForward: Array<any> = [];
    let dataReverse: Array<any> = [];
    for (let i = 0; i < trackGenes.length; i++) {
      const newArr: Array<any> = [];
      dataForward.push(newArr);
      const newArr2: Array<any> = [];
      dataReverse.push(newArr2);
    }

    for (let i = 0; i < trackGenes.length; i++) {
      let startPos = trackGenes[i][1];
      for (let j = 0; j < trackGenes[i][0].length; j++) {
        for (let x = 0; x < trackGenes[i][0][j].length; x++) {
          let singleStrand = trackGenes[i][0][j][x];
          if (singleStrand.score < 0) {
            dataReverse[i].push(singleStrand);
          } else {
            dataForward[i].push(singleStrand);
          }
        }
      }
    }

    let featureForward = averagFeatureHeight(dataForward);

    let featureReverse = averagFeatureHeight(dataReverse);

    let avgPos = xAvg(featureForward);
    let avgNeg = xAvg(featureReverse);
    avgNeg[1] = avgPos[1];
    avgNeg[2] = avgPos[2];

    for (let i = 0; i < avgPos[0].length; i++) {
      let scales = computeScales(
        avgPos[0][i],
        avgNeg[0][i],
        trackGenes[i][1],
        trackGenes[i][1] + bpToPx
      );
      for (let j = 0; j < avgPos[0][i].length; j++) {
        if (avgPos[0][i][j] !== 0) {
          avgPos[0][i][j] = scales.valueToY(avgPos[0][i][j]);
        }
      }
    }

    let newResult: Array<any> = [];
    newResult.push(featureForward);
    newResult.push(featureReverse);
    return newResult;
  },
};
