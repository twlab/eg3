import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { ITrackModel } from "@eg/tracks";

export const hubSlice = createSlice({
  name: "hub",
  initialState: {
    publicTracksPool: [] as ITrackModel[],
    customTracksPool: [] as ITrackModel[],
    screenshotData: {} as { [key: string]: any },
    screenShotOpen: false as boolean,
  },
  reducers: {
    addPublicTracksPool: (state, action: PayloadAction<ITrackModel[]>) => {
      state.publicTracksPool = action.payload;
    },
    addCustomTracksPool: (state, action: PayloadAction<ITrackModel[]>) => {
      state.customTracksPool = action.payload;
    },
    updateScreenShotData: (
      state,
      action: PayloadAction<{ [key: string]: any }>
    ) => {
      state.screenshotData = action.payload;
    },
    updateScreenShotOpen: (state, action: PayloadAction<boolean>) => {
      state.screenShotOpen = action.payload;
    },
  },
});

export const { addPublicTracksPool } = hubSlice.actions;
export const selectPublicTracksPool = (state: RootState) =>
  state.hub.publicTracksPool;

export const { addCustomTracksPool } = hubSlice.actions;
export const selectCustomTracksPool = (state: RootState) =>
  state.hub.customTracksPool;

export const { updateScreenShotData } = hubSlice.actions;
export const selectScreenShotData = (state: RootState) =>
  state.hub.screenshotData;

export const { updateScreenShotOpen } = hubSlice.actions;
export const selectScreenShotOpen = (state: RootState) =>
  state.hub.screenShotOpen;
export default hubSlice.reducer;
