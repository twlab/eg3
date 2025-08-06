import {
  GenomeCoordinate,
  ITrackModel,
  restoreLegacyViewRegion,
  DisplayedRegionModel,
} from "wuepgg3-track";
import { setCurrentSession, upsertSession } from "../slices/browserSlice";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { BrowserSession } from "../slices/browserSlice";
import { onRetrieveSession } from "@/components/root-layout/tabs/apps/destinations/SessionUI";
import { updateBundle } from "../slices/hubSlice";

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
    if (session.genomeName) {
      let parsedViewRegion = restoreLegacyViewRegion(
        session,
        null
      ) as DisplayedRegionModel | null;

      if (!parsedViewRegion) {
        throw new Error(
          "Invalid session file format, could not parse view region"
        );
      }

      const mappedTracks = session.tracks.map((track: any) => {
        return {
          ...track,
          id: crypto.randomUUID(),
          genome: session.genomeName,
          isSelected: false,
        } satisfies ITrackModel;
      });

      session = {
        id: crypto.randomUUID(),
        genomeId: session.genomeName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        title: "",
        viewRegion:
          parsedViewRegion.currentRegionAsString() as GenomeCoordinate,
        userViewRegion: session.viewInterval
          ? {
              start: parsedViewRegion._startBase,
              end: parsedViewRegion._endBase,
            }
          : null,
        tracks: mappedTracks,
        highlights: session.highlights ?? [],
        metadataTerms: session.metadataTerms ?? [],
        bundleId: session.bundleId ? session.bundleId : null,
        regionSets: [],
      } satisfies BrowserSession;
    }

    if (!session.id || !session.genomeId || !session.viewRegion) {
      console.error("Invalid session file format", session);
      throw new Error("Invalid session file format");
    }

    if (!session.createdAt) session.createdAt = Date.now();
    if (!session.updatedAt) session.updatedAt = Date.now();

    session.id = crypto.randomUUID();

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
    ).then((r) => r.json() as Promise<ISessionBundle>);

    const sessions = Object.values(response.sessionsInBundle).map(
      (session) => session.state
    );

    for (const session of sessions) {
      thunkApi.dispatch(importOneSession({ session }));
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
interface ISessionBundle {
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
