import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
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
    static propTypes: {
        viewRegion: PropTypes.Validator<DisplayedRegionModel>;
        width: PropTypes.Validator<number>;
        x: PropTypes.Requireable<number>;
        y: PropTypes.Requireable<number>;
    };
    render(): import("react/jsx-runtime").JSX.Element;
}
export default Ruler;
