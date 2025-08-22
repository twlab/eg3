import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";
import TrackModel from "../../../../models/TrackModel";
import { HighlightInterval } from "../../ToolComponents/HighlightMenu";

export interface TrackState {
  bundleId: string;
  customTracksPool: any[]; // use appropriate types if you know specifics, or use unknown[] for any type
  darkTheme: boolean;
  genomeName: string;
  highlights: HighlightInterval[];
  isShowingNavigator: boolean;
  layout: any;
  metadataTerms: any[]; // use appropriate types if you know specifics, or use unknown[] for any type
  regionSetView: any | null; // use appropriate type if you know it
  regionSets: any[]; // use appropriate types if you know specifics, or use unknown[] for any type
  viewRegion: DisplayedRegionModel;
  trackLegendWidth: number;
  tracks: Array<TrackModel>;
}
