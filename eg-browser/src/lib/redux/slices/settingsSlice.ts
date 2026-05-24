import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../createStore";

export type SessionSortPreference = "createdAt" | "updatedAt";

export type CookieConsentStatus = "pending" | "granted" | "denied";

export type CustomGenomeEntry = {
  name: string;
  logoUrl: string;
  assemblies: string[];
  color: string;
};

export type CustomCollections = Record<string, CustomGenomeEntry[]>;

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
    customCollections: {} as CustomCollections,
    selectedCollections: ["Tree_of_Life"] as string[],
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
      action: PayloadAction<SessionSortPreference>,
    ) => {
      state.sessionSortPreference = action.payload;
    },
    setCookieConsentStatus: (
      state,
      action: PayloadAction<CookieConsentStatus>,
    ) => {
      state.cookieConsentStatus = action.payload;
    },
    setDarkTheme: (state, action: PayloadAction<boolean>) => {
      state.darkTheme = action.payload;
    },
    addCustomCollection: (state, action: PayloadAction<string>) => {
      if (!state.customCollections) state.customCollections = {};
      if (!state.customCollections[action.payload]) {
        state.customCollections[action.payload] = [];
      }
    },
    removeCustomCollection: (state, action: PayloadAction<string>) => {
      if (!state.customCollections) return;
      delete state.customCollections[action.payload];
      state.selectedCollections = state.selectedCollections.filter(
        (k) => k !== action.payload,
      );
      if (state.selectedCollections.length === 0) {
        state.selectedCollections = ["Tree_of_Life"];
      }
    },
    addGenomeToCollection: (
      state,
      action: PayloadAction<{
        collectionName: string;
        genome: CustomGenomeEntry;
        assemblyName: string;
      }>,
    ) => {
      const { collectionName, genome, assemblyName } = action.payload;
      if (!state.customCollections) return;
      const collection = state.customCollections[collectionName];
      if (!collection) return;
      const existing = collection.find((g) => g.name === genome.name);
      if (existing) {
        if (!existing.assemblies.includes(assemblyName)) {
          existing.assemblies.push(assemblyName);
        }
      } else {
        collection.push({ ...genome, assemblies: [assemblyName] });
      }
    },
    removeGenomeFromCollection: (
      state,
      action: PayloadAction<{ collectionName: string; genomeName: string }>,
    ) => {
      const { collectionName, genomeName } = action.payload;
      if (!state.customCollections) return;
      if (state.customCollections[collectionName]) {
        state.customCollections[collectionName] = state.customCollections[
          collectionName
        ].filter((g) => g.name !== genomeName);
      }
    },
    removeAssemblyFromCollection: (
      state,
      action: PayloadAction<{
        collectionName: string;
        genomeName: string;
        assemblyName: string;
      }>,
    ) => {
      const { collectionName, genomeName, assemblyName } = action.payload;
      if (!state.customCollections) return;
      const collection = state.customCollections[collectionName];
      if (!collection) return;
      const genome = collection.find((g) => g.name === genomeName);
      if (!genome) return;
      genome.assemblies = genome.assemblies.filter((a) => a !== assemblyName);
      if (genome.assemblies.length === 0) {
        state.customCollections[collectionName] = collection.filter(
          (g) => g.name !== genomeName,
        );
      }
    },
    removeAssembliesFromAllCollections: (
      state,
      action: PayloadAction<string[]>,
    ) => {
      if (!state.customCollections) return;
      const ids = new Set(action.payload);
      for (const collectionName of Object.keys(state.customCollections)) {
        state.customCollections[collectionName] = state.customCollections[
          collectionName
        ]
          .map((genome) => ({
            ...genome,
            assemblies: genome.assemblies.filter((a) => !ids.has(a)),
          }))
          .filter((genome) => genome.assemblies.length > 0);
      }
    },
    setSelectedCollections: (state, action: PayloadAction<string[]>) => {
      state.selectedCollections =
        action.payload.length > 0 ? action.payload : ["Tree_of_Life"];
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
  addCustomCollection,
  removeCustomCollection,
  addGenomeToCollection,
  removeGenomeFromCollection,
  removeAssemblyFromCollection,
  removeAssembliesFromAllCollections,
  setSelectedCollections,
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
export const selectCustomCollections = (state: RootState) =>
  state.settings.customCollections;
export const selectSelectedCollections = (state: RootState) =>
  state.settings.selectedCollections;
export default settingsSlice.reducer;
