import NavigationStack from "@/components/core-navigation/NavigationStack";
import { useAppDispatch } from "@/lib/redux/hooks";
import { BrowserSession, setCurrentSession } from "@/lib/redux/slices/browserSlice";
import { setSessionPanelOpen } from "@/lib/redux/slices/navigationSlice";
import { PlusIcon } from "@heroicons/react/24/outline";
import SessionList from "./SessionList";

export default function SessionPanel() {
    const dispatch = useAppDispatch();

    const handleSessionClick = (session: BrowserSession) => {
        dispatch(setCurrentSession(session.id));
        dispatch(setSessionPanelOpen(false));
    };

    const handleNewSession = () => {
        dispatch(setCurrentSession(null));
        dispatch(setSessionPanelOpen(false));
    }

    return (
        <NavigationStack
            destinations={[]}
            rootOptions={{
                title: 'Sessions',
                trailing: (
                    <button className="text-primary dark:text-dark-primary" onClick={handleNewSession}>
                        <PlusIcon className="size-6" />
                    </button>
                )
            }}
        >
           <SessionList onSessionClick={handleSessionClick} />
        </NavigationStack>
    );
}
