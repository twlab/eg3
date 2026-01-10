import React, { useRef, useMemo } from "react";
import _ from "lodash";
import { scaleLinear } from "d3-scale";
// import FiberAnnotation from "./FiberAnnotation";

import { Fiber } from "../../../../models/Feature";
import {
  FeaturePlacementResult,
  PlacedFeatureGroup,
} from "../../../../models/FeatureArranger";
import OpenInterval from "../../../../models/OpenInterval";
import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";
import {
  FeaturePlacer,
  PlacementMode,
  PlacedFeature,
} from "../../../../models/getXSpan/FeaturePlacer";
import TrackLegend from "../commonComponents/TrackLegend";
import DesignRenderer, {
  RenderTypes,
} from "../commonComponents/art/DesignRenderer";
import { FiberDisplayModes } from "../../../../trackConfigs/config-menu-models.tsx/DisplayModes";
import HoverToolTip from "../commonComponents/HoverToolTips/HoverToolTip";
const ROW_VERTICAL_PADDING = 2;
export const FIBER_DENSITY_CUTOFF_LENGTH = 300000;

interface FiberTrackProps {
  data: Fiber[];
  options: {
    color?: string; // methylated color
    color2?: string; // un methylated color
    hiddenPixels?: number;
    rowHeight: number;
    height: number; // for density mode
    maxRows: number;
    displayMode: FiberDisplayModes;
    hideMinimalItems: boolean;
    pixelsPadding?: number;
    packageVersion?: boolean;
    forceSvg?: boolean;
    usePrimaryNav?: boolean;
  };
  forceSvg?: boolean;
  visRegion: DisplayedRegionModel;
  getNumLegend: any;
  getAnnotationTrack: any;
  trackState: any;
  renderTooltip: any;
  width: number;
  trackModel: any;
  viewWindow: OpenInterval;
  svgHeight: any;
  isLoading: boolean;
  updatedLegend: any;
  getGenePadding: any;
  getHeight: any;
  ROW_HEIGHT: any;
  onClose: any;
  xvaluesData?: any;
  dataIdx?: number;
}

interface AggregatedFiber {
  on: number;
  off: number;
  count: number;
}

export const DEFAULT_OPTIONS = {
  hiddenPixels: 0.5,
  rowHeight: 40,
  color: "orangered",
  color2: "blue",
  height: 40,
  maxRows: 20,
  displayMode: FiberDisplayModes.AUTO,
  hideMinimalItems: false,
  pixelsPadding: 0,
};

// const NAMES = ['chr11:5273848-5284079', 'chr11:5279356-5288355', 'chr11:5268918-5283588', 'chr11:5278466-5287241', 'chr11:5274928-5292829']

/**
 * Track component for fibers/methylmod.
 *
 * @author Daofeng Li
 */
const FiberTrackComponent: React.FC<FiberTrackProps> = (props) => {


  const {
    onClose,
    ROW_HEIGHT,
    getHeight,
    data,
    getGenePadding,
    visRegion,
    svgHeight,
    width,
    options,
    trackModel,
    getAnnotationTrack,
    trackState,
    renderTooltip,
    updatedLegend,

    viewWindow,
  } = props;



  /**
   * Renders one annotation.
   *
   * @param {PlacedFeature} - feature and drawing info
   * @param {number} y - y coordinate to render the annotation
   * @param {boolean} isLastRow - whether the annotation is assigned to the last configured row
   * @param {number} index - iteration index
   * @return {JSX.Element} element visualizing the feature
   */

  /**
   *
   * @param data
   * @param viewRegion
   * @param width
   * @returns
   */
  const aggregateFibers = useMemo(
    () => (
      data: Fiber[],
      viewRegion: DisplayedRegionModel,
      width: number
    ) => {
      width = Math.round(width); // Sometimes it's juuust a little bit off from being an int
      const xToFibers = Array(width).fill(null);
      for (let x = 0; x < width; x++) {
        // Fill the array with empty arrays
        xToFibers[x] = { on: 0, off: 0, count: 0 };
      }
      const placer = new FeaturePlacer();
      const result: FeaturePlacementResult = placer.placeFeatures({
        features: data,
        viewRegion,
        width,
        mode: PlacementMode.PLACEMENT,
      }) as FeaturePlacementResult;

      for (const placedFeature of result.placements) {
        const { feature, xSpan, visiblePart } = placedFeature as PlacedFeature;
        const { relativeStart, relativeEnd } = visiblePart;
        const segmentWidth = relativeEnd - relativeStart;
        const startX = Math.max(0, Math.floor(xSpan.start));
        const endX = Math.min(width - 1, Math.ceil(xSpan.end));
        for (let x = startX; x <= endX; x++) {
          xToFibers[x].count += 1;
        }
        (feature as Fiber).ons!.forEach((rbs) => {
          const bs = Math.abs(rbs);
          if (bs >= relativeStart && bs < relativeEnd) {
            const x =
              startX +
              Math.floor(((bs - relativeStart) / segmentWidth) * (endX - startX));
            xToFibers[x].on += 1;
          }
        });
        (feature as Fiber).offs!.forEach((rbs) => {
          const bs = Math.abs(rbs);
          if (bs >= relativeStart && bs < relativeEnd) {
            const x =
              startX +
              Math.floor(((bs - relativeStart) / segmentWidth) * (endX - startX));
            xToFibers[x].off += 1;
          }
        });
      }
      return xToFibers;
    }, []);

  const computeScales = (xMap: AggregatedFiber[], height: number) => {
    const pcts = xMap.map((x) => x.on / (x.on + x.off));
    const maxPct: any = _.max(pcts);
    const counts = xMap.map((x) => x.count);
    const maxCount: any = _.max(counts);
    return {
      pctToY: scaleLinear()
        .domain([maxPct, 0])
        .range([ROW_VERTICAL_PADDING, height])
        .clamp(true),
      countToY: scaleLinear()
        .domain([maxCount, 0])
        .range([ROW_VERTICAL_PADDING, height])
        .clamp(true),
      pcts,
      maxPct,
      maxCount,
      counts,
    };
  };


  const visualizer = (xMap: AggregatedFiber[], scales: any) => {
    const { pctToY, countToY, pcts, counts } = scales;
    const { height, color, color2, displayMode, packageVersion } =
      options;
    const {
      forceSvg,
      getNumLegend,
    } = props;
    const colorScale = scaleLinear()
      .domain([0, 1])
      .range([color2 as any, color as any])
      .clamp(true);
    const bars: any[] = [];
    const lines: Array<any> = [];
    pcts.forEach((pct: number, idx: number) => {
      if (pct) {
        if (displayMode === FiberDisplayModes.AUTO) {
          const y = pctToY(pct);
          bars.push(
            <rect
              key={idx}
              x={idx}
              width={1}
              y={y}
              height={height - y}
              fill={color}
              fillOpacity={0.7}
            />
          );
        } else {
          const fillColor = colorScale(pct);
          bars.push(
            <rect
              key={idx}
              x={idx}
              width={1}
              y={0}
              height={height}
              fill={fillColor as any}
              fillOpacity={0.5}
            />
          );
        }
      }
    });
    for (let i = 0; i < counts.length - 1; i++) {
      const current = counts[i];
      const next = counts[i + 1];
      if (!current) {
        continue;
      }
      const y1 = countToY(current);
      const y2 = countToY(next);
      lines.push(
        <line key={i} x1={i} y1={y1} x2={i + 1} y2={y2} stroke="#525252" />
      );
    }

    const legend = (
      <div
        style={{
          display: "flex",
        }}
      >
        <TrackLegend
          trackModel={trackModel}
          height={height}
          forceSvg={forceSvg}
        />
      </div>
    );
    if (getNumLegend) {
      getNumLegend(legend);
    }
    let curParentStyle: any = forceSvg
      ? {
        position: "relative",

        overflow: "hidden",
        width: width / 3,
      }
      : {};
    let curEleStyle: any = forceSvg
      ? {
        position: "relative",
        transform: `translateX(${-viewWindow.start}px)`,
      }
      : {};
    let hoverStyle: any = options.packageVersion ? { marginLeft: 120 } : {};
    return (
      <React.Fragment>
        {!forceSvg ? (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              position: "absolute",
              zIndex: 3,
              ...hoverStyle,
            }}
          >
            <HoverToolTip
              data={xMap}
              scale={scales}
              windowWidth={width}
              trackType={"modbed"}
              trackModel={trackModel}
              height={height}
              viewRegion={visRegion}
              unit={""}
              hasReverse={true}
              options={options}
            />
          </div>
        ) : (
          ""
        )}
        <div style={{ display: "flex", ...curParentStyle }}>
          {forceSvg || options.packageVersion ? legend : ""}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              ...curEleStyle,
            }}
          >
            <>
              <DesignRenderer
                type={
                  forceSvg ? RenderTypes.SVG : RenderTypes.CANVAS
                }
                width={width}
                height={height}
                forceSvg={forceSvg}
                viewWindow={viewWindow}
              >
                {bars}
                {lines}
              </DesignRenderer>
            </>
          </div>
        </div>
      </React.Fragment>
    );
  };

  if (visRegion.getWidth() > FIBER_DENSITY_CUTOFF_LENGTH) {
    const xMap = aggregateFibers(data, visRegion, width);
    const scales = computeScales(xMap, options.height);
    return visualizer(xMap, scales);
  }

  return getAnnotationTrack["full"]({
    formattedData: data,
    trackState: trackState,
    windowWidth: width / 3,
    configOptions: options,
    renderTooltip: renderTooltip,
    svgHeight: svgHeight,
    updatedLegend: updatedLegend,
    trackModel: trackModel,
    getGenePadding: getGenePadding,
    getHeight: getHeight,
    ROW_HEIGHT: ROW_HEIGHT,
    onClose,
  }).component;
};

FiberTrackComponent.displayName = "FiberTrack";

export default FiberTrackComponent;
