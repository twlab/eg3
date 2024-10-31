import { useState, useCallback, ChangeEvent, FormEvent } from "react";

import JSON5 from "json5";
import TrackModel from "@/models/TrackModel";
import { getSecondaryGenomes } from "@/models/util";
import CustomHubAdder from "./CustomHubAdder";
// import FacetTable from "./FacetTable";
import { HELP_LINKS } from "@/models/util";
import TrackOptionsUI from "./TrackOptionsUI";
import { getTrackConfig } from "@/trackConfigs/config-menu-models.tsx/getTrackConfig";
import { Tabs, Tab } from "./CustomTabs";

export const TRACK_TYPES = {
  Numerical: ["bigWig", "bedGraph", "qBED"],
  Variant: ["vcf"],
  "Dynamic sequence": ["dynseq"],
  Annotation: ["bed", "bigBed", "refBed", "bedcolor"],
  Peak: ["rgbpeak"],
  Categorical: ["categorical"],
  "Genome graph": ["brgfa", "graph"],
  Methylation: ["methylC", "modbed", "ballc"],
  Interaction: ["hic", "cool", "bigInteract", "longrange", "longrangecolor"],
  Stats: ["boxplot"],
  Repeats: ["rmskv2", "repeatmasker"],
  Alignment: ["bam", "pairwise", "snv", "snv2", "bigchain", "genomealign"],
  "3D Structure": ["g3d"],
  Dynamic: ["dbedgraph"],
  Image: ["omero4dn", "omeroid"],
};

export const NUMERICAL_TRACK_TYPES = ["bigwig", "bedgraph"];

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
  bed: "annotation data, processed by tabix in .gz format",
  bedcolor: "annotation data with color, processed by tabix in .gz format",
  bigBed: "annotation data",
  repeatmasker: "repeats annotation data in bigBed format",
  refBed: "gene annotation data, processed by tabix in .gz format",
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
  modbed: "read modification for methylation etc.",
};

interface CustomTrackAdderProps {
  addedTracks: TrackModel[];
  customTracksPool?: TrackModel[];
  onTracksAdded?: (tracks: TrackModel[]) => void;
  addTermToMetaSets?: (term: string) => void;
  genomeConfig: { genome: { getName: () => string } };
  addedTrackSets?: Set<string>;
}

const CustomTrackAdder = ({
  addedTracks,
  customTracksPool,
  onTracksAdded,
  addTermToMetaSets,
  genomeConfig,
  addedTrackSets,
}: CustomTrackAdderProps) => {
  const [state, setState] = useState<any>({
    type: TRACK_TYPES.Numerical[0],
    url: "",
    name: "",
    urlError: "",
    metadata: { genome: genomeConfig.genome.getName() },
    trackAdded: false,
    selectedTabIndex: 0,
    querygenome: "",
    options: null,
    indexUrl: undefined,
  });

  const handleSubmitClick = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!onTracksAdded) return;

      if (!state.url) {
        setState((prevState) => ({
          ...prevState,
          urlError: "Enter a URL",
        }));
        return;
      } else {
        const newTrack = new TrackModel({
          ...state,
          datahub: "Remote track",
        });
        if (newTrack.querygenome !== "") {
          if (!state.querygenome) {
            setState((prevState) => ({
              ...prevState,
              urlError:
                "Please enter query genome for genomealign/bigchain track",
            }));
            return;
          }
        }
        onTracksAdded([newTrack]);
        setState((prevState) => ({
          ...prevState,
          urlError: "",
          trackAdded: true,
        }));
      }
    },
    [state, onTracksAdded]
  );

  const getOptions = (value: string) => {
    let options = null;
    try {
      options = JSON5.parse(value);
    } catch (error) {
      // notify.show('Option syntax is not correct, ignored', 'error', 3000);
    }
    setState((prevState) => ({ ...prevState, options }));
  };

  const renderTypeOptions = () =>
    Object.entries(TRACK_TYPES).map((types) => (
      <optgroup label={types[0]} key={types[0]}>
        {types[1].map((type) => (
          <option key={type} value={type}>
            {type} - {TYPES_DESC[type]}
          </option>
        ))}
      </optgroup>
    ));

  const renderGenomeOptions = (allGenomes: string[]) =>
    allGenomes.map((genome) => (
      <option key={genome} value={genome}>
        {genome}
      </option>
    ));

  const renderButtons = () => {
    if (state.trackAdded) {
      return (
        <>
          <button className="btn btn-success" disabled={true}>
            Success
          </button>
          <button
            className="btn btn-link"
            onClick={() =>
              setState((prevState) => ({ ...prevState, trackAdded: false }))
            }
          >
            Add another track
          </button>
        </>
      );
    } else {
      return (
        <button className="btn btn-primary" onClick={handleSubmitClick}>
          Submit
        </button>
      );
    }
  };

  const renderCustomTrackAdder = () => {
    const { type, url, name, metadata, urlError, querygenome, indexUrl } =
      state;
    const primaryGenome = genomeConfig.genome.getName();
    var allGenomes = getSecondaryGenomes(primaryGenome, addedTracks);
    allGenomes.unshift(primaryGenome);
    return (
      <form>
        <h1>Add remote track</h1>
        <div className="form-group">
          <label>Track type</label>
          <span style={{ marginLeft: "10px", fontStyle: "italic" }}>
            <a
              href={HELP_LINKS.tracks}
              target="_blank"
              rel="noopener noreferrer"
            >
              track format documentation
            </a>
          </span>
          <select
            className="form-control"
            value={type}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setState((prevState) => ({
                ...prevState,
                type: event.target.value,
              }))
            }
          >
            {renderTypeOptions()}
          </select>
        </div>
        <div className="form-group">
          <label>Track file URL</label>
          <input
            type="text"
            className="form-control"
            value={url}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setState((prevState) => ({
                ...prevState,
                url: event.target.value.trim(),
              }))
            }
          />
        </div>
        <div className="form-group">
          <label>Track label</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setState((prevState) => ({
                ...prevState,
                name: event.target.value,
              }))
            }
          />
        </div>
        <div
          className="form-group"
          style={{
            display: TYPES_NEED_INDEX.includes(type.toLowerCase())
              ? "block"
              : "none",
          }}
        >
          <label>
            Track index URL (optional, only need if data and index files are not
            in same folder)
          </label>
          <input
            type="text"
            className="form-control"
            value={indexUrl}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setState((prevState) => ({
                ...prevState,
                indexUrl: event.target.value.trim(),
              }))
            }
          />
        </div>
        <div
          className="form-group"
          style={{
            display:
              type === "bigchain" || type === "genomealign" ? "block" : "none",
          }}
        >
          <label>Query genome</label>
          <input
            type="text"
            className="form-control"
            value={querygenome}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setState((prevState) => ({
                ...prevState,
                querygenome: event.target.value.trim(),
              }))
            }
          />
        </div>
        <div className="form-group">
          <label>Genome</label>
          <select
            className="form-control"
            value={metadata.genome}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setState((prevState) => ({
                ...prevState,
                metadata: { genome: event.target.value },
              }))
            }
          >
            {renderGenomeOptions(allGenomes)}
          </select>
        </div>
        <span style={{ color: "red" }}>{urlError}</span>
        <TrackOptionsUI onGetOptions={(value) => getOptions(value)} />
        {renderButtons()}
      </form>
    );
  };

  const renderCustomHubAdder = () => (
    <CustomHubAdder onTracksAdded={(tracks) => onTracksAdded!(tracks)} />
  );

  return (
    <div id="CustomTrackAdder">
      <div>
        <Tabs
          onSelect={(index: number, label: string) =>
            setState({ ...state, selectedTabIndex: index })
          }
          selected={state.selectedTabIndex}
          headerStyle={{ fontWeight: "bold" }}
          activeHeaderStyle={{ color: "blue" }}
        >
          <Tab label="Add Remote Track">{renderCustomTrackAdder()}</Tab>
          <Tab label="Add Remote Data Hub">{renderCustomHubAdder()}</Tab>
        </Tabs>
      </div>
      {/* {customTracksPool.length > 0 && (
        <FacetTable
          tracks={customTracksPool}
          addedTracks={addedTracks}
          onTracksAdded={onTracksAdded}
          addedTrackSets={addedTrackSets}
          addTermToMetaSets={addTermToMetaSets}
        />
      )} */}
    </div>
  );
};

export default CustomTrackAdder;
