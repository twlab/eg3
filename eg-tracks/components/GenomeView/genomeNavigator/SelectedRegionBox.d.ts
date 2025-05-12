import React from "react";
import DisplayedRegionModel from "../../../models/DisplayedRegionModel";
/**
 * A box that shows the currently selected region, or a GOTO button if the currently selected region is out of view.
 *
 * @author Silas Hsu
 */
interface SelectedRegionBoxProps {
    viewRegion: DisplayedRegionModel;
    width: number;
    selectedRegion: DisplayedRegionModel;
    /**
     * Called when the user presses the "GOTO" button to quickly scroll the view to the selected track region.
     * @param newStart - the nav context coordinate of the start of the interval to scroll to
     * @param newEnd - the nav context coordinate of the end of the interval to scroll to
     */
    onNewViewRequested: (newStart: number, newEnd: number) => void;
    x?: any;
    y?: any;
}
declare class SelectedRegionBox extends React.Component<SelectedRegionBoxProps> {
    static propTypes: {
        viewRegion: any;
        width: any;
        selectedRegion: any;
        /**
         * Called when the user presses the "GOTO" button to quicky scroll the view to the selected track region.
         *     (newStart: number, newEnd: number): void
         *         `newStart`: the nav context coordinate of the start of the interval to scroll to
         *         `newEnd`: the nav context coordinate of the end of the interval to scroll to
         */
        onNewViewRequested: any;
    };
    constructor(props: any);
    /**
     * Handle a press of the GOTO button.  Calculates a new view and propagates it to this component's parent.
     *
     * @param {React.SyntheticEvent} event - event fired from the GOTO button
     */
    gotoPressed(event: any): void;
    /**
     * Moves the box and GOTO button to where it needs to go and shows/hides the GOTO button as needed.
     *
     * @override
     */
    render(): import("react/jsx-runtime").JSX.Element;
}
export default SelectedRegionBox;
