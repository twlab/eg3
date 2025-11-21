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
      viewWindow,
      padding,
      hiddenPixels = 0.5,
      xToFeaturesForward,
      xToFeaturesReverse,
      aggregateFunc,
      xToAggregatedForward,
      xToAggregatedReverse,
      windowSize,
      xToWindowMap,
    } = options;

    const isNumerical = mode === PlacementMode.NUMERICAL;
    const isAnnotation = mode === PlacementMode.ANNOTATION;
    const isBoxplot = mode === PlacementMode.BOXPLOT;
    const drawModel = new LinearDrawingModel(viewRegion, width);
    const viewRegionBounds = viewRegion.getContextCoordinates();
    const navContext = viewRegion.getNavigationContext();

    const placements: Array<any> = [];

    // for Annotation, combine adjacent features and assign rows
    const groups: PlacedFeatureGroup[] = [];
    let currentGroup: PlacedFeature[] = [];
    let lastPlacement: PlacedFeature | null = null;
    const maxXsForRows: number[] = []; // Track row assignments
    const isConstPadding = typeof padding === "number";

    // for Annotation, gene can be too small so we dont draw and increment numHidden
    let numHidden = 0;

    // used to store genome that we have already seen
    const seenLoci = new Set<string>();

    // track ranges for forward and reverse separately (only needed for numerical mode)
    let prevEndXForward = -1;
    let groupStartXForward = Infinity;
    let prevEndXReverse = -1;
    let groupStartXReverse = Infinity;

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
        if (!feature) continue;
        // Check if feature is too small to display (ANNOTATION mode only)
        if (isAnnotation) {
          const featureWidth = drawModel.basesToXWidth(feature.getLength());
          if (featureWidth <= hiddenPixels) {
            numHidden++;
            continue; // Skip this feature
          }
        }
        // Determine if forward or reverse based on value (only for numerical mode)
        const isForward =
          isNumerical && (feature.value === undefined || feature.value >= 0);
        const xToFeatures = isNumerical
          ? isForward
            ? xToFeaturesForward
            : xToFeaturesReverse
          : undefined;
        const xToAggregated = isNumerical
          ? isForward
            ? xToAggregatedForward
            : xToAggregatedReverse
          : undefined;

        let prevEndX = isNumerical
          ? isForward
            ? prevEndXForward
            : prevEndXReverse
          : -1;
        let groupStartX = isNumerical
          ? isForward
            ? groupStartXForward
            : groupStartXReverse
          : Infinity;

        // Collect all context locations for this feature
        const contextLocations: OpenInterval[] = [];
        for (let contextLocation of feature.computeNavContextCoordinates(
          navContext
        )) {
          const overlappedLocation =
            contextLocation.getOverlap(viewRegionBounds);
          if (overlappedLocation) {
            contextLocations.push(overlappedLocation);
          }
        }

        if (contextLocations.length === 0) {
          continue;
        }

        // use first location to check for duplicates based on pixel coordinates
        const firstContextLocation = contextLocations[0];
        const firstXSpan = useCenter
          ? drawModel.baseSpanToXCenter(firstContextLocation)
          : drawModel.baseSpanToXSpan(firstContextLocation);
        const firstStartX = Math.max(0, Math.floor(firstXSpan.start));
        const firstEndX = Math.min(width - 1, Math.ceil(firstXSpan.end));

        // Determine if we need deduplication based on actual coordinates
        let useDeduplication = false;
        if (viewWindow) {
          // Region 1: if endX extends into region 2, enable dedup for next regions
          if (regionIndex === 0 && firstEndX > viewWindow.start) {
            useDeduplication = true;
          }
          // Region 2: if endX extends into region 3, enable dedup for region 3
          else if (regionIndex === 1 && firstEndX > viewWindow.end) {
            useDeduplication = true;
          }
          // Region 2 or 3: always use dedup (could have overlaps from previous regions)
          else if (regionIndex > 0) {
            useDeduplication = true;
          }
        }

        // Deduplicate when in overlap regions
        if (useDeduplication) {
          const locusId = feature.id
            ? feature.id
            : `${feature.locus.start}-${feature.locus.end}`;

          if (seenLoci.has(locusId)) {
            continue; // Skip duplicate feature entirely
          }
          seenLoci.add(locusId);
        }

        // Process all context locations for this feature
        for (const contextLocation of contextLocations) {
          const xSpan = useCenter
            ? drawModel.baseSpanToXCenter(contextLocation)
            : drawModel.baseSpanToXSpan(contextLocation);

          const startX = Math.max(0, Math.floor(xSpan.start));
          const endX = Math.min(width - 1, Math.ceil(xSpan.end));

          // Only compute placement details if not in numerical mode
          if (!isNumerical && !isBoxplot) {
            const { visiblePart, isReverse } = this._locatePlacement(
              feature,
              navContext,
              contextLocation
            );

            const placement: PlacedFeature = {
              feature,
              visiblePart,
              contextLocation,
              xSpan,
              isReverse,
            };

            if (isAnnotation) {
              // ANNOTATION mode: Check if this placement is adjacent to the last one
              if (
                lastPlacement &&
                this._lociAreAdjacent(lastPlacement, placement)
              ) {
                currentGroup.push(placement);
              } else {
                // Start a new group - finalize previous and assign row
                if (currentGroup.length > 0) {
                  this._finalizeGroupWithRow(
                    currentGroup,
                    groups,
                    padding,
                    maxXsForRows
                  );
                }
                currentGroup = [placement];
              }
              lastPlacement = placement;
            } else {
              // PLACEMENT mode: Just add to placements
              placements.push(placement);
            }
          }

          // BOXPLOT mode: bin features by window
          if (isBoxplot && xToWindowMap && windowSize) {
            for (let x = startX; x <= endX; x++) {
              if (xToWindowMap.hasOwnProperty(x)) {
                xToWindowMap[x].push(feature);
              }
            }
          }

          // Numerical mode: detect gap and aggregate previous group
          if (isNumerical && xToFeatures && xToAggregated && aggregateFunc) {
            if (prevEndX >= 0 && startX > prevEndX) {
              for (let x = groupStartX; x <= prevEndX; x++) {
                xToAggregated[x] = aggregateFunc(xToFeatures[x]);
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

        // Save updated tracking variables back (numerical mode only)
        if (isNumerical) {
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

    // aggregate remaining positions for forward (numerical mode only)
    if (
      isNumerical &&
      groupStartXForward !== Infinity &&
      xToFeaturesForward &&
      xToAggregatedForward &&
      aggregateFunc
    ) {
      for (let x = groupStartXForward; x <= prevEndXForward; x++) {
        xToAggregatedForward[x] = aggregateFunc(xToFeaturesForward[x]);
      }
    }

    // aggregate remaining positions for reverse (numerical mode only)
    if (
      isNumerical &&
      groupStartXReverse !== Infinity &&
      xToFeaturesReverse &&
      xToAggregatedReverse &&
      aggregateFunc
    ) {
      for (let x = groupStartXReverse; x <= prevEndXReverse; x++) {
        xToAggregatedReverse[x] = aggregateFunc(xToFeaturesReverse[x]);
      }
    }

    // finalize last group if in ANNOTATION mode
    if (isAnnotation) {
      if (currentGroup.length > 0) {
        this._finalizeGroupWithRow(currentGroup, groups, padding, maxXsForRows);
      }
      return {
        placements: groups,
        numRowsAssigned: maxXsForRows.length,
        numHidden,
      };
    }

    // BOXPLOT mode: return empty placements (data is in xToWindowMap)
    if (isBoxplot) {
      return {
        placements: [],
        numHidden: 0,
      };
    }

    return {
      placements,
      numHidden: 0,
    };
  }

  /**
   * Check if two placements have adjacent loci
   */
  private _lociAreAdjacent(a: PlacedFeature, b: PlacedFeature): boolean {
    const locusA = a.visiblePart.getLocus();
    const locusB = b.visiblePart.getLocus();
    return locusA.end === locusB.start || locusA.start === locusB.end;
  }

  /**
   * Finalize a group of adjacent placements and assign a row
   */
  private _finalizeGroupWithRow(
    group: PlacedFeature[],
    groups: PlacedFeatureGroup[],
    padding: number | PaddingFunc | undefined,
    maxXsForRows: number[]
  ): void {
    if (group.length === 0) return;

    const firstPlacement = group[0];
    const lastPlacement = group[group.length - 1];

    const groupXSpan = new OpenInterval(
      firstPlacement.xSpan.start,
      lastPlacement.xSpan.end
    );

    // Calculate padding
    const isConstPadding = typeof padding === "number";
    const horizontalPadding = padding
      ? isConstPadding
        ? (padding as number)
        : (padding as PaddingFunc)(firstPlacement.feature, groupXSpan)
      : 0;

    const startX = groupXSpan.start - horizontalPadding;
    const endX = groupXSpan.end + horizontalPadding;

    // Find the first row where the interval won't overlap with others in the row
    let row = maxXsForRows.findIndex((maxX) => maxX < startX);
    if (row === -1) {
      // Couldn't find a row -- make a new one
      maxXsForRows.push(endX);
      row = maxXsForRows.length - 1;
    } else {
      maxXsForRows[row] = endX;
    }

    groups.push({
      feature: firstPlacement.feature,
      xSpan: groupXSpan,
      placedFeatures: group,
      row,
    } as PlacedFeatureGroup);
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
