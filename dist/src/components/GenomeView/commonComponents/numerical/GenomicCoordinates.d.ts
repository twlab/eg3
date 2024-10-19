import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
import { default as DisplayedRegionModel } from '../../../../models/DisplayedRegionModel';
/**
 * Calculates genomic coordinates at a page coordinate and displays them.
 *
 * @author Silas Hsu
 */
interface GenomicCoordinatesProps {
    viewRegion: any;
    width: any;
    x: any;
}
declare class GenomicCoordinates extends React.Component<GenomicCoordinatesProps> {
    static propTypes: {
        viewRegion: PropTypes.Validator<DisplayedRegionModel>;
        width: PropTypes.Validator<number>;
        x: PropTypes.Validator<number>;
    };
    /**
     * @inheritdoc
     */
    render(): any;
}
export default GenomicCoordinates;
