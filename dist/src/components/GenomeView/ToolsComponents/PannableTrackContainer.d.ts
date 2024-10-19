import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
/**
 * Track container where dragging across scrolls the view region.
 *
 * @author Silas Hsu
 */
export class PannableTrackContainer extends React.Component<any, any, any> {
    static MIN_DRAG_DISTANCE_FOR_REFRESH: number;
    static propTypes: {
        trackElements: PropTypes.Validator<(object | null | undefined)[]>;
        visData: PropTypes.Validator<object>;
        /**
         * Callback for when a new region is selected.  Signature:
         *     (newStart: number, newEnd: number): void
         *         `newStart`: the nav context coordinate of the start of the new view interval
         *         `newEnd`: the nav context coordinate of the end of the new view interval
         */
        onNewRegion: PropTypes.Requireable<(...args: any[]) => any>;
    };
    static defaultProps: {
        onNewRegion: () => undefined;
    };
    constructor(props: any);
    offsetOnDragStart: number;
    /**
     * Saves the current track draw offsets.
     *
     * @param {React.SyntheticEvent} event - the event the triggered this
     */
    viewDragStart(event: React.SyntheticEvent): void;
    /**
     * Called when the user drags the track around.  Sets track draw offsets.
     *
     * @param {any} [unused] - unused
     * @param {any} [unused2] - unused
     * @param {React.SyntheticEvent} [unusedEvent] - unused
     * @param {object} coordinateDiff - an object with keys `dx` and `dy`, how far the mouse has moved since drag start
     */
    viewDrag(unused?: any, unused2?: any, unusedEvent?: React.SyntheticEvent<Element, Event> | undefined, coordinateDiff: object): void;
    /**
     * Called when the user finishes dragging the track, signaling a new track display region.
     *
     * @param {number} newStart - start of the new display region in nav context coordinates
     * @param {number} newEnd - end of the new display region in nav context coordinates
     * @param {React.SyntheticEvent} [unusedEvent] - unused
     * @param {object} coordinateDiff - an object with keys `dx` and `dy`, how far the mouse has moved since drag start
     */
    viewDragEnd(newStart: number, newEnd: number, unusedEvent?: React.SyntheticEvent<Element, Event> | undefined, coordinateDiff: object): void;
    /**
     * Resets the draw offset for the tracks when getting a new region.
     */
    UNSAFE_componentWillReceiveProps(newProps: any): void;
    /**
     * @inheritdoc
     */
    render(): import("react/jsx-runtime").JSX.Element;
}
