import DisplayedRegionModel from "../DisplayedRegionModel";
import { ViewExpansion } from "../RegionExpander";

export interface TrackProps {
  id: string;
  trackIdx: number;
  bpRegionSize: number;
  basePerPixel: number;
  side: string;
  windowWidth: number;
  handleDelete: (trackIndex: number) => void;
  globalTrackState: any;
  trackFetchedDataCache: any;
  dragX?: number;
  genomeConfig: any;
  genomeName?: string;
  visData?: ViewExpansion;
  trackManagerId: string;
  trackComponents: any;
  isScreenShotOpen: boolean;
  newDrawData: any;
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
  posRef: any;
  updateGlobalTrackConfig: any;
  sentScreenshotData: any;
  applyTrackConfigChange: any;
  containerRef: any;
  viewWindow?: DisplayedRegionModel;
}
