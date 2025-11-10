import { GraphNode } from "../GraphNode";
import DisplayedRegionModel from "../DisplayedRegionModel";
import Feature from "../Feature";
import OpenInterval from "../OpenInterval";
import LinearDrawingModel from "../LinearDrawingModel";
import NavigationContext from "../NavigationContext";
import { FeatureSegment } from "../FeatureSegment";
import { GenomeInteraction } from "../../getRemoteData/GenomeInteraction";
import ChromosomeInterval from "../ChromosomeInterval";

/**
 * Draw information for a Feature
 */
export interface PlacedFeature {
  feature: Feature; // The feature that was placed
  /**
   * The feature's *visible* part.  "Visible" means the parts of the feature that lie inside the nav context, as some
   * parts might fall outside.  For example, the feature is chr1:0-200 but the context only contains chr1:50-100.
   */
  visiblePart: FeatureSegment;
  contextLocation: OpenInterval; // The feature's *visible* part in navigation context coordinates
  xSpan: OpenInterval; // Horizontal location of the feature's *visible* part
  isReverse: boolean; // Whether the feature was placed into a reversed part of the navigation context
}

export interface PlacedSegment {
  segment: FeatureSegment; // The segment, truncated to the visible part
  xSpan: OpenInterval; // The x span of the segment
}

export class PlacedInteraction {
  interaction: GenomeInteraction; // The interaction
  /**
   * x span to draw the first region of the interaction.  Guaranteed to have the lower start of both the two spans.
   */
  xSpan1: OpenInterval;
  xSpan2: OpenInterval; // x span to draw the second region of the interaction

  constructor(
    interaction: GenomeInteraction,
    xSpan1: OpenInterval,
    xSpan2: OpenInterval
  ) {
    this.interaction = interaction;
    if (xSpan1.start <= xSpan2.start) {
      // Ensure the x spans are ordered
      this.xSpan1 = xSpan1;
      this.xSpan2 = xSpan2;
    } else {
      this.xSpan1 = xSpan2;
      this.xSpan2 = xSpan1;
    }
  }

  /**
   * @return {number} the length of the interaction in draw coordinates
   */
  getWidth(): number {
    const start = this.xSpan1.start; // Guaranteed to have to lower start
    const end = Math.max(this.xSpan1.end, this.xSpan2.end);
    return end - start;
  }

  generateKey(): string {
    return (
      "" +
      this.xSpan1.start +
      this.xSpan1.end +
      this.xSpan2.start +
      this.xSpan2.end
    );
  }
}

export interface PlaceFeaturesOptions {
  features: Feature[] | any[];
  viewRegion: DisplayedRegionModel;
  width: number;
  useCenter?: boolean;
  skipPlacements?: boolean;
  viewWindow?: { start: number; end: number };
  // For aggregation mode (skipPlacements = true)
  xToFeaturesForward?: Feature[][];
  xToFeaturesReverse?: Feature[][];
  aggregateFunc?: (features: Feature[]) => any;
  xToAggregatedForward?: any[];
  xToAggregatedReverse?: any[];
}

export class FeaturePlacer {
  /**
   * Computes context and draw locations for a list of features.
   * Accepts nested arrays (e.g., from combinedData with dataCache) and processes them without flattening.
   *
   * Two modes:
   * 1. Placement mode (skipPlacements = false): Returns PlacedFeature[] for rendering
   * 2. Aggregation mode (skipPlacements = true): Builds aggregation arrays, returns empty array
   *
   * @param {PlaceFeaturesOptions} options - configuration object
   * @return {PlacedFeature[]} draw info for the features (empty if skipPlacements=true)
   */
  placeFeatures(options: PlaceFeaturesOptions): PlacedFeature[] {
    const {
      features,
      viewRegion,
      width,
      useCenter = false,
      skipPlacements = false,
      viewWindow,
      xToFeaturesForward,
      xToFeaturesReverse,
      aggregateFunc,
      xToAggregatedForward,
      xToAggregatedReverse,
    } = options;

    const drawModel = new LinearDrawingModel(viewRegion, width);
    const viewRegionBounds = viewRegion.getContextCoordinates();
    const navContext = viewRegion.getNavigationContext();

    const placements: Array<any> = [];

    // Only use Set when we're in regions where duplicates are possible
    const seenLoci = new Set<string>();

    // Track ranges for forward and reverse separately (only needed for aggregation mode)
    let prevEndXForward = -1;
    let groupStartXForward = Infinity;
    let prevEndXReverse = -1;
    let groupStartXReverse = Infinity;

    // Loop through outer array (regions: features[0]=region1, features[1]=region2, features[2]=region3)
    for (let regionIndex = 0; regionIndex < features.length; regionIndex++) {
      const item = features[regionIndex];

      // Check if item has dataCache property (nested structure)
      const featureArray = item && item.dataCache ? item.dataCache : [item];

      // Loop through features in the dataCache (or single feature)
      for (const feature of featureArray) {
        // Skip if no feature or item was invalid
        if (!feature) continue;

        // Determine if forward or reverse based on value (only for aggregation mode)
        const isForward =
          skipPlacements && (feature.value === undefined || feature.value >= 0);
        const xToFeatures = skipPlacements
          ? isForward
            ? xToFeaturesForward
            : xToFeaturesReverse
          : undefined;
        const xToAggregated = skipPlacements
          ? isForward
            ? xToAggregatedForward
            : xToAggregatedReverse
          : undefined;

        // Use the appropriate tracking variables
        let prevEndX = skipPlacements
          ? isForward
            ? prevEndXForward
            : prevEndXReverse
          : -1;
        let groupStartX = skipPlacements
          ? isForward
            ? groupStartXForward
            : groupStartXReverse
          : Infinity;

        for (let contextLocation of feature.computeNavContextCoordinates(
          navContext
        )) {
          contextLocation = contextLocation.getOverlap(viewRegionBounds)!;
          if (contextLocation) {
            const xSpan = useCenter
              ? drawModel.baseSpanToXCenter(contextLocation)
              : drawModel.baseSpanToXSpan(contextLocation);

            const startX = Math.max(0, Math.floor(xSpan.start));
            const endX = Math.min(width - 1, Math.ceil(xSpan.end));

            // Determine if we need deduplication based on actual coordinates
            let useDeduplication = false;
            if (viewWindow) {
              // Region 1: if endX extends into region 2, enable dedup for next regions
              if (regionIndex === 0 && endX > viewWindow.start) {
                useDeduplication = true;
              }
              // Region 2: if endX extends into region 3, enable dedup for region 3
              else if (regionIndex === 1 && endX > viewWindow.end) {
                useDeduplication = true;
              }
              // Region 2 or 3: always use dedup (could have overlaps from previous regions)
              else if (regionIndex > 0 && regionIndex !== features.length - 1) {
                useDeduplication = true;
              }
            }

            // Deduplicate when in overlap regions
            if (useDeduplication) {
              const locusId = `${feature.locus.start}-${feature.locus.end}`;
              if (seenLoci.has(locusId)) {
                continue; // Skip duplicate
              }
              seenLoci.add(locusId);
            }

            // Only compute placement details if needed
            if (!skipPlacements) {
              const { visiblePart, isReverse } = this._locatePlacement(
                feature,
                navContext,
                contextLocation
              );

              placements.push({
                feature,
                visiblePart,
                contextLocation,
                xSpan,
                isReverse,
              });
            }

            // Aggregation mode: detect gap and aggregate previous group
            if (
              skipPlacements &&
              xToFeatures &&
              xToAggregated &&
              aggregateFunc
            ) {
              if (prevEndX >= 0 && startX > prevEndX) {
                for (let x = groupStartX; x <= prevEndX; x++) {
                  // if (xToFeatures[x] && xToFeatures[x].length > 0) {

                  xToAggregated[x] = aggregateFunc(xToFeatures[x]);
                  // }
                }
                groupStartX = startX;
              }

              // Add feature to x positions
              for (let x = startX; x <= endX; x++) {
                xToFeatures[x].push(feature);
              }

              // Update tracking
              groupStartX = Math.min(groupStartX, startX);
              prevEndX = endX;
            }
          }
        }

        // Save updated tracking variables back (aggregation mode only)
        if (skipPlacements) {
          if (isForward) {
            prevEndXForward = prevEndX;
            groupStartXForward = groupStartX;
          } else {
            prevEndXReverse = prevEndX;
            groupStartXReverse = groupStartX;
          }
        }
      }
    }

    // Aggregate remaining positions for forward (aggregation mode only)
    if (
      skipPlacements &&
      groupStartXForward !== Infinity &&
      xToFeaturesForward &&
      xToAggregatedForward &&
      aggregateFunc
    ) {
      for (let x = groupStartXForward; x <= prevEndXForward; x++) {
        // if (
        //   xToFeaturesForward[x] &&
        //   xToFeaturesForward[x].length > 0 &&
        //   xToAggregatedForward[x] === null
        // ) {
        xToAggregatedForward[x] = aggregateFunc(xToFeaturesForward[x]);
        // }
      }
    }

    // Aggregate remaining positions for reverse (aggregation mode only)
    if (
      skipPlacements &&
      groupStartXReverse !== Infinity &&
      xToFeaturesReverse &&
      xToAggregatedReverse &&
      aggregateFunc
    ) {
      for (let x = groupStartXReverse; x <= prevEndXReverse; x++) {
        // if (
        //   xToFeaturesReverse[x] &&
        //   xToFeaturesReverse[x].length > 0 &&
        //   xToAggregatedReverse[x] === null
        // ) {
        xToAggregatedReverse[x] = aggregateFunc(xToFeaturesReverse[x]);
        // }
      }
    }

    return placements;
  }

  /**
   * Gets the visible part of a feature after it has been placed in a navigation context, as well as if was placed
   * into a reversed part of the nav context.
   *
   * @param {Feature} feature - feature placed in a navigation context
   * @param {NavigationContext} contextLocation - navigation context in which the feature was placed
   * @param {OpenInterval} navContext - the feature's visible part in navigation context coordinates
   * @return {object} - placement details of the feature
   */
  _locatePlacement(
    feature: Feature,
    navContext: NavigationContext,
    contextLocation: OpenInterval
  ) {
    // First, get the genomic coordinates of the context location, i.e. the "context locus"
    const contextFeatureCoord = navContext.convertBaseToFeatureCoordinate(
      contextLocation.start
    );
    const placedBase = contextFeatureCoord.getLocus().start;
    const isReverse = contextFeatureCoord.feature.getIsReverseStrand();

    // We have a base number, but it could be the end or the beginning of the context locus.
    let contextLocusStart;
    if (isReverse) {
      // placedBase is the end base number of the context locus.  Convert to the start.
      contextLocusStart = placedBase - contextLocation.getLength() + 1;
    } else {
      contextLocusStart = placedBase;
    }

    // Now, we can compare the context location locus to the feature's locus.
    const distFromFeatureLocus = contextLocusStart - feature.getLocus().start;
    const relativeStart = Math.max(0, distFromFeatureLocus);
    return {
      visiblePart: new FeatureSegment(
        feature,
        relativeStart,
        relativeStart + contextLocation.getLength()
      ),
      isReverse,
    };
  }

  /**
   * Gets draw spans for feature segments, given a parent feature that has already been placed.
   *
   * @param {PlacedFeature} placedFeature
   * @param {FeatureSegment[]} segments
   * @return {PlacedSegment[]}
   */
  placeFeatureSegments(
    placedFeature: PlacedFeature,
    segments: FeatureSegment[]
  ): PlacedSegment[] {
    const pixelsPerBase =
      placedFeature.xSpan.getLength() /
      placedFeature.contextLocation.getLength();
    const placements: Array<any> = [];
    for (let segment of segments) {
      segment = segment.getOverlap(placedFeature.visiblePart)!;
      if (segment) {
        const basesFromVisiblePart =
          segment.relativeStart - placedFeature.visiblePart.relativeStart;
        const distanceFromXSpan = basesFromVisiblePart * pixelsPerBase;
        const xSpanLength = segment.getLength() * pixelsPerBase;
        let xSpanStart;
        if (placedFeature.isReverse) {
          xSpanStart =
            placedFeature.xSpan.end - distanceFromXSpan - xSpanLength;
        } else {
          xSpanStart = placedFeature.xSpan.start + distanceFromXSpan;
        }
        placements.push({
          segment,
          xSpan: new OpenInterval(xSpanStart, xSpanStart + xSpanLength),
        });
      }
    }

    return placements;
  }

  placeInteractions(
    interactions: GenomeInteraction[],
    viewRegion: DisplayedRegionModel,
    width: number
  ): PlacedInteraction[] {
    const drawModel = new LinearDrawingModel(viewRegion, width);
    const viewRegionBounds = viewRegion.getContextCoordinates();
    const navContext = viewRegion.getNavigationContext();

    const mappedInteractions: Array<any> = [];
    for (const interaction of interactions) {
      let contextLocations1 = navContext.convertGenomeIntervalToBases(
        interaction.locus1 as ChromosomeInterval
      );
      let contextLocations2 = navContext.convertGenomeIntervalToBases(
        interaction.locus2 as ChromosomeInterval
      );
      // Clamp the locations to the view region
      contextLocations1 = contextLocations1.map(
        (location) => location.getOverlap(viewRegionBounds)!
      );
      contextLocations2 = contextLocations2.map(
        (location) => location.getOverlap(viewRegionBounds)!
      );
      for (const location1 of contextLocations1) {
        for (const location2 of contextLocations2) {
          if (location1 && location2) {
            const xSpan1 = drawModel.baseSpanToXSpan(location1);
            const xSpan2 = drawModel.baseSpanToXSpan(location2);
            mappedInteractions.push(
              new PlacedInteraction(interaction, xSpan1, xSpan2)
            );
          }
        }
      }
    }

    return mappedInteractions;
  }

  /**
   * pretty much same as palceFeatures, but return feature not place-able. aka, out of view region
   *
   * @param nodes
   * @param viewRegion
   * @param width
   * @returns
   */
  placeGraphNodes(
    nodes: GraphNode[],
    viewRegion: DisplayedRegionModel,
    width: number
  ): {
    placements: PlacedFeature[];
    nodesOutOfView: GraphNode[];
  } {
    const drawModel = new LinearDrawingModel(viewRegion, width);
    const viewRegionBounds = viewRegion.getContextCoordinates();
    const navContext = viewRegion.getNavigationContext();

    const placements: Array<any> = [],
      nodesOutOfView: Array<any> = [];
    for (const node of nodes) {
      for (let contextLocation of node.computeNavContextCoordinates(
        navContext
      )) {
        contextLocation = contextLocation.getOverlap(viewRegionBounds)!; // Clamp the location to view region
        if (contextLocation) {
          const xSpan = drawModel.baseSpanToXSpan(contextLocation);
          const { visiblePart, isReverse } = this._locatePlacement(
            node,
            navContext,
            contextLocation
          );
          placements.push({
            feature: node,
            visiblePart,
            contextLocation,
            xSpan,
            isReverse,
          });
        } else {
          nodesOutOfView.push(node);
        }
      }
    }

    return { placements, nodesOutOfView };
  }
}
