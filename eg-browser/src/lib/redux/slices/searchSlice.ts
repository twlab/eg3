import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export type SlashCommandType = 'gene' | 'region' | 'track' | 'epigenome';

export interface SearchSuggestion {
    id: string;
    text: string;
    type: SlashCommandType;
}

interface SearchState {
    suggestions: SearchSuggestion[];
    searchQuery: string;
    slashCommand: SlashCommandType | null;
    searchHistory: SearchSuggestion[];
}

const initialState: SearchState = {
    suggestions: [],
    searchQuery: "",
    slashCommand: null,
    searchHistory: []
};

export const searchSlice = createSlice({
    name: "search",
    initialState,
    reducers: {
        setSuggestions: (state, action: PayloadAction<SearchSuggestion[]>) => {
            state.suggestions = action.payload;
        },
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        },
        clearSuggestions: (state) => {
            state.suggestions = [];
        },
        setSlashCommand: (state, action: PayloadAction<SlashCommandType | null>) => {
            state.slashCommand = action.payload;
        },
        addToSearchHistory: (state, action: PayloadAction<SearchSuggestion>) => {
            // Remove duplicates and keep most recent 10 items
            state.searchHistory = [
                action.payload,
                ...state.searchHistory.filter(item => item.id !== action.payload.id)
            ].slice(0, 10);
        },
        clearSearchHistory: (state) => {
            state.searchHistory = [];
        }
    }
});

export const {
    setSuggestions,
    setSearchQuery,
    clearSuggestions,
    setSlashCommand,
    addToSearchHistory,
    clearSearchHistory
} = searchSlice.actions;

export const selectSuggestions = (state: RootState) => state.search.suggestions;
export const selectSearchQuery = (state: RootState) => state.search.searchQuery;
export const selectSlashCommand = (state: RootState) => state.search.slashCommand;
export const selectSearchHistory = (state: RootState) => state.search.searchHistory;

export default searchSlice.reducer;
