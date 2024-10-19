import { default as React } from 'react';
import { default as Feature } from '../../../models/Feature';
import { default as OpenInterval } from '../../../models/OpenInterval';
export declare const DEFAULT_OPTIONS: {
    backgroundColor: string;
    hiddenPixels: number;
    alwaysDrawLabel: boolean;
};
interface BedAnnotationProps {
    feature: Feature;
    xSpan: OpenInterval;
    y?: number;
    color?: string;
    reverseStrandColor?: string;
    isMinimal?: boolean;
    isInvertArrowDirection?: boolean;
    onClick?: (event: React.MouseEvent<SVGGElement, MouseEvent>, feature: Feature) => void;
    alwaysDrawLabel?: boolean;
    hiddenPixels?: number;
    opacity?: number;
}
declare class BedAnnotation extends React.Component<BedAnnotationProps> {
    static HEIGHT: number;
    static defaultProps: {
        color: string;
        reverseStrandColor: string;
        isInvertArrowDirection: boolean;
        opacity: number;
        onClick: (event: React.MouseEvent<SVGGElement, MouseEvent>, feature: Feature) => undefined;
    };
    render(): import("react/jsx-runtime").JSX.Element | null;
}
export default BedAnnotation;
