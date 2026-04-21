import Button from "@/components/ui/button/Button";
import React from "react";
import JSON5 from "json5";
import { generateUUID } from "wuepgg3-track";
import { ITrackModel, HELP_LINKS } from "wuepgg3-track";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  selectCurrentSession,
  updateCurrentSession,
} from "@/lib/redux/slices/browserSlice";
import useExpandedNavigationTab from "@/lib/hooks/useExpandedNavigationTab";

interface TextTrackState {
  textType: string;
  msg: string;
  isFileHuge: boolean;
  files: FileList | null;
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
    files: null,
  });

  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  const handleTypeChange = (textType: string) => {
    setTrackState((prev) => ({ ...prev, textType }));
  };

  const handleOptionsChange = (value: string) => {
    try {
      const options = JSON5.parse(value);
      setTrackState((prev) => ({ ...prev, options }));
    } catch (error) {
      setTrackState((prev) => ({ ...prev, options: undefined }));
    }
  };

  const handleFileChange = (files: FileList | null) => {
    setTrackState((prev) => ({ ...prev, files }));
  };

  const handleHugeFileToggle = () => {
    setTrackState((prev) => ({ ...prev, isFileHuge: !prev.isFileHuge }));
  };

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (!trackState.files) {
      setTrackState((prev) => ({ ...prev, msg: "Please select files." }));
      return;
    }

    const { textType, isFileHuge, options } = trackState;
    const typedArray = textType.split("-");
    const textConfig = {
      isFileHuge,
      subType: typedArray[1],
    };

    const fileList = Array.from(trackState.files);
    const tracks: ITrackModel[] = fileList.map((file) => ({
      type: typedArray[0],
      url: "",
      fileObj: file,
      name: file.name,
      label: file.name,
      isText: true,
      files: undefined,
      textConfig,
      options: options || {},
      metadata: {},
      id: generateUUID(),
      isSelected: false,
    }));

    if (session && tracks.length > 0) {
      dispatch(
        updateCurrentSession({
          tracks: [...session.tracks, ...tracks],
        })
      );
    }

    setTrackState((prev) => ({ ...prev, msg: "Track added successfully." }));
  };

  const filesComplete = !!trackState.files;
  const canSubmit = filesComplete;

  return (
    <div className="px-4 py-3 flex flex-col gap-4">
      <p className="text-sm text-primary/70 dark:text-dark-primary/70">
        Upload track data as text files without binary formatting.{" "}
        <a
          href={HELP_LINKS.textTrack}
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary underline"
        >
          Learn more
        </a>
      </p>

      {/* 1. Track Type */}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
          Track Type{" "}
          <span className="text-red-400 normal-case font-normal tracking-normal">*</span>
        </p>
        <SelectTextType
          selectedType={trackState.textType}
          onTypeChange={handleTypeChange}
        />
      </div>

      {/* 2. Track File */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
            Track File{" "}
            <span className="text-red-400 normal-case font-normal tracking-normal">*</span>
          </p>
          {submitAttempted && !filesComplete && (
            <span className="text-sm text-red-500">Required</span>
          )}
        </div>
        <TrackFileUpload
          onFileChange={handleFileChange}
          hasError={submitAttempted && !filesComplete}
        />
      </div>

      {/* 3. Options */}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
          Options{" "}
          <span className="normal-case font-normal tracking-normal opacity-50 text-sm">
            optional · JSON
          </span>
        </p>
        <ConfigureTrack
          onOptionsChange={handleOptionsChange}
          onHugeFileToggle={handleHugeFileToggle}
          isFileHuge={trackState.isFileHuge}
        />
      </div>

      {trackState.msg && (
        <p
          className={`text-sm italic ${trackState.msg.toLowerCase().includes("success")
            ? "text-green-600"
            : "text-red-500"
            }`}
        >
          {trackState.msg}
        </p>
      )}

      <Button
        active={canSubmit}
        onClick={handleSubmit}
        style={{ fontSize: "16px" }}
      >
        Add Track
      </Button>
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
    <div className="flex flex-col gap-3">
      <select
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-dark-surface text-primary dark:text-dark-primary text-base focus:outline-none focus:ring-2 focus:ring-secondary"
        value={selectedType}
        onChange={(e) => onTypeChange(e.target.value)}
      >
        {Object.entries(TEXT_TYPE_DESC).map(([key, value]) => (
          <option value={key} key={key}>
            {value.label}
          </option>
        ))}
      </select>

      <p className="text-sm text-primary/70 dark:text-dark-primary/70">{currentType.desc}</p>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-primary/50 dark:text-dark-primary/50 uppercase tracking-wider">
          Example
        </p>
        <pre className="font-mono text-xs bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 p-3 rounded-lg whitespace-pre overflow-x-auto text-primary dark:text-dark-primary">
          {currentType.example}
        </pre>
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
    <div className="flex flex-col gap-3">
      <textarea
        rows={3}
        placeholder='{ "color": "blue", "height": 40 }'
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-dark-surface text-primary dark:text-dark-primary text-base focus:outline-none focus:ring-2 focus:ring-secondary font-mono resize-none"
        onChange={(e) => onOptionsChange(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="hugeCheck"
          checked={isFileHuge}
          onChange={onHugeFileToggle}
          className="rounded"
        />
        <label htmlFor="hugeCheck" className="text-sm text-primary dark:text-dark-primary">
          Use a Worker thread{" "}
          <span className="text-primary/50 dark:text-dark-primary/50">(Check if your file is huge.)</span>
        </label>
      </div>
    </div>
  );
}

interface TrackFileUploadProps {
  onFileChange: (files: FileList | null) => void;
  hasError?: boolean;
}

function TrackFileUpload({ onFileChange, hasError }: TrackFileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => onFileChange(e.target.files)}
      />
      <div
        className={`max-w-md mx-auto w-full border-dashed border-2 rounded-md h-32 flex flex-col items-center justify-center cursor-pointer text-center px-4 ${hasError ? "border-red-400" : "border-gray-400 dark:border-gray-600"
          }`}
        onClick={() => inputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); onFileChange(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
      >
        <p className="text-sm text-primary dark:text-dark-primary">Drag and drop text files here</p>
        <p className="text-sm text-primary/50 dark:text-dark-primary/50">— or —</p>
        <p className="text-sm text-primary dark:text-dark-primary">Click to select files</p>
      </div>
      <p className="text-xs text-primary/50 dark:text-dark-primary/50 mt-1">
        If you choose more than one file, make sure they are of the same type.
      </p>
    </>
  );
}
