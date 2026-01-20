import React, { useMemo } from "react";
import memoizeOne from "memoize-one";
import _ from "lodash";
import FeatureArranger from "../../../../models/FeatureArranger";
import { PixiAnnotation } from "../commonComponents/annotation/PixiAnnotation";
import TrackLegend from "../commonComponents/TrackLegend";

export const TOP_PADDING = 2;
export const ROW_VERTICAL_PADDING = 2;

export const DEFAULT_OPTIONS = {
  color: "blue",
  color2: "red",
  rowHeight: 10,
  maxRows: 5,
  hiddenPixels: 0.5,
  speed: [5],
  playing: true,
  dynamicColors: [],
  useDynamicColors: false,
};

interface DynamicBedTrackProps {
  data: any[];
  visRegion: any;
  viewWindow: { start: number };
  width: number;
  options: any;
  trackModel: any;
  svgHeight?: any;
  updatedLegend?: any;
  dataIdx: number;
}

const getBedPadding = (bed: any, rowHeight: number) =>
  bed.getName().length * rowHeight + 2;

const getHeight = (results: any[], rowHeight: number, maxRows: number) => {
  const maxRow = _.max(results.map((r) => r.numRowsAssigned));
  let rowsToDraw = Math.min(maxRow, maxRows);
  if (rowsToDraw < 1) {
    rowsToDraw = 1;
  }
  return rowsToDraw * (rowHeight + ROW_VERTICAL_PADDING) + TOP_PADDING;
};

const DynamicBedTrackComponents: React.FC<DynamicBedTrackProps> = ({
  data,
  visRegion,
  viewWindow,
  width,
  options,
  trackModel,
  svgHeight,
  updatedLegend,
}) => {
  const featureArranger = useMemo(() => new FeatureArranger(), []);
  featureArranger.arrange = memoizeOne(featureArranger.arrange);

  const arrangeResults = useMemo(
    () =>
      data.map((d) =>
        featureArranger.arrange(
          d,
          visRegion,
          width,
          (bed: any) => getBedPadding(bed, options.rowHeight),
          options.hiddenPixels,
          undefined,
          viewWindow
        )
      ),
    [data, visRegion, width, options]
  );

  const height = getHeight(arrangeResults, options.rowHeight, options.maxRows);
  if (svgHeight) {
    svgHeight.current = height;
  }
  if (updatedLegend) {
    updatedLegend.current = (
      <TrackLegend height={height} trackModel={trackModel} />
    );
  }

  return (
    <PixiAnnotation
      arrangeResults={arrangeResults}
      width={width}
      height={height}
      rowHeight={options.rowHeight}
      maxRows={options.maxRows}
      viewWindow={viewWindow}
      backgroundColor={options.backgroundColor}
      color={options.color}
      color2={options.color2}
      speed={options.speed}
      playing={options.playing}
      trackModel={trackModel}
      dynamicColors={options.dynamicColors}
      useDynamicColors={options.useDynamicColors}
    />
  );
};

export default DynamicBedTrackComponents;
