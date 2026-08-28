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

import { RootState } from "../createStore";
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
  chromosomes?: Array<{ name: string; length: number }> | null;
  height?: null | number;
  width?: null | number;
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
        id?: string;
        genome: IGenome;
        viewRegion?: GenomeCoordinate;
        additionalTracks?: ITrackModel[];
        width?: null | number;
        height?: null | number;
      }>,
    ) => {
      //TO DO url param to also get bundleId and get it here as a property for initial startup
      const {
        id,
        genome,
        viewRegion: overrideViewRegion,
        additionalTracks = [],
        width = null,
        height = null,
      } = action.payload;

      const { defaultRegion, defaultTracks: tracks = [] } = genome;

      let allTracks = additionalTracks.length > 0 ? additionalTracks : tracks;

      const initializedTracks =
        allTracks?.map((track) => ({
          ...track,
          id: generateUUID(),
          isSelected: false,
        })) || [];

      const nextSession: BrowserSession = {
        id: id ? id : generateUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        title: "",
        bundleId: null,
        customGenome: genome.customGenome ? genome.customGenome : null,
        chromosomes:
          genome.customGenome && genome.chromosomes ? genome.chromosomes : null,
        viewRegion: overrideViewRegion ?? defaultRegion,
        overrideViewRegion: overrideViewRegion ? overrideViewRegion : null,
        userViewRegion: null,
        tracks: initializedTracks,
        genomeId: genome.id,
        highlights: [],
        metadataTerms: [],
        regionSets: [],
        selectedRegionSet: null,
        width: width,
        height: height,
      };

      // Sessions are uncapped. The old fixed limit of 50 evicted the oldest
      // session on every create once you hit it, whether or not storage was
      // anywhere near full; what actually matters is bytes, and that is watched
      // directly — see `checkStorageHeadroom` and `pruneSessionsToTarget`.
      browserSessionAdapter.addOne(state.sessions, nextSession);
      state.currentSession = nextSession.id;
    },
    updateSession: (
      state,
      action: PayloadAction<{ id: uuid; changes: Partial<BrowserSession> }>,
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
      action: PayloadAction<Partial<BrowserSession>>,
    ) => {
      if (state.currentSession) {
        const changes = { ...action.payload };
        if (changes["tracks"]) {
          changes.tracks = changes.tracks!.map((track) => {
            if (!("id" in track) || !track["id"]) {
              (track as ITrackModel).id = generateUUID();
            }
            return track;
          });
        }
        const currentSession = state.sessions.entities[state.currentSession];
        if (
          changes["viewRegion"] &&
          currentSession &&
          changes["viewRegion"] === currentSession.viewRegion
        ) {
          changes["viewRegion"] = null;
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
    // Delete an explicit set of sessions in one go, for the session list's
    // multi-select mode. The active session is skipped: deleting the session
    // being viewed would kick the user back to the genome picker mid-work.
    deleteSessions: (state, action: PayloadAction<uuid[]>) => {
      const ids = action.payload.filter((id) => id !== state.currentSession);
      browserSessionAdapter.removeMany(state.sessions, ids);
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
    // Delete the `count` oldest sessions. `ids` is sorted by `createdAt`
    // ascending, so the oldest are at the front. The active session is never
    // pruned: this is the storage-quota recovery path, and dropping the session
    // the user is currently viewing would kick them back to the genome picker
    // in the middle of their work.
    pruneOldestSessions: (state, action: PayloadAction<number>) => {
      const count = Math.floor(action.payload);
      if (!Number.isFinite(count) || count <= 0) return;

      const prunable = (state.sessions.ids as uuid[]).filter(
        (id) => id !== state.currentSession,
      );
      browserSessionAdapter.removeMany(state.sessions, prunable.slice(0, count));
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
  deleteSessions,
  setCurrentSession,
  updateCurrentSession,
  updateSession,
  addTracks,
  pruneOldestSessions,
  clearAllSessions,
} = browserSlice.actions;

export const selectSessionCount = (state: RootState) =>
  state.browser.present.sessions.ids.length;

export const selectCurrentSessionId = (state: RootState) => {
  return state.browser.present.currentSession;
};

const browserSessionSelectors = browserSessionAdapter.getSelectors(
  (state: RootState) => state.browser.present.sessions,
);

export const selectCurrentSession = (state: RootState) =>
  state.browser.present.currentSession
    ? browserSessionSelectors.selectById(
        state,
        state.browser.present.currentSession,
      )
    : null;
export const selectSessions = browserSessionSelectors.selectAll;
export const selectSessionById = browserSessionSelectors.selectById;

export const selectCanUndo = (state: RootState) =>
  state.browser.past.length > 0;
export const selectCanRedo = (state: RootState) =>
  state.browser.future.length > 0;

export default browserSlice.reducer;
