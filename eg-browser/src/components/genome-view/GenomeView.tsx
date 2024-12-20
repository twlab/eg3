import { GenomeState } from "../../lib/redux/slices/genomeSlice";
import BrowserPlaceholder from "../../assets/browser-placeholder.jpg";
import { TrackContainer, ITrackContainerState } from '@eg/tracks';

export default function GenomeView({
    genome
}: {
    genome: GenomeState;
}) {

    return (
        <div className="h-full">
            <TrackContainer

            />
            <img src={BrowserPlaceholder} alt="browser" />
        </div>
    );
}
