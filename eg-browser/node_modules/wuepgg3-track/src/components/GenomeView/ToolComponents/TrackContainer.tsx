import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";
// import ReactModal from "react-modal";
// import Hotkeys from "react-hot-keys";
import { withTrackData } from "./TrackDataManager";
import { withTrackView } from "./TrackViewManager";
import TrackHandle from "./TrackHandle";
import { PannableTrackContainer } from "./PannableTrackContainer";
import ReorderableTrackContainer from "./ReorderableTrackContainer";
import { ZoomableTrackContainer } from "./ZoomableTrackContainer";
import MetadataHeader from "./MetadataHeader";
import { Tools, ToolButtons } from "./Tools";
import ZoomButtons from "./ZoomButtons";
import OutsideClickDetector from "../commonComponents/OutsideClickDetector";

import TrackModel from "../../../../models/TrackModel";

import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";
import UndoRedo from "./UndoRedo";
import History from "./History";

import { HighlightMenu } from "./HighlightMenu";
import { VerticalDivider } from "./VerticalDivider";
import { CircletView } from "./CircletView";
import { ChordView } from "./ChordView";
import ButtonGroup from "./ButtonGroup";
import TrackRegionController from "../../genomeNavigator/TrackRegionController";
import ReorderMany from "./ReorderMany";
import { niceBpCount } from "../../../../models/util";

import { getTrackConfig } from "../../../../trackConfigs/config-menu-models.tsx/getTrackConfig";

import "./TrackContainer.css";

// import { DEFAULT_OPTIONS as DYNAMIC_OPTIONS } from "components/trackVis/commonComponents/numerical/DynamicplotTrack";

const DEFAULT_CURSOR = "crosshair";

/**
 * Container for holding all the tracks, and an avenue for manipulating state common to all tracks.
 *
 * @author Silas Hsu
 */

interface TrackContainerProps {
  tracks: any; // Tracks to render
  viewRegion: DisplayedRegionModel; // Region to visualize
  primaryView?: any; // Optional primary view object
  trackData: object; // Track data
  metadataTerms: string[]; // Metadata terms
  onToggleHighlight: any;
  embeddingMode: any;
  highlights: any;
  onSetHighlights: any;
  /**
   * Callback for when a new region is selected.
   * @param newStart - the nav context coordinate of the start of the new view interval
   * @param newEnd - the nav context coordinate of the end of the new view interval
   */
  onNewRegion?: any; // Optional callback for new region selection
  /**
   * Callback requesting a change in the track models.
   * @param newModels - the new track models
   */
  onTracksChanged?: any; // Optional callback for track model changes
  /**
   * Callback requesting a change in the metadata terms.
   * @param newTerms - the new metadata terms
   */
  onMetadataTermsChanged?: any; // Optional callback for metadata term changes
  suggestedMetaSets?: Set<any>; // Optional suggested metadata sets
  onNewHighlight?: any; // Optional callback for new highlight
  basesPerPixel: number;
}

interface TrackContainerState {
  selectedTool: any; // Selected tool
  xOffset: number; // X offset
  showModal: boolean; // Show modal
  showChordModal: boolean; // Show chord modal
  showReorderManyModal: boolean; // Show reorder many modal
  trackForCircletView: TrackModel | null; // Track model for circlet view
  trackForChordView: TrackModel | null; // Track model for chord view
  circletColor: string; // Color for circlet
  panningAnimation: string; // Panning animation type
  zoomAnimation: number; // Zoom animation value
  groupScale?: any; // Optional group scale
  showHighlightMenuModal: boolean; // Show highlight menu modal
}
class TrackContainer extends React.Component<
  TrackContainerProps,
  TrackContainerState
> {
  static propTypes = {
    tracks: PropTypes.arrayOf(PropTypes.instanceOf(TrackModel)).isRequired, // Tracks to render
    viewRegion: PropTypes.instanceOf(DisplayedRegionModel).isRequired,
    primaryView: PropTypes.object,
    trackData: PropTypes.object.isRequired,
    metadataTerms: PropTypes.arrayOf(PropTypes.string).isRequired, // Metadata terms
    /**
     * Callback for when a new region is selected.  Signature:
     *     (newStart: number, newEnd: number): void
     *         `newStart`: the nav context coordinate of the start of the new view interval
     *         `newEnd`: the nav context coordinate of the end of the new view interval
     */
    onNewRegion: PropTypes.func,
    /**
     * Callback requesting a change in the track models.  Signature: (newModels: TrackModel[]): void
     */
    onTracksChanged: PropTypes.func,
    /**
     * Callback requesting a change in the metadata terms.  Signature: (newTerms: string[]): void
     */
    onMetadataTermsChanged: PropTypes.func,
    suggestedMetaSets: PropTypes.instanceOf(Set),
    onNewHighlight: PropTypes.func,
  };

  static defaultProps = {
    tracks: [],
    onNewRegion: () => undefined,
    onTracksChanged: () => undefined,
  };
  leftBeam: React.RefObject<unknown>;
  rightBeam: React.RefObject<unknown>;
  groupManager: any;

  constructor(props) {
    super(props);
    this.state = {
      selectedTool: Tools.DRAG,
      xOffset: 0,
      showModal: false,
      showChordModal: false,
      showReorderManyModal: false,
      trackForCircletView: null, // the trackmodel for circlet view
      trackForChordView: null,
      circletColor: "#ff5722",
      panningAnimation: "none",
      zoomAnimation: 0,
      groupScale: undefined,
      showHighlightMenuModal: false,
    };
    this.leftBeam = React.createRef();
    this.rightBeam = React.createRef();

    this.toggleTool = this.toggleTool.bind(this);

    this.changeXOffset = this.changeXOffset.bind(this);
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.renderModal = this.renderModal.bind(this);
    this.setCircletColor = this.setCircletColor.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    // this.panLeftOrRight = this.panLeftOrRight.bind(this);
    // this.zoomOut = this.zoomOut.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.tracks !== prevProps.tracks ||
      prevProps.primaryView !== this.props.primaryView
    ) {
      this.getGroupScale();
    }
  }

  getBeamRefs = () => {
    return [this.leftBeam.current, this.rightBeam.current];
  };

  //   panLeftOrRight(left = true) {
  //     const { primaryView, onNewRegion } = this.props;
  //     let newRegion, panning;
  //     if (left) {
  //       panning = "left";
  //       newRegion = primaryView.viewWindowRegion!.clone().panLeft();
  //     } else {
  //       panning = "right";
  //       newRegion = primaryView.viewWindowRegion!.clone().panRight();
  //     }
  //     this.setState({ panningAnimation: panning }, () => {
  //       window.setTimeout(() => {
  //         this.setState({ panningAnimation: "none" });
  //         // this.pan(-width); // Changes DRM
  //         onNewRegion(...newRegion.getContextCoordinates());
  //       }, 1000);
  //     });
  //     // onNewRegion(...newRegion.getContextCoordinates());
  //   }

  //   zoomOut(factor) {
  //     const { primaryView, onNewRegion } = this.props;
  //     const newRegion = primaryView.viewWindowRegion.clone().zoom(factor);
  //     this.setState({ zoomAnimation: factor }, () => {
  //       window.setTimeout(() => {
  //         this.setState({ zoomAnimation: 0 });
  //         onNewRegion(...newRegion.getContextCoordinates());
  //       }, 1000);
  //     });
  //     // onNewRegion(...newRegion.getContextCoordinates());
  //   }

  onKeyDown(keyName, e, handle) {
    switch (keyName) {
      case "alt+h":
      case "alt+d":
        this.toggleTool(Tools.DRAG);
        break;
      case "alt+s":
      case "alt+r":
        this.toggleTool(Tools.REORDER);
        break;
      case "alt+m":
        this.toggleTool(Tools.ZOOM_IN);
        break;
      case "alt+n":
        this.toggleTool(Tools.HIGHLIGHT);
        break;
      //   case "alt+z":
      //     this.panLeftOrRight(true);
      //     break;
      //   case "alt+x":
      //     this.panLeftOrRight(false);
      //     break;
      //   case "alt+i":
      //     this.zoomOut(0.5);
      //     break;
      //   case "alt+o":
      //     this.zoomOut(2);
      //     break;
      case "alt+g":
        this.toggleReorderManyModal();
        break;
      case "alt+u":
        this.toggleHighlightMenuModal();
        break;
      default:
        break;
    }
  }
  /**
   * Toggles the selection of a tool, or switches tool.
   *
   * @param {Tool} tool - tool to toggle or to switch to
   */
  toggleTool(tool) {
    if (this.state.selectedTool === tool) {
      this.setState({ selectedTool: null });
    } else {
      this.setState({ selectedTool: tool });
    }
  }

  changeXOffset(xOffset) {
    this.setState({ xOffset });
  }

  handleOpenModal(track) {
    this.setState({ showModal: true, trackForCircletView: track });
  }

  handleCloseModal() {
    this.setState({ showModal: false, trackForCircletView: null });
  }

  handleOpenChordModal = (track) => {
    this.setState({ showChordModal: true, trackForChordView: track });
  };

  handleCloseChordModal = () => {
    this.setState({ showChordModal: false });
  };

  setCircletColor(color) {
    this.setState({ circletColor: color });
  }

  openReorderManyModal = () => {
    this.setState({ showReorderManyModal: true });
  };

  closeReorderManyModal = () => {
    this.setState({ showReorderManyModal: false });
  };

  toggleReorderManyModal = () => {
    this.setState((prevState) => {
      return { showReorderManyModal: !prevState.showReorderManyModal };
    });
  };

  openHighlightMenuModal = () => {
    this.setState({ showHighlightMenuModal: true });
  };

  closeHighlightMenuModal = () => {
    this.setState({ showHighlightMenuModal: false });
  };

  toggleHighlightMenuModal = () => {
    this.setState((prevState) => {
      return { showHighlightMenuModal: !prevState.showHighlightMenuModal };
    });
  };

  /**
   *
   * @param {boolean[]} newSelections
   */
  changeTrackSelection(newSelections) {
    if (!newSelections) {
      return;
    }
    const tracks = this.props.tracks;
    if (tracks.length !== newSelections.length) {
      console.error(
        "Cannot apply track selection array with different length than existing tracks."
      );
      console.error(newSelections);
    }

    let wasTrackChanged = false;
    const nextTracks = tracks.map((track, i) => {
      if (track.isSelected !== newSelections[i]) {
        const clone = track.clone();
        clone.isSelected = newSelections[i];
        wasTrackChanged = true;
        return clone;
      } else {
        return track;
      }
    });

    if (wasTrackChanged) {
      this.props.onTracksChanged!(nextTracks);
    }
  }

  applyMatPlot = (tracks) => {
    // console.log(tracks);
    // const tracksLeft = this.props.tracks.filter(tk => !tk.isSelected);
    const newTrack = new TrackModel({
      type: "matplot",
      name: "matplot wrap",
      tracks,
    });
    // const newTracks = [...tracksLeft, newTrack];
    const newTracks = [...this.props.tracks, newTrack];
    this.props.onTracksChanged!(newTracks);
  };

  /**
   * happens when user selects dynamic plot
   */
  applyDynamicPlot = (tracks) => {
    // const colors = [];
    // tracks.forEach(tk => {
    //     if (tk.options && tk.options.color) {
    //         colors.push(tk.options.color);
    //     }
    // });
    const labels = tracks.map((t) => t.label);
    const colors: Array<any> = [];
    let useDynamicColors = false;
    tracks.forEach((t) => {
      if (t.options.color) {
        colors.push(t.options.color);
      }
    });
    if (colors.length === tracks.length) {
      useDynamicColors = true;
    }
    const newTrack = new TrackModel({
      type: "dynamic",
      name: "dynamic plot",
      tracks,
      options: {
        steps: tracks.length,
        //...DYNAMIC_OPTIONS,
        // colors
        dynamicLabels: labels,
        dynamicColors: colors,
        useDynamicColors,
      },
    });
    const newTracks = [...this.props.tracks, newTrack];
    this.props.onTracksChanged!(newTracks);
  };

  /**
   * happens when user selects dynamic hic plot
   */
  applyDynamicHic = (tracks) => {
    const colors: Array<any> = [];
    let useDynamicColors = false;
    tracks.forEach((t) => {
      if (t.options.color) {
        colors.push(t.options.color);
      }
    });
    if (colors.length === tracks.length) {
      useDynamicColors = true;
    }
    const newTrack = new TrackModel({
      type: "dynamichic",
      name: "dynamic hic",
      tracks,
      options: {
        dynamicColors: colors,
        useDynamicColors,
      },
    });
    const newTracks = [...this.props.tracks, newTrack];
    this.props.onTracksChanged!(newTracks);
  };

  /**
   * happens when user selects dynamic hic plot
   */
  applyDynamicLongrange = (tracks) => {
    const colors: Array<any> = [];
    let useDynamicColors = false;
    tracks.forEach((t) => {
      if (t.options.color) {
        colors.push(t.options.color);
      }
    });
    if (colors.length === tracks.length) {
      useDynamicColors = true;
    }
    const newTrack = new TrackModel({
      type: "dynamiclongrange",
      name: "dynamic longrange",
      tracks,
      options: {
        dynamicColors: colors,
        useDynamicColors,
      },
    });
    const newTracks = [...this.props.tracks, newTrack];
    this.props.onTracksChanged!(newTracks);
  };

  /**
   * happens when user selects dynamic bed
   */
  applyDynamicBed = (tracks) => {
    const colors: Array<any> = [];
    let useDynamicColors = false;
    tracks.forEach((t) => {
      if (t.options.color) {
        colors.push(t.options.color);
      }
    });
    if (colors.length === tracks.length) {
      useDynamicColors = true;
    }
    const newTrack = new TrackModel({
      type: "dynamicbed",
      name: "dynamic bed",
      tracks,
      options: {
        dynamicColors: colors,
        useDynamicColors,
      },
    });
    const newTracks = [...this.props.tracks, newTrack];
    this.props.onTracksChanged!(newTracks);
  };

  /**
   * starts highlight
   * @param {MouseEvent} evt
   */
  // initializeHighlight(evt) {
  //     console.log(evt)
  // }

  // End callback methods
  ////////////////////
  // Render methods //
  ////////////////////
  /**
   * @return {JSX.Element}
   */
  renderControls() {
    const {
      metadataTerms,
      onMetadataTermsChanged,
      suggestedMetaSets,
      viewRegion,
      onNewRegion,
      onToggleHighlight,
      onNewHighlight,
      highlights,
      primaryView,
      onSetHighlights,
    } = this.props;
    // console.log(this.props, viewRegion);
    // position: "-webkit-sticky", position: "sticky", top: 0, zIndex: 1, background: "white"
    const panLeftButton = (
      <button
        className="btn btn-outline-secondary"
        title="Pan left
(Alt+Z)"
        style={{ fontFamily: "monospace" }}
        // onClick={() => this.panLeftOrRight(true)}
      >
        ◀
      </button>
    );
    const panRightButton = (
      <button
        className="btn btn-outline-secondary"
        title="Pan right
(Alt+X)"
        style={{ fontFamily: "monospace" }}
        // onClick={() => this.panLeftOrRight(false)}
      >
        ▶
      </button>
    );
    return (
      <div className="tool-container">
        <div className="tool-panel">
          <ToolButtons
            allTools={Tools}
            selectedTool={this.state.selectedTool}
            onToolClicked={this.toggleTool}
          />
          {this.props.embeddingMode && (
            <TrackRegionController
              selectedRegion={viewRegion}
              onRegionSelected={onNewRegion}
              onToggleHighlight={onToggleHighlight}
              onNewHighlight={onNewHighlight}
            />
          )}
          <div
            className="tool-element"
            style={{ display: "flex", alignItems: "center" }}
          >
            <ReorderMany
              onOpenReorderManyModal={this.openReorderManyModal}
              onCloseReorderManyModal={this.closeReorderManyModal}
              showReorderManyModal={this.state.showReorderManyModal}
            />
          </div>
          <ButtonGroup buttons={panLeftButton} />
          {/* <ZoomButtons viewRegion={viewRegion} onNewRegion={onNewRegion} /> */}
          {/* <ZoomButtons
            viewRegion={viewRegion}
            // onNewRegion={onNewRegion}
            // zoomOut={this.zoomOut}
          /> */}
          <ButtonGroup buttons={panRightButton} />
          <div
            className="tool-element"
            style={{ display: "flex", alignItems: "center" }}
          >
            {/* <UndoRedo /> */}
          </div>
          <div
            className="tool-element"
            style={{ display: "flex", alignItems: "center" }}
          >
            <History />
          </div>
          <div
            className="tool-element"
            style={{ display: "flex", alignItems: "center" }}
          >
            {/* <HighlightMenu
              onSetHighlights={onSetHighlights}
              onOpenHighlightMenuModal={this.openHighlightMenuModal}
              onCloseHighlightMenuModal={this.closeHighlightMenuModal}
              showHighlightMenuModal={this.state.showHighlightMenuModal}
              highlights={highlights}
              viewRegion={viewRegion}
              onNewRegion={onNewRegion}
            /> */}
          </div>
          <div
            className="tool-element"
            style={{ minWidth: "200px", alignSelf: "center" }}
          >
            <PixelInfo
              basesPerPixel={this.props.basesPerPixel}
              viewRegion={viewRegion}
              primaryView={primaryView}
            />
          </div>
          <MetadataHeader
            terms={metadataTerms}
            onNewTerms={onMetadataTermsChanged}
            suggestedMetaSets={suggestedMetaSets}
          />
        </div>
      </div>
    );
  }

  getGroupScale = () => {
    const { tracks, trackData, primaryView } = this.props;
    const groupScale = this.groupManager.getGroupScale(
      tracks.filter(
        (tk) => tk.options.hasOwnProperty("group") && tk.options.group
      ),
      trackData,
      primaryView ? primaryView.visWidth : 0,
      primaryView ? primaryView.viewWindow : 0
    );
    this.setState({ groupScale });
  };

  /**
   * @return {JSX.Element[]} track elements to render
   */
  makeTrackElements() {
    const {
      tracks,
      trackData,
      primaryView,
      metadataTerms,
      viewRegion,

      basesPerPixel,
    } = this.props;

    const trackElements = tracks.map((trackModel, index) => {
      const id = trackModel.getId();
      const data = trackData[id];
      const layoutProps = {};
      return "";
    });
    return trackElements;
  }

  /**
   * Renders a subcontainer that provides specialized track manipulation, depending on the selected tool.
   *
   * @return {JSX.Element} - subcontainer that renders tracks
   */
  renderSubContainer() {
    const {
      tracks,
      primaryView,
      onNewRegion,
      onTracksChanged,
      onNewHighlight,
    } = this.props;
    const trackElements = this.makeTrackElements();
    switch (this.state.selectedTool) {
      case Tools.REORDER:
        return (
          <ReorderableTrackContainer
            trackElements={trackElements}
            trackModels={tracks}
            onTracksChanged={onTracksChanged}
          />
        );
      case Tools.ZOOM_IN:
        return (
          <ZoomableTrackContainer
            trackElements={trackElements}
            visData={primaryView}
            onNewRegion={onNewRegion}
          />
        );
      case Tools.DRAG:
        return (
          <PannableTrackContainer
            trackElements={trackElements}
            visData={primaryView}
            onNewRegion={onNewRegion}
            xOffset={this.state.xOffset}
            onXOffsetChanged={this.changeXOffset}
          />
        );
      case Tools.HIGHLIGHT:
        return (
          <ZoomableTrackContainer
            trackElements={trackElements}
            visData={primaryView}
            onNewRegion={onNewHighlight}
          />
        );
      default:
        return trackElements;
    }
  }

  renderModal() {
    const { primaryView, trackData } = this.props;
    const { trackForCircletView, circletColor } = this.state;
    return "";
  }

  renderChordModal() {
    const { trackData } = this.props;
    const { trackForChordView } = this.state;
    return "";
  }

  /**
   * @inheritdoc
   */
  render() {
    const {
      tracks,
      onTracksChanged,
      primaryView,
      viewRegion,
      basesPerPixel,
      trackData,
      highlights,
    } = this.props;
    if (!primaryView) {
      return <div>Loading...</div>;
    }
    const { selectedTool } = this.state;
    const fileInfos = {}; // key, track id, value: fileInfo obj
    tracks.forEach((tk) => {
      const tkId = tk.getId();
      if (!_.isEmpty(trackData[tkId].fileInfo)) {
        fileInfos[tkId] = trackData[tkId].fileInfo;
      }
    });
    const trackDivStyle = {
      border: "1px solid black",
      paddingBottom: "3px",
      cursor: selectedTool ? selectedTool.cursor : DEFAULT_CURSOR,
    };
    return "";
  }
}

export default TrackContainer;

function PixelInfo(props) {
  const { basesPerPixel, viewRegion, primaryView } = props;
  const viewBp = niceBpCount(viewRegion.getWidth());
  const windowWidth = primaryView.viewWindow.getLength();
  const span = niceBpCount(basesPerPixel, true);
  return (
    <span className="font-italic">
      Viewing a {viewBp} region in {Math.round(windowWidth)}px, 1 pixel spans{" "}
      {span}
    </span>
  );
}
