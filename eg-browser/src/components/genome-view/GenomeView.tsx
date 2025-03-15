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
import {
  selectScreenShotOpen,
  updateScreenShotData,
} from "@/lib/redux/slices/hubSlice";

export default function GenomeView() {
  const dispatch = useAppDispatch();
  const currentSession = useAppSelector(selectCurrentSession);
  const tool = useAppSelector(selectTool);
  const genomeConfig = useCurrentGenome();
  const selectedRegionSet = currentSession?.selectedRegionSet;
  const isScreenShotOpen = useAppSelector(selectScreenShotOpen);
  if (!currentSession || !genomeConfig) {
    return null;
  }
  console.log(currentSession);
  const setScreenshotData = (screenShotData: { [key: string]: any }) => {
    dispatch(updateScreenShotData(screenShotData));
  };

  const handleNewHighlight = (highlights: IHighlightInterval[]) => {
    console.log(highlights, "new highlights");
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
  const handleNewRegion = (startbase: number, endbase: number) => {
    dispatch(
      updateCurrentSession({
        userViewRegion: { start: startbase, end: endbase },
      })
    );
  };
  const handleNewRegionSelect = (
    startbase: number,
    endbase: number,
    coordinate: GenomeCoordinate
  ) => {
    dispatch(
      updateCurrentSession({
        userViewRegion: { start: startbase, end: endbase },
      })
    );
    dispatch(updateCurrentSession({ viewRegion: coordinate }));
  };

  return (
    <div>
      <TrackContainerRepresentable
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
        userViewRegion={currentSession.userViewRegion}
        tool={tool}
        Toolbar={Toolbar}
        selectedRegionSet={selectedRegionSet}
        setScreenshotData={setScreenshotData}
        isScreenShotOpen={isScreenShotOpen}
      />
    </div>
  );
}
