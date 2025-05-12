import React from "react";
import TrackModel from "../../../../models/TrackModel";
interface PixiArcProps {
    placedInteractionsArray: any;
    viewWindow: {
        start: number;
        end: number;
    };
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
declare class PixiArc extends React.PureComponent<PixiArcProps, PixiArcState> {
    private myRef;
    private container;
    private subcontainer;
    private app;
    private count;
    private steps;
    private subs;
    private arcData;
    static defaultProps: {
        currentStep: number;
        speed: number[];
        color: string;
        backgroundColor: string;
        lineWidth: number;
        dynamicColors: never[];
        useDynamicColors: boolean;
    };
    constructor(props: PixiArcProps);
    componentDidMount(): Promise<void>;
    componentWillUnmount(): void;
    componentDidUpdate(prevProps: PixiArcProps, prevState: PixiArcState): void;
    onPointerDown: (event: PIXI.FederatedPointerEvent) => void;
    onWindowResize: () => void;
    tick: () => void;
    getMaxSteps: () => any;
    initializeSubs: () => void;
    resetSubs: () => void;
    drawArc: () => void;
    render(): import("react/jsx-runtime").JSX.Element;
}
export default PixiArc;
