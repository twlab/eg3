import Genome from "../Genome";
import NavigationContext from "../NavigationContext";
import CytobandMap from "./CytobandTypes";
import OpenInterval from "../OpenInterval";
import TrackModel from "../TrackModel";
import { GenomeCoordinate } from "../../types/track-container";

export interface GenomeConfig {
  genome: Genome;
  navContext: NavigationContext;
  cytobands: CytobandMap;
  defaultRegion: GenomeCoordinate;
  defaultTracks: TrackModel[];
  publicHubData: any;
  publicHubList: any[];
  annotationTracks: any;
  twoBitURL?: string;
}
