import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface GenomeState {
    name: string;
    version: string;
}

export const genomeSlice = createSlice({
    name: "genome",
    initialState: {
        // genome: null as GenomeState | null
        genome: {
            name: "Human",
            version: "hg38"
        } as GenomeState | null
    },
    reducers: {
        setGenome: (state, action: PayloadAction<GenomeState | null>) => {
            state.genome = action.payload;
        }
    }
});
export const { setGenome } = genomeSlice.actions;

export const selectGenome = (state: RootState) => state.genome.genome;

export default genomeSlice.reducer;
