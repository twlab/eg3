import React, { Component } from "react";
import * as PIXI from "pixi.js";
import { colorString2number } from "../../../../models/util";

import TrackModel from "../../../../models/TrackModel";
const ITEM_LIMIT = 1000;
interface PixiArcProps {
  placedInteractionsArray: any;
  viewWindow: { start: number; end: number };
  opacityScale: (value: number) => number;
  height: number;
  width: number;
  backgroundColor?: string;
  color?: string;
  color2?: string;
  speed?: number[];
  steps?: number;
  currentStep?: number;
  lineWidth?: number;
  dynamicColors?: string[];
  useDynamicColors?: boolean;
  playing?: boolean;
  trackModel: TrackModel;
}

interface PixiArcState {
  currentStep: number;
  isPlaying: boolean;
}

class PixiArc extends React.PureComponent<PixiArcProps, PixiArcState> {
  private myRef: React.RefObject<HTMLDivElement>;
  private container: HTMLDivElement | null = null;
  private subcontainer: PIXI.Container;
  private app: any;
  private count: number = 0;
  private steps: number;
  private subs: PIXI.Graphics[] = []; // holder for sub containers for each sprite sets from each track
  private arcData: any[][] = [];

  static defaultProps = {
    currentStep: 0,
    speed: [5], // react-compound-slider requires an array
    color: "blue",
    backgroundColor: "var(--bg-color)",
    lineWidth: 1,
    dynamicColors: [],
    useDynamicColors: false,
  };

  constructor(props: PixiArcProps) {
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
    const bgColor = colorString2number(backgroundColor || "0x000000");
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

    this.steps = this.getMaxSteps();
    this.drawArc();
    window.addEventListener("resize", this.onWindowResize);
  }

  componentWillUnmount() {
    this.app.ticker.remove(this.tick);
    window.removeEventListener("resize", this.onWindowResize);
    this.app.stage.off("pointerdown", this.onPointerDown);
  }

  componentDidUpdate(prevProps: PixiArcProps, prevState: PixiArcState) {
    if (
      prevProps.placedInteractionsArray !== this.props.placedInteractionsArray
    ) {
      this.drawArc();
    }
    if (prevProps.color !== this.props.color) {
      if (
        !(
          this.props.useDynamicColors &&
          this.props.dynamicColors &&
          this.props.dynamicColors.length
        )
      ) {
        const color = colorString2number(this.props.color || "0x000000");
        this.subs.forEach((c) => c.children.forEach((s) => (s.tint = color)));
      }
    }
    if (prevProps.useDynamicColors !== this.props.useDynamicColors) {
      if (!this.props.useDynamicColors) {
        const color = colorString2number(this.props.color || "0x000000");
        this.subs.forEach((c) => c.children.forEach((s) => (s.tint = color)));
      }
    }
    if (prevProps.backgroundColor !== this.props.backgroundColor) {
      this.app.renderer.backgroundColor = colorString2number(
        this.props.backgroundColor || "0x000000"
      );
    }
    if (
      prevProps.height !== this.props.height ||
      prevProps.width !== this.props.width
    ) {
      this.app.renderer.resize(this.props.width, this.props.height);
    }
    if (prevProps.playing !== this.props.playing) {
      if (this.props.playing) {
        this.app.ticker.start();
      } else {
        this.app.ticker.stop();
      }
    }
    if (prevState.currentStep !== this.state.currentStep) {
      this.subs.forEach((c, i) => {
        c.visible = i === this.state.currentStep;
      });
    }
  }

  onPointerDown = (event: PIXI.FederatedPointerEvent) => {
    if (event.button === 1) {
      // Middle mouse button
      this.setState(
        (prevState) => ({ isPlaying: !prevState.isPlaying }),
        () => {
          if (this.state.isPlaying) {
            this.app.ticker.start();
          } else {
            this.app.ticker.stop();
          }
        }
      );
    }
  };

  onWindowResize = () => {
    const { height, width } = this.props;
    if (this.app) {
      this.app.renderer.resize(width, height);
    }
  };

  tick = () => {
    this.count += 0.005 * (this.props.speed ? this.props.speed[0] : 1);
    if (this.count >= this.steps - 1) {
      this.count = 0;
    }
    const step = Math.round(this.count);
    this.setState({ currentStep: step });
  };

  getMaxSteps = () => {
    const max = this.props.steps
      ? this.props.steps
      : this.props.placedInteractionsArray.length;
    return max;
  };

  initializeSubs = () => {
    this.subs = [];
    this.steps = this.getMaxSteps();
    for (let i = 0; i < this.steps; i++) {
      this.subs.push(new PIXI.Graphics());
      this.arcData.push([]);
    }
    this.subs.forEach((c) => this.subcontainer.addChild(c));
  };

  resetSubs = () => {
    this.subs.forEach((c) => {
      c.clear();
      c.removeChildren();
    });
    this.arcData = this.arcData.map(() => []);
  };

  drawArc = () => {
    const {
      opacityScale,
      color,
      color2,
      viewWindow,
      height,
      placedInteractionsArray,
      trackModel,
      lineWidth,
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

    let colorEach;
    placedInteractionsArray.forEach((placedInteractions: any, index) => {
      const sortedInteractions = placedInteractions
        .slice()
        .sort((a, b) => b.interaction.score - a.interaction.score);
      const slicedInteractions = sortedInteractions.slice(0, ITEM_LIMIT); // Only render ITEM_LIMIT highest scores

      if (useDynamicColors && dynamicColors && dynamicColors.length) {
        const colorIndex =
          index < dynamicColors.length ? index : index % dynamicColors.length;
        colorEach = dynamicColors[colorIndex];
      } else {
        colorEach = color;
      }

      slicedInteractions.forEach((placedInteraction) => {
        const score = placedInteraction.interaction.score;
        if (!score) {
          return;
        }
        const { xSpan1, xSpan2 } = placedInteraction;
        let xSpan1Center, xSpan2Center;
        if (xSpan1.start === xSpan2.start && xSpan1.end === xSpan2.end) {
          xSpan1Center = xSpan1.start;
          xSpan2Center = xSpan1.end;
        } else {
          xSpan1Center = 0.5 * (xSpan1.start + xSpan1.end);
          xSpan2Center = 0.5 * (xSpan2.start + xSpan2.end);
        }
        const spanCenter = 0.5 * (xSpan1Center + xSpan2Center);
        const spanLength = xSpan2Center - xSpan1Center;
        const halfLength = 0.5 * spanLength;
        if (spanLength < 1) {
          return;
        }
        const radius = Math.max(0, Math.SQRT2 * halfLength - lineWidth! * 0.5);
        const colorToUse =
          !(useDynamicColors && dynamicColors && dynamicColors.length) &&
          score < 0
            ? color2
            : colorEach;
        const tintColor = colorString2number(colorToUse);
        const g = this.subs[index];
        g.moveTo(xSpan2Center, 0);
        g.lineStyle(lineWidth, tintColor, opacityScale(score));
        g.arc(
          spanCenter,
          -halfLength,
          radius,
          Math.SQRT1_2,
          Math.PI - Math.SQRT1_2
        );
        this.arcData[index].push([
          spanCenter,
          -halfLength,
          radius,
          lineWidth,
          placedInteraction.interaction,
        ]);
      });

      const label = trackModel.tracks![index].label
        ? trackModel.tracks![index].label
        : "";
      if (label) {
        const t = new PIXI.Text(trackModel.tracks![index].label, style);
        t.position.set(viewWindow.start + 5, height - 21);
        this.subs[index].addChild(t);
      }
    });
  };

  render() {
    const { height, width } = this.props;
    const style = { width: `${width}px`, height: `${height}px` };
    return <div style={style} ref={this.myRef}></div>;
  }
}

export default PixiArc;
