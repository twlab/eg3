import React from "react";
import { PlacedInteraction } from "../../../../models/getXSpan/FeaturePlacer";
import OpenInterval from "../../../../models/OpenInterval";
import { GenomeInteraction } from "../../../../getRemoteData/GenomeInteraction";
import DesignRenderer, {
  RenderTypes,
} from "../commonComponents/art/DesignRenderer";
import { moveTo, cubicCurveTo } from "./ArcDisplay";
import { ScaleLinear } from "d3-scale";
import HoverToolTip from "../commonComponents/HoverToolTips/HoverToolTip";

interface CubicCurveDisplayProps {
  placedInteractions: PlacedInteraction[];
  viewWindow: OpenInterval;
  width: number;
  height: number;
  lineWidth?: number;
  heightScale: ScaleLinear<number, number>;
  // opacityScale: ScaleLinear<number, number>;
  color: string;
  color2?: string;
  forceSvg?: boolean;
  bothAnchorsInView?: boolean;
  options?: any;
}

export class CubicCurveDisplay extends React.PureComponent<
  CubicCurveDisplayProps,
  {}
> {
  renderCurve = (placedInteraction: PlacedInteraction, index: number) => {
    const {
      color,
      color2,
      lineWidth,
      heightScale,
      bothAnchorsInView,
      viewWindow,
    } = this.props;
    const score = placedInteraction.interaction.score;
    if (!score) {
      return null;
    }
    const { xSpan1, xSpan2 } = placedInteraction;
    let xSpan1Center, xSpan2Center;
    if (xSpan1.start === xSpan2.start && xSpan1.end === xSpan2.end) {
      // inter-region arc
      xSpan1Center = xSpan1.start;
      xSpan2Center = xSpan1.end;
    } else {
      xSpan1Center = 0.5 * (xSpan1.start + xSpan1.end);
      xSpan2Center = 0.5 * (xSpan2.start + xSpan2.end);
    }
    if (bothAnchorsInView) {
      if (xSpan1.start < viewWindow.start || xSpan2.end > viewWindow.end) {
        return null;
      }
    }
    const spanLength = xSpan2Center - xSpan1Center;
    if (spanLength < 1) {
      return null;
    }
    const controlY = heightScale(score) * 1.33333;
    return (
      <path
        key={placedInteraction.generateKey() + index}
        d={
          moveTo(xSpan1Center, 0) +
          cubicCurveTo(
            xSpan1Center,
            controlY,
            xSpan2Center,
            controlY,
            xSpan2Center,
            0
          )
        }
        fill="none"
        // opacity={opacityScale(score)}
        stroke={score >= 0 ? color : color2}
        strokeWidth={lineWidth}
        // onMouseMove={event => onInteractionHovered(event, placedInteraction.interaction)} // tslint:disable-line
      />
    );
    // const height = arcHeights.length > 0 ? Math.round(_.max(arcHeights)) : 50;
    // return <svg width={width} height={height} onMouseOut={onMouseOut}>{arcs}</svg>;
  };

  render() {
    const { placedInteractions, width, forceSvg, height } = this.props;
    // const sortedInteractions = placedInteractions.slice().sort((a, b)
    //        => b.interaction.score - a.interaction.score);
    // const slicedInteractions = sortedInteractions.slice(0, ITEM_LIMIT); // Only render ITEM_LIMIT highest scores
    return placedInteractions.length === 0 ? (
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
        {placedInteractions.map(this.renderCurve)}
      </DesignRenderer>
    );
  }
}
