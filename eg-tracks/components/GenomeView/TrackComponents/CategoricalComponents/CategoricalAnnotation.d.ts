import React from "react";
import Feature from "../../../../models/Feature";
import OpenInterval from "../../../../models/OpenInterval";
interface CategoricalAnnotationProps {
    feature: Feature;
    xSpan: OpenInterval;
    viewWindow?: OpenInterval;
    y?: number;
    isMinimal?: boolean;
    options?: {
        color?: string;
        backgroundColor?: string;
        italicizeText?: boolean;
        hideMinimalItems?: boolean;
    };
    onClick(event: React.MouseEvent, feature: Feature): void;
    color: any;
    height: any;
    category?: any;
    alwaysDrawLabel?: any;
}
/**
 * Visualizer for Feature objects.
 *
 * @author Silas Hsu
 */
declare class CategoricalAnnotation extends React.Component<CategoricalAnnotationProps> {
    static TEXT_HEIGHT: number;
    static propTypes: {
        feature: any;
        xSpan: any;
        y: any;
        color: any;
        isMinimal: any;
        /**
         * Callback for click events.  Signature: (event: MouseEvent, feature: Feature): void
         *     `event`: the triggering click event
         *     `feature`: the same Feature as the one passed via props
         */
        onClick: any;
    };
    static defaultProps: {
        color: string;
        onClick: (event: any, feature: any) => undefined;
    };
    render(): import("react/jsx-runtime").JSX.Element | null;
}
export default CategoricalAnnotation;
