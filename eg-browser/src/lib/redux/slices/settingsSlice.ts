import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export type SessionSortPreference = "createdAt" | "updatedAt";

export type CookieConsentStatus = "pending" | "granted" | "denied";

export const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    isNavigatorVisible: true,
    isNavBarVisible: true,
    isToolBarVisible: true,
    trackLegendWidth: 120,
    sessionSortPreference: "createdAt" as SessionSortPreference,
    cookieConsentStatus: "pending" as CookieConsentStatus,
    darkTheme: false,
  },
  reducers: {
    setNavigatorVisibility: (state, action: PayloadAction<boolean>) => {
      state.isNavigatorVisible = action.payload;
    },

    setNavBarVisibility: (state, action: PayloadAction<boolean>) => {
      state.isNavBarVisible = action.payload;
    },
    setToolBarVisibility: (state, action: PayloadAction<boolean>) => {
      state.isToolBarVisible = action.payload;
    },
    setTrackLegendWidth: (state, action: PayloadAction<number>) => {
      state.trackLegendWidth = action.payload;
    },
    setSessionSortPreference: (
      state,
      action: PayloadAction<SessionSortPreference>
    ) => {
      state.sessionSortPreference = action.payload;
    },
    setCookieConsentStatus: (
      state,
      action: PayloadAction<CookieConsentStatus>
    ) => {
      state.cookieConsentStatus = action.payload;
    },
    setDarkTheme: (state, action: PayloadAction<boolean>) => {
      state.darkTheme = action.payload;
    },
    resetSettings: (state) => {
      Object.assign(state, settingsSlice.getInitialState());
    },
  },
});

export const {
  setNavigatorVisibility,
  setNavBarVisibility,
  setToolBarVisibility,
  setTrackLegendWidth,
  setSessionSortPreference,
  setCookieConsentStatus,
  setDarkTheme,
  resetSettings,
} = settingsSlice.actions;

export const selectIsNavigatorVisible = (state: RootState) =>
  state.settings.isNavigatorVisible;
export const selectIsNavBarVisible = (state: RootState) =>
  state.settings.isNavBarVisible;
export const selectIsToolBarVisible = (state: RootState) =>
  state.settings.isToolBarVisible;
export const selectTrackLegendWidth = (state: RootState) =>
  state.settings.trackLegendWidth;
export const selectSessionSortPreference = (state: RootState) =>
  state.settings.sessionSortPreference;
export const selectCookieConsentStatus = (state: RootState) =>
  state.settings.cookieConsentStatus;
export const selectDarkTheme = (state: RootState) => state.settings.darkTheme;
export default settingsSlice.reducer;
