import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";

import browserReducer from "./slices/browserSlice";
import genomeHubReducer from "./slices/genomeHubSlice";
import navigationReducer from "./slices/navigationSlice";
import utilityReducer from "./slices/utilitySlice";
import hubReducer from "./slices/hubSlice";
import settingsReducer from "./slices/settingsSlice";
import searchReducer from "./slices/searchSlice";

const persistConfig = {
    key: "root",
    storage,
    blacklist: ["navigation", "hub", "genomeHub", "utility"]
};

const rootReducer = combineReducers({
    navigation: navigationReducer,
    browser: browserReducer,
    utility: utilityReducer,
    hub: hubReducer,
    genomeHub: genomeHubReducer,
    settings: settingsReducer,
    search: searchReducer
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
