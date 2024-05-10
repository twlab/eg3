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

/**
 * Track specialized in showing numerical data.
 *
 * @author Silas Hsu
 * @author Chanrung
 */
function NumericalTrackScaling() {
  function computeScales(xToValue, xToValue2, height) {
    /*
        All tracks get `PropsFromTrackContainer` (see `Track.ts`).

        `props.viewWindow` contains the range of x that is visible when no dragging.  
            It comes directly from the `ViewExpansion` object from `RegionExpander.ts`
        */
    console.log("SCALE", xToValue, xToValue2, height);
    const { yScale, yMin, yMax } = this.props.options;
    // if (yMin >= yMax) {
    //     notify.show("Y-axis min must less than max", "error", 2000);
    // }
    const { trackModel, groupScale } = this.props;

    {
      const visibleValues = xToValue.slice(
        this.props.viewWindow.start,
        this.props.viewWindow.end
      );
      max = _.max(visibleValues) || 1; // in case undefined returned here, cause maxboth be undefined too
      xValues2 = xToValue2.filter((x) => x);
      min =
        (xValues2.length
          ? _.min(
              xToValue2.slice(
                this.props.viewWindow.start,
                this.props.viewWindow.end
              )
            )
          : 0) || 0;
      const maxBoth = Math.max(Math.abs(max), Math.abs(min));
      max = maxBoth;
      min = xValues2.length ? -maxBoth : 0;
      if (yScale === ScaleChoices.FIXED) {
        max = yMax ? yMax : max;
        min = yMin !== undefined ? yMin : min;
        if (xValues2.length && yMin > 0) {
          notify.show(
            "Please set Y-axis min <=0 when there are negative values",
            "warning",
            5000
          );
          min = 0;
        }
      }
    }
    if (min > max) {
      notify.show("Y-axis min should less than Y-axis max", "warning", 5000);
      min = 0;
    }

    // determines the distance of y=0 from the top, also the height of positive part
    const zeroLine =
      min < 0
        ? TOP_PADDING + ((height - 2 * TOP_PADDING) * max) / (max - min)
        : height;
    console.log("MAX", min, max, zeroLine);
    if (
      xValues2.length &&
      (yScale === ScaleChoices.AUTO ||
        (yScale === ScaleChoices.FIXED && yMin < 0))
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
        valueToOpacity: scaleLinear()
          .domain([0, max])
          .range([0, 1])
          .clamp(true),
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
}

function CanvasRenderer() {}

function SVGRenderer() {}
