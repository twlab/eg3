import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";
import { useGenome } from "@/lib/contexts/GenomeContext";
import SessionUI from "@/components/Home/SessionUI";

export default function Session({ params }: NavigationComponentProps) {
  const {
    state,
    onRestoreSession,
    onRetrieveBundle,
    curBundle,
    addSessionState,
    selectedGenome,
  } = useGenome();

  return selectedGenome.length > 0 ? (
    <SessionUI
      bundleId={state.bundleId}
      state={state}
      onRestoreSession={onRestoreSession}
      onRetrieveBundle={onRetrieveBundle}
      curBundle={curBundle}
      addSessionState={addSessionState}
    />
  ) : null;
}
