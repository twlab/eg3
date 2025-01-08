import { useAppSelector } from "@/lib/redux/hooks";
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import { ITrackContainerState, TrackContainer } from "@eg/tracks";

import BrowserPlaceholder from "../../assets/browser-placeholder.jpg";
import { GenomeState } from "../../lib/redux/slices/genomeSlice";

export default function GenomeView() {
  const currentSession = useAppSelector(selectCurrentSession);

  console.log(currentSession);

  return (
    <div className="h-full">
      <TrackContainer tracks={[]} />
    </div>
  );
}
