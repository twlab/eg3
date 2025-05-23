import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import { IGenome } from "@eg/tracks";
import { RootState } from "../store";

const genomeHubAdapter = createEntityAdapter<IGenome>({
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

export type AsyncStatus = "idle" | "loading" | "success" | "failed";

export const genomeHubSlice = createSlice({
  name: "genomeHub",
  initialState: {
    customGenomes: genomeHubAdapter.getInitialState(),
    customGenomeLoadStatus: "idle" as AsyncStatus,
  },
  reducers: {
    setCustomGenomes: (state, action: PayloadAction<IGenome[]>) => {
      genomeHubAdapter.setAll(state.customGenomes, action.payload);
    },
    setCustomGenomesLoadStatus: (state, action: PayloadAction<AsyncStatus>) => {
      state.customGenomeLoadStatus = action.payload;
    },
  },
});
export const { setCustomGenomes, setCustomGenomesLoadStatus } =
  genomeHubSlice.actions;

const genomeHubSelectors = genomeHubAdapter.getSelectors(
  (state: RootState) => state.genomeHub.customGenomes
);

export const selectCustomGenomes = (state: RootState) =>
  genomeHubSelectors.selectAll(state);
export const selectCustomGenomeById = (state: RootState, id: string) =>
  genomeHubSelectors.selectById(state, id);

export const selectCustomGenomesLoadStatus = (state: RootState) =>
  state.genomeHub.customGenomeLoadStatus;

export default genomeHubSlice.reducer;
