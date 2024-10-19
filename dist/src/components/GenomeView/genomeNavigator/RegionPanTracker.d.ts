import { default as React } from 'react';
import { CoordinateDiff } from './DragAcrossDiv';
import { default as DisplayedRegionModel } from '../../../models/DisplayedRegionModel';
import { MouseButton } from '../../../models/util';
import { default as OpenInterval } from '../../../models/OpenInterval';
interface RegionPanTrackProps {
    mouseButton: MouseButton;
    panRegion: DisplayedRegionModel;
    children: React.ReactNode;
    className: any;
    /**
     * Affects calculations of how many bases the user has panned.  If not provided, the component will compute a
     * reasonable default from the container's width.
     */
    basesPerPixel?: number;
    /**
     * Callback for when dragging starts.
     *
     * @param {React.MouseEvent} event - the event that triggered this callback
     */
    onViewDragStart?(event: React.MouseEvent): void;
    /**
     * Callback for each little bit of movement during a pan.
     *
     * @param {number} newStart - nav context coordinate of the start of the panned view region
     * @param {number} newEnd - nav context coordinate of the end of the panned view region
     * @param {React.MouseEvent} event - the event that triggered this callback
     * @param {CoordinateDiff} coordinateDiff - how far the mouse has moved since the drag started
     */
    onViewDrag?(newStart: number, newEnd: number, event: React.MouseEvent, coordinateDiff: CoordinateDiff): void;
    /**
     * Callback for when the user lets go of the mouse and stops panning.  Same signature as onViewDrag.
     */
    onViewDragEnd?(newStart: number, newEnd: number, event: React.MouseEvent, coordinateDiff: CoordinateDiff): void;
}
/**
 * Same as {@link DragAcrossDiv}, but also calculates changes in view region as the result of the drag.
 *
 * @author Silas Hsu
 */
export declare class RegionPanTracker extends React.Component<RegionPanTrackProps> {
    private dragOriginRegion;
    constructor(props: RegionPanTrackProps);
    /**
     * Initializes view dragging.  Signals that dragging has started to the callback passed in via props.
     *
     * @param {React.MouseEvent} event - mouse event that signals a drag start
     */
    dragStart(event: React.MouseEvent): void;
    /**
     * If view dragging has been initialized, calcuates a new view region depending on where the mouse has been dragged.
     * Then gives this information to the callback passed in via props.
     *
     * @param {React.MouseEvent} event - a mousemove event fired from within this pane
     * @param {CoordinateDiff} coordinateDiff - how far the mouse has moved since drag start
     */
    drag(event: React.MouseEvent, coordinateDiff: CoordinateDiff): void;
    /**
     * Uninitializes view dragging.  Also calcuates a new view region depending on where the mouse has been dragged.
     * Then gives this information to the callback passed in via props.
     *
     * @param {MouseEvent} event - mouse event that signals a drag end
     * @param {CoordinateDiff} coordinateDiff - how far the mouse has moved since drag start
     */
    dragEnd(event: React.MouseEvent, coordinateDiff: CoordinateDiff): void;
    /**
     * Calculates the displayed region panned by some number of pixels.  Does not modify any of the inputs.
     *
     * @param {DisplayedRegionModel} region - drawing model used to convert from pixels to bases
     * @param {React.MouseEvent} event - the mouse event from dragging
     * @param {number} xDiff - number of pixels to pan the region
     * @return {object} - region resulting from panning the input region
     */
    _getRegionOffsetByX(region: DisplayedRegionModel, event: React.MouseEvent, xDiff: number): OpenInterval;
    render(): JSX.Element;
}
export {};
