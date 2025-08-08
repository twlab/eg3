import { getGenomeConfig as getGenomeConfigFromAllGenomes } from "./models/genomes/allGenomes";
import DisplayedRegionModel from "./models/DisplayedRegionModel";
import DataHubParser from "./models/DataHubParser";
import RegionSet from "./models/RegionSet";
import OpenInterval from "./models/OpenInterval";
import TrackModel from "./models/TrackModel";

export function getGenomeDefaultState(genome: string) {
  const genomeConfig = getGenomeConfigFromAllGenomes(genome);

  if (!genomeConfig) {
    return null;
  }

  const defaultRegion = genomeConfig.defaultRegion;
  const defaultTracks = genomeConfig.defaultTracks;

  const navRegion = new DisplayedRegionModel(
    genomeConfig.navContext,
    ...defaultRegion
  );

  return {
    viewRegion: navRegion.currentRegionAsString(),
    userViewRegion: null,
    tracks: defaultTracks.map((track) => ({
      name: track.name,
      type: track.type,
      filetype: track.filetype,
      options: track.options,
      url: track.url,
      indexUrl: track.indexUrl,
      metadata: track.metadata,
      fileObj: track.fileObj,
      queryEndpoint: track.queryEndpoint,
      querygenome: track.querygenome,
    })),
  };
}

export async function fetchDataHubTracks(hub: any) {
  const hubParser = new DataHubParser();

  const response = await fetch(hub.url);
  const text = await response.text();
  const json = JSON.parse(text);

  const lastSlashIndex = hub.url.lastIndexOf("/");
  const hubBase = hub.url.substring(0, lastSlashIndex).replace(/\/+$/, "");
  const tracksStartIndex = hub.oldHubFormat ? 1 : 0;

  let tracks = await hubParser.getTracksInHub(
    json,
    hub.name,
    hub.genome,
    hub.oldHubFormat,
    tracksStartIndex,
    hubBase
  );

  tracks = tracks.filter((track) => track.showOnHubLoad);

  return tracks.map((track) => ({
    name: track.name,
    type: track.type,
    filetype: track.filetype,
    options: track.options,
    url: track.url,
    indexUrl: track.indexUrl,
    metadata: track.metadata,
    fileObj: track.fileObj,
    queryEndpoint: track.queryEndpoint,
    querygenome: track.querygenome,
  }));
}

export function getGenomeConfig(genome: string) {
  return getGenomeConfigFromAllGenomes(genome);
}

export function arraysHaveSameTrackModels(
  array1: Array<TrackModel>,
  array2: Array<TrackModel>
): boolean {
  // Check if the lengths are different. If they are, return false.
  if (array1.length !== array2.length) {
    return false;
  }

  // Use a map to keep track of the count of each id in the first array.
  const idCounts = new Map();

  for (let item of array1) {
    // Increment the count for each id in the first array.
    idCounts.set(item.id, (idCounts.get(item.id) || 0) + 1);
  }

  for (let item of array2) {
    // Decrement the count for each id in the second array.
    if (!idCounts.has(item.id)) {
      return false;
    }
    const newCount = idCounts.get(item.id) - 1;
    if (newCount === 0) {
      idCounts.delete(item.id);
    } else {
      idCounts.set(item.id, newCount);
    }
  }

  // If idCounts is empty, it means both arrays have the same ids with the same counts.
  return idCounts.size === 0;
}

export function diffTrackModels(
  array1: Array<TrackModel>,
  array2: Array<TrackModel>
): { onlyInArray1: Array<TrackModel>; onlyInArray2: Array<TrackModel> } {
  const array2Ids = new Set(array2.map((item) => item.id));
  const array1Ids = new Set(array1.map((item) => item.id));

  const onlyInArray1 = array1.filter((item) => !array2Ids.has(item.id));
  const onlyInArray2 = array2.filter((item) => !array1Ids.has(item.id));

  return { onlyInArray1, onlyInArray2 };
}
export function restoreLegacyViewRegion(
  object: any,
  regionSetView: RegionSet | null
) {
  const getDisplayedRegion = () => {
    const genomeConfig = getGenomeConfig(object.genomeName);
    if (!genomeConfig) {
      return null;
    }

    let viewInterval;
    if (object.hasOwnProperty("viewInterval")) {
      viewInterval = OpenInterval.deserialize(object.viewInterval);
    } else {
      viewInterval = genomeConfig.navContext.parse(object.displayRegion);
    }
    if (regionSetView) {
      return new DisplayedRegionModel(
        regionSetView.makeNavContext(),
        ...viewInterval
      );
    } else {
      return new DisplayedRegionModel(genomeConfig.navContext, ...viewInterval);
    }
  };

  const displayedRegion = getDisplayedRegion();

  return displayedRegion;
}
