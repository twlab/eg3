import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
export default ReorderableTrackContainer;
/**
 * Track container where the tracks can be dragged and dropped.
 *
 * @author Silas Hsu
 */
declare class ReorderableTrackContainer extends React.PureComponent<any, any, any> {
    static propTypes: {
        trackElements: PropTypes.Validator<PropTypes.ReactNodeLike[]>;
        /**
         * Track models that correspond to the track elements.  Must be the same length!
         */
        trackModels: PropTypes.Validator<any[]>;
        /**
         * Callback for when tracks are reordered.  Signature: (newModels: TrackModel[]): void
         */
        onTracksChanged: PropTypes.Requireable<(...args: any[]) => any>;
    };
    static defaultProps: {
        onTracksChanged: () => undefined;
    };
    constructor(props: any);
    adjacencies: any[];
    /**
     * Takes an interval of `this.props.trackElements` and puts them in one GenericDraggable so they drag together.
     *
     * @param {OpenInterval} interval - indices, expressed as a range, of track elements to make draggable
     * @return {JSX.Element} - draggable track element(s)
     */
    bundleTracksInInterval(interval: OpenInterval, index: any): JSX.Element;
    /**
     * Callback for when a user has just finished a drag-and-drop.  Computes a new track order and requests the change.
     *
     * @param {DropResult} dropResult - object from react-beautiful-dnd
     */
    tracksDropped(dropResult: DropResult): void;
    /**
     * Gets an array of intervals describing how adjacent tracks should group into draggables.  Non-selected tracks will
     * never drag with adjacent tracks.  Any adjacent selected tracks will group together.  This method guarantees that
     * returned intervals are sorted and will never overlap.
     *
     * @return {OpenInterval[]} - intervals describing how adjacent tracks should group into draggables
     */
    getTrackGroupings(): OpenInterval[];
    /**
     * @inheritdoc
     */
    render(): import("react/jsx-runtime").JSX.Element;
}
