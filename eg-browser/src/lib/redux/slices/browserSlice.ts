import {
  GenomeCoordinate,
  IGenome,
  IHighlightInterval,
  ITrackModel,
  RegionSet,
} from "wuepgg3-track";
import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";

import { RootState } from "../store";
import { generateUUID } from "wuepgg3-track";
export type uuid = string;

export interface BrowserSession {
  id: uuid;
  createdAt: number;
  updatedAt: number;
  bundleId: string | null; // stays null until the user save their current session, load session, or get sessions from Url param
  title: string;
  genomeId: uuid;
  viewRegion: GenomeCoordinate | null;
  userViewRegion: GenomeCoordinate | null;
  tracks: ITrackModel[];
  customTracksPool?: ITrackModel[];
  highlights: IHighlightInterval[];
  metadataTerms: string[];
  regionSets: Array<any>;
  selectedRegionSet: RegionSet | null;
  overrideViewRegion: GenomeCoordinate | null;
  customGenome?: boolean | null;
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
    createSession: (
      state,
      action: PayloadAction<{
        genome: IGenome;
        viewRegion?: GenomeCoordinate;
        additionalTracks?: ITrackModel[];
      }>
    ) => {
      //TO DO url param to also get bundleId and get it here as a property for initial startup
      const {
        genome,
        viewRegion: overrideViewRegion,
        additionalTracks = [],
      } = action.payload;

      const { defaultRegion, defaultTracks: tracks = [] } = genome;

      let allTracks = [...tracks, ...additionalTracks];

      const initializedTracks =
        allTracks?.map((track) => ({
          ...track,
          id: generateUUID(),
          isSelected: false,
        })) || [];

      const nextSession: BrowserSession = {
        id: generateUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        title: "Untitled Session",
        bundleId: null,
        customGenome: genome.customGenome ? genome.customGenome : null,
        viewRegion: overrideViewRegion ?? defaultRegion,
        overrideViewRegion: overrideViewRegion ? overrideViewRegion : null,
        userViewRegion: null,
        tracks: initializedTracks,
        genomeId: genome.id,
        highlights: [],
        metadataTerms: [],
        regionSets: [],
        selectedRegionSet: null,
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
        const changes = { ...action.payload };
        if ("tracks" in changes) {
          changes.tracks = changes.tracks!.map((track) => {
            if (!("id" in track) || !track["id"]) {
              (track as ITrackModel).id = generateUUID();
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
            if (!("id" in track) || !track["id"]) {
              return {
                ...(track as object),
                id: generateUUID(),
              } as ITrackModel;
            }
            return track;
          });

          browserSessionAdapter.updateOne(state.sessions, {
            id: state.currentSession,
            changes: {
              tracks: [...session.tracks, ...tracksWithIds],

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
    clearAllSessions: (state) => {
      browserSessionAdapter.removeAll(state.sessions);
      state.currentSession = null;
    },
  },
});

export const {
  createSession,
  upsertSession,
  deleteSession,
  setCurrentSession,
  updateCurrentSession,
  updateSession,
  addTracks,
  clearAllSessions,
} = browserSlice.actions;

export const selectCurrentSessionId = (state: RootState) =>
  state.browser.present.currentSession;

const browserSessionSelectors = browserSessionAdapter.getSelectors(
  (state: RootState) => state.browser.present.sessions
);

export const selectCurrentSession = (state: RootState) =>
  state.browser.present.currentSession
    ? browserSessionSelectors.selectById(
        state,
        state.browser.present.currentSession
      )
    : null;
export const selectSessions = browserSessionSelectors.selectAll;
export const selectSessionById = browserSessionSelectors.selectById;

export const selectCanUndo = (state: RootState) =>
  state.browser.past.length > 0;
export const selectCanRedo = (state: RootState) =>
  state.browser.future.length > 0;

export default browserSlice.reducer;
