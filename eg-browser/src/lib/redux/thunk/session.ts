import {
  GenomeCoordinate,
  ITrackModel,
  DisplayedRegionModel,
  GenomeSerializer,
  getGenomeConfig,
} from "wuepgg3-track";
import { setCurrentSession, upsertSession } from "../slices/browserSlice";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { BrowserSession } from "../slices/browserSlice";
import { onRetrieveSession } from "@/components/root-layout/tabs/apps/destinations/SessionUI";
import { updateBundle } from "../slices/hubSlice";
import { generateUUID } from "wuepgg3-track";
import { GenomeConfig } from "wuepgg3-track/src/models/genomes/GenomeConfig";
import { addCustomGenomeRemote } from "./genome-hub";



export function convertSession(session: any, dispatch: any) {


  let newGenomeConfig: GenomeConfig | null = null;
  let coordinate: GenomeCoordinate | null = null;

  const curGenomeName = session["genomeName"]
    ? session["genomeName"]
    : session["genomeId"]
      ? session["genomeId"]
      : session["name"]
        ? session["name"]
        : session["id"]
          ? session["id"]
          : null;
  const tracks = session.tracks
    ? session.tracks
    : session.defaultTracks
      ? session.defaultTracks
      : [];
  if (session.chromosomes && session.chromosomes.length > 0) {

    const _newGenomeConfig = {
      id: curGenomeName,
      name: curGenomeName,
      chromosomes: session.chromosomes,
      defaultTracks: tracks.map((item: any) => ({
        ...item,
        waitToUpdate: true,
      })),
    };

    dispatch(addCustomGenomeRemote(_newGenomeConfig));
    newGenomeConfig = GenomeSerializer.deserialize(_newGenomeConfig);
  } else if (getGenomeConfig(curGenomeName)) {
    newGenomeConfig = getGenomeConfig(curGenomeName);
  } else if (session.viewRegion && typeof session.viewRegion === "object") {
    newGenomeConfig = getGenomeConfig(session.viewRegion._navContext._name);

  }

  if (newGenomeConfig && session.viewRegion && typeof session.viewRegion === "object") {
    coordinate = new DisplayedRegionModel(
      newGenomeConfig?.navContext,
      session.viewRegion._startBase,
      session.viewRegion._endBase
    ).currentRegionAsString() as GenomeCoordinate | null;

  }
  else if (newGenomeConfig && session.viewRegion !== undefined) {
    coordinate = session.viewRegion;
  } else if (newGenomeConfig && session.viewInterval) {
    coordinate = new DisplayedRegionModel(
      newGenomeConfig?.navContext,
      session.viewInterval.start,
      session.viewInterval.end
    ).currentRegionAsString() as GenomeCoordinate | null;
  } else if (newGenomeConfig && session.defaultRegion) {
    coordinate = session.defaultRegion;
  }
  if (!newGenomeConfig) {
    throw new Error("Invalid session file format, could not parse view region");
  }

  const mappedTracks = tracks.map((track: any) => {
    return {
      ...track,
      id: generateUUID(),
      genome: curGenomeName,
      isSelected: false,
    } satisfies ITrackModel;
  });

  session = {
    id: generateUUID(),
    genomeId: curGenomeName ? curGenomeName : newGenomeConfig ? newGenomeConfig?.genome.getName() : null,
    customGenome: session.customGenome,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    title: session.title ? session.title : "",
    viewRegion: coordinate,
    userViewRegion: coordinate,
    tracks: mappedTracks,
    highlights: session.highlights ?? [],
    metadataTerms: session.metadataTerms ?? [],
    bundleId: session.bundleId ? session.bundleId : null,
    regionSets: [],
    selectedRegionSet: session.regionSetView ?? null,
    overrideViewRegion: null,
  } satisfies BrowserSession;
  return session;
}

export const importOneSession = createAsyncThunk(
  "session/importOneSession",
  async (
    {
      session,
      navigatingToSession = false,
    }: {
      session: any;
      navigatingToSession?: boolean;
    },
    thunkApi
  ) => {

    session = convertSession(session, thunkApi.dispatch);

    if (!session.id || !session.genomeId || !session.viewRegion) {
      console.error("Invalid session file format", session);
      throw new Error("Invalid session file format");
    }

    if (!session.createdAt) session.createdAt = Date.now();
    if (!session.updatedAt) session.updatedAt = Date.now();

    session.id = generateUUID();

    thunkApi.dispatch(upsertSession(session));

    if (navigatingToSession) {
      thunkApi.dispatch(setCurrentSession(session.id));
    }
  }
);

export const addSessionsFromBundleId = createAsyncThunk(
  "session/addSessionsFromBundleId",
  async (sessionId: string, thunkApi) => {
    const response = await fetch(
      `https://eg-session.firebaseio.com/sessions/${sessionId}.json`
    ).then((r) => r.json() as Promise<Isession>);

    let sessionInView: any = null
    if (response && response.currentId) {
      sessionInView = response.sessionsInBundle[response.currentId].state
      sessionInView["title"] = response.sessionsInBundle[response.currentId].label
    }
    else if (response && !response.currentId) {
      const keys = Object.keys(response.sessionsInBundle)
      if (keys.length > 0) {
        sessionInView = response.sessionsInBundle[keys[0]].state
        sessionInView["title"] = response.sessionsInBundle[keys[0]].label
      }
    }
    // const sessions = Object.values(response.sessionsInBundle).map(
    //   (session) => session.state
    // );

    // for (const session of sessions) {
    //   thunkApi.dispatch(importOneSession({ session }));
    // }

    if (sessionInView) {
      thunkApi.dispatch(importOneSession({ session: sessionInView }));
    }

    thunkApi.dispatch(setCurrentSession(null));
  }
);

export const fetchBundle = createAsyncThunk(
  "bundle/fetchBundle",
  async (bundleId: string, thunkApi) => {
    if (bundleId) {
      try {
        const retrieveId = bundleId;
        const resBundle = await onRetrieveSession(retrieveId);

        if (resBundle) {
          thunkApi.dispatch(updateBundle(resBundle));
        }
      } catch (e) {
        // console.error(e);
      }
    }
  }
);
interface Isession {
  bundleId: string;
  currentId: string;
  sessionsInBundle: {
    [key: string]: {
      date: number;
      label: string;
      state: {
        bundleId: string;
        darkTheme: boolean;
        genomeName: string;
        isShowingNavigator: boolean;
        isShowingVR: boolean;
        regionSetViewIndex: number;
        trackLegendWidth: number;
        tracks: Array<{
          fileObj: string;
          isSelected: boolean;
          isText: boolean;
          label: string;
          metadata: {
            "Track type": string;
          };
          name: string;
          options: {
            label: string;
            maxRows?: number;
          };
          type: string;
          url: string;
          genome?: string;
        }>;
        viewInterval: {
          start: number;
          end: number;
        };
      };
    };
  };
}
