import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ToolState, TOGGLE_TOOLS, ACTION_TOOLS } from "wuepgg3-track";
import { RootState } from "../createStore";

interface UtilityState {
  toolState: ToolState;
  shortLink: string;
  fullUrlForShortLink: string;
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
     * Reset the utility slice back to its initial state.
     * Use `dispatch(resetUtility())` to restore defaults.
     */
    resetUtility: () => initialState,
  },
});

export const {
  setToggleTool,
  dispatchAction,
  escapeTools,
  setShortLink,
  clearShortLink,
  resetUtility,
} = utilitySlice.actions;

export const selectToolState = (state: RootState) => state.utility.toolState;
export const selectShortLink = (state: RootState) => state.utility.shortLink;
export const selectFullUrlForShortLink = (state: RootState) =>
  state.utility.fullUrlForShortLink;

export default utilitySlice.reducer;
