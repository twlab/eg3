import React from "react";
import OpenInterval from "../../../../models/OpenInterval";
import Vcf from "./Vcf";
/**
 * Visualizer for VCF objects.
 *
 * @author Daofeng Li
 */
interface Props {
    feature: Vcf;
    xSpan: OpenInterval;
    y?: number;
    height: number;
    colorScale: (qual: number) => string;
    reverseStrandColor?: string;
    isMinimal?: boolean;
    alwaysDrawLabel?: boolean;
    onClick: (event: React.MouseEvent, feature: Vcf) => void;
}
declare class VcfAnnotation extends React.Component<Props> {
    static propTypes: {
        feature: any;
        xSpan: any;
        y: any;
        height: any;
        colorScale: any;
        reverseStrandColor: any;
        isMinimal: any;
        /**
         * Callback for click events.  Signature: (event: MouseEvent, feature: Feature): void
         *     `event`: the triggering click event
         *     `feature`: the same Feature as the one passed via props
         */
        onClick: any;
    };
    static defaultProps: {
        onClick: (event: any, feature: any) => undefined;
    };
    render(): import("react/jsx-runtime").JSX.Element;
}
export default VcfAnnotation;
