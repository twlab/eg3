import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { ITrackModel } from "@eg/tracks";

export const hubSlice = createSlice({
    name: "hub",
    initialState: {
        publicTracksPool: [] as ITrackModel[]
    },
    reducers: {
        addPublicTracksPool: (state, action: PayloadAction<ITrackModel[]>) => {
            state.publicTracksPool = action.payload;
        }
    }
});

export const { addPublicTracksPool } = hubSlice.actions;

export const selectPublicTracksPool = (state: RootState) => state.hub.publicTracksPool;

export default hubSlice.reducer;
