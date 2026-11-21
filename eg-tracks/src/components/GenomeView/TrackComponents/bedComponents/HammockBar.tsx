import React from "react";
import { scaleLinear, ScaleLinear } from "d3-scale";
import { TranslatableG } from "../geneAnnotationTrackComponents/TranslatableG";
import { getFeatureIsReverseStrand } from "../../../../models/Feature";
import { getHammockScore } from "../../../../models/Hammock";
import { ScaleChoices } from "../../../../models/ScaleChoices";
import OpenInterval from "../../../../models/OpenInterval";

const TOP_PADDING = 2;
const MIN_BAR_HEIGHT = 1; // keeps zero-score items visible on the baseline

export interface HammockBarScale {
  /** score -> y pixel, max at the top (same orientation as numerical tracks) */
  scale: ScaleLinear<number, number>;
  /**
   * True when no item carries a non-zero score, so bar heights would say
   * nothing: items are then drawn as full-height boxes, without an axis.
   */
  isFlat: boolean;
}

/**
 * Builds the y scale of a hammock barplot, which also drives the legend axis.
 * With an auto scale the domain covers the scores of the items inside the view
 * window (all drawn items when no view window is given).
 *
 * @param {PlacedFeatureGroup[]} placements - arranged items of the track
 * @param {object} options - track options (yScale, yMax, yMin, scoreIndex)
 * @param {number} height - height of the track in pixels
 * @param {OpenInterval} [viewWindow] - visible x range of the drawn region
 */
export function computeHammockBarScale(
  placements: any[],
  options: any,
  height: number,
  viewWindow?: { start: number; end: number },
): HammockBarScale {
  let min = 0;
  let max = 0;
  let isFlat = false;
  if (options.yScale === ScaleChoices.FIXED) {
    max = Number(options.yMax);
    min = Number(options.yMin) || 0;
  } else {
    let maxInView = -Infinity;
    let minInView = Infinity;
    let maxOverall = -Infinity;
    let minOverall = Infinity;
    for (const group of placements || []) {
      for (const placement of group.placedFeatures || []) {
        const score = getHammockScore(placement.feature, options.scoreIndex);
        if (score === undefined) {
          continue;
        }
        maxOverall = Math.max(maxOverall, score);
        minOverall = Math.min(minOverall, score);
        const xSpan = placement.xSpan;
        if (
          !viewWindow ||
          (xSpan.end >= viewWindow.start && xSpan.start <= viewWindow.end)
        ) {
          maxInView = Math.max(maxInView, score);
          minInView = Math.min(minInView, score);
        }
      }
    }
    // No scored item inside the view window: fall back to everything drawn.
    const hasInView = Number.isFinite(maxInView);
    max = hasInView ? maxInView : maxOverall;
    min = hasInView ? minInView : minOverall;
    max = Number.isFinite(max) ? Math.max(max, 0) : 0;
    min = Number.isFinite(min) ? Math.min(min, 0) : 0;
    // Peak files are often exported with every score set to 0 (or with no
    // scores at all); zero-height bars would hide the items entirely.
    isFlat = max === 0 && min === 0;
  }
  if (!Number.isFinite(max) || !Number.isFinite(min) || max <= min) {
    max = min + 1; // keep the scale usable whatever the options say
  }
  const scale = scaleLinear()
    .domain([max, min])
    .range([TOP_PADDING, height])
    .clamp(true);
  return { scale, isFlat };
}

/**
 * Reduces the items of a barplot to what can actually be seen. Zoomed out, a
 * dense file puts many sub-pixel items on the same pixel column, where only
 * the tallest bar shows; drawing just that one keeps the number of SVG
 * elements bounded by the track's width instead of the file's size. Items at
 * least a pixel wide are all kept.
 *
 * @param {PlacedFeatureGroup[]} placements - arranged items of the track
 * @param {number} scoreIndex - which score the bars show
 * @return {PlacedFeatureGroup[]} a single group holding the items to draw
 */
export function thinHammockBars(placements: any[], scoreIndex: number = 0) {
  const kept: any[] = [];
  const tallestByColumn = new Map<number, { placement: any; size: number }>();
  for (const group of placements || []) {
    for (const placement of group.placedFeatures || []) {
      const { xSpan } = placement;
      if (xSpan.end - xSpan.start >= 1) {
        kept.push(placement);
        continue;
      }
      const column = Math.floor(xSpan.start);
      const size = Math.abs(
        getHammockScore(placement.feature, scoreIndex) ?? 0,
      );
      const tallest = tallestByColumn.get(column);
      if (!tallest || size > tallest.size) {
        tallestByColumn.set(column, { placement, size });
      }
    }
  }
  tallestByColumn.forEach(({ placement }) => kept.push(placement));
  return [{ row: 0, placedFeatures: kept }];
}

interface HammockBarProps {
  feature: any; // raw hammock record
  xSpan: OpenInterval;
  barScale: HammockBarScale;
  scoreIndex?: number;
  color?: string;
  reverseStrandColor?: string;
  onClick?: (event: React.MouseEvent<SVGGElement, MouseEvent>, feature: any) => void;
}

/**
 * One item of a hammock track in barplot mode: a bar spanning the item, as tall
 * as its score.
 */
function HammockBar({
  feature,
  xSpan,
  barScale,
  scoreIndex = 0,
  color = "blue",
  reverseStrandColor = "red",
  onClick = () => undefined,
}: HammockBarProps) {
  const width = Math.max(xSpan.end - xSpan.start, 1);
  const { scale, isFlat } = barScale;
  const score = getHammockScore(feature, scoreIndex) ?? 0;
  let y: number;
  let barHeight: number;
  if (isFlat) {
    const [top, bottom] = scale.range();
    y = top;
    barHeight = bottom - top;
  } else {
    const zeroY = scale(0);
    barHeight = Math.max(Math.abs(zeroY - scale(score)), MIN_BAR_HEIGHT);
    // Bars grow up from the zero line for positive scores, down for negative.
    y = score >= 0 ? zeroY - barHeight : zeroY;
  }
  const fill = getFeatureIsReverseStrand(feature, "hammock")
    ? reverseStrandColor
    : color;

  return (
    <TranslatableG onClick={(event: any) => onClick(event, feature)}>
      <rect
        x={xSpan.start}
        y={y}
        width={width}
        height={barHeight}
        fill={fill}
        fillOpacity={0.85}
      />
    </TranslatableG>
  );
}

export default HammockBar;
