import { useMemo } from "react";

import VisualizationContainer, {
  GRAPH_PART,
} from "./Visualization/VisualizationContainer";
import { PangenomeViewProvider } from "./Visualization/pangenomeViewState";
import { buildModel } from "./Visualization/pangenomeModel";
import type { DrawFrame, PangenomeModel } from "./Visualization/pangenomeModel";
import { linearHeight } from "./Visualization/LinearPathView";
import { LANE_H } from "./Visualization/laneLayout";
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

/** How tall a part of the linear view of this graph is drawn: the graph
    strip, or one haplotype's bar (see VisualizationContainer). */
export function pangenomeTrackHeight(queryResult: any, part: string): number {
  const model = modelOf(queryResult);
  if (!model) return 40;
  const lanes = model.lanes.filter((lane) =>
    part === GRAPH_PART ? lane.isReference : !lane.isReference && lane.label === part,
  );
  /* A haplotype with nothing in this band still holds its row. */
  if (!lanes.length) return part === GRAPH_PART ? 40 : LANE_H;
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
}: {
  queryResult: any;
  primaryVisData: any;
  windowWidth: number;
  /** The graph strip, or a haplotype's bar: see VisualizationContainer. */
  part: string;
}) {
  const frame = useMemo(() => bandFrame(primaryVisData), [primaryVisData]);
  return (
    <PangenomeViewProvider windowWidth={windowWidth}>
      <div style={{ width: frame?.width ?? windowWidth * 3 }}>
        <VisualizationContainer
          isPrimary
          queryResult={queryResult}
          frame={frame}
          part={part}
        />
      </div>
    </PangenomeViewProvider>
  );
}
