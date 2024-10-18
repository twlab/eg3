/**
 * Records returned by BedSource and its worker.  Each prop is a column in the bed file.
 *
 * @author Silas Hsu
 */
interface BedRecord {
    chr: string;
    start: number;
    end: number;
    [column: number]: string;
    n?: number;
}
export default BedRecord;
