import { Feature, Strand } from "./Feature";
import ChromosomeInterval, { IChromosomeInterval } from "./ChromosomeInterval";
/**
 * The properties of GraphNode without the methods.
 */
export interface IGraphNode {
    name: string;
    locus: IChromosomeInterval;
    strand: Strand;
    rank: number;
}
/**
 * A GraphNode, in the graph genome.
 * a feature with rank, maybe other methods and props in future so in a separate file
 * @author Daofeng Li
 */
export declare class GraphNode extends Feature {
    locus: ChromosomeInterval;
    rank: number;
    /**
     *
     * @param {string} [name] - name of the node
     * @param {ChromosomeInterval} locus - genomic location of the node
     */
    constructor(name: string, locus: ChromosomeInterval, rank?: number);
    serialize(): IGraphNode;
    static deserialize(object: IGraphNode): GraphNode;
    getRank(): number;
}
/**
 * the raw data from brgfa file record
 * @param raw
 * {len: 8677
name: "s73410"
rank: 0
sname: "chr7"
soff: 26715364}
 */
export interface IRawNode {
    len: number;
    name: string;
    rank: number;
    sname: string;
    soff: number;
}
export declare function nodeFromRawNode(raw: IRawNode): GraphNode;
