import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ToolState, TOGGLE_TOOLS, ACTION_TOOLS } from "wuepgg3-track";
import { RootState } from "../createStore";

interface UtilityState {
  toolState: ToolState;
  shortLink: string;
  fullUrlForShortLink: string;
  /**
   * True while localStorage is too full to persist the browser state. Only the
   * storage-full banner reads it, so a full quota never blocks the page.
   */
  storageFull: boolean;
  /**
   * Total serialized size of every saved session at the moment the persist
   * write failed. This is the baseline the pruner trims back to, and keeping it
   * fixed is what makes pruning idempotent: trimming to 70% of a *fixed* number
   * does nothing once you are already under it, whereas trimming to 70% of
   * whatever is left would delete another 30% on every trigger.
   */
  sessionBytesAtLimit: number;
  /**
   * Set when the user deletes sessions while the banner is up. It means "the
   * next persist write is a re-test": if that write succeeds there is room
   * again and the banner dismisses itself, and if it fails storage is still
   * full and the banner stays.
   */
  awaitingStorageRecheck: boolean;
  /**
   * Storage is close to full but still writable — the early warning, raised
   * well before anything starts failing or being deleted.
   */
  storageNearlyFull: boolean;
  /**
   * The user dismissed that warning. Kept so the same warning is not raised
   * again on every check; it re-arms once there is comfortable room again.
   */
  storageWarningAcknowledged: boolean;
}

const initialToolState: ToolState = {
  tool: "Drag",
  actionTool: null,
  actionCount: 0,
};

const initialState: UtilityState = {
  toolState: initialToolState,
  shortLink: "",
  fullUrlForShortLink: "",
  storageFull: false,
  sessionBytesAtLimit: 0,
  awaitingStorageRecheck: false,
  storageNearlyFull: false,
  storageWarningAcknowledged: false,
};

export const utilitySlice = createSlice({
  name: "utility",
  initialState,
  reducers: {

    /**
     * Set the active toggle tool.
     * If the same tool is already active, it is deselected (set to null).
     * Selecting a new toggle tool replaces any previously active toggle tool.
     */
    setToggleTool: (state, action: PayloadAction<string | null>) => {
      const next = action.payload;
      if (next === null || state.toolState.tool === next) {
        state.toolState.tool = null;
      } else if (TOGGLE_TOOLS.has(next)) {
        state.toolState.tool = next;
      }
    },
    /**
     * Dispatch an action tool (pan/zoom). Increments actionCount so the same
     * action can be triggered multiple times in a row.
     */
    dispatchAction: (state, action: PayloadAction<string>) => {
      if (ACTION_TOOLS.has(action.payload)) {
        state.toolState.actionTool = action.payload;
        state.toolState.actionCount += 1;
      }
    },
    /**
     * Unselect all toggle tools. Drag is unaffected.
     * Called on Escape keypress.
     */
    escapeTools: (state) => {
      state.toolState.tool = null;
    },
    setShortLink: (
      state,
      action: PayloadAction<{ shortLink: string; fullUrl: string }>,
    ) => {
      state.shortLink = action.payload.shortLink;
      state.fullUrlForShortLink = action.payload.fullUrl;
    },
    clearShortLink: (state) => {
      state.shortLink = "";
      state.fullUrlForShortLink = "";
    },
    /**
     * Raise the storage-full banner. Payload is the total serialized size of
     * all saved sessions at the moment the persist write failed.
     */
    reportStorageFull: (state, action: PayloadAction<number>) => {
      state.storageFull = true;
      state.sessionBytesAtLimit = action.payload;
      state.awaitingStorageRecheck = false;
      // The hard banner says something stronger, so drop the early warning.
      state.storageNearlyFull = false;
    },
    /**
     * Record the result of a headroom probe: true when there is still room to
     * spare, false when storage has crossed the warning mark.
     */
    setStorageHeadroom: (state, action: PayloadAction<boolean>) => {
      if (action.payload) {
        state.storageNearlyFull = false;
        // Comfortable again, so a future squeeze is worth mentioning.
        state.storageWarningAcknowledged = false;
        return;
      }
      if (!state.storageWarningAcknowledged) state.storageNearlyFull = true;
    },
    /** Dismiss the early warning. Nothing is deleted — there is still room. */
    dismissStorageNearlyFull: (state) => {
      state.storageNearlyFull = false;
      state.storageWarningAcknowledged = true;
    },
    /**
     * Dismiss the banner — the X button, or a re-test that found room again.
     */
    clearStorageFull: (state) => {
      state.storageFull = false;
      state.sessionBytesAtLimit = 0;
      state.awaitingStorageRecheck = false;
    },
    /**
     * The user just deleted sessions: have the next persist write decide
     * whether storage is still full.
     */
    requestStorageRecheck: (state) => {
      if (state.storageFull) state.awaitingStorageRecheck = true;
    },
    /** That re-test hit the quota again, so the banner stays up. */
    storageRecheckFailed: (state) => {
      state.awaitingStorageRecheck = false;
    },
    /**
     * Reset the utility slice back to its initial state.
     * Use `dispatch(resetUtility())` to restore defaults.
     *
     * The storage-full fields are carried over: a full localStorage is a
     * property of the browser, not of the session being opened, and this runs
     * on every session change — which is exactly when the banner needs to stay
     * up and the pruner needs its size baseline.
     */
    resetUtility: (state) => ({
      ...initialState,
      storageFull: state.storageFull,
      sessionBytesAtLimit: state.sessionBytesAtLimit,
      awaitingStorageRecheck: state.awaitingStorageRecheck,
      storageNearlyFull: state.storageNearlyFull,
      storageWarningAcknowledged: state.storageWarningAcknowledged,
    }),
  },
});

export const {
  setToggleTool,
  dispatchAction,
  escapeTools,
  setShortLink,
  clearShortLink,
  reportStorageFull,
  setStorageHeadroom,
  dismissStorageNearlyFull,
  clearStorageFull,
  requestStorageRecheck,
  storageRecheckFailed,
  resetUtility,
} = utilitySlice.actions;

export const selectToolState = (state: RootState) => state.utility.toolState;
export const selectShortLink = (state: RootState) => state.utility.shortLink;
export const selectFullUrlForShortLink = (state: RootState) =>
  state.utility.fullUrlForShortLink;
export const selectStorageFull = (state: RootState) => state.utility.storageFull;
export const selectSessionBytesAtLimit = (state: RootState) =>
  state.utility.sessionBytesAtLimit;
export const selectStorageNearlyFull = (state: RootState) =>
  state.utility.storageNearlyFull;

export default utilitySlice.reducer;
