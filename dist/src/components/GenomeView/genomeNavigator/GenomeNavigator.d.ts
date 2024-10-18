import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
import { default as DisplayedRegionModel } from '../../../models/DisplayedRegionModel';
export declare const MIN_VIEW_REGION_SIZE = 5;
/**
 * A navigator that allows users to scroll around the genome and select what region for tracks to display.
 *
 * @author Silas Hsu
 */
interface GenomeNavigatorProps {
    selectedRegion: DisplayedRegionModel;
    windowWidth: number;
    /**
     * Called when the user selects a new region to display.  Has the signature
     *     (newStart: number, newEnd: number): void
     *         `newStart`: the nav context coordinate of the start of the selected interval
     *         `newEnd`: the nav context coordinate of the end of the selected interval
     */
    onRegionSelected: any;
    genomeConfig: any;
}
interface GenomeNavigatorState {
    viewRegion?: any;
}
declare class GenomeNavigator extends React.Component<GenomeNavigatorProps, GenomeNavigatorState> {
    static propTypes: {
        /**
         * The region that the tracks are displaying.
         */
        selectedRegion: PropTypes.Validator<DisplayedRegionModel>;
        /**
         * Called when the user selects a new region to display.  Has the signature
         *     (newStart: number, newEnd: number): void
         *         `newStart`: the nav context coordinate of the start of the selected interval
         *         `newEnd`: the nav context coordinate of the end of the selected interval
         */
        onRegionSelected: PropTypes.Requireable<(...args: any[]) => any>;
    };
    static defaultProps: {
        onRegionSelected: () => undefined;
    };
    /**
     * Binds functions, and also forks that view region that was passed via props.
     */
    constructor(props: any);
    /**
     * Sets the default region for MainPane to cover whole chromosomes/features that are in `selectedRegion`
     *
     * @param {DisplayedRegionModel} selectedRegion - the currently selected region
     * @return {DisplayedRegionModel} the default view region for the genome navigator
     */
    _setInitialView(selectedRegion: any): DisplayedRegionModel;
    /**
     * Resets the view region if a new one is received.
     *
     * @param {any} nextProps - new props that this component will receive
     * @override
     */
    UNSAFE_componentWillReceiveProps(nextProps: any): void;
    /**
     * Copies this.state.viewRegion, mutates it by calling `methodName` with `args`, and then calls this.setState().
     *
     * @param {string} methodName - the method to call on the model
     * @param {any[]} args - arguments to provide to the method
     */
    _setModelState(methodName: any, args: any): void;
    /**
     * Wrapper for calling zoom() on the view model.
     *
     * @param {number} amount - amount to zoom
     * @param {number} [focusPoint] - focal point of the zoom
     * @see DisplayedRegionModel#zoom
     */
    zoom(amount: any, focusPoint: any): void;
    /**
     * Wrapper for calling setRegion() on the view model
     *
     * @param {number} newStart - start nav context coordinate
     * @param {number} newEnd - end nav context coordinate
     * @see DisplayedRegionModel#setRegion
     */
    setNewView(newStart: any, newEnd: any): void;
    /**
     * Zooms the view to the right level when the zoom slider is dragged.
     *
     * @param {React.SyntheticEvent} event - the event that react fired when the zoom slider was changed
     */
    zoomSliderDragged(event: any): void;
    /**
     * @inheritdoc
     */
    render(): import("react/jsx-runtime").JSX.Element;
}
export default GenomeNavigator;
