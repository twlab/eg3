import DisplayedRegionModel from "@/models/DisplayedRegionModel";
import TrackModel from "@/models/TrackModel";
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

export function createNewTrackState(
  existingState: TrackState,
  updates: Partial<TrackState> = {}
): TrackState {
  return {
    bundleId: updates.bundleId ?? existingState.bundleId,
    customTracksPool: updates.customTracksPool
      ? [...existingState.customTracksPool]
      : [],
    darkTheme: updates.darkTheme ?? existingState.darkTheme,
    genomeName: updates.genomeName ?? existingState.genomeName,
    highlights: updates.highlights
      ? [
          ...existingState.highlights.map((h) => ({ ...h })),
          ...updates.highlights.map((h) => ({ ...h })),
        ]
      : existingState.highlights.length === 0
      ? []
      : existingState.highlights.map((h) => ({ ...h })),
    isShowingNavigator:
      updates.isShowingNavigator ?? existingState.isShowingNavigator,
    layout: updates.layout ?? { ...existingState.layout },
    metadataTerms: updates.metadataTerms ?? [...existingState.metadataTerms],
    regionSetView:
      updates.regionSetView ??
      (existingState.regionSetView ? { ...existingState.regionSetView } : null),
    regionSets: updates.regionSets ?? [...existingState.regionSets],
    viewRegion: updates.viewRegion ?? existingState.viewRegion.clone(),
    trackLegendWidth:
      updates.trackLegendWidth ?? existingState.trackLegendWidth,
    tracks: existingState.tracks.map((track) => track.clone()),
  };
}
