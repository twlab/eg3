import type { BandAxis, DrawFrame } from "./pangenomeModel";
import type { LinearModel } from "./linearModel";

/* ══════════════════════════════════════════════════════════════════════════
   How the linear view converts between reference bases and pixels.

   The reference walk's coordinates are the axis and nothing stretches it,
   so this is one scale and one origin: the band's first base at x = 0 and
   every other base so many pixels on. With a band to fill (a DrawFrame) the
   scale is the band's; without one the drawing lays itself out at the
   pixels a base it was given.
   ══════════════════════════════════════════════════════════════════════════ */

export interface LinearAxis {
  /** The base at x = 0, and the base past x = width. */
  startBp: number;
  endBp: number;
  width: number;
  /** Pixels a base. */
  scale: number;
  /** The slice of the band on screen. */
  viewFromPx: number;
  viewToPx: number;
  px: (bp: number) => number;
  bpAt: (px: number) => number;
}

export function linearAxis(
  model: LinearModel,
  frame: DrawFrame | undefined,
  pxPerBase: number,
): LinearAxis {
  if (frame && frame.endBp > frame.startBp && frame.width > 0) {
    const { startBp, endBp, width } = frame;
    const scale = width / (endBp - startBp);
    return {
      startBp,
      endBp,
      width,
      scale,
      viewFromPx: frame.viewFromPx,
      viewToPx: frame.viewToPx,
      px: (bp) => (bp - startBp) * scale,
      bpAt: (x) => startBp + x / scale,
    };
  }
  const scale = pxPerBase > 0 ? pxPerBase : 1;
  const width = (model.end - model.origin) * scale;
  return {
    startBp: model.origin,
    endBp: model.end,
    width,
    scale,
    viewFromPx: 0,
    viewToPx: width,
    px: (bp) => (bp - model.origin) * scale,
    bpAt: (x) => model.origin + x / scale,
  };
}

/** The same axis in the shape the pan hands between bands. Layout units
    are reference bases now, so the two conversions are one. */
export function toBandAxis(axis: LinearAxis): BandAxis {
  return {
    scale: axis.scale,
    originX: axis.startBp,
    px: axis.px,
    pxAtBp: axis.px,
    bpAtPx: axis.bpAt,
  };
}
