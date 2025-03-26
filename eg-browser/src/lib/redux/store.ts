import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, createMigrate } from "redux-persist";
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
                future: []
            }
        };
    }
};

const persistConfig = {
    key: "root",
    storage,
    blacklist: ["navigation", "hub", "genomeHub", "utility", "undoRedo"],
    version: 1,
    migrate: createMigrate(migrations, { debug: process.env.NODE_ENV === 'development' })
};

const undoableConfig = {
    limit: 20,
    filter: excludeAction([setCurrentSession.type]),
    debug: process.env.NODE_ENV === 'development'
};

const rootReducer = combineReducers({
    navigation: navigationReducer,
    browser: undoable(browserReducer, undoableConfig),
    utility: utilityReducer,
    hub: hubReducer,
    genomeHub: genomeHubReducer,
    settings: settingsReducer,
    search: searchReducer,
    undoRedo: undoRedoReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
            }
        })
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
