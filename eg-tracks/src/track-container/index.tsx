import { ITrackContainerState } from "../types";
import TracksPlaceholder from "../assets/tracks-placeholder.jpg";

export function TrackContainer(props: ITrackContainerState) {

    return (
        <div>
            <img src={TracksPlaceholder} alt="tracks" />
        </div>
    )
}
