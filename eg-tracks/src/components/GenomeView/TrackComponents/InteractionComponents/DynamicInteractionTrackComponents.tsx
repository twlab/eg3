import React, { useMemo, useRef } from "react";
import _ from "lodash";
import memoizeOne from "memoize-one";
import { scaleLinear } from "d3-scale";
import { PixiHeatmap } from "./PixiHeatmap";
import PixiArc from "./PixiArc";
import { FeaturePlacer } from "../../../../models/getXSpan/FeaturePlacer";
import { GenomeInteraction } from "../../../../getRemoteData/GenomeInteraction";
import { ScaleChoices } from "../../../../models/ScaleChoices";
import { DynamicInteractionDisplayMode } from "../../../../trackConfigs/config-menu-models.tsx/DisplayModes";
import TrackLegend from "../commonComponents/TrackLegend";

interface DynamicInteractionTrackComponentsProps {
  data: GenomeInteraction[];
  options: {
    color: string;
    color2?: string;
    backgroundColor?: string;
    binSize?: number;
    scoreScale?: string;
    scoreMax?: number;
    scoreMin?: number;
    height: number;
    playing?: boolean;
    speed?: number[];
    lineWidth?: number;
    displayMode: DynamicInteractionDisplayMode;
    dynamicColors?: any[];
    useDynamicColors?: boolean;
  };
  viewer3dNumFrames?: any;
  trackModel: any;
  visRegion: any;
  width: number;
  viewWindow: any;
  updatedLegend?: any;
  dataIdx: number;
  initialLoad?: any;
  windowWidth?: number;
}

export const DEFAULT_OPTIONS = {
  color: "#B8008A",
  color2: "#006385",
  backgroundColor: "var(--bg-color)",
  scoreScale: ScaleChoices.AUTO,
  scoreMax: 10,
  scoreMin: 0,
  height: 500,
  playing: true,
  speed: [5],
  lineWidth: 1,
  useDynamicColors: false,
  dynamicColors: [] as any[],
  displayMode: DynamicInteractionDisplayMode.HEATMAP,
};

const DynamicInteractionTrackComponents: React.FC<
  DynamicInteractionTrackComponentsProps
> = (props) => {
  const currentViewDataIdx = useRef(0);
  const currentScale: any = useRef(null);
  const currentViewWindow = useRef({ start: 0, end: 1 });
  const currentVisualizer = useRef(null);
  const currentViewOptions = useRef({});
  const currentWindowWidth = useRef<any>(0);

  const {
    data,
    trackModel,
    visRegion,
    width,
    viewWindow,
    options,
    viewer3dNumFrames,
    updatedLegend,
    dataIdx,
    initialLoad,
    windowWidth,
  } = props;

  const featurePlacer = useMemo(() => new FeaturePlacer(), []);

  const computeScale = useMemo(() => {
    return memoizeOne(() => {
      const { scoreScale, scoreMin, scoreMax } = options;
      const maxValues = data.map((d: any) => {
        const maxObj: any = _.maxBy(d, "score");
        return maxObj ? maxObj.score : 1;
      });
      const maxScore = _.max(maxValues);
      if (scoreScale === ScaleChoices.AUTO) {
        return {
          opacityScale: scaleLinear()
            .domain([0, maxScore])
            .range([0, 1])
            .clamp(true),
          min: 0,
          max: maxScore,
        };
      } else {
        if (
          scoreMin !== undefined &&
          scoreMax !== undefined &&
          scoreMin >= scoreMax
        ) {
          console.error("Score min cannot be greater than Score max");
          return {
            opacityScale: scaleLinear()
              .domain([scoreMax - 1, scoreMax])
              .range([0, 1])
              .clamp(true),
            min: scoreMax - 1,
            max: scoreMax,
          };
        }
        return {
          opacityScale: scaleLinear()
            .domain([scoreMin!, scoreMax!])
            .range([0, 1])
            .clamp(true),
          min: scoreMin,
          max: scoreMax,
        };
      }
    });
  }, [options, data]);

  const scales = computeScale();

  if (updatedLegend) {
    updatedLegend.current = { trackModel, height: options.height };
  }

  let visualizer;

  if (
    initialLoad ||
    (options as any).forceSvg ||
    (dataIdx === currentViewDataIdx.current &&
      !_.isEqual(viewWindow, currentViewWindow.current) &&
      (!(scales.max === currentScale.current?.max) ||
        !(scales.min === currentScale.current?.min))) ||
    dataIdx !== currentViewDataIdx.current ||
    !_.isEqual(options, currentViewOptions.current) ||
    windowWidth !== currentWindowWidth.current
  ) {
    const visualizerProps = {
      placedInteractionsArray: data.map((d: any) =>
        featurePlacer.placeInteractions(d, visRegion, width),
      ),
      viewWindow,
      width,
      height: options.height,
      opacityScale: scales.opacityScale,
      color: options.color,
      color2: options.color2,
      backgroundColor: options.backgroundColor,
      binSize: options.binSize,

      playing: options.playing,
      speed: options.speed,
      trackModel,
      lineWidth: options.lineWidth,
      dynamicColors: options.dynamicColors,
      useDynamicColors: options.useDynamicColors,
      viewer3dNumFrames,
    };

    if (options.displayMode === DynamicInteractionDisplayMode.ARC) {
      visualizer = <PixiArc {...visualizerProps} />;
    } else {
      visualizer = <PixiHeatmap {...visualizerProps} />;
    }
  } else {
    visualizer = currentVisualizer.current;
  }

  currentWindowWidth.current = windowWidth;
  currentVisualizer.current = visualizer;
  currentViewDataIdx.current = dataIdx;
  currentViewWindow.current = viewWindow;
  currentScale.current = scales;
  currentViewOptions.current = options;

  return visualizer;
};

export default DynamicInteractionTrackComponents;
