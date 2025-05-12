import React from "react";
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
        viewRegion: any;
        width: any;
        x: any;
    };
    /**
     * @inheritdoc
     */
    render(): any;
}
export default GenomicCoordinates;
