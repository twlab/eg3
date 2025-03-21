import { createSlice } from "@reduxjs/toolkit";
import { ActionCreators } from "redux-undo";
import { AppDispatch } from "../store";

export const undoRedoSlice = createSlice({
    name: "undoRedo",
    initialState: {},
    reducers: {}
});

export const undo = () => (dispatch: AppDispatch) => {
    dispatch(ActionCreators.undo());
};

export const redo = () => (dispatch: AppDispatch) => {
    dispatch(ActionCreators.redo());
};

export const clearHistory = () => (dispatch: AppDispatch) => {
    dispatch(ActionCreators.clearHistory());
};

export default undoRedoSlice.reducer;