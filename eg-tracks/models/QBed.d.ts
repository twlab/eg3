import Feature from "./Feature";
import BedRecord from "./BedRecord";
/**
 * A data container for a qBED object.
 *
 * @author Daofeng Li and Arnav Moudgil
 */
declare class QBed extends Feature {
    annotation: any;
    value: number;
    relativeX: number | undefined;
    relativeY: number | undefined;
    constructor(bedRecord: BedRecord);
}
export default QBed;
