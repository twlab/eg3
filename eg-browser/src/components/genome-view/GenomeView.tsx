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
import { selectTool } from "@/lib/redux/slices/utilitySlice";
import { getGenomeConfig } from "@eg/core";
import { useEffect, useState } from "react";
import { GenomeConfig } from "@eg/core/src/eg-lib/models/genomes/GenomeConfig";

export default function GenomeView() {
  const [genomeConfig, setGenomeConfig] = useState<null | GenomeConfig>(null);
  const dispatch = useAppDispatch();
  const currentSession = useAppSelector(selectCurrentSession);
  const tool = useAppSelector(selectTool);

  if (!currentSession) {
    return null;
  }

  const handleNewRegion = (coordinate: GenomeCoordinate) => {
    dispatch(updateCurrentSession({ userViewRegion: coordinate }));
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

  const handleNewRegionSelect = (coordinate: GenomeCoordinate) => {
    dispatch(updateCurrentSession({ userViewRegion: coordinate }));
    dispatch(updateCurrentSession({ viewRegion: coordinate }));
  };
  useEffect(() => {
    // const genomeConfig = useCurrentGenomeConfig();]

    setGenomeConfig({ ...getGenomeConfig("hg38") });
  }, []);
  return genomeConfig ? (
    <div className="w-full h-full">
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
        userViewRegion={
          currentSession.userViewRegion
            ? currentSession.userViewRegion
            : currentSession.viewRegion
        }
        tool={tool}
      />

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50">
        <Toolbar />
      </div>
    </div>
  ) : (
    ""
  );
}
