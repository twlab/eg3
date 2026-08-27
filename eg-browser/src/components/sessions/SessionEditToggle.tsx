import { CheckIcon } from "@heroicons/react/24/outline";

import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  selectCurrentSessionId,
  selectSessions,
} from "@/lib/redux/slices/browserSlice";
import {
  selectSessionEditMode,
  setSessionEditMode,
} from "@/lib/redux/slices/navigationSlice";

/**
 * The Edit button that turns the session list's multi-select on and off: the
 * word while it is off, a round tick to confirm while it is on.
 *
 * Self-contained on purpose: it reads everything it needs from the store, so it
 * can be handed to the panel chrome as an action without the panel knowing
 * anything about sessions.
 *
 * Renders nothing only when there is nothing to select: an empty list, or a
 * list holding just the session you are already in, which can't be deleted.
 * It shows on either tab — turning it on switches to the session list, which is
 * where the selecting happens.
 */
export default function SessionEditToggle() {
  const dispatch = useAppDispatch();
  const editMode = useAppSelector(selectSessionEditMode);
  const sessions = useAppSelector(selectSessions);
  const currentSessionId = useAppSelector(selectCurrentSessionId);

  const hasDeletableSession = sessions.some(
    (session) => session.id !== currentSessionId,
  );
  if (!editMode && !hasDeletableSession) return null;

  const label = editMode ? "Done selecting sessions" : "Select sessions";

  return (
    <button
      type="button"
      onClick={() => dispatch(setSessionEditMode(!editMode))}
      title={label}
      aria-label={label}
      aria-pressed={editMode}
      className={[
        // A circle in both states: the word sits inside it rather than
        // stretching it into a pill.
        "shrink-0 inline-flex size-8 items-center justify-center rounded-full shadow outline-none",
        "text-[14px] font-medium cursor-pointer transition-colors duration-200 hover:shadow-md",
        editMode
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "bg-white dark:bg-dark-secondary text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700",
      ].join(" ")}
    >
      {editMode ? <CheckIcon className="size-4" /> : "Edit"}
    </button>
  );
}
