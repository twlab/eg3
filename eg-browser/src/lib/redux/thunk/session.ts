import { GenomeCoordinate, ITrackModel, restoreLegacyViewRegion } from "@eg/tracks";
import { upsertSession } from "../slices/browserSlice";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { BrowserSession } from "../slices/browserSlice";

export const importOneSession = createAsyncThunk(
    'session/importOneSession',
    async (session: any, thunkApi) => {
        if (session.genomeName) {
            let parsedViewRegion = restoreLegacyViewRegion(session, null) as GenomeCoordinate | null;

            if (!parsedViewRegion) {
                throw new Error("Invalid session file format, could not parse view region");
            }

            let trackModelId = 0;

            const mappedTracks = session.tracks.map((track: any) => {
                return {
                    ...track,
                    id: trackModelId++,
                    genome: session.genomeName,
                    isSelected: false,
                } satisfies ITrackModel
            });

            session = {
                id: crypto.randomUUID(),
                genomeId: session.genomeName,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                title: "",
                viewRegion: parsedViewRegion,
                userViewRegion: parsedViewRegion,
                tracks: mappedTracks,
                highlights: session.highlights ?? [],
                metadataTerms: session.metadataTerms ?? [],
                trackModelId,
                regionSets: [],
            } satisfies BrowserSession
        }

        if (!session.id || !session.genomeId || !session.viewRegion) {
            console.error("Invalid session file format", session);
            throw new Error("Invalid session file format");
        }

        if (!session.createdAt) session.createdAt = Date.now();
        if (!session.updatedAt) session.updatedAt = Date.now();

        session.id = crypto.randomUUID();

        thunkApi.dispatch(upsertSession(session));
    }
);

export const addSessionsFromBundleId = createAsyncThunk(
    'session/addSessionsFromBundleId',
    async (sessionId: string, thunkApi) => {
        
        const response = await fetch(`https://eg-session.firebaseio.com/sessions/${sessionId}.json`).then(r => r.json() as Promise<ISessionBundle>);

        const sessions = Object.values(response.sessionsInBundle).map(session => session.state);

        for (const session of sessions) {
            thunkApi.dispatch(importOneSession(session));
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
                        'Track type': string;
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
