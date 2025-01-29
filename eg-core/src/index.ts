import { getGenomeConfig as getGenomeConfigFromAllGenomes } from "./eg-lib/models/genomes/allGenomes";
import DisplayedRegionModel from "./eg-lib/models/DisplayedRegionModel";
import DataHubParser from "./eg-lib/models/DataHubParser";

export function getGenomeDefaultState(genome: string) {
    const genomeConfig = getGenomeConfigFromAllGenomes(genome);

    if (!genomeConfig) {
        return null;
    }

    const defaultRegion = genomeConfig.defaultRegion;
    const defaultTracks = genomeConfig.defaultTracks;

    const navRegion = new DisplayedRegionModel(genomeConfig.navContext, ...defaultRegion);

    return {
        viewRegion: navRegion.currentRegionAsString(),
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
            querygenome: track.querygenome
        })),
    }
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
        querygenome: track.querygenome
    }));
}

export function getGenomeConfig(genome: string) {
    return getGenomeConfigFromAllGenomes(genome);
}
