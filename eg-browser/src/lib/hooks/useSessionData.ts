import { useAppSelector } from "../redux/hooks";
import { selectCurrentSession } from "../redux/slices/browserSlice";
import { GenomeCoordinate, ITrackModel } from "wuepgg3-track";

export interface SessionData {
  title: string | null;
  userViewRegion: GenomeCoordinate | null;
  tracks: ITrackModel[];
}

/**
 * Hook to access current session data (title, userViewRegion, tracks).
 * Returns null if no session is active.
 * Automatically triggers re-render when these values change.
 */
export function useSessionData(): SessionData | null {
  const currentSession = useAppSelector(selectCurrentSession);

  if (!currentSession) {
    return null;
  }

  return {
    title: currentSession.title,
    userViewRegion: currentSession.userViewRegion,
    tracks: currentSession.tracks,
  };
}
