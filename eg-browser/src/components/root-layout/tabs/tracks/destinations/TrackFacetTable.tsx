import FacetTable from "./FacetTable";
import TabView from "@/components/ui/tab-view/TabView";
import useExpandedNavigationTab from "@/lib/hooks/useExpandedNavigationTab";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  selectCurrentSession,
  updateCurrentSession,
} from "@/lib/redux/slices/browserSlice";
import {
  selectCustomTracksPool,
  selectPublicTracksPool,
} from "@/lib/redux/slices/hubSlice";
import { TrackModel } from "wuepgg3-track-test";
import { useMemo } from "react";

export default function TrackFacetTable() {
  useExpandedNavigationTab();

  return (
    <TabView
      tabs={[
        {
          label: "Public",
          value: "public",
          component: <PublicTracks />,
        },
        {
          label: "Custom",
          value: "custom",
          component: <CustomTracks />,
        },
      ]}
    />
  );
}

function PublicTracks() {
  const dispatch = useAppDispatch();
  const publicTracksPool = useAppSelector(selectPublicTracksPool);
  const currentSession = useAppSelector(selectCurrentSession);

  const addedTrackUrls = useMemo(() => {
    if (currentSession) {
      return new Set(
        currentSession!.tracks.map((track) => track.url || track.name)
      );
    } else {
      return new Set();
    }
  }, [currentSession]);

  function onTracksAdded(tracks: TrackModel[]) {
    if (currentSession) {
      dispatch(
        updateCurrentSession({
          tracks: [...currentSession.tracks, ...tracks],
        })
      );
    }
  }
  return (
    <FacetTable
      tracks={publicTracksPool ? publicTracksPool : []}
      addedTracks={currentSession ? currentSession.tracks : []}
      addTermToMetaSets={() => {}}
      addedTrackSets={addedTrackUrls as Set<string>}
      onTracksAdded={onTracksAdded}
      contentColorSetup={{ color: "#222", background: "white" }}
    />
  );
}

function CustomTracks() {
  const dispatch = useAppDispatch();
  const customTracksPool = useAppSelector(selectCustomTracksPool);
  const currentSession = useAppSelector(selectCurrentSession);

  const addedTrackUrls = useMemo(() => {
    if (currentSession) {
      return new Set(
        currentSession!.tracks.map((track) => track.url || track.name)
      );
    } else {
      return new Set();
    }
  }, [currentSession]);

  function onTracksAdded(tracks: TrackModel[]) {
    if (currentSession) {
      dispatch(
        updateCurrentSession({
          tracks: [...currentSession.tracks, ...tracks],
        })
      );
    }
  }
  return (
    <FacetTable
      tracks={customTracksPool ? customTracksPool : []}
      addedTracks={currentSession ? currentSession.tracks : []}
      addTermToMetaSets={() => {}}
      addedTrackSets={addedTrackUrls as Set<string>}
      onTracksAdded={onTracksAdded}
      contentColorSetup={{ color: "#222", background: "white" }}
    />
  );
}
