import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
import { default as Feature } from '../../../models/Feature';
import { default as OpenInterval } from '../../../models/OpenInterval';
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
        feature: PropTypes.Validator<Feature>;
        xSpan: PropTypes.Validator<OpenInterval>;
        y: PropTypes.Requireable<number>;
        color: PropTypes.Requireable<string>;
        isMinimal: PropTypes.Requireable<boolean>;
        /**
         * Callback for click events.  Signature: (event: MouseEvent, feature: Feature): void
         *     `event`: the triggering click event
         *     `feature`: the same Feature as the one passed via props
         */
        onClick: PropTypes.Requireable<(...args: any[]) => any>;
    };
    static defaultProps: {
        color: string;
        onClick: (event: any, feature: any) => undefined;
    };
    render(): import("react/jsx-runtime").JSX.Element | null;
}
export default CategoricalAnnotation;
