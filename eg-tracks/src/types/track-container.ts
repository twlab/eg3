
export interface ITrackContainerState {
    // tracks..
    // highlights
    // genome...

    // onNewRegion
    // onNewHiglight
}


// MARK: - Track Model

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

export interface ITrackModel {
    name: string;
    type?: string;
    filetype?: string;
    options: TrackOptions;
    url: string;
    indexUrl?: string;
    metadata: ITrackModelMetadata;
    fileObj?: Blob;
    queryEndpoint?: QueryEndpoint;
    querygenome?: string;
}
