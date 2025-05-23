import StepAccordion from "@/components/ui/step-accordion/StepAccordion";
import React from "react";
import JSON5 from "json5";

import { ITrackModel, HELP_LINKS } from "@eg/tracks";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  selectCurrentSession,
  updateCurrentSession,
} from "@/lib/redux/slices/browserSlice";
import useExpandedNavigationTab from "@/lib/hooks/useExpandedNavigationTab";

enum AddTextTrackStep {
  TRACK_TYPE = "select-track-type",
  TRACK_OPTIONS = "track-options",
  TRACK_FILE = "track-file",
}

interface TextTrackState {
  textType: string;
  msg: string;
  isFileHuge: boolean;
  options?: Record<string, unknown>;
}

const TEXT_TYPE_DESC = {
  bed: {
    label: "bed",
    desc: "text file in BED format, each column is separated by tab",
    example: `chr1	13041	13106	reg1	1	+
chr1	753329	753698	reg2	2	+
chr1	753809	753866	reg3	3	+
chr1	754018	754252	reg4	4	+
chr1	754361	754414	reg5	5	+
chr1	754431	754492	reg6	6	+
chr1	755462	755550	reg7	7	+
chr1	761040	761094	reg8	8	+
chr1	787470	787560	reg9	9	+
chr1	791123	791197	reg10	10	+`,
  },
  bedGraph: {
    label: "bedGraph",
    desc: "text file in bedGraph format, 4 columns bed file, each column is chromosome, start, end and value",
    example: `chr6	52155366	52155379	14
chr6	52155379	52155408	13
chr6	52155408	52155426	12
chr6	52155426	52155433	11
chr6	52155433	52155442	10
chr6	52155442	52155446	9
chr6	52155446	52155472	8
chr6	52155472	52155475	9
chr6	52155475	52155499	8
chr6	52155499	52155501	7`,
  },
  refBed: {
    label: "refBed gene annotation",
    desc: "gene annotation track in refBed format",
    example: `chr1	11868	14409	11868	11868	+	DDX11L1	ENST00000456328.2	pseudo	11868,12612,13220,	12227,12721,14409,	Homo sapiens DEAD/H (Asp-Glu-Ala-Asp/His) box helicase 11 like 1 (DDX11L1), non-coding RNA.
chr1	29553	31097	29553	29553	+	MIR1302-11	ENST00000473358.1	nonCoding	29553,30563,30975,	30039,30667,31097,	
chr1	30266	31109	30266	30266	+	MIR1302-11	ENST00000469289.1	nonCoding	30266,30975,	30667,31109,`,
  },
  longrange: {
    label: "long-range text",
    desc: "the long-range interaction in text format",
    example: `chr1    713605  715737  chr1:720589-722848,2
chr1    717172  720090  chr1:761197-762811,2
chr1    720589  722848  chr1:713605-715737,2
chr1    755977  758438  chr1:758539-760203,2`,
  },
  "longrange-AndreaGillespie": {
    label: "long-range format by CHiCANE",
    desc: "a long-range interaction format by CHiCANE",
    example: `"id"	"trans"	"b2b"	"distance"	"count"	"score"
"chr20:49368733-49369493<->chr20:50528173-50533850"	FALSE	FALSE	1161898.5	309	79.7857303792859
"chr5:1287807-1300847<->CMV:157565-178165"	TRUE	FALSE	NA	51	62.8795109965162`,
  },
  longrangecolor: {
    label: "long-range text with name and color",
    desc: "the long-range interaction in text format with feature name and color",
    example: `chr1        36612957        36628346        chr1:36746973-36748711,10.92        FeatureA        #A7226E  
chr1        36746973        36748711        chr1:36612957-36628346,10.92        FeatureA        #A7226E  
chr1        36612957        36628346        chr1:36748712-36749060,7.1        FeatureA        #A7226E`,
  },
  qbed: {
    label: "qBED",
    desc: "Text file in qBED format, comprising 4-6 columns: chrom, start, end, value; and, optionally, strand and annotation",
    example: `chr1    51441754        51441758        1       -       CTAGAGACTGGC
chr1    51441754        51441758        21      -       CTTTCCTCCCCA
chr1    51982564        51982568        3       +       CGCGATCGCGAC`,
  },
  bedcolor: {
    label: "bed regions with colors",
    desc: "standard bed 3 column format + 4th column as color string, hex or rgb or color name",
    example: `chr7	128535000	128855000	#0a4be5
chr7	128855000	128960000	#26080f
chr7	128855000	129140000	#b9abed`,
  },
};

export default function LocalTextTracks() {
  useExpandedNavigationTab();

  const session = useAppSelector(selectCurrentSession);
  const dispatch = useAppDispatch();

  const [trackState, setTrackState] = React.useState<TextTrackState>({
    textType: "bed",
    msg: "",
    isFileHuge: false,
  });

  const [selectedStep, setSelectedStep] =
    React.useState<AddTextTrackStep | null>(AddTextTrackStep.TRACK_TYPE);

  const handleStepChange = (step: AddTextTrackStep | null) => {
    setSelectedStep(step ?? AddTextTrackStep.TRACK_TYPE);
  };

  const handleTypeChange = (textType: string) => {
    setTrackState((prev) => ({ ...prev, textType }));
  };

  const handleOptionsChange = (value: string) => {
    try {
      const options = JSON5.parse(value);
      setTrackState((prev) => ({ ...prev, options }));
    } catch (error) {
      // Ignore invalid JSON
      setTrackState((prev) => ({ ...prev, options: undefined }));
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    setTrackState((prev) => ({ ...prev, msg: "Uploading track..." }));

    const { textType, isFileHuge, options } = trackState;
    const typedArray = textType.split("-");
    const textConfig = {
      isFileHuge,
      subType: typedArray[1],
    };

    const fileList = Array.from(files);
    const tracks: ITrackModel[] = fileList.map((file) => ({
      type: typedArray[0],
      url: "",
      fileObj: file,
      name: file.name,
      label: file.name,
      isText: true,
      files: [],
      textConfig,
      options: options || {},
      metadata: {},
      id: crypto.randomUUID(),
      isSelected: false,
    }));

    if (session && tracks.length > 0) {
      dispatch(
        updateCurrentSession({
          tracks: [...session.tracks, ...tracks],
        })
      );
    }

    setTrackState((prev) => ({ ...prev, msg: "Track added." }));
  };

  const handleHugeFileToggle = () => {
    setTrackState((prev) => ({ ...prev, isFileHuge: !prev.isFileHuge }));
  };

  return (
    <div className="flex flex-col py-4">
      <div className="mb-4">
        You can upload track data in text file without formatting them to the
        binary format. Check more at{" "}
        <a
          href={HELP_LINKS.textTrack}
          target="_blank"
          rel="noopener noreferrer"
        >
          text tracks
        </a>
        .
      </div>

      <StepAccordion<AddTextTrackStep>
        selectedItem={selectedStep}
        onSelectedItemChange={handleStepChange}
        items={[
          {
            label: "Track Type",
            value: AddTextTrackStep.TRACK_TYPE,
            valuePreview: trackState.textType
              ? TEXT_TYPE_DESC[
                  trackState.textType as keyof typeof TEXT_TYPE_DESC
                ].label
              : undefined,
            component: (
              <SelectTextType
                selectedType={trackState.textType}
                onTypeChange={handleTypeChange}
              />
            ),
          },
          {
            label: "Track Options",
            value: AddTextTrackStep.TRACK_OPTIONS,
            valuePreview: trackState.options ? "Configured" : undefined,
            component: (
              <ConfigureTrack
                onOptionsChange={handleOptionsChange}
                onHugeFileToggle={handleHugeFileToggle}
                isFileHuge={trackState.isFileHuge}
              />
            ),
          },
          {
            label: "Track File",
            value: AddTextTrackStep.TRACK_FILE,
            component: <TrackFileUpload onFileChange={handleFileUpload} />,
          },
        ]}
      />

      <div className="text-red-500 italic mt-4">{trackState.msg}</div>
    </div>
  );
}

interface SelectTextTypeProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
}

function SelectTextType({ selectedType, onTypeChange }: SelectTextTypeProps) {
  const currentType =
    TEXT_TYPE_DESC[selectedType as keyof typeof TEXT_TYPE_DESC];

  return (
    <div className="space-y-4 py-4">
      <select
        className="w-full p-2 border rounded"
        value={selectedType}
        onChange={(e) => onTypeChange(e.target.value)}
      >
        {Object.entries(TEXT_TYPE_DESC).map(([key, value]) => (
          <option value={key} key={key}>
            {value.label}
          </option>
        ))}
      </select>

      <div className="mt-4">
        <p>{currentType.desc}</p>
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Example:</h4>
          <pre className="font-mono text-sm bg-[#E8E8E8] p-4 rounded whitespace-pre overflow-x-auto">
            {currentType.example}
          </pre>
        </div>
      </div>
    </div>
  );
}

interface ConfigureTrackProps {
  onOptionsChange: (value: string) => void;
  onHugeFileToggle: () => void;
  isFileHuge: boolean;
}

function ConfigureTrack({
  onOptionsChange,
  onHugeFileToggle,
  isFileHuge,
}: ConfigureTrackProps) {
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

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="hugeCheck"
          checked={isFileHuge}
          onChange={onHugeFileToggle}
          className="rounded"
        />
        <label htmlFor="hugeCheck" className="text-sm">
          Use a Worker thread{" "}
          <span className="text-gray-500">(Check if your file is huge.)</span>
        </label>
      </div>
    </div>
  );
}

interface TrackFileUploadProps {
  onFileChange: (files: FileList | null) => void;
}

function TrackFileUpload({ onFileChange }: TrackFileUploadProps) {
  return (
    <div className="space-y-4 py-4">
      <div>
        <label className="block mb-2">Select Text Files</label>
        <input
          type="file"
          className="w-full p-2 border rounded"
          multiple
          onChange={(e) => onFileChange(e.target.files)}
        />
        <p className="text-sm text-gray-500 mt-2">
          If you choose more than one file, make sure they are of same type.
        </p>
      </div>
    </div>
  );
}
