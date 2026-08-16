/**
 * Direct canvas drawing for numerical tracks.
 *
 * Replaces the element-tree round trip that DesignRenderer's canvas path takes:
 * previously every pixel column of the 3-window band became a React <rect>
 * element (allocated, walked once by drawOneElement, then thrown away — those
 * elements are never mounted), and each one issued its own fillStyle assignment
 * and fillRect call. At a 1500px window that is ~4500 elements and ~4500 native
 * canvas calls per track per draw.
 *
 * Here the values are read straight from xToValue and geometry is accumulated
 * into a Path2D per distinct fill, so a whole track costs a handful of native
 * calls and allocates nothing per column.
 *
 * Deliberately kept free of DOM and React references: it takes a context and
 * plain data, which is the shape this would need to be in to move to a worker
 * with OffscreenCanvas later.
 */

const THRESHOLD_HEIGHT = 5;

/**
 * Alpha steps for heatmap mode. Opacity varies continuously per column, so
 * without bucketing there is nothing to batch. 64 levels keeps the batching
 * (at most 64 fill calls instead of one per column) while quantizing alpha
 * finely enough to be indistinguishable on 1px columns.
 */
const HEATMAP_ALPHA_LEVELS = 64;

export interface ValuePlotDrawArgs {
  xToValue: Array<number | null | undefined>;
  scales: any;
  height: number;
  color: string;
  colorOut: string;
  isDrawingBars: boolean;
}

function getPixelRatioSafely(): number {
  const pixelRatio = window.devicePixelRatio;
  return Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1;
}

/**
 * Sizes the canvas for the device pixel ratio and draws the plot. Assigning
 * width/height resets the 2D context (transform included), so the scale is
 * applied after sizing, never before.
 */
export function drawValuePlot(
  canvas: HTMLCanvasElement,
  args: ValuePlotDrawArgs,
) {
  const { xToValue, height } = args;
  const width = xToValue.length;
  const pixelRatio = getPixelRatioSafely();

  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  canvas.width = Math.max(0, Math.round(width * pixelRatio));
  canvas.height = Math.max(0, Math.round(height * pixelRatio));

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  ctx.scale(pixelRatio, pixelRatio);
  ctx.clearRect(0, 0, width, height);

  if (args.isDrawingBars) {
    drawBars(ctx, args);
  } else {
    drawHeatmap(ctx, args);
  }
}

/**
 * Bar mode has only two fills — the bar color and the out-of-range tip color —
 * so the entire track is two fill() calls. Adjacent columns with identical
 * geometry are merged into one wider rect, which collapses flat and sparse
 * regions hard and costs nothing on noisy data.
 */
function drawBars(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  { xToValue, scales, height, color, colorOut }: ValuePlotDrawArgs,
) {
  const mainPath = new Path2D();
  const outPath = new Path2D();

  let runX = 0;
  let runW = 0;
  let runY = 0;
  let runH = 0;

  function flushRun() {
    if (runW > 0) {
      mainPath.rect(runX, runY, runW, runH);
      runW = 0;
    }
  }

  for (let x = 0; x < xToValue.length; x++) {
    const value = xToValue[x];
    if (!value || Number.isNaN(value)) {
      flushRun();
      continue;
    }

    const y =
      value > 0 ? scales.valueToY(value) : scales.valueToYReverse(value);
    let drawY = value > 0 ? y : 0;
    let drawHeight = value > 0 ? height - y : y;

    if (drawHeight <= 0) {
      flushRun();
      continue;
    }

    if (value > scales.max || value < scales.min) {
      drawHeight -= THRESHOLD_HEIGHT;
      if (value > scales.max) {
        outPath.rect(x, y, 1, THRESHOLD_HEIGHT);
        drawY += THRESHOLD_HEIGHT;
      } else {
        outPath.rect(x, drawHeight, 1, THRESHOLD_HEIGHT);
      }
    }

    if (runW > 0 && x === runX + runW && drawY === runY && drawHeight === runH) {
      runW += 1;
    } else {
      flushRun();
      runX = x;
      runW = 1;
      runY = drawY;
      runH = drawHeight;
    }
  }
  flushRun();

  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.fill(mainPath);
  ctx.fillStyle = colorOut;
  ctx.fill(outPath);
}

/**
 * Heatmap mode draws every column full height in one color, varying only
 * opacity, so columns are bucketed by quantized alpha and each bucket is filled
 * once. fillStyle is set exactly once for the whole track.
 */
function drawHeatmap(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  { xToValue, scales, height, color }: ValuePlotDrawArgs,
) {
  const paths: Array<Path2D | undefined> = new Array(HEATMAP_ALPHA_LEVELS + 1);

  let runLevel = -1;
  let runX = 0;
  let runW = 0;

  function flushRun() {
    if (runW > 0) {
      let path = paths[runLevel];
      if (!path) {
        path = new Path2D();
        paths[runLevel] = path;
      }
      path.rect(runX, 0, runW, height);
      runW = 0;
    }
  }

  for (let x = 0; x < xToValue.length; x++) {
    const value = xToValue[x];
    if (!value || Number.isNaN(value)) {
      flushRun();
      continue;
    }

    const opacity =
      value > 0
        ? scales.valueToOpacity(value)
        : scales.valueToOpacityReverse(value);
    // Matches the original: a computed opacity of exactly 0 was drawn fully
    // opaque rather than invisible.
    const fillOpacity = opacity === 0 ? 1 : opacity;
    const level = Math.max(
      0,
      Math.min(
        HEATMAP_ALPHA_LEVELS,
        Math.round(fillOpacity * HEATMAP_ALPHA_LEVELS),
      ),
    );

    if (runW > 0 && level === runLevel && x === runX + runW) {
      runW += 1;
    } else {
      flushRun();
      runLevel = level;
      runX = x;
      runW = 1;
    }
  }
  flushRun();

  ctx.fillStyle = color;
  for (let level = 0; level <= HEATMAP_ALPHA_LEVELS; level++) {
    const path = paths[level];
    if (!path) {
      continue;
    }
    ctx.globalAlpha = level / HEATMAP_ALPHA_LEVELS;
    ctx.fill(path);
  }
  ctx.globalAlpha = 1;
}
