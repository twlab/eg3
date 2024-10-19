import { default as React } from 'react';
import { default as DisplayedRegionModel } from '../../../models/DisplayedRegionModel';
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
    render(): import("react/jsx-runtime").JSX.Element;
}
export default Ruler;
