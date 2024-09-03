import { ViewExpansion } from "../RegionExpander";

export interface TrackProps {
  id: String;
  trackIdx: number;
  bpRegionSize: number;
  bpToPx: number;
  side: string;
  windowWidth: number;
  handleDelete: (trackIndex: number) => void;
  trackData?: { [key: string]: any }; // Replace with the actual type
  trackData2?: { [key: string]: any }; // Replace with the actual type
  dragXDist?: number;
  featureArray?: any;
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
}
