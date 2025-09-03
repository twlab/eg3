import { GenomeHubManager, IGenome } from "wuepgg3-track";
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  setCustomGenomes,
  setCustomGenomesLoadStatus,
} from "../slices/genomeHubSlice";

export const refreshLocalGenomes = createAsyncThunk(
  "genome-hub/refresh",
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
);

export const addCustomGenome = createAsyncThunk(
  "genome-hub/add",
  async (file: File, thunkApi) => {
    const genomeHubManager = GenomeHubManager.getInstance();

    const jsonFile = await file.text();
    const genomeData = JSON.parse(jsonFile);

    await genomeHubManager.putGenome(genomeData);

    thunkApi.dispatch(refreshLocalGenomes());
  }
);

export const addCustomGenomeRemote = createAsyncThunk(
  "genome-hub/add",
  async (iGenome: IGenome, thunkApi) => {
    const genomeHubManager = GenomeHubManager.getInstance();
    const genomeData = iGenome;

    await genomeHubManager.putGenome(genomeData);

    thunkApi.dispatch(refreshLocalGenomes());
  }
);
export const clearAllGenomes = createAsyncThunk(
  "genome-hub/clear-all",
  async (_, thunkApi) => {
    const genomeHubManager = GenomeHubManager.getInstance();
    await genomeHubManager.deleteAllGenomes();

    thunkApi.dispatch(refreshLocalGenomes());
  }
);

export const getBundle = createAsyncThunk(
  "genome-hub/clear-all",
  async (_, thunkApi) => {
    const genomeHubManager = GenomeHubManager.getInstance();
    await genomeHubManager.deleteAllGenomes();

    thunkApi.dispatch(refreshLocalGenomes());
  }
);
