import React, { use, useMemo, useState } from "react";

// UI Components
import Button from "@/components/ui/button/Button";
import TabView from "@/components/ui/tab-view/TabView";
import FacetTable from "./FacetTable";
import FileInput from "@/components/ui/input/FileInput";
import { generateUUID } from "wuepgg3-track";
// Redux Imports
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  addTracks,
  selectCurrentSession,
  updateCurrentSession,
} from "@/lib/redux/slices/browserSlice";
import {
  addCustomTracksPool,
  selectCustomTracksPool,
} from "@/lib/redux/slices/hubSlice";

// Custom Hooks

// External Libraries
import JSON5 from "json5";

// wuepgg3-track Imports
import {
  ITrackModel,
  Json5Fetcher,
  TrackModel,
  mapUrl,
  DataHubParser,
  HELP_LINKS,
  readFileAsText,
} from "wuepgg3-track";
import useCurrentGenome from "@/lib/hooks/useCurrentGenome";
import useMidSizeNavigationTab from "@/lib/hooks/useMidSizeNavigationTab";
export default function RemoteTracks() {
  useMidSizeNavigationTab();
  return (
    <TabView
      tabs={[
        {
          label: "Add Tracks",
          value: "add-tracks",
          component: <AddTracks />,
        },
        {
          label: "Add Data Hubs",
          value: "add-data-hubs",
          component: <AddDataHubs />,
        },
      ]}
    />
  );
}

// MARK: - Add Tracks

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
  useMidSizeNavigationTab();
  const currentSession = useAppSelector(selectCurrentSession);
  const customTracksPool = useAppSelector(selectCustomTracksPool);
  const [submitted, setSubmitted] = React.useState(false);
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const _genomeConfig = useCurrentGenome();
  const dispatch = useAppDispatch();

  const typeSectionRef = React.useRef<HTMLDivElement>(null);
  const urlSectionRef = React.useRef<HTMLDivElement>(null);
  const genomeSectionRef = React.useRef<HTMLDivElement>(null);

  const [trackState, setTrackState] = React.useState<TrackState>({
    type: TRACK_TYPES.Numerical[0],
    url: "",
    name: "",
    urlError: "",
    metadata: { genome: currentSession?.genomeId ?? "" },
    queryGenome: "",
  });

  const genomesInSession = useMemo(() => {
    const querySet = new Set<string>();
    if (
      currentSession &&
      _genomeConfig &&
      (currentSession.genomeId === _genomeConfig.name ||
        currentSession.genomeId === _genomeConfig.id)
    ) {
      querySet.add(currentSession.genomeId);
      for (const track of currentSession.tracks) {
        if (track?.type === "genomealign" && track?.querygenome) {
          querySet.add(track.querygenome);
        } else if (track?.type === "genomealign" && track?.metadata?.genome) {
          querySet.add(track.metadata.genome);
        }
      }
    }
    return Array.from(querySet);
  }, [_genomeConfig, currentSession]);

  const needsIndex = TYPES_NEED_INDEX.includes(trackState.type.toLowerCase());
  const typeComplete = !!trackState.type;
  const urlComplete = !!trackState.url;
  const genomeComplete = !!trackState.metadata.genome;
  const canSubmit = typeComplete && urlComplete && genomeComplete;

  const handleTypeChange = (type: string) => {
    setTrackState((prev) => ({ ...prev, type }));
  };

  const handleUrlChange = (url: string) => {
    setTrackState((prev) => ({ ...prev, url, urlError: "" }));
    setSubmitted(false);
  };

  const handleIndexUrlChange = (indexUrl: string) => {
    setTrackState((prev) => ({ ...prev, indexUrl }));
  };

  const handleQueryGenomeChange = (queryGenome: string) => {
    setTrackState((prev) => ({ ...prev, queryGenome }));
  };

  const handleTrackGenomeChange = (genome: string) => {
    setTrackState((prev) => ({
      ...prev,
      queryGenome: genome,
      metadata: { ...prev.metadata, genome },
    }));
  };

  const handleOptionsChange = (value: string) => {
    try {
      const options = JSON5.parse(value) as Record<string, any>;
      setTrackState((prev) => ({ ...prev, options }));
    } catch {
      setTrackState((prev) => ({ ...prev, options: undefined }));
    }
  };

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (!canSubmit) {
      if (!typeComplete) {
        typeSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } else if (!urlComplete) {
        urlSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } else if (!genomeComplete) {
        genomeSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }
    if (currentSession) {
      const rawUrl = trackState.url;
      const finalUrl =
        rawUrl && !/^https?:\/\/|^ftp:\/\//i.test(rawUrl)
          ? `https://${rawUrl}`
          : rawUrl;
      const track: ITrackModel = {
        type: trackState.type,
        url: finalUrl,
        name: trackState.name,
        options: trackState.options ?? {},
        metadata: { genome: trackState.metadata.genome },
        id: generateUUID(),
        isSelected: false,
      };
      if (trackState.indexUrl) {
        track.indexUrl = trackState.indexUrl;
      }
      if (track.type === "genomealign" || track.type === "bigchain") {
        track.querygenome = trackState.queryGenome || currentSession.genomeId;
      }
      console.log(track);
      dispatch(addCustomTracksPool([...customTracksPool, track]));
      dispatch(addTracks(track));
      setSubmitted(true);
    }
  };

  const handleAddNew = () => {
    setTrackState({
      type: TRACK_TYPES.Numerical[0],
      url: "",
      name: "",
      urlError: "",
      metadata: { genome: currentSession?.genomeId ?? "" },
      queryGenome: "",
    });
    setSubmitted(false);
    setSubmitAttempted(false);
  };

  function onTracksAdded(tracks: TrackModel[]) {
    dispatch(
      updateCurrentSession({
        tracks: [...currentSession!.tracks, ...tracks],
      }),
    );
  }

  const addedTrackUrls = useMemo(() => {
    if (currentSession) {
      return new Set(
        currentSession!.tracks.map((track) => track.url || track.name),
      );
    } else {
      return new Set();
    }
  }, [currentSession]);

  return (
    <div>
      {currentSession && customTracksPool.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 pb-3 mb-1">
          <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wider mb-2">
            Available Tracks
          </p>
          <FacetTable
            tracks={customTracksPool}
            addedTracks={currentSession!.tracks}
            onTracksAdded={onTracksAdded}
            publicTrackSets={undefined}
            addedTrackSets={addedTrackUrls as Set<string>}
            addTermToMetaSets={() => { }}
            contentColorSetup={{ color: "#222", background: "white" }}
          />
        </div>
      )}
      <div className="px-4 py-2 flex flex-col gap-4">
        {/* 1. Track Type */}
        <div ref={typeSectionRef} className="flex flex-col ">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
              Track Type{" "}
              <span className="text-red-400 normal-case font-normal tracking-normal">
                *
              </span>
            </p>
            {submitAttempted && !typeComplete && (
              <span className="text-sm text-red-500">Required</span>
            )}
          </div>
          <SelectTrackType
            selectedType={trackState.type}
            onTypeChange={handleTypeChange}
            hasError={submitAttempted && !typeComplete}
          />
        </div>

        {/* 2. File URL */}
        <div ref={urlSectionRef} className="flex flex-col ">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
              File URL{" "}
              <span className="text-red-400 normal-case font-normal tracking-normal">
                *
              </span>
            </p>
            {submitAttempted && !urlComplete && (
              <span className="text-sm text-red-500">Required</span>
            )}
          </div>
          <TrackFileUrl
            url={trackState.url}
            indexUrl={trackState.indexUrl}
            urlError={trackState.urlError}
            showIndex={needsIndex}
            showQueryGenome={
              trackState.type === "genomealign" ||
              trackState.type === "bigchain"
            }
            queryGenome={trackState.queryGenome}
            onUrlChange={handleUrlChange}
            onIndexUrlChange={handleIndexUrlChange}
            onQueryGenomeChange={handleQueryGenomeChange}
            hasError={submitAttempted && !urlComplete}
          />
        </div>

        {/* 3. Assembly */}
        <div ref={genomeSectionRef} className="flex flex-col ">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
              Assembly{" "}
              <span className="text-red-400 normal-case font-normal tracking-normal">
                *
              </span>
            </p>
            {submitAttempted && !genomeComplete && (
              <span className="text-sm text-red-500">Required</span>
            )}
          </div>
          {genomesInSession.length > 0 ? (
            <select
              value={trackState.metadata.genome || genomesInSession[0]}
              onChange={(e) => handleTrackGenomeChange(e.target.value)}
              className={`w-full border rounded-lg px-3 py-1.5 bg-white dark:bg-dark-surface text-primary dark:text-dark-primary text-base focus:outline-none focus:ring-2 focus:ring-secondary ${submitAttempted && !genomeComplete
                ? "border-red-400 focus:ring-red-400"
                : "border-gray-300 dark:border-gray-600"
                }`}
            >
              {genomesInSession.map((genome) => (
                <option key={genome} value={genome}>
                  {genome}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-primary/50 dark:text-dark-primary/50 italic">
              No assemblies in current session.
            </p>
          )}
        </div>

        {/* 4. Track Label — optional */}
        <div className="flex flex-col ">
          <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
            Track Label{" "}
            <span className="normal-case font-normal tracking-normal opacity-50 text-sm">
              optional
            </span>
          </p>
          <TrackLabel
            name={trackState.name}
            onNameChange={(name) =>
              setTrackState((prev) => ({ ...prev, name }))
            }
          />
        </div>

        {/* 5. Options — optional */}
        <div className="flex flex-col ">
          <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
            Options{" "}
            <span className="normal-case font-normal tracking-normal opacity-50 text-sm">
              optional · JSON
            </span>
          </p>
          <ConfigureTrack onOptionsChange={handleOptionsChange} />
        </div>

        {/* Actions */}
        {!submitted ? (
          <Button
            active={canSubmit}
            onClick={handleSubmit}
            outlined
            style={{
              // backgroundColor: "black",
              // color: "white",
              width: "fit-content",
              padding: "8px 16px",
            }}
          >
            Add Track
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (canSubmit && currentSession) {
                  const track: ITrackModel = {
                    type: trackState.type,
                    url: trackState.url,
                    name: trackState.name,
                    options: trackState.options ?? {},
                    metadata: { genome: trackState.metadata.genome },
                    id: generateUUID(),
                    isSelected: false,
                  };
                  if (trackState.indexUrl) {
                    track.indexUrl = trackState.indexUrl;
                  }
                  if (
                    track.type === "genomealign" ||
                    track.type === "bigchain"
                  ) {
                    track.querygenome =
                      trackState.queryGenome || currentSession.genomeId;
                  }
                  dispatch(addCustomTracksPool([...customTracksPool, track]));
                  dispatch(addTracks(track));
                }
              }}
              disabled={!canSubmit}
              style={{ flex: 1, fontSize: "14px" }}
            >
              Add Same
            </Button>
            <Button
              backgroundColor="tint"
              onClick={handleAddNew}
              style={{ flex: 1, fontSize: "14px" }}
            >
              Add New
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface SelectTrackTypeProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  hasError?: boolean;
}

function SelectTrackType({
  selectedType,
  onTypeChange,
  hasError,
}: SelectTrackTypeProps) {
  return (
    <select
      className={`w-full border rounded-lg px-3 py-1.5 bg-white dark:bg-dark-surface text-primary dark:text-dark-primary text-base focus:outline-none focus:ring-2 focus:ring-secondary ${hasError
        ? "border-red-400 focus:ring-red-400"
        : "border-gray-300 dark:border-gray-600"
        }`}
      value={selectedType}
      onChange={(e) => onTypeChange(e.target.value)}
    >
      {Object.entries(TRACK_TYPES).map(([group, types]) => (
        <optgroup label={group} key={group}>
          {types.map((type) => (
            <option key={type} value={type}>
              {type} — {TYPES_DESC[type as keyof typeof TYPES_DESC]}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
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
  hasError?: boolean;
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
  onQueryGenomeChange,
  hasError,
}: TrackFileUrlProps) {
  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="https://example.com/track.bigWig"
        className={`w-full border rounded-lg px-3 py-1.5 bg-white dark:bg-dark-surface text-primary dark:text-dark-primary text-base focus:outline-none focus:ring-2 focus:ring-secondary ${hasError
          ? "border-red-400 focus:ring-red-400"
          : "border-gray-300 dark:border-gray-600"
          }`}
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
      />
      {urlError && <p className="text-sm text-red-500">{urlError}</p>}
      {showIndex && (
        <div className="flex flex-col gap-1">
          <label className="text-sm text-primary/60 dark:text-dark-primary/60">
            Index URL{" "}
            <span className="opacity-70">
              — only if not co-located with data file
            </span>
          </label>
          <input
            type="text"
            placeholder="https://example.com/track.bigWig.tbi"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-dark-surface text-primary dark:text-dark-primary text-base focus:outline-none focus:ring-2 focus:ring-secondary"
            value={indexUrl ?? ""}
            onChange={(e) => onIndexUrlChange(e.target.value)}
          />
        </div>
      )}
      {showQueryGenome && (
        <div className="flex flex-col gap-1">
          <label className="text-sm text-primary/60 dark:text-dark-primary/60">
            Query Genome
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-dark-surface text-primary dark:text-dark-primary text-base focus:outline-none focus:ring-2 focus:ring-secondary"
            value={queryGenome || ""}
            onChange={(e) => onQueryGenomeChange?.(e.target.value)}
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
    if (e.key === "Enter") {
      onEnterPress?.();
    }
  };

  return (
    <input
      type="text"
      placeholder="My track"
      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-dark-surface text-primary dark:text-dark-primary text-base focus:outline-none focus:ring-2 focus:ring-secondary"
      value={name}
      onChange={(e) => onNameChange(e.target.value)}
      onKeyDown={handleKeyDown}
    />
  );
}

interface ConfigureTrackProps {
  onOptionsChange: (value: string) => void;
}

function ConfigureTrack({ onOptionsChange }: ConfigureTrackProps) {
  return (
    <textarea
      rows={2}
      placeholder='{ "color": "blue", "height": 20 }'
      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3  bg-white dark:bg-dark-surface text-primary dark:text-dark-primary text-base focus:outline-none focus:ring-2 focus:ring-secondary font-mono resize-none"
      onChange={(e) => onOptionsChange(e.target.value)}
    />
  );
}

// MARK: - Add Data Hubs

function AddDataHubs() {
  useMidSizeNavigationTab();
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectCurrentSession);
  const [inputUrl, setInputUrl] = useState<any>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const customTracksPool = useAppSelector(selectCustomTracksPool);
  const currentSession = useAppSelector(selectCurrentSession);

  const loadHub = async () => {
    setIsLoading(true);
    let json;
    try {
      json = await new Json5Fetcher().get(mapUrl(inputUrl)!);
      if (!Array.isArray(json)) {
        setIsLoading(false);
        setError("Error: data hub should be an array of JSON object.");
        return;
      }
    } catch (err: any) {
      setIsLoading(false);
      const status = err?.status
        ? ` (${err.status} ${err.statusText ?? ""})`.trimEnd()
        : "";
      setError(`Cannot load the hub${status}. Check the URL and try again.`);
      return;
    }

    const lastSlashIndex = inputUrl.lastIndexOf("/");
    const hubBase = inputUrl.substring(0, lastSlashIndex).trimEnd();
    const parser = new DataHubParser();
    const tracks = await parser.getTracksInHub(
      json,
      "Custom hub",
      "",
      false,
      0,
      hubBase,
    );

    if (tracks) {
      const tracksToShow = tracks.filter((track) => track.showOnHubLoad);
      if (tracksToShow.length > 0) {
        dispatch(
          updateCurrentSession({
            tracks: [...session!.tracks, ...tracksToShow],
          }),
        );
      }

      setIsLoading(false);
      setError(""); // onHubUpdated([], [...tracks], "custom");
    }
    dispatch(addCustomTracksPool([...customTracksPool, ...tracks]));
  };
  const handleFileUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    try {
      const contents: any = await readFileAsText(file);
      const json = JSON5.parse(contents);
      const parser = new DataHubParser();

      const tracks = parser.getTracksInHub(json, "Custom hub");
      const tracksToShow = tracks.filter((track) => track.showOnHubLoad);
      if (tracksToShow.length > 0) {
        dispatch(
          updateCurrentSession({
            tracks: [...session!.tracks, ...tracksToShow],
          }),
        );
      }
      dispatch(addCustomTracksPool([...customTracksPool, ...tracks]));
    } catch (error) {
      console.error(error);
    }
  };
  const addedTrackUrls = useMemo(() => {
    if (currentSession) {
      return new Set(
        currentSession!.tracks.map((track) => track.url || track.name),
      );
    } else {
      return new Set();
    }
  }, [currentSession]);
  function onTracksAdded(tracks: TrackModel[]) {
    dispatch(
      updateCurrentSession({
        tracks: [...currentSession!.tracks, ...tracks],
      }),
    );
  }
  return (
    <div>
      {currentSession && customTracksPool.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 pb-3 mb-1">
          <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wider mb-2">
            Available Tracks
          </p>
          <FacetTable
            tracks={customTracksPool}
            addedTracks={currentSession!.tracks}
            onTracksAdded={onTracksAdded}
            publicTrackSets={undefined}
            addedTrackSets={addedTrackUrls as Set<string>}
            addTermToMetaSets={() => { }}
            contentColorSetup={{ color: "#222", background: "white" }}
          />
        </div>
      )}
      <div className="px-4 py-3 flex flex-col gap-4">
        <div className="flex flex-col gap-2 ">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
              Remote Hub URL
            </p>
            <a
              href={HELP_LINKS.datahub}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 underline underline-offset-2"
            >
              Documentation
            </a>
          </div>
          <input
            placeholder="https://example.com/hub.json"
            type="text"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-dark-surface text-primary dark:text-dark-primary text-base focus:outline-none focus:ring-2 focus:ring-secondary"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
          />
          <Button
            active={!!inputUrl && !isLoading}
            onClick={loadHub}
            style={{
              // backgroundColor: "black",
              // color: "white",
              width: "fit-content",
              padding: "8px 16px",
            }}
          >
            {isLoading ? "Loading…" : "Load Hub"}
          </Button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-sm text-primary/50 dark:text-dark-primary/50">
            or
          </span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="flex flex-col ">
          <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
            Upload Hub File
          </p>
          <div className="w-full">
            <FileInput
              accept=".json"
              onFileChange={handleFileUpload}
              dragMessage="Drag and drop a .json hub file here"
              containerClassName="max-w-md mx-auto w-full"
              className="w-full"
            />
          </div>
        </div>
      </div>
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
  longrangecolor:
    "long range interaction data in longrange format with feature and color",
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

//  // Create a map to store files without suffix as keys and corresponding file objects as values
//       const fileMap = new Map();

//       fileList.forEach((file) => {
//         const nameWithoutSuffix = file.name.replace(indexSuffix, "");

//         if (!fileMap.has(nameWithoutSuffix)) {
//           // Initialize an array for this name without suffix
//           fileMap.set(nameWithoutSuffix, []);
//         }

//         // Add the current file object to the array
//         fileMap.get(nameWithoutSuffix).push(file);
//       });

//       // Filter the map to keep only entries with more than one file object
//       const matchingFiles = Array.from(fileMap.values()).filter(
//         (fileArray) => fileArray.length > 1
//       );

//       if (matchingFiles.length === 0) {
//         setTrackState((prev) => ({
//           ...prev,
//           msg: "Please select both track and index files",
//         }));
//         return null;
//       }

//       // Flatten the array of arrays into a single array of matching file objects
//       const matchingFilesArray = matchingFiles.flat();
//       const result = matchingFilesArray.filter(
//         (file) => !file.name.endsWith(".tbi")
//       );

//       console.log(result);
//       console.log(matchingFilesArray);
//       // matchingFiles.map(([name]) => {
//       //   tracks.push(
//       //     new TrackModel({
//       //       type: trackState.type,
//       //       url: "",
//       //       fileObj: fileList[0],
//       //       name: fileList[0].name,
//       //       label: fileList[0].name,
//       //       files: fileList,
//       //       id: generateUUID(),
//       //       options: trackState.options ? trackState.options : {},
//       //     })
//       //   );
//       // });
