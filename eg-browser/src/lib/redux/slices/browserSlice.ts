import DisplayedRegionModel from "@/lib/eg-lib/model/DisplayedRegionModel";
import { getGenomeConfig } from "@/lib/eg-lib/model/genomes/allGenomes";
import { GenomeConfig } from "@/lib/eg-lib/model/genomes/GenomeConfig";
import RegionSet from "@/lib/eg-lib/model/RegionSet";
import TrackModel from "@/lib/eg-lib/model/TrackModel";
import { createEntityAdapter, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "../store";

// MARK: - Types

type uuid = string;

export interface HighlightInterval {
    start: number;
    end: number;
    display: boolean;
    color: string;
    tag: string;
}

export interface BrowserSession {
    id: uuid;
    createdAt: number;
    updatedAt: number;

    viewRegion: DisplayedRegionModel;
    tracks: TrackModel[];
    customTracksPool?: TrackModel[];
    genomeConfig: GenomeConfig;
    regionSets: RegionSet[];
    regionSetView: RegionSet | null;
    highlights: HighlightInterval[];
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
            const genomeConfig = getGenomeConfig(action.payload);

            if (genomeConfig) {
                const nextViewRegion = new DisplayedRegionModel(genomeConfig.navContext, ...genomeConfig.defaultRegion);
                const nextTracks = genomeConfig.defaultTracks;

                const nextSession = {
                    id: crypto.randomUUID(),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    viewRegion: nextViewRegion,
                    tracks: nextTracks,
                    genomeConfig: genomeConfig,
                    regionSets: [],
                    regionSetView: null,
                    highlights: [],
                    metadataTerms: [],
                }

                browserSessionAdapter.addOne(state.sessions, nextSession);
                state.currentSession = nextSession.id;
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

export const { createSessionWithGenomeId, upsertSession, deleteSession, setCurrentSession } = browserSlice.actions;

export const selectCurrentSessionId = (state: RootState) => state.browser.currentSession;

const browserSessionSelectors = browserSessionAdapter.getSelectors((state: RootState) => state.browser.sessions);

export const selectCurrentSession = (state: RootState) => state.browser.currentSession ? browserSessionSelectors.selectById(state, state.browser.currentSession) : null;
export const selectSessions = browserSessionSelectors.selectAll;
export const selectSessionById = browserSessionSelectors.selectById;

export default browserSlice.reducer;
