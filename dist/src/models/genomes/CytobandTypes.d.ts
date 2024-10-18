/**
 * A dictionary/mapping type that maps from chromosome name to a list of all cytobands in that chromosome.
 */
interface CytobandMap {
    [chrName: string]: Cytoband[];
}
/**
 * A single cytoband record.
 */
interface Cytoband {
    chrom: string;
    chromStart: number;
    chromEnd: number;
    name: string;
    gieStain: string;
}
export default CytobandMap;
