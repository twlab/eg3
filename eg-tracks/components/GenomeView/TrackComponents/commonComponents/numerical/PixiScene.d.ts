import React from "react";
interface PixiSceneProps {
    xToValue: {
        length: number;
    }[];
    scales: {
        valueToY: (value: number) => number;
        min: number;
    };
    height: number;
    width: number;
    backgroundColor?: string;
    color?: string;
    speed?: number[];
    steps?: number;
    currentStep?: number;
    useDynamicColors?: boolean;
    dynamicColors?: string[];
    playing?: boolean;
    viewWindow?: {
        start: number;
    };
    dynamicLabels?: string[];
}
interface PixiSceneState {
    currentStep: number;
    isPlaying: boolean;
    prevStep: number;
}
export declare class PixiScene extends React.PureComponent<PixiSceneProps, PixiSceneState> {
    static propTypes: {
        xToValue: any;
        scales: any;
        height: any;
        width: any;
        backgroundColor: any;
        color: any;
        speed: any;
        steps: any;
        currentStep: any;
    };
    static defaultProps: Partial<PixiSceneProps>;
    private myRef;
    private container;
    private particles;
    private app;
    private t;
    private centerLine;
    private count;
    private sprites;
    private labels;
    private steps;
    constructor(props: PixiSceneProps);
    componentDidMount(): Promise<void>;
    componentWillUnmount(): void;
    componentDidUpdate(prevProps: PixiSceneProps, prevState: PixiSceneState): void;
    handleWidthChange: () => void;
    onWindowResize: () => void;
    onPointerDown: (event: PIXI.FederatedPointerEvent) => void;
    tick: () => void;
    getMaxSteps: () => any;
    draw: () => void;
    render(): import("react/jsx-runtime").JSX.Element;
}
export {};
