import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export type NavigationRoute = 'tracks' | 'apps' | 'help' | 'share' | 'settings';

export interface NavigationPathElement {
    path: NavigationRoute,
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
    },
    reducers: {
        setNavigationPath: (state, action: PayloadAction<NavigationPath>) => {
            state.path = action.payload;
        },
        pushNavigationPath: (state, action: PayloadAction<NavigationPathElement>) => {
            state.path.push(action.payload);
        },
        setNavigationTab: (state, action: PayloadAction<NavigationRoute | null>) => {
            state.tab = action.payload;
        },
        setSessionPanelOpen: (state, action: PayloadAction<boolean>) => {
            state.sessionPanelOpen = action.payload;
        },
        setExpandNavigationTab: (state, action: PayloadAction<boolean>) => {
            state.expandNavigationTab = action.payload;
        }
    }
});

export const {
    setNavigationPath,
    pushNavigationPath,
    setNavigationTab,
    setSessionPanelOpen,
    setExpandNavigationTab
} = navigationSlice.actions;

export const selectNavigationPath = (state: RootState) => state.navigation.path;
export const selectNavigationTab = (state: RootState) => state.navigation.tab;
export const selectSessionPanelOpen = (state: RootState) => state.navigation.sessionPanelOpen;
export const selectExpandNavigationTab = (state: RootState) => state.navigation.expandNavigationTab;

export default navigationSlice.reducer;
