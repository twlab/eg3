import TrackModel from "../../models/TrackModel";

export function convertTrackModelToITrackModel(track: TrackModel) {
  return {
    name: track.name,
    type: track.type,
    filetype: track.filetype,
    options: track.options,
    url: track.url,
    indexUrl: track.indexUrl,
    metadata: track.metadata,
    queryEndpoint: track.queryEndpoint,
    querygenome: track.querygenome,
    id: track.id,
    isSelected: track.isSelected,
  };
}
