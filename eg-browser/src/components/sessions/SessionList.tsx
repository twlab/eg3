import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { BrowserSession, selectSessions } from "@/lib/redux/slices/browserSlice";
import { ChevronRightIcon } from "@heroicons/react/16/solid";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import Switch from "@/components/ui/switch/Switch";
import { selectSessionSortPreference, setSessionSortPreference } from "@/lib/redux/slices/settingsSlice";
import EmptyView from "../ui/empty/EmptyView";
import useGenome from "@/lib/hooks/useGenome";

export default function SessionList({
    onSessionClick
}: {
    onSessionClick: (session: BrowserSession) => void;
}) {
    const dispatch = useAppDispatch();
    const sessions = useAppSelector(selectSessions);
    const sortPreference = useAppSelector(selectSessionSortPreference);

    const sortedSessions = useMemo(() => {
        return [...sessions].sort((a, b) => {
            if (sortPreference === 'updatedAt') {
                return b.updatedAt - a.updatedAt;
            }
            return b.createdAt - a.createdAt;
        });
    }, [sessions, sortPreference]);

    return (
        <div className="flex flex-col gap-4 pt-1 h-full">
            <div className="flex items-center justify-between">
                <p>Sort by last updated</p>
                <Switch
                    checked={sortPreference === 'updatedAt'}
                    onChange={(checked) =>
                        dispatch(setSessionSortPreference(checked ? 'updatedAt' : 'createdAt'))
                    }
                />
            </div>
            {sortedSessions.length === 0 ? (
                <EmptyView
                    title="No Sessions Found"
                    description="Sessions are stored locally in your browser. Start a session and it will appear here."
                />
            ) : (
                <AnimatePresence initial={false}>
                    {sortedSessions.map(session => (
                        <motion.div
                            key={session.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <SessionListItem
                                session={session}
                                onClick={() => onSessionClick(session)}
                                sortPreference={sortPreference}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}
        </div>
    );
}

function SessionListItem({
    session,
    onClick,
    sortPreference
}: {
    session: BrowserSession;
    onClick: () => void;
    sortPreference: 'createdAt' | 'updatedAt';
}) {
    const [isHovered, setIsHovered] = useState(false);
    const { genome, error } = useGenome(session.genomeId);

    if (error) {
        return (
            <div className="flex flex-col bg-secondary p-4 rounded-2xl cursor-pointer overflow-hidden">
                <h1 className="text-2xl">Genome ID: {session.genomeId}</h1>
                <p className="text-sm">Error loading genome: {error.message}</p>
            </div>
        );
    }

    return (
        <motion.div
            onClick={onClick}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="flex flex-col bg-secondary p-4 rounded-2xl cursor-pointer overflow-hidden"
            initial={{ height: "auto" }}
            animate={{ height: isHovered ? "auto" : "auto" }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
        >
            <div className="flex flex-row justify-between items-center">
                <div className="flex flex-col gap-2">
                    {session.title.length > 0 ? (
                        <>
                            <h1 className="text-2xl">{session.title}</h1>
                            <p className="text-sm">Genome: {genome?.name ?? "..."}</p>
                        </>
                    ) : (
                        <h1 className="text-2xl">Genome: {genome?.name ?? "..."}</h1>
                    )}
                    <p className="text-sm">
                        {sortPreference === 'updatedAt'
                            ? `Updated: ${new Date(session.updatedAt).toLocaleDateString()}`
                            : `Created: ${new Date(session.createdAt).toLocaleDateString()}`
                        }
                    </p>
                </div>
                <motion.div
                    animate={{ rotate: isHovered ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronRightIcon className="size-6" />
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{
                    opacity: isHovered ? 1 : 0,
                    height: isHovered ? "auto" : 0,
                    marginTop: isHovered ? "1rem" : 0
                }}
                transition={{ duration: 0.2 }}
                className="text-sm text-muted-foreground"
            >
                <div className="flex flex-col gap-2 pt-2 border-t border-primary">
                    <p>Last updated: {new Date(session.updatedAt).toLocaleString()}</p>
                    <p>View region: {session.viewRegion}</p>
                    <p>Active tracks: {session.tracks.length}</p>
                    <p>Highlights: {session.highlights.length}</p>
                    {session.metadataTerms.length > 0 && (
                        <div>
                            <p>Metadata terms:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {session.metadataTerms.map((term, i) => (
                                    <span key={i} className="bg-primary/10 px-2 py-1 rounded-md text-xs">
                                        {term}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
