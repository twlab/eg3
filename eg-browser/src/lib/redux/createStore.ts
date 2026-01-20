import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  createMigrate,
  createTransform,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import undoable, { excludeAction } from "redux-undo";

import browserReducer from "./slices/browserSlice";
import genomeHubReducer from "./slices/genomeHubSlice";
import navigationReducer from "./slices/navigationSlice";
import utilityReducer from "./slices/utilitySlice";
import hubReducer from "./slices/hubSlice";
import settingsReducer from "./slices/settingsSlice";
import searchReducer from "./slices/searchSlice";
import undoRedoReducer from "./slices/undoRedoSlice";
import { setCurrentSession } from "./slices/browserSlice";

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
  // transform state being rehydrated
  (outboundState) => outboundState,
  { whitelist: ["browser"] }
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
          console.error("Storage quota exceeded. Clearing old data...");

          // Try to clear old sessions or reduce data
          try {
            // Clear the specific key that's causing issues
            await storage.removeItem(key);

            // Try again with the new value
            await storage.setItem(key, value);
            console.log("Successfully saved after clearing old data");
          } catch (retryError) {
            console.error("Failed to save even after clearing:", retryError);
            // Optionally notify user
            alert(
              "Storage is full. Please delete some old sessions to continue."
            );
            throw retryError;
          }
        } else {
          throw error;
        }
      }
    },
  };
};

const undoableConfig = {
  limit: 10, // Reduced from 20 to save storage space
  filter: excludeAction([setCurrentSession.type]),
  // debug: process.env.NODE_ENV === "development",
  debug: false,
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
    rootReducer
  );

  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
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
