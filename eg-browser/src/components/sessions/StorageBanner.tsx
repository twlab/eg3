import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";

import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  clearStorageFull,
  dismissStorageNearlyFull,
  selectStorageFull,
  selectStorageNearlyFull,
} from "@/lib/redux/slices/utilitySlice";
import { pruneSessionsToTarget } from "@/lib/redux/thunk/storage";

/**
 * Small toast-style notice, pinned to the top right, for the two states worth
 * telling the user about: storage is getting tight (the early warning), or it
 * is full and saves are failing.
 *
 * It is deliberately unobtrusive: it never dims the page, never traps focus and
 * covers nothing but its own corner, so the browser keeps working while it is
 * up. It also has no auto-dismiss — the only way it goes away is the X, or the
 * user freeing space themselves.
 */
export default function StorageBanner({
  top,
  onOpenSessions,
}: {
  /** Distance from the top of the viewport, so it clears the nav bar. */
  top: number;
  /** Opens the session list straight into its multi-select delete mode. */
  onOpenSessions: () => void;
}) {
  const dispatch = useAppDispatch();
  const storageFull = useAppSelector(selectStorageFull);
  const nearlyFull = useAppSelector(selectStorageNearlyFull);

  // Full is the more serious of the two, so it wins if both are somehow set.
  const level = storageFull ? "full" : nearlyFull ? "nearly" : null;

  const handleDismiss = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (storageFull) {
      // Prune first: the pruner reads the size baseline that `clearStorageFull`
      // resets, so clearing first would leave it with nothing to trim back to.
      dispatch(pruneSessionsToTarget());
      dispatch(clearStorageFull());
      return;
    }
    // Nothing is deleted at the warning stage — there is still room, and the
    // user has been given the chance to choose for themselves.
    dispatch(dismissStorageNearlyFull());
  };

  return (
    <AnimatePresence>
      {level ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          // Sits below the session panel (z-60) rather than over it: once the
          // panel is open the user is already where the banner was pointing,
          // and this keeps it off the panel's own close button. It comes back
          // when the panel closes, since only the X actually dismisses it.
          className="fixed right-3 z-50 w-64 rounded-lg bg-white dark:bg-dark-secondary shadow-lg border border-amber-400/60 p-2.5 cursor-pointer"
          style={{ top }}
          role="button"
          tabIndex={0}
          onClick={onOpenSessions}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") onOpenSessions();
          }}
        >
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon
              className={`size-4 shrink-0 mt-0.5 ${
                level === "full" ? "text-red-500" : "text-amber-500"
              }`}
            />
            <p className="flex-1 text-xs leading-snug text-primary dark:text-dark-primary">
              {level === "full" ? (
                <>
                  <span className="font-semibold">Session full.</span> Oldest
                  sessions will be automatically deleted.{" "}
                </>
              ) : (
                <>
                  <span className="font-semibold">Sessions almost full.</span>{" "}
                  Once full, the oldest will be deleted automatically.{" "}
                </>
              )}
              <span className="text-blue-600 dark:text-blue-400 underline">
                Click here to choose which session to delete.
              </span>
            </p>
            <button
              type="button"
              onClick={handleDismiss}
              className="shrink-0 p-0.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-700 transition-colors duration-150"
              title="Dismiss"
              aria-label="Dismiss storage warning"
            >
              <XMarkIcon className="size-4" />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
