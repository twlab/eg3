import React from "react";
import PropTypes from "prop-types";

const ARROW_WIDTH = 5;
const ARROW_SEPARATION = 12;

/**
 * A series of evenly-spaced arrows on a horizontal axis.  Renders SVG elements.
 *
 * @author Silas Hsu
 */
interface ArrowProps {
  startX: number; // X location to start drawing arrows
  endX: number; // X location to stop drawing arrows
  y?: number; // Y location to draw arrows (optional)
  height: number; // Height of arrows
  isToRight?: boolean; // Arrow point direction. If true, point right; otherwise, point left.
  color?: string; // Color of the arrows
  /**
   * Id for a clipPath element. If valid, arrows will only appear in the clipPath's region.
   */
  clipId?: string;
  opacity?: number;
  separation?: number;
}
class AnnotationArrows extends React.PureComponent<ArrowProps> {
  render() {
    const {
      startX,
      endX,
      y = 0,
      height,
      isToRight,
      color,
      clipId,
      opacity,
      separation = 0,
    } = this.props;
    if (endX - startX < ARROW_WIDTH) {
      return null;
    }
    const arrowSeparation = separation > 10 ? separation : ARROW_SEPARATION;
    const centerY = height / 2;
    const bottomY = height;
    let placementStartX = 0;
    if (startX - ARROW_WIDTH / 2 > 0) {
      placementStartX = startX - ARROW_WIDTH / 2;
    } else {
      placementStartX = ARROW_WIDTH / 2;
    }

    let placementEndX = endX;
    if (isToRight) {
      placementStartX += ARROW_WIDTH;
    } else {
      placementEndX -= ARROW_WIDTH;
    }

    let children: Array<any> = [];
    // Naming: if our arrows look like '<', then the tip is on the left, and the two tails are on the right.
    for (
      let arrowTipX = placementStartX;
      arrowTipX <= placementEndX;
      arrowTipX += arrowSeparation
    ) {
      // Is forward strand ? point to the right : point to the left
      const arrowTailX = isToRight
        ? arrowTipX - ARROW_WIDTH
        : arrowTipX + ARROW_WIDTH;
      const arrowPoints = [
        [arrowTailX, y + 1],
        [arrowTipX, centerY + y],
        [arrowTailX, bottomY + y - 1],
      ];
      children.push(
        <polyline
          key={arrowTipX}
          points={`${arrowPoints}`}
          fill="none"
          stroke={color}
          strokeWidth={1}
          strokeOpacity={opacity}
          clipPath={clipId ? `url(#${clipId})` : undefined}
        />
      );
    }
    return children;
  }
}

export default AnnotationArrows;
