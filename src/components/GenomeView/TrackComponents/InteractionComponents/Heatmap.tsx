import React from "react";
import { scaleLinear, ScaleLinear } from "d3-scale";
// import _ from 'lodash';
import { PlacedInteraction } from "../../../../models/getXSpan/FeaturePlacer";
import OpenInterval from "../../../../models/OpenInterval";
import DesignRenderer, {
  RenderTypes,
} from "../commonComponents/art/DesignRenderer";

import HoverToolTip from "../commonComponents/HoverToolTips/HoverToolTip";

interface HeatmapProps {
  placedInteractions: PlacedInteraction[];
  viewWindow: OpenInterval;
  width: number;
  height: number;
  opacityScale: ScaleLinear<number, number>;
  color: any;
  color2: any;

  forceSvg?: boolean;
  bothAnchorsInView?: boolean;
  fetchViewWindowOnly?: boolean;
  legendWidth?: number;
  getBeamRefs: any;
  onSetAnchors3d?: any;
  onShowTooltip?: any;
  onHideTooltip?: any;
  isThereG3dTrack?: boolean;
  clampHeight?: boolean;
  options?: any;
}

class HeatmapNoLegendWidth extends React.PureComponent<HeatmapProps> {
  // static getHeight(props: HeatmapProps) {
  //     return 0.5 * props.viewWindow.getLength();
  // }

  hmData: any[] | undefined;
  beamsRef: any;
  clampScale: ScaleLinear<number, number> | undefined;

  renderRect = (placedInteraction: PlacedInteraction, index: number) => {
    const { opacityScale, viewWindow, height, bothAnchorsInView, clampHeight } =
      this.props;
    let { color, color2 } = this.props;
    if (placedInteraction.interaction.color) {
      color = placedInteraction.interaction.color;
      color2 = placedInteraction.interaction.color;
    }
    const score = placedInteraction.interaction.score;
    if (!score) {
      return null;
    }
    const { xSpan1, xSpan2 } = placedInteraction;
    if (xSpan1.end < viewWindow.start && xSpan2.start > viewWindow.end) {
      return null;
    }
    if (bothAnchorsInView) {
      if (xSpan1.start < viewWindow.start || xSpan2.end > viewWindow.end) {
        return null;
      }
    }
    const gapCenter = (xSpan1.end + xSpan2.start) / 2;
    const gapLength = xSpan2.start - xSpan1.end;
    const topX = gapCenter;
    const halfSpan1 = Math.max(0.5 * xSpan1.getLength(), 1);
    const halfSpan2 = Math.max(0.5 * xSpan2.getLength(), 1);
    let topY, bottomY, leftY, rightY;
    if (clampHeight) {
      bottomY = this.clampScale!(0.5 * gapLength + halfSpan1 + halfSpan2);
      topY = bottomY - this.clampScale!(halfSpan1 + halfSpan2);
      leftY = topY + this.clampScale!(halfSpan1);
      rightY = topY + this.clampScale!(halfSpan2);
    } else {
      topY = 0.5 * gapLength;
      bottomY = topY + halfSpan1 + halfSpan2;
      leftY = topY + halfSpan1;
      rightY = topY + halfSpan2;
    }
    const points = [
      // Going counterclockwise
      [topX, topY], // Top
      [topX - halfSpan1, leftY], // Left
      [topX - halfSpan1 + halfSpan2, bottomY], // Bottom = left + halfSpan2
      [topX + halfSpan2, rightY], // Right
    ];
    const key = placedInteraction.generateKey() + index;
    // only push the points in screen
    if (
      topX + halfSpan2 > viewWindow.start &&
      topX - halfSpan1 < viewWindow.end &&
      topY < height
    ) {
      this.hmData!.push({
        points,
        interaction: placedInteraction.interaction,
        xSpan1,
        xSpan2,
      });
    }

    return (
      <polygon
        key={key}
        points={points as any} // React can convert the array to a string
        fill={score >= 0 ? color : color2}
        opacity={opacityScale(score)}
      />
    );
  };

  /**
   * Renders the default tooltip that is displayed on hover.
   *
   * @param {number} relativeX - x coordinate of hover relative to the visualizer
   * @param {number} relativeY - y coordinate of hover relative to the visualizer
   * @return {JSX.Element} tooltip to render
   */

  set3dAnchors = (anchors: any) => {
    if (this.props.onSetAnchors3d) {
      this.props.onSetAnchors3d(anchors);
    }
    this.props.onHideTooltip();
  };

  // clear3dAnchors = () => {
  //     if (this.props.onSetAnchors3d) {
  //         this.props.onSetAnchors3d([]);
  //     }
  //     this.props.onHideTooltip()
  // }

  render() {
    this.hmData = [];
    const {
      placedInteractions,
      width,
      forceSvg,
      height,
      viewWindow,
      fetchViewWindowOnly,
      bothAnchorsInView,
    } = this.props;
    const heightStandard =
      fetchViewWindowOnly || bothAnchorsInView
        ? 0.5 * viewWindow.getLength()
        : 0.5 * width;
    this.clampScale = scaleLinear()
      .domain([0, heightStandard])
      .range([0, height])
      .clamp(false);
    return (
      <>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            position: "absolute",

            zIndex: 3,
          }}
        >
          <HoverToolTip
            data={this.hmData}
            windowWidth={width}
            viewWindow={viewWindow}
            trackType={"interactionHeatmap"}
            height={height}
            hasReverse={true}
            legendWidth={this.props.legendWidth}
            options={this.props.options}
          />
        </div>
        {placedInteractions.length === 0 ? (
          <div
            style={{
              width: width,
              height: height,
            }}
          ></div>
        ) : (
          <DesignRenderer
            type={forceSvg ? RenderTypes.SVG : RenderTypes.CANVAS}
            width={width}
            height={height}
          >
            {placedInteractions.map(this.renderRect)}
          </DesignRenderer>
        )}
      </>
    );
  }
}

export default HeatmapNoLegendWidth;
