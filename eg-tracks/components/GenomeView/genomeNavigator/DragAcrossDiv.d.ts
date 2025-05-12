import React from "react";
import { MouseButton } from "../../../models/util";
export interface CoordinateDiff {
    dx: number;
    dy: number;
}
interface DragAcrossDivProps {
    mouseButton: MouseButton | undefined;
    style?: object;
    children: React.ReactNode;
    /**
     * Callback for when dragging starts.
     *
     * @param {React.MouseEvent} event - the event that triggered this callback
     */
    onDragStart?(event: React.MouseEvent): void;
    /**
     * Callback for each little bit of movement during a drag.
     *
     * @param {React.MouseEvent} event - the event that triggered this callback
     * @param {CoordinateDiff} coordinateDiff - how far the mouse has moved since the drag started
     */
    onDrag?(event: React.MouseEvent, coordinateDiff: CoordinateDiff): void;
    /**
     * Callback for when the user lets go of the mouse and stops dragging.
     *
     * @param {React.MouseEvent} event - the event that triggered this callback
     * @param {CoordinateDiff} coordinateDiff - how far the mouse has moved since the drag started
     */
    onDragEnd?(event: React.MouseEvent, coordinateDiff: CoordinateDiff): void;
}
declare function doNothing(): void;
/**
 * A <div> that listens for drag-across events, where a user drags the cursor inside the div.  The drag callbacks will
 * fire even for short clicks; be sure to take this possibility into account when working with this component!
 *
 * @author Silas Hsu
 */
export declare class DragAcrossDiv extends React.Component<DragAcrossDivProps> {
    static defaultProps: {
        onDragStart: typeof doNothing;
        onDrag: typeof doNothing;
        onDragEnd: typeof doNothing;
    };
    private originEvent;
    constructor(props: DragAcrossDivProps);
    /**
     * Callback for mousedown events on the <div>.
     *
     * @param {React.MouseEvent} event - mouse event that triggered this callback
     */
    mousedown(event: React.MouseEvent): void;
    /**
     * Callback for mousemove events on the <div>.
     *
     * @param {React.MouseEvent} event - mouse event that triggered this callback
     */
    mousemove(event: React.MouseEvent): void;
    /**
     * Callback for mouseup events on the <div>.
     *
     * @param {React.MouseEvent} event - mouse event that triggered this callback
     */
    mouseup(event: React.MouseEvent): void;
    /**
     * @return {JSX.Element} a div that listens to drag events
     * @override
     */
    render(): import("react/jsx-runtime").JSX.Element;
}
export {};
