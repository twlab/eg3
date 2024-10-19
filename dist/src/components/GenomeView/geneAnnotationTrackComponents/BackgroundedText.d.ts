import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
/**
 * SVG <text> element with background color.  For performance reasons, this component guesses the text dimensions
 * rather than measuring the text's bounding box.  It is reasonably good at this estimation; nonetheless, we are dealing
 * with a guess, so the background box may not be completely accurate.
 *
 * @author Silas Hsu
 */
interface BackgroundedTextProps {
    x?: number;
    y?: number;
    dominantBaseline?: "hanging" | "middle" | "baseline";
    textAnchor?: "start" | "middle" | "end";
    children?: string;
    dy?: string;
    height?: number;
    horizontalPadding?: number;
    backgroundColor?: string;
    backgroundOpacity?: number;
    italicizeText?: any;
    fontSize?: any;
    fill?: any;
}
declare class BackgroundedText extends React.Component<BackgroundedTextProps> {
    static propTypes: {
        x: PropTypes.Requireable<number>;
        y: PropTypes.Requireable<number>;
        dominantBaseline: PropTypes.Requireable<string>;
        textAnchor: PropTypes.Requireable<string>;
        children: PropTypes.Requireable<string>;
        height: PropTypes.Requireable<number>;
        horizontalPadding: PropTypes.Requireable<number>;
        backgroundColor: PropTypes.Requireable<string>;
        backgroundOpacity: PropTypes.Requireable<number>;
    };
    static defaultProps: {
        x: number;
        y: number;
        dominantBaseline: string;
        textAnchor: string;
        children: string;
        height: number;
        horizontalPadding: number;
    };
    estimateTextWidth(): number;
    getRectX(): number;
    getRectY(): any;
    render(): import("react/jsx-runtime").JSX.Element | null;
}
export default BackgroundedText;
