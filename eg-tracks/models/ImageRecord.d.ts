import Feature from "./Feature";
import BedRecord from "./BedRecord";
/**
 * A data container for a idr images.
 *
 * @author Daofeng Li
 */
declare class ImageRecord extends Feature {
    images: any[];
    constructor(bedRecord: BedRecord);
}
export default ImageRecord;
