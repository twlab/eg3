import { PureComponent } from "react";
interface PixiHeatmapProps {
    placedInteractionsArray: any;
    viewWindow: {
        start: number;
        end: number;
    };
    opacityScale: (score: number) => number;
    height: number;
    width: number;
    backgroundColor?: string;
    color?: string;
    color2?: string;
    speed?: number[];
    steps?: number;
    currentStep?: number;
    useDynamicColors?: boolean;
    dynamicColors?: string[];
    playing?: boolean;
    viewer3dNumFrames?: {
        viewer3d?: any;
        numFrames?: number;
    };
    trackModel?: {
        tracks: {
            label?: string;
        }[];
    };
}
interface PixiHeatmapState {
    currentStep: number;
    isPlaying: boolean;
}
export declare class PixiHeatmap extends PureComponent<PixiHeatmapProps, PixiHeatmapState> {
    static propTypes: {
        placedInteractionsArray: any;
        viewWindow: any;
        opacityScale: any;
        height: any;
        width: any;
        backgroundColor: any;
        color: any;
        color2: any;
        speed: any;
        steps: any;
        currentStep: any;
    };
    static defaultProps: Partial<PixiHeatmapProps>;
    private myRef;
    private container;
    private app;
    private subcontainer;
    private count;
    private steps;
    private subs;
    private hmData;
    constructor(props: PixiHeatmapProps);
    componentDidMount(): Promise<void>;
    componentWillUnmount(): void;
    componentDidUpdate(prevProps: PixiHeatmapProps, prevState: PixiHeatmapState): void;
    getMaxSteps: () => any;
    onPointerDown: (event: PIXI.FederatedPointerEvent) => Promise<void>;
    onWindowResize: () => void;
    tick: () => void;
    initializeSubs: () => void;
    resetSubs: () => void;
    drawHeatmap: () => void;
    /**
     * Renders the default tooltip that is displayed on hover.
     *
     * @param {number} relativeX - x coordinate of hover relative to the visualizer
     * @param {number} relativeY - y coordinate of hover relative to the visualizer
     * @return {JSX.Element} tooltip to render
     */
    render(): import("react/jsx-runtime").JSX.Element;
}
export {};
