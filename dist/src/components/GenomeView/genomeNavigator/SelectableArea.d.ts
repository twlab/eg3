import { default as React } from 'react';
import { default as OpenInterval } from '../../../models/OpenInterval';
import { MouseButton } from '../../../models/util';
interface SelectableAreaProps {
    mouseButton?: MouseButton;
    y?: number | string;
    height?: number | string;
    dragLimits?: OpenInterval;
    children?: React.ReactNode;
    /**
     * Callback for getting an element to display inside the box, if desired.
     *
     * @param {OpenInterval} xSpan - the current x span of the selection box
     * @return {JSX.Element} element to display inside the selection box
     */
    getInnerElement?(xSpan: OpenInterval): any;
    /**
     * Callback for whether the selectable area is a valid area.  If not, the component should display feedback.
     *
     * @param {OpenInterval} xSpan - the current x span of the selection box
     * @return {boolean} whether the current area is selectable
     */
    getIsAreaValid?(xSpan: OpenInterval): boolean;
    /**
     * Callback when the user lets go of the mouse, selecting the area.  Does not fire if getIsAreaSelectable returns
     * false.
     *
     * @param {OpenInterval} xSpan - the x span of the selected area
     */
    onAreaSelected?(xSpan: OpenInterval): void;
}
interface SelectableAreaState {
    isDragging: boolean;
    dragStartX: number;
    currentDragX: number;
}
/**
 * Creates and manages the boxes that the user can drag across the screen to select a new region.
 *
 * @author Silas Hsu
 */
export declare class SelectableArea extends React.PureComponent<SelectableAreaProps, SelectableAreaState> {
    static defaultProps: SelectableAreaProps;
    /**
     * Initializes state, binds event listeners, and attaches a keyboard listener to the window, which will listen for
     * requests to cancel a selection.
     *
     * @param {Object} props - props as specified by React
     */
    constructor(props: SelectableAreaProps);
    /**
     * Detaches the keyboard listener that was attached in the constructor.
     *
     * @override
     */
    componentWillUnmount(): void;
    /**
     * @param {number} x - x relative to the left side of the container
     * @return {boolean} whether selection is allowed at the x coordinate
     */
    isInDragLimits(x: number): boolean;
    /**
     * @return {OpenInterval} the currently selected span of x coordinates
     */
    getSelectedSpan(): OpenInterval;
    /**
     * Initializes the selection box.
     *
     * @param {React.MouseEvent} event - the event signaling a drag start
     */
    dragStart(event: React.MouseEvent): void;
    /**
     * Called when the mouse changes position while dragging the selection box.
     *
     * @param {React.MouseEvent} event - the mouse event
     */
    drag(event: React.MouseEvent): void;
    /**
     * Called when the user lets go of the mouse after dragging the selection box.
     */
    dragEnd(): void;
    /**
     * Check if the keyboard event is one that cancels an in-progess selection.
     *
     * @param {KeyboardEvent} event
     */
    handleKeyUp(event: KeyboardEvent): void;
    /**
     * @inheritdoc
     */
    render(): JSX.Element;
}
export {};
