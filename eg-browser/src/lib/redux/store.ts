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

const persistConfig = {
  key: "root",
  storage: createStorageWithErrorHandling(storage),
  blacklist: ["navigation", "hub", "genomeHub", "utility", "undoRedo"],
  version: 1,
  migrate: createMigrate(migrations, {
    debug: process.env.NODE_ENV === "development",
  }),
  // Add throttle to reduce the frequency of writes
  throttle: 1000,
  // Add transform to reduce storage size
  transforms: [browserTransform],
};

const undoableConfig = {
  limit: 10, // Reduced from 20 to save storage space
  filter: excludeAction([setCurrentSession.type]),
  debug: process.env.NODE_ENV === "development",
};

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

const persistedReducer = persistReducer<RootReducerType>(
  persistConfig,
  rootReducer
);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
