import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import * as PIXI from "pixi.js";
import pointInPolygon from "point-in-polygon";

import { colorString2number } from "@/models/util";

const ANGLE = Math.PI / 4;
const SIDE_SCALE = Math.sin(ANGLE);

interface PixiHeatmapProps {
  placedInteractionsArray: any;
  viewWindow: { start: number; end: number };
  opacityScale: (score: number) => number;
  height: number;
  width: number;
  backgroundColor?: string;
  color?: string;
  color2?: string;
  speed?: number[]; // playing speed, 1-10, 1 is slowest, 10 is fastest
  steps?: number; // total steps of animation
  currentStep?: number; // current playing step, default is first step 0
  useDynamicColors?: boolean;
  dynamicColors?: string[];
  playing?: boolean;
  viewer3dNumFrames?: { viewer3d?: any; numFrames?: number };
  trackModel?: { tracks: { label?: string }[] };
}

interface PixiHeatmapState {
  currentStep: number;
  isPlaying: boolean;
}

export class PixiHeatmap extends PureComponent<
  PixiHeatmapProps,
  PixiHeatmapState
> {
  static propTypes = {
    placedInteractionsArray: PropTypes.array.isRequired,
    viewWindow: PropTypes.object.isRequired,
    opacityScale: PropTypes.func.isRequired,
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    backgroundColor: PropTypes.string,
    color: PropTypes.string,
    color2: PropTypes.string,
    speed: PropTypes.array, // playing speed, 1-10, 1 is slowest, 10 is fastest
    steps: PropTypes.number, // total steps of animation
    currentStep: PropTypes.number, // current playing step, default is first step 0
  };

  static defaultProps: Partial<PixiHeatmapProps> = {
    currentStep: 0,
    speed: [5], // react-compound-slider requires an array
    color: "blue",
    backgroundColor: "var(--bg-color)",
    dynamicColors: [],
    useDynamicColors: false,
  };

  private myRef: React.RefObject<HTMLDivElement>;
  private container: HTMLDivElement | null = null;
  private app: PIXI.Application | undefined;
  private subcontainer: PIXI.Container;
  private count: number = 0;
  private steps: number;
  private subs: PIXI.Container[] = []; // holder for sub containers for each sprite sets from each track
  private hmData: any[][] = [];

  constructor(props: PixiHeatmapProps) {
    super(props);
    this.myRef = React.createRef();
    this.state = {
      currentStep: 0,
      isPlaying: true,
    };
    this.steps = this.getMaxSteps();
    this.subcontainer = new PIXI.Container();
  }

  async componentDidMount() {
    this.container = this.myRef.current;
    const { height, width, backgroundColor } = this.props;
    const bgColor = colorString2number("white");
    this.app = new PIXI.Application();
    await this.app.init({
      width,
      height,
      backgroundColor: bgColor,
      autoDensity: true,
      resolution: window.devicePixelRatio,
    });

    if (this.container) {
      this.container.appendChild(this.app.view);
    }

    this.app.ticker.add(this.tick);
    this.app.stage.interactive = true;
    this.app.stage.on("pointerdown", this.onPointerDown);
    this.app.stage.addChild(this.subcontainer);

    window.addEventListener("resize", this.onWindowResize);
    this.steps = this.getMaxSteps();
    this.drawHeatmap();
  }

  componentWillUnmount() {
    this.app!.ticker.remove(this.tick);
    window.removeEventListener("resize", this.onWindowResize);
    this.app!.stage.off("pointerdown", this.onPointerDown);
  }

  componentDidUpdate(prevProps: PixiHeatmapProps, prevState: PixiHeatmapState) {
    if (
      prevProps.placedInteractionsArray !== this.props.placedInteractionsArray
    ) {
      this.drawHeatmap();
    }

    if (prevProps.color !== this.props.color) {
      if (!(this.props.useDynamicColors && this.props.dynamicColors!.length)) {
        const color = colorString2number(this.props.color || "blue");
        this.subs.forEach((c) =>
          c.children.forEach((s: any) => (s.tint = color))
        );
      }
    }

    if (prevProps.useDynamicColors !== this.props.useDynamicColors) {
      if (!this.props.useDynamicColors) {
        const color = colorString2number(this.props.color || "green");
        this.subs.forEach((c) =>
          c.children.forEach((s: any) => (s.tint = color))
        );
      }
    }

    if (prevProps.backgroundColor !== this.props.backgroundColor) {
      this.app!.renderer.background = colorString2number(
        this.props.backgroundColor || "0x000000"
      );
    }

    if (
      prevProps.height !== this.props.height ||
      prevProps.width !== this.props.width
    ) {
      this.app!.renderer.resize(this.props.width, this.props.height);
    }

    if (prevProps.playing !== this.props.playing) {
      if (this.props.playing) {
        this.setState({ isPlaying: true });
        this.app!.ticker.start();
      } else {
        this.setState({ isPlaying: false });
        this.app!.ticker.stop();
      }
    }

    if (prevState.currentStep !== this.state.currentStep) {
      this.subs.forEach((c, i) => {
        c.visible = i === this.state.currentStep;
      });

      if (this.props.viewer3dNumFrames) {
        if (
          this.props.viewer3dNumFrames.viewer3d &&
          this.props.viewer3dNumFrames.numFrames !== 0
        ) {
          this.props.viewer3dNumFrames.viewer3d
            .setFrame(
              this.state.currentStep % this.props.viewer3dNumFrames.numFrames!
            )
            .then(() => this.props.viewer3dNumFrames!.viewer3d.render());
        }
      }
    }
  }

  getMaxSteps = () => {
    const max = this.props.steps || this.props.placedInteractionsArray.length;
    return max;
  };

  onPointerDown = async (event: PIXI.FederatedPointerEvent) => {
    if (event.button === 1) {
      this.setState(
        (prevState) => ({ isPlaying: !prevState.isPlaying }),
        () => {
          if (this.state.isPlaying) {
            this.app!.ticker.start();
          } else {
            this.app!.ticker.stop();
          }
        }
      );
    }
  };

  onWindowResize = () => {
    const { height, width } = this.props;
    this.app!.renderer.resize(width, height);
  };

  tick = () => {
    this.count += 0.005 * (this.props.speed ? this.props.speed[0] : 1);
    if (this.count >= this.steps - 1) {
      this.count = 0;
    }
    this.setState({ currentStep: Math.round(this.count) });
  };

  initializeSubs = () => {
    this.subs = [];
    this.steps = this.getMaxSteps();
    for (let i = 0; i < this.steps; i++) {
      this.subs.push(new PIXI.Container());
      this.hmData.push([]);
    }
    this.subs.forEach((c) => this.subcontainer.addChild(c));
  };

  resetSubs = () => {
    this.subs.forEach((c) => c.removeChildren());
    this.hmData = this.hmData.map(() => []);
  };

  drawHeatmap = () => {
    const {
      opacityScale,
      color,
      color2,
      viewWindow,
      height,
      placedInteractionsArray,
      trackModel,
      useDynamicColors,
      dynamicColors,
    } = this.props;

    if (this.subs.length) {
      this.resetSubs();
    } else {
      this.initializeSubs();
    }

    const style = new PIXI.TextStyle({
      fontFamily: "Arial",
      fontSize: 16,
    });

    const g = new PIXI.Graphics();
    g.lineStyle(0);
    g.beginFill(0xffffff, 1);
    g.drawRect(0, 0, 1, 1);
    g.endFill();

    const t = this.app!.renderer.generateTexture(g);
    let colorEach;
    console.log(this.props);
    placedInteractionsArray.forEach((placedInteractions: any, index) => {
      if (useDynamicColors && dynamicColors!.length) {
        const colorIndex =
          index < dynamicColors!.length ? index : index % dynamicColors!.length;
        colorEach = dynamicColors![colorIndex];
      } else {
        colorEach = color;
      }

      placedInteractions.forEach((placedInteraction) => {
        const score = placedInteraction.interaction.score;
        if (!score) {
          return null;
        }
        const { xSpan1, xSpan2 } = placedInteraction;
        if (xSpan1.end < viewWindow.start && xSpan2.start > viewWindow.end) {
          return null;
        }
        const gapCenter = (xSpan1.end + xSpan2.start) / 2;
        const gapLength = xSpan2.start - xSpan1.end;
        const topX = gapCenter;
        const topY = 0.5 * gapLength;
        const halfSpan1 = Math.max(0.5 * xSpan1.getLength(), 1);
        const halfSpan2 = Math.max(0.5 * xSpan2.getLength(), 1);
        const colorToUse =
          !(useDynamicColors && dynamicColors!.length) && score < 0
            ? color2
            : colorEach;
        const tintColor = colorString2number(colorToUse);
        const bottomY = topY + halfSpan1 + halfSpan2;
        const points = [
          // Going counterclockwise
          [topX, topY], // Top
          [topX - halfSpan1, topY + halfSpan1], // Left
          [topX - halfSpan1 + halfSpan2, bottomY], // Bottom = left + halfSpan2
          [topX + halfSpan2, topY + halfSpan2], // Right
        ];

        const s = new PIXI.Sprite(t);
        s.tint = tintColor;
        s.position.set(topX, topY);
        s.scale.set(
          SIDE_SCALE * xSpan2.getLength(),
          SIDE_SCALE * xSpan1.getLength()
        );
        s.pivot.set(0);
        s.rotation = ANGLE;
        s.alpha = opacityScale(score);
        this.subs[index].addChild(s);

        // only push the points in screen
        if (
          topX + halfSpan2 > viewWindow.start &&
          topX - halfSpan1 < viewWindow.end &&
          topY < height
        ) {
          this.hmData[index].push({
            points,
            interaction: placedInteraction.interaction,
          });
        }
      });

      const label = trackModel?.tracks[index]?.label || "";
      if (label) {
        const t = new PIXI.Text({
          text: label,
          style: style,
        });
        t.position.set(viewWindow.start + 5, height - 21);
        this.subs[index].addChild(t);
      }
    });
  };

  /**
   * Renders the default tooltip that is displayed on hover.
   *
   * @param {number} relativeX - x coordinate of hover relative to the visualizer
   * @param {number} relativeY - y coordinate of hover relative to the visualizer
   * @return {JSX.Element} tooltip to render
   */
  renderTooltip = (relativeX: number, relativeY: number) => {
    const { trackModel } = this.props;
    const polygons = this.findPolygon(relativeX, relativeY);
    if (polygons.length) {
      return (
        <div>
          {polygons.map((polygon: any, i) => (
            <div key={i}>
              <div>
                <strong>{trackModel?.tracks[i]?.label}</strong>
              </div>
              <div>Locus1: {polygon.interaction.locus1.toString()}</div>
              <div>Locus2: {polygon.interaction.locus2.toString()}</div>
              <div>Score: {polygon.interaction.score}</div>
            </div>
          ))}
        </div>
      );
    } else {
      return null;
    }
  };

  findPolygon = (x: number, y: number) => {
    const polygons: Array<any> = [];
    for (const hmData of this.hmData) {
      for (const item of hmData) {
        if (pointInPolygon([x, y], item.points)) {
          polygons.push(item);
          break;
        }
      }
    }
    return polygons;
  };

  render() {
    const { height, width } = this.props;
    const style = { width: `${width}px`, height: `${height}px` };
    return <div ref={this.myRef}></div>;
  }
}
