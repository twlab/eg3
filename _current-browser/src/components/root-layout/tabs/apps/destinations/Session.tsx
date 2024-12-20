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
    } = useGenome();

    return (
        <SessionUI
            bundleId={state.bundleId}
            state={state}
            onRestoreSession={onRestoreSession}
            onRetrieveBundle={onRetrieveBundle}
            curBundle={curBundle}
            addSessionState={addSessionState}
        />
    );
}
