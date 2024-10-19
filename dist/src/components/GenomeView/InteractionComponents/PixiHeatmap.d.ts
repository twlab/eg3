import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
export class PixiHeatmap extends React.PureComponent<any, any, any> {
    static propTypes: {
        placedInteractionsArray: PropTypes.Validator<any[]>;
        viewWindow: PropTypes.Validator<object>;
        opacityScale: PropTypes.Validator<(...args: any[]) => any>;
        height: PropTypes.Validator<number>;
        width: PropTypes.Validator<number>;
        backgroundColor: PropTypes.Requireable<string>;
        color: PropTypes.Requireable<string>;
        color2: PropTypes.Requireable<string>;
        speed: PropTypes.Requireable<any[]>;
        steps: PropTypes.Requireable<number>;
        currentStep: PropTypes.Requireable<number>;
    };
    static defaultProps: {
        currentStep: number;
        speed: number[];
        color: string;
        backgroundColor: string;
        dynamicColors: never[];
        useDynamicColors: boolean;
    };
    constructor(props: any);
    myRef: React.RefObject<any>;
    container: any;
    subcontainer: any;
    app: any;
    state: {
        currentStep: number;
        isPlaying: boolean;
    };
    count: number;
    steps: number;
    subs: any[];
    hmData: any[];
    componentDidMount(): void;
    componentWillUnmount(): void;
    componentDidUpdate(prevProps: any, prevState: any): void;
    onPointerDown: (event: any) => void;
    initializeSubs: () => void;
    resetSubs: () => void;
    onWindowResize: () => void;
    tick: () => void;
    getMaxSteps: () => any;
    drawHeatmap: () => void;
    /**
     * Renders the default tooltip that is displayed on hover.
     *
     * @param {number} relativeX - x coordinate of hover relative to the visualizer
     * @param {number} relativeY - y coordinate of hover relative to the visualizer
     * @return {JSX.Element} tooltip to render
     */
    renderTooltip: (relativeX: number, relativeY: number) => JSX.Element;
    findPolygon: (x: any, y: any) => any[];
    render(): import("react/jsx-runtime").JSX.Element;
}
