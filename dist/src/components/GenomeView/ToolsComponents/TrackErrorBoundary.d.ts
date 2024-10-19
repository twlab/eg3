import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
export default TrackErrorBoundary;
/**
 * A component that catches errors, and still behaves somewhat like a Track in TrackContainers.
 *
 * @author Silas Hsu
 */
declare class TrackErrorBoundary extends React.Component<any, any, any> {
    /**
     * @see Track.propTypes
     */
    static propTypes: {
        trackModel: PropTypes.Requireable<any>;
        index: PropTypes.Requireable<number>;
        onContextMenu: PropTypes.Requireable<(...args: any[]) => any>;
        onClick: PropTypes.Requireable<(...args: any[]) => any>;
    };
    static defaultProps: {
        trackModel: {};
        onContextMenu: (event: any, index: any) => undefined;
        onClick: (event: any, index: any) => undefined;
    };
    constructor(props: any);
    renderErrorMessage(error: any): import("react/jsx-runtime").JSX.Element;
    render(): import("react/jsx-runtime").JSX.Element;
}
