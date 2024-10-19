import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
export default FiberAnnotation;
/**
 * Visualizer for fiber.
 *
 */
declare class FiberAnnotation extends React.Component<any, any, any> {
    static propTypes: {
        placement: PropTypes.Validator<object>;
        y: PropTypes.Requireable<number>;
        color: PropTypes.Requireable<string>;
        color2: PropTypes.Requireable<string>;
        rowHeight: PropTypes.Requireable<number>;
        isMinimal: PropTypes.Requireable<boolean>;
        displayMode: PropTypes.Requireable<string>;
        /**
         * Callback for click events.  Signature: (event: MouseEvent, feature: Feature): void
         *     `event`: the triggering click event
         *     `feature`: the same Feature as the one passed via props
         */
        onShowTooltip: PropTypes.Requireable<(...args: any[]) => any>;
        onHideTooltip: PropTypes.Requireable<(...args: any[]) => any>;
    };
    constructor(props: any);
    constructor(props: any, context: any);
    /**
     * Renders the tooltip for an element in a fiber.
     */
    renderTooltip: (event: any, feature: any, bs: any) => void;
    /**
     * Renders the bar tooltip in a fiber.
     */
    renderBarTooltip: (event: any, feature: any, onCount: any, onPct: any, total: any) => void;
    render(): import("react/jsx-runtime").JSX.Element | null;
}
