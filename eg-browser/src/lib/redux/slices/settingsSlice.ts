import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export type SessionSortPreference = 'createdAt' | 'updatedAt';

export const settingsSlice = createSlice({
    name: "settings",
    initialState: {
        isNavigatorVisible: true,
        trackLegendWidth: 200,
        sessionSortPreference: 'createdAt' as SessionSortPreference,
    },
    reducers: {
        setNavigatorVisibility: (state, action: PayloadAction<boolean>) => {
            state.isNavigatorVisible = action.payload;
        },
        setTrackLegendWidth: (state, action: PayloadAction<number>) => {
            state.trackLegendWidth = action.payload;
        },
        setSessionSortPreference: (state, action: PayloadAction<SessionSortPreference>) => {
            state.sessionSortPreference = action.payload;
        },
    }
});

export const { setNavigatorVisibility, setTrackLegendWidth, setSessionSortPreference } = settingsSlice.actions;

export const selectIsNavigatorVisible = (state: RootState) => state.settings.isNavigatorVisible;
export const selectTrackLegendWidth = (state: RootState) => state.settings.trackLegendWidth;
export const selectSessionSortPreference = (state: RootState) => state.settings.sessionSortPreference;

export default settingsSlice.reducer;
