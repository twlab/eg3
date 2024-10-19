import { GraphNode } from '../GraphNode';
import { default as DisplayedRegionModel } from '../DisplayedRegionModel';
import { default as Feature } from '../Feature';
import { default as OpenInterval } from '../OpenInterval';
import { default as NavigationContext } from '../NavigationContext';
import { FeatureSegment } from '../FeatureSegment';
import { GenomeInteraction } from '../../getRemoteData/GenomeInteraction';
/**
 * Draw information for a Feature
 */
export interface PlacedFeature {
    feature: Feature;
    /**
     * The feature's *visible* part.  "Visible" means the parts of the feature that lie inside the nav context, as some
     * parts might fall outside.  For example, the feature is chr1:0-200 but the context only contains chr1:50-100.
     */
    visiblePart: FeatureSegment;
    contextLocation: OpenInterval;
    xSpan: OpenInterval;
    isReverse: boolean;
}
export interface PlacedSegment {
    segment: FeatureSegment;
    xSpan: OpenInterval;
}
export declare class PlacedInteraction {
    interaction: GenomeInteraction;
    /**
     * x span to draw the first region of the interaction.  Guaranteed to have the lower start of both the two spans.
     */
    xSpan1: OpenInterval;
    xSpan2: OpenInterval;
    constructor(interaction: GenomeInteraction, xSpan1: OpenInterval, xSpan2: OpenInterval);
    /**
     * @return {number} the length of the interaction in draw coordinates
     */
    getWidth(): number;
    generateKey(): string;
}
export declare class FeaturePlacer {
    /**
     * Computes context and draw locations for a list of features.  There may be a different number of placed features
     * than input features, as a feature might map to several different nav context coordinates, or a feature might
     * not map at all.
     *
     * @param {Feature[]} features - features for which to compute draw locations
     * @param {DisplayedRegionModel} viewRegion - region in which to draw
     * @param {number} width - width of visualization
     * @return {PlacedFeature[]} draw info for the features
     */
    placeFeatures(features: Feature[], viewRegion: DisplayedRegionModel, width: number, useCenter?: boolean): PlacedFeature[];
    /**
     * Gets the visible part of a feature after it has been placed in a navigation context, as well as if was placed
     * into a reversed part of the nav context.
     *
     * @param {Feature} feature - feature placed in a navigation context
     * @param {NavigationContext} contextLocation - navigation context in which the feature was placed
     * @param {OpenInterval} navContext - the feature's visible part in navigation context coordinates
     * @return {object} - placement details of the feature
     */
    _locatePlacement(feature: Feature, navContext: NavigationContext, contextLocation: OpenInterval): {
        visiblePart: FeatureSegment;
        isReverse: any;
    };
    /**
     * Gets draw spans for feature segments, given a parent feature that has already been placed.
     *
     * @param {PlacedFeature} placedFeature
     * @param {FeatureSegment[]} segments
     * @return {PlacedSegment[]}
     */
    placeFeatureSegments(placedFeature: PlacedFeature, segments: FeatureSegment[]): PlacedSegment[];
    placeInteractions(interactions: GenomeInteraction[], viewRegion: DisplayedRegionModel, width: number): PlacedInteraction[];
    /**
     * pretty much same as palceFeatures, but return feature not place-able. aka, out of view region
     *
     * @param nodes
     * @param viewRegion
     * @param width
     * @returns
     */
    placeGraphNodes(nodes: GraphNode[], viewRegion: DisplayedRegionModel, width: number): {
        placements: PlacedFeature[];
        nodesOutOfView: GraphNode[];
    };
}
