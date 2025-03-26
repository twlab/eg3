import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  BrowserSession,
  clearAllSessions,
  deleteSession,
  selectCurrentSessionId,
  selectSessions,
  upsertSession,
} from "@/lib/redux/slices/browserSlice";
import {
  ChevronRightIcon,
  PlusIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/16/solid";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import Switch from "@/components/ui/switch/Switch";
import {
  selectSessionSortPreference,
  setSessionSortPreference,
} from "@/lib/redux/slices/settingsSlice";
import EmptyView from "../ui/empty/EmptyView";
import useGenome from "@/lib/hooks/useGenome";
import Button from "../ui/button/Button";
import { useNavigation } from "../core-navigation/NavigationStack";
import ClearAllButton from "./ClearAllButton";

export default function SessionList({
  onSessionClick,
  showImportSessionButton = false,
}: {
  onSessionClick: (session: BrowserSession) => void;
  showImportSessionButton?: boolean;
}) {
  const dispatch = useAppDispatch();
  const sessions = useAppSelector(selectSessions);
  const currentSessionId = useAppSelector(selectCurrentSessionId);
  const sortPreference = useAppSelector(selectSessionSortPreference);
  const navigation = useNavigation();

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      if (sortPreference === "updatedAt") {
        return b.updatedAt - a.updatedAt;
      }
      return b.createdAt - a.createdAt;
    });
  }, [sessions, sortPreference]);

  const handleClearAll = () => {
    dispatch(clearAllSessions());
  };

  return (
    <div className="flex flex-col gap-4 py-1 h-full">
      {showImportSessionButton && (
        <div className="flex flex-row gap-2 w-full justify-start items-center">
          <Button
            leftIcon={<PlusIcon className="w-4 h-4" />}
            active
            onClick={() => {
              navigation.push({
                path: "import-session",
              });
            }}
          >
            Import Session
          </Button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <p>Sort by last updated</p>
        <Switch
          checked={sortPreference === "updatedAt"}
          onChange={(checked) =>
            dispatch(
              setSessionSortPreference(checked ? "updatedAt" : "createdAt")
            )
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
          {sortedSessions.map((session) => (
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
                allowDelete={
                  currentSessionId === null || session.id !== currentSessionId
                }
              />
            </motion.div>
          ))}
          <ClearAllButton onClearAll={handleClearAll} />
        </AnimatePresence>
      )}
    </div>
  );
}

function SessionListItem({
  session,
  onClick,
  sortPreference,
  allowDelete = false,
}: {
  session: BrowserSession;
  onClick: () => void;
  sortPreference: "createdAt" | "updatedAt";
  allowDelete?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const dispatch = useAppDispatch();
  const { genome, error } = useGenome(session.genomeId);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isConfirmingDelete) {
      timeoutId = setTimeout(() => {
        setIsConfirmingDelete(false);
      }, 2000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isConfirmingDelete]);

  const handleExport = (event: React.MouseEvent) => {
    event.stopPropagation();

    const filename = session.title
      ? `${session.title}.json`
      : `genome_${genome?.name ?? session.genomeId}.json`;

    const sessionData = JSON.stringify(session, null, 2);
    const blob = new Blob([sessionData], { type: "application/json" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDuplicate = (event: React.MouseEvent) => {
    event.stopPropagation();

    const newSession = {
      ...session,
      id: crypto.randomUUID(),
    };

    dispatch(upsertSession(newSession));
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }
    dispatch(deleteSession(session.id));
  };

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
            {sortPreference === "updatedAt"
              ? `Updated: ${new Date(session.updatedAt).toLocaleDateString()}`
              : `Created: ${new Date(session.createdAt).toLocaleDateString()}`}
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
          marginTop: isHovered ? "1rem" : 0,
        }}
        transition={{ duration: 0.2 }}
        className="text-sm text-muted-foreground"
      >
        <div className="flex flex-col gap-2 pt-2 border-t border-primary">
          <p>Last updated: {new Date(session.updatedAt).toLocaleString()}</p>
          <p>View region: {session.viewRegion}</p>
          <p>Active tracks: {session.tracks.length}</p>
          {/* <p>Highlights: {session.highlights.length}</p> */}
          {session.metadataTerms.length > 0 && (
            <div>
              <p>Metadata terms:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {session.metadataTerms.map((term, i) => (
                  <span
                    key={i}
                    className="bg-primary/10 px-2 py-1 rounded-md text-xs"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col items-stretch gap-2">
            {allowDelete && (
              <Button
                backgroundColor={isConfirmingDelete ? "alert" : "tint"}
                onClick={handleDelete}
                style={{ flex: 1 }}
                leftIcon={
                  isConfirmingDelete ? (
                    <ExclamationTriangleIcon className="w-4 h-4" />
                  ) : undefined
                }
              >
                {isConfirmingDelete ? "Confirm Delete" : "Delete"}
              </Button>
            )}
            <Button
              backgroundColor="tint"
              onClick={handleExport}
              style={{ flex: 1 }}
            >
              Export
            </Button>
            <Button
              backgroundColor="tint"
              onClick={handleDuplicate}
              style={{ flex: 1 }}
            >
              Duplicate
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
