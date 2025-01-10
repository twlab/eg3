import { createEntityAdapter, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getGenomeDefaultState } from "@eg/core";
import { ITrackModel, IHighlightInterval, GenomeCoordinate } from "@eg/tracks";

import { RootState } from "../store";

export type uuid = string;

export interface BrowserSession {
    id: uuid;
    createdAt: number;
    updatedAt: number;
    
    genome: string;
    viewRegion: GenomeCoordinate;
    tracks: ITrackModel[];
    customTracksPool?: ITrackModel[];
    highlights: IHighlightInterval[];
    metadataTerms: string[];
}

// MARK: - State

const browserSessionAdapter = createEntityAdapter<BrowserSession>({
    sortComparer: (a, b) => a.createdAt - b.createdAt,
});

export const browserSlice = createSlice({
    name: "browser",
    initialState: {
        currentSession: null as uuid | null,
        sessions: browserSessionAdapter.getInitialState(),
    },
    reducers: {
        createSessionWithGenomeId: (state, action: PayloadAction<string>) => {
            const defaultState = getGenomeDefaultState(action.payload);

            if (defaultState) {
                const { viewRegion, tracks } = defaultState;

                const nextSession: BrowserSession = {
                    id: crypto.randomUUID(),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    viewRegion: viewRegion as GenomeCoordinate,
                    tracks: tracks,
                    genome: action.payload,
                    highlights: [],
                    metadataTerms: [],
                }

                browserSessionAdapter.addOne(state.sessions, nextSession);
                state.currentSession = nextSession.id;
            }
        },
        updateSession: (state, action: PayloadAction<{ id: uuid, changes: Partial<BrowserSession> }>) => {
            browserSessionAdapter.updateOne(state.sessions, action.payload);
        },
        updateCurrentSession: (state, action: PayloadAction<Partial<BrowserSession>>) => {
            if (state.currentSession) {
                browserSessionAdapter.updateOne(state.sessions, { id: state.currentSession, changes: action.payload });
            }
        },
        upsertSession: (state, action: PayloadAction<BrowserSession>) => {
            browserSessionAdapter.upsertOne(state.sessions, action.payload);
        },
        deleteSession: (state, action: PayloadAction<uuid>) => {
            browserSessionAdapter.removeOne(state.sessions, action.payload);
        },
        setCurrentSession: (state, action: PayloadAction<uuid>) => {
            state.currentSession = action.payload;
        },
    }
});

export const { 
    createSessionWithGenomeId, 
    upsertSession, 
    deleteSession, 
    setCurrentSession,
    updateCurrentSession,
} = browserSlice.actions;

export const selectCurrentSessionId = (state: RootState) => state.browser.currentSession;

const browserSessionSelectors = browserSessionAdapter.getSelectors((state: RootState) => state.browser.sessions);

export const selectCurrentSession = (state: RootState) => state.browser.currentSession ? browserSessionSelectors.selectById(state, state.browser.currentSession) : null;
export const selectSessions = browserSessionSelectors.selectAll;
export const selectSessionById = browserSessionSelectors.selectById;

export default browserSlice.reducer;
