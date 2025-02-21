import Button from "@/components/ui/button/Button";
import StepAccordion from "@/components/ui/step-accordion/StepAccordion";
import TabView from "@/components/ui/tab-view/TabView";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { addTracks, selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import React from "react";
import JSON5 from "json5";
import { ITrackModel } from "@eg/tracks";

export default function RemoteTracks() {
    return (
        <TabView
            tabs={[
                {
                    label: "Add Tracks",
                    value: "add-tracks",
                    component: <AddTracks />
                },
                {
                    label: "Add Data Hubs",
                    value: "add-data-hubs",
                    component: <AddDataHubs />
                }
            ]}
        />
    );
}

// MARK: - Add Tracks

enum AddTracksStep {
    TRACK_TYPE = "select-track-type",
    TRACK_FILE_URL = "track-file-url",
    TRACK_LABEL = "track-label",
    CONFIGURE_TRACK = "configure-track",
}

interface TrackState {
    type: string;
    url: string;
    name: string;
    urlError: string;
    metadata: {
        genome: string;
    };
    indexUrl?: string;
    queryGenome?: string;
    options?: Record<string, any>;
}

function AddTracks() {
    const dispatch = useAppDispatch();
    const session = useAppSelector(selectCurrentSession);

    const [trackState, setTrackState] = React.useState<TrackState>({
        type: TRACK_TYPES.Numerical[0],
        url: "",
        name: "",
        urlError: "",
        metadata: { genome: session?.genome ?? "" },
        queryGenome: "",
    });

    const [selectedStep, setSelectedStep] = React.useState<AddTracksStep | null>(AddTracksStep.TRACK_TYPE);

    const handleStepChange = (step: AddTracksStep | null) => {
        setSelectedStep(step ?? AddTracksStep.TRACK_TYPE);
    };

    const handleTypeChange = (type: string) => {
        setTrackState(prev => ({ ...prev, type }));
        setSelectedStep(AddTracksStep.TRACK_FILE_URL);
    };

    const isValidUrl = (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleUrlChange = (url: string) => {
        setTrackState(prev => ({ ...prev, url, urlError: "" }));

        const needsIndex = TYPES_NEED_INDEX.includes(trackState.type.toLowerCase());
        if (isValidUrl(url)) {
            if (!needsIndex) {
                setSelectedStep(AddTracksStep.TRACK_LABEL);
            }
        }
    };

    const handleIndexUrlChange = (indexUrl: string) => {
        setTrackState(prev => ({ ...prev, indexUrl }));

        if (isValidUrl(trackState.url) && isValidUrl(indexUrl)) {
            setSelectedStep(AddTracksStep.TRACK_LABEL);
        }
    };

    const handleQueryGenomeChange = (queryGenome: string) => {
        setTrackState(prev => ({ ...prev, queryGenome }));
    };

    const handleTrackLabelEnter = () => {
        setSelectedStep(AddTracksStep.CONFIGURE_TRACK);
    };

    const handleOptionsChange = (value: string) => {
        try {
            const options = JSON5.parse(value) as Record<string, any>;
            setTrackState(prev => ({ ...prev, options }));
        } catch (error) {
            setTrackState(prev => ({ ...prev, options: undefined }));
        }
    };

    const handleSubmit = () => {
        if (session) {
            const track: ITrackModel = {
                type: trackState.type,
                url: trackState.url,
                name: trackState.name,
                options: trackState.options ?? {},
                metadata: { genome: trackState.metadata.genome },
                id: Date.now(),
                isSelected: false,
            }

            if (trackState.indexUrl) {
                track.indexUrl = trackState.indexUrl;
            }

            if (track.type === "genomealign" || track.type === "bigchain") {
                track.querygenome = trackState.queryGenome || session.genome;
            }

            dispatch(addTracks(track));
        }
    }

    return (
        <div className="flex flex-col py-4">
            <StepAccordion<AddTracksStep>
                selectedItem={selectedStep}
                onSelectedItemChange={handleStepChange}
                items={[
                    {
                        label: "Track Type",
                        value: AddTracksStep.TRACK_TYPE,
                        valuePreview: trackState.type ? `${trackState.type}` : undefined,
                        component: <SelectTrackType
                            selectedType={trackState.type}
                            onTypeChange={handleTypeChange}
                        />
                    },
                    {
                        label: "Track File URL",
                        value: AddTracksStep.TRACK_FILE_URL,
                        valuePreview: trackState.url ? `${trackState.url}` : undefined,
                        component: <TrackFileUrl
                            url={trackState.url}
                            indexUrl={trackState.indexUrl}
                            urlError={trackState.urlError}
                            showIndex={TYPES_NEED_INDEX.includes(trackState.type.toLowerCase())}
                            showQueryGenome={trackState.type === "genomealign" || trackState.type === "bigchain"}
                            queryGenome={trackState.queryGenome}
                            onUrlChange={handleUrlChange}
                            onIndexUrlChange={handleIndexUrlChange}
                            onQueryGenomeChange={handleQueryGenomeChange}
                        />
                    },
                    {
                        label: "Track Label",
                        value: AddTracksStep.TRACK_LABEL,
                        valuePreview: trackState.name ? `${trackState.name}` : undefined,
                        component: <TrackLabel
                            name={trackState.name}
                            onNameChange={(name) => setTrackState(prev => ({ ...prev, name }))}
                            onEnterPress={handleTrackLabelEnter}
                        />
                    },
                    {
                        label: "Configure Track",
                        value: AddTracksStep.CONFIGURE_TRACK,
                        valuePreview: trackState.options ? "Configured" : undefined,
                        component: <ConfigureTrack onOptionsChange={handleOptionsChange} />
                    }
                ]}
            />
            <Button
                active
                onClick={handleSubmit}
                style={{
                    width: "100%",
                    marginTop: "10px",
                }}
            >
                Submit
            </Button>
        </div>
    );
}

interface SelectTrackTypeProps {
    selectedType: string;
    onTypeChange: (type: string) => void;
}

function SelectTrackType({ selectedType, onTypeChange }: SelectTrackTypeProps) {
    return (
        <div className="space-y-4 py-4">
            <select
                className="w-full p-2 border rounded"
                value={selectedType}
                onChange={(e) => onTypeChange(e.target.value)}
            >
                {Object.entries(TRACK_TYPES).map(([group, types]) => (
                    <optgroup label={group} key={group}>
                        {types.map((type) => (
                            <option key={type} value={type}>
                                {type} - {TYPES_DESC[type as keyof typeof TYPES_DESC]}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>
        </div>
    );
}

interface TrackFileUrlProps {
    url: string;
    indexUrl?: string;
    urlError: string;
    showIndex: boolean;
    showQueryGenome?: boolean;
    queryGenome?: string;
    onUrlChange: (url: string) => void;
    onIndexUrlChange: (indexUrl: string) => void;
    onQueryGenomeChange?: (queryGenome: string) => void;
}

function TrackFileUrl({
    url,
    indexUrl,
    urlError,
    showIndex,
    showQueryGenome,
    queryGenome,
    onUrlChange,
    onIndexUrlChange,
    onQueryGenomeChange
}: TrackFileUrlProps) {
    return (
        <div className="space-y-4 py-4">
            <div>
                <label className="block mb-2">Track File URL</label>
                <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={url}
                    onChange={(e) => onUrlChange(e.target.value.trim())}
                />
                {urlError && <span className="text-red-500">{urlError}</span>}
            </div>
            {showIndex && (
                <div>
                    <label className="block mb-2">
                        Track Index URL (optional, only needed if data and index files are not in same folder)
                    </label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={indexUrl}
                        onChange={(e) => onIndexUrlChange(e.target.value.trim())}
                    />
                </div>
            )}
            {showQueryGenome && (
                <div>
                    <label className="block mb-2">Query Genome</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={queryGenome || ""}
                        onChange={(e) => onQueryGenomeChange?.(e.target.value.trim())}
                    />
                </div>
            )}
        </div>
    );
}

interface TrackLabelProps {
    name: string;
    onNameChange: (name: string) => void;
    onEnterPress?: () => void;
}

function TrackLabel({ name, onNameChange, onEnterPress }: TrackLabelProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onEnterPress?.();
        }
    };

    return (
        <div className="space-y-4 py-4">
            <div>
                <label className="block mb-2">Track Label</label>
                <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </div>
        </div>
    );
}

interface ConfigureTrackProps {
    onOptionsChange: (value: string) => void;
}

function ConfigureTrack({ onOptionsChange }: ConfigureTrackProps) {
    return (
        <div className="space-y-4 py-4">
            <div>
                <label className="block mb-2">Track Options (JSON)</label>
                <textarea
                    className="w-full p-2 border rounded"
                    rows={5}
                    onChange={(e) => onOptionsChange(e.target.value)}
                />
            </div>
        </div>
    );
}

// MARK: - Add Data Hubs

function AddDataHubs() {
    return (
        <div>
            <h1>Add Data Hubs</h1>
        </div>
    );
}

// MARK: - Constants

export const TRACK_TYPES = {
    Numerical: ["bigWig", "bedGraph", "qBED"],
    Variant: ["vcf"],
    "Dynamic sequence": ["dynseq"],
    Annotation: ["bed", "bigBed", "refBed", "bedcolor"],
    Peak: ["rgbpeak"],
    Categorical: ["categorical"],
    // "Transcription Factor": ["jaspar"],
    "Genome graph": ["brgfa", "graph"],
    Methylation: ["methylC", "modbed", "ballc"],
    Interaction: ["hic", "cool", "bigInteract", "longrange", "longrangecolor"],
    Stats: ["boxplot"],
    Repeats: ["rmskv2", "repeatmasker"],
    Alignment: ["bam", "pairwise", "snv", "snv2", "bigchain", "genomealign"],
    "3D Structure": ["g3d"],
    Dynamic: ["dbedgraph"],
    Image: ["omero4dn", "omeroidr"],
};

export const NUMERRICAL_TRACK_TYPES = ["bigwig", "bedgraph"]; // the front UI we allow any case of types, in TrackModel only lower case

const TYPES_NEED_INDEX = [
    "bedgraph",
    "methylc",
    "categorical",
    "bed",
    "refbed",
    "longrange",
    "longrangecolor",
    "bam",
    "pairwise",
    "snv",
    "snv2",
    "qbed",
    "dbedgraph",
    "vcf",
    "genomealign",
    "bedcolor",
    "brgfa",
    "graph",
    "modbed",
    "ballc",
];

export const TYPES_DESC = {
    bigWig: "numerical data",
    bedGraph: "numerical data, processed by tabix in .gz format",
    methylC: "methylation data, processed by tabix in .gz format",
    ballc: "methylation data in ballc format",
    categorical: "categorical data, processed by tabix in .gz format",
    bed: "annotationd data, processed by tabix in .gz format",
    bedcolor: "annotationd data with color, processed by tabix in .gz format",
    bigBed: "anotation data",
    repeatmasker: "repeats annotation data in bigBed format",
    refBed: "gene annotationd data, processed by tabix in .gz format",
    hic: "long range interaction data in hic format",
    longrange: "long range interaction data in longrange format",
    longrangecolor: "long range interaction data in longrange format with feature and color",
    bigInteract: "long range interaction data in bigInteract format",
    cool: "long range interaction data in cool format, use data uuid instead of URL",
    bam: "reads alignment data",
    pairwise: "pairwise nucleotide alignment data (same as snv)",
    snv: "pairwise nucleotide alignment data",
    snv2: "pairwise nucleotide alignment data with amino acid level mutations",
    qBED: "quantized numerical data, processed by tabix in .gz format",
    g3d: "3D structure in .g3d format",
    dbedgraph: "Dynamic bedgraph data",
    omero4dn: "image data from 4DN (4D Nucleome Data Portal)",
    omeroidr: "image data from IDR (Image Data Resource)",
    dynseq: "dynamic sequence",
    rgbpeak: "peak in bigbed format with RGB value",
    vcf: "Variant Call Format",
    boxplot: "show numerical data as boxplots",
    rmskv2: "RepeatMasker V2 structure with color",
    bigchain: "bigChain pairwise alignment",
    genomealign: "genome pairwise alignment",
    brgfa: "local genome graph in bed like rGFA format",
    graph: "global genome graph in bed like rGFA format",
    // jaspar: "transcription factor binding data from Jaspar",
    modbed: "read modification for methylation etc.",
};
