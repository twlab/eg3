export interface TrackOptions {
    label?: string;
    [k: string]: any;
}
interface ITrackModelMetadata {
    "Track Type"?: string;
    genome?: string;
    [k: string]: any;
}
interface QueryEndpoint {
    name?: string;
    endpoint?: string;
}
/**
 * Serialized track model, or the plain object argument to TrackModel's constructor.
 *
 * @example
 * {
 *     type: 'bigWig',
 *     name: 'My bigwig track',
 *     options: {
 *         color: 'blue'
 *     },
 *     url: 'https://example.com',
 *     metadata: {
 *         genome: 'hg19'
 *     }
 * }
 */
interface ITrackModel {
    name: string;
    type?: string;
    filetype?: string;
    options: TrackOptions;
    url?: string;
    indexUrl?: string;
    metadata?: ITrackModelMetadata;
    fileObj?: Blob;
    queryEndpoint?: QueryEndpoint;
    querygenome?: string;
    id: string | number;
    label?: string;
    files?: any;
    details?: any;
    isSelected?: any;
}
/**
 * An object storing track metadata and state.
 *
 * @implements {Serializable}
 * @author Silas Hsu
 */
export declare class TrackModel {
    /**
     * Makes a new TrackModel based off the input plain object.  Bascially does a shallow copy of the object and sets
     * sets reasonable defaults for certain properties.
     *
     * @param {ITrackModel} plainObject - data that will form the basis of the new instance
     */
    name: string;
    type: string;
    label: string;
    filetype?: string;
    options: TrackOptions;
    url: string;
    indexUrl?: string;
    metadata: ITrackModelMetadata;
    id: number | string;
    isSelected: boolean;
    showOnHubLoad?: boolean;
    fileObj?: any;
    files?: any;
    tracks?: TrackModel[];
    querygenome?: string;
    isText?: boolean;
    textConfig?: any;
    apiConfig?: any;
    queryEndpoint?: QueryEndpoint;
    legendWidth?: any;
    details?: any;
    constructor(plainObject: ITrackModel);
    serialize(): any;
    static deserialize(plainObject: any): TrackModel;
    /**
     * Gets this object's id.  Ids are used to keep track of track identity even through different instances of
     * TrackModel; two models with the same id are considered the same track, perhaps with different options configured.
     *
     * @return {number} this object's id
     */
    getId(): number | string;
    /**
     * Gets the label to display for this track; this method returns a reasonable default even in the absence of data.
     *
     * @return {string} the display label of the track
     */
    getDisplayLabel(): string;
    /**
     * TODO: Document this.
     *
     * @param {string} term
     * @returns {string}
     * @memberof TrackModel
     * always return a string
     */
    getMetadata(term: string): string | undefined;
    /**
     *
     * @param term
     * always return an array
     */
    getMetadataAsArray(term: string): string[] | undefined;
    /**
     *
     * @param term
     * @return return the meta value defined by user, maybe a string, an array or an object
     * purpose of this is to allow users to customize metadata display, like defining colors
     * in this way, for example
     * Assay: {name: "ATAC-seq", color: "red"}
     */
    getMetadataAsis(term: string): any | undefined;
    /**
     * **Shallowly** clones this.
     *
     * @return {TrackModel} a shallow copy of this
     */
    clone(): TrackModel;
    /**
     * Shallowly clones `this` and `this.options`, and then modifies the clone's options.  Returns the clone.  This
     * method will not mutate this instance.
     *
     * @param {string} name - the name of the option to set
     * @param {any} optionValue - the value of the option
     * @return {TrackModel} shallow clone of this, with the option set
     */
    cloneAndSetOption(name: string, optionValue: any): TrackModel;
    /**
     * Shallowly clones this and also selects a particular property to be cloned one level deeper.
     *
     * @param {string} prop - property name to also clone
     * @return {TrackModel} shallow clone of this
     */
    _cloneThisAndProp(prop: string): TrackModel;
}
export default TrackModel;
export declare function mapUrl(url: string): string | undefined;
