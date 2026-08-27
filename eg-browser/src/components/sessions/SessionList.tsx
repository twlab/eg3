import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  BrowserSession,
  deleteSession,
  deleteSessions,
  selectCurrentSessionId,
  selectSessions,
  upsertSession,
  updateSession,
  selectCurrentSession,
} from "@/lib/redux/slices/browserSlice";
import { ExclamationTriangleIcon } from "@heroicons/react/16/solid";
import {
  XMarkIcon,
  ChevronRightIcon,
  CheckIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  selectSessionSortPreference,
  setSessionSortPreference,
} from "@/lib/redux/slices/settingsSlice";
import {
  selectSessionEditMode,
  selectSessionListTab,
  setSessionEditMode,
  setSessionListTab,
} from "@/lib/redux/slices/navigationSlice";
import { requestStorageRecheck } from "@/lib/redux/slices/utilitySlice";
import EmptyView from "../ui/empty/EmptyView";
import useGenome from "@/lib/hooks/useGenome";
import Button from "../ui/button/Button";
import { generateUUID, GenomeSerializer, RegionSet } from "wuepgg3-track";
import Session from "../root-layout/tabs/apps/destinations/Session";

import TabView from "@/components/ui/tab-view/TabView";
import _ from "lodash";
import NavigationContext from "wuepgg3-track/src/models/NavigationContext";

export default function SessionList({
  onSessionClick,
}: {
  onSessionClick: (session: BrowserSession) => void;
  showImportSessionButton?: boolean;
}) {
  const dispatch = useAppDispatch();
  const sessions = useAppSelector(selectSessions);
  const currentSession = useAppSelector(selectCurrentSession);
  const currentSessionId = useAppSelector(selectCurrentSessionId);
  const sortPreference = useAppSelector(selectSessionSortPreference);
  const sessionTab = useAppSelector(selectSessionListTab);
  const setSessionTab = (tab: "edit" | "switch") =>
    dispatch(setSessionListTab(tab));

  // Multi-select ("Edit" / "Done") lives in Redux so the storage-full banner
  // can open this list already in it.
  const editMode = useAppSelector(selectSessionEditMode);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isConfirmingBulkDelete, setIsConfirmingBulkDelete] = useState(false);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      if (sortPreference === "updatedAt") {
        return b.updatedAt - a.updatedAt;
      }
      return b.createdAt - a.createdAt;
    });
  }, [sessions, sortPreference]);

  // The session being viewed can't be deleted, so it can't be selected either.
  const selectableIds = useMemo(
    () =>
      sortedSessions
        .filter((session) => session.id !== currentSessionId)
        .map((session) => session.id),
    [sortedSessions, currentSessionId],
  );

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Entering edit mode has to land on the session list. With an active genome
  // the list is tabbed and opens on "Edit Session", which shows the session's
  // settings rather than the sessions themselves.
  useEffect(() => {
    if (editMode) {
      dispatch(setSessionListTab("switch"));
    } else {
      setSelectedIds([]);
      setIsConfirmingBulkDelete(false);
    }
  }, [editMode, dispatch]);

  // Closing the panel unmounts the list; don't leave edit mode armed for the
  // next time it opens.
  useEffect(() => {
    return () => {
      dispatch(setSessionEditMode(false));
    };
  }, [dispatch]);

  // Forget selections whose session is gone (deleted here, or pruned to make
  // room), so a stale id can never end up in a later bulk delete.
  useEffect(() => {
    setSelectedIds((previous) => {
      const next = previous.filter((id) =>
        sessions.some((session) => session.id === id),
      );
      return next.length === previous.length ? previous : next;
    });
  }, [sessions]);

  // Same two-step confirm as the single-session delete button.
  useEffect(() => {
    if (!isConfirmingBulkDelete) return;
    const timeoutId = setTimeout(() => setIsConfirmingBulkDelete(false), 3000);
    return () => clearTimeout(timeoutId);
  }, [isConfirmingBulkDelete]);

  const toggleSelected = (id: string) => {
    setIsConfirmingBulkDelete(false);
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((selected) => selected !== id)
        : [...previous, id],
    );
  };

  const allSelected =
    selectableIds.length > 0 && selectedIds.length === selectableIds.length;

  const handleToggleSelectAll = () => {
    setIsConfirmingBulkDelete(false);
    setSelectedIds(allSelected ? [] : selectableIds);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (!isConfirmingBulkDelete) {
      setIsConfirmingBulkDelete(true);
      return;
    }
    dispatch(deleteSessions(selectedIds));
    // Clearing space by hand is as good an answer to the storage-full banner as
    // letting it prune for you — so re-test, and let the result decide whether
    // the banner has anything left to say.
    dispatch(requestStorageRecheck());
    setSelectedIds([]);
    setIsConfirmingBulkDelete(false);
  };

  // A loaded session splits the panel into tabs. Both the headings and the
  // multi-select controls then live inside the tab they belong to — Save/Load
  // names the session you are working on and has nothing to select, while
  // Switch Session heads the list and owns Edit.
  const isTabbed = !!currentSession?.genomeId;

  const selectionBar = editMode ? (
    <SelectionActionBar
      selectedCount={selectedIds.length}
      allSelected={allSelected}
      isConfirming={isConfirmingBulkDelete}
      onToggleSelectAll={handleToggleSelectAll}
      onDelete={handleBulkDelete}
    />
  ) : null;

  return (
    <div ref={containerRef} className="flex flex-col h-full relative">
      {!isTabbed && selectionBar ? (
        <div className="px-3 pt-2">{selectionBar}</div>
      ) : null}

      <div
        className={
          isTabbed
            ? "flex-1 min-h-0 px-3 pt-2"
            : "flex-1 min-h-0 overflow-y-auto px-3"
        }
      >
        {!isTabbed && (
          <div className="flex items-center justify-between gap-3 pb-1 pt-1">
            <SessionListTitle
              currentSession={null}
              sessionCount={sessions.length}
            />

            <SessionSortButton
              sortPreference={sortPreference}
              onToggle={() =>
                dispatch(
                  setSessionSortPreference(
                    sortPreference === "updatedAt" ? "createdAt" : "updatedAt",
                  ),
                )
              }
            />
          </div>
        )}
        {isTabbed ? (
          <div className="w-full h-full">
            <SessionTabs
              currentSession={currentSession}
              sortedSessions={sortedSessions}
              onSessionClick={onSessionClick}
              sortPreference={sortPreference}
              currentSessionId={currentSessionId}
              tab={sessionTab}
              setTab={setSessionTab}
              selectionMode={editMode}
              selectedIds={selectedIds}
              onToggleSelected={toggleSelected}
              savedTabHeader={
                <div className="pt-3 pb-2">
                  <SessionListTitle
                    currentSession={currentSession}
                    sessionCount={sessions.length}
                  />
                </div>
              }
              switchTabHeader={
                <>
                  <div className="flex items-center gap-3 pt-3 pb-2">
                    <SessionListTitle
                      currentSession={null}
                      sessionCount={sessions.length}
                    />
                  </div>
                  {selectionBar}
                </>
              }
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
                className="mb-1.5 last:mb-0"
              >
                <SessionListItem
                  session={session}
                  onClick={() => onSessionClick(session)}
                  sortPreference={sortPreference}
                  allowDelete={
                    currentSessionId === null || session.id !== currentSessionId
                  }
                  selectionMode={editMode}
                  selectable={session.id !== currentSessionId}
                  selected={selectedIds.includes(session.id)}
                  isCurrent={session.id === currentSessionId}
                  onToggleSelected={() => toggleSelected(session.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

/**
 * The heading for the session column, at the top of the list it names, instead
 * of riding along inside the close button the way it used to.
 *
 * Pass `currentSession` to name the session being edited; pass null to show the
 * saved-session count instead.
 */
function SessionListTitle({
  currentSession,
  sessionCount,
}: {
  currentSession: BrowserSession | null;
  sessionCount: number;
}) {
  if (currentSession) {
    return (
      <div className="min-w-0 text-left text-primary dark:text-dark-primary">
        <h2 className="text-sm font-semibold truncate">
          {currentSession.title
            ? `Current Session: "${currentSession.title}"`
            : `Current Session: "Untitled Session"`}
        </h2>
        <p className="text-xs truncate">
          Session Bundle ID:{" "}
          {currentSession.bundleId ? (
            <span className="text-blue-600">{currentSession.bundleId}</span>
          ) : (
            <span className="text-red-600">Not saved remotely</span>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 min-w-0 text-primary dark:text-dark-primary">
      <h2 className="text-sm font-semibold truncate">Previous sessions</h2>
      <span className="shrink-0 inline-flex items-center justify-center min-w-5 h-5 px-1 text-xs rounded-full bg-blue-600 text-white">
        {sessionCount}
      </span>
    </div>
  );
}

/**
 * States how the list is ordered, and changes it when clicked.
 *
 * The label names what you are looking at rather than what the click will do —
 * a control that reads "Recently created" while showing recently-updated order
 * would be lying about the list right under it.
 */
function SessionSortButton({
  sortPreference,
  onToggle,
}: {
  sortPreference: "createdAt" | "updatedAt";
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title="Click to sort by the other date"
      className="shrink-0 inline-flex h-7 items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 px-3 text-xs leading-none text-primary dark:text-dark-primary cursor-pointer transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/10"
    >
      {sortPreference === "updatedAt" ? "Recently updated" : "Recently created"}
    </button>
  );
}

/**
 * The bar that replaces the list's normal controls while multi-select is on:
 * select-all on one side, a two-step delete on the other.
 */
function SelectionActionBar({
  selectedCount,
  allSelected,
  isConfirming,
  onToggleSelectAll,
  onDelete,
}: {
  selectedCount: number;
  allSelected: boolean;
  isConfirming: boolean;
  onToggleSelectAll: () => void;
  onDelete: () => void;
}) {
  const isDisabled = selectedCount === 0;

  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-gray-300 dark:border-gray-600">
      <button
        type="button"
        onClick={onToggleSelectAll}
        className="shrink-0 text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
      >
        {allSelected ? "Deselect All" : "Select All"}
      </button>

      <button
        type="button"
        onClick={onDelete}
        disabled={isDisabled}
        className={[
          "shrink-0 inline-flex items-center gap-1 rounded-full py-1 px-3 shadow outline-none",
          "text-sm font-medium text-white transition-colors duration-150",
          isDisabled
            ? "bg-gray-400 opacity-50 cursor-not-allowed"
            : isConfirming
              ? "bg-red-700 hover:bg-red-800 cursor-pointer"
              : "bg-red-600 hover:bg-red-700 cursor-pointer",
        ].join(" ")}
      >
        {isConfirming ? (
          <ExclamationTriangleIcon className="w-4 h-4" />
        ) : (
          <TrashIcon className="w-4 h-4" />
        )}
        {isConfirming
          ? `Confirm delete (${selectedCount})`
          : `Delete (${selectedCount})`}
      </button>
    </div>
  );
}

// The shared Button has no padding of its own, so every caller sizes it. These
// are the compact card's proportions rather than the old full-size ones.
const COMPACT_ACTION_STYLE = {
  fontSize: "12px",
  padding: "4px 10px",
  width: "fit-content",
} as const;

/** A micro-label over its value, sized to sit under the compact card row. */
function DetailField({
  label,
  value,
  wrap = false,
}: {
  label: string;
  value: React.ReactNode;
  wrap?: boolean;
}) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-[10px] uppercase tracking-wide opacity-60">
        {label}
      </span>
      <span
        className={
          wrap ? "text-xs whitespace-normal break-words" : "text-xs truncate"
        }
      >
        {value}
      </span>
    </div>
  );
}

/**
 * A short, readable age — "Just now", "5 min ago", "Yesterday", "3 days ago" —
 * falling back to a plain date past a week, where an exact age stops being the
 * useful thing. `formatDate` still gives the precise timestamp for tooltips.
 */
function formatRelativeTime(value: string | number | Date) {
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return "";

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  // Clock skew can put `then` slightly in the future; that lands in "Just now".
  const elapsed = Date.now() - then;

  if (elapsed < minute) return "Just now";
  if (elapsed < hour) return `${Math.floor(elapsed / minute)} min ago`;
  if (elapsed < day) return `${Math.floor(elapsed / hour)} hr ago`;
  if (elapsed < 7 * day) {
    const days = Math.floor(elapsed / day);
    return days === 1 ? "Yesterday" : `${days} days ago`;
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  selectionMode = false,
  selectable = false,
  selected = false,
  isCurrent = false,
  onToggleSelected,
}: {
  session: BrowserSession;
  onClick: () => void;
  sortPreference: "createdAt" | "updatedAt";
  allowDelete?: boolean;
  selectionMode?: boolean;
  selectable?: boolean;
  selected?: boolean;
  /** This is the session already loaded: marked, and not switchable to. */
  isCurrent?: boolean;
  onToggleSelected?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [codeHover, setCodeHover] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const { genome: _genomeConfig, error } = useGenome(session.genomeId);
  const currentSession = useAppSelector(selectCurrentSession);
  const selectedRegionSet = currentSession?.selectedRegionSet;
  const userViewRegion = currentSession?.userViewRegion;

  // While selecting, a click picks the row rather than opening it, so the
  // detail panel would only be in the way.
  const isExpanded = isHovered && !selectionMode;

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
      // console.log("Bundle ID copied to clipboard", "success", 1500);
    } catch (e) {
      console.error("Failed to copy bundle ID", e);
    }
  };

  const handleExport = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!_genomeConfig) {
      return;
    }
    const filename = session.title
      ? `${session.title}.json`
      : `genome_${_genomeConfig?.name ?? session.genomeId}.json`;

    const cloneSessionData = _.clone(session);
    const genomeConfig = GenomeSerializer.deserialize(_genomeConfig);
    const navContext = genomeConfig.navContext as NavigationContext;
    let setNavContext;
    if (selectedRegionSet) {
      if (typeof selectedRegionSet === "object") {
        const newRegionSet = RegionSet.deserialize(selectedRegionSet);
        setNavContext = newRegionSet.makeNavContext();
      } else {
        setNavContext = selectedRegionSet.makeNavContext();
      }
    }

    const curViewInterval: any = setNavContext
      ? userViewRegion
        ? setNavContext.parse(userViewRegion)
        : setNavContext.parse(genomeConfig.defaultRegion)
      : userViewRegion
        ? navContext.parse(userViewRegion)
        : navContext.parse(genomeConfig.defaultRegion);
    cloneSessionData.genomeName = session.genomeId;
    cloneSessionData.viewInterval = curViewInterval;
    const sessionData = JSON.stringify(cloneSessionData, null, 2);
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
    dispatch(requestStorageRecheck());
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
      <div className="flex flex-col bg-secondary dark:bg-dark-secondary px-3 py-2 rounded-lg overflow-hidden">
        <h3 className="text-sm font-medium">Genome ID: {session.genomeId}</h3>
        <p className="text-xs">Error loading genome: {error.message}</p>
      </div>
    );
  }

  // Selecting picks the row; otherwise the row opens its session — except for
  // the session already loaded, where there is nothing to switch to.
  const isClickable = selectionMode ? selectable : !isCurrent;

  const sortedDate =
    sortPreference === "updatedAt" ? session.updatedAt : session.createdAt;
  const trackCount = session.tracks ? session.tracks.length : 0;

  const handleRowClick = () => {
    if (selectionMode) {
      if (selectable) onToggleSelected?.();
      return;
    }
    if (isCurrent) return;
    onClick();
  };

  return (
    <div
      onClick={handleRowClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={[
        "flex flex-col px-3 py-2 rounded-lg overflow-hidden border transition-colors duration-150",
        isCurrent
          ? "bg-green-50 dark:bg-green-900/20 border-green-500"
          : selected
            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
            : "bg-secondary dark:bg-dark-secondary border-transparent",
        // Highlight whatever the pointer is over, so it is obvious which row a
        // click will land on — most of all while picking several to delete.
        isClickable && !selected && !isCurrent
          ? "hover:bg-blue-50/70 hover:border-blue-300 dark:hover:bg-blue-900/10 dark:hover:border-blue-700"
          : "",
        isClickable ? "cursor-pointer" : "cursor-default",
      ].join(" ")}
    >
      <div className="text-primary dark:text-dark-primary flex flex-row items-center gap-3">
        {selectionMode &&
          (selectable ? (
            <div
              className={[
                "shrink-0 size-5 rounded-full border flex items-center justify-center transition-colors duration-150",
                selected
                  ? "bg-blue-600 border-blue-600"
                  : "border-gray-400 dark:border-gray-500",
              ].join(" ")}
              role="checkbox"
              aria-checked={selected}
            >
              {selected && <CheckIcon className="size-3.5 text-white" />}
            </div>
          ) : (
            // Keeps the current session's text aligned with the rest, and says
            // why it has no checkbox.
            <div
              className="shrink-0 size-5"
              title="The session you're viewing can't be deleted"
            />
          ))}

        {/* Everything the eye needs stacked into two tight lines, using the
            width that was going spare rather than four lines of height. */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-medium truncate">
              {session.title && session.title.length > 0
                ? session.title
                : "Untitled Session"}
            </h3>
            {isCurrent && (
              <span className="shrink-0 rounded-full bg-green-600 px-1.5 py-0.5 text-[10px] leading-none text-white">
                Current
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 min-w-0 text-xs text-primary/70 dark:text-dark-primary/70">
            {/* Exact timestamp stays a hover away, so the line can stay short. */}
            <span
              className="shrink-0 whitespace-nowrap"
              title={formatDate(sortedDate)}
            >
              {formatRelativeTime(sortedDate)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="shrink-0 whitespace-nowrap">
              {trackCount} {trackCount === 1 ? "track" : "tracks"}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{_genomeConfig?.name ?? "…"}</span>
            <span aria-hidden="true">·</span>
            {session.bundleId ? (
              <span
                className="truncate text-blue-600 dark:text-blue-400 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyBundleId();
                }}
                onMouseEnter={() => setCodeHover(true)}
                onMouseLeave={() => setCodeHover(false)}
                title="Click to copy bundle ID"
                style={{ textDecoration: codeHover ? "underline" : "none" }}
              >
                {copiedId ? "Copied" : session.bundleId}
              </span>
            ) : (
              <span className="shrink-0 text-red-600">Not saved remotely</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectionMode ? null : (
            <>
              {allowDelete && (
                <button
                  onClick={(e) => handleDelete(e)}
                  className={`p-1 rounded-md text-red-600 transition-colors duration-150 ${isConfirmingDelete ? "bg-alert text-white" : "hover:bg-red-100 dark:hover:bg-red-700"}`}
                  onMouseDown={(e) => e.stopPropagation()}
                  title={
                    isConfirmingDelete ? "Confirm delete" : "Delete session"
                  }
                >
                  {isConfirmingDelete ? (
                    <ExclamationTriangleIcon className="w-4 h-4" />
                  ) : (
                    <XMarkIcon className="w-4 h-4" />
                  )}
                </button>
              )}
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </motion.div>
            </>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: isExpanded ? 1 : 0,
          height: isExpanded ? "auto" : 0,
          marginTop: isExpanded ? "0.75rem" : 0,
        }}
        transition={{ duration: 0.2 }}
        className="text-sm text-primary dark:text-dark-primary overflow-hidden"
      >
        <div className="text-primary dark:text-dark-primary flex flex-col gap-2.5 pt-2 border-t border-gray-300 dark:border-gray-600">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <DetailField
              label="View region"
              value={
                session.viewRegion && typeof session.viewRegion === "object"
                  ? session.viewRegion.coordinate
                  : session.viewRegion
                    ? session.viewRegion
                    : "—"
              }
              wrap
            />
            <DetailField
              label="Highlights"
              value={session.highlights ? session.highlights.length : 0}
            />
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
          <div className="flex flex-row flex-wrap items-center gap-1.5">
            <Button
              backgroundColor="tint"
              onClick={handleExport}
              style={COMPACT_ACTION_STYLE}
            >
              Download
            </Button>
            <Button
              outlined
              onClick={handleDuplicate}
              style={COMPACT_ACTION_STYLE}
            >
              Duplicate
            </Button>
            <Button
              outlined
              onClick={handleRename}
              style={COMPACT_ACTION_STYLE}
            >
              Rename
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SessionTabs({
  sortedSessions,
  onSessionClick,
  sortPreference,
  currentSessionId,
  tab,
  setTab,
  selectionMode,
  selectedIds,
  onToggleSelected,
  savedTabHeader,
  switchTabHeader,
}: {
  currentSession: BrowserSession;
  sortedSessions: BrowserSession[];
  onSessionClick: (s: BrowserSession) => void;
  sortPreference: "createdAt" | "updatedAt";
  currentSessionId: string | null;
  tab: "edit" | "switch";
  setTab: (t: "edit" | "switch") => void;
  selectionMode: boolean;
  selectedIds: string[];
  onToggleSelected: (id: string) => void;
  /** Heading rendered under the tab bar, inside the Save/Load tab. */
  savedTabHeader?: React.ReactNode;
  /** Heading and multi-select controls, inside the Switch Session tab. */
  switchTabHeader?: React.ReactNode;
}) {
  return (
    <div className="w-full h-full">
      <TabView
        className="h-full"
        selectedTab={tab}
        onTabChange={setTab}
        tabs={[
          {
            label: "Save/Load Session",
            value: "edit" as const,
            component: (
              <div className="w-full h-full overflow-y-auto">
                {savedTabHeader}
                <Session tab={false} />
              </div>
            ),
          },

          {
            label: "Switch Session",
            value: "switch" as const,
            component: (
              <div className="h-full overflow-y-auto">
                {switchTabHeader}
                <AnimatePresence initial={false}>
                  {sortedSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.1 }}
                      className="mb-1.5 last:mb-0"
                    >
                      <SessionListItem
                        session={session}
                        onClick={() => onSessionClick(session)}
                        sortPreference={sortPreference}
                        allowDelete={false}
                        selectionMode={selectionMode}
                        selectable={session.id !== currentSessionId}
                        selected={selectedIds.includes(session.id)}
                        isCurrent={session.id === currentSessionId}
                        onToggleSelected={() => onToggleSelected(session.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
