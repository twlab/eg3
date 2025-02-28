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
  trackData?: { [key: string]: any }; // Replace with the actual type

  dragX?: number;

  genomeName?: string;
  visData?: ViewExpansion;
  trackManagerId: string;
  trackComponents: any;
  genomeArr?: Array<any>;
  genomeIdx?: number;
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

  updateGlobalTrackConfig: any;
  sentScreenshotData: any;
  applyTrackConfigChange: any;
  containerRef: any;
  viewWindow?: DisplayedRegionModel;
}
