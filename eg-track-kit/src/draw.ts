/* Turning a track's fetched data into its drawing - the same functions the
   browser draws every track with. `formatDataByType` makes the fetched
   records into the track's features; `getDisplayModeFunction` takes them
   with the region and the track's options and returns the React element,
   in whichever display mode the options ask for. */

import "../../eg-tracks/src/components/GenomeView/track.css";
import {
  formatDataByType,
  getDisplayModeFunction,
} from "../../eg-tracks/src/components/GenomeView/TrackComponents/displayModeComponentMap";
import { trackOptionMap } from "../../eg-tracks/src/components/GenomeView/TrackComponents/defaultOptionsMap";
import type DisplayedRegionModel from "../../eg-tracks/src/models/DisplayedRegionModel";
import OpenInterval from "../../eg-tracks/src/models/OpenInterval";
import type TrackModel from "../../eg-tracks/src/models/TrackModel";

export {
  getDisplayModeFunction,
  displayModeComponentMap,
  formatDataByType,
  interactionTracks,
  densityTracks,
  dynamicMatplotTracks,
} from "../../eg-tracks/src/components/GenomeView/TrackComponents/displayModeComponentMap";
/** Each track type's default options, row height and padding. */
export { trackOptionMap } from "../../eg-tracks/src/components/GenomeView/TrackComponents/defaultOptionsMap";
export { geneClickToolTipMap } from "../../eg-tracks/src/components/GenomeView/TrackComponents/renderClickTooltipMap";

export interface DrawTrackInput {
  trackModel: TrackModel;
  /** The raw records the track's fetch came back with. */
  data: any;
  /** The region drawn, across `width` pixels. */
  region: DisplayedRegionModel;
  width: number;
  /** Width of the legend drawn to the left of the track, in pixels. */
  legendWidth?: number;
  genomeName?: string;
  /** The genome's config, for the ruler and the tracks that read sequence. */
  genomeConfig?: any;
  /** Called with (event, feature) when a feature is clicked. */
  renderTooltip?: (event: any, feature: any) => void;
}

/** The object `getDisplayModeFunction` draws a track from, for one region. */
export function trackDrawData({
  trackModel,
  data,
  region,
  width,
  legendWidth = 0,
  genomeName = "",
  genomeConfig,
  renderTooltip,
}: DrawTrackInput) {
  const type = trackModel.type;
  const visData = {
    visWidth: width,
    visRegion: region,
    viewWindow: new OpenInterval(0, width),
    viewWindowRegion: region,
  };
  return {
    genomeName,
    genesArr: formatDataByType(data, type),
    trackState: {
      viewWindow: visData.viewWindow,
      startWindow: 0,
      visRegion: region,
      visWidth: width,
      visData,
    },
    windowWidth: width,
    legendWidth,
    configOptions: { ...trackOptionMap[type]?.defaultOptions, ...trackModel.options },
    basesByPixel: region.getWidth() / width,
    trackModel,
    getGenePadding: trackOptionMap[type]?.getGenePadding,
    ROW_HEIGHT: trackOptionMap[type]?.ROW_HEIGHT,
    genomeConfig,
    renderTooltip,
  };
}

/** One track over one region, as the browser draws it: a React element. */
export function drawTrack(input: DrawTrackInput) {
  const drawn = getDisplayModeFunction(trackDrawData(input));
  /* Some modes answer with the element and how many rows they hid. */
  return drawn && typeof drawn === "object" && "numHidden" in drawn
    ? drawn.component
    : drawn;
}
