import Feature from "./Feature";
export interface RepeatDASFeature {
    genoLeft: string;
    label: string;
    max: number;
    milliDel: string;
    milliDiv: string;
    milliIns: string;
    min: number;
    orientation: string;
    repClass: string;
    repEnd: string;
    repFamily: string;
    repLeft: string;
    repStart: string;
    score: number;
    segment: string;
    swScore: string;
    type: string;
    _chromId: number;
}
/**
 * A data container for a RepeatMasker record.
 *
 * @author Daofeng Li
 */
export declare class RepeatMaskerFeature extends Feature {
    static DEFAULT_CLASS_COLORS: {
        1: string;
        2: string;
        3: string;
        4: string;
        5: string;
        6: string;
        7: string;
        8: string;
        9: string;
        10: string;
        11: string;
        12: string;
    };
    repClass: string;
    repFamily: string;
    milliDiv: string;
    _value: number | null;
    /**
     * Constructs a new rmskRecord, given a properly-structured DASFeature
     *
     * @param {RepeatDASFeature} record - DASFeature to use
     */
    constructor(rmskRecord: RepeatDASFeature);
    get repeatValue(): number;
    /**
     * @return {number} the repeat class ID
     */
    getCategoryId(): number;
    /**
     * @return {string} human-readable description of the repeat class
     */
    getClassDetails(): string;
}
