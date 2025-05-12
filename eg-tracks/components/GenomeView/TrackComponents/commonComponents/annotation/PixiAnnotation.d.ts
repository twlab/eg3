import React from "react";
export declare const TOP_PADDING = 2;
export declare const ROW_VERTICAL_PADDING = 2;
interface PixiAnnotationProps {
    arrangeResults: Array<any>;
    viewWindow: {
        start: number;
    };
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
    trackModel?: {
        tracks: {
            label: string;
        }[];
    };
    rowHeight?: number;
    maxRows: number;
}
interface PixiAnnotationState {
    currentStep: number;
    isPlaying: boolean;
}
export declare class PixiAnnotation extends React.PureComponent<PixiAnnotationProps, PixiAnnotationState> {
    static propTypes: {
        arrangeResults: any;
        viewWindow: any;
        height: any;
        width: any;
        backgroundColor: any;
        color: any;
        color2: any;
        speed: any;
        steps: any;
        currentStep: any;
    };
    static defaultProps: Partial<PixiAnnotationProps>;
    private myRef;
    private container;
    private subcontainer;
    private app;
    private count;
    private subs;
    private steps;
    constructor(props: PixiAnnotationProps);
    componentDidMount(): Promise<void>;
    componentWillUnmount(): void;
    componentDidUpdate(prevProps: PixiAnnotationProps, prevState: PixiAnnotationState): void;
    onPointerDown: (event: PIXI.FederatedPointerEvent) => void;
    initializeSubs: () => void;
    resetSubs: () => void;
    onWindowResize: () => void;
    tick: () => void;
    getMaxSteps: () => any;
    drawAnnotations: () => void;
    render(): import("react/jsx-runtime").JSX.Element;
}
export {};
