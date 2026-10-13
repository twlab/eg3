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
import { buildModel, referenceTicks } from "./Visualization/pangenomeModel";

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
}

/* A database opened from a URL can be opened again; one from disk cannot.
   Reopened once per URL, and the new id remembered. */
const reopened = new Map<string, Promise<string>>();
async function liveDatabase(options: PangenomeOptions): Promise<string> {
  if (getLocalDatabase(options.database)) return options.database;
  if (options.url) {
    let id = reopened.get(options.url);
    if (!id) {
      id = openRemoteDatabase(options.url).then((summary) => summary.id);
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

/** What a genomealign fetch returns, for a band of the graph. */
export async function fetchPangenomeData(data: any): Promise<any> {
  const {
    trackToFetch,
    visData,
    genomicLoci,
    regionExpandLoci,
    initGenomicLoci,
    primaryGenName,
    trackDataIdx,
    missingIdx,
  } = data;

  const visRegion = regionOf(visData.visRegion);
  const viewWindowRegion = regionOf(visData.viewWindowRegion);
  const viewWindow = new OpenInterval(
    visData.viewWindow.start,
    visData.viewWindow.end,
  );

  const fetchResults: any = {};
  const trackToDrawId: any = {};
  let gaps: Gap[] = [];

  /* One graph per view; were there more, the first would lay the band out. */
  for (const trackModel of trackToFetch) {
    let records: any = null;
    let errorType: string | undefined;
    try {
      const options = trackModel.options as PangenomeOptions;
      const database = await liveDatabase(options);
      /* The band's stretch of the reference, on the contig it covers most. */
      const locus = visRegion
        .getGenomeIntervals()
        .reduce((a: ChromosomeInterval | null, b: ChromosomeInterval) =>
          !a || b.getLength() > a.getLength() ? b : a,
        null);
      const bounds = locus
        ? await pathBounds(database, options.sample, locus.chr)
        : null;
      const start = Math.max(locus?.start ?? 0, bounds?.start ?? 0);
      const end = Math.min(locus?.end ?? 0, bounds?.end ?? Infinity);
      records =
        locus && end > start
          ? await queryLocalInterval(database, {
              sample: options.sample,
              contig: locus.chr,
              start: Math.floor(start),
              end: Math.ceil(end),
              context: Number.isFinite(options.context)
                ? options.context!
                : DEFAULT_CONTEXT_BP,
              haplotypes: options.haplotypes,
            })
          : { nodes: [], edges: [], paths: [] };
      if (!gaps.length && locus) {
        gaps = graphGaps(
          buildModel(records),
          visRegion.getNavigationContext(),
          locus.chr,
        );
      }
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

  /* Without a graph to read gaps off, the band is drawn as it is, so the
     other tracks still have somewhere to go. */
  const { primaryVisData, navContextBuilder } = withGaps(
    visRegion,
    viewWindowRegion,
    viewWindow,
    gaps,
  );

  return {
    fetchResults,
    navData: {
      ...data,
      genomicFetchCoord: {
        [primaryGenName]: {
          genomicLoci,
          regionExpandLoci,
          initGenomicLoci,
          primaryVisData,
          navContextBuilder,
        },
      },
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
