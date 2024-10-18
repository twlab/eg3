import { default as React } from 'react';
import { PlacedFeatureGroup, PaddingFunc } from '../../../../models/FeatureArranger';
import { default as Feature } from '../../../../models/Feature';
import { SortItemsOptions } from '../../../../models/SortItemsOptions';
/**
 * Callback for getting an annotation to render
 *
 * @param {PlacedFeatureGroup} placedGroup - the feature to draw, and drawing info
 * @param {number} y - suggested y coordinate of the top of the annotation
 * @param {boolean} isLastRow - whether the annotation is assigned to the last configured row
 * @param {number} index - iteration index; could be useful as a key
 * @return {JSX.Element} the annotation element to render
 */
type AnnotationCallback = (placedGroup: PlacedFeatureGroup, y: number, isLastRow: boolean, index: number) => JSX.Element;
interface FullDisplayModeProps {
    data: Feature[];
    rowHeight: number;
    options: {
        maxRows: number;
        hiddenPixels?: number;
        hideMinimalItems?: boolean;
        sortItems?: SortItemsOptions;
    };
    visRegion?: any;
    width?: number;
    legend?: JSX.Element;
    featurePadding?: number | PaddingFunc;
    getAnnotationElement?: AnnotationCallback;
    message?: JSX.Element;
}
/**
 * An arranger and renderer of features, or annotations.
 *
 * @author Silas Hsu
 */
declare class FullDisplayMode extends React.Component<FullDisplayModeProps> {
    static defaultProps: {
        featurePadding: number;
    };
    private featureArranger;
    constructor(props: FullDisplayModeProps);
    getHeight(numRows: number): number;
    render(): import("react/jsx-runtime").JSX.Element;
}
export default FullDisplayMode;
