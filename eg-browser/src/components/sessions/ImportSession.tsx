import { useState } from "react";
import { useAppDispatch } from "@/lib/redux/hooks";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { BrowserSession, upsertSession } from "@/lib/redux/slices/browserSlice";
import Button from "../ui/button/Button";
import FileInput from "../ui/input/FileInput";
import { useNavigation } from "../core-navigation/NavigationStack";
import { GenomeCoordinate, ITrackModel, restoreLegacyViewRegion } from "@eg/tracks";

export default function ImportSession() {
    const dispatch = useAppDispatch();
    const navigation = useNavigation();
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (file: File | null) => {
        setError(null);
        setFile(file);

        if (!file) return;

        try {
            const content = await file.text();
            let session = JSON.parse(content);

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
                    highlights: session.highlights,
                    metadataTerms: session.metadataTerms,
                    trackModelId,
                } satisfies BrowserSession

                console.log("Parsed session", session);
            }

            if (!session.id || !session.genomeId || !session.viewRegion) {
                console.error("Invalid session file format", session);
                throw new Error("Invalid session file format");
            }

            if (!session.createdAt) session.createdAt = Date.now();
            if (!session.updatedAt) session.updatedAt = Date.now();

            session.id = crypto.randomUUID();

            dispatch(upsertSession(session));
            navigation.pop();
        } catch (e) {
            setError("Invalid session file. Please check the file format.");
            setFile(null);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex flex-row gap-2 w-full justify-start items-center">
                <Button
                    leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
                    onClick={() => {
                        const link = document.createElement('a');
                        link.href = '/example_session.json';
                        link.download = 'example_session.json';
                        link.click();
                    }}
                    outlined
                >
                    Download Example
                </Button>
            </div>
            <FileInput
                accept=".json"
                onFileChange={handleFileChange}
                dragMessage="Drag and drop a session file here"
            />
            {error && (
                <div className="text-red-500 text-sm">{error}</div>
            )}
            <Button
                active
                disabled={!file}
                onClick={async () => {
                    if (!file) return;
                    await handleFileChange(file);
                }}
            >
                Import
            </Button>
        </div>
    );
}
