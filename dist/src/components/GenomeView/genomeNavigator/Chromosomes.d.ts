import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
import { default as DisplayedRegionModel } from '../../../models/DisplayedRegionModel';
import { FeaturePlacer } from '../../../models/getXSpan/FeaturePlacer';
import { default as TwoBitSource } from '../../../getRemoteData/TwoBitSource';
/**
 * Draws rectangles that represent features in a navigation context, and labels for the features.  Called "Chromosomes"
 * because at first, NavigationContexts only held chromosomes as features.
 *
 * @author Silas Hsu and Daofeng Li
 */
interface ChromosomesProps {
    genomeConfig: any;
    viewRegion: DisplayedRegionModel;
    width: number;
    labelOffset?: number;
    x?: number;
    y?: number;
    drawHeights?: number[];
    zeroLine?: number;
    height?: number;
    hideCytoband?: boolean;
    minXwidthPerBase?: number;
    hideChromName?: any;
}
interface ChromosomesState {
    sequenceData: Array<any>;
}
declare class Chromosomes extends React.PureComponent<ChromosomesProps, ChromosomesState> {
    static propTypes: {
        genomeConfig: PropTypes.Validator<NonNullable<PropTypes.InferProps<{
            cytobands: PropTypes.Requireable<object>;
        }>>>;
        viewRegion: PropTypes.Validator<DisplayedRegionModel>;
        width: PropTypes.Validator<number>;
        labelOffset: PropTypes.Requireable<number>;
        x: PropTypes.Requireable<number>;
        y: PropTypes.Requireable<number>;
        drawHeights: PropTypes.Requireable<any[]>;
        zeroLine: PropTypes.Requireable<number>;
        height: PropTypes.Requireable<number>;
        hideCytoband: PropTypes.Requireable<boolean>;
        minXwidthPerBase: PropTypes.Requireable<number>;
    };
    static defaultProps: {
        minXwidthPerBase: number;
        hideCytoband: boolean;
    };
    twoBitSource: TwoBitSource | null;
    fastaSeq: any;
    featurePlacer: FeaturePlacer;
    constructor(props: any);
    componentDidMount(): void;
    /**
     * Fetches sequence data for the view region stored in `props`, if zoomed in enough.
     *
     * @param {Object} props - props as specified by React
     */
    fetchSequence: (props: any) => Promise<void>;
    /**
     * If zoomed in enough, fetches sequence.
     *
     * @param {Object} nextProps - props as specified by React
     */
    componentDidUpdate(prevProps: any, prevState: any): void;
    /**
     *
     * @param {*} cytoband
     * @param {ChromosomeInterval} cytobandLocus
     * @param {LinearDrawingModel} drawModel
     */
    renderOneCytoband(cytoband: any, cytobandLocus: any, drawModel: any): any[];
    /**
     * Gets the cytoband elements to draw within a genomic interval.
     *
     * @param {ChromosomeInterval} locus - genetic locus for which to draw cytobands
     * @param {LinearDrawingModel} drawModel - draw model to use
     * @return {JSX.Element[]} cytoband elements
     */
    renderCytobandsInLocus(locus: any, drawModel: any): any[];
    /**
     * Tries to find a label size that fits within `maxWidth`.  Returns `undefined` if it cannot find one.
     *
     * @param {string} label - the label contents
     * @param {number} maxWidth - max requested width of the label
     * @return {number | undefined} an appropriate width for the label, or undefined if there is none
     */
    getSizeForFeatureLabel(label: any, maxWidth: any): number | undefined;
    renderSequences(): import("react/jsx-runtime").JSX.Element[];
    /**
     * Redraws all the feature boxes
     *
     * @override
     */
    render(): import("react/jsx-runtime").JSX.Element;
}
export default Chromosomes;
