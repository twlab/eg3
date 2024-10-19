import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
import { default as DisplayedRegionModel } from '../../../models/DisplayedRegionModel';
interface GenomeViewerProps {
    containerWidth: number;
    viewRegion: DisplayedRegionModel;
    selectedRegion: DisplayedRegionModel;
    onNewViewRequested: any;
    onRegionSelected: any;
    onZoom: any;
    genomeConfig: any;
}
/**
 * The main pane of the genome navigator.  Manages child components and listens for events that modify the view region.
 *
 * @author Silas Hsu
 */
declare class MainPane extends React.Component<GenomeViewerProps> {
    static propTypes: {
        containerWidth: PropTypes.Validator<number>;
        viewRegion: PropTypes.Validator<DisplayedRegionModel>;
        /**
         * The region that the tracks are displaying
         */
        selectedRegion: PropTypes.Validator<DisplayedRegionModel>;
        /**
         * Called when the user selects a new region to display.  Has the signature
         *     (newStart: number, newEnd: number): void
         *         `newStart`: the nav context coordinate of the start of the selected interval
         *         `newEnd`: the nav context coordinate of the end of the selected interval
         */
        onRegionSelected: PropTypes.Requireable<(...args: any[]) => any>;
        /**
         * Called when the user wants to view a new region.
         *     (newStart: number, newEnd: number): void
         *         `newStart`: the nav context coordinate of the start of the interval for the pane to display next
         *         `newEnd`: the nav context coordinate of the end of the interval for the pane to display next
         */
        onNewViewRequested: PropTypes.Requireable<(...args: any[]) => any>;
        /**
         * Called when the view should be zoomed.  Has the signature
         *     (amount: number, focusPoint: number)
         *         `amount`: amount to zoom
         *          `focusPoint`: focal point of the zoom, which is where the mouse was as % of the width of the SVG.
         */
        onZoom: PropTypes.Validator<(...args: any[]) => any>;
    };
    static defaultProps: {
        onRegionSelected: () => undefined;
        onNewView: () => undefined;
    };
    constructor(props: any);
    componentRef: any;
    componentDidMount(): void;
    componentWillUnmount(): void;
    /**
     * Zooms the view depending on the user's mousewheel action
     *
     * @param {React.SyntheticEvent} event - a wheel event fired from within this pane
     */
    mousewheel(event: any): void;
    /**
     * Places a <svg> and children that draw things.
     *
     * @override
     */
    render(): import("react/jsx-runtime").JSX.Element | null;
}
export default MainPane;
