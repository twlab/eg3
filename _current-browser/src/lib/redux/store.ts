import { combineReducers, configureStore } from "@reduxjs/toolkit";

import navigationReducer from "./slices/navigationSlice";

const rootReducer = combineReducers({
    navigation: navigationReducer,
});

export const store = configureStore({
    reducer: rootReducer
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
