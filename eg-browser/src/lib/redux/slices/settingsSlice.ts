import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export type SessionSortPreference = 'createdAt' | 'updatedAt';

export type CookieConsentStatus = 'pending' | 'granted' | 'denied';

export const settingsSlice = createSlice({
    name: "settings",
    initialState: {
        isNavigatorVisible: true,
        trackLegendWidth: 200,
        sessionSortPreference: 'createdAt' as SessionSortPreference,
        cookieConsentStatus: 'pending' as CookieConsentStatus,
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
        setCookieConsentStatus: (state, action: PayloadAction<CookieConsentStatus>) => {
            state.cookieConsentStatus = action.payload;
        }
    }
});

export const {
    setNavigatorVisibility,
    setTrackLegendWidth,
    setSessionSortPreference,
    setCookieConsentStatus
} = settingsSlice.actions;

export const selectIsNavigatorVisible = (state: RootState) => state.settings.isNavigatorVisible;
export const selectTrackLegendWidth = (state: RootState) => state.settings.trackLegendWidth;
export const selectSessionSortPreference = (state: RootState) => state.settings.sessionSortPreference;
export const selectCookieConsentStatus = (state: RootState) => state.settings.cookieConsentStatus;

export default settingsSlice.reducer;
