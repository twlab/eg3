import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import {
  GenomeCoordinate,
  IHighlightInterval,
  ITrackModel,
  TrackContainerRepresentable,
} from "@eg/tracks";
import Toolbar from "./toolbar/Toolbar";
import useCurrentGenome from "@/lib/hooks/useCurrentGenome";
import { updateCurrentSession } from "@/lib/redux/slices/browserSlice";
import { selectTool } from "@/lib/redux/slices/utilitySlice";

export default function GenomeView() {
  const dispatch = useAppDispatch();
  const currentSession = useAppSelector(selectCurrentSession);
  const tool = useAppSelector(selectTool);
  const genomeConfig = useCurrentGenome();
  if (!currentSession || !genomeConfig) {
    return null;
  }

  const handleNewRegion = (coordinate: GenomeCoordinate) => {
    dispatch(updateCurrentSession({ userViewRegion: coordinate }));
  };

  const handleNewHighlight = (highlights: IHighlightInterval[]) => {
    dispatch(updateCurrentSession({ highlights }));
  };

  const handleTrackSelected = (tracks: ITrackModel[]) => {
    dispatch(updateCurrentSession({ tracks }));
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
        key={currentSession.id}
        tracks={currentSession.tracks}
        highlights={currentSession.highlights}
        genomeConfig={genomeConfig}
        legendWidth={120}
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
        tool={tool}
        Toolbar={Toolbar}
        onLoadComplete={undefined}
        isGenomeViewLoaded={false}
      />
    </div>
  );
}
