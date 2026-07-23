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
  setCurrentSession,
  updateCurrentSession,
} from "./slices/browserSlice";
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

// Custom storage wrapper with error handling for quota exceeded
const createStorageWithErrorHandling = (storage: any) => {
  return {
    ...storage,
    setItem: async (key: string, value: string) => {
      try {
        await storage.setItem(key, value);
      } catch (error: any) {
        if (error?.name === "QuotaExceededError") {
          console.error("Storage quota exceeded. Attempting to free space...");

          // First try to remove the offending key and retry
          try {
            if (typeof storage.removeItem === "function") {
              await storage.removeItem(key);
            } else if (typeof window !== "undefined" && window.localStorage) {
              window.localStorage.removeItem(key);
            }

            await storage.setItem(key, value);
            console.log("Successfully saved after removing the key");
            return;
          } catch (retryError) {
            console.error("Failed to save after removing key:", retryError);

            // Ask the user whether to clear all stored sessions (confirm shows OK/Cancel)
            const userConfirmed =
              typeof window !== "undefined" &&
              typeof window.confirm === "function"
                ? window.confirm(
                    "Storage is full. Clear all stored sessions to free space? Press OK to clear.",
                  )
                : false;

            if (userConfirmed) {
              try {
                if (typeof storage.clear === "function") {
                  await storage.clear();
                } else if (
                  typeof window !== "undefined" &&
                  window.localStorage
                ) {
                  window.localStorage.clear();
                }

                // Try saving again after clearing
                await storage.setItem(key, value);
                alert("Storage cleared and data saved successfully.");
                console.log("Saved after user-cleared storage");
                return;
              } catch (finalError) {
                console.error(
                  "Failed to save after clearing storage:",
                  finalError,
                );
                alert(
                  "Failed to clear storage and save. Please manually delete some old sessions.",
                );
                throw finalError;
              }
            } else {
              // User declined to clear storage
              alert(
                "Storage is full. Please delete some old sessions to continue.",
              );
              throw retryError;
            }
          }
        } else {
          throw error;
        }
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

  // Create a store with persistence
  const persistConfig = {
    key: storeId,
    storage: createStorageWithErrorHandling(storage),
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
