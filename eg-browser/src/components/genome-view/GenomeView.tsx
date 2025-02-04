import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import {
  GenomeCoordinate,
  IHighlightInterval,
  ITrackModel,
  TrackContainerRepresentable,
} from "@eg/tracks";
import Toolbar from "./toolbar/Toolbar";
import useCurrentGenomeConfig from "@/lib/hooks/useCurrentGenomeConfig";
import { updateCurrentSession } from "@/lib/redux/slices/browserSlice";

export default function GenomeView() {
  const dispatch = useAppDispatch();
  const currentSession = useAppSelector(selectCurrentSession);
  const genomeConfig = useCurrentGenomeConfig();

  if (!currentSession || !genomeConfig) {
    return null;
  }

  const handleNewRegion = (coordinate: GenomeCoordinate) => {
    dispatch(updateCurrentSession({ userViewRegion: coordinate }));
  };

  const handleNewHighlight = (highlights: IHighlightInterval[]) => {
    console.log(highlights, "new highlights");
    dispatch(updateCurrentSession({ highlights }));
  };

  const handleTrackSelected = (selectedTracks: ITrackModel[]) => {
    console.log("Selected tracks:", selectedTracks);
    dispatch(updateCurrentSession({ highlights }));
  };

  const handleTrackDeleted = (tracks: ITrackModel[]) => {
    dispatch(updateCurrentSession({ tracks }));
  };

  const handleTrackAdded = (tracks: ITrackModel[]) => {
    dispatch(updateCurrentSession({ tracks }));
  };

  const handleNewRegionSelect = (coordinate: GenomeCoordinate) => {
    dispatch(updateCurrentSession({ userViewRegion: coordinate }));
    dispatch(updateCurrentSession({ viewRegion: coordinate }));
  };

  return (
    <div>
      <TrackContainerRepresentable
        tracks={currentSession.tracks}
        highlights={currentSession.highlights}
        genomeConfig={genomeConfig}
        legendWidth={100}
        showGenomeNav={true}
        onNewRegion={handleNewRegion}
        onNewHighlight={handleNewHighlight}
        onTrackSelected={handleTrackSelected}
        onTrackDeleted={handleTrackDeleted}
        onTrackAdded={handleTrackAdded}
        onNewRegionSelect={handleNewRegionSelect}
        viewRegion={currentSession.viewRegion}
        userViewRegion={
          currentSession.userViewRegion
            ? currentSession.userViewRegion
            : currentSession.viewRegion
        }
      />

      <div className="fixed bottom-0 z-50">
        <Toolbar />
      </div>
    </div>
  );
}
