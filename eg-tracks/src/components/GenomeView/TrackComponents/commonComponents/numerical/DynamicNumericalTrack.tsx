import React, { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import memoizeOne from "memoize-one";
import _ from "lodash";
import { scaleLinear } from "d3-scale";
import {
  FeatureAggregator,
  DefaultArrayAggregators,
} from "../../../../../models/FeatureAggregator";
import { PixiScene } from "./PixiScene";
import GenomicCoordinates from "./GenomicCoordinates";
import TrackLegend from "../TrackLegend";
import HoverToolTip from "../HoverToolTips/HoverToolTip";

export const DEFAULT_OPTIONS = {
  arrayAggregateMethod: DefaultArrayAggregators.types.MEAN,
  height: 80,
  color: "blue",
  backgroundColor: "var(--bg-color)",
  playing: true,
  speed: [10],
  dynamicColors: [],
  useDynamicColors: false,
};

const TOP_PADDING = 2;

interface DynamicNumericalTrackProps {
  data: any[];
  unit?: string;
  options: {
    arrayAggregateMethod: string;
    height: number;
    color?: string;
    backgroundColor?: string;
    playing?: boolean;
    speed?: number[];
    dynamicColors?: string[];
    useDynamicColors?: boolean;
  };
  isLoading?: boolean;
  error?: any;
  trackModel: any;
  viewRegion: any;
  width: number;
  viewWindow: { start: number; end: number };
  updatedLegend?: any
  dataIdx: number;
}

const DynamicNumericalTrack: React.FC<DynamicNumericalTrackProps> = (props) => {
  const { data, unit, options, trackModel, viewRegion, width, viewWindow, updatedLegend } =
    props;

  const {
    height,
    arrayAggregateMethod,
    color,
    backgroundColor,
    playing,
    speed,
    dynamicColors,
    useDynamicColors,

  } = options;

  const aggregateFeatures = useCallback(
    memoizeOne((data, viewRegion, width, aggregatorId) => {
      const aggregator = new FeatureAggregator();
      const xToFeatures = aggregator.makeXMap(data, viewRegion, width);
      if (xToFeatures && xToFeatures.xToFeaturesForward) { return xToFeatures.xToFeaturesForward.map(DefaultArrayAggregators.fromId(aggregatorId)); }
      return []
    }),
    []
  );

  const computeScales = useCallback(
    memoizeOne((xToValue, height) => {
      const visibleValues = xToValue.slice(viewWindow.start, viewWindow.end);
      const max = _.max(visibleValues.map((x) => _.max(x))) || 1;
      let min: any = _.min(visibleValues.map((x) => _.min(x))) || 0;
      if (min > 0) {
        min = 0;
      }
      return {
        valueToY: scaleLinear()
          .domain([max, min])
          .range([TOP_PADDING, height])
          .clamp(true),
        min,
        max,
      };
    }),
    [viewWindow.start, viewWindow.end]
  );

  const xToValue = useMemo(
    () => aggregateFeatures(data, viewRegion, width, arrayAggregateMethod),
    [data, viewRegion, width, arrayAggregateMethod]
  );
  const scales = useMemo(
    () => computeScales(xToValue, height),
    [xToValue, height]
  );


  if (updatedLegend) {
    updatedLegend.current = (
      <TrackLegend trackModel={trackModel} height={height} axisScale={scales.valueToY} axisLegend={unit} />
    );
  }
  const visualizer = (
    <React.Fragment>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          position: "absolute",
          zIndex: 3,
        }}
      >

        <HoverToolTip
          data={xToValue}
          windowWidth={width}
          trackType={"dbedgraph"}
          trackModel={trackModel}
          height={height}
          viewRegion={viewRegion}
          unit={unit}
          hasReverse={true}
          options={options}
        />

      </div>
      <PixiScene
        xToValue={xToValue}
        scales={scales}
        width={width}
        height={height}
        color={color}
        backgroundColor={backgroundColor}
        playing={playing}
        speed={speed}
        viewWindow={viewWindow}
        dynamicColors={dynamicColors}
        useDynamicColors={useDynamicColors}
      />
    </React.Fragment>
  );

  return visualizer;
};

export default DynamicNumericalTrack;
