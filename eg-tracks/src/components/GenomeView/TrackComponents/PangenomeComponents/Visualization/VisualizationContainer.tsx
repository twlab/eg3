import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  bandAxis,
  columnarModel,
  modelOf,
  oneLanePerHaplotype,
  placedModel,
} from "./pangenomeModel";
import LinearPathView, { linearHeight } from "./LinearPathView";
import type { BandAxis, PangenomeModel } from "./pangenomeModel";
import type { DrawFrame } from "./pangenomeModel";
import type { HoverTarget } from "./LinearPathView";
import TubeMapView, { TUBE_H } from "./TubeMapView";
import { tubeAxis, tubeStacks } from "./tubeLayout";
import NodeGraphView from "./NodeGraphView";
import {
  boxFills,
  boxLabels,
  boxSegment,
  compressedModel,
} from "./compressedTube";
import VariantCard from "./VariantCard";
import VariantBubbleView from "./VariantBubbleView";
import {
  separatorBp,
  variantDeletions,
  variantLayout,
  variantSegments,
} from "./variantBubbles";
import {
  DEFAULT_GAP_SCALE,
  SEQUENCE_ZOOM,
  usePangenomeView,
} from "./pangenomeViewState";
import "./pangenomeVisualization.css";

/**
 * A length that follows the zoom, for the settings left on auto: the
 * largest of 2, 5, 10, 20, 50, 100… not over `bp`, and never under 2. In
 * steps rather than smoothly, so a zoom only redoes the work behind it when
 * it crosses one.
 */
function autoBp(bp: number): number {
  let step = 2;
  for (let unit = 1; unit <= bp; unit *= 10) {
    for (const m of [1, 2, 5]) {
      if (m * unit >= 2 && m * unit <= bp) step = m * unit;
    }
  }
  return step;
}

/* ══════════════════════════════════════════════════════════════════════════
   Two renderings of one subgraph, after Eizenga et al. 2020, "Pangenome
   Graphs" (Annu Rev Genomics Hum Genet 21:139-162), figure 2:

     "linear"  - panel c, vg viz's linearized rendering at base-level detail
     "tube"    - panel d, the Sequence Tube Map's view of the same fragment

   Both are driven by the same layout (see pangenomeModel.ts), so switching
   between them keeps the coordinates, the colours and the highlighted
   haplotype in place.

   Only the drawing lives here.  The toolbar, the legend and the detail bar
   are chrome for the whole view, so VisualManager mounts them once and
   shares their state through pangenomeViewState; this component is mounted
   once per fetched window and reads that state.

   The tooltip is written straight into the DOM rather than held in state.
   It follows the pointer, so it changes with every mouse event, and a state
   change here re-renders the whole drawing - fourteen hundred SVG elements
   to move one small box. React diffs that down to almost no DOM writes, so it was
   never wrong, only wasteful: about 1.5 ms of every pointer event in a
   development build, spent re-deriving a picture that did not change.
   ══════════════════════════════════════════════════════════════════════════ */

interface VisualizationContainerProps {
  queryResult: any;
  selectedNode?: string | null;
  setSelectedNode?: (n: string | null) => void;
  height?: number;
  /** The band the drawing has to fill, so a pixel is a fixed run of bases. */
  frame?: DrawFrame;
  /* How this band converts between the reference and its own pixels.
     Two neighbouring bands disagree, so whoever pans between them needs
     to hear from each. */
  /* Told with it how tall the drawing came out, because the surface above
     has to reserve the room: the band is absolutely positioned, so it adds
     nothing to the height of anything containing it. */
  /* And, when the same data has just been drawn again to a different
     scale, the axis it was drawn with until then. */
  onBandMapped?: (
    axis: BandAxis | null,
    drawnHeight: number,
    redrawnFrom: BandAxis | null,
  ) => void;
  /** The centre window, the one the shared chrome describes. */
  isPrimary?: boolean;
  /** Told the model, axis and band this draws with, so tracks along an alt
      path can be laid where the graph draws that path. */
  onBandModel?: (model: PangenomeModel, axis: BandAxis, frame: DrawFrame) => void;
  /** Which part of the linear view to draw, when the graph is laid out as
      track rows: `GRAPH_PART` for the graph strip, or a haplotype's
      `sample#haplotype` for its bar alone. Everything when absent. */
  part?: string;
  /** The tube map the band was laid out for (see fetchPangenomeData): the
      grouping it used - null for every node - and its gaps in pixels, column
      by column. Drawn with these, the tubes land where the band's other
      tracks are. */
  tubeLayout?: { minBp: number | null; gapsPx: number[] };
  /** Accepted so existing callers keep type-checking; unused by these views. */
  viewport?: any;
  setViewport?: (v: any) => void;
}

/** The `part` that is the graph strip rather than a haplotype's bar. */
export const GRAPH_PART = "graph";

/** Room left for the tooltip so it does not run off the right of the window. */
const TOOLTIP_W = 260;
const POINTER_GAP = 14;
/** Kept clear of the window's edges. */
const EDGE = 8;

export default function VisualizationContainer({
  queryResult,
  frame,
  onBandMapped,
  height = 600,
  isPrimary = false,
  onBandModel,
  part,
  tubeLayout,
}: VisualizationContainerProps) {
  const view = usePangenomeView();
  /* The whole graph - the tube map, the variants view - is drawn by the
     graph strip's track; a haplotype's row draws its bar in linear view
     and nothing else, so it lays nothing else out. */
  const drawsWhole = !part || part === GRAPH_PART;
  /* Zoomed out, a section of the linear view's bars is hatched only where
     more of its bases than this are off the reference, so a scatter of SNPs
     does not hatch the whole bar. It grows with the window: 10 bp at 10 kb. */
  const windowBp = frame
    ? ((frame.endBp - frame.startBp) * (frame.viewToPx - frame.viewFromPx)) /
      Math.max(1, frame.width)
    : 0;
  const sectionAltBp = autoBp(windowBp / 1000);
  /* The band's one model, shared with the graph's other rows. */
  const built = modelOf(queryResult);

  /* A colour the reader picked wins over the one the palette handed out.
     Applied here rather than in each view, so every drawing and the legend
     above them are painted from one place. */
  const chosen = view?.laneColors;
  const model = useMemo(() => {
    if (!built || !chosen || !Object.keys(chosen).length) return built;
    return {
      ...built,
      lanes: built.lanes.map((lane) =>
        chosen[lane.key] ? { ...lane, color: chosen[lane.key] } : lane,
      ),
    };
  }, [built, chosen]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const tipTitleRef = useRef<HTMLDivElement>(null);
  const tipLinesRef = useRef<HTMLDivElement>(null);
  const tipZoomRef = useRef<HTMLDivElement>(null);
  const zoomBeforeRef = useRef<HTMLSpanElement>(null);
  const zoomAtRef = useRef<HTMLSpanElement>(null);
  const zoomAfterRef = useRef<HTMLSpanElement>(null);
  const zoomWhereRef = useRef<HTMLDivElement>(null);

  /* How big the tooltip last came out, as a ResizeObserver reports it -
     after the page has laid itself out anyway - so placing it never has to
     measure it. Reading a layout box on every mouse event would force the
     page to lay itself out again each time, which is the cost this whole
     arrangement exists to avoid. */
  const tipSize = useRef({ width: 0, height: 0 });
  const lastTip = useRef<HoverTarget | null>(null);
  /* Below and right of the pointer; left of it near the right edge, above
     it near the bottom - as the click cards open; see FloatingCard. */
  const placeTip = useCallback((target: HoverTarget) => {
    const tip = tipRef.current;
    if (!tip) return;
    const width = tipSize.current.width || TOOLTIP_W;
    const height = tipSize.current.height;
    let left = target.x + POINTER_GAP;
    if (left + width > window.innerWidth - EDGE) {
      left = Math.max(EDGE, target.x - POINTER_GAP - width);
    }
    let top = target.y + POINTER_GAP;
    if (top + height > window.innerHeight - EDGE) {
      top = Math.max(EDGE, target.y - POINTER_GAP - height);
    }
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }, []);
  useEffect(() => {
    const tip = tipRef.current;
    if (!tip) return;
    const observer = new ResizeObserver(() => {
      const box = tip.getBoundingClientRect();
      tipSize.current = { width: box.width, height: box.height };
      /* Grown or shrunk with what it says: placed again for its new size. */
      if (!tip.hidden && lastTip.current) placeTip(lastTip.current);
    });
    observer.observe(tip);
    return () => observer.disconnect();
  }, [placeTip]);

  /* Fixed to the viewport, so the pointer's own coordinates place it. */
  const showTip = useCallback((target: HoverTarget | null) => {
    const tip = tipRef.current;
    if (!tip) return;
    if (!target) {
      tip.hidden = true;
      return;
    }
    /* Not every hover has a name worth a row of its own, and one that has
       not leaves it empty rather than writing a blank line. */
    if (tipTitleRef.current) {
      tipTitleRef.current.textContent = target.title;
      tipTitleRef.current.hidden = !target.title;
    }
    if (tipLinesRef.current) {
      tipLinesRef.current.textContent = target.lines.join("\n");
    }

    /* The magnified bases, written the same way: three spans, so the one
       under the pointer can be marked without building any markup. */
    const zoom = target.zoom;
    if (tipZoomRef.current) {
      tipZoomRef.current.hidden = !zoom;
    }
    if (zoom) {
      /* The pointer is one pixel wide and a pixel can cover several bases.
         Mark all of the ones it covers rather than picking one of them: at
         this zoom the pointer does not mean a base, it means a run. */
      const marked = Math.max(0, Math.min(zoom.at, zoom.letters.length - 1));
      const after =
        marked + Math.max(1, Math.min(zoom.span ?? 1, zoom.letters.length - marked));
      if (zoomBeforeRef.current) {
        zoomBeforeRef.current.textContent = zoom.letters
          .slice(0, marked)
          .join("");
      }
      if (zoomAtRef.current) {
        zoomAtRef.current.textContent = zoom.letters
          .slice(marked, after)
          .join("");
      }
      if (zoomAfterRef.current) {
        zoomAfterRef.current.textContent = zoom.letters
          .slice(after)
          .join("");
      }
      if (zoomBeforeRef.current && zoom.clippedLeft) {
        zoomBeforeRef.current.textContent = `…${zoomBeforeRef.current.textContent}`;
      }
      if (zoomAfterRef.current && zoom.clippedRight) {
        zoomAfterRef.current.textContent = `${zoomAfterRef.current.textContent}…`;
      }
      if (zoomWhereRef.current) {
        /* The marked bases, which are what the pointer means. The rest of
           the letters are the haplotype either side of them, to read
           against. */
        const markFrom = zoom.markFrom ?? zoom.from + zoom.at;
        const markTo = zoom.markTo ?? markFrom;
        zoomWhereRef.current.textContent =
          markTo > markFrom
            ? `${markFrom.toLocaleString()} – ${markTo.toLocaleString()}  (${
                markTo - markFrom + 1
              } bp under the pointer)`
            : markFrom.toLocaleString();
      }
    }

    lastTip.current = target;
    placeTip(target);
    tip.hidden = false;
  }, [placeTip]);

  /* The tube map's stacks and axis, worked out once here: the drawing needs
     both, and the pan needs the axis - which is not the linear view's, once
     gaps are let in between the nodes. */
  /* Pixels a base: the window's width over the region it shows, and
     nothing else - a zoom is a new region. Where the band says where its
     bases go, a view draws from that instead; this is what is left for the
     node graph, which lays itself out, and for a view without a band. */
  const pxPerBase =
    frame && frame.endBp > frame.startBp && frame.width > 0
      ? frame.width / (frame.endBp - frame.startBp)
      : 1;
  const gapScale = view?.gapScale ?? DEFAULT_GAP_SCALE;
  /* Grouped, the tube map is drawn from sites: a box per shared stretch and
     per unique walk, every haplotype still a tube of its own through them,
     drawn to the same scale as every node. See compressedTube.ts. */
  const tubeGrouping = view?.tubeGrouping ?? -1;
  /* A column at a time, as the tube map is drawn: see columnarModel. */
  const tubeBase = useMemo(
    () => (model && view?.mode === "tube" && drawsWhole ? columnarModel(model) : null),
    [model, view?.mode, drawsWhole],
  );
  const tubeGrouped = useMemo(() => {
    if (!tubeBase) return null;
    /* The band's own grouping when it was laid out for the tubes: worked out
       here, from this band's width, it could come out another, and the gaps
       would belong to other columns. */
    const minBp = tubeLayout
      ? tubeLayout.minBp
      : tubeGrouping < 0
        ? null
        : separatorBp(tubeBase, tubeGrouping, frame?.width ?? 0);
    if (minBp === null) return null;
    const segments = variantSegments(tubeBase, minBp);
    return {
      model: compressedModel(tubeBase, segments),
      labels: boxLabels(segments),
      fills: boxFills(segments),
      segments,
    };
  }, [tubeBase, tubeGrouping, frame?.width, tubeLayout]);
  const tubeModel = tubeGrouped?.model ?? tubeBase;
  /* A grouped box clicked: the same card a bubble of the variants view
     opens, for the same site and walk. */
  const [tubeCard, setTubeCard] = useState<{
    segment: number;
    walk: number | null;
    x: number;
    y: number;
  } | null>(null);
  useEffect(() => setTubeCard(null), [tubeGrouped]);
  /* The hover over a grouped box: named as the tube over it names it, then
     its walk as the variants view says it. */
  const boxLines = useCallback(
    (id: string) => {
      const at = boxSegment(id);
      const segment = at && tubeGrouped?.segments[at.segment];
      if (!at || !segment) return null;
      const region = `${segment.refStart.toLocaleString()}–${segment.refEnd.toLocaleString()} on ${model?.reference?.contig ?? ""}`;
      if (at.walk === null) {
        return {
          title: `node ${id}`,
          lines: [
            "the same in every haplotype",
            region,
            "drawn much shorter than it is",
            "click for its card",
          ],
        };
      }
      const walk = segment.walks[at.walk - 1];
      if (!walk) return null;
      return {
        title: `node ${id}`,
        lines: [
          `walk ${walk.index} of ${segment.walks.length}`,
          `${walk.lanes.length} of ${segment.haplotypes} haplotypes`,
          walk.nodes.length
            ? `${walk.nodes.length} node${walk.nodes.length === 1 ? "" : "s"}, ${walk.label} against the reference's allele`
            : `skips the site: a deletion (${walk.label})`,
          region,
          ...(walk.isReference ? ["the reference's walk"] : []),
          "click for its nodes and haplotypes",
        ],
      };
    },
    [tubeGrouped, model],
  );
  const onBoxPick = useCallback((id: string, x: number, y: number) => {
    const at = boxSegment(id);
    setTubeCard(at ? { ...at, x, y } : null);
  }, []);
  const tubeStack = useMemo(
    () =>
      tubeModel && view?.mode === "tube" && drawsWhole
        ? tubeStacks(tubeModel, TUBE_H)
        : null,
    [tubeModel, view?.mode, drawsWhole],
  );
  const tube = useMemo(
    () =>
      tubeModel && tubeStack
        ? {
            stacks: tubeStack,
            axis: tubeAxis(
              tubeModel,
              tubeStack,
              frame,
              pxPerBase,
              gapScale,
              /* Coordinates from the fetched model's own reference walk:
                 the drawn one may be grouped. */
              tubeBase ?? undefined,
              tubeLayout?.gapsPx,
            ),
          }
        : null,
    [tubeBase, tubeModel, tubeStack, frame, pxPerBase, gapScale, tubeLayout],
  );

  /* The variants view: the window as sites and the stretches between them,
     drawn at the same scale as the other views. Nothing of the tube map is
     built for it. */
  const variants = useMemo(() => {
    if (!model || view?.mode !== "variants" || !drawsWhole) return null;
    /* Of the nodes with a place here, as the tube map is; see placedModel. */
    const placed = placedModel(model);
    const minBp = separatorBp(placed, view.variantGrouping, frame?.width ?? 0);
    const segments = variantSegments(placed, minBp);
    return { minBp, segments, model: placed };
  }, [model, view?.mode, view?.variantGrouping, frame?.width]);
  const variantAxis = useMemo(
    () => (model && variants ? bandAxis(model, frame) : null),
    [model, variants, frame],
  );
  const variantShape = useMemo(
    () =>
      variants && variantAxis
        ? variantLayout(variants.segments, variantAxis)
        : null,
    [variants, variantAxis],
  );
  const variantMarks = useMemo(
    () =>
      variants && variantShape && variantAxis
        ? variantDeletions(
            variants.model,
            variants.segments,
            variantShape,
            variantAxis,
          )
        : null,
    [variants, variantShape, variantAxis],
  );

  /* The part of the linear view this draws. The model keeps its layout, so
     a haplotype's bar lands where it would in the whole drawing; only the
     lanes drawn are cut down to the part's - a lane per haplotype, its
     contigs joined into one bar (see oneLanePerHaplotype). */
  const strip = !part || part === GRAPH_PART;
  const linearModel = useMemo(() => {
    if (!model) return model;
    const joined = oneLanePerHaplotype(model);
    if (!part) return joined;
    return {
      ...joined,
      laneCount: joined.lanes.length,
      lanes: joined.lanes.filter((lane) =>
        part === GRAPH_PART ? lane.isReference : !lane.isReference && lane.label === part,
      ),
    };
  }, [model, part]);

  /* The box is the height of what is in it. The linear view and the tube
     map can say in advance - a bar or a tube is a known height each - so
     they are asked; the node graph lays itself out before it knows, and
     keeps the given default. */
  const shellHeight = !model
    ? height
    : view?.mode === "linear"
      ? linearHeight(linearModel ?? model, view.alleleRows, strip)
      : view?.mode === "variants"
        ? (variantShape?.height ?? height)
        : tube
        ? tube.stacks.height
        : height;

  /* The band the pan has to hand over to, and the room it needs, once both
     are known. Each view reports the axis its own drawing uses. */
  const linearAxis = useMemo(
    () => (model ? bandAxis(model, frame) : null),
    [model, frame],
  );
  const drawnAxis =
    view?.mode === "variants" ? variantAxis : tube ? tube.axis : linearAxis;

  /* What was last reported, so that the same data drawn again to a
     different scale - the gaps widened, the view switched - can say which
     axis it replaces. Whoever placed the band on screen then puts the same
     base back where it was, which at rest is the start of the region, so
     the region fills the window again. Only an axis that really changed
     counts: this runs on every render of the band around it. */
  const reported = useRef<{
    model: typeof model;
    frame: DrawFrame | undefined;
    axis: BandAxis | null;
  } | null>(null);
  /* Before the browser paints, so whoever places the band can move it to
     where it belongs in the same frame it first appears in; told after, a
     new band was on screen for a frame at its default offset. */
  useLayoutEffect(() => {
    if (!onBandMapped || !model) return;
    const last = reported.current;
    const redrawnFrom =
      last &&
      last.model === model &&
      last.frame === frame &&
      last.axis !== drawnAxis
        ? last.axis
        : null;
    reported.current = { model, frame, axis: drawnAxis };
    onBandMapped(drawnAxis, shellHeight, redrawnFrom);
  }, [onBandMapped, model, frame, shellHeight, drawnAxis]);

  /* The layout itself, for the tracks drawn along its alt paths. Told
     through a ref so a caller handing a new function every render does
     not report the same layout again. */
  const onBandModelRef = useRef(onBandModel);
  onBandModelRef.current = onBandModel;
  useEffect(() => {
    if (model && drawnAxis && frame) onBandModelRef.current?.(model, drawnAxis, frame);
  }, [model, drawnAxis, frame]);

  /* The chrome describes one window; the centre one is the one in view. */
  const publishModel = view?.publishModel;
  useEffect(() => {
    if (isPrimary) publishModel?.(model);
  }, [isPrimary, model, publishModel]);

  /* Everything the drawings read, held still between renders so a view that
     has not changed is not asked to draw itself again. */
  const shared = useMemo(
    () =>
      model && view
        ? {
            model,
            pxPerBase,
            highlight: view.highlight,
            onHighlight: view.setHighlight,
            onHover: showTip,
            onSelectNode: view.setSelectedNode,
            selectedNode: view.selectedNode,
            showSequence: pxPerBase >= SEQUENCE_ZOOM,
            frame,
          }
        : null,
    [
      model,
      view,
      pxPerBase,
      view?.highlight,
      view?.setHighlight,
      view?.setSelectedNode,
      view?.selectedNode,
      frame,
      showTip,
    ],
  );

  if (!model || !model.lanes.length || !view || !shared) return null;
  if (view.mode !== "linear" && !drawsWhole) return null;

  return (
    <div className="pgv-shell" style={{ height: shellHeight }}>
      {/* ── The drawing ───────────────────────────────────────────────── */}
      {/* The views raise a tooltip on mouse *move*, so nothing tells them
          when the pointer leaves. `mouseout` bubbles from whichever element
          it left, so one handler here covers every one of them: moving
          between two elements clears and re-raises in the same tick, and
          moving out to nothing just clears. */}
      {/* A pan is sideways only, and the band above this does it by moving
          itself - so there is nothing to handle here. */}
      <div
        className="pgv-canvas"
        ref={wrapRef}
        onMouseOut={() => showTip(null)}
      >
        {view.mode === "linear" ? (
          <LinearPathView
            {...shared}
            model={linearModel ?? shared.model}
            strip={strip}
            alleleRows={view.alleleRows}
            sectionAltBp={sectionAltBp}
          />
        ) : view.mode === "tube" ? (
          tube && (
            <TubeMapView
              {...shared}
              model={tubeModel ?? model}
              rulerModel={tubeBase ?? model}
              boxLabels={tubeGrouped?.labels}
              boxFills={tubeGrouped?.fills}
              onBoxPick={tubeGrouped ? onBoxPick : undefined}
              boxLines={tubeGrouped ? boxLines : undefined}
              stacks={tube.stacks}
              axis={tube.axis}
            />
          )
        ) : view.mode === "variants" ? (
          variants &&
          variantAxis &&
          variantShape &&
          frame && (
            <VariantBubbleView
              model={variants.model}
              frame={frame}
              axis={variantAxis}
              segments={variants.segments}
              layout={variantShape}
              deletions={variantMarks ?? undefined}
              width={frame.width}
              onHover={showTip}
            />
          )
        ) : (
          <NodeGraphView {...shared} expanded={view.expandEdges} />
        )}
      </div>

      {view.mode === "tube" &&
        tubeCard &&
        tubeGrouped?.segments[tubeCard.segment] && (
          <VariantCard
            key={`${tubeCard.segment}:${tubeCard.walk}:${tubeCard.x}:${tubeCard.y}`}
            model={model}
            segment={tubeGrouped.segments[tubeCard.segment]}
            walk={tubeCard.walk}
            x={tubeCard.x}
            y={tubeCard.y}
            onClose={() => setTubeCard(null)}
          />
        )}

      {/* Always mounted, shown by writing to it - and mounted on the body
          rather than here.

          It is positioned from the pointer's own viewport coordinates, which
          `position: fixed` normally measures from the viewport. Normally: the
          band above this carries a translateX, and a transform makes its
          element the containing block for fixed descendants - so the
          coordinates were being measured from the band instead, and then
          clipped by the shell's overflow. That was survivable while the shell
          was tall enough to swallow the error; once its height became the
          drawing's own the tooltip fell outside it and vanished.

          A portal is what eg-tracks uses for its own hover tooltips, for the
          same reason. */}
      {createPortal(
        <div className="pgv-tooltip pgv-tooltip-fixed" ref={tipRef} hidden>
          {/* The bases first, so they are in the same place from one hover
              to the next. What is said about them varies - a copy drawn
              here, an allele off the reference walk -
              and with the lines above them the sequence moved down the
              tooltip as the pointer travelled. */}
          <div className="pgv-zoom" ref={tipZoomRef} hidden>
            <div className="pgv-zoom-seq">
              <span ref={zoomBeforeRef} />
              <span className="pgv-zoom-at" ref={zoomAtRef} />
              <span ref={zoomAfterRef} />
            </div>
            <div className="pgv-zoom-where" ref={zoomWhereRef} />
          </div>
          <div className="pgv-tooltip-title" ref={tipTitleRef} />
          <div className="pgv-tooltip-line pgv-tooltip-lines" ref={tipLinesRef} />
        </div>,
        document.body,
      )}
    </div>
  );
}
