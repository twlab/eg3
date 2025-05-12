import { Feature } from "./Feature";
import { FeatureSegment } from "./FeatureSegment";
/**
 * Shape of objects from bbi-js.
 */
interface IBamRecord {
    MD: string;
    NM: number;
    XA: number;
    cigar: string;
    flag: number;
    mq: number;
    pos: number;
    quals: string;
    readName: string;
    segment: string;
    seq: string;
}
interface CigarOperation {
    opName: string;
    count: number;
}
/**
 * Struct returned by the getAlignment() method
 */
interface AlignmentResult {
    reference: string;
    lines: string;
    read: string;
}
/**
 * A BAM record.
 *
 * @author Silas Hsu
 * @author David Ayeke
 */
export declare class BamRecord extends Feature {
    /**
     * Makes BAM records out of an array of raw objects.  Skips those objects which have BAM flags UNMAPPED and
     * SUPPLEMENTARY set.
     *
     * @param {object} rawObjects - plain objects that contain BAM info
     * @return {BamRecord[]} BAM records from the objects
     */
    static makeBamRecords(rawObjects: IBamRecord[]): any[];
    MD: string;
    cigar: CigarOperation[];
    seq: string;
    constructor(rawObject: IBamRecord);
    /**
     * Gets segments of the this instance that are aligned and skipped.  Returns an object with keys `aligned` and
     * `skipped`, which contain those segments as a list of FeatureSegment.
     *
     * @return {object}
     */
    getSegments(): {
        aligned: FeatureSegment[];
        skipped: FeatureSegment[];
    };
    /**
     * Gets a human-readable alignment of this record to the reference genome.  Returns an object with keys `reference`,
     * the reference sequence; `lines`, those bases that match; and `read`, the aligned sequence.  Sequences may have
     * gaps due to alignment; dashes represent these gaps.
     *
     * @example {
     *     reference: "AG-TGAC-CCC",
     *     lines:     "|   ||| | |",
     *     read:      "ATC-GCATCGC"
     * }
     * @return {AlignmentResult} human-readable alignment of this record to the reference genome
     * @author David Ayeke
     */
    getAlignment(): AlignmentResult;
    /**
     * Uses this instance's CIGAR to produce an alignment.  Insertions and deletions will be expressed as dashes in the
     * reference and read sequences respectively.  This method only handles *alignment*; the reference sequence may be
     * incorrect and should be corrected by the `mdPass()` method.
     *
     * @example returnValue = [
     *     "AT--CGDDCG",
     *     "ATCGCG--CG"
     * ]
     *
     * @return {[string, string]} aligned reference and read sequence
     */
    _cigarPass(): string[];
    /**
     * Using this instance's MD string, corrects the reference sequence from `cigarPass()`.
     *
     * @example mdPass("AT--CGDDCG"); // returns "AA--CGCGCG"
     * @param {string} reference - reference sequence from `cigarPass()`
     * @return {string} - reference sequence with bases corrected
     */
    _mdPass(reference: string): string;
}
export {};
