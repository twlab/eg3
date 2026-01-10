import React, { useRef, useMemo } from "react";
import { scaleLinear } from "d3-scale";
import _ from "lodash";
import VcfAnnotation from "./VcfAnnotation";


import { PlacedFeatureGroup } from "../../../../models/FeatureArranger";
import OpenInterval from "../../../../models/OpenInterval";
import NumericalTrack from "../commonComponents/numerical/NumericalTrack";
import {
  NumericalDisplayModes,
  VcfColorScaleKeys,
  VcfDisplayModes,
} from "../../../../trackConfigs/config-menu-models.tsx/DisplayModes";
import { DefaultAggregators } from "../../../../models/FeatureAggregator";
import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";
import Vcf from "./Vcf";
import { displayModeComponentMap } from "../displayModeComponentMap";
const ROW_VERTICAL_PADDING = 2;

export const DEFAULT_OPTIONS = {
  highValueColor: "blue",
  lowValueColor: "red",
  maxRows: 10,
  rowHeight: 20,
  hiddenPixels: 0,
  colorScaleKey: VcfColorScaleKeys.AF,
  displayMode: VcfDisplayModes.AUTO,
  ensemblStyle: false,
};

interface VcfTrackProps {
  data: Vcf[];
  viewRegion: DisplayedRegionModel;
  viewWindow: OpenInterval;
  trackState: any;
  width: number;
  options: {
    highValueColor?: any;
    lowValueColor?: any;
    maxRows?: number;
    rowHeight: number;
    alwaysDrawLabel?: boolean;
    hiddenPixels?: number;
    colorScaleKey: string;
    displayMode?: string;
    usePrimaryNav?: boolean;
    forceSvg?: boolean;
  };
  renderTooltip: any;
  svgHeight: any;
  trackModel: any;
  updatedLegend: any;
  getGenePadding: any;
  getHeight: any;
  xvaluesData?: any;
  getNumLegend: any;
  dataIdx: number;
  initialLoad?: boolean;
}

/**
 * Track component for VCF annotations.
 *
 * @author Daofeng Li
 */
const VcfTrack: React.FC<VcfTrackProps> = (props) => {
  const scalesRef = useRef<any>(null);
  const currentVisualizer = useRef<any>(null);
  const currentViewDataIdx = useRef<number | undefined>(undefined);
  const currentViewWindow = useRef<any>(null);
  const currentScale = useRef<any>(null);
  const initialRender = useRef(true);
  const currentViewOptions = useRef<any>(null);

  const {
    data,
    viewRegion,
    viewWindow,
    width,
    options,
    trackState,
    renderTooltip,
    svgHeight,
    trackModel,
    updatedLegend,
    getGenePadding,
    getHeight,
    xvaluesData,
    dataIdx,
    initialLoad,
  } = props;

  const computeColorScales = useMemo(
    () => (
      data: { [key: string]: any },
      colorKey: string,
      lowValueColor: any,
      highValueColor: any
    ) => {
      let values: any[];
      // Flatten all dataCache arrays from each data object

      const allVariants = data.flatMap((d) => d.dataCache || []);
      if (colorKey === VcfColorScaleKeys.QUAL) {
        values = allVariants.map((v) => v.variant.QUAL);
      } else if (colorKey === VcfColorScaleKeys.AF) {
        values = allVariants.map((v) => {
          if (v.variant.INFO && v.variant.INFO.hasOwnProperty("AF")) {
            return v.variant.INFO.AF[0];
          }
          return 0;
        });
      } else {
        values = [];
      }
      const colorScale = scaleLinear()
        .domain([0, _.max(values)])
        .range([lowValueColor, highValueColor])
        .clamp(true);
      return colorScale;
    }, []);

  /**
   * Renders the tooltip for a feature.
   *
   * @param {React.MouseEvent} event - mouse event that triggered the tooltip request
   * @param {Vcf} vcf - vcf for which to display details
   */

  /**
   * Renders one annotation.
   *
   * @param {PlacedFeature} - feature and drawing info
   * @param {number} y - y coordinate to render the annotation
   * @param {boolean} isLastRow - whether the annotation is assigned to the last configured row
   * @param {number} index - iteration index
   * @return {JSX.Element} element visualizing the feature
   */
  const renderAnnotation = (
    placedGroup: PlacedFeatureGroup,
    y: number,
    isLastRow: boolean,
    index: number
  ) => {
    return placedGroup.placedFeatures.map((placement, i) => (
      <VcfAnnotation
        key={i}
        feature={placement.feature as Vcf}
        xSpan={placement.xSpan}
        y={y}
        isMinimal={isLastRow}
        height={options.rowHeight}
        colorScale={scalesRef.current}
        onClick={renderTooltip}
        alwaysDrawLabel={options.alwaysDrawLabel}
      />
    ));
  };

  const currentViewLength =
    (viewRegion.getWidth() * viewWindow.getLength()) / width;
  const numericalOptions = {
    ...options,
    displayMode: NumericalDisplayModes.AUTO,
    aggregateMethod: DefaultAggregators.types.COUNT,
  };

  let visualizer;

  if (options.displayMode === VcfDisplayModes.AUTO) {
    if (currentViewLength > 100000) {
      if (
        initialLoad ||
        options.forceSvg ||
        (dataIdx === currentViewDataIdx.current &&
          !_.isEqual(viewWindow, currentViewWindow.current)) ||
        dataIdx !== currentViewDataIdx.current ||
        !_.isEqual(options, currentViewOptions.current) ||
        !options.usePrimaryNav
      ) {
        visualizer = (
          <NumericalTrack
            {...props}
            unit="feature density"
            options={numericalOptions}
            xvaluesData={xvaluesData}
            dataIdx={dataIdx}
            initialLoad={initialLoad}
          />
        );
      } else {
        visualizer = currentVisualizer.current;
      }
    } else {
      scalesRef.current = computeColorScales(
        data,
        options.colorScaleKey,
        options.lowValueColor,
        options.highValueColor
      );

      if (
        initialLoad ||
        options.forceSvg ||

        dataIdx !== currentViewDataIdx.current ||
        !_.isEqual(options, currentViewOptions.current) ||
        !options.usePrimaryNav
      ) {
        visualizer = displayModeComponentMap["full"]({
          formattedData: data,
          trackState: trackState,
          windowWidth: width,
          configOptions: options,
          renderTooltip: renderTooltip,
          svgHeight: svgHeight,
          updatedLegend: updatedLegend,
          trackModel: trackModel,
          getGenePadding: getGenePadding,
          getHeight: getHeight,
          ROW_HEIGHT: options.rowHeight + ROW_VERTICAL_PADDING,
          scales: scalesRef.current,
        }).component;
      } else {
        visualizer = currentVisualizer.current;
      }
    }
  } else {
    if (options.displayMode === VcfDisplayModes.DENSITY) {
      if (
        initialLoad ||
        options.forceSvg ||
        (dataIdx === currentViewDataIdx.current &&
          !_.isEqual(viewWindow, currentViewWindow.current)) ||
        dataIdx !== currentViewDataIdx.current ||
        !_.isEqual(options, currentViewOptions.current) ||
        !options.usePrimaryNav
      ) {
        visualizer = (
          <NumericalTrack
            {...props}
            unit="feature density"
            options={numericalOptions}
            xvaluesData={xvaluesData}
            dataIdx={dataIdx}
            initialLoad={initialLoad}
          />
        );
      } else {
        visualizer = currentVisualizer.current;
      }
    } else {
      scalesRef.current = computeColorScales(
        data,
        options.colorScaleKey,
        options.lowValueColor,
        options.highValueColor
      );

      if (
        initialLoad ||
        options.forceSvg ||

        dataIdx !== currentViewDataIdx.current ||
        !_.isEqual(options, currentViewOptions.current) ||
        !options.usePrimaryNav
      ) {
        visualizer = displayModeComponentMap["full"]({
          formattedData: data,
          trackState: trackState,
          windowWidth: width,
          configOptions: options,
          renderTooltip: renderTooltip,
          svgHeight: svgHeight,
          updatedLegend: updatedLegend,
          trackModel: trackModel,
          getGenePadding: getGenePadding,
          getHeight: getHeight,
          ROW_HEIGHT: options.rowHeight + ROW_VERTICAL_PADDING,
          scales: scalesRef.current,
        }).component;
      } else {
        visualizer = currentVisualizer.current;
      }
    }
  }

  currentVisualizer.current = visualizer;
  currentViewDataIdx.current = dataIdx;
  currentViewWindow.current = viewWindow;
  initialRender.current = false;
  currentScale.current = scalesRef.current;
  currentViewOptions.current = options;

  return visualizer;
};

VcfTrack.displayName = "VcfTrack";

export default VcfTrack;
