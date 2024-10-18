import { default as Genome } from '../../Genome';
import { default as TrackModel } from '../../TrackModel';
export default nCoV2019;
declare namespace nCoV2019 {
    export { genome };
    export { navContext };
    export let cytobands: {};
    export { defaultRegion };
    export { defaultTracks };
    export let twoBitURL: string;
    export { annotationTracks };
    export { publicHubData };
    export { publicHubList };
}
declare const genome: Genome;
declare const navContext: import('../../NavigationContext').default;
declare const defaultRegion: import('../../OpenInterval').default;
declare const defaultTracks: TrackModel[];
declare const annotationTracks: {
    Ruler: {
        type: string;
        label: string;
        name: string;
    }[];
    Genes: {
        name: string;
        label: string;
        filetype: string;
        genome: string;
    }[];
    Proteins: {
        type: string;
        name: string;
        url: string;
        options: {
            height: number;
            alwaysDrawLabel: boolean;
            maxRows: number;
            hiddenPixels: number;
            category: {
                "receptor-binding domain (RBD)": {
                    name: string;
                    color: string;
                };
                "receptor-binding motif (RBM)": {
                    name: string;
                    color: string;
                };
                "S1,S2 cleavage site": {
                    name: string;
                    color: string;
                };
                "heptad repeat 1 (HR1)": {
                    name: string;
                    color: string;
                };
                "heptad repeat 2 (HR2)": {
                    name: string;
                    color: string;
                };
            };
        };
    }[];
    Assembly: {
        type: string;
        name: string;
        url: string;
    }[];
    Diversity: ({
        type: string;
        name: string;
        url: string;
        options: {
            aggregateMethod: string;
        };
    } | {
        type: string;
        name: string;
        url: string;
        options?: undefined;
    })[];
    "Genome Comparison": {
        name: string;
        label: string;
        querygenome: string;
        filetype: string;
        url: string;
    }[];
};
declare const publicHubData: {
    "UniProt protein annotation": import("react/jsx-runtime").JSX.Element;
    "NCBI database": string;
    "Nextstrain database": string;
    "GISAID database": string;
    Diagnostics: string;
    "Epitope predictions": string;
    "Recombination events": string;
    "Viral RNA modifications": string;
    "Viral RNA expression": string;
    "Sequence variation": string;
    "Putative SARS-CoV-2 Immune Epitopes": string;
    "Image data from IDR": string;
    "SARS-CoV-2 CRISPR Screen Database": string;
    "Variants of Interest and Variants of Concern": string;
};
declare const publicHubList: ({
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description: {
        "data source": string;
        "hub built by"?: undefined;
        "hub info"?: undefined;
        "data source:"?: undefined;
        "SHERLOCK diagnostic test track"?: undefined;
        "DETECTR diagnostic test track"?: undefined;
        values?: undefined;
        TRS?: undefined;
        "TRS-L-dependent recombination track"?: undefined;
        "TRS-L-independent recombination track"?: undefined;
        "white space"?: undefined;
        "colored bars"?: undefined;
        "long stretches of rosy brown"?: undefined;
        format?: undefined;
        "track type"?: undefined;
    };
} | {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description: {
        "hub built by": string;
        "data source": string;
        "hub info": string;
        "data source:"?: undefined;
        "SHERLOCK diagnostic test track"?: undefined;
        "DETECTR diagnostic test track"?: undefined;
        values?: undefined;
        TRS?: undefined;
        "TRS-L-dependent recombination track"?: undefined;
        "TRS-L-independent recombination track"?: undefined;
        "white space"?: undefined;
        "colored bars"?: undefined;
        "long stretches of rosy brown"?: undefined;
        format?: undefined;
        "track type"?: undefined;
    };
} | {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description: {
        "hub built by": string;
        "hub info": string;
        "data source"?: undefined;
        "data source:"?: undefined;
        "SHERLOCK diagnostic test track"?: undefined;
        "DETECTR diagnostic test track"?: undefined;
        values?: undefined;
        TRS?: undefined;
        "TRS-L-dependent recombination track"?: undefined;
        "TRS-L-independent recombination track"?: undefined;
        "white space"?: undefined;
        "colored bars"?: undefined;
        "long stretches of rosy brown"?: undefined;
        format?: undefined;
        "track type"?: undefined;
    };
} | {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description: {
        "hub built by": string;
        "hub info": string;
        "data source:": string;
        "data source"?: undefined;
        "SHERLOCK diagnostic test track"?: undefined;
        "DETECTR diagnostic test track"?: undefined;
        values?: undefined;
        TRS?: undefined;
        "TRS-L-dependent recombination track"?: undefined;
        "TRS-L-independent recombination track"?: undefined;
        "white space"?: undefined;
        "colored bars"?: undefined;
        "long stretches of rosy brown"?: undefined;
        format?: undefined;
        "track type"?: undefined;
    };
} | {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description: {
        "hub built by": string;
        "hub info": string;
        "SHERLOCK diagnostic test track": string;
        "DETECTR diagnostic test track": string;
        "data source"?: undefined;
        "data source:"?: undefined;
        values?: undefined;
        TRS?: undefined;
        "TRS-L-dependent recombination track"?: undefined;
        "TRS-L-independent recombination track"?: undefined;
        "white space"?: undefined;
        "colored bars"?: undefined;
        "long stretches of rosy brown"?: undefined;
        format?: undefined;
        "track type"?: undefined;
    };
} | {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description: {
        "hub built by": string;
        "hub info": string;
        values: string;
        "data source": string;
        "data source:"?: undefined;
        "SHERLOCK diagnostic test track"?: undefined;
        "DETECTR diagnostic test track"?: undefined;
        TRS?: undefined;
        "TRS-L-dependent recombination track"?: undefined;
        "TRS-L-independent recombination track"?: undefined;
        "white space"?: undefined;
        "colored bars"?: undefined;
        "long stretches of rosy brown"?: undefined;
        format?: undefined;
        "track type"?: undefined;
    };
} | {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description: {
        "hub built by": string;
        "hub info": string;
        TRS: string;
        "TRS-L-dependent recombination track": string;
        "TRS-L-independent recombination track": string;
        "data source"?: undefined;
        "data source:"?: undefined;
        "SHERLOCK diagnostic test track"?: undefined;
        "DETECTR diagnostic test track"?: undefined;
        values?: undefined;
        "white space"?: undefined;
        "colored bars"?: undefined;
        "long stretches of rosy brown"?: undefined;
        format?: undefined;
        "track type"?: undefined;
    };
} | {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description: {
        "hub built by": string;
        "hub info": string;
        "data source": string;
        "white space": string;
        "colored bars": string;
        "long stretches of rosy brown": string;
        "data source:"?: undefined;
        "SHERLOCK diagnostic test track"?: undefined;
        "DETECTR diagnostic test track"?: undefined;
        values?: undefined;
        TRS?: undefined;
        "TRS-L-dependent recombination track"?: undefined;
        "TRS-L-independent recombination track"?: undefined;
        format?: undefined;
        "track type"?: undefined;
    };
} | {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description: {
        "hub built by": string;
        "hub info": string;
        format: string;
        "data source": string;
        "data source:"?: undefined;
        "SHERLOCK diagnostic test track"?: undefined;
        "DETECTR diagnostic test track"?: undefined;
        values?: undefined;
        TRS?: undefined;
        "TRS-L-dependent recombination track"?: undefined;
        "TRS-L-independent recombination track"?: undefined;
        "white space"?: undefined;
        "colored bars"?: undefined;
        "long stretches of rosy brown"?: undefined;
        "track type"?: undefined;
    };
} | {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description: {
        "hub built by": string;
        "track type": string;
        "data source": string;
        "hub info"?: undefined;
        "data source:"?: undefined;
        "SHERLOCK diagnostic test track"?: undefined;
        "DETECTR diagnostic test track"?: undefined;
        values?: undefined;
        TRS?: undefined;
        "TRS-L-dependent recombination track"?: undefined;
        "TRS-L-independent recombination track"?: undefined;
        "white space"?: undefined;
        "colored bars"?: undefined;
        "long stretches of rosy brown"?: undefined;
        format?: undefined;
    };
} | {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description: {
        "track type": string;
        "data source": import("react/jsx-runtime").JSX.Element;
        "hub built by"?: undefined;
        "hub info"?: undefined;
        "data source:"?: undefined;
        "SHERLOCK diagnostic test track"?: undefined;
        "DETECTR diagnostic test track"?: undefined;
        values?: undefined;
        TRS?: undefined;
        "TRS-L-dependent recombination track"?: undefined;
        "TRS-L-independent recombination track"?: undefined;
        "white space"?: undefined;
        "colored bars"?: undefined;
        "long stretches of rosy brown"?: undefined;
        format?: undefined;
    };
} | {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description: {
        "data source": import("react/jsx-runtime").JSX.Element;
        "hub built by"?: undefined;
        "hub info"?: undefined;
        "data source:"?: undefined;
        "SHERLOCK diagnostic test track"?: undefined;
        "DETECTR diagnostic test track"?: undefined;
        values?: undefined;
        TRS?: undefined;
        "TRS-L-dependent recombination track"?: undefined;
        "TRS-L-independent recombination track"?: undefined;
        "white space"?: undefined;
        "colored bars"?: undefined;
        "long stretches of rosy brown"?: undefined;
        format?: undefined;
        "track type"?: undefined;
    };
})[];
