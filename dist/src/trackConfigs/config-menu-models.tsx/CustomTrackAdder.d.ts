import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
export const TRACK_TYPES: {
    Numerical: string[];
    Variant: string[];
    "Dynamic sequence": string[];
    Annotation: string[];
    Peak: string[];
    Categorical: string[];
    "Genome graph": string[];
    Methylation: string[];
    Interaction: string[];
    Stats: string[];
    Repeats: string[];
    Alignment: string[];
    "3D Structure": string[];
    Dynamic: string[];
    Image: string[];
};
export const NUMERRICAL_TRACK_TYPES: string[];
export namespace TYPES_DESC {
    let bigWig: string;
    let bedGraph: string;
    let methylC: string;
    let categorical: string;
    let bed: string;
    let bedcolor: string;
    let bigBed: string;
    let repeatmasker: string;
    let refBed: string;
    let hic: string;
    let longrange: string;
    let longrangecolor: string;
    let bigInteract: string;
    let cool: string;
    let bam: string;
    let pairwise: string;
    let snv: string;
    let snv2: string;
    let qBED: string;
    let g3d: string;
    let dbedgraph: string;
    let omero4dn: string;
    let omeroidr: string;
    let dynseq: string;
    let rgbpeak: string;
    let vcf: string;
    let boxplot: string;
    let rmskv2: string;
    let bigchain: string;
    let genomealign: string;
    let brgfa: string;
    let graph: string;
    let modbed: string;
}
export default CustomTrackAdder;
/**
 * UI for adding custom tracks.
 *
 * @author Silas Hsu and Daofeng Li
 */
declare class CustomTrackAdder extends React.Component<any, any, any> {
    static propTypes: {
        addedTracks: PropTypes.Requireable<any[]>;
        customTracksPool: PropTypes.Requireable<any[]>;
        onTracksAdded: PropTypes.Requireable<(...args: any[]) => any>;
        onAddTracksToPool: PropTypes.Requireable<(...args: any[]) => any>;
        addTermToMetaSets: PropTypes.Requireable<(...args: any[]) => any>;
        genomeConfig: PropTypes.Validator<object>;
        addedTrackSets: PropTypes.Requireable<Set<unknown>>;
    };
    constructor(props: any);
    trackUI: any;
    state: {
        type: string;
        url: string;
        name: string;
        urlError: string;
        metadata: {
            genome: any;
        };
        trackAdded: boolean;
        selectedTabIndex: number;
        querygenome: string;
        options: null;
        indexUrl: undefined;
    };
    handleSubmitClick(e: any): void;
    renderTypeOptions(): import("react/jsx-runtime").JSX.Element[];
    renderGenomeOptions(allGenomes: any): any;
    renderButtons(): import("react/jsx-runtime").JSX.Element;
    getOptions: (value: any) => void;
    renderCustomTrackAdder(): import("react/jsx-runtime").JSX.Element;
    renderCustomHubAdder(): import("react/jsx-runtime").JSX.Element;
    render(): import("react/jsx-runtime").JSX.Element;
}
