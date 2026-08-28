import { ActionCreators } from "redux-undo";

import {
  getSerializedSize,
  hasStorageHeadroom,
} from "@/lib/utils/storageManager";
import { BrowserSession, pruneOldestSessions } from "../slices/browserSlice";
import { setStorageHeadroom } from "../slices/utilitySlice";
import type { AppDispatch, RootState } from "../createStore";

/**
 * How much of the "full" session payload to keep when making room.
 *
 * Trimming all the way back to the limit would leave zero headroom and the
 * banner would come straight back on the next write; 70% buys enough room for
 * a good number of new sessions before the quota is hit again.
 */
export const STORAGE_PRUNE_RATIO = 0.7;

/**
 * How much room must be left before the early warning goes up: 10% free, i.e.
 * roughly 90% full.
 */
export const STORAGE_WARNING_HEADROOM = 0.1;

/**
 * Measure how much room localStorage has left and raise (or drop) the early
 * warning accordingly.
 *
 * Cheap enough to run whenever the session set changes, and no cheaper: it
 * writes a probe proportional to current usage, so it is deliberately kept off
 * the persist tick.
 */
export const checkStorageHeadroom =
  () =>
  (dispatch: AppDispatch, getState: () => RootState): void => {
    // Already failing writes — the full banner covers it, and a probe would
    // only fail too.
    if (getState().utility.storageFull) return;
    dispatch(setStorageHeadroom(hasStorageHeadroom(STORAGE_WARNING_HEADROOM)));
  };

/**
 * Delete the oldest sessions until the saved sessions take up no more than
 * `STORAGE_PRUNE_RATIO` of what they took up when localStorage filled up.
 *
 * The baseline is the size recorded at the moment the persist write failed
 * (`sessionBytesAtLimit`), not the size right now, which makes this idempotent:
 * running it again once the store is already under target deletes nothing. That
 * matters because every one of the triggers — a new session, a session switch,
 * dismissing the banner — can fire while the banner is still up.
 *
 * Returns the number of sessions deleted.
 */
export const pruneSessionsToTarget =
  () =>
  (dispatch: AppDispatch, getState: () => RootState): number => {
    const state = getState();
    const baseline = state.utility.sessionBytesAtLimit;

    // No recorded baseline means storage never actually reported full, so there
    // is no target to trim to and nothing should be deleted.
    if (!baseline || baseline <= 0) return 0;

    const target = baseline * STORAGE_PRUNE_RATIO;
    const { currentSession, sessions } = state.browser.present;

    // `ids` is kept sorted by `createdAt` ascending, so this walks oldest first.
    const ids = sessions.ids as string[];
    const sizeOf = (id: string) =>
      getSerializedSize(sessions.entities[id] as BrowserSession | undefined);

    let remaining = ids.reduce((total, id) => total + sizeOf(id), 0);
    let toDelete = 0;

    for (const id of ids) {
      if (remaining <= target) break;
      // The active session is never pruned, and `pruneOldestSessions` skips it
      // too, so it must not be counted against the delete budget either.
      if (id === currentSession) continue;
      remaining -= sizeOf(id);
      toDelete += 1;
    }

    if (toDelete === 0) return 0;

    dispatch(pruneOldestSessions(toDelete));

    // Undo history keeps a full copy of every session per entry, so it is
    // usually the bulk of what is persisted — and it has to go for correctness
    // as well: undoing past the prune would restore the sessions just deleted
    // and fill storage right back up.
    dispatch(ActionCreators.clearHistory());

    return toDelete;
  };
