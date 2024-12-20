import { combineReducers, configureStore } from "@reduxjs/toolkit";

import navigationReducer from "./slices/navigationSlice";
import genomeReducer from "./slices/genomeSlice";

const rootReducer = combineReducers({
    navigation: navigationReducer,
    genome: genomeReducer
});

export const store = configureStore({
    reducer: rootReducer
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
