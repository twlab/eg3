import Button from "@/components/ui/button/Button";
import StepAccordion from "@/components/ui/step-accordion/StepAccordion";
import TabView from "@/components/ui/tab-view/TabView";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import { updateCurrentSession } from "@/lib/redux/slices/browserSlice";

import React from "react";
import JSON5 from "json5";

import { readFileAsText, TrackModel } from "wuepgg3-track";

export default function LocalTracks() {
  return (
    <TabView
      tabs={[
        {
          label: "Add Local Track",
          value: "add-tracks",
          component: <AddLocalTracks />,
        },
        {
          label: "Add Local Hub",
          value: "add-hub",
          component: <AddLocalHub />,
        },
      ]}
    />
  );
}

// MARK: - Add Local Tracks

enum AddLocalTracksStep {
  TRACK_TYPE = "select-track-type",
  TRACK_FILE = "track-file",
  TRACK_ASSEMBLY = "track-assembly",
  CONFIGURE_TRACK = "configure-track",
}

interface TrackOptions {
  [key: string]: unknown;
}

interface LocalTrackState {
  type: string;
  assembly: string;
  files: FileList | null;
  options?: TrackOptions;
  indexSuffix: string;
  msg: string;
}

const ONE_TRACK_FILE_LIST = [
  "bigwig",
  "bigbed",
  "hic",
  "biginteract",
  "g3d",
  "dynseq",
  "rgbpeak",
]; // all lower case

function AddLocalTracks() {
  const session = useAppSelector(selectCurrentSession);
  const dispatch = useAppDispatch();
  const [trackState, setTrackState] = React.useState<LocalTrackState>({
    type: "bigWig",
    assembly: session?.genomeId ?? "hg19",
    files: null,
    indexSuffix: ".tbi",

    msg: "",
  });

  const [selectedStep, setSelectedStep] =
    React.useState<AddLocalTracksStep | null>(AddLocalTracksStep.TRACK_TYPE);

  const handleStepChange = (step: AddLocalTracksStep | null) => {
    setSelectedStep(step ?? AddLocalTracksStep.TRACK_TYPE);
  };

  const handleTypeChange = (type: string) => {
    const indexSuffix = type.toLowerCase() === "bam" ? ".bai" : ".tbi";
    setTrackState((prev) => ({ ...prev, type, indexSuffix }));
    setSelectedStep(AddLocalTracksStep.TRACK_FILE);
  };

  const handleAssemblyChange = (assembly: string) => {
    setTrackState((prev) => ({ ...prev, assembly }));
    setSelectedStep(AddLocalTracksStep.CONFIGURE_TRACK);
  };

  const handleFileChange = (files: FileList | null) => {
    setTrackState((prev) => ({ ...prev, files }));
    setSelectedStep(AddLocalTracksStep.TRACK_ASSEMBLY);
  };

  const handleOptionsChange = (value: string) => {
    try {
      const options = JSON5.parse(value) as TrackOptions;
      setTrackState((prev) => ({ ...prev, options }));
    } catch (error) {
      // Ignore invalid JSON
      setTrackState((prev) => ({ ...prev, options: undefined }));
    }
  };

  const handleSubmit = () => {
    const { type, files, assembly, options } = trackState;
    let tracks: TrackModel[] = [];
    if (!files) {
      setTrackState((prev) => ({ ...prev, msg: "Please select files" }));
      return;
    }

    const fileList = Array.from(files);
    if (ONE_TRACK_FILE_LIST.includes(trackState.type.toLowerCase())) {
      tracks = fileList.map(
        (file: any) =>
          new TrackModel({
            type: trackState.type,
            url: "",
            fileObj: file,
            name: file.name,
            label: file.name,
            files: undefined,
            options: trackState.options ? trackState.options : {},
            id: crypto.randomUUID(),
            metadata: { genome: trackState.assembly },
          })
      );
    } else {
      let indexSuffix = trackState.indexSuffix;

      // Create a map to store files without suffix as keys and corresponding file objects as values
      const fileMap = new Map();

      fileList.forEach((file) => {
        const nameWithoutSuffix = file.name.replace(indexSuffix, "");

        if (!fileMap.has(nameWithoutSuffix)) {
          // Initialize an array for this name without suffix
          fileMap.set(nameWithoutSuffix, []);
        }

        // Add the current file object to the array
        fileMap.get(nameWithoutSuffix).push(file);
      });
      // Filter the map to keep only entries with more than one file object
      const matchingFiles = Array.from(fileMap.values()).filter(
        (fileArray) => fileArray.length > 1
      );

      if (matchingFiles.length === 0) {
        setTrackState((prev) => ({
          ...prev,
          msg: "Please select both track and index files",
        }));
        return null;
      }

      matchingFiles.map((item) => {
        tracks.push(
          new TrackModel({
            type: trackState.type,
            url: "",
            fileObj: item[0],
            name: item[0].name,
            label: item[0].name,
            files: item,
            id: crypto.randomUUID(),
            options: trackState.options ? trackState.options : {},
          })
        );
      });

      //__________________________________________________________________________

      // if (
      //   fileList[0].name.replace(indexSuffix, "") !==
      //   fileList[1].name.replace(indexSuffix, "")
      // ) {
      //   setTrackState((prev) => ({
      //     ...prev,
      //     msg: "Please select both track and index files",
      //   }));
      //   return null;
      // }

      // tracks = [
      //   new TrackModel({
      //     type: trackState.type,
      //     url: "",
      //     fileObj: fileList[1],
      //     name: fileList[0].name,
      //     label: fileList[0].name,
      //     files: fileList,
      //     id: crypto.randomUUID(),
      //     options: trackState.options ? trackState.options : {},
      //   }),
      // ];
    }

    dispatch(
      updateCurrentSession({
        tracks: [...session!.tracks, ...tracks],
      })
    );
    setTrackState((prev) => ({ ...prev, msg: "Track added successfully" }));
  };

  return (
    <div className="flex flex-col py-4">
      <StepAccordion<AddLocalTracksStep>
        selectedItem={selectedStep}
        onSelectedItemChange={handleStepChange}
        items={[
          {
            label: "Track Type",
            value: AddLocalTracksStep.TRACK_TYPE,
            valuePreview: trackState.type ? `${trackState.type}` : undefined,
            component: (
              <SelectTrackType
                selectedType={trackState.type}
                onTypeChange={handleTypeChange}
              />
            ),
          },
          {
            label: "Track File",
            value: AddLocalTracksStep.TRACK_FILE,
            valuePreview: trackState.files
              ? `${trackState.files.length} file(s)`
              : undefined,
            component: (
              <TrackFileUpload
                type={trackState.type}
                onFileChange={handleFileChange}
              />
            ),
          },
          {
            label: "Assembly",
            value: AddLocalTracksStep.TRACK_ASSEMBLY,
            valuePreview: trackState.assembly
              ? `${trackState.assembly}`
              : undefined,
            component: (
              <TrackAssembly
                assembly={trackState.assembly}
                onAssemblyChange={handleAssemblyChange}
              />
            ),
          },
          {
            label: "Configure Track",
            value: AddLocalTracksStep.CONFIGURE_TRACK,
            valuePreview: trackState.options ? "Configured" : undefined,
            component: <ConfigureTrack onOptionsChange={handleOptionsChange} />,
          },
        ]}
      />
      <div className="text-red-500 italic">{trackState.msg}</div>
      <Button
        active
        style={{
          width: "100%",
          marginTop: "10px",
        }}
        onClick={handleSubmit}
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
        <optgroup label="select only the track file (can select many of same type)">
          <option value="bigWig">bigWig - {TYPES_DESC.bigWig}</option>
          <option value="bigBed">bigBed - {TYPES_DESC.bigBed}</option>
          <option value="rgbpeak">RgbPeak - {TYPES_DESC.rgbpeak}</option>
          <option value="hic">HiC - {TYPES_DESC.hic}</option>
          <option value="bigInteract">
            bigInteract - {TYPES_DESC.bigInteract}
          </option>
          <option value="dynseq">dynseq - {TYPES_DESC.dynseq}</option>
          <option value="g3d">G3D - {TYPES_DESC.g3d}</option>
        </optgroup>
        <optgroup label="select both the track file and index file (only select 1 pair)">
          <option value="bedGraph">bedGraph - {TYPES_DESC.bedGraph}</option>
          <option value="methylC">methylC - {TYPES_DESC.methylC}</option>
          <option value="modbed">modbed - {TYPES_DESC.modbed}</option>
          <option value="categorical">
            categorical - {TYPES_DESC.categorical}
          </option>
          <option value="bed">bed - {TYPES_DESC.bed}</option>
          <option value="vcf">vcf - {TYPES_DESC.vcf}</option>
          <option value="refBed">refBed - {TYPES_DESC.refBed}</option>
          <option value="longrange">longrange - {TYPES_DESC.longrange}</option>
          <option value="longrangecolor">
            longrange - {TYPES_DESC.longrangecolor}
          </option>
          <option value="qbed">qBED - {TYPES_DESC.qBED}</option>
          <option value="bam">BAM - {TYPES_DESC.bam}</option>
        </optgroup>
      </select>
    </div>
  );
}

interface TrackFileUploadProps {
  type: string;
  onFileChange: (files: FileList | null) => void;
}

function TrackFileUpload({ type, onFileChange }: TrackFileUploadProps) {
  return (
    <div className="space-y-4 py-4">
      <div>
        <label className="block mb-2">Select Track File(s)</label>
        <input
          type="file"
          className="w-full p-2 border rounded"
          multiple={true}
          onChange={(e) => onFileChange(e.target.files)}
        />
      </div>
    </div>
  );
}

interface TrackAssemblyProps {
  assembly: string;
  onAssemblyChange: (assembly: string) => void;
}

function TrackAssembly({ assembly, onAssemblyChange }: TrackAssemblyProps) {
  return (
    <div className="space-y-4 py-4">
      <div>
        <label className="block mb-2">Assembly</label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={assembly}
          onChange={(e) => onAssemblyChange(e.target.value)}
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

// MARK: - Add Local Hub

function AddLocalHub() {
  const session = useAppSelector(selectCurrentSession);
  const dispatch = useAppDispatch();
  const handleFileChange = async (files: FileList | null | Array<any>) => {
    if (!files) {
      return null;
    }
    let fileList: Array<any> = [];
    let hubFile: any;
    if (files instanceof FileList) {
      const hubFileKey: any = Object.keys(files).find(
        (key) => files[key].name === "hub.config.json"
      );

      if (!hubFileKey) {
        return null;
      }
      hubFile = files[hubFileKey];
      fileList = Object.entries(files).map(([key, value]) => {
        if (key !== "length" && key !== "hub.config.json") {
          return value;
        }
      });
    } else {
      fileList = Array.from(files as any);
      hubFile = fileList.find((f: any) => f.name === "hub.config.json");
    }

    const tracks: TrackModel[] = [];

    if (!hubFile) {
      console.error("Aborting, cannot find `hub.config.json` file");
      return null;
    }

    const idxFiles: any = fileList.filter(
      (f: any) => f.name.endsWith(".tbi") || f.name.endsWith(".bai")
    );
    const idxHash: Record<string, File> = {};
    const fileHash: Record<string, File> = {};

    idxFiles.forEach((item) => {
      idxHash[item.name] = item;
    });

    for (const file of fileList) {
      const fileName = file.name;
      if (
        fileName.startsWith(".") ||
        fileName.endsWith(".tbi") ||
        fileName.endsWith(".bai") ||
        fileName === "hub.config.json"
      ) {
        continue;
      }
      fileHash[fileName] = file;
    }

    const hubContent: any = await readFileAsText(hubFile);
    const json = JSON5.parse(hubContent);

    for (const item of json) {
      if (fileHash.hasOwnProperty(item.filename)) {
        const trackType = item.type.toLowerCase();
        const indexSuffix = trackType === "bam" ? ".bai" : ".tbi";
        const files = ONE_TRACK_FILE_LIST.includes(trackType)
          ? null
          : [fileHash[item.filename], idxHash[item.filename + indexSuffix]];
        const track = new TrackModel({
          type: trackType,
          url: null,
          fileObj: fileHash[item.filename],
          name: item.name || item.filename,
          label: item.label || item.name || item.filename,
          files: files || undefined,
          options: item.options || {},
          metadata: item.metadata || {},
        });
        tracks.push(track);
      } else {
        console.warn(
          `Skipping ${item.filename} not found in 'hub.config.json'`
        );
      }
    }

    if (tracks.length > 0) {
      dispatch(
        updateCurrentSession({
          tracks: [...session!.tracks, ...tracks],
        })
      );
    } else {
      console.error(
        "No local tracks could be found, please check your files and configuration"
      );
      return null;
    }

    //_________________________________________________________________________________________________________________
  };

  return (
    <div className="space-y-8 py-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Choose a folder containing hub.config.json:
        </h3>

        <input
          type="file"
          className="w-full p-2 border rounded"
          // @ts-ignore webkitdirectory is a valid attribute but not in TypeScript's types
          webkitdirectory="true"
          onChange={(e) => handleFileChange(e.target.files)}
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Or choose multiple files (including hub.config.json):
        </h3>
        <input
          type="file"
          className="w-full p-2 border rounded"
          multiple
          onChange={(e) => handleFileChange(e.target.files)}
        />
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
  modbed: "read modification for methylation etc.",
};
