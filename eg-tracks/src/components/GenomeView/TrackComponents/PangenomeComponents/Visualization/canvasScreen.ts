import { useEffect, useState } from "react";

/* ══════════════════════════════════════════════════════════════════════════
   A canvas drawn at the screen's own pixels.

   Shared by the linear view's bars and the tube map. Both paint a band three
   windows wide that has to come out sharp on whatever screen it is on, so
   both size the backing store to the exact number of screen pixels the
   browser gives the element, measure again when that changes, and shift the
   element onto whole screen pixels before drawing.
   ══════════════════════════════════════════════════════════════════════════ */

/** A canvas's size in the screen's own pixels. */
export interface ScreenSize {
  width: number;
  height: number;
}

/** A canvas fitted to the screen, ready to draw on. */
export interface FittedCanvas {
  ctx: CanvasRenderingContext2D;
  /** The backing store, in screen pixels. */
  pw: number;
  ph: number;
  /** Screen pixels per CSS pixel, across and down. */
  sx: number;
  sy: number;
}

/** The largest canvas every browser draws: Safari refuses a side past 16384,
    and none of them allow an area past this square. */
const SAFE_CANVAS_SIDE = 16384;
const MAX_CANVAS_AREA = SAFE_CANVAS_SIDE * SAFE_CANVAS_SIDE;
/** What Chrome, Edge and Firefox allow a side to be. */
const WIDE_CANVAS_SIDE = 32767;

let maxSide: number | null = null;

/**
 * The longest side a backing store may have in this browser, asked once.
 *
 * A band is three windows wide, so a wide window on a dense screen passes
 * Safari's 16384 - 11,052 CSS pixels at 2x needs 22,104 - and past the limit
 * the canvas is drawn less densely and stretched, every letter going soft.
 * Holding every browser to Safari's limit did that to all of them; the others
 * allow twice as much, and a probe is the only reliable way to know which one
 * this is. The probe draws a pixel at the far end and reads it back, since a
 * canvas past the limit fails silently rather than throwing.
 */
function maxCanvasSide(): number {
  if (maxSide !== null) return maxSide;
  maxSide = SAFE_CANVAS_SIDE;
  try {
    const probe = document.createElement("canvas");
    probe.width = WIDE_CANVAS_SIDE;
    probe.height = 1;
    const ctx = probe.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#000";
      ctx.fillRect(WIDE_CANVAS_SIDE - 1, 0, 1, 1);
      if (ctx.getImageData(WIDE_CANVAS_SIDE - 1, 0, 1, 1).data[3] !== 0) {
        maxSide = WIDE_CANVAS_SIDE;
      }
    }
    /* Given back at once rather than held until it is collected. */
    probe.width = 0;
    probe.height = 0;
  } catch {
    /* The safe limit stands. */
  }
  return maxSide;
}

/**
 * How many screen pixels a canvas covers, as the browser lays it out.
 *
 * `width * devicePixelRatio` is only close. At a fractional ratio - 125% and
 * 150% are the Windows defaults - the box snaps to whole screen pixels, and a
 * backing store sized from the product was stretched onto it by a fraction,
 * softening every edge and letter. The device-pixel content box is the exact
 * count, and the observer reports it again whenever it changes: a resize, a
 * browser zoom, the window moving to another screen.
 *
 * Safari has no device-pixel box, and a change of ratio moves no CSS box, so
 * there the ratio itself is watched and the size estimated from it.
 */
export function useScreenSize(ref: {
  readonly current: HTMLCanvasElement | null;
}): ScreenSize | null {
  const [screen, setScreen] = useState<ScreenSize | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const report = (w: number, h: number) =>
      setScreen((prev) =>
        prev && prev.width === w && prev.height === h
          ? prev
          : { width: w, height: h },
      );
    const estimate = () => {
      const box = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      report(Math.round(box.width * ratio), Math.round(box.height * ratio));
    };

    let exact = false;
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(([entry]) => {
            const box = entry.devicePixelContentBoxSize?.[0];
            if (box) {
              exact = true;
              report(box.inlineSize, box.blockSize);
            } else {
              estimate();
            }
          });
    try {
      observer?.observe(canvas, { box: "device-pixel-content-box" });
    } catch {
      observer?.observe(canvas);
    }

    let media: MediaQueryList | null = null;
    const onRatio = () => {
      media?.removeEventListener("change", onRatio);
      if (!exact) estimate();
      watchRatio();
    };
    /* A resolution query matches only the ratio it was made for, so it is
       made again for the new one each time it stops matching. */
    const watchRatio = () => {
      if (typeof window.matchMedia !== "function") return;
      media = window.matchMedia(
        `(resolution: ${window.devicePixelRatio || 1}dppx)`,
      );
      media.addEventListener("change", onRatio);
    };
    watchRatio();

    return () => {
      observer?.disconnect();
      media?.removeEventListener("change", onRatio);
    };
  }, [ref]);

  return screen;
}

/**
 * Sizes a canvas's backing store to the screen and lines the element up with
 * the screen's pixels. Null when the canvas cannot be drawn on.
 *
 * `nudge` carries the shift from the last call, so the next one can measure
 * where the canvas sits without it.
 */
export function fitCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  screen: ScreenSize | null,
  nudge: { current: number },
): FittedCanvas | null {
  /* The screen's pixels once the observer has measured this size - within
     a pixel of the ratio's guess, or it measured the size before - and the
     guess until then. */
  const ratio = window.devicePixelRatio || 1;
  const measured =
    screen &&
    Math.abs(screen.width - width * ratio) < 2 &&
    Math.abs(screen.height - height * ratio) < 2
      ? screen
      : null;
  let pw = measured ? measured.width : Math.round(width * ratio);
  let ph = measured ? measured.height : Math.round(height * ratio);
  /* At the screen's own density wherever the browser allows it, and only
     past its limit drawn less densely and stretched, rather than not at all. */
  const shrink = Math.min(
    1,
    maxCanvasSide() / Math.max(pw, ph),
    Math.sqrt(MAX_CANVAS_AREA / (pw * ph)),
  );
  pw = Math.max(1, Math.floor(pw * shrink));
  ph = Math.max(1, Math.floor(ph * shrink));
  if (canvas.width !== pw) canvas.width = pw;
  if (canvas.height !== ph) canvas.height = ph;

  /* Lined up with the screen's pixels. The band is moved in whole screen
     pixels, but where the page lays it out need not be whole, and a canvas
     left between two is resampled by the browser as a whole - every letter
     softened. The remainder is measured here and taken off. It holds while
     the band is dragged, since the drag moves in whole pixels, and is
     measured again whenever the canvas is drawn. */
  const left = canvas.getBoundingClientRect().left - nudge.current;
  nudge.current = Math.round(left * ratio) / ratio - left;
  canvas.style.transform =
    Math.abs(nudge.current) > 1e-6 ? `translateX(${nudge.current}px)` : "";

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  return { ctx, pw, ph, sx: pw / width, sy: ph / height };
}
