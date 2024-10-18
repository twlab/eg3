import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
export default Bedcolor;
/**
 * Visualizer for Feature objects.
 *
 * @author Silas Hsu
 */
declare class Bedcolor extends React.Component<any, any, any> {
    static propTypes: {
        feature: PropTypes.Validator<any>;
        xSpan: PropTypes.Validator<any>;
        y: PropTypes.Requireable<number>;
        height: PropTypes.Requireable<number>;
        isMinimal: PropTypes.Requireable<boolean>;
        /**
         * Callback for click events.  Signature: (event: MouseEvent, feature: Feature): void
         *     `event`: the triggering click event
         *     `feature`: the same Feature as the one passed via props
         */
        onClick: PropTypes.Requireable<(...args: any[]) => any>;
    };
    static defaultProps: {
        isInvertArrowDirection: boolean;
        onClick: (event: any, feature: any) => undefined;
    };
    constructor(props: any);
    constructor(props: any, context: any);
    render(): import("react/jsx-runtime").JSX.Element | null;
}
