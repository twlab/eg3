import { ITrackContainerRepresentableProps, ITrackContainerState } from "../types";
export declare function TrackContainer(props: ITrackContainerState): import("react/jsx-runtime").JSX.Element;
/**
 * TrackContainerRepresentable serves as the boundary between the new serializable TrackModel and the previous
 * class-based TrackModel.
 *
 * New serializable state is actively converted to the class-based state and passed to the TrackContainer.
 */
export declare function TrackContainerRepresentable({ tracks, highlights, genomeConfig: _genomeConfig, legendWidth, showGenomeNav, onNewRegion, onNewHighlight, onTrackSelected, onTrackDeleted, onTrackAdded, onNewRegionSelect, viewRegion, userViewRegion, tool, Toolbar, selectedRegionSet, genomeName, setScreenshotData, isScreenShotOpen, overrideViewRegion, currentState, }: ITrackContainerRepresentableProps): import("react/jsx-runtime").JSX.Element;
