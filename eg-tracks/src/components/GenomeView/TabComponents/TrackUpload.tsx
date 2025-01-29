import React, { Component, CSSProperties } from "react";
import PropTypes from "prop-types";
import JSON5 from "json5";
import TrackModel from "@eg/core/src/eg-lib/models/TrackModel";
import { readFileAsText, HELP_LINKS } from "@eg/core/src/eg-lib/models/util";
import TrackOptionsUI from "./TrackOptionsUI";

export const TYPES_DESC = {
  bigWig: "numerical data",
  bedGraph: "numerical data, processed by tabix in .gz format",
  methylC: "methylation data, processed by tabix in .gz format",
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

const ONE_TRACK_FILE_LIST = [
  "bigwig",
  "bigbed",
  "hic",
  "biginteract",
  "g3d",
  "dynseq",
  "rgbpeak",
];

interface TrackUploadProps {
  onTracksAdded: any;
}

interface TrackUploadState {
  fileType: string;
  selectedTab: string;
  indexSuffix: string;
  msg: string;
  options: any;
  assembly?: string;
}

export class TrackUpload extends Component<TrackUploadProps, TrackUploadState> {
  constructor(props: TrackUploadProps) {
    super(props);
    this.state = {
      fileType: "bigWig",
      selectedTab: "add-local-track",
      indexSuffix: ".tbi",
      msg: "",
      options: null,
    };
  }

  handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const fileType = event.target.value;
    const indexSuffix = fileType === "bam" ? ".bai" : ".tbi";
    this.setState({ fileType, indexSuffix });
  };

  handleAssemblyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ assembly: event.target.value });
  };

  handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ msg: "Uploading track..." });
    let tracks;
    const { options } = this.state;
    const fileList: Array<any> = Array.from(event.target.files as any);
    const { indexSuffix } = this.state;

    if (ONE_TRACK_FILE_LIST.includes(this.state.fileType.toLowerCase())) {
      tracks = fileList.map(
        (file: any) =>
          new TrackModel({
            type: this.state.fileType,
            url: null,
            fileObj: file,
            name: file.name,
            label: file.name,
            files: null,
            options,
            metadata: { genome: this.state.assembly },
          })
      );
    } else {
      if (fileList.length !== 2) {
        console.error(
          "Aborting, please select exactly 2 files: the track file and the index file"
        );
        return null;
      }
      if (
        fileList[0].name.replace(indexSuffix, "") !==
        fileList[1].name.replace(indexSuffix, "")
      ) {
        console.error("Aborting, track file does not match index file");
        return null;
      }

      tracks = [
        new TrackModel({
          type: this.state.fileType,
          url: null,
          fileObj: fileList[0],
          name: fileList[0].name,
          label: fileList[0].name,
          files: fileList,
          options,
        }),
      ];
    }

    this.props.onTracksAdded(tracks);
    this.setState({ msg: "Track added." });
  };

  handleHubUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ msg: "Uploading hub..." });
    const tracks: TrackModel[] = [];
    const fileList: any = Array.from(event.target.files as any);
    const hubFile = fileList.find((f: any) => f.name === "hub.config.json");

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
      this.props.onTracksAdded(tracks);
    } else {
      console.error(
        "No local tracks could be found, please check your files and configuration"
      );
      return null;
    }

    this.setState({ msg: "Hub uploaded." });
  };

  getOptions = (value: string) => {
    try {
      const options = JSON5.parse(value);
      this.setState({ options });
    } catch {
      // Option syntax is not correct, ignored
    }
  };

  render() {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-1 bg-white py-2">
            Add Local Track
          </h2>
          <div>
            <label>
              <h3>1. Choose track file type:</h3>
              <select
                value={this.state.fileType}
                onChange={this.handleTypeChange}
              >
                <optgroup label="select only the track file (can select many of same type)">
                  <option value="bigWig">bigWig - {TYPES_DESC.bigWig}</option>
                  <option value="bigBed">bigBed - {TYPES_DESC.bigBed}</option>
                  <option value="rgbpeak">
                    RgbPeak - {TYPES_DESC.rgbpeak}
                  </option>
                  <option value="hic">HiC - {TYPES_DESC.hic}</option>
                  <option value="bigInteract">
                    bigInteract - {TYPES_DESC.bigInteract}
                  </option>
                  <option value="dynseq">dynseq - {TYPES_DESC.dynseq}</option>
                  <option value="g3d">G3D - {TYPES_DESC.g3d}</option>
                </optgroup>
                <optgroup label="select both the track file and index file (only select 1 pair)">
                  <option value="bedGraph">
                    bedGraph - {TYPES_DESC.bedGraph}
                  </option>
                  <option value="methylC">
                    methylC - {TYPES_DESC.methylC}
                  </option>
                  <option value="modbed">modbed - {TYPES_DESC.modbed}</option>
                  <option value="categorical">
                    categorical - {TYPES_DESC.categorical}
                  </option>
                  <option value="bed">bed - {TYPES_DESC.bed}</option>
                  <option value="vcf">vcf - {TYPES_DESC.vcf}</option>
                  <option value="refBed">refBed - {TYPES_DESC.refBed}</option>
                  <option value="longrange">
                    longrange - {TYPES_DESC.longrange}
                  </option>
                  <option value="longrangecolor">
                    longrange - {TYPES_DESC.longrangecolor}
                  </option>
                  <option value="qbed">qBED - {TYPES_DESC.qBED}</option>
                  <option value="bam">BAM - {TYPES_DESC.bam}</option>
                </optgroup>
              </select>
            </label>
            <br />
            <TrackOptionsUI onGetOptions={this.getOptions} />
            <label htmlFor="Assembly">
              <h3>2. Choose assembly:</h3>
              <input
                value={this.state.assembly}
                onChange={this.handleAssemblyChange}
              />
            </label>
            <br />
            <label htmlFor="trackFile">
              <h3>3. Choose track file:</h3>
              <input
                type="file"
                id="trackFile"
                multiple
                onChange={this.handleFileUpload}
              />
            </label>
          </div>
        </div>

        <hr className="border-gray-200 my-8" />

        <div className="mb-8">
          <h2 className="text-xl font-medium mb-1 bg-white py-2">
            Add Local Hub
          </h2>
          <div>
            <label htmlFor="hubFile">
              <p>
                <strong>Choose a folder</strong> that contains a file named{" "}
                <strong>hub.config.json</strong>: (
                <span>
                  <a
                    href={HELP_LINKS.localhub}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    local hub documentation
                  </a>
                </span>
                )
              </p>
              <input type="file" id="hubFile" onChange={this.handleHubUpload} />
            </label>
            <br />
            <p className="lead">Or:</p>
            <label htmlFor="hubFile2">
              <p>
                <strong>Choose multiple files</strong> (including{" "}
                <strong>hub.config.json</strong>):
              </p>
              <input
                type="file"
                id="hubFile2"
                multiple
                onChange={this.handleHubUpload}
              />
            </label>
          </div>
        </div>

        <div className="text-danger font-italic">{this.state.msg}</div>
      </div>
    );
  }
}
