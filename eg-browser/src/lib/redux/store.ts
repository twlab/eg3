import { combineReducers, configureStore } from "@reduxjs/toolkit";

import browserReducer from "./slices/browserSlice";
import genomeReducer from "./slices/genomeSlice";
import navigationReducer from "./slices/navigationSlice";

const rootReducer = combineReducers({
    navigation: navigationReducer,
    genome: genomeReducer,
    browser: browserReducer
});

export const store = configureStore({
    reducer: rootReducer
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
