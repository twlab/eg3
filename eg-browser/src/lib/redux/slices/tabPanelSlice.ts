import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../createStore";

interface TabPanelState {
  width: number;
  height: number;
}

const initialState: TabPanelState = {
  width: 0,
  height: 0,
};

export const tabPanelSlice = createSlice({
  name: "tabPanel",
  initialState,
  reducers: {
    setSize: (
      state,
      action: PayloadAction<{ width: number; height: number }>,
    ) => {
      state.width = action.payload.width;
      state.height = action.payload.height;
    },
    setWidth: (state, action: PayloadAction<number>) => {
      state.width = action.payload;
    },
    setHeight: (state, action: PayloadAction<number>) => {
      state.height = action.payload;
    },
    resetTabPanelSize: (state) => {
      state.width = 0;
      state.height = 0;
    },
  },
});

export const { setSize, setWidth, setHeight, resetTabPanelSize } =
  tabPanelSlice.actions;

export const selectTabPanelSize = (state: RootState) => state.tabPanel;
export const selectTabPanelWidth = (state: RootState) => state.tabPanel.width;
export const selectTabPanelHeight = (state: RootState) => state.tabPanel.height;

export default tabPanelSlice.reducer;
