import { ViewExpansion } from "../RegionExpander";

export interface TrackProps {
  id: String;
  trackIdx: number;
  bpRegionSize: number;
  basePerPixel: number;
  side: string;
  windowWidth: number;
  handleDelete: (trackIndex: number) => void;
  trackData?: { [key: string]: any }; // Replace with the actual type

  dragXDist?: number;

  genomeName?: string;
  visData?: ViewExpansion;
  trackManagerId: string;
  trackComponents: any;
  genomeArr?: Array<any>;
  genomeIdx?: number;
  trackModel?: any;
  dataIdx?: number;
  getConfigMenu: any;
  onCloseConfigMenu: () => void;
  useFineModeNav: boolean;
  trackManagerRef: any;
  setShow3dGene: any;
  isThereG3dTrack: boolean;

  legendRef: any;

  onTrackConfigChange: any;

  selectConfigChange;
}
