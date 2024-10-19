import { default as Genome } from '../Genome';
import { default as NavigationContext } from '../NavigationContext';
import { default as CytobandMap } from './CytobandTypes';
import { default as OpenInterval } from '../OpenInterval';
import { default as TrackModel } from '../TrackModel';
export interface GenomeConfig {
    genome: Genome;
    navContext: NavigationContext;
    cytobands: CytobandMap;
    defaultRegion: OpenInterval;
    defaultTracks: TrackModel[];
    publicHubData: any;
    publicHubList: any[];
    annotationTracks: any;
    twoBitURL?: string;
}
