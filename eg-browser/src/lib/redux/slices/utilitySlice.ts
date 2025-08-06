import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Tool } from "wuepgg3-track";
import { RootState } from "../store";

interface UtilityState {
  tool: Tool | null;
  shortLink: string;
  fullUrlForShortLink: string;
}

const initialState: UtilityState = {
  tool: Tool.Drag,
  shortLink: "",
  fullUrlForShortLink: "",
};

export const utilitySlice = createSlice({
  name: "utility",
  initialState,
  reducers: {
    setTool: (state, action: PayloadAction<Tool | null>) => {
      state.tool = action.payload;
    },
    setShortLink: (
      state,
      action: PayloadAction<{ shortLink: string; fullUrl: string }>
    ) => {
      state.shortLink = action.payload.shortLink;
      state.fullUrlForShortLink = action.payload.fullUrl;
    },
    clearShortLink: (state) => {
      state.shortLink = "";
      state.fullUrlForShortLink = "";
    },
  },
});

export const { setTool, setShortLink, clearShortLink } = utilitySlice.actions;

export const selectTool = (state: RootState) => state.utility.tool;
export const selectShortLink = (state: RootState) => state.utility.shortLink;
export const selectFullUrlForShortLink = (state: RootState) =>
  state.utility.fullUrlForShortLink;

export default utilitySlice.reducer;
