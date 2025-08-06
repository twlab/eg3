import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { ITrackModel } from "wuepgg3-track";

export const hubSlice = createSlice({
  name: "hub",
  initialState: {
    publicTracksPool: [] as ITrackModel[],
    customTracksPool: [] as ITrackModel[],
    savedDeleteTrackList: [] as ITrackModel[],
    screenshotData: {} as { [key: string]: any },
    screenShotOpen: false as boolean,
    loadedPublicHub: {} as { [key: string]: boolean },
    bundle: {
      bundleId: crypto.randomUUID(),
      currentId: null,
      sessionInBundle: null,
    } as {
      bundleId: string;
      currentId: string | null;
      sessionInBundle: { [key: string]: any } | null;
    },
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

    updateBundle: (
      state,
      action: PayloadAction<{
        bundleId: string;
        currentId: string | null;
        sessionInBundle: { [key: string]: any } | null;
      }>
    ) => {
      state.bundle = action.payload;
    },
    updateScreenShotOpen: (state, action: PayloadAction<boolean>) => {
      state.screenShotOpen = action.payload;
    },
    updateLoadedPublicHub: (
      state,
      action: PayloadAction<{ [key: string]: boolean }>
    ) => {
      state.loadedPublicHub = action.payload;
    },
    updateSavedDeleteTrackList: (
      state,
      action: PayloadAction<ITrackModel[]>
    ) => {
      state.savedDeleteTrackList = action.payload;
    },
    resetState: (state) => {
      state.publicTracksPool = [];
      state.customTracksPool = [];
      state.savedDeleteTrackList = [];
      state.screenshotData = {};
      state.screenShotOpen = false;
      state.loadedPublicHub = {};
      state.bundle = {
        bundleId: crypto.randomUUID(),
        currentId: null,
        sessionInBundle: null,
      };
    },
  },
});
export const {
  addPublicTracksPool,
  addCustomTracksPool,
  updateScreenShotData,
  updateScreenShotOpen,
  resetState,
  updateLoadedPublicHub,
  updateBundle,
  updateSavedDeleteTrackList,
} = hubSlice.actions;

export const selectPublicTracksPool = (state: RootState) =>
  state.hub.publicTracksPool;
export const selectCustomTracksPool = (state: RootState) =>
  state.hub.customTracksPool;
export const selectScreenShotData = (state: RootState) =>
  state.hub.screenshotData;
export const selectScreenShotOpen = (state: RootState) =>
  state.hub.screenShotOpen;
export const selectLoadedPublicHub = (
  state: RootState
): { [key: string]: boolean } => state.hub.loadedPublicHub;
export const selectBundle = (state: RootState) => state.hub.bundle;
export const selectSavedDeleteTrackList = (state: RootState) =>
  state.hub.savedDeleteTrackList;

export default hubSlice.reducer;
