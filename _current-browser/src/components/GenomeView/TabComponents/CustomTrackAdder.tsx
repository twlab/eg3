import {
  useState,
  useCallback,
  ChangeEvent,
  FormEvent,
  CSSProperties,
} from "react";

import JSON5 from "json5";
import TrackModel from "@/models/TrackModel";
import { getSecondaryGenomes } from "@/models/util";
import CustomHubAdder from "./CustomHubAdder";
import { HELP_LINKS } from "@/models/util";
import TrackOptionsUI from "./TrackOptionsUI";
import { getTrackConfig } from "@/trackConfigs/config-menu-models.tsx/getTrackConfig";
import FacetTable from "./FacetTable";

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
  customTracksPool: TrackModel[];
  onTracksAdded?: (tracks: TrackModel[]) => void;
  addTermToMetaSets: any;
  genomeConfig: { genome: { getName: () => string } };
  addedTrackSets: Set<string>;
  onHubUpdated: any;
  contentColorSetup?: any;
}

const CustomTrackAdder = ({
  addedTracks,
  customTracksPool,
  onTracksAdded,
  addTermToMetaSets,
  genomeConfig,
  addedTrackSets,
  onHubUpdated,
  contentColorSetup,
}: CustomTrackAdderProps) => {
  const [state, setState] = useState<any>({
    type: TRACK_TYPES.Numerical[0],
    url: "",
    name: "",
    urlError: "",
    metadata: { genome: genomeConfig.genome.getName() },
    trackAdded: false,
    selectedTab: "add-remote-track",
    querygenome: "",
    options: null,
    indexUrl: undefined,
  });

  const handleSelect = (key: string) => {
    setState((prevState) => ({ ...prevState, selectedTab: key }));
  };

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
        onHubUpdated([], [newTrack], "custom");
        setState((prevState) => ({
          ...prevState,
          urlError: "",
          trackAdded: true,
        }));
      }
    },
    [state, onTracksAdded, onHubUpdated]
  );

  const getOptions = (value: string) => {
    let options = null;
    try {
      options = JSON5.parse(value);
    } catch (error) {
      // notify.show('Option syntax is not correct, ignored', 'error', 3000);
      console.error(error);
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

  const renderCustomTrackAdder = () => {
    const { type, url, name, metadata, urlError, querygenome, indexUrl } =
      state;
    const primaryGenome = genomeConfig.genome.getName();
    var allGenomes = getSecondaryGenomes(primaryGenome, addedTracks);
    allGenomes.unshift(primaryGenome);
    
    return (
      <form className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">Track type</span>
              <a 
                href={HELP_LINKS.tracks}
                className="text-blue-600 italic hover:underline text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                track format documentation
              </a>
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={type}
              onChange={(e) => setState(prev => ({ ...prev, type: e.target.value }))}
            >
              {renderTypeOptions()}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium">
              Track file URL
            </label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={url}
              onChange={(e) => setState(prev => ({ ...prev, url: e.target.value.trim() }))}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium">
              Track label
            </label>
            <input
              type="text" 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={name}
              onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {TYPES_NEED_INDEX.includes(type.toLowerCase()) && (
            <div>
              <label className="block text-gray-700 font-medium">
                Track index URL <span className="text-gray-500 font-normal">(optional, only need if data and index files are not in same folder)</span>
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={indexUrl}
                onChange={(e) => setState(prev => ({ ...prev, indexUrl: e.target.value.trim() }))}
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-medium">
              Genome
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={metadata.genome}
              onChange={(e) => setState(prev => ({ 
                ...prev, 
                metadata: { genome: e.target.value }
              }))}
            >
              {renderGenomeOptions(allGenomes)}
            </select>
          </div>

          {urlError && (
            <p className="text-red-500 text-sm">{urlError}</p>
          )}

          <TrackOptionsUI onGetOptions={getOptions} />
        </div>

        <div className="flex gap-4">
          {state.trackAdded ? (
            <>
              <button 
                disabled
                className="px-4 py-2 bg-green-500 text-white rounded-md opacity-50 cursor-not-allowed"
              >
                Success
              </button>
              <button
                className="text-blue-600 hover:underline"
                onClick={() => setState(prev => ({ ...prev, trackAdded: false }))}
              >
                Add another track
              </button>
            </>
          ) : (
            <button
              className="px-4 py-2 bg-tint text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={handleSubmitClick}
            >
              Submit
            </button>
          )}
        </div>
      </form>
    );
  };

  const renderCustomHubAdder = () => (
    <CustomHubAdder
      onTracksAdded={(tracks) => onTracksAdded!(tracks)}
      onHubUpdated={onHubUpdated}
    />
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-medium mb-4 bg-white py-2">Add Remote Track</h2>
        <div className="bg-white rounded-lg pb-6">
          {renderCustomTrackAdder()}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-medium mb-4 bg-white py-2">Add Remote Data Hub</h2>
        <div className="bg-white rounded-lg pb-6">
          {renderCustomHubAdder()}
        </div>
      </div>

      {customTracksPool.length > 0 && (
        <div>
          <h2 className="text-xl font-medium mb-4 bg-white py-2">Added Custom Tracks</h2>
          <div className="bg-white rounded-lg shadow-sm">
            <FacetTable
              tracks={customTracksPool}
              addedTracks={addedTracks}
              onTracksAdded={onTracksAdded}
              addedTrackSets={addedTrackSets}
              addTermToMetaSets={addTermToMetaSets}
              contentColorSetup={contentColorSetup}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTrackAdder;
