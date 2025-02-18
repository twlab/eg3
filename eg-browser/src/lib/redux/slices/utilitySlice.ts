import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Tool } from "@eg/tracks";
import { RootState } from "../store";

export const utilitySlice = createSlice({
    name: "utility",
    initialState: {
        tool: { title: Tool.Drag }
    },
    reducers: {
        setTool: (state, action: PayloadAction<Tool>) => {
            //changes state even when the user click on the same tool by
            //setting new obj
            const newObj: {
                title: Tool;
            } = {
                title: action.payload
            }

            state.tool = newObj;
        }
    }
});
export const { setTool } = utilitySlice.actions;

export const selectTool = (state: RootState) => state.utility.tool;

export default utilitySlice.reducer;
