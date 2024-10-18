/**
 * Simple container for chromosome info.
 *
 * @author Silas Hsu
 */
export default class Chromosome {
    private _name;
    private _length;
    /**
     * Makes a new instance with specified name and length in bases.
     *
     * @param {string} name - name of the chromosome
     * @param {number} length - length of the chromosome in bases
     */
    constructor(name: string, length: number);
    /**
     * @return {string} this chromosome's name
     */
    getName(): string;
    /**
     * @return {number} this chromosome's length in bases
     */
    getLength(): number;
}
