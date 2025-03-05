import GenomeHubManager from "@eg/tracks/src/genome-hub/GenomeHubManager";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { setCustomGenomes, setCustomGenomesLoadStatus } from "../slices/genomeHubSlice";

export const refreshLocalGenomes = createAsyncThunk(
    'genome-hub/refresh',
    async (_, thunkApi) => {
        thunkApi.dispatch(setCustomGenomesLoadStatus("loading"));

        const genomeHubManager = GenomeHubManager.getInstance();
        
        try {
            const customGenomes = await genomeHubManager.listCustomGenomes();
            thunkApi.dispatch(setCustomGenomes(customGenomes));
            thunkApi.dispatch(setCustomGenomesLoadStatus("success"));
        } catch (error) {
            thunkApi.dispatch(setCustomGenomesLoadStatus("failed"));
        }
    }
)

export const addCustomGenome = createAsyncThunk(
    'genome-hub/add',
    async (file: File, thunkApi) => {
        const genomeHubManager = GenomeHubManager.getInstance();
        
        // TODO: Add genome to local repository

        thunkApi.dispatch(refreshLocalGenomes());
    }
)
