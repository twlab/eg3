import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";

import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { dismissNotice, selectNotice } from "@/lib/redux/slices/utilitySlice";

/**
 * A dismissible message at the top of the page, for things the user should
 * know but that must not stop them: a link that could only be loaded in part,
 * a hub that could not be fetched. It replaces blocking `alert()` dialogs, so
 * the browser underneath is usable while the message is up. It stays until
 * dismissed, since it may explain why the view is not what a link promised.
 */
export default function NoticeBanner({
  top,
}: {
  /** Distance from the top of the viewport, so it clears the nav bar. */
  top: number;
}) {
  const dispatch = useAppDispatch();
  const notice = useAppSelector(selectNotice);
  const isError = notice?.level === "error";

  return (
    // centered, so it does not sit on the storage banner in the right corner
    <div
      className="fixed inset-x-0 z-50 flex justify-center px-3 pointer-events-none"
      style={{ top }}
    >
      <AnimatePresence>
        {notice ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            role={isError ? "alert" : "status"}
            className={`pointer-events-auto max-w-xl rounded-lg bg-white dark:bg-dark-secondary shadow-lg border p-2.5 ${
              isError ? "border-red-400/60" : "border-blue-400/60"
            }`}
          >
            <div className="flex items-start gap-2">
              {isError ? (
                <ExclamationTriangleIcon className="size-4 shrink-0 mt-0.5 text-red-500" />
              ) : (
                <InformationCircleIcon className="size-4 shrink-0 mt-0.5 text-blue-500" />
              )}
              <p className="flex-1 text-xs leading-snug text-primary dark:text-dark-primary">
                {notice.message}
              </p>
              <button
                type="button"
                onClick={() => dispatch(dismissNotice())}
                className="shrink-0 p-0.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-700 transition-colors duration-150"
                title="Dismiss"
                aria-label="Dismiss message"
              >
                <XMarkIcon className="size-4" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
