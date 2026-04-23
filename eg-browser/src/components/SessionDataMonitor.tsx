import { useEffect, useRef } from "react";
import { useSessionData, SessionData } from "../lib/hooks/useSessionData";

interface SessionDataMonitorProps {
  onSessionUpdate?: (data: SessionData | null) => void;
}

/**
 * Internal component that monitors session data and notifies parent via callback.
 * Must be rendered within AppProvider (Redux context).
 */
export default function SessionDataMonitor({ onSessionUpdate }: SessionDataMonitorProps) {
  const sessionData = useSessionData();
  const prevDataRef = useRef<SessionData | null>(null);

  useEffect(() => {
    if (onSessionUpdate) {
      const prev = prevDataRef.current;
      const hasChanged =
        !prev ||
        !sessionData ||
        prev.title !== sessionData.title ||
        prev.userViewRegion !== sessionData.userViewRegion ||
        prev.tracks !== sessionData.tracks;

      if (hasChanged) {
        onSessionUpdate(sessionData);
        prevDataRef.current = sessionData;
      }
    }
  }, [sessionData, onSessionUpdate]);

  return null; // This component doesn't render anything
}
