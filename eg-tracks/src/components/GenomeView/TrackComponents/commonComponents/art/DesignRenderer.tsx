import React from "react";
import PropTypes from "prop-types";

export const RenderTypes = {
  CANVAS: 0,
  SVG: 1,
};

const DEFAULT_STYLE = { display: "block" }; // display: block prevents extra bottom padding in both svg and canvas

interface DesignRendererProps {
  children: React.ReactNode;
  type: any;
  style?: any;
  width: any;
  height: number;
  viewWindow?: any;
  forceSvg?: boolean;
}
interface CanvasRendererProps {
  children: any;
  width?: any;
  height?: any;
  style?: any;
}

/**
 * A component that renders SVG elements in a flexible way: in a <svg>, in a <canvas>, etc.
 *
 * @author Silas Hsu
 */
export class DesignRenderer extends React.PureComponent<DesignRendererProps> {
  static defaultProps = {
    type: RenderTypes.SVG,
    style: {},
  };

  render() {
    const { type, style } = this.props;

    const mergedStyle = Object.assign({}, DEFAULT_STYLE, style);
    switch (type) {
      case RenderTypes.CANVAS:
        return (
          <CanvasDesignRenderer
            width={this.props.width}
            height={this.props.height}
            children={this.props.children}
            style={mergedStyle}
          />
        );
      case RenderTypes.SVG:
        if (this.props.forceSvg) {
          return (
            <svg
              children={this.props.children}
              style={mergedStyle}
              width={this.props.width}
              // viewBox={`${start} 0 ${svgWidth} ${this.props.height}`}
              height={this.props.height}
            />
          );
        } else {
          return (
            <svg
              width={this.props.width}
              height={this.props.height}
              children={this.props.children}
              style={mergedStyle}
            />
          );
        }

      default:
        return null;
    }
  }
}

/**
 * Component that replicates draws its children the best it can on a <canvas>.  Any props are passed directly to the
 * <canvas>.
 *
 * @author Silas Hsu
 */

class CanvasDesignRenderer extends React.PureComponent<CanvasRendererProps> {
  canvasNode: any;
  /**
   * Draws the canvas.
   */
  componentDidMount() {
    this.draw(this.canvasNode);
  }

  /**
   * Redraws the canvas.
   */
  componentDidUpdate(prevProps) {
    const pixelRatio = this.getPixelRatioSafely();
    if (pixelRatio !== 1) {
      const width = this.props.width;
      const height = this.props.height;
      // this.canvasNode.parentNode.style.width = width + 'px';
      // this.canvasNode.parentNode.style.height = height + 'px';
      this.canvasNode.style.width = width + "px";
      this.canvasNode.style.height = height + "px";
      this.canvasNode.setAttribute("width", width * pixelRatio);
      this.canvasNode.setAttribute("height", height * pixelRatio);
      const context = this.canvasNode.getContext("2d");
      context.scale(pixelRatio, pixelRatio);
    }
    this.draw(this.canvasNode);
  }
  /**
   * Redraws the canvas.
   */

  drawOneElement(context, element) {
    if (!element) {
      return; // Do nothing
    }
    if (Array.isArray(element)) {
      element.forEach((e) => this.drawOneElement(context, e));
      return;
    }

    const props = element.props;
    switch (element.type) {
      case "rect":
        context.fillStyle = props.fill;
        context.globalAlpha = props.fillOpacity || 1;
        context.fillRect(props.x, props.y, props.width, props.height);
        break;
      case "g":
        React.Children.forEach(props.children, (child) =>
          this.drawOneElement(context, child)
        );
        break;
      case "line":
        context.strokeStyle = props.stroke;
        context.beginPath();
        context.moveTo(props.x1, props.y1);
        context.lineTo(props.x2, props.y2);
        context.stroke();
        break;
      case "circle":
        context.strokeStyle = props.stroke;
        context.globalAlpha = props.strokeOpacity || 1;
        context.beginPath();
        context.arc(props.cx, props.cy, props.r, 0, 2 * Math.PI, false);
        context.stroke();
        break;
      // case 'polyline':
      //     context.strokeStyle = props.stroke;
      //     context.lineWidth = props.strokeWidth;
      //     context.beginPath();
      //     const points = props.points.split(' ');
      //     const [x1, y1] = points[0].split(',');
      //     context.moveTo(x1, y1);
      //     let x, y;
      //     for (let i = 1; i++; i < points.length) {
      //         if (points[i]) {
      //             [x, y] = points[i].split(',');
      //             context.lineTo(x, y);
      //         }
      //     }
      //     context.stroke();
      //     break;
      case "polygon":
        context.fillStyle = props.fill;
        context.globalAlpha = props.opacity || 1;
        context.beginPath();
        context.moveTo(props.points[0][0], props.points[0][1]);
        context.lineTo(props.points[1][0], props.points[1][1]);
        context.lineTo(props.points[2][0], props.points[2][1]);
        context.lineTo(props.points[3][0], props.points[3][1]);
        context.closePath();
        context.fill();
        break;
      case "path":
        context.fillStyle = props.fill;
        context.globalAlpha = props.opacity || 1;
        context.strokeStyle = props.stroke;
        context.lineWidth = props.strokeWidth;
        const path = new Path2D(props.d);
        context.stroke(path);
        break;
      case undefined:
        break;
      default:
        console.error(
          `Drawing '${element.type}'s is unsupported.  Ignoring...`
        );
    }
  }

  /**
   * Gets the device's pixel ratio.  Guaranteed to be a number greater than 0.
   *
   * @return {number} this device's pixel ratio
   */
  getPixelRatioSafely = () => {
    const pixelRatio = window.devicePixelRatio;
    if (Number.isFinite(pixelRatio) && pixelRatio > 0) {
      return pixelRatio;
    } else {
      return 1;
    }
  };

  /**
   * Redraws the canvas.
   */
  draw(canvas) {
    if (process.env.NODE_ENV === "test") {
      // jsdom does not support canvas
      return;
    }
    const pixelRatio = this.getPixelRatioSafely();
    const width = this.props.width;
    const height = this.props.height;
    // this.canvasNode.parentNode.style.width = width + 'px';
    // this.canvasNode.parentNode.style.height = height + 'px';
    this.canvasNode.style.width = width + "px";
    this.canvasNode.style.height = height + "px";
    this.canvasNode.setAttribute("width", width * pixelRatio);
    this.canvasNode.setAttribute("height", height * pixelRatio);
    const context = this.canvasNode.getContext("2d");
    context.scale(pixelRatio, pixelRatio);

    context.clearRect(0, 0, this.canvasNode.width, this.canvasNode.height); // Clear the canvas

    this.props.children!.forEach((element) =>
      this.drawOneElement(context, element)
    );
  }

  render() {
    const { children, ...otherProps } = this.props;

    return <canvas ref={(node) => (this.canvasNode = node)} {...otherProps} />;
  }
}

export default DesignRenderer;
