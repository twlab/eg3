import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import * as PIXI from "pixi.js";
import { colorString2number } from "../../../../../models/util";

interface PixiSceneProps {
  xToValue: { length: number }[];
  scales: { valueToY: (value: number) => number; min: number };
  height: number;
  width: number;
  backgroundColor?: string;
  color?: string;
  speed?: number[]; // playing speed, 1-10, 1 is slowest, 10 is fastest
  steps?: number; // total steps of animation
  currentStep?: number; // current playing step, default is first step 0
  useDynamicColors?: boolean;
  dynamicColors?: string[];
  playing?: boolean;
  viewWindow?: { start: number };
  dynamicLabels?: string[];
}

interface PixiSceneState {
  currentStep: number;
  isPlaying: boolean;
  prevStep: number;
}

export class PixiScene extends React.PureComponent<
  PixiSceneProps,
  PixiSceneState
> {
  static propTypes = {
    xToValue: PropTypes.array.isRequired,
    scales: PropTypes.object.isRequired,
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    backgroundColor: PropTypes.string,
    color: PropTypes.string,
    speed: PropTypes.array, // playing speed, 1-10, 1 is slowest, 10 is fastest
    steps: PropTypes.number, // total steps of animation
    currentStep: PropTypes.number, // current playing step, default is first step 0
  };

  static defaultProps: Partial<PixiSceneProps> = {
    currentStep: 0,
    speed: [5], // react-compound-slider requires an array
    color: "blue",
    backgroundColor: "var(--bg-color)",
    dynamicColors: [],
    useDynamicColors: false,
  };

  private myRef: React.RefObject<HTMLDivElement>;
  private container: HTMLDivElement | null = null;
  private particles: PIXI.Container;
  private app: any;
  private t: any;
  private centerLine: PIXI.Sprite | null = null;
  private count: number = 0;
  private sprites: PIXI.Sprite[] = [];
  private labels: PIXI.Text[] = [];
  private steps: number;

  constructor(props: PixiSceneProps) {
    super(props);
    this.myRef = React.createRef();
    this.state = {
      currentStep: 0,
      isPlaying: true,
      prevStep: 0,
    };
    this.steps = this.getMaxSteps();
    this.particles = new PIXI.Container();
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
      this.container.appendChild(this.app.view as HTMLCanvasElement);
    }

    this.app.ticker.add(this.tick);
    this.app.stage.interactive = true;
    this.app.stage.on("pointerdown", this.onPointerDown);

    const g = new PIXI.Graphics();
    g.lineStyle(0);
    g.beginFill(0xffffff, 1);
    g.drawRect(0, 0, 1, 1);
    g.endFill();
    const color = colorString2number(this.props.color || "blue");
    this.t = this.app.renderer.generateTexture(g);
    for (let i = 0; i < width; i++) {
      const s = new PIXI.Sprite(this.t);
      s.tint = color;
      this.sprites.push(s);
      this.particles.addChild(s);
    }
    this.app.stage.addChild(this.particles);
    window.addEventListener("resize", this.onWindowResize);
  }

  componentWillUnmount() {
    this.app.ticker.remove(this.tick);
    window.removeEventListener("resize", this.onWindowResize);
    this.app.stage.off("pointerdown", this.onPointerDown);
  }

  componentDidUpdate(prevProps: PixiSceneProps, prevState: PixiSceneState) {
    const { currentStep, prevStep } = this.state;

    if (
      prevProps.height !== this.props.height ||
      prevProps.width !== this.props.width
    ) {
      this.onWindowResize();
      if (prevProps.width !== this.props.width) {
        this.handleWidthChange();
      }
    }

    if (
      prevProps.xToValue !== this.props.xToValue ||
      prevState.currentStep !== currentStep
    ) {
      this.steps = this.getMaxSteps();
      this.draw();
    }

    if (prevProps.color !== this.props.color) {
      const color = colorString2number(this.props.color || "blue");
      this.sprites.forEach((s) => (s.tint = color));
    }

    if (prevProps.backgroundColor !== this.props.backgroundColor) {
      this.app.renderer.background = colorString2number(
        this.props.backgroundColor || "0x000000"
      );
    }

    if (prevProps.playing !== this.props.playing) {
      if (this.props.playing) {
        this.app.ticker.start();
      } else {
        this.app.ticker.stop();
      }
    }

    if (prevProps.viewWindow !== this.props.viewWindow && this.labels.length) {
      this.labels.forEach((t) =>
        t.position.set((this.props.viewWindow?.start ?? 0) + 5, 5)
      );
    }

    if (
      prevProps.dynamicLabels !== this.props.dynamicLabels &&
      this.labels.length
    ) {
      this.labels.forEach(
        (label, index) => (label.text = this.props.dynamicLabels?.[index] || "")
      );
    }
  }

  handleWidthChange = () => {
    this.particles.removeChildren();
    this.sprites = [];
    const color = colorString2number(this.props.color || "blue");
    for (let i = 0; i < this.props.width; i++) {
      if (this.t) {
        const s = new PIXI.Sprite(this.t);
        s.tint = color;
        this.sprites.push(s);
        this.particles.addChild(s);
      }
    }
  };

  onWindowResize = () => {
    const { height, width } = this.props;
    if (this.app) {
      this.app.renderer.resize(width, height);
    }
  };

  onPointerDown = (event: PIXI.FederatedPointerEvent) => {
    if (event.button === 1) {
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

  tick = () => {
    this.count += 0.005 * (this.props.speed ? this.props.speed[0] : 1);
    if (this.count >= this.steps - 1) {
      this.count = 0;
    }
    const step = Math.round(this.count);
    const prevStep = step === 0 ? this.steps - 1 : step - 1;
    this.setState({ currentStep: step, prevStep });
  };

  getMaxSteps = () => {
    const max = this.props.steps
      ? this.props.steps
      : _.max(this.props.xToValue.map((v) => v.length)) || 0;
    return max;
  };

  draw = () => {
    const { scales, width, useDynamicColors, dynamicColors } = this.props;
    const { currentStep } = this.state;
    this.sprites.forEach((s) => s.scale.set(0));
    const y = scales.valueToY(0);
    if (scales.min < 0) {
      if (this.centerLine) {
        this.centerLine.position.set(0, y);
        this.centerLine.tint = 0x000000;
        this.centerLine.scale.set(width, 0.5);
        this.centerLine.visible = true;
      }
    } else {
      if (this.centerLine) {
        this.centerLine.visible = false;
      }
    }
    this.props.xToValue.forEach((value, x) => {
      const valueIndex =
        currentStep < value.length ? currentStep : currentStep % value.length;
      if (Number.isNaN(value[valueIndex])) return;
      const scaleHeight = scales.valueToY(value[valueIndex]) - y;
      const s = this.sprites[x];
      if (s) {
        s.position.set(x, y);
        s.scale.set(1, scaleHeight);
        if (useDynamicColors && dynamicColors && dynamicColors.length) {
          const color = colorString2number(
            dynamicColors[currentStep % dynamicColors.length]
          );
          s.tint = color;
        }
      }
    });
  };

  render() {
    const { height, width } = this.props;
    const style = { width: `${width}px`, height: `${height}px` };
    return <div style={style} ref={this.myRef}></div>;
  }
}
