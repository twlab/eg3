/**
 * Serialization for the scales drawValuePlot needs.
 *
 * computeScales in NumericalTrack returns d3 scaleLinear objects. Those are
 * functions, so structuredClone rejects them and they cannot be posted to a
 * worker. Only the domain, range and clamp flag carry any information, so the
 * spec below is the whole scale in plain numbers, and fromScaleSpec rebuilds
 * working scale functions on the other side.
 *
 * Only the four scales drawValuePlot actually calls are carried. axisScale and
 * zeroLine stay on the main thread — they drive the legend and layout, not the
 * plot.
 */

import { scaleLinear } from "d3-scale";

export interface LinearScaleSpec {
  domain: number[];
  range: number[];
  clamp: boolean;
}

export interface ValuePlotScaleSpec {
  max: number;
  min: number;
  valueToY: LinearScaleSpec;
  valueToYReverse: LinearScaleSpec;
  valueToOpacity: LinearScaleSpec;
  valueToOpacityReverse: LinearScaleSpec;
}

const CARRIED_SCALES = [
  "valueToY",
  "valueToYReverse",
  "valueToOpacity",
  "valueToOpacityReverse",
] as const;

function specOf(scale: any): LinearScaleSpec {
  return {
    domain: scale.domain().slice(),
    range: scale.range().slice(),
    clamp: scale.clamp(),
  };
}

function scaleOf(spec: LinearScaleSpec) {
  return scaleLinear().domain(spec.domain).range(spec.range).clamp(spec.clamp);
}

/** Flatten the live scales object into something structuredClone accepts. */
export function toScaleSpec(scales: any): ValuePlotScaleSpec {
  const spec: any = { max: scales.max, min: scales.min };
  for (const name of CARRIED_SCALES) {
    spec[name] = specOf(scales[name]);
  }
  return spec as ValuePlotScaleSpec;
}

/**
 * Rebuild callable scales from a posted spec. The result is shape-compatible
 * with what drawValuePlot expects, so the drawing code needs no changes to run
 * against a deserialized scale set.
 */
export function fromScaleSpec(spec: ValuePlotScaleSpec): any {
  const scales: any = { max: spec.max, min: spec.min };
  for (const name of CARRIED_SCALES) {
    scales[name] = scaleOf(spec[name]);
  }
  return scales;
}
