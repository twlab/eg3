import React from "react";
import DisplayedRegionModel from "../../../models/DisplayedRegionModel";
/**
 * Draws a ruler that displays feature coordinates.
 *
 * @author Silas Hsu
 */
interface RulerProps {
    viewRegion: DisplayedRegionModel;
    width: number;
    x?: number;
    y?: number;
}
declare class Ruler extends React.PureComponent<RulerProps> {
    static propTypes: {
        viewRegion: any;
        width: any;
        x: any;
        y: any;
    };
    render(): import("react/jsx-runtime").JSX.Element;
}
export default Ruler;
