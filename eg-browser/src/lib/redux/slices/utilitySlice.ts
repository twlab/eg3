import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Tool } from "@eg/tracks";
import { RootState } from "../store";
interface UtilityState {
  tool: Tool | null;
}

const initialState: UtilityState = {
  tool: Tool.Drag,
};

export const utilitySlice = createSlice({
  name: "utility",
  initialState,
  reducers: {
    setTool: (state, action: PayloadAction<Tool | null>) => {
      state.tool = action.payload;
    },
  },
});
export const { setTool } = utilitySlice.actions;

export const selectTool = (state: RootState) => state.utility.tool;

export default utilitySlice.reducer;
