import React from "react";
import memoizeOne from "memoize-one";
import { scaleLinear } from "d3-scale";
import _ from "lodash";
import VcfAnnotation from "./VcfAnnotation";
import { PropsFromTrackContainer } from "../commonComponents/Track";
import { AnnotationTrack } from "../commonComponents/annotation/AnnotationTrack";
import VcfDetail from "./VcfDetail";

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
}

/**
 * Track component for VCF annotations.
 *
 * @author Daofeng Li
 */
class VcfTrack extends React.Component<VcfTrackProps> {
  static displayName = "VcfTrack";
  scales: any;
  constructor(props: VcfTrackProps) {
    super(props);
    this.scales = null;
    this.renderAnnotation = this.renderAnnotation.bind(this);
    this.computeColorScales = memoizeOne(this.computeColorScales);
  }

  computeColorScales = (
    data: Vcf[],
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
  };

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
  renderAnnotation(
    placedGroup: PlacedFeatureGroup,
    y: number,
    isLastRow: boolean,
    index: number
  ) {
    return placedGroup.placedFeatures.map((placement, i) => (
      <VcfAnnotation
        key={i}
        feature={placement.feature as Vcf}
        xSpan={placement.xSpan}
        y={y}
        isMinimal={isLastRow}
        height={this.props.options.rowHeight}
        colorScale={this.scales}
        onClick={this.props.renderTooltip}
        alwaysDrawLabel={this.props.options.alwaysDrawLabel}
      />
    ));
  }

  render() {
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
    } = this.props;

    const currentViewLength =
      (viewRegion.getWidth() * viewWindow.getLength()) / width;
    const numericalOptions = {
      ...this.props.options,
      displayMode: NumericalDisplayModes.AUTO,
      aggregateMethod: DefaultAggregators.types.COUNT,
    };
    if (options.displayMode === VcfDisplayModes.AUTO) {
      if (currentViewLength > 100000) {
        return (
          <NumericalTrack
            {...this.props}
            unit="feature density"
            options={numericalOptions}
            xvaluesData={xvaluesData}
          />
        );
      } else {
        this.scales = this.computeColorScales(
          data,
          options.colorScaleKey,
          options.lowValueColor,
          options.highValueColor
        );

        return displayModeComponentMap["full"]({
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
          scales: this.scales,
        }).component;
      }
    } else {
      if (options.displayMode === VcfDisplayModes.DENSITY) {
        return (
          <NumericalTrack
            {...this.props}
            unit="feature density"
            options={numericalOptions}
            xvaluesData={xvaluesData}
          />
        );
      } else {
        this.scales = this.computeColorScales(
          data,
          options.colorScaleKey,
          options.lowValueColor,
          options.highValueColor
        );

        return displayModeComponentMap["full"]({
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
          scales: this.scales,
        }).component;
      }
    }
  }
}

export default VcfTrack;
