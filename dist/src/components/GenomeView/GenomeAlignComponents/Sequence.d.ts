import { default as React } from 'react';
export declare const BASE_COLORS: {
    G: string;
    C: string;
    T: string;
    A: string;
    N: string;
};
interface SequenceProps {
    sequence: string;
    xSpan: {
        [key: string]: any;
    };
    y?: number;
    isDrawBackground?: boolean;
    height?: number;
    letterSize?: number;
    isReverseComplement?: boolean;
    minXwidthPerBase?: number;
    drawHeights?: any;
    zeroLine?: number;
}
/**
 * A set of SVG <text> elements representing a sequence, optionally backgrounded by <rect>s.
 *
 * @author Silas Hsu
 */
export declare class Sequence extends React.PureComponent<SequenceProps> {
    static MIN_X_WIDTH_PER_BASE: number;
    static defaultProps: {
        isDrawBackground: boolean;
        height: number;
        letterSize: number;
        y: number;
        minXwidthPerBase: number;
    };
    render(): import("react/jsx-runtime").JSX.Element | null;
}
export {};
