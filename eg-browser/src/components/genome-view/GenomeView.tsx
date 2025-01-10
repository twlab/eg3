import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import { GenomeCoordinate, IHighlightInterval, ITrackModel, TrackContainerRepresentable } from '@eg/tracks';
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
        dispatch(updateCurrentSession({ viewRegion: coordinate }));
    };

    const handleNewHighlight = (highlights: IHighlightInterval[]) => {
        dispatch(updateCurrentSession({ highlights }));
    };

    const handleTrackSelected = (selectedTracks: ITrackModel[]) => {
        console.log('Selected tracks:', selectedTracks);
    };

    const handleTrackDeleted = (tracks: ITrackModel[]) => {
        dispatch(updateCurrentSession({ tracks }));
    };

    const handleTrackAdded = (tracks: ITrackModel[]) => {
        dispatch(updateCurrentSession({ tracks }));
    };

    const handleNewRegionSelect = (coordinate: GenomeCoordinate) => {
        dispatch(updateCurrentSession({ viewRegion: coordinate }));
    };

    return (
        <div className="h-full flex flex-col items-center justify-between rounded-md">
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
            />

            <div className="fixed bottom-0 z-50">
                <Toolbar />
            </div>
        </div>
    );
}
