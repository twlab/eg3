import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";
import { useGenome } from "@/lib/contexts/GenomeContext";

import TextTrack from "@/components/GenomeView/TabComponents/TextTrack";
export default function LocalTextTracks({ params }: NavigationComponentProps) {
  const { onTracksAdded } = useGenome();

  return <TextTrack onTracksAdded={onTracksAdded} />;
}
