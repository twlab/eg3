import { getGenomeDefaultState } from "@eg/core";
import {
  GenomeCoordinate,
  IGenome,
  IHighlightInterval,
  ITrackModel,
} from "@eg/tracks";
import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";

import { RootState } from "../store";

export type uuid = string;

export interface BrowserSession {
  id: uuid;
  createdAt: number;
  updatedAt: number;

  title: string;
  genomeId: uuid;
  viewRegion: GenomeCoordinate;
  userViewRegion: null | GenomeCoordinate;
  tracks: ITrackModel[];
  customTracksPool?: ITrackModel[];
  highlights: IHighlightInterval[];
  metadataTerms: string[];
  trackModelId: number;
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
    createSession: (state, action: PayloadAction<{
      genome: IGenome,
      viewRegion?: GenomeCoordinate,
    }>) => {
      const { genome, viewRegion: overrideViewRegion } = action.payload;

      const { defaultRegion, defaultTracks: tracks } = genome;

      const viewRegion = overrideViewRegion || defaultRegion;

      const userViewRegion = viewRegion;

      let trackModelId = 0;
      const initializedTracks =
        tracks?.map((track) => ({
          ...track,
          id: trackModelId++,
          isSelected: false,
        })) || [];

      const nextSession: BrowserSession = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        title: "",
        viewRegion: viewRegion as GenomeCoordinate,
        userViewRegion: userViewRegion as GenomeCoordinate,
        tracks: initializedTracks,
        genomeId: genome.id,
        highlights: [],
        metadataTerms: [],
        trackModelId,
      };

      browserSessionAdapter.addOne(state.sessions, nextSession);
      state.currentSession = nextSession.id;
    },
    updateSession: (
      state,
      action: PayloadAction<{ id: uuid; changes: Partial<BrowserSession> }>
    ) => {
      browserSessionAdapter.updateOne(state.sessions, {
        id: action.payload.id,
        changes: {
          ...action.payload.changes,
          updatedAt: Date.now(),
        },
      });
    },
    updateCurrentSession: (
      state,
      action: PayloadAction<Partial<BrowserSession>>
    ) => {
      if (state.currentSession) {
        const session = state.sessions.entities[state.currentSession];
        const changes = { ...action.payload };
        if ("tracks" in changes) {
          changes.tracks = changes.tracks!.map((track) => {
            if (!("id" in track)) {
              (track as ITrackModel).id = session.trackModelId++;
            }
            return track;
          });
        }
        browserSessionAdapter.updateOne(state.sessions, {
          id: state.currentSession,
          changes: {
            ...changes,
            updatedAt: Date.now(),
          },
        });
      }
    },
    addTracks: (state, action: PayloadAction<ITrackModel | ITrackModel[]>) => {
      if (state.currentSession) {
        const session = state.sessions.entities[state.currentSession];
        if (session) {
          const newTracks = Array.isArray(action.payload)
            ? action.payload
            : [action.payload];

          const tracksWithIds = newTracks.map((track) => {
            if (!("id" in track)) {
              return {
                ...(track as object),
                id: session.trackModelId++,
              } as ITrackModel;
            }
            return track;
          });

          browserSessionAdapter.updateOne(state.sessions, {
            id: state.currentSession,
            changes: {
              tracks: [...session.tracks, ...tracksWithIds],
              trackModelId: session.trackModelId,
              updatedAt: Date.now(),
            },
          });
        }
      }
    },
    upsertSession: (state, action: PayloadAction<BrowserSession>) => {
      browserSessionAdapter.upsertOne(state.sessions, action.payload);
    },
    deleteSession: (state, action: PayloadAction<uuid>) => {
      browserSessionAdapter.removeOne(state.sessions, action.payload);
    },
    setCurrentSession: (state, action: PayloadAction<uuid | null>) => {
      state.currentSession = action.payload;
      if (action.payload) {
        const session = state.sessions.entities[action.payload];
        if (session) {
          browserSessionAdapter.updateOne(state.sessions, {
            id: action.payload,
            changes: { updatedAt: Date.now() },
          });
        }
      }
    },
  },
});

export const {
  createSession,
  upsertSession,
  deleteSession,
  setCurrentSession,
  updateCurrentSession,
  addTracks,
} = browserSlice.actions;

export const selectCurrentSessionId = (state: RootState) =>
  state.browser.currentSession;

const browserSessionSelectors = browserSessionAdapter.getSelectors(
  (state: RootState) => state.browser.sessions
);

export const selectCurrentSession = (state: RootState) =>
  state.browser.currentSession
    ? browserSessionSelectors.selectById(state, state.browser.currentSession)
    : null;
export const selectSessions = browserSessionSelectors.selectAll;
export const selectSessionById = browserSessionSelectors.selectById;

export default browserSlice.reducer;
