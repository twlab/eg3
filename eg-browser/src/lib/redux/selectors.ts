import { createSelector } from "@reduxjs/toolkit";
import { selectCurrentSession } from "./slices/browserSlice";
import { RootState } from "./store";

export const selectCurrentState = createSelector(
  // an array of functions as input selectors, extract certain info from state
  [(state: RootState) => state.browser, selectCurrentSession],
  // second argument get the results from array of input selectors use them in the function
  (browser, currentSession) => {
    return currentSession ? { ...browser } : null;
  }
);
