
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  selectCurrentSession,
  updateCurrentSession,
} from "@/lib/redux/slices/browserSlice";
import TrackList from "@eg/tracks/src/components/GenomeView/TabComponents/TrackList";

import {
  selectSavedDeleteTrackList,
  updateSavedDeleteTrackList,
} from "@/lib/redux/slices/hubSlice";

import { ITrackModel } from "@eg/tracks";
export default function TrackListUi() {
  const savedDeleteTrackList = useAppSelector(selectSavedDeleteTrackList);
  const dispatch = useAppDispatch();
  const currentSession = useAppSelector(selectCurrentSession);

  function addTracktoAvailable(track: ITrackModel) {
    dispatch(updateSavedDeleteTrackList([...savedDeleteTrackList, track]));
  }
  function removeTrackFromAvailable(trackId: string | number) {
    const updatedTracks = savedDeleteTrackList.filter(
      (track) => track.id !== trackId
    );
    dispatch(updateSavedDeleteTrackList(updatedTracks));
  }

  const onTrackRemoved = (trackId: string | number) => {
    if (currentSession) {
      const updatedTracks = currentSession.tracks.filter(
        (track) => track.id !== trackId
      );
      dispatch(
        updateCurrentSession({
          tracks: updatedTracks,
        })
      );
    }
  };
  function onTracksAdded(track: ITrackModel) {
    if (currentSession) {
      dispatch(
        updateCurrentSession({
          tracks: [...currentSession.tracks, track],
        })
      );
    }
  }

  return currentSession && savedDeleteTrackList ? (
    <TrackList
      addedTracks={currentSession.tracks}
      onTracksAdded={onTracksAdded}
      onTrackRemoved={onTrackRemoved}
      savedDeleteTrackList={savedDeleteTrackList}
      addTracktoAvailable={addTracktoAvailable}
      removeTrackFromAvailable={removeTrackFromAvailable}
    />
  ) : (
    ""
  );
}
