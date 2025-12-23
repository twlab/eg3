import _ from "lodash";
import OpenInterval from "./OpenInterval";
import { FeatureSegment } from "./FeatureSegment";
import ChromosomeInterval from "./ChromosomeInterval";
import { Feature } from "./Feature";

const GAP_CHR = ""; // The special chromosome that gaps lie in.

/**
 * A implicit coordinate system for the entire genome or a gene set view.  It represents everywhere that a user could
 * potentially navigate and view.
 *
 * A context constructs this coordinate system through an ordered list of features.  Features in NavigationContexts must
 * have non-empty, unique names.  In addition to this implicit coordinate system, NavContext methods also support
 * feature coordinates, which are a feature and base number relative to the start of the feature.
 *
 * @author Chanrung(Chad) Seng, Silas Hsu
 */
class NavigationContext {
  public _name: string;
  public _features: Feature[];
  public _sortedFeatureStarts: number[];
  public _minCoordinateForFeature: Map<Feature, number>;
  public _featuresForChr: { [chr: string]: Feature[] };
  public _totalBases: number;

  /**
   * Makes a special "feature" representing a gap in the genome.  To use, insert such objects into the feature list
   * during NavigationContext construction.
   *
   * @param {number} length - length of the gap in bases
   * @param {string} [name] - custom name of the gap feature
   * @return {Feature} a special "feature" representing a gap in the genome.
   */
  static makeGap(length: number, name = "Gap"): Feature {
    return new Feature(
      name,
      new ChromosomeInterval(GAP_CHR, 0, Math.round(length))
    );
  }

  /**
   * @param {Feature} feature - feature to inspect
   * @return {boolean} whether the feature represents a gap in the genome
   */
  static isGapFeature(feature: Feature) {
    return feature.getLocus().chr === GAP_CHR;
  }

  /**
   * Makes a new instance.  Features must have non-empty, unique names.  The `isGenome` parameter does not change any
   * of the instance's functionality, but if it is true, it optimizes mapping functions.
   *
   * @param {string} name - name of this context
   * @param {Feature[]} features - list of features
   * @param {boolean} isGenome - whether the context covers the entire genome
   * @throws {Error} if the feature list has a problem
   */
  constructor(name: string, features: Array<any>) {
    this._name = name;
    this._features = features;
    this._minCoordinateForFeature = new Map();
    this._sortedFeatureStarts = [];
    this._featuresForChr = _.groupBy(
      features,
      (feature) => feature.getLocus().chr
    );
    this._totalBases = 0;

    for (const feature of features) {
      if (this._minCoordinateForFeature.has(feature)) {
        throw new Error(
          `Duplicate feature "${feature.getName()}" detected.  Features must be unique.`
        );
      }
      this._minCoordinateForFeature.set(feature, this._totalBases);
      this._sortedFeatureStarts.push(this._totalBases);
      this._totalBases += feature.getLength();
    }
  }

  /**
   * If the input segment is in a reverse strand feature, returns a new segment that is the same size, but moved to
   * the other end of the feature.  In effect, it rotates a feature segment 180 degrees about the feature's center.
   *
   * Otherwise, returns the input unmodified.
   *
   * @example
   * let feature: Feature; // Pretend it has a length of 10
   * const segment = new FeatureSegment(feature, 2, 4);
   * this._flipIfReverseStrand(segment); // Returns new segment [6, 8)
   *
   * @param {FeatureSegment} segment - the feature segment to flip if on the reverse strand
   * @return {FeatureSegment} flipped feature segment, but only if the input was on the reverse strand
   */
  _flipIfReverseStrand(segment: FeatureSegment) {
    if (segment.feature.getIsReverseStrand()) {
      return new FeatureSegment(
        segment.feature,
        flip(segment.relativeEnd),
        flip(segment.relativeStart)
      );
    } else {
      return segment;
    }

    function flip(relativeBase: number) {
      return segment.feature.getLength() - relativeBase;
    }
  }

  /**
   * @return {string} this navigation context's name, as specified in the constructor
   */
  getName() {
    return this._name;
  }

  /**
   * Gets the internal feature list.  This list should be treated as read-only; modifying its elements causes
   * undefined behavior.
   *
   * @return {Feature[]} the internal feature list for this context
   */
  getFeatures() {
    return this._features.slice();
  }

  /**
   * @return {number} the total number of bases in this context, i.e. how many bases are navigable
   */
  getTotalBases() {
    return this._totalBases;
  }

  /**
   * Given a context coordinate, gets whether the base is navigable.
   *
   * @param {number} base - context coordinate
   * @return {boolean} whether the base is navigable
   */
  getIsValidBase(base: number): boolean {
    return 0 <= base && base < this._totalBases;
  }

  /**
   * Gets the lowest context coordinate that the input feature has.  Throws an error if the feature cannot be found.
   *
   * Note that if the feature is on the forward strand, the result will represent the feature's start.  Otherwise, it
   * represents the feature's end.
   *
   * @param {Feature} feature - the feature to find
   * @return {number} the lowest context coordinate of the feature
   * @throws {RangeError} if the feature is not in this context
   */
  getFeatureStart(feature: Feature): number {
    const coordinate = this._minCoordinateForFeature.get(feature);
    if (coordinate === undefined) {
      throw new RangeError(
        `Feature "${feature.getName()}" not in this navigation context`
      );
    } else {
      return coordinate;
    }
  }

  /**
   * Given a context coordinate, gets the feature in which it is located.  Returns a FeatureSegment that has 1 length,
   * representing a single base number relative to the feature's start.
   *
   * @param {number} base - the context coordinate to look up
   * @return {FeatureSegment} corresponding feature coordinate
   * @throws {RangeError} if the base is not in this context
   */
  convertBaseToFeatureCoordinate(base: number): FeatureSegment {
    if (!this.getIsValidBase(base)) {
      throw new RangeError(
        `Base number ${base} is invalid.  Valid bases in this context: [0, ${this.getTotalBases()})`
      );
    }

    // Index of the feature that contains the context coordinate
    const index = _.sortedLastIndex(this._sortedFeatureStarts, base) - 1;
    const feature = this._features[index];
    const coordinate = base - this._sortedFeatureStarts[index];
    return new FeatureSegment(feature, coordinate, coordinate + 1);
  }

  /**
   * Given a segment of a feature from this navigation context, gets the context coordinates the segment occupies.
   *
   * @param {FeatureSegment} segment - feature segment from this context
   * @return {OpenInterval} context coordinates the feature segment occupies
   */
  convertFeatureSegmentToContextCoordinates(
    segment: FeatureSegment
  ): OpenInterval {
    segment = this._flipIfReverseStrand(segment);
    const contextStart = this.getFeatureStart(segment.feature);
    return new OpenInterval(
      contextStart + segment.relativeStart,
      contextStart + segment.relativeEnd
    );
  }

  /**
   * Converts genome coordinates to an interval of context coordinates.  Since coordinates can map
   * to multiple features, or none at all, this method returns a list of OpenInterval.
   *
   * @param {ChromosomeInterval} chrInterval - genome interval
   * @return {OpenInterval[]} intervals of context coordinates
   */
  convertGenomeIntervalToBases(
    chrInterval: ChromosomeInterval
  ): OpenInterval[] {
    const potentialOverlaps = this._featuresForChr[chrInterval.chr] || [];
    const contextIntervals = [];
    for (const feature of potentialOverlaps) {
      const overlap = new FeatureSegment(feature).getGenomeOverlap(chrInterval);
      if (overlap) {
        contextIntervals.push(
          this.convertFeatureSegmentToContextCoordinates(overlap)
        );
      }
    }
    return contextIntervals;
  }

  /**
   * Converts a context coordinate to one that ignores gaps in this instance.  Or, put another way, if we removed all
   * gaps in this instance, what would be the context coordinate of `base` be?
   *
   * @example
   * navContext = [10bp feature, 10bp gap, 10bp feature]
   * navContext.toGaplessCoordinate(5); // Returns 5
   * navContext.toGaplessCoordinate(15); // Returns 10
   * navContext.toGaplessCoordinate(25); // Returns 15
   *
   * @param {number} base - the context coordinate to convert
   * @return {number} context coordinate if gaps didn't exist
   */
  toGaplessCoordinate(base: number): number {
    const featureCoordinate = this.convertBaseToFeatureCoordinate(base);
    const featureIndex = this._features.findIndex(
      (feature) => feature === featureCoordinate.feature
    );
    const gapFeaturesBefore = this._features
      .slice(0, featureIndex)
      .filter(NavigationContext.isGapFeature);
    let gapBasesBefore = _.sumBy(gapFeaturesBefore, (feature) =>
      feature.getLength()
    );
    if (NavigationContext.isGapFeature(featureCoordinate.feature)) {
      gapBasesBefore += featureCoordinate.relativeStart;
    }
    return base - gapBasesBefore;
  }

  /**
   * Parses a location in this navigation context. Should be formatted like "$chrName:$startBase-$endBase" OR
   * "$featureName". Supports multi-chromosome intervals like "chr7:154900269-chr8:1379003".
   * Also supports whitespace-separated formats like "chr7 154900269 chr8 1379003".
   *
   * Returns an open interval of context coordinates. Throws RangeError on parse failure.
   *
   * @param {string} str - the string to parse
   * @return {OpenInterval} the context coordinates represented by the string
   * @throws {RangeError} when parsing an interval outside of the context or something otherwise nonsensical
   */
  parse(str: string): OpenInterval {
    // convert string into standard format
    // Pattern: "chr7   154900269 chr8    1379003" -> "chr7:154900269-chr8:1379003"
    // Pattern: "chr7 27103672 27424040" -> "chr7:27103672-27424040"
    let normalizedStr = str.trim();

    // check for whitespace multi-chromosome format: "chr7 154900269 chr8 1379003"
    // or gene format: "CYP4A22 1 CYP1A2 7763"
    const multiChrWhitespacePattern =
      /^(\S+)\s+(\d+\.?\d*)\s+(\S+)\s+(\d+\.?\d*)$/;
    const multiChrMatch = normalizedStr.match(multiChrWhitespacePattern);

    if (multiChrMatch) {
      // convert "chr7 154900269 chr8 1379003" to "chr7:154900269-chr8:1379003"
      normalizedStr = `${multiChrMatch[1]}:${multiChrMatch[2]}-${multiChrMatch[3]}:${multiChrMatch[4]}`;
    } else {
      // single chromosome whitespace format: "chr7 27103672 27424040"
      const singleChrWhitespacePattern = /^(\S+)\s+(\d+\.?\d*)\s+(\d+\.?\d*)$/;
      const singleChrMatch = normalizedStr.match(singleChrWhitespacePattern);

      if (singleChrMatch) {
        // convert "chr7 27103672 27424040" to "chr7:27103672-27424040"
        normalizedStr = `${singleChrMatch[1]}:${singleChrMatch[2]}-${singleChrMatch[3]}`;
      }
    }

    // check if the input contains multiple chromosome intervals
    // Multi-chromosome format: "chr7:154900269-chr8:1379003" or "CYP4A22:1-CYP1A2:7763"
    // Single chromosome format: "chr7:27103672.064926386-27424040.064926386"
    const segments = normalizedStr.split("-");
    const isMultiChromosome =
      segments.length === 2 &&
      segments[0].includes(":") &&
      segments[1].includes(":");

    if (isMultiChromosome) {
      const startChromosomePart = segments[0]; // eg, "chr7:154900269" or "CYP4A22:1"
      const endChromosomePart = segments[1]; // eg, "chr10:1379003" or "CYP1A2:7763"

      const [startChr, startPosStr] = startChromosomePart.split(":");
      const [endChr, endPosStr] = endChromosomePart.split(":");
      const startPos = Math.round(
        parseFloat(startPosStr.replace(/[^0-9.]/g, ""))
      );
      const endPos = Math.round(parseFloat(endPosStr.replace(/[^0-9.]/g, "")));

      // find features by chromosome name first, then by feature name
      let startFeature: any = this._featuresForChr[startChr]?.[0];
      let endFeature: any = this._featuresForChr[endChr]?.[0];

      //  try finding by feature name
      if (!startFeature) {
        startFeature = this._features.find((f) => f.getName() === startChr);
      }
      if (!endFeature) {
        endFeature = this._features.find((f) => f.getName() === endChr);
      }

      if (!startFeature || !endFeature) {
        throw new RangeError(
          "One or more features unavailable in this context"
        );
      }

      // get chromosome or gene names eg, chr1, CYP1A2
      const isStandardChromosome =
        startChr.startsWith("chr") && endChr.startsWith("chr");

      const intervals: OpenInterval[] = [];

      // for gene names, we need to convert to actual chromosome coordinates
      // for chromosomes, we can use them directly
      let startInterval: string;
      if (isStandardChromosome) {
        startInterval = `${startChr}:${startPos}-${
          startFeature.getLocus().end
        }`;
      } else {
        // for gene features, use the actual chromosome from the locus
        const startLocus = startFeature.getLocus();
        const actualStartPos = startLocus.start + startPos;
        startInterval = `${startLocus.chr}:${actualStartPos}-${startLocus.end}`;
      }

      const startContextCoords = this.convertGenomeIntervalToBases(
        ChromosomeInterval.parse(startInterval)
      )[0];
      if (startContextCoords) {
        intervals.push(startContextCoords);
      }

      if (isStandardChromosome) {
        const startChrNum = parseInt(startChr.replace("chr", ""));
        const endChrNum = parseInt(endChr.replace("chr", ""));

        // add all complete chromosomes in between
        for (let chrNum = startChrNum + 1; chrNum < endChrNum; chrNum++) {
          const chrName = `chr${chrNum}`;
          const chrFeature = this._featuresForChr[chrName]?.[0];
          if (chrFeature) {
            const chrInterval = `${chrName}:${chrFeature.getLocus().start}-${
              chrFeature.getLocus().end
            }`;
            const chrContextCoords = this.convertGenomeIntervalToBases(
              ChromosomeInterval.parse(chrInterval)
            )[0];
            if (chrContextCoords) {
              intervals.push(chrContextCoords);
            }
          }
        }

        // add the ending chromosome interval (from start of chromosome to endPos)
        if (startChrNum !== endChrNum) {
          const endInterval = `${endChr}:${
            endFeature.getLocus().start
          }-${endPos}`;
          const endContextCoords = this.convertGenomeIntervalToBases(
            ChromosomeInterval.parse(endInterval)
          )[0];
          if (endContextCoords) {
            intervals.push(endContextCoords);
          }
        }
      } else {
        // for gene names or non-standard features, just handle start and end
        if (startChr !== endChr) {
          // for gene features, use actual chromosome coordinates
          const endLocus = endFeature.getLocus();
          const actualEndPos = endLocus.start + endPos;
          const endInterval = `${endLocus.chr}:${endLocus.start}-${actualEndPos}`;
          const endContextCoords = this.convertGenomeIntervalToBases(
            ChromosomeInterval.parse(endInterval)
          )[0];
          if (endContextCoords) {
            intervals.push(endContextCoords);
          }
        }
      }

      if (intervals.length === 0) {
        throw new RangeError("No valid intervals found in this context");
      }

      const overallStart = Math.min(
        ...intervals.map((interval) => interval.start)
      );
      const overallEnd = Math.max(...intervals.map((interval) => interval.end));

      return new OpenInterval(overallStart, overallEnd);
    }

    const feature = this._features.find(
      (feature) => feature.getName() === normalizedStr
    );
    if (feature) {
      const contextCoords = this.convertFeatureSegmentToContextCoordinates(
        new FeatureSegment(feature)
      );
      const center = 0.5 * (contextCoords.start + contextCoords.end);
      return new OpenInterval(center - 3, center + 3);
    }

    // coord within a single chromosome ------------------
    if (normalizedStr.includes(":") && normalizedStr.includes("-")) {
      const [chrPart, rangePart] = normalizedStr.split(":");
      const [startStr, endStr] = rangePart.split("-");
      const startPos = Math.round(parseFloat(startStr.replace(/[^0-9.]/g, "")));
      const endPos = Math.round(parseFloat(endStr.replace(/[^0-9.]/g, "")));

      // Format with space for ChromosomeInterval.parse compatibility
      const cleanedStr = `${chrPart} ${startPos} ${endPos}`;

      const locus = ChromosomeInterval.parse(cleanedStr);
      const contextCoordsArray = this.convertGenomeIntervalToBases(locus);

      if (contextCoordsArray.length === 0) {
        const availableChrs = Object.keys(this._featuresForChr)
          .slice(0, 10)
          .join(", ");
      } else {
        return contextCoordsArray[0];
      }
    }

    try {
      const cleanedStr = normalizedStr.replace(/[^0-9:-]/g, "");
      const locus = ChromosomeInterval.parse(cleanedStr);

      const contextCoordsArray = this.convertGenomeIntervalToBases(locus);
      if (contextCoordsArray.length === 0) {
        const availableChrs = Object.keys(this._featuresForChr)
          .slice(0, 20)
          .join(", ");
        throw new RangeError(
          `Location unavailable. Available chromosomes: ${availableChrs}${
            Object.keys(this._featuresForChr).length > 20 ? "..." : ""
          }`
        );
      }
      return contextCoordsArray[0];
    } catch (error) {
      throw new RangeError(
        `Could not parse location "${str}". ${
          error instanceof Error ? error.message : ""
        }`
      );
    }
  }
  // below is the version from Vincent
  // parse(str: string): OpenInterval {
  //   const feature = this._features.find((feature) => feature.getName() === str);
  //   if (feature) {
  //     const contextCoords = this.convertFeatureSegmentToContextCoordinates(
  //       new FeatureSegment(feature)
  //     );
  //     const center = 0.5 * (contextCoords.start + contextCoords.end);
  //     // This is safe because of setRegion in DisplayedRegionModel
  //     return new OpenInterval(center - 3, center + 3);
  //   }

  //   let start, end;
  //   if (str.split(`:`).length === 3) {
  //     /**
  //      * Support for multi-chr viewRegion str inputs, assuming form: "chra:b-chrc:d"
  //      */
  //     const segments = str.split("-");
  //     const start1 = Number(segments[0].split(`:`)[1]);
  //     const end1 = Number(segments[1].split(`:`)[1]);
  //     const endChr = Number(segments[1].split(`:`)[0].split(`r`)[1]);
  //     const miniIntStart = `${segments[0]}-${start1 + 4}`;
  //     const miniIntEnd = `chr${endChr}:${end1 - 4}-${end1}`;
  //     const startInt = ChromosomeInterval.parse(miniIntStart);
  //     const endInt = ChromosomeInterval.parse(miniIntEnd);
  //     const contextCoordsStart = this.convertGenomeIntervalToBases(startInt)[0];
  //     const contextCoordsEnd = this.convertGenomeIntervalToBases(endInt)[0];
  //     start = contextCoordsStart.start;
  //     end = contextCoordsEnd.end;
  //   } else if (str.split(`:`).length === 2) {
  //     const locus = ChromosomeInterval.parse(str);
  //     const contextCoords = this.convertGenomeIntervalToBases(locus)[0];
  //     start = contextCoords.start;
  //     end = contextCoords.end;
  //   } else {
  //     throw new RangeError("Interval of incorrect formatting");
  //   }

  //   // creates open interval based on the start of the first chr segment and the end of the last chr segment
  //   // can assume no gaps
  //   const contextCoords = new OpenInterval(start, end);
  //   if (!contextCoords) {
  //     throw new RangeError("Location unavailable in this context");
  //   } else {
  //     return contextCoords;
  //   }
  // }

  /**
   * Queries features that overlap an open interval of context coordinates.  Returns a list of FeatureSegment.
   *
   * @param {number} queryStart - (inclusive) start of interval, as a context coordinate
   * @param {number} queryEnd - (exclusive) end of interval, as a context coordinate
   * @param {boolean} [includeGaps] - whether to include gaps in the results.  Default: true
   * @return {FeatureSegment[]} list of feature intervals
   */
  getFeaturesInInterval(
    queryStart: number,
    queryEnd: number,
    includeGaps = true
  ): FeatureSegment[] {
    const queryInterval = new OpenInterval(queryStart, queryEnd);
    const results = [];
    for (const feature of this._features) {
      // Check each feature for overlap with the query interval
      if (!includeGaps && NavigationContext.isGapFeature(feature)) {
        continue;
      }
      const start = this.getFeatureStart(feature);
      const end = start + feature.getLength(); // Noninclusive
      const overlap = new OpenInterval(start, end).getOverlap(queryInterval);

      if (overlap) {
        const relativeStart = overlap.start - start;
        const relativeEnd = overlap.end - start;
        const segment = new FeatureSegment(feature, relativeStart, relativeEnd);
        results.push(this._flipIfReverseStrand(segment));
      } else if (results.length > 0) {
        // No overlap
        // Since features are sorted by start, we can be confident that there will be no more overlaps if we
        // have seen overlaps before.
        break;
      }
    }
    return results;
  }

  /**
   * Queries genomic locations that overlap an open interval of context coordinates.  The results are guaranteed to
   * not overlap each other.
   *
   * @param {number} queryStart - (inclusive) start of interval, as a context coordinate
   * @param {number} queryEnd - (exclusive) end of interval, as a context coordinate
   * @return {ChromosomeInterval[]} list of genomic locations
   */
  getLociInInterval(queryStart: number, queryEnd: number) {
    const featureSegments = this.getFeaturesInInterval(
      queryStart,
      queryEnd,
      false
    );
    const loci = featureSegments.map((interval) => interval.getLocus());
    return ChromosomeInterval.mergeOverlaps(loci);
  }

  /**
   * check if a feature is in current context
   */
  hasFeatureWithName(queryFeature: Feature) {
    return this._features.some((feature) => feature.name === queryFeature.name);
  }
}

export default NavigationContext;
