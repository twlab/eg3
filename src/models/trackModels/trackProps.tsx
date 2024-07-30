import { ViewExpansion } from "../RegionExpander";

export interface TrackProps {
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
}
