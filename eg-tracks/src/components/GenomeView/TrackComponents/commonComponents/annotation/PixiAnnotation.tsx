import React from "react";
import PropTypes from "prop-types";
import * as PIXI from "pixi.js";
import { colorString2number } from "@eg/core/src/eg-lib/models/util";

export const TOP_PADDING = 2;
export const ROW_VERTICAL_PADDING = 2;

interface PixiAnnotationProps {
  arrangeResults: Array<any>;
  viewWindow: { start: number };
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
  trackModel?: {
    tracks: { label: string }[];
  };
  rowHeight?: number;
  maxRows: number;
}

interface PixiAnnotationState {
  currentStep: number;
  isPlaying: boolean;
}

export class PixiAnnotation extends React.PureComponent<
  PixiAnnotationProps,
  PixiAnnotationState
> {
  static propTypes = {
    arrangeResults: PropTypes.array.isRequired,
    viewWindow: PropTypes.object.isRequired,
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    backgroundColor: PropTypes.string,
    color: PropTypes.string,
    color2: PropTypes.string,
    speed: PropTypes.array, // playing speed, 1-10, 1 is slowest, 10 is fastest
    steps: PropTypes.number, // total steps of animation
    currentStep: PropTypes.number, // current playing step, default is first step 0
  };

  static defaultProps: Partial<PixiAnnotationProps> = {
    currentStep: 0,
    speed: [5], // react-compound-slider requires an array
    color: "blue",
    backgroundColor: "var(--bg-color)",
    dynamicColors: [],
    useDynamicColors: false,
  };

  private myRef: React.RefObject<HTMLDivElement>;
  private container: HTMLDivElement | null = null;
  private subcontainer: PIXI.Container | null = null;
  private app: PIXI.Application | null = null;
  private count: number = 0;
  private subs: PIXI.Container[] = [];
  private steps: number = 0;

  constructor(props: PixiAnnotationProps) {
    super(props);
    this.myRef = React.createRef();
    this.state = {
      currentStep: 0,
      isPlaying: true,
    };
  }

  async componentDidMount() {
    this.container = this.myRef.current;
    const { height, width, backgroundColor } = this.props;

    const bgColor = colorString2number(backgroundColor || "white");

    this.app = new PIXI.Application();
    await this.app.init({
      width,
      height,
      backgroundColor: bgColor,
      autoDensity: true,
      resolution: window.devicePixelRatio,
    });

    if (this.container && this.app.view) {
      this.container.appendChild(this.app.view as HTMLCanvasElement);
    }

    this.subcontainer = new PIXI.Container();
    this.app.stage.addChild(this.subcontainer);
    this.app.ticker.add(this.tick);
    window.addEventListener("resize", this.onWindowResize);
    this.app.stage.interactive = true;
    this.app.stage.on("pointerdown", this.onPointerDown);

    // Draw annotations initially
    this.drawAnnotations();
  }

  componentWillUnmount() {
    this.app?.ticker.remove(this.tick);
    window.removeEventListener("resize", this.onWindowResize);
    this.app?.stage.off("pointerdown", this.onPointerDown);
  }

  componentDidUpdate(
    prevProps: PixiAnnotationProps,
    prevState: PixiAnnotationState
  ) {
    const { currentStep } = this.state;

    if (prevProps.arrangeResults !== this.props.arrangeResults) {
      this.drawAnnotations();
    }

    if (prevProps.color !== this.props.color) {
      if (!(this.props.useDynamicColors && this.props.dynamicColors?.length)) {
        const color = colorString2number(this.props.color || "blue");
        this.subs.forEach((c) =>
          c.children.forEach((s) => ((s as PIXI.Sprite).tint = color))
        );
      }
    }

    if (prevProps.useDynamicColors !== this.props.useDynamicColors) {
      if (!this.props.useDynamicColors) {
        const color = colorString2number(this.props.color || "blue");
        this.subs.forEach((c) =>
          c.children.forEach((s) => ((s as PIXI.Sprite).tint = color))
        );
      }
    }

    if (prevProps.backgroundColor !== this.props.backgroundColor) {
      this.app!.renderer.background.color = colorString2number(
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
        this.app!.ticker.start();
      } else {
        this.app!.ticker.stop();
      }
    }

    if (prevState.currentStep !== currentStep) {
      this.subs.forEach((c, i) => {
        c.visible = i === currentStep;
      });
    }
  }

  onPointerDown = (event: PIXI.FederatedPointerEvent) => {
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

  initializeSubs = () => {
    this.subs = [];
    this.steps = this.getMaxSteps();
    for (let i = 0; i < this.steps; i++) {
      this.subs.push(new PIXI.Container());
    }
    this.subs.forEach((c) => this.subcontainer!.addChild(c));
  };

  resetSubs = () => {
    this.subs.forEach((c) => c.removeChildren());
  };

  onWindowResize = () => {
    const { height, width } = this.props;
    this.app?.renderer.resize(width, height);
  };

  tick = () => {
    this.count += 0.005 * this.props.speed![0];
    if (this.count >= this.steps - 1) {
      this.count = 0;
    }
    this.setState({ currentStep: Math.round(this.count) });
  };

  getMaxSteps = () => {
    const { steps, arrangeResults } = this.props;
    return steps || arrangeResults.length;
  };

  drawAnnotations = () => {
    const {
      color,
      color2,
      viewWindow,
      height,
      arrangeResults,
      trackModel,
      rowHeight,
      useDynamicColors,
      dynamicColors,
    } = this.props;

    if (this.subs.length) {
      this.resetSubs();
    } else {
      this.initializeSubs();
    }

    const style = {
      fontFamily: "Arial",
      fontSize: 16,
    };

    const bedStyle = {
      fontFamily: "Arial",
      fontSize: rowHeight!,
    };

    const g = new PIXI.Graphics();
    g.lineStyle(0);
    g.beginFill(0xffffff, 1);
    g.drawRect(0, 0, 1, 1);
    g.endFill();

    let colorEach;
    const t = this.app!.renderer.generateTexture(g);

    arrangeResults.forEach((placementGroup, index) => {
      if (useDynamicColors && dynamicColors?.length) {
        const colorIndex =
          index < dynamicColors.length ? index : index % dynamicColors.length;
        colorEach = dynamicColors[colorIndex];
      } else {
        colorEach = color!;
      }

      placementGroup.placements.forEach((placement: any) => {
        const { xSpan, row, feature } = placement;
        const colorToUse =
          !(useDynamicColors && dynamicColors?.length) &&
          feature.getIsReverseStrand()
            ? color2
            : colorEach;

        const tintColor = colorString2number(colorToUse);
        const itemWidth = Math.max(2, xSpan.end - xSpan.start);
        const s = new PIXI.Sprite(t);
        s.tint = tintColor;
        const itemY = row * (rowHeight! + ROW_VERTICAL_PADDING) + TOP_PADDING;
        s.position.set(xSpan.start, itemY);
        s.scale.set(itemWidth, rowHeight!);
        this.subs[index].addChild(s);

        const textStyle = { ...bedStyle, fill: colorEach };

        const st = new PIXI.Text({
          text: feature.getName(),
          style: textStyle,
        });
        st.position.set(xSpan.end + 2, itemY - TOP_PADDING);
        this.subs[index].addChild(st);
      });

      const label = trackModel!.tracks[index].label || "";
      if (label) {
        const t = new PIXI.Text({
          text: label,
          style: style,
        });
        t.position.set(viewWindow.start + 5, height - 21);
        this.subs[index].addChild(t);
      }
    });

    g.destroy();
  };

  render() {
    const { height, width } = this.props;
    const style = { width: `${width}px`, height: `${height}px` };
    return <div style={style} ref={this.myRef}></div>;
  }
}
