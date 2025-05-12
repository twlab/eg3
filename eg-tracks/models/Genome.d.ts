import NavigationContext from "./NavigationContext";
import ChromosomeInterval from "./ChromosomeInterval";
import Chromosome from "./Chromosome";
/**
 * A named set of chromosomes.
 *
 * @author Silas Hsu
 */
export declare class Genome {
    private _name;
    private _chromosomes;
    private _nameToChromosome;
    /**
     * Makes a new instance, with name and list of chromosomes.  For best results, chromosomes should have unique names.
     *
     * @param {string} name - name of the genome
     * @param {Chromosome[]} chromosomes - list of chromosomes in the genome
     */
    constructor(name: string, chromosomes: Chromosome[]);
    /**
     * @return {string} this genome's name
     */
    getName(): string;
    /**
     * Gets a chromosome with the specified name.  Returns null if there is no such chromosome.
     *
     * @param {string} name - chromosome name to look up
     * @return {Chromosome} chromosome with the query name, or null if not found
     */
    getChromosome(name: string): Chromosome;
    /**
     * Intersects a genomic location with this genome.  If there is no overlap, then returns null.  Possible reasons for
     * null include unknown chromosome name or an interval past the end of a chromosome.  Can be used to check/ensure a
     * location actually lies within the genome.
     *
     * @param {ChromosomeInterval} chrInterval - genomic location to intersect with the genome
     * @return {ChromosomeInterval} intersection result, or null if there is no overlap at all
     */
    intersectInterval(chrInterval: ChromosomeInterval): ChromosomeInterval | null;
    /**
     * Makes a NavigationContext representing this genome.  It will have the same name as the genome, and the
     * features/segments will consist of whole chromosomes.
     *
     * @return {NavigationContext} NavigationContext representing this genome
     */
    makeNavContext(): NavigationContext;
}
export default Genome;
