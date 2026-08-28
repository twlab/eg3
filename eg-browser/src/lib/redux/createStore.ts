import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  createMigrate,
  createTransform,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import undoable from "redux-undo";
import { isEqual, omit } from "lodash";

import browserReducer from "./slices/browserSlice";
import genomeHubReducer from "./slices/genomeHubSlice";
import navigationReducer from "./slices/navigationSlice";
import utilityReducer from "./slices/utilitySlice";
import hubReducer from "./slices/hubSlice";
import settingsReducer from "./slices/settingsSlice";
import searchReducer from "./slices/searchSlice";
import undoRedoReducer from "./slices/undoRedoSlice";
import {
  BrowserSession,
  setCurrentSession,
  updateCurrentSession,
} from "./slices/browserSlice";
import {
  clearStorageFull,
  reportStorageFull,
  storageRecheckFailed,
} from "./slices/utilitySlice";
import { getSerializedSize } from "@/lib/utils/storageManager";
import tabPanelReducer from "./slices/tabPanelSlice";

// Detect whether this is a fresh browser start (as opposed to a page refresh).
// sessionStorage survives page refreshes within the same tab but is cleared
// when the browser (or the tab) is closed, so the absence of this flag means
// the user opened a brand-new window/tab.
const SESSION_ACTIVE_FLAG = "eg-browser-tab-active";
const isFreshBrowserStart =
  typeof window !== "undefined" && !sessionStorage.getItem(SESSION_ACTIVE_FLAG);
if (typeof window !== "undefined") {
  sessionStorage.setItem(SESSION_ACTIVE_FLAG, "true");
}

// Transform to reduce the size of persisted browser state
const browserTransform = createTransform(
  // transform state on its way to being serialized and persisted
  (inboundState: any) => {
    // Limit the history depth further when persisting
    const { past, present, future } = inboundState;

    return {
      past: past.slice(-5), // Keep only last 5 past states when persisting
      present,
      future: future.slice(0, 5), // Keep only first 5 future states when persisting
    };
  },
  // transform state being rehydrated — clear the active session on a fresh
  // browser start so the user always lands on the genome picker instead of
  // resuming a stale session from a previous browser window.
  (outboundState: any) => {
    if (isFreshBrowserStart && outboundState?.present) {
      return {
        ...outboundState,
        present: {
          ...outboundState.present,
          currentSession: null,
        },
      };
    }
    return outboundState;
  },
  { whitelist: ["browser"] },
);

const migrations = {
  1: (state: any) => {
    if (!state || !state.browser || state.browser?.present) {
      return state;
    }

    return {
      ...state,
      browser: {
        past: [],
        present: state.browser,
        future: [],
      },
    };
  },
};

// Browsers disagree on how they report a full localStorage: Chrome throws a
// `QuotaExceededError`, Firefox `NS_ERROR_DOM_QUOTA_REACHED`, older WebKit
// `QUOTA_EXCEEDED_ERR`, and the legacy numeric codes still show up. Matching
// only on Chrome's name meant every other browser rethrew and the recovery
// below never ran at all.
const isQuotaExceededError = (error: any): boolean => {
  if (!error) return false;
  return (
    error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error.name === "QUOTA_EXCEEDED_ERR" ||
    error.code === 22 ||
    error.code === 1014
  );
};

// The storage engine is built before the store exists (it's part of the persist
// config), so the store is handed back through this ref afterwards. Recovery
// needs it to count sessions and to actually delete them from Redux — deleting
// them only from the serialized blob would leave them in memory and the very
// next write would put them straight back.
type StoreRef = {
  current: { getState: () => any; dispatch: (action: any) => any } | null;
};

// Total serialized size of every saved session. Recorded when a write fails so
// the pruner has a fixed "this is what full looks like" baseline to trim back
// to — see `pruneSessionsToTarget`.
const getSessionBytes = (storeRef: StoreRef): number => {
  const sessions = storeRef.current?.getState()?.browser?.present?.sessions;
  const ids: string[] = sessions?.ids ?? [];
  return ids.reduce(
    (total, id) =>
      total + getSerializedSize(sessions.entities?.[id] as BrowserSession),
    0,
  );
};

// A write went through, so localStorage has room. That only matters when the
// user has just deleted sessions and asked the banner to re-test itself — the
// write that used to fail now succeeding is the real answer to "is it still
// full?", far better than guessing from estimated sizes.
const noteStorageWritable = (storeRef: StoreRef) => {
  const utility = storeRef.current?.getState()?.utility;
  if (utility?.storageFull && utility.awaitingStorageRecheck) {
    storeRef.current!.dispatch(clearStorageFull());
  }
};

// Custom storage wrapper with error handling for quota exceeded
const createStorageWithErrorHandling = (storage: any, storeRef: StoreRef) => {
  return {
    ...storage,
    setItem: async (key: string, value: string) => {
      try {
        await storage.setItem(key, value);
        noteStorageWritable(storeRef);
        return;
      } catch (error: any) {
        if (!isQuotaExceededError(error)) throw error;

        console.error("Storage quota exceeded. Attempting to free space...");

        // Snapshot the last good blob first. The retry below removes the key,
        // and if everything after that fails we'd otherwise have thrown away
        // every persisted session on top of failing to save the new one.
        let previousValue: string | null = null;
        try {
          previousValue = await storage.getItem(key);
        } catch {
          previousValue = null;
        }

        const restorePrevious = async () => {
          if (previousValue === null) return;
          try {
            await storage.setItem(key, previousValue);
          } catch (restoreError) {
            console.error(
              "Failed to restore the previous persisted state:",
              restoreError,
            );
          }
        };

        // Cheapest fix first: some browsers only reclaim the old value once the
        // key is removed, so remove-then-write can succeed on its own.
        try {
          if (typeof storage.removeItem === "function") {
            await storage.removeItem(key);
          }
          await storage.setItem(key, value);
          console.log("Successfully saved after removing the key");
          noteStorageWritable(storeRef);
          return;
        } catch (retryError) {
          console.error("Failed to save after removing key:", retryError);
        }

        // Put the last blob that did fit back, so a full quota costs the user
        // only the newest unsaved change instead of every saved session.
        await restorePrevious();

        // Raise the banner and stop. Nothing is deleted here on purpose:
        // `setItem` runs on every throttled persist tick (about once a second
        // while the user is active), so pruning from here would delete sessions
        // out from under whatever the user is doing, and a dialog would stack a
        // fresh copy of itself every tick. The banner asks instead, and
        // `pruneSessionsToTarget` runs only on the events where making room is
        // safe: a new session, a session switch, or the user dismissing it.
        //
        // Only the first failure of a run is reported. The size recorded here
        // is the baseline the pruner trims back to, and later ticks would keep
        // moving it; it is armed again when the user dismisses the banner.
        // Measuring is not cheap either, which is another reason not to redo it
        // on every failing tick.
        const utility = storeRef.current?.getState()?.utility;
        if (storeRef.current) {
          if (!utility?.storageFull) {
            storeRef.current.dispatch(
              reportStorageFull(getSessionBytes(storeRef)),
            );
          } else if (utility.awaitingStorageRecheck) {
            // The user deleted sessions and we re-tested: still full.
            storeRef.current.dispatch(storageRecheckFailed());
          }
        }

        throw error;
      }
    },
  };
};

// `updateCurrentSession` bumps `updatedAt` on every call, so two sessions can
// be identical in content while differing by timestamp. Ignore the timestamps
// when deciding whether an update actually changed anything.
const IGNORED_SESSION_FIELDS = ["updatedAt", "createdAt"];

// Transient, per-track UI flags that should not count as an undoable change.
// Selecting a track (e.g. right-clicking to open its menu before deleting) and
// the internal `changeConfigInitial` marker both flip these, and recording them
// creates history entries that look identical to the user — which is why a
// delete used to need two undos.
const VOLATILE_TRACK_FIELDS = ["isSelected", "changeConfigInitial"];

const getActiveSession = (browserPresent: any) => {
  const id = browserPresent?.currentSession;
  if (!id) return null;
  return browserPresent?.sessions?.entities?.[id] ?? null;
};

// Strip fields that shouldn't drive history so two "content-equal" sessions
// compare equal regardless of timestamps or transient track selection state.
const normalizeSession = (session: any) => {
  if (!session) return session;
  const normalized: any = omit(session, IGNORED_SESSION_FIELDS);
  if (Array.isArray(normalized.tracks)) {
    normalized.tracks = normalized.tracks.map((track: any) =>
      omit(track, VOLATILE_TRACK_FIELDS),
    );
  }
  return normalized;
};

// True when an `updateCurrentSession` left the active session's meaningful
// content unchanged (aside from timestamps and transient track flags).
const isNoOpSessionUpdate = (currentState: any, previousHistory: any) => {
  const prev = getActiveSession(previousHistory?.present);
  const next = getActiveSession(currentState);
  if (!prev || !next) return false;
  return isEqual(normalizeSession(prev), normalizeSession(next));
};

const undoableConfig = {
  limit: 20,
  // Keep the "last recorded" state in sync with `present` when an action is
  // filtered out. Without this, a filtered no-op update leaves the recorded
  // baseline stale, so the next real edit pushes the wrong previous state into
  // the past (an off-by-one that shows up as a duplicate history entry).
  syncFilter: true,
  // Decide which actions create a new history entry.
  //
  // Returning `false` updates `present` but leaves `past`/`future` untouched,
  // so it does NOT clear the redo stack.
  //
  // - `setCurrentSession`: never part of history (as before).
  // - `updateCurrentSession` that changes nothing: skip it. Right after an
  //   undo/redo/jump the track container echoes the just-restored tracks and
  //   view region back through `updateCurrentSession`. Recording those echoes
  //   would clear the future and delete every state after the restored one.
  //   A genuine edit (move, add/remove track, …) changes the content, so it
  //   still records normally and truncates the future — the desired behavior.
  filter: (action: any, currentState: any, previousHistory: any) => {
    if (action.type === setCurrentSession.type) return false;
    if (
      action.type === updateCurrentSession.type &&
      isNoOpSessionUpdate(currentState, previousHistory)
    ) {
      return false;
    }
    return true;
  },

  // debug: true, // Set to true to enable detailed logging of undoable actions and state changes
};

export interface StoreConfig {
  /**
   * Unique identifier for this store instance.
   * Used to namespace the persisted state in localStorage.
   * If not provided, a default key will be used.
   */
  storeId?: string;

  /**
   * Whether to enable persistence for this store.
   * Default: true
   */
  enablePersistence?: boolean;
}

/**
 * Creates a new Redux store instance with optional persistence.
 * This allows multiple independent App instances to have their own isolated state.
 *
 * @param config Configuration options for the store
 * @returns An object containing the store and persistor (if persistence is enabled)
 */
export function createAppStore(config: StoreConfig = {}) {
  const { storeId = "root", enablePersistence = true } = config;

  const rootReducer = combineReducers({
    navigation: navigationReducer,
    browser: undoable(browserReducer, undoableConfig),
    utility: utilityReducer,
    tabPanel: tabPanelReducer,
    hub: hubReducer,
    genomeHub: genomeHubReducer,
    settings: settingsReducer,
    search: searchReducer,
    undoRedo: undoRedoReducer,
  });

  type RootReducerType = ReturnType<typeof rootReducer>;

  if (!enablePersistence) {
    // Return a store without persistence
    const store = configureStore({
      reducer: rootReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }).concat((store) => (next) => (action) => {
          // console.log("Dispatching action:", action.type, action);
          // if (action.type === "browser/updateCurrentSession") {
          //   console.trace("Call stack for updateCurrentSession:");
          // }
          const result = next(action);
          // console.log('Next state:', store.getState());
          return result;
        }),
    });

    return { store, persistor: null };
  }

  // Filled in right after the store is created — the storage engine needs the
  // store to recover from a full quota, but is built before it exists.
  const storeRef: StoreRef = { current: null };

  // Create a store with persistence
  const persistConfig = {
    key: storeId,
    storage: createStorageWithErrorHandling(storage, storeRef),
    blacklist: ["navigation", "hub", "genomeHub", "utility", "undoRedo"],
    version: 1,
    migrate: createMigrate(migrations, {
      debug: process.env.NODE_ENV === "development",
    }),
    throttle: 1000,
    transforms: [browserTransform],
  };

  const persistedReducer = persistReducer<RootReducerType>(
    persistConfig,
    rootReducer,
  );

  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat((store) => (next) => (action) => {
        // console.log('Dispatching action:', action.type, action);
        // if (action.type === 'browser/updateCurrentSession' || action.type === 'navigation/setNavigationTab') {
        //   console.trace('Call stack for updateCurrentSession:');
        // }
        const result = next(action);
        // console.log('Next state:', store.getState());
        return result;
      }),
  });

  storeRef.current = store;

  const persistor = persistStore(store);

  return { store, persistor };
}

export type AppStore = ReturnType<typeof createAppStore>["store"];
export type AppPersistor = ReturnType<typeof createAppStore>["persistor"];
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

/**
 * Global cache to reuse store instances across component remounts.
 * This ensures that when a component remounts (e.g., after refresh),
 * it reuses the same store instance which will rehydrate from localStorage.
 */
const storeCache = new Map<string, ReturnType<typeof createAppStore>>();

/**
 * Gets or creates a store instance with caching.
 * This ensures stores are reused across component remounts, allowing
 * proper persistence and rehydration.
 *
 * @param config Configuration options for the store
 * @returns An object containing the store and persistor
 */
export function getOrCreateStore(config: StoreConfig = {}) {
  const { storeId = "root", enablePersistence = true } = config;

  // Create a cache key that includes both storeId and persistence setting
  const cacheKey = `${storeId}-${enablePersistence}`;

  if (!storeCache.has(cacheKey)) {
    const storeInstance = createAppStore(config);
    storeCache.set(cacheKey, storeInstance);
  }

  return storeCache.get(cacheKey)!;
}

/**
 * Clears a store from the cache. Use this when you want to completely
 * reset a store instance (e.g., when removing a dynamic instance).
 *
 * @param config The store configuration to clear
 */
export function clearStoreCacheEntry(config: StoreConfig = {}) {
  const { storeId = "root", enablePersistence = true } = config;
  const cacheKey = `${storeId}-${enablePersistence}`;
  storeCache.delete(cacheKey);
}

/**
 * Clears all stores from the cache.
 */
export function clearAllStoreCaches() {
  storeCache.clear();
}
