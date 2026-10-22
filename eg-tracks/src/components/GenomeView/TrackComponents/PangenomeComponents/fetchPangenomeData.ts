import ChromosomeInterval from "../../../../models/ChromosomeInterval";
import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";
import Feature from "../../../../models/Feature";
import LinearDrawingModel from "../../../../models/LinearDrawingModel";
import NavigationContext from "../../../../models/NavigationContext";
import OpenInterval from "../../../../models/OpenInterval";
import { NavContextBuilder } from "../../../../models/NavContextBuilder";
import type { Gap } from "../../../../models/NavContextBuilder";
import {
  getLocalDatabase,
  localPathBounds,
  openRemoteDatabase,
  queryLocalInterval,
} from "../../../../getRemoteData/gbz/worker/gbzClient";
import { buildModel, columnarModel, modelOf, referenceTicks } from "./Visualization/pangenomeModel";
import { GRAPH_PART } from "./Visualization/VisualizationContainer";
import { TUBE_H } from "./Visualization/TubeMapView";
import { tubeAxis, tubeStacks } from "./Visualization/tubeLayout";
import { compressedModel } from "./Visualization/compressedTube";
import { separatorBp, variantSegments } from "./Visualization/variantBubbles";
import { DEFAULT_GAP_SCALE } from "./Visualization/pangenomeViewState";
import type { ViewMode } from "./Visualization/pangenomeViewState";

/* ══════════════════════════════════════════════════════════════════════════
   The pangenome graph, fetched the way a genomealign track is: first, for
   the whole band, so its layout can say where every other track goes.

   A genomealign track inserts room into the primary genome wherever a query
   carries bases the primary does not (MultiAlignmentViewCalculator). The
   graph's layout does the same thing - a column is as wide as its widest
   allele, and the reference spends no coordinate on the rest - so the room
   it makes is read off it as gaps, and the band's primaryVisData is built
   from those gaps exactly as genomealign builds its own. TrackManager then
   fetches, draws and pans every other track by it, as it does under an
   alignment.

   Answers in the shape fetchGenomeAlignData does, so TrackManager hands it
   to createGenomeAlignOnMessage like any alignment reply.
   ══════════════════════════════════════════════════════════════════════════ */

export const PANGENOME_TRACK_TYPE = "pangenome";

/** The legend colour of the graph's own rows: the reference's blue, every
    alt path's green. Undefined for any other track, whose legend stays as
    it is. */
export function pangenomeLegendColor(trackModel: any): string | undefined {
  if (trackModel?.type !== PANGENOME_TRACK_TYPE) return undefined;
  const part = trackModel.options?.part;
  return !part || part === GRAPH_PART ? "#2563eb" : "#16a34a";
}

/** A track whose fetch decides where the others go: an alignment, or the
    graph. The two are never in one view. */
export const isLayoutTrackType = (type: unknown) =>
  type === "genomealign" || type === PANGENOME_TRACK_TYPE;

/* Context pulls in the nodes other haplotypes branch out to, which is what
   makes the bubbles; see pangenomeBrowser's dataFetcher. */
const DEFAULT_CONTEXT_BP = 32;

/** Where a graph track's options say its database is. */
interface PangenomeOptions {
  /** The gbz worker's id for the opened database. */
  database: string;
  /** Where it is hosted, when it was opened from a URL: reopened from here
      when the worker no longer has it, as after a reload. */
  url?: string;
  /** The reference sample whose path an interval query starts from. */
  sample: string;
  context?: number;
  /** Only these haplotypes' walks, as `sample#haplotype`; all when absent. */
  haplotypes?: string[];
  /** Which row of the graph this track is: `GRAPH_PART` for the strip, or a
      haplotype's `sample#haplotype` for its bar. */
  part?: string;
  /** The reference path's range on its contig, as the start page measured
      it: what a band is clipped to, so it need not be measured again. */
  range?: { contig: string; start: number; end: number };
}

/* A database opened from a URL can be opened again; one from disk cannot.
   Reopened once per URL, and the new id remembered. */
const reopened = new Map<string, Promise<string>>();
async function liveDatabase(options: PangenomeOptions): Promise<string> {
  if (getLocalDatabase(options.database)) return options.database;
  if (options.url) {
    let id = reopened.get(options.url);
    if (!id) {
      /* For its queries alone: the start page's haplotype list is not
         needed here. */
      id = openRemoteDatabase(options.url, { listPaths: false }).then(
        (summary) => summary.id,
      );
      id.catch(() => reopened.delete(options.url!));
      reopened.set(options.url, id);
    }
    return id;
  }
  throw new Error(
    "This pangenome was opened from a file, which the browser no longer has. Open it again from the start page.",
  );
}

/* The part of each path the graph has: a band can run past either end. */
const boundsOf = new Map<string, Promise<{ start: number; end: number } | null>>();
function pathBounds(database: string, sample: string, contig: string) {
  const key = `${database}|${sample}|${contig}`;
  let bounds = boundsOf.get(key);
  if (!bounds) {
    bounds = localPathBounds(database, { sample, contig }).catch(() => null);
    boundsOf.set(key, bounds);
  }
  return bounds;
}

/** A region rebuilt as model instances, whether it arrived as one or as the
    plain object a worker message or a clone leaves. */
function regionOf(region: any): DisplayedRegionModel {
  const features = region._navContext._features.map(
    (feature: any) =>
      new Feature(
        feature.name,
        new ChromosomeInterval(
          feature.locus.chr,
          feature.locus.start,
          feature.locus.end,
        ),
      ),
  );
  return new DisplayedRegionModel(
    new NavigationContext(region._navContext._name, features),
    region._startBase,
    region._endBase,
  );
}

/**
 * The room the graph's layout makes in the reference, as genomealign's gaps:
 * between two of the reference's own nodes, however far the layout moves on
 * past the bases the reference does. Each is placed before the later node's
 * first base, in the band's gapless context coordinates.
 */
export function graphGaps(
  model: ReturnType<typeof buildModel>,
  navContext: NavigationContext,
  contig: string,
): Gap[] {
  if (!model) return [];
  const anchors = referenceTicks(model);
  const gaps: Gap[] = [];
  for (let i = 1; i < anchors.length; i++) {
    const room =
      anchors[i].x - anchors[i - 1].x - (anchors[i].bp - anchors[i - 1].bp);
    if (!(room > 0)) continue;
    const [at] = navContext.convertGenomeIntervalToBases(
      new ChromosomeInterval(contig, anchors[i].bp, anchors[i].bp + 1),
    );
    if (at) gaps.push({ contextBase: at.start, length: room });
  }
  return gaps;
}

/**
 * The band with those gaps let in - calculatePrimaryVis, keeping the builder
 * as genomealign's reply does, for the highlights.
 */
function withGaps(
  visRegion: DisplayedRegionModel,
  viewWindowRegion: DisplayedRegionModel,
  viewWindow: OpenInterval,
  gaps: Gap[],
) {
  const builder = new NavContextBuilder(visRegion.getNavigationContext());
  builder.setGaps(gaps);
  const navContext = builder.build();
  const convert = (region: DisplayedRegionModel) => {
    const [start, end] = region.getContextCoordinates();
    return new DisplayedRegionModel(
      navContext,
      builder.convertOldCoordinates(start),
      builder.convertOldCoordinates(end),
    );
  };
  const newVisRegion = convert(visRegion);
  const newViewWindowRegion = convert(viewWindowRegion);
  /* The window squeezed to hold its gaps, as genomealign's is: TrackManager
     moves on a band for every window's width of pan, so a window has to be
     exactly that wide. Drawn at the reference's own scale instead, a window
     holding a long insertion ran a screen past it and the next band landed
     the insertion's width away. */
  const pixelsPerBase = viewWindow.getLength() / newViewWindowRegion.getWidth();
  const visWidth = newVisRegion.getWidth() * pixelsPerBase;
  return {
    primaryVisData: {
      visRegion: newVisRegion,
      visWidth,
      viewWindowRegion: newViewWindowRegion,
      viewWindow: new LinearDrawingModel(newVisRegion, visWidth).baseSpanToXSpan(
        newViewWindowRegion.getContextCoordinates(),
      ),
    },
    navContextBuilder: builder,
  };
}

/** `SAMPLE#HAP#CONTIG[start-end]`, the shape the graph's walks are named in. */
const WALK_NAME = /^(.*?)#(\d+)#([^[\]]+?)(?:\[(\d+)-(\d+)\])?$/;

/** The contig as a haplotype's own files name it: `SAMPLE#HAP#CONTIG`. */
const altContig = (sample: string, haplotype: number | string, contig: string) =>
  contig.includes("#") ? contig : `${sample}#${haplotype}#${contig}`;

/**
 * A haplotype's stretches in the band's graph, `key` being `sample#haplotype`:
 * one locus per walk piece, in its own coordinates and on the contigs its
 * files name. What its tracks are fetched over.
 */
function haplotypeLoci(graph: any, key: string): ChromosomeInterval[] {
  const paths: any[] = graph?.paths ?? graph?.result?.paths ?? [];
  const seen = new Set<string>();
  const loci: ChromosomeInterval[] = [];
  for (const path of paths) {
    const match = path?.name ? WALK_NAME.exec(path.name) : null;
    const sample = path?.sample ?? match?.[1];
    const haplotype = path?.haplotype ?? (match ? Number(match[2]) : undefined);
    const contig = path?.contig ?? match?.[3];
    if (`${sample}#${haplotype}` !== key || !contig) continue;
    if (!match || match[4] === undefined || match[5] === undefined) continue;
    const start = Number(match[4]);
    const end = Number(match[5]);
    const chr = altContig(sample, haplotype, contig);
    const name = `${chr}:${start}-${end}`;
    if (!(end > start) || seen.has(name)) continue;
    seen.add(name);
    loci.push(new ChromosomeInterval(chr, start, end));
  }
  return loci;
}

/**
 * A haplotype as a query genome of the band, as genomealign gives each query
 * one: the loci its tracks are fetched over, and the region they are drawn
 * across - the band's width of context, the haplotype's own bases where the
 * graph draws its nodes and gaps everywhere else.
 *
 * The band's context counts the layout one for one - its gaps are the
 * layout's room - so a node's place in it is its place in the layout plus a
 * constant, read off the reference's first node. Only the haplotype's
 * longest unbroken piece is drawn; the others' data are fetched but not.
 */
function haplotypeCoord(
  model: ReturnType<typeof buildModel>,
  graph: any,
  key: string,
  visRegion: DisplayedRegionModel,
  chr: string | undefined,
  /** The room let into the band ahead of a place in the layout, in bases,
      beyond the layout's own: the tube map's, in tube view. */
  roomBefore: (graphX: number) => number = () => 0,
) {
  const total = Math.round(visRegion.getWidth());
  const empty = () =>
    new DisplayedRegionModel(
      new NavigationContext(key, [NavigationContext.makeGap(total, "gap 1")]),
      0,
      total,
    );
  const coord = (queryRegion: DisplayedRegionModel) => ({
    queryGenomicCoord: haplotypeLoci(graph, key).map((locus) =>
      locus.serialize(),
    ),
    queryRegion,
    id: key,
  });

  const anchors = model ? referenceTicks(model) : [];
  if (!model || !chr || !anchors.length) return coord(empty());
  const [first] = visRegion
    .getNavigationContext()
    .convertGenomeIntervalToBases(
      new ChromosomeInterval(chr, anchors[0].bp, anchors[0].bp + 1),
    );
  if (!first) return coord(empty());
  const regionStart = visRegion.getContextCoordinates().start;
  /* From a place in the layout to one in the region drawn across the band. */
  const at = (graphX: number) =>
    Math.round(
      graphX -
        anchors[0].x +
        roomBefore(graphX) -
        roomBefore(anchors[0].x) +
        first.start -
        regionStart,
    );

  /* Its longest unbroken piece. */
  const [sample, haplotype] = key.split("#");
  let best: { steps: any[]; contig: string; bp: number } | null = null;
  for (const lane of model.lanes) {
    if (lane.isReference || lane.label !== key) continue;
    const pieces = new Map<number, any[]>();
    for (const step of lane.steps) {
      const piece = pieces.get(step.segment);
      if (piece) piece.push(step);
      else pieces.set(step.segment, [step]);
    }
    for (const steps of pieces.values()) {
      const bp = steps.reduce((sum, step) => sum + (step.end - step.start), 0);
      if (!best || bp > best.bp) {
        best = { steps, contig: altContig(sample, haplotype, lane.contig), bp };
      }
    }
  }
  if (!best) return coord(empty());

  /* Its bases where the graph draws them, in order: a node behind what is
     already laid - the path passing the same place again - is left out,
     and one running past either edge of the band is cut there. */
  type Run = { start: number; end: number } | { gap: number };
  const runs: Run[] = [];
  let cursor = 0;
  let last: { start: number; end: number } | null = null;
  for (const step of best.steps) {
    const node = model.nodeById.get(step.node);
    if (!node) continue;
    const length = step.end - step.start;
    const from = at(node.x);
    if (from + length <= cursor) continue;
    if (from >= total) break;
    if (from > cursor) {
      runs.push({ gap: from - cursor });
      cursor = from;
      last = null;
    }
    const skip = cursor - from;
    const keep = Math.min(length - skip, total - cursor);
    if (keep <= 0) continue;
    const start = step.start + skip;
    if (last && last.end === start) {
      last.end = start + keep;
    } else {
      last = { start, end: start + keep };
      runs.push(last);
    }
    cursor += keep;
  }
  if (total > cursor) runs.push({ gap: total - cursor });
  if (!runs.some((run) => !("gap" in run))) return coord(empty());

  let gapCount = 0;
  const features = runs.map((run) =>
    "gap" in run
      ? NavigationContext.makeGap(run.gap, `gap ${++gapCount}`)
      : new Feature(
          `${best!.contig}:${run.start}-${run.end}`,
          new ChromosomeInterval(best!.contig, run.start, run.end),
        ),
  );
  return coord(
    new DisplayedRegionModel(new NavigationContext(key, features), 0, total),
  );
}

/** How the graph is being drawn, which says what room the band holds. */
export interface PangenomeLayoutSettings {
  mode: ViewMode;
  gapScale?: number;
  /** As the view state's tubeGrouping: -1 every node, 0 auto. */
  tubeGrouping?: number;
  /** As the view state's variantGrouping: 0 auto. It moves nothing - the
      variants view is drawn on the linear layout - but it sets how tall
      the picture is. */
  variantGrouping?: number;
  /** For testing alignment: the graph queried for the window on screen
      alone - none of the band either side of it, with the context the
      pangenome was opened with - so what is drawn is the region asked for. */
  regionOnly?: boolean;
}

/**
 * The tube map's room in a band: the gaps it lets in ahead of each column
 * for the tubes to bend, in whole bases at the tube map's own scale, and the
 * grouping it was laid out with. Worked out on the band as fetched, gapless,
 * exactly as the tube view works it out (VisualizationContainer).
 */
function tubeRoom(
  model: NonNullable<ReturnType<typeof buildModel>>,
  visRegion: DisplayedRegionModel,
  visData: any,
  chr: string,
  settings: PangenomeLayoutSettings,
) {
  const navContext = visRegion.getNavigationContext();
  const [chrStart] = navContext.convertGenomeIntervalToBases(
    new ChromosomeInterval(chr, 0, 1),
  );
  const offset = chrStart ? chrStart.start : 0;
  const [from, to] = [
    visRegion.getContextCoordinates().start - offset,
    visRegion.getContextCoordinates().end - offset,
  ];
  const frame = {
    startBp: from,
    endBp: to,
    width: visData.visWidth,
    viewFromPx: visData.viewWindow.start,
    viewToPx: visData.viewWindow.end,
  };
  const grouping = settings.tubeGrouping ?? 0;
  /* A column at a time, as the tube map is drawn: see columnarModel. */
  const tubeBase = columnarModel(model);
  const minBp = grouping < 0 ? null : separatorBp(tubeBase, grouping, frame.width);
  const tubeModel =
    minBp === null
      ? tubeBase
      : compressedModel(tubeBase, variantSegments(tubeBase, minBp));
  const stacks = tubeStacks(tubeModel, TUBE_H);
  const axis = tubeAxis(
    tubeModel,
    stacks,
    frame,
    1,
    settings.gapScale ?? DEFAULT_GAP_SCALE,
    tubeBase,
  );
  const bases = axis.gapBefore.map((px) =>
    axis.scale > 0 ? Math.max(0, Math.round(px / axis.scale)) : 0,
  );
  return { minBp, bases, columns: tubeModel.columns };
}

/**
 * A band laid out for the view: genomealign's genomicFetchCoord - the
 * primary's gapped region, and each haplotype as a query genome - from the
 * band's graph. The room let in is the graph's, and in tube view the tube
 * map's as well, so every track lands where the view draws the graph.
 */
export function layoutPangenomeBand(
  records: any,
  data: any,
  haplotypeKeys: Iterable<string>,
  settings: PangenomeLayoutSettings,
) {
  const { visData, genomicLoci, regionExpandLoci, initGenomicLoci, primaryGenName } =
    data;
  const visRegion = regionOf(visData.visRegion);
  const viewWindowRegion = regionOf(visData.viewWindowRegion);
  const viewWindow = new OpenInterval(
    visData.viewWindow.start,
    visData.viewWindow.end,
  );
  const navContext = visRegion.getNavigationContext();
  const locus = visRegion
    .getGenomeIntervals()
    .reduce(
      (a: ChromosomeInterval | null, b: ChromosomeInterval) =>
        !a || b.getLength() > a.getLength() ? b : a,
      null,
    );
  const model = records && locus ? modelOf(records) : null;
  let gaps: Gap[] = model && locus ? graphGaps(model, navContext, locus.chr) : [];

  /* Tube view: the tubes' room ahead of each column as well, placed before
     the reference base the column reaches - the next one at or after it -
     the way the graph's own room is. Past the reference's last base the
     layout and the reference run on together. */
  const tube =
    settings.mode === "tube" && model && locus
      ? tubeRoom(model, visRegion, visData, locus.chr, settings)
      : null;
  let roomBefore: ((graphX: number) => number) | undefined;
  if (tube && model && locus) {
    const anchors = referenceTicks(model);
    const contextOf = (bp: number) =>
      navContext.convertGenomeIntervalToBases(
        new ChromosomeInterval(locus.chr, bp, bp + 1),
      )[0]?.start;
    const tubeGaps: Gap[] = [];
    let a = 0;
    tube.columns.forEach((column, c) => {
      if (!(tube.bases[c] > 0) || !anchors.length) return;
      while (a < anchors.length && anchors[a].x < column.x) a++;
      const at =
        a < anchors.length
          ? contextOf(anchors[a].bp)
          : (() => {
              const last = anchors[anchors.length - 1];
              const ctx = contextOf(last.bp);
              return ctx === undefined
                ? undefined
                : ctx + Math.round(column.x - last.x);
            })();
      if (at !== undefined) tubeGaps.push({ contextBase: at, length: tube.bases[c] });
    });
    gaps = gaps.concat(tubeGaps);
    /* The same room, by place in the layout, for the haplotypes' regions. */
    const xs = tube.columns.map((column) => column.x);
    const sums: number[] = [];
    let sum = 0;
    for (const base of tube.bases) sums.push((sum += base));
    roomBefore = (graphX: number) => {
      let lo = 0;
      let hi = xs.length - 1;
      let found = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (xs[mid] <= graphX) {
          found = mid;
          lo = mid + 1;
        } else hi = mid - 1;
      }
      return found < 0 ? 0 : sums[found];
    };
  }

  /* Without a graph to read gaps off, the band is drawn as it is, so the
     other tracks still have somewhere to go. */
  const { primaryVisData, navContextBuilder } = withGaps(
    visRegion,
    viewWindowRegion,
    viewWindow,
    gaps,
  );

  /* Each haplotype as a query genome, the way genomealign gives each query
     its coordinates: a track whose genome is `sample#haplotype` is fetched
     over that haplotype's own stretches in the band and drawn along its
     bar. Every one asked for has an entry, so a haplotype this band has
     none of draws empty rather than failing. */
  const haplotypes = new Set(haplotypeKeys);
  for (const lane of model?.lanes ?? []) {
    if (!lane.isReference) haplotypes.add(lane.label);
  }
  const coords: any = {};
  for (const key of haplotypes) {
    coords[key] = haplotypeCoord(
      model,
      records,
      key,
      primaryVisData.visRegion,
      locus?.chr,
      roomBefore,
    );
  }
  coords[primaryGenName] = {
    genomicLoci,
    regionExpandLoci,
    initGenomicLoci,
    primaryVisData,
    navContextBuilder,
    /* The view it was laid out for, and what the tube view draws with, to
       land where this band put it. */
    pangenomeView: settings.mode,
    pangenomeVariantGrouping: settings.variantGrouping ?? 0,
    ...(tube ? { pangenomeTube: { minBp: tube.minBp, bases: tube.bases } } : {}),
  };
  return coords;
}

/** What a genomealign fetch returns, for a band of the graph. */
export async function fetchPangenomeData(
  data: any,
  settings: PangenomeLayoutSettings = { mode: "linear" },
): Promise<any> {
  const { trackToFetch, visData, trackDataIdx, missingIdx } = data;

  const visRegion = regionOf(visData.visRegion);
  /* What is queried: the band, or - testing - the window alone. */
  const queried =
    settings.regionOnly && visData.viewWindowRegion
      ? regionOf(visData.viewWindowRegion)
      : visRegion;

  const fetchResults: any = {};
  const trackToDrawId: any = {};

  /* The band's stretch of the reference, on the contig it covers most -
     or, testing, of the window alone. */
  const locus = queried
    .getGenomeIntervals()
    .reduce(
      (a: ChromosomeInterval | null, b: ChromosomeInterval) =>
        !a || b.getLength() > a.getLength() ? b : a,
      null,
    );

  /* The graph's rows - its strip and a bar per haplotype - are tracks of
     their own that draw from one graph, so the band is queried once for
     all of them that ask the same of the same database. */
  const queries = new Map<string, Promise<any>>();
  const queryFor = (options: PangenomeOptions) => {
    const key = JSON.stringify([
      options.database,
      options.url,
      options.sample,
      options.context,
      options.haplotypes,
    ]);
    let query = queries.get(key);
    if (!query) {
      query = (async () => {
        const database = await liveDatabase(options);
        const bounds = !locus
          ? null
          : options.range && options.range.contig === locus.chr
            ? options.range
            : await pathBounds(database, options.sample, locus.chr);
        const start = Math.max(locus?.start ?? 0, bounds?.start ?? 0);
        const end = Math.min(locus?.end ?? 0, bounds?.end ?? Infinity);
        return locus && end > start
          ? queryLocalInterval(database, {
              sample: options.sample,
              contig: locus.chr,
              start: Math.floor(start),
              end: Math.ceil(end),
              context: Number.isFinite(options.context)
                ? options.context!
                : DEFAULT_CONTEXT_BP,
              haplotypes: options.haplotypes,
            })
          : { nodes: {}, edges: {}, paths: [] };
      })();
      queries.set(key, query);
    }
    return query;
  };

  /* The first graph lays the band out; the views never hold two. */
  let layoutRecords: any = null;
  const haplotypes = new Set<string>();
  for (const trackModel of trackToFetch) {
    let records: any = null;
    let errorType: string | undefined;
    try {
      const options = trackModel.options as PangenomeOptions;
      records = await queryFor(options);
      layoutRecords ??= records;
      for (const key of options.haplotypes ?? []) haplotypes.add(key);
      if (options.part && options.part !== GRAPH_PART) haplotypes.add(options.part);
      trackToDrawId[trackModel.id] = "";
    } catch (error) {
      errorType =
        error instanceof Error
          ? error.message
          : `Error fetching pangenome track with id ${trackModel.id}`;
    }
    fetchResults[trackModel.id] = {
      name: trackModel.name,
      records,
      id: trackModel.id,
      trackModel,
      metadata: trackModel.metadata,
      errorType,
    };
  }

  return {
    fetchResults,
    navData: {
      ...data,
      genomicFetchCoord: layoutPangenomeBand(
        layoutRecords,
        data,
        haplotypes,
        settings,
      ),
      trackToDrawId,
      trackDataIdx,
      missingIdx,
      regionSetStartBp:
        visData?.visRegion?._endBase - visData?.visRegion?._startBase ===
        data.bpRegionSize
          ? 0
          : null,
      fetchNewRegion: data.fetchNewRegion,
      dragX: data.dragX,
    },
    dragX: data.dragX,
  };
}
