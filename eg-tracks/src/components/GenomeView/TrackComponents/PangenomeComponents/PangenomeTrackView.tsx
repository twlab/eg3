import { useMemo } from "react";

import VisualizationContainer, {
  GRAPH_PART,
  pxPerBaseOf,
} from "./Visualization/VisualizationContainer";
import {
  PangenomeViewProvider,
  usePangenomeView,
} from "./Visualization/pangenomeViewState";
import {
  bandAxis,
  columnarModel,
  modelOf,
  placedModel,
} from "./Visualization/pangenomeModel";
import { linearModelOf } from "./Visualization/linearModel";
import type { LinearLane } from "./Visualization/linearModel";
import { linearAxis } from "./Visualization/linearAxis";
import type { ViewMode } from "./Visualization/pangenomeViewState";
import { TUBE_H } from "./Visualization/TubeMapView";
import { tubeStacks } from "./Visualization/tubeLayout";
import { compressedModel } from "./Visualization/compressedTube";
import {
  separatorBp,
  variantLayout,
  variantSegments,
} from "./Visualization/variantBubbles";
import type { DrawFrame } from "./Visualization/pangenomeModel";
import { hiddenDeletions, linearHeight } from "./Visualization/LinearView";
import type { TierAxis } from "./Visualization/barTiers";
import { legendRowsOf } from "./Visualization/legendRows";
import type { LegendRow } from "./Visualization/legendRows";
import { GRAPH_ROW_H, LANE_H, laneHeightOf } from "./Visualization/laneLayout";
import { tooWideOf } from "./fetchPangenomeData";
import ChromosomeInterval from "../../../../models/ChromosomeInterval";
import LinearDrawingModel from "../../../../models/LinearDrawingModel";

/* ══════════════════════════════════════════════════════════════════════════
   The pangenome graph as a track: the graph views, drawn on the band the
   graph's own fetch laid out (see fetchPangenomeData).

   That band is genomealign's primaryVisData - the reference with room let
   in for every longer allele, the window in the middle, every other track
   drawn to it. The graph views fit themselves to a DrawFrame instead: a
   stretch of reference coordinates across the band's pixels, and the
   window to show. This is the frame that puts each place in the layout on
   the pixel the band gives it, so the graph and the tracks under it agree.
   ══════════════════════════════════════════════════════════════════════════ */

/** How tall a part of the graph is drawn in the view the band was laid out
    for: the graph's own row, which is empty in linear view, or one
    haplotype's bar, which only linear view draws; and in tube and variants
    view the whole picture, which the graph's own track draws. Worked out
    as VisualizationContainer works it out. */
export function pangenomeTrackHeight(
  queryResult: any,
  part: string,
  view: ViewMode = "linear",
  primaryVisData?: any,
  tube?: { minBp: number | null; bases: number[] },
  variantGrouping = 0,
): number {
  /* Linear view, past the size limit: nothing was fetched, and each row
     keeps the height it has with a band (fetchPangenomeData). */
  if (view === "linear" && tooWideOf(queryResult)) {
    return part === GRAPH_PART ? GRAPH_ROW_H : laneHeightOf(0);
  }
  const model = modelOf(queryResult);
  if (!model) return 40;
  if (view !== "linear") {
    if (part !== GRAPH_PART) return LANE_H;
    if (view === "tube") {
      const tubeBase = columnarModel(model);
      const tubeModel =
        tube && tube.minBp !== null
          ? compressedModel(tubeBase, variantSegments(tubeBase, tube.minBp))
          : tubeBase;
      return tubeStacks(tubeModel, TUBE_H).height;
    }
    const frame = bandFrame(primaryVisData);
    const axis = frame ? bandAxis(model, frame) : null;
    if (!axis) return 40;
    /* Of the nodes with a place here, as the view draws them. */
    const placed = placedModel(model);
    const segments = variantSegments(
      placed,
      separatorBp(placed, variantGrouping, frame?.width ?? 0),
    );
    return variantLayout(segments, axis).height;
  }
  /* The linear view: one haplotype's rows, from the band placed on the
     reference (linearModel.ts). The graph's own row draws the ref bar,
     GRAPH_ROW_H tall. */
  const linear = linearModelOf(queryResult);
  if (!linear) return 40;
  if (part === GRAPH_PART) return GRAPH_ROW_H;
  const lanes = linear.lanes.filter((lane) => lane.isReference || lane.label === part);
  /* A haplotype with nothing in this band still holds a row's worth. */
  if (lanes.length < 2) return laneHeightOf(0);
  return linearHeight({ ...linear, lanes });
}

/** Each haplotype's hidden-deletion count by its lane, for each axis and
    window it was worked out for. */
const hiddenByLane = new WeakMap<LinearLane, Map<string, number>>();

/** The window on screen in the band's pixels: the one handed in, else the
    band's middle window, the axis's view. */
const windowPx = (axis: { viewFromPx: number; viewToPx: number }, viewWindow?: { start: number; end: number } | null): [number, number] =>
  viewWindow && Number.isFinite(viewWindow.start) && Number.isFinite(viewWindow.end) && viewWindow.end > viewWindow.start ? [viewWindow.start, viewWindow.end] : [axis.viewFromPx, axis.viewToPx];

/** What a haplotype's track legend says in linear view (PLAN-legend.md):
    `rows`, one per row of its lane, the stretch of the walk on screen
    (legendRows.ts); `note`, below a pixel a base, how many deletions on
    screen are too narrow to draw ("23 deletions too small to see",
    LinearView.tsx hiddenDeletions). Both follow the window: `viewWindow`
    is the window on screen in the band's pixels, as TrackFactory hands it
    on a pan; without one the band's middle window counts. Nothing on the
    graph's own row, nothing past the size limit, where no row is drawn. */
export function pangenomeLegendOf(
  queryResult: any,
  part: string,
  primaryVisData: any,
  viewWindow: { start: number; end: number } | null | undefined,
  legendWidth: number,
): { note?: string; rows?: LegendRow[] } {
  if (part === GRAPH_PART || tooWideOf(queryResult)) return {};
  const linear = linearModelOf(queryResult);
  if (!linear) return {};
  const lanes = linear.lanes.filter((lane) => lane.isReference || lane.label === part);
  const lane = lanes.find((candidate) => !candidate.isReference);
  if (!lane) return {};
  /* The axis the row is drawn on, as VisualizationContainer makes it. */
  const cut = { ...linear, lanes };
  const frame = bandFrame(primaryVisData);
  const axis = linearAxis(cut, frame, pxPerBaseOf(frame));
  const [fromPx, toPx] = windowPx(axis, viewWindow);
  const rows = legendRowsOf(lane.rows, axis.px, fromPx, toPx, legendWidth);
  const key = [axis.scale, axis.startBp, axis.endBp, fromPx, toPx].join(":");
  let known = hiddenByLane.get(lane);
  if (!known) hiddenByLane.set(lane, (known = new Map()));
  if (!known.has(key)) {
    const windowAxis: TierAxis = { scale: axis.scale, px: axis.px, startBp: axis.startBp, endBp: axis.endBp, viewFromPx: fromPx, viewToPx: toPx };
    known.set(key, hiddenDeletions(cut, windowAxis));
  }
  const n = known.get(key)!;
  return { rows, ...(n > 0 ? { note: `${n.toLocaleString()} deletion${n === 1 ? "" : "s"} too small to see` } : {}) };
}

/**
 * The frame for a gap-inflated band. The graph views read a frame's bases
 * as running evenly across it and fit the layout so the bases at its two
 * window edges land on those edges. So the edges are put where the band
 * draws two reference bases - the window's first and last - and between
 * them the room the band lets in is the room the layout makes, so every
 * place in the layout lands where the band puts it.
 *
 * Not the window's own edges: a gap at the window's first base is inside
 * the band's window (it starts where the gap does) but before that base in
 * the layout, and fitting on it stretched the graph against the band.
 */
export function bandFrame(primaryVisData: any): DrawFrame | undefined {
  const { visRegion, visWidth, viewWindowRegion } = primaryVisData ?? {};
  if (!(visWidth > 0) || !visRegion?.getNavigationContext) return undefined;
  if (!viewWindowRegion?.getGenomeIntervals) return undefined;
  const loci = viewWindowRegion.getGenomeIntervals();
  if (!loci.length) return undefined;
  const chr = loci[0].chr;
  const first = loci[0].start;
  const last = loci[loci.length - 1].end - 1;
  if (!(last > first)) return undefined;

  const navContext = visRegion.getNavigationContext();
  const drawModel = new LinearDrawingModel(visRegion, visWidth);
  const pxOf = (bp: number) => {
    const [at] = navContext.convertGenomeIntervalToBases(
      new ChromosomeInterval(chr, bp, bp + 1),
    );
    return at ? drawModel.baseToX(at.start) : null;
  };
  const fromPx = pxOf(first);
  const toPx = pxOf(last);
  if (fromPx === null || toPx === null || !(toPx > fromPx)) return undefined;

  const basesPerPx = (last - first) / (toPx - fromPx);
  const startBp = first - fromPx * basesPerPx;
  return {
    startBp,
    endBp: startBp + visWidth * basesPerPx,
    width: visWidth,
    viewFromPx: fromPx,
    viewToPx: toPx,
  };
}

/** A width in bases as the size limit says it: "150 kb". */
const kb = (bp: number) =>
  `${(bp / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} kb`;

export default function PangenomeTrackView({
  queryResult,
  primaryVisData,
  windowWidth,
  part,
  tube,
}: {
  queryResult: any;
  primaryVisData: any;
  windowWidth: number;
  /** The graph's own row, or a haplotype's bar: see VisualizationContainer. */
  part: string;
  /** The tube map the band was laid out for, in tube view: its grouping and
      its room ahead of each column, in bases. */
  tube?: { minBp: number | null; bases: number[] };
}) {
  const frame = useMemo(() => bandFrame(primaryVisData), [primaryVisData]);
  /* The room in pixels, at the band's own scale. */
  const tubeLayout = useMemo(() => {
    const width = primaryVisData?.visRegion?.getWidth?.();
    if (!tube || !(width > 0)) return undefined;
    const perBase = primaryVisData.visWidth / width;
    return { minBp: tube.minBp, gapsPx: tube.bases.map((b) => b * perBase) };
  }, [tube, primaryVisData]);
  /* Past the size limit nothing was fetched (fetchPangenomeData): each
     row says so, in a box the band's width, so a pan shows no blank
     stretch, with the words over the view; the graph's own row, which
     would draw the ref bar, in its own 16 px. That row still mounts the
     container, which draws nothing without a band but keeps the view's
     shared state told. */
  const tooWide = tooWideOf(queryResult);
  const graphRow = part === GRAPH_PART;
  const drawing = tooWide ? (
    <div style={{ position: "relative", width: frame?.width ?? windowWidth * 3, height: graphRow ? GRAPH_ROW_H : laneHeightOf(0) }}>
      <div
        className={`pgv-zoom-in${graphRow ? " pgv-zoom-in-ref" : ""}`}
        title={`${graphRow ? "The reference's nodes" : "Haplotypes"} are drawn for views of ${kb(tooWide.maxBp)} or less; this view is ${kb(tooWide.viewBp)}`}
      >
        <span
          style={{
            left: frame?.viewFromPx ?? windowWidth,
            width: frame ? frame.viewToPx - frame.viewFromPx : windowWidth,
          }}
        >
          {graphRow ? "Zoom in to see the reference's nodes" : "Zoom in to see haplotypes"}
        </span>
      </div>
      {graphRow && (
        <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, overflow: "hidden" }}>
          <VisualizationContainer
            isPrimary
            queryResult={queryResult}
            frame={frame}
            part={part}
            tubeLayout={tubeLayout}
          />
        </div>
      )}
    </div>
  ) : (
      <div style={{ width: frame?.width ?? windowWidth * 3 }}>
        <VisualizationContainer
          isPrimary={part === GRAPH_PART}
          queryResult={queryResult}
          frame={frame}
          part={part}
          tubeLayout={tubeLayout}
        />
      </div>
    );
  /* The view TrackManager holds, which its toolbar switches, when there is
     one; a provider of its own otherwise. */
  const held = usePangenomeView();
  return held ? (
    drawing
  ) : (
    <PangenomeViewProvider windowWidth={windowWidth}>{drawing}</PangenomeViewProvider>
  );
}
