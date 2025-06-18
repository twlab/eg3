import { useState } from "react";
import GenomeViewer from "../../components"; // Adjust the import path as needed
const buttonStyle = {
  margin: "8px",
  padding: "8px 16px",
  border: "2px solid #007bff",
  borderRadius: "4px",
  background: "#f8f9fa",
  cursor: "pointer",
};

export default function GenomeViewerTest() {
  const [viewRegion, setViewRegion] = useState("chr7:27053397-27373765");
  const [dataSources, setDataSource] = useState([
    { url: "https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig" },
  ]);
  const [zoom, setZoom] = useState<undefined | number>(undefined);
  const [type, setType] = useState("bigwig");
  const [genomeName, setGenomeName] = useState("hg19");

  return (
    <div>
      <button
        style={buttonStyle}
        onClick={() =>
          setViewRegion((prev) =>
            prev === "chr7:27053397-27373765"
              ? "chr2:5000-8000"
              : "chr7:27053397-27373765"
          )
        }
      >
        Change viewRegion
      </button>
      <button
        style={buttonStyle}
        onClick={() =>
          setDataSource([
            {
              url: "https://vizhub.wustl.edu/public/tmp/TW551_20-5-bonemarrow_MRE.CpG.bigWig",
            },
          ])
        }
      >
        Change dataSource
      </button>
      <button style={buttonStyle} onClick={() => setZoom(1)}>
        Change zoom
      </button>
      <button
        style={buttonStyle}
        onClick={() =>
          setType((prev) => (prev === "linear" ? "circular" : "linear"))
        }
      >
        Change type
      </button>
      <button
        style={buttonStyle}
        onClick={() =>
          setGenomeName((prev) => (prev === "hg19" ? "mm10" : "hg19"))
        }
      >
        Change genomeName
      </button>
      <GenomeViewer
        viewRegion={viewRegion}
        dataSources={dataSources}
        zoom={zoom}
        type={type}
        genomeName={genomeName}
      />
    </div>
  );
}
