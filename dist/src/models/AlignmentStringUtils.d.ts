export declare const GAP_CHAR = "-";
/**
 * Counts the number of bases in a sequence, ignoring deletions and gaps.
 *
 * @param {string} sequence - sequence to examine
 * @return {number} the number of bases in the sequence
 */
export declare function countBases(sequence: string): number;
export interface SequenceSegment {
    /**
     * Whether the segment represents a gap
     */
    isGap: boolean;
    /**
     * The character index in the original sequence string
     */
    index: number;
    /**
     * The length of the segment in characters
     */
    length: number;
}
export declare function segmentSequence(sequence: string, minGapLength: number, onlyGaps?: boolean): SequenceSegment[];
/**
 * Makes a mapping from string index to base numbers.
 *
 * @param {string} sequence - the sequence to examine
 * @param {number} baseAtStart - the base number corresponding to the start of the string to iterate
 * @param {boolean} [isReverse] - if true, makes base numbers count down rather than up
 * @return {number[]}
 */
export declare function makeBaseNumberLookup(sequence: string, baseAtStart: number, isReverse?: boolean): number[];
/**
 * An iterator that steps along a string, skipping '-' characters.  Instances start at index -1.
 *
 * @author Silas Hsu
 */
export declare class AlignmentIterator {
    sequence: string;
    private _currentIndex;
    /**
     * Constructs a new instance that iterates through the specified string.
     *
     * @param {string} sequence - the string through which to iterate
     */
    constructor(sequence: string);
    /**
     * Resets this instance's index pointer to the beginning of the string
     */
    reset(): void;
    /**
     * @return {number} the current index pointer
     */
    getCurrentIndex(): number;
    /**
     * Advances the index pointer and returns it.  If there is no valid base, the return value will be past the end of
     * the string.
     *
     * @return {number} the index of the next valid base
     */
    getIndexOfNextBase(): number;
    /**
     * @return {boolean} whether there is a next valid base
     */
    hasNextBase(): boolean;
    /**
     * Equivalent to calling getIndexOfNextBase() n times.  Returns the last result.  A negative n will have no effect.
     *
     * @param {number} n - the number of bases to advance
     * @return {number} the index pointer after advancement
     */
    advanceN(n: number): number;
}
