import { useMemo } from "react";

import VisualizationContainer, {
  GRAPH_PART,
} from "./Visualization/VisualizationContainer";
import {
  PangenomeViewProvider,
  usePangenomeView,
} from "./Visualization/pangenomeViewState";
import {
  bandAxis,
  buildModel,
  columnarModel,
  placedModel,
} from "./Visualization/pangenomeModel";
import type { ViewMode } from "./Visualization/pangenomeViewState";
import { TUBE_H } from "./Visualization/TubeMapView";
import { tubeStacks } from "./Visualization/tubeLayout";
import { compressedModel } from "./Visualization/compressedTube";
import {
  separatorBp,
  variantLayout,
  variantSegments,
} from "./Visualization/variantBubbles";
import type { DrawFrame, PangenomeModel } from "./Visualization/pangenomeModel";
import { linearHeight } from "./Visualization/LinearPathView";
import { BAR_H, LANE_H } from "./Visualization/laneLayout";
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

/* A model per fetched graph: the height is needed before the drawing makes
   its own. */
const models = new WeakMap<object, PangenomeModel | null>();
function modelOf(queryResult: any): PangenomeModel | null {
  if (!queryResult || typeof queryResult !== "object") return null;
  if (!models.has(queryResult)) models.set(queryResult, buildModel(queryResult));
  return models.get(queryResult) ?? null;
}

/** How tall a part of the graph is drawn in the view the band was laid out
    for: the graph strip, or one haplotype's bar - which only linear view
    draws - and in tube and variants view the whole picture, which the strip's
    track draws. Worked out as VisualizationContainer works it out. */
export function pangenomeTrackHeight(
  queryResult: any,
  part: string,
  view: ViewMode = "linear",
  primaryVisData?: any,
  tube?: { minBp: number | null; bases: number[] },
  variantGrouping = 0,
): number {
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
  const lanes = model.lanes.filter((lane) =>
    part === GRAPH_PART ? lane.isReference : !lane.isReference && lane.label === part,
  );
  /* A haplotype with nothing in this band still holds its row. */
  if (!lanes.length) return part === GRAPH_PART ? 40 : BAR_H;
  return linearHeight({ ...model, lanes }, false, part === GRAPH_PART);
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
  /** The graph strip, or a haplotype's bar: see VisualizationContainer. */
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
  const drawing = (
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
