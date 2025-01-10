import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export enum Tool {
    Pan,
    Reorder,
    Zoom,
    Highlight
}

export const utilitySlice = createSlice({
    name: "utility",
    initialState: {
        tool: Tool.Pan
    },
    reducers: {
        setTool: (state, action: PayloadAction<Tool>) => {
            state.tool = action.payload;
        }
    }
});
export const { setTool } = utilitySlice.actions;

export const selectTool = (state: RootState) => state.utility.tool;

export default utilitySlice.reducer;
