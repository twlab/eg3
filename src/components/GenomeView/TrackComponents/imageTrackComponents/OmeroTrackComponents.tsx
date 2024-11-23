import React from "react";
import _ from "lodash";
import { OmeroSvgVisualizer } from "./OmeroSvgVisualizer";
import OmeroHtmlVisualizer from "./OmeroHtmlVisualizer";

import { DefaultAggregators } from "@/models/FeatureAggregator";
import NumericalTrack from "../commonComponents/numerical/NumericalTrack";
import {
  AnnotationDisplayModes,
  NumericalDisplayModes,
} from "@/trackConfigs/config-menu-models.tsx/DisplayModes";
import OpenInterval from "@/models/OpenInterval";

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
}

interface OmeroTrackState {
  trackHeight: number;
  numHidden: number;
}

class OmeroTrackComponents extends React.PureComponent<
  OmeroTrackProps,
  OmeroTrackState
> {
  constructor(props: OmeroTrackProps) {
    super(props);
    this.state = {
      trackHeight: 100,
      numHidden: 0,
    };
  }

  componentDidMount() {
    this.calcTrackHeight();
  }

  componentDidUpdate(prevProps: OmeroTrackProps) {
    if (
      prevProps.data !== this.props.data ||
      prevProps.options.imageHeight !== this.props.options.imageHeight
    ) {
      this.calcTrackHeight();
    }
  }

  calcTrackHeight = () => {
    const { data, viewWindow, options } = this.props;
    const totalImgCount = _.sum(data.map((item) => item.images.length));
    const imgCount = Math.min(totalImgCount, MAX_NUMBER_THUMBNAILS);
    const totalImageWidth = Math.max(
      (options.imageHeight[0] * options.imageAspectRatio + THUMBNAIL_PADDING) *
        imgCount -
        THUMBNAIL_PADDING,
      0
    );
    const screenWidth = viewWindow.end - viewWindow.start;
    const rowsNeed = Math.floor(totalImageWidth / screenWidth) + 1;
    const trackHeight =
      rowsNeed * (options.imageHeight[0] + THUMBNAIL_PADDING) -
      THUMBNAIL_PADDING;

    this.setState({ trackHeight, numHidden: totalImgCount - imgCount });
  };

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
    } = this.props;
    const { trackHeight, numHidden } = this.state;

    const visualizer = forceSvg ? (
      <OmeroSvgVisualizer
        data={data}
        viewWindow={new OpenInterval(viewWindow.start, viewWindow.end)}
        width={width}
        thumbnailHeight={options.imageHeight[0]}
        height={trackHeight}
        trackModel={trackModel}
        imageAspectRatio={options.imageAspectRatio}
      />
    ) : (
      <OmeroHtmlVisualizer
        data={data}
        viewWindow={new OpenInterval(viewWindow.start, viewWindow.end)}
        thumbnailHeight={options.imageHeight[0]}
        height={trackHeight}
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
