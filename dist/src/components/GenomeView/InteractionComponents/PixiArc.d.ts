import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
export class PixiArc extends React.PureComponent<any, any, any> {
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
        lineWidth: PropTypes.Requireable<number>;
    };
    static defaultProps: {
        currentStep: number;
        speed: number[];
        color: string;
        backgroundColor: string;
        lineWidth: number;
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
    arcData: any[];
    componentDidMount(): void;
    componentWillUnmount(): void;
    componentDidUpdate(prevProps: any, prevState: any): void;
    onPointerDown: (event: any) => void;
    initializeSubs: () => void;
    resetSubs: () => void;
    onWindowResize: () => void;
    tick: () => void;
    getMaxSteps: () => any;
    drawArc: () => void;
    render(): import("react/jsx-runtime").JSX.Element;
}
