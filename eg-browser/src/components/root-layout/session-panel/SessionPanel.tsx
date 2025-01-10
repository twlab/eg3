import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { BrowserSession, selectSessions, setCurrentSession } from "@/lib/redux/slices/browserSlice";
import { setSessionPanelOpen } from "@/lib/redux/slices/navigationSlice";
import { ChevronRightIcon } from "@heroicons/react/16/solid";

export default function SessionPanel() {
    const dispatch = useAppDispatch();
    const sessions = useAppSelector(selectSessions);

    const handleSessionClick = (session: BrowserSession) => {
        dispatch(setCurrentSession(session.id));
        dispatch(setSessionPanelOpen(false));
    };

    return (
        <div className="flex flex-col gap-4 p-4">
            {sessions.map(session => (
                <div
                    key={session.id}
                    onClick={() => handleSessionClick(session)}
                    className="flex flex-row gap-4 bg-secondary p-4 rounded-2xl justify-between items-center cursor-pointer"
                >
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl">Genome: {session.genome}</h1>
                        <p className="text-sm">
                            Created: {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <ChevronRightIcon className="size-6" />
                    </div>
                </div>
            ))}
        </div>
    );
}
