import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export const settingsSlice = createSlice({
    name: "settings",
    initialState: {
        isNavigatorVisible: true,
        trackLegendWidth: 200,
    },
    reducers: {
        setNavigatorVisibility: (state, action: PayloadAction<boolean>) => {
            state.isNavigatorVisible = action.payload;
        },
        setTrackLegendWidth: (state, action: PayloadAction<number>) => {
            state.trackLegendWidth = action.payload;
        },
    }
});

export const { setNavigatorVisibility, setTrackLegendWidth } = settingsSlice.actions;

// Selectors
export const selectIsNavigatorVisible = (state: RootState) => state.settings.isNavigatorVisible;
export const selectTrackLegendWidth = (state: RootState) => state.settings.trackLegendWidth;

export default settingsSlice.reducer;
