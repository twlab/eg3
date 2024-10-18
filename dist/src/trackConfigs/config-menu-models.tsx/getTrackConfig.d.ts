import { TrackConfig } from './TrackConfig';
import { default as TrackModel } from '../../models/TrackModel';
export declare const INTERACTION_TYPES: string[];
export declare const ALIGNMENT_TYPES: string[];
export declare const MOD_TYPES: string[];
export declare const DYNAMIC_TYPES: string[];
/**
 * Gets the appropriate TrackConfig from a trackModel.  This function is separate from TrackConfig because it would
 * cause a circular dependency.
 *
 * @param {TrackModel} trackModel - track model
 * @return {TrackConfig} renderer for that track model
 */
export declare function getTrackConfig(trackModel: TrackModel): TrackConfig;
