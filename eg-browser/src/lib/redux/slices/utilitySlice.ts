import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Tool } from "@eg/tracks";
import { RootState } from "../store";

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
