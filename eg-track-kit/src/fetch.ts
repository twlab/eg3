/* Fetching a track's data from a URL, by its type: `fetchTypeMap[type]`
   for one track, `fetchGenomicData` for a batch of regions and tracks in
   the shape the browser's worker takes, and `fetchGenomeAlignData` for the
   genome alignment tracks, which fetch and lay out the query genome
   against the region together. Runs as well on the main thread as on a
   worker; see `wuepgg-tracks/workers` for the workers ready-made. */

import { fetchGenomicData } from "../../eg-tracks/src/getRemoteData/fetchFunctions";
import type DisplayedRegionModel from "../../eg-tracks/src/models/DisplayedRegionModel";
import OpenInterval from "../../eg-tracks/src/models/OpenInterval";
import type TrackModel from "../../eg-tracks/src/models/TrackModel";

export {
  fetchTypeMap,
} from "../../eg-tracks/src/getRemoteData/fetchTypeMap";
export {
  fetchGenomicData,
  fetchGenomeAlignData,
  chromAlias,
} from "../../eg-tracks/src/getRemoteData/fetchFunctions";

/** What one track's fetch came back with. */
export interface FetchedTrack {
  trackModel: TrackModel;
  /** The raw records, for `formatDataByType` or `drawTrack` to read. */
  data: any;
  /** Why there is no data, when there is none. */
  error: string | null;
}

/**
 * The request `fetchGenomicData` - and the fetch worker - take for one region
 * drawn `width` pixels wide: the region's loci, the tracks, and the region
 * as the drawing sees it.
 *
 * Genome alignment tracks are not fetched this way; see
 * `fetchGenomeAlignData`.
 */
export function regionRequest(
  tracks: TrackModel[],
  region: DisplayedRegionModel,
  width: number,
  genomeName = "",
) {
  const loci = region.getGenomeIntervals();
  return {
    primaryGenName: genomeName,
    genomicLoci: loci,
    regionExpandLoci: loci,
    initGenomicLoci: loci,
    trackModelArr: tracks,
    bpRegionSize: region.getWidth(),
    windowWidth: width,
    visData: {
      visWidth: width,
      visRegion: region,
      viewWindow: new OpenInterval(0, width),
      viewWindowRegion: region,
    },
  };
}

/**
 * Fetches the tracks' data over one region, on this thread. For a worker,
 * post `[regionRequest(...)]` to `createFetchWorker()` instead and read
 * `fetchResults` off the first item of its answer - except for hic,
 * dynamichic and vcf tracks, whose data are class instances a worker's
 * answer would strip; the browser fetches those on the main thread too.
 */
export async function fetchTracks(
  tracks: TrackModel[],
  region: DisplayedRegionModel,
  width: number,
  genomeName = "",
): Promise<FetchedTrack[]> {
  const [batch] = await fetchGenomicData([
    regionRequest(tracks, region, width, genomeName),
  ]);
  return batch.fetchResults.map((fetched: any) => ({
    trackModel: fetched.trackModel,
    data: fetched.result,
    error: fetched.errorType ?? null,
  }));
}
