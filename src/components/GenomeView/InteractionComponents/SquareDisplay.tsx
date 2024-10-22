import React from "react";
import { ScaleLinear } from "d3-scale";
import pointInPolygon from "point-in-polygon";
import { PlacedInteraction } from "../../../models/getXSpan/FeaturePlacer";
import OpenInterval from "../../../models/OpenInterval";

import DesignRenderer, {
  RenderTypes,
} from "../commonComponents/art/DesignRenderer";
import HoverToolTip from "../commonComponents/HoverToolTips/HoverToolTip";

interface SquareDisplayProps {
  placedInteractions: PlacedInteraction[];
  viewWindow: OpenInterval;
  width: number;
  height: number;
  opacityScale: ScaleLinear<number, number>;
  color: string;
  color2?: string;
  forceSvg?: boolean;
  bothAnchorsInView?: boolean;

  options: any;
}

export class SquareDisplay extends React.PureComponent<SquareDisplayProps, {}> {
  static getHeight(props: SquareDisplayProps) {
    return props.viewWindow.getLength();
  }

  hmData: any[] = [];

  renderRect = (placedInteraction: PlacedInteraction, index: number) => {
    const {
      opacityScale,
      color,
      color2,
      viewWindow,
      height,
      bothAnchorsInView,
    } = this.props;
    const drawWidth = viewWindow.getLength();
    const angle = height / drawWidth;
    const score = placedInteraction.interaction.score;
    if (!score) {
      return null;
    }
    const { xSpan1, xSpan2 } = placedInteraction;
    if (!(xSpan1.start >= viewWindow.start && xSpan2.end <= viewWindow.end)) {
      return null;
    }
    if (bothAnchorsInView) {
      if (xSpan1.start < viewWindow.start || xSpan2.end > viewWindow.end) {
        return null;
      }
    }
    const pointLeft = [
      // Going counterclockwise
      [xSpan1.end, (xSpan2.start - viewWindow.start) * angle], // Top Right
      [xSpan1.start, (xSpan2.start - viewWindow.start) * angle], // Top Left
      [xSpan1.start, (xSpan2.end - viewWindow.start) * angle], // Bottom Left
      [xSpan1.end, (xSpan2.end - viewWindow.start) * angle], // Bottom  Right
    ];
    const pointRight = [
      // Going counterclockwise
      [xSpan2.end, (xSpan1.start - viewWindow.start) * angle], // Top Right
      [xSpan2.start, (xSpan1.start - viewWindow.start) * angle], // Top Left
      [xSpan2.start, (xSpan1.end - viewWindow.start) * angle], // Bottom Left
      [xSpan2.end, (xSpan1.end - viewWindow.start) * angle], // Bottom  Right
    ];
    const key = placedInteraction.generateKey() + index;

    this.hmData.push({
      pointLeft,
      pointRight,
      interaction: placedInteraction.interaction,
    });

    if (xSpan1.start === xSpan2.start && xSpan1.end === xSpan2.end) {
      return (
        <polygon
          key={key}
          points={pointLeft as any} // React can convert the array to a string
          fill={score >= 0 ? color : color2}
          opacity={opacityScale(score)}
        />
      );
    } else {
      return (
        <g key={key}>
          <polygon
            key={key + "left"}
            points={pointLeft as any} // React can convert the array to a string
            fill={score >= 0 ? color : color2}
            opacity={opacityScale(score)}
          />
          <polygon
            key={key + "right"}
            points={pointRight as any} // React can convert the array to a string
            fill={score >= 0 ? color : color2}
            opacity={opacityScale(score)}
          />
        </g>
      );
    }
  };

  /**
   * Renders the default tooltip that is displayed on hover.
   *
   * @param {number} relativeX - x coordinate of hover relative to the visualizer
   * @param {number} relativeY - y coordinate of hover relative to the visualizer
   * @return {JSX.Element} tooltip to render
   */
  renderTooltip = (relativeX: number, relativeY: number) => {
    const polygon = this.findPolygon(relativeX, relativeY);
    if (polygon) {
      return (
        <div>
          <div>Locus1: {polygon.interaction.locus1.toString()}</div>
          <div>Locus2: {polygon.interaction.locus2.toString()}</div>
          <div>Score: {polygon.interaction.score}</div>
        </div>
      );
    } else {
      return null;
    }
  };

  findPolygon = (x: number, y: number): any => {
    for (const item of this.hmData) {
      if (
        pointInPolygon([x, y], item.pointLeft) ||
        pointInPolygon([x, y], item.pointRight)
      ) {
        return item;
      }
    }
    return null;
  };

  render() {
    this.hmData = [];
    const { placedInteractions, width, forceSvg, height, viewWindow, options } =
      this.props;
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
            trackType={"interactionSquareDisplay"}
            height={height}
            hasReverse={true}
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
