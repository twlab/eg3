import Button from "@/components/ui/button/Button";
import StepAccordion from "@/components/ui/step-accordion/StepAccordion";
import TabView from "@/components/ui/tab-view/TabView";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  addTracks,
  selectCurrentSession,
  updateCurrentSession,
} from "@/lib/redux/slices/browserSlice";
import React, { useMemo, useState } from "react";
import JSON5 from "json5";
import { ITrackModel } from "@eg/tracks";
import Json5Fetcher from "@eg/tracks/src/models/Json5Fetcher";
import TrackModel, { mapUrl } from "@eg/tracks/src/models/TrackModel";
import DataHubParser from "@eg/tracks/src/models/DataHubParser";
import { HELP_LINKS, readFileAsText } from "@eg/tracks/src/models/util";
import {
  addCustomTracksPool,
  selectCustomTracksPool,
} from "@/lib/redux/slices/hubSlice";
import FacetTable from "@eg/tracks/src/components/GenomeView/TabComponents/FacetTable";

export default function RemoteTracks() {
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
  const session = useAppSelector(selectCurrentSession);
  const customTracksPool = useAppSelector(selectCustomTracksPool);

  const [selectedStep, setSelectedStep] = React.useState<AddTracksStep | null>(
    AddTracksStep.TRACK_TYPE
  );
  const dispatch = useAppDispatch();
  const currentSession = useAppSelector(selectCurrentSession);

  const [trackState, setTrackState] = React.useState<TrackState>({
    type: TRACK_TYPES.Numerical[0],
    url: "",
    name: "",
    urlError: "",
    metadata: { genome: session?.genomeId ?? "" },
    queryGenome: "",
  });

  const handleStepChange = (step: AddTracksStep | null) => {
    setSelectedStep(step ?? AddTracksStep.TRACK_TYPE);
  };

  const handleTypeChange = (type: string) => {
    setTrackState((prev) => ({ ...prev, type }));
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
    setTrackState((prev) => ({ ...prev, url, urlError: "" }));

    const needsIndex = TYPES_NEED_INDEX.includes(trackState.type.toLowerCase());
    if (isValidUrl(url)) {
      if (!needsIndex) {
        setSelectedStep(AddTracksStep.TRACK_LABEL);
      }
    }
  };

  const handleIndexUrlChange = (indexUrl: string) => {
    setTrackState((prev) => ({ ...prev, indexUrl }));

    if (isValidUrl(trackState.url) && isValidUrl(indexUrl)) {
      setSelectedStep(AddTracksStep.TRACK_LABEL);
    }
  };

  const handleQueryGenomeChange = (queryGenome: string) => {
    setTrackState((prev) => ({ ...prev, queryGenome }));
  };

  const handleTrackLabelEnter = () => {
    setSelectedStep(AddTracksStep.CONFIGURE_TRACK);
  };

  const handleOptionsChange = (value: string) => {
    try {
      const options = JSON5.parse(value) as Record<string, any>;
      setTrackState((prev) => ({ ...prev, options }));
    } catch (error) {
      setTrackState((prev) => ({ ...prev, options: undefined }));
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
        id: crypto.randomUUID(),
        isSelected: false,
      };

      if (trackState.indexUrl) {
        track.indexUrl = trackState.indexUrl;
      }

      if (track.type === "genomealign" || track.type === "bigchain") {
        track.querygenome = trackState.queryGenome || session.genomeId;
      }

      dispatch(addCustomTracksPool([...customTracksPool, track]));
      dispatch(addTracks(track));
    }
  };
  function onTracksAdded(tracks: TrackModel[]) {
    dispatch(
      updateCurrentSession({
        tracks: [...currentSession!.tracks, ...tracks],
      })
    );
  }

  const addedTrackUrls = useMemo(() => {
    if (currentSession) {
      return new Set(
        currentSession!.tracks.map((track) => track.url || track.name)
      );
    } else {
      return new Set();
    }
  }, [currentSession]);

  return (
    <div>
      <div className="flex flex-col py-4">
        <StepAccordion<AddTracksStep>
          selectedItem={selectedStep}
          onSelectedItemChange={handleStepChange}
          items={[
            {
              label: "Track Type",
              value: AddTracksStep.TRACK_TYPE,
              valuePreview: trackState.type ? `${trackState.type}` : undefined,
              component: (
                <SelectTrackType
                  selectedType={trackState.type}
                  onTypeChange={handleTypeChange}
                />
              ),
            },
            {
              label: "Track File URL",
              value: AddTracksStep.TRACK_FILE_URL,
              valuePreview: trackState.url ? `${trackState.url}` : undefined,
              component: (
                <TrackFileUrl
                  url={trackState.url}
                  indexUrl={trackState.indexUrl}
                  urlError={trackState.urlError}
                  showIndex={TYPES_NEED_INDEX.includes(
                    trackState.type.toLowerCase()
                  )}
                  showQueryGenome={
                    trackState.type === "genomealign" ||
                    trackState.type === "bigchain"
                  }
                  queryGenome={trackState.queryGenome}
                  onUrlChange={handleUrlChange}
                  onIndexUrlChange={handleIndexUrlChange}
                  onQueryGenomeChange={handleQueryGenomeChange}
                />
              ),
            },
            {
              label: "Track Label",
              value: AddTracksStep.TRACK_LABEL,
              valuePreview: trackState.name ? `${trackState.name}` : undefined,
              component: (
                <TrackLabel
                  name={trackState.name}
                  onNameChange={(name) =>
                    setTrackState((prev) => ({ ...prev, name }))
                  }
                  onEnterPress={handleTrackLabelEnter}
                />
              ),
            },
            {
              label: "Configure Track",
              value: AddTracksStep.CONFIGURE_TRACK,
              valuePreview: trackState.options ? "Configured" : undefined,
              component: (
                <ConfigureTrack onOptionsChange={handleOptionsChange} />
              ),
            },
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

      <div style={{ display: "flex", alignItems: "center", margin: "20px 0" }}>
        <div
          style={{ flex: 1, height: "1px", backgroundColor: "#205781" }}
        ></div>
        <span style={{ margin: "0 10px", fontSize: "14px", color: "black" }}>
          Custom Track Facet
        </span>
        <div
          style={{ flex: 1, height: "1px", backgroundColor: "#205781" }}
        ></div>
      </div>

      {currentSession && customTracksPool.length > 0 ? (
        <div>
          <h2 className="text-base font-medium mb-4">Available Tracks</h2>
          <FacetTable
            tracks={customTracksPool}
            addedTracks={currentSession!.tracks}
            onTracksAdded={onTracksAdded}
            publicTrackSets={undefined}
            addedTrackSets={addedTrackUrls as Set<string>}
            addTermToMetaSets={() => {}}
            contentColorSetup={{ color: "#222", background: "white" }}
          />
        </div>
      ) : (
        ""
      )}
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
  onQueryGenomeChange,
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
            Track Index URL (optional, only needed if data and index files are
            not in same folder)
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
    if (e.key === "Enter") {
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
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectCurrentSession);
  const [inputUrl, setInputUrl] = useState<any>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const customTracksPool = useAppSelector(selectCustomTracksPool);
  const currentSession = useAppSelector(selectCurrentSession);

  const loadHub = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    setIsLoading(true);
    let json;
    try {
      json = await new Json5Fetcher().get(mapUrl(inputUrl)!);
      if (!Array.isArray(json)) {
        setIsLoading(false);
        setError("Error: data hub should be an array of JSON object.");
        return;
      }
    } catch (error) {
      setIsLoading(false);
      setError("Cannot load the hub. Error: ");
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
      hubBase
    );

    if (tracks) {
      const tracksToShow = tracks.filter((track) => track.showOnHubLoad);
      if (tracksToShow.length > 0) {
        dispatch(
          updateCurrentSession({
            tracks: [...session!.tracks, ...tracksToShow],
          })
        );
      }
      setIsLoading(false);
      setError(""); // onHubUpdated([], [...tracks], "custom");
    }
    dispatch(addCustomTracksPool([...customTracksPool, ...tracks]));
  };
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const contents: any = await readFileAsText(file);
      const json = JSON5.parse(contents);
      const parser = new DataHubParser();

      const tracks = parser.getTracksInHub(json, "Custom hub");

      if (tracks) {
        if (tracks.length > 0) {
          dispatch(
            updateCurrentSession({
              tracks: [...session!.tracks, ...tracks],
            })
          );
        }
      }
      dispatch(addCustomTracksPool([...customTracksPool, ...tracks]));
    } catch (error) {
      console.error(error);
    }
  };
  const addedTrackUrls = useMemo(() => {
    if (currentSession) {
      return new Set(
        currentSession!.tracks.map((track) => track.url || track.name)
      );
    } else {
      return new Set();
    }
  }, [currentSession]);
  function onTracksAdded(tracks: TrackModel[]) {
    dispatch(
      updateCurrentSession({
        tracks: [...currentSession!.tracks, ...tracks],
      })
    );
  }
  return (
    <>
      <div>
        {" "}
        <form>
          <div className="form-group">
            <label>Remote hub URL</label>
            <div style={{ fontStyle: "italic" }}>
              <a
                href={HELP_LINKS.datahub}
                target="_blank"
                rel="noopener noreferrer"
              >
                data hub documentation
              </a>
            </div>
            <input
              placeholder="Enter URL..."
              type="text"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "20px",
                fontSize: "1rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                transition: "border-color 0.3s",
                outline: "none",
              }}
              className="form-control"
              value={inputUrl}
              onChange={(event) => setInputUrl(event.target.value)}
              onFocus={(event) => (event.target.style.borderColor = "#007bff")}
              onBlur={(event) => (event.target.style.borderColor = "#ccc")}
            />
            <button
              onClick={loadHub}
              disabled={isLoading || !inputUrl}
              style={{
                padding: "10px 20px",
                fontSize: "1rem",
                borderRadius: "4px",
                border: "none",
                color: "#fff",
                backgroundColor: isLoading || !inputUrl ? "#6c757d" : "#28a745",
                transition: "background-color 0.3s, border-color 0.3s",
                cursor: isLoading || !inputUrl ? "not-allowed" : "pointer",
              }}
              className="btn"
            >
              Load from URL
            </button>{" "}
          </div>
          <p style={{ color: "red" }}>{error}</p>
        </form>
        <br />
        <div>
          <div
            style={{ display: "flex", alignItems: "center", margin: "20px 0" }}
          >
            <div
              style={{ flex: 1, height: "1px", backgroundColor: "#ccc" }}
            ></div>
            <span style={{ margin: "0 10px", fontSize: "14px", color: "#666" }}>
              or
            </span>
            <div
              style={{ flex: 1, height: "1px", backgroundColor: "#ccc" }}
            ></div>
          </div>
          <br />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <input
              type="file"
              id="inputGroupFile01"
              onChange={handleFileUpload}
              style={{
                display: "none",
              }}
            />
            <label
              htmlFor="inputGroupFile01"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                cursor: "pointer",
                padding: "10px 20px",
                border: isHovered
                  ? " 2px solid  #87CEEB"
                  : "2px solid  #007bff",
                borderRadius: "4px",
                backgroundColor: isHovered ? "#87CEEB" : "#007bff",

                color: "#fff",
                transition: "background-color 0.3s ease",
                textAlign: "center",
              }}
            >
              Choose Datahub File
            </label>
          </div>
        </div>
        <div
          style={{ display: "flex", alignItems: "center", margin: "20px 0" }}
        >
          <div
            style={{ flex: 1, height: "1px", backgroundColor: "#205781" }}
          ></div>
          <span style={{ margin: "0 10px", fontSize: "14px", color: "black" }}>
            Custom Track Facet
          </span>
          <div
            style={{ flex: 1, height: "1px", backgroundColor: "#205781" }}
          ></div>
        </div>
        {currentSession && customTracksPool.length > 0 ? (
          <div>
            <h2 className="text-base font-medium mb-4">Available Tracks</h2>
            <FacetTable
              tracks={customTracksPool}
              addedTracks={currentSession!.tracks}
              onTracksAdded={onTracksAdded}
              publicTrackSets={undefined}
              addedTrackSets={addedTrackUrls as Set<string>}
              addTermToMetaSets={() => {}}
              contentColorSetup={{ color: "#222", background: "white" }}
            />
          </div>
        ) : (
          ""
        )}
      </div>
    </>
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
//       //       id: crypto.randomUUID(),
//       //       options: trackState.options ? trackState.options : {},
//       //     })
//       //   );
//       // });
