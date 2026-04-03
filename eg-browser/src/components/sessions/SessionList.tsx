import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  BrowserSession,
  clearAllSessions,
  deleteSession,
  selectCurrentSessionId,
  selectSessions,
  upsertSession,
  updateSession,
  selectCurrentSession,
} from "@/lib/redux/slices/browserSlice";
import { PlusIcon, ExclamationTriangleIcon } from "@heroicons/react/16/solid";
import { XMarkIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect, useRef } from "react";
import Switch from "@/components/ui/switch/Switch";
import {
  selectSessionSortPreference,
  setSessionSortPreference,
} from "@/lib/redux/slices/settingsSlice";
import EmptyView from "../ui/empty/EmptyView";
import useGenome from "@/lib/hooks/useGenome";
import Button from "../ui/button/Button";
import ClearAllButton from "./ClearAllButton";
import { generateUUID } from "wuepgg3-track";
import Session from "../root-layout/tabs/apps/destinations/Session";
import { fetchBundle } from "@/lib/redux/thunk/session";
import SessionToggleButton from "./SessionToggleButton";
import FileInput from "@/components/ui/input/FileInput";
import useExpandedNavigationTab from "../../lib/hooks/useExpandedNavigationTab";

// Session toggle button is provided by SessionToggleButton (shared component)

export default function SessionList({
  onSessionClick,

  onRequestClose,
  open = true,
}: {
  onSessionClick: (session: BrowserSession) => void;
  showImportSessionButton?: boolean;
  onRequestClose?: () => void;
  open?: boolean;
}) {
  const dispatch = useAppDispatch();
  const sessions = useAppSelector(selectSessions);
  const currentSession = useAppSelector(selectCurrentSession);
  const currentSessionId = useAppSelector(selectCurrentSessionId);
  const sortPreference = useAppSelector(selectSessionSortPreference);
  const [sessionTab, setSessionTab] = useState<"edit" | "load" | "switch">(
    "edit",
  );

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      if (sortPreference === "updatedAt") {
        return b.updatedAt - a.updatedAt;
      }
      return b.createdAt - a.createdAt;
    });
  }, [sessions, sortPreference]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleClearAll = () => {
    dispatch(clearAllSessions());
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full relative">
      <div className="relative flex items-center min-h-[40px]">
        <div className="absolute left-0 top-0 flex items-center">
          {!currentSession?.genomeId && (
            <ClearAllButton
              onClearAll={handleClearAll}
              compact
              title={"Clear All Sessions"}
            />
          )}
        </div>
        <div className="absolute right-0 top-0 z-40">
          <SessionToggleButton
            open={open}
            onClick={() => {
              if (onRequestClose) onRequestClose();
            }}
            className={"rounded-full bg-white dark:bg-dark-secondary shadow"}
            // count={sessions ? sessions.length : 0}

            count={
              sessionTab === "switch"
                ? sessions.length
                : currentSession?.title
                  ? null
                  : sessions.length
            }
            textContent={
              sessionTab === "switch" ? (
                "Previous sessions"
              ) : currentSession?.title ? (
                <div className="text-left">
                  <div>{`Current Session: "${currentSession.title}"`}</div>
                  <div>
                    Session Bundle ID:{" "}
                    {currentSession.bundleId ? (
                      <span className="text-blue-600">
                        {currentSession.bundleId}
                      </span>
                    ) : (
                      <span className="text-red-600">Not saved remotely</span>
                    )}
                  </div>
                </div>
              ) : (
                "Previous sessions"
              )
            }
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-8">
        {!currentSession?.genomeId ? (
          <div className="flex items-center justify-between p-1 ">
            <p className="text-sm text-primary dark:text-dark-primary">
              Sort last updated
            </p>
            <Switch
              checked={sortPreference === "updatedAt"}
              onChange={(checked) =>
                dispatch(
                  setSessionSortPreference(checked ? "updatedAt" : "createdAt"),
                )
              }
            />
          </div>
        ) : null}
        {currentSession?.genomeId ? (
          <div className="w-full">
            <SessionTabs
              currentSession={currentSession}
              sortedSessions={sortedSessions}
              onSessionClick={onSessionClick}
              sortPreference={sortPreference}
              currentSessionId={currentSessionId}
              tab={sessionTab}
              setTab={setSessionTab}
            />
          </div>
        ) : sortedSessions.length === 0 ? (
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.1 }}
                className="mb-2 mr-2 last:mb-0"
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
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function formatDate(value: string | number | Date) {
  const d = new Date(value);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [codeHover, setCodeHover] = useState<boolean>(false);
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

  const handleCopyBundleId = async () => {
    const id = session && session.bundleId ? session.bundleId : "";
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1500);
      console.log("Bundle ID copied to clipboard", "success", 1500);
    } catch (e) {
      console.error("Failed to copy bundle ID", e);
    }
  };

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
      id: generateUUID(),
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

  const handleRename = (event: React.MouseEvent) => {
    event.stopPropagation();
    const newTitle = window.prompt("Enter new session name:", session.title);
    if (newTitle !== null) {
      dispatch(
        updateSession({
          id: session.id,
          changes: {
            title: newTitle,
          },
        }),
      );
    }
  };

  if (error) {
    return (
      <div className="flex flex-col bg-secondary dark:bg-dark-secondary p-4 rounded-xl cursor-pointer overflow-hidden">
        <h1 className="text-l">Genome ID: {session.genomeId}</h1>
        <p className="text-sm">Error loading genome: {error.message}</p>
      </div>
    );
  }

  return (
    <motion.div
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="flex flex-col bg-secondary dark:bg-dark-secondary p-4 rounded-xl cursor-pointer overflow-hidden"
      initial={{ height: "auto" }}
      animate={{ height: isHovered ? "auto" : "auto" }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <div className="text-primary dark:text-dark-primary flex flex-row justify-between items-center">
        <div className="flex flex-col gap-2">
          {session.title.length > 0 ? (
            <>
              <h1 className="text-l">{`Current Session: ${session.title}`}</h1>
            </>
          ) : (
            ""
          )}
          {session.bundleId ? (
            <p className="text-sm">
              Session Bundle ID:{" "}
              <span
                className="text-blue-600 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyBundleId();
                }}
                onMouseEnter={() => setCodeHover(true)}
                onMouseLeave={() => setCodeHover(false)}
                title={session.bundleId ? "Click to copy bundle ID" : ""}
                style={{ textDecoration: codeHover ? "underline" : "none" }}
              >
                {session.bundleId}
              </span>
              {copiedId && (
                <span className="ml-2 text-xs text-green-600">Copied</span>
              )}
            </p>
          ) : (
            <p className="text-sm">
              Session Bundle ID:{" "}
              <span className="text-red-600">Not saved remotely</span>
            </p>
          )}
          <p className="text-sm">
            {session?.customGenome ? "Custom Genome: " : "Genome: "}
            {genome?.name ?? "..."}
          </p>
          <p className="text-sm ">
            {sortPreference === "updatedAt"
              ? `Updated: ${formatDate(session.updatedAt)}`
              : `Created: ${formatDate(session.createdAt)}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {allowDelete && (
            <button
              onClick={(e) => handleDelete(e)}
              className={`p-1 rounded-md text-red-600 transition-colors duration-150 ${isConfirmingDelete ? "bg-alert text-white" : "hover:bg-red-100 dark:hover:bg-red-700"}`}
              onMouseDown={(e) => e.stopPropagation()}
              title={isConfirmingDelete ? "Confirm delete" : "Delete session"}
            >
              {isConfirmingDelete ? (
                <ExclamationTriangleIcon className="w-5 h-5" />
              ) : (
                <XMarkIcon className="w-5 h-5" />
              )}
            </button>
          )}
          <motion.div
            animate={{ rotate: isHovered ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRightIcon className="size-6" />
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          height: isHovered ? "auto" : 0,
          marginTop: isHovered ? "1rem" : 0,
        }}
        transition={{ duration: 0.2 }}
        className="text-sm text-primary dark:text-dark-primary"
      >
        <div className="text-primary dark:text-dark-primary flex flex-col gap-2 pt-2 border-t border-primary">
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col">
              <span className="text-xs opacity-80">Last updated</span>
              <span className="text-sm">{formatDate(session.updatedAt)}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-xs opacity-80">View region</span>
              <span className="text-sm whitespace-normal break-words">
                {session.viewRegion && typeof session.viewRegion === "object"
                  ? session.viewRegion.coordinate
                  : session.viewRegion
                    ? session.viewRegion
                    : ""}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-xs opacity-80">Active tracks</span>
              <span className="text-sm">
                {session.tracks ? session.tracks.length : 0}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-xs opacity-80">Highlights</span>
              <span className="text-sm">
                {session.highlights ? session.highlights.length : 0}
              </span>
            </div>
          </div>
          {/* {session.metadataTerms.length > 0 && (
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
          )} */}
          <div className="flex flex-row items-center gap-1">
            <Button
              backgroundColor="tint"
              onClick={handleExport}
              style={{ width: "175px", fontSize: "14px" }}
            >
              Download Current Session
            </Button>
            <Button
              outlined
              onClick={handleDuplicate}
              // style={{ flex: 1 }}
              style={{ fontSize: "14px" }}
            >
              Duplicate
            </Button>
            <Button
              outlined
              onClick={handleRename}
              // style={{ flex: 1 }}
              style={{ fontSize: "14px" }}
            >
              Rename
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SessionTabs({
  currentSession,
  sortedSessions,
  onSessionClick,
  sortPreference,
  currentSessionId,
  tab,
  setTab,
}: {
  currentSession: BrowserSession;
  sortedSessions: BrowserSession[];
  onSessionClick: (s: BrowserSession) => void;
  sortPreference: "createdAt" | "updatedAt";
  currentSessionId: string | null;
  tab: "edit" | "load" | "switch";
  setTab: (t: "edit" | "load" | "switch") => void;
}) {
  const dispatch = useAppDispatch();
  const [retrieveId, setRetrieveId] = useState<string>("");

  const retrieveBundle = (bundleId: string) => {
    if (!bundleId) return;
    dispatch(fetchBundle(bundleId));
  };

  const uploadSession = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // kept for compatibility with old input-based uploads; no-op here
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BrowserSession;
      if (parsed && parsed.id) {
        dispatch(upsertSession(parsed));
      }
    } catch (err) {
      console.error("Failed to upload session file", err);
    }
  };

  const handleUploadFile = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BrowserSession;
      if (parsed && parsed.id) {
        dispatch(upsertSession(parsed));
      }
    } catch (err) {
      console.error("Failed to upload session file", err);
    }
  };

  const tabDefs = [
    { label: "Edit Current Session", value: "edit" as const },
    { label: "Load Saved Bundle", value: "load" as const },
    { label: "SwitchSessions", value: "switch" as const },
  ];
  const tabIdx = tabDefs.findIndex((t) => t.value === tab);

  return (
    <div className="mt-2 w-full">
      <div className="flex flex-row items-center bg-gray-300 dark:bg-dark-surface relative h-[30px] mb-3 rounded-lg">
        <div
          className="absolute h-[calc(100%-8px)] transition-all duration-300 ease-out bg-secondary dark:bg-dark-secondary rounded-lg"
          style={{
            width: `calc(${100 / tabDefs.length}% - 8px)`,
            left: `calc(${tabIdx * 100}% / ${tabDefs.length} + 4px)`,
          }}
        />
        {tabDefs.map((t) => (
          <div
            key={t.value}
            className="text-primary dark:text-dark-primary relative flex-1 text-center py-1 rounded-lg cursor-pointer z-10 transition-colors text-sm"
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </div>
        ))}
      </div>

      <div>
        {tab === "edit" && <Session tab={false} />}

        {tab === "load" && (
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-center gap-2">
              <input
                type="text"
                className="flex-1 max-w-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-dark-surface text-primary dark:text-dark-primary text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="Session Bundle ID"
                value={retrieveId}
                onChange={(e) => setRetrieveId(e.target.value.trim())}
              />
              <Button onClick={() => retrieveBundle(retrieveId)}>
                Retrieve
              </Button>
            </div>

            <div className="w-full max-w-md mx-auto mt-3">
              <FileInput
                accept=".json"
                onFileChange={handleUploadFile}
                dragMessage="Drag and drop a .json session file here"
                className="mx-auto w-full"
              />
            </div>
          </div>
        )}

        {tab === "switch" && (
          <div className="flex-1 min-h-0 overflow-y-auto px-0">
            <AnimatePresence initial={false}>
              {sortedSessions.map((session) => (
                <motion.div
                  key={session.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.1 }}
                  className="mb-2 mr-2 last:mb-0"
                >
                  <SessionListItem
                    session={session}
                    onClick={() => onSessionClick(session)}
                    sortPreference={sortPreference}
                    allowDelete={false}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
