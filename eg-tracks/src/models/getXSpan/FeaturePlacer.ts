import { GraphNode } from "../GraphNode";
import DisplayedRegionModel from "../DisplayedRegionModel";
import Feature from "../Feature";
import OpenInterval from "../OpenInterval";
import LinearDrawingModel from "../LinearDrawingModel";
import NavigationContext from "../NavigationContext";
import { FeatureSegment } from "../FeatureSegment";
import { GenomeInteraction } from "../../getRemoteData/GenomeInteraction";
import ChromosomeInterval from "../ChromosomeInterval";
import { FeaturePlacementResult, PlacedFeatureGroup } from "../FeatureArranger";
import _ from "lodash";
import { off } from "process";

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

export type PaddingFunc = (feature: Feature, xSpan: OpenInterval) => number;

export enum PlacementMode {
  NUMERICAL = "numerical", // Build aggregation arrays for numerical tracks
  PLACEMENT = "placement", // Return PlacedFeature[]
  ANNOTATION = "annotation", // Return PlacedFeatureGroup[] with adjacent features grouped and rows assigned
  BOXPLOT = "boxplot", // Build windowed map for boxplot visualization
}

export interface PlaceFeaturesOptions {
  features: Feature[] | any[];
  viewRegion: DisplayedRegionModel;
  width: number;
  useCenter?: boolean;
  mode?: PlacementMode; // Defaults to PLACEMENT
  viewWindow?: { start: number; end: number };
  // For ANNOTATION mode (combines adjacent + assigns rows)
  padding?: number | PaddingFunc;
  hiddenPixels?: number; // Minimum pixel width to display a feature
  // For NUMERICAL mode
  xToFeaturesForward?: Feature[][];
  xToFeaturesReverse?: Feature[][];
  aggregateFunc?: (features: Feature[]) => any;
  xToAggregatedForward?: any[];
  xToAggregatedReverse?: any[];
  // For BOXPLOT mode
  windowSize?: number; // Window size for binning features
  xToWindowMap?: { [x: number]: Feature[] }; // Output map for boxplot
}

export type PaddingFunc = (feature: Feature, xSpan: OpenInterval) => number;

export enum PlacementMode {
  NUMERICAL = "numerical", // Build aggregation arrays for numerical tracks
  PLACEMENT = "placement", // Return PlacedFeature[]
  ANNOTATION = "annotation", // Return PlacedFeatureGroup[] with adjacent features grouped and rows assigned
  BOXPLOT = "boxplot", // Build windowed map for boxplot visualization
}

export interface PlaceFeaturesOptions {
  features: Feature[] | any[];
  viewRegion: DisplayedRegionModel;
  width: number;
  useCenter?: boolean;
  mode?: PlacementMode; // Defaults to PLACEMENT
  viewWindow?: { start: number; end: number };
  // For ANNOTATION mode (combines adjacent + assigns rows)
  padding?: number | PaddingFunc;
  hiddenPixels?: number; // Minimum pixel width to display a feature
  // For NUMERICAL mode
  xToFeaturesForward?: Feature[][];
  xToFeaturesReverse?: Feature[][];
  aggregateFunc?: (features: Feature[]) => any;
  xToAggregatedForward?: any[];
  xToAggregatedReverse?: any[];
  // For BOXPLOT mode
  windowSize?: number; // Window size for binning features
  xToWindowMap?: { [x: number]: Feature[] }; // Output map for boxplot
}

export class FeaturePlacer {
  /**
   * Computes context and draw locations for a list of features.
   * Accepts nested arrays (e.g., from combinedData with dataCache) and processes them without flattening.
   *
   * Three modes:
   * 1. NUMERICAL: Builds aggregation arrays, returns empty array
   * 2. PLACEMENT: Returns PlacedFeature[] for rendering
   * 3. ANNOTATION: Returns PlacedFeatureGroup[] with adjacent features grouped and rows assigned
   *
   * @param {PlaceFeaturesOptions} options - configuration object
   * @return {FeaturePlacementResult} draw info with placements and metadata
   * Computes context and draw locations for a list of features.
   * Accepts nested arrays (e.g., from combinedData with dataCache) and processes them without flattening.
   *
   * Three modes:
   * 1. NUMERICAL: Builds aggregation arrays, returns empty array
   * 2. PLACEMENT: Returns PlacedFeature[] for rendering
   * 3. ANNOTATION: Returns PlacedFeatureGroup[] with adjacent features grouped and rows assigned
   *
   * @param {PlaceFeaturesOptions} options - configuration object
   * @return {FeaturePlacementResult} draw info with placements and metadata
   */
  placeFeatures(
    options: PlaceFeaturesOptions
  ): FeaturePlacementResult | PlacedFeature {
    const {
      features,
      viewRegion,
      width,
      useCenter = false,
      mode = PlacementMode.PLACEMENT,

      hiddenPixels = 0.5,
    } = options;

    const isNumerical = mode === PlacementMode.NUMERICAL;
    const isAnnotation = mode === PlacementMode.ANNOTATION;
    const isBoxplot = mode === PlacementMode.BOXPLOT;
    const drawModel = new LinearDrawingModel(viewRegion, width);
    const viewRegionBounds = viewRegion.getContextCoordinates();
    const navContext = viewRegion.getNavigationContext();

    const placements: Array<any> = [];
    const placementsForward: Array<any> = [];
    const placementsReverse: Array<any> = [];
    // for Annotation, gene can be too small so we dont draw and increment numHidden
    let numHidden = 0;

    // used to store genome that we have already seen
    const seenLoci = new Set<string>();

    // Loop through outer array (regions: features[0]=region1, features[1]=region2, features[2]=region3)
    for (let regionIndex = 0; regionIndex < features.length; regionIndex++) {
      const item = features[regionIndex];

      // check:  array, has dataCache property, or is a single feature
      const featureArray = Array.isArray(item)
        ? item
        : item && item.dataCache
        ? item.dataCache
        : [item];

      for (const feature of featureArray) {
        if (!feature) {
          continue;
        }
        if (
          mode === PlacementMode.ANNOTATION &&
          drawModel.basesToXWidth(feature.getLength()) < hiddenPixels
        ) {
          numHidden++;
          continue;
        }

        const locusId = feature.id
          ? feature.id
          : `${feature.locus.start}-${feature.locus.end}`;

        if (seenLoci.has(locusId)) {
          continue; // Skip duplicate feature entirely
        }
        seenLoci.add(locusId);

        for (let contextLocation of feature.computeNavContextCoordinates(
          navContext
        )) {
          if (contextLocation) {
            feature;
            const xSpan = useCenter
              ? drawModel.baseSpanToXCenter(contextLocation)
              : drawModel.baseSpanToXSpan(contextLocation);
            const { visiblePart, isReverse } = this._locatePlacement(
              feature,
              navContext,
              contextLocation
            );
            let tempPlacementParam;
            if (mode === PlacementMode.ANNOTATION) {
              tempPlacementParam = this._combineAdjacent([
                {
                  feature,
                  visiblePart,
                  contextLocation,
                  xSpan,
                  isReverse,
                },
              ]);
            } else {
              tempPlacementParam = {
                feature,
                visiblePart,
                contextLocation,
                xSpan,
                isReverse,
              };
            }

            if (feature.value === undefined || feature.value >= 0) {
              if (Array.isArray(tempPlacementParam)) {
                placementsForward.push(...tempPlacementParam);
              } else {
                placementsForward.push(tempPlacementParam);
              }
            } else if (feature.value < 0) {
              placementsReverse.push(tempPlacementParam);
            }
          }
        }
      }
    }
    return {
      placements: placementsForward,
      placementsForward,
      placementsReverse,
      numHidden: numHidden,
    };
  }

  _combineAdjacent(placements: PlacedFeature[]): PlacedFeatureGroup[] {
    placements.sort((a, b) => a.xSpan.start - b.xSpan.start);

    const groups: PlacedFeatureGroup[] = [];
    let i = 0;
    while (i < placements.length) {
      let j = i + 1;
      while (j < placements.length && lociAreAdjacent(j - 1, j)) {
        j++;
      }

      const placementsInGroup = placements.slice(i, j);
      const firstPlacement = _.first(placementsInGroup);
      const lastPlacement = _.last(placementsInGroup);
      groups.push({
        feature: firstPlacement.feature,
        row: -1,
        xSpan: new OpenInterval(
          firstPlacement.xSpan.start,
          lastPlacement.xSpan.end
        ),
        placedFeatures: placementsInGroup,
      });
      i = j;
    }

    return groups;

    function lociAreAdjacent(a: number, b: number) {
      const locusA = placements[a].visiblePart.getLocus();
      const locusB = placements[b].visiblePart.getLocus();
      return locusA.end === locusB.start || locusA.start === locusB.end;
    }
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

    // Calculate the genomic length (in bases) that the context location represents
    const contextFeatureCoordEnd = navContext.convertBaseToFeatureCoordinate(
      contextLocation.end
    );
    const placedBaseEnd = contextFeatureCoordEnd.getLocus().start;
    const genomicLength = Math.abs(placedBaseEnd - placedBase);

    return {
      visiblePart: new FeatureSegment(
        feature,
        relativeStart,
        relativeStart + genomicLength
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
