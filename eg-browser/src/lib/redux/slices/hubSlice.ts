import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { ITrackModel } from "@eg/tracks";

export const hubSlice = createSlice({
  name: "hub",
  initialState: {
    publicTracksPool: [] as ITrackModel[],
    customTracksPool: [] as ITrackModel[],
  },
  reducers: {
    addPublicTracksPool: (state, action: PayloadAction<ITrackModel[]>) => {
      state.publicTracksPool = action.payload;
    },
    addCustomTracksPool: (state, action: PayloadAction<ITrackModel[]>) => {
      state.customTracksPool = action.payload;
    },
  },
});

export const { addPublicTracksPool } = hubSlice.actions;
export const selectPublicTracksPool = (state: RootState) =>
  state.hub.publicTracksPool;

export const { addCustomTracksPool } = hubSlice.actions;
export const selectCustomTracksPool = (state: RootState) =>
  state.hub.customTracksPool;

export default hubSlice.reducer;
