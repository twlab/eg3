import DisplayedRegionModel from "../DisplayedRegionModel";
import { ViewExpansion } from "../RegionExpander";

export interface TrackProps {
  id: string;
  trackIdx: number;
  viewWindowConfigData: any;
  bpRegionSize: number;
  basePerPixel: number;
  side: string;
  highlightElements: any;
  windowWidth: number;
  userViewRegion?: DisplayedRegionModel;
  handleDelete: (trackIndex: number) => void;
  globalTrackState: any;
  trackManagerState: any;
  dragX?: number;
  genomeConfig: any;
  genomeName?: string;
  visData?: ViewExpansion;
  trackManagerId: string;
  trackComponents: any;
  isScreenShotOpen: boolean;
  newDrawData: any;
  selfFetchTrigger?: any;
  selfFetchApi?: any;
  trackModel?: any;
  dataIdx: number;
  getConfigMenu: any;
  onCloseConfigMenu: () => void;
  useFineModeNav: boolean;
  trackManagerRef: any;
  setShow3dGene: any;
  isThereG3dTrack: boolean;
  signalTrackLoadComplete?: any;
  legendRef: any;
  staticRef: any;
  posRef: any;
  updateGlobalTrackConfig: any;
  sentScreenshotData: any;
  applyTrackConfigChange: any;
  containerRef: any;
  viewWindowConfigChange?: any;
  metaSets: any;
  onColorBoxClick: any;
  messageData: any;
  Toolbar: { [key: string]: any };
  handleRetryFetchTrack: (trackIdx: number) => void;
  /** Told when this track has committed its drawing of a band. */
  onBandDrawn?: (dataIdx: number) => void;
  initialLoad: any;
  selectedRegionSet: any;
  /** The user's legend width (Settings): what the column's text, a
      screenshot's legend and the menus are sized by. Never 0. */
  legendWidth: number;
  /** How wide the legend column is on screen: legendWidth, or 0 in the
      pangenome view, which has no column (PLAN-remastered-2.md section 3). */
  columnWidth?: number;
  /** True in the pangenome view: each track's name is a glass label over
      its top-left corner (TrackHeader.tsx) instead of a box in the column. */
  legendHeader?: boolean;
  /** Changes one of this track's options, as the config menu does. */
  onConfigChange?: (
    key: string,
    value: string | number | boolean,
    trackId: string | null,
  ) => void;
}
