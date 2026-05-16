import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../createStore";

export type NavigationRoute =
  | "tracks"
  | "apps"
  | "help"
  | "share"
  | "settings"
  | "regions"
  | "tab-genome-picker";

export interface NavigationPathElement {
  path: NavigationRoute;
  params: Record<string, string>;
}

export type NavigationPath = NavigationPathElement[];

export const navigationSlice = createSlice({
  name: "navigation",
  initialState: {
    path: [] as NavigationPath,
    tab: null as NavigationRoute | null,
    sessionPanelOpen: false,
    expandNavigationTab: false,
    useMidSizeNavigationTab: false,
    navSearchOpen: false,
    genomePickerTab: "picker" as "picker" | "add" | "import",
    openNewCollectionForm: false,
    focusCollection: null as string | null,
  },
  reducers: {
    setNavigationPath: (state, action: PayloadAction<NavigationPath>) => {
      state.path = action.payload;
    },
    pushNavigationPath: (
      state,
      action: PayloadAction<NavigationPathElement>,
    ) => {
      state.path.push(action.payload);
    },
    setNavigationTab: (
      state,
      action: PayloadAction<NavigationRoute | null>,
    ) => {
      state.tab = action.payload;
    },
    setSessionPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.sessionPanelOpen = action.payload;
    },
    setExpandNavigationTab: (state, action: PayloadAction<boolean>) => {
      state.expandNavigationTab = action.payload;
    },
    setMidSizeNavigationTab: (state, action: PayloadAction<boolean>) => {
      state.useMidSizeNavigationTab = action.payload;
    },
    setNavSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.navSearchOpen = action.payload;
    },
    setGenomePickerTab: (
      state,
      action: PayloadAction<"picker" | "add" | "import">,
    ) => {
      state.genomePickerTab = action.payload;
    },
    setOpenNewCollectionForm: (state, action: PayloadAction<boolean>) => {
      state.openNewCollectionForm = action.payload;
    },
    setFocusCollection: (state, action: PayloadAction<string | null>) => {
      state.focusCollection = action.payload;
    },
  },
});

export const {
  setNavigationPath,
  pushNavigationPath,
  setNavigationTab,
  setSessionPanelOpen,
  setExpandNavigationTab,
  setMidSizeNavigationTab,
  setNavSearchOpen,
  setGenomePickerTab,
  setOpenNewCollectionForm,
  setFocusCollection,
} = navigationSlice.actions;

export const selectNavigationPath = (state: RootState) => state.navigation.path;
export const selectNavigationTab = (state: RootState) => state.navigation.tab;
export const selectSessionPanelOpen = (state: RootState) =>
  state.navigation.sessionPanelOpen;
export const selectExpandNavigationTab = (state: RootState) =>
  state.navigation.expandNavigationTab;
export const selectMidSizeNavigationTab = (state: RootState) =>
  state.navigation.useMidSizeNavigationTab;
export const selectNavSearchOpen = (state: RootState) =>
  state.navigation.navSearchOpen;
export const selectGenomePickerTab = (state: RootState) =>
  state.navigation.genomePickerTab;
export const selectOpenNewCollectionForm = (state: RootState) =>
  state.navigation.openNewCollectionForm;
export const selectFocusCollection = (state: RootState) =>
  state.navigation.focusCollection;

export default navigationSlice.reducer;
