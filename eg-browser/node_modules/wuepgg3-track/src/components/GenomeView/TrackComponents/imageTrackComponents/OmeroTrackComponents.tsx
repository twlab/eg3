import React from "react";
import _ from "lodash";
import { OmeroSvgVisualizer } from "./OmeroSvgVisualizer";
import OmeroHtmlVisualizer from "./OmeroHtmlVisualizer";

import { DefaultAggregators } from "../../../../models/FeatureAggregator";
import NumericalTrack from "../commonComponents/numerical/NumericalTrack";
import {
  AnnotationDisplayModes,
  NumericalDisplayModes,
} from "../../../../trackConfigs/config-menu-models.tsx/DisplayModes";
import OpenInterval from "../../../../models/OpenInterval";

export const MAX_NUMBER_THUMBNAILS = 384;
export const THUMBNAIL_PADDING = 2;
export const DEFAULT_OPTIONS = {
  imageHeight: [73],
  backgroundColor: "var(--bg-color)",
  fetchViewWindowOnly: true,
  imageAspectRatio: 1.315,
  displayMode: AnnotationDisplayModes.FULL,
  height: 40,
};

interface OmeroTrackProps {
  data: { images: any[] }[];
  options: typeof DEFAULT_OPTIONS;
  viewWindow: { start: number; end: number };
  trackModel: any;
  forceSvg: boolean;
  width: number;
  layoutModel: any;
  isThereG3dTrack: boolean;
  onSetImageInfo: any;
  heightObj: any;
}

class OmeroTrackComponents extends React.PureComponent<OmeroTrackProps> {
  constructor(props: OmeroTrackProps) {
    super(props);
  }

  render() {
    const {
      trackModel,
      data,
      forceSvg,
      options,
      viewWindow,
      width,
      layoutModel,
      isThereG3dTrack,
      onSetImageInfo,
      heightObj,
    } = this.props;

    const visualizer = forceSvg ? (
      <OmeroSvgVisualizer
        data={data}
        viewWindow={new OpenInterval(viewWindow.start, viewWindow.end)}
        width={width}
        thumbnailHeight={options.imageHeight[0]}
        height={heightObj.trackHeight}
        trackModel={trackModel}
        imageAspectRatio={options.imageAspectRatio}
      />
    ) : (
      <OmeroHtmlVisualizer
        data={data}
        viewWindow={new OpenInterval(viewWindow.start, viewWindow.end)}
        thumbnailHeight={options.imageHeight[0]}
        height={heightObj.trackHeight}
        trackModel={trackModel}
        imageAspectRatio={options.imageAspectRatio}
        layoutModel={layoutModel}
        isThereG3dTrack={isThereG3dTrack}
        onSetImageInfo={onSetImageInfo}
      />
    );

    if (options.displayMode === AnnotationDisplayModes.DENSITY) {
      const numericalOptions = {
        ...options,
        displayMode: NumericalDisplayModes.AUTO,
        aggregateMethod: DefaultAggregators.types.IMAGECOUNT,
      };
      return (
        <NumericalTrack
          {...this.props}
          unit="image count"
          options={numericalOptions}
        />
      );
    } else {
      return visualizer;
    }
  }
}

export default OmeroTrackComponents;
