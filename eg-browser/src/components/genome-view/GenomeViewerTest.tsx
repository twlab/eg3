import { useState } from "react";
import { GenomeViewer } from "wuepgg3-track";
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
  const [tracks, setDataSource] = useState([
    {
      url: "https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig",
      type: "bigwig",
    },
  ]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [zoom, setZoom] = useState<undefined | number>(undefined);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [type, setType] = useState("bigwig");
  const [genomeName, setGenomeName] = useState("hg19");

  return (
    <div>
      <button
        style={buttonStyle}
        onClick={() =>
          setViewRegion((prev) =>
            prev === "chr7:27053397-27373765"
              ? "chr7:27962252-28282620"
              : "chr7:27053397-27373765"
          )
        }
      >
        Change viewRegion
      </button>
      <button
        style={buttonStyle}
        onClick={() =>
          setDataSource((prev) =>
            prev[0].url ===
            "https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig"
              ? [
                  {
                    url: "https://vizhub.wustl.edu/public/tmp/TW551_20-5-bonemarrow_MRE.CpG.bigWig",
                    type: "bigwig",
                  },
                ]
              : [
                  {
                    url: "https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig",
                    type: "bigwig",
                  },
                ]
          )
        }
      >
        Change dataSource
      </button>
      <button
        style={buttonStyle}
        onClick={() => setZoom((prev) => (prev === 1 ? -1 : 1))}
      >
        Change zoom
      </button>
      <button
        style={buttonStyle}
        onClick={() =>
          setType((prev) => (prev === "bigwig" ? "geneannotation" : "bigwig"))
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
      <div style={{ display: "flex", flexDirection: "column" }}>
        <GenomeViewer
          viewRegion={viewRegion}
          tracks={tracks}
          genomeName={genomeName}
        />
        <GenomeViewer
          viewRegion={viewRegion}
          tracks={[
            {
              name: "gencodeV47",
              type: "geneannotation",
            },
          ]}
          genomeName={genomeName}
        />

        <GenomeViewer
          viewRegion="chr7:27181545-27245617"
          tracks={[
            {
              url: "https://egg.wustl.edu/d/hg19/GSM832458.gz",
              name: "lonragetest",
              type: "longrange",
            },
          ]}
          genomeName="hg19"
        />
        <GenomeViewer
          viewRegion="chr7:27181545-27245617"
          tracks={[
            {
              url: "https://vizhub.wustl.edu/hubSample/hg19/bam1.bam",
              name: "bamtest",
              type: "bam",
            },
          ]}
          genomeName="hg19"
        />
        <GenomeViewer
          viewRegion="chr7:27181545-27245617"
          tracks={[
            {
              url: "https://hicfiles.s3.amazonaws.com/hiseq/gm12878/in-situ/combined.hic",
              name: "hictest",
              type: "hic",
            },
            {
              url: "https://vizhub.wustl.edu/hubSample/hg19/bam1.bam",
              name: "bamtest",
              type: "bam",
            },
            {
              name: "gencodeV47",
              type: "geneannotation",
            },
          ]}
          genomeName="hg19"
        />
      </div>
    </div>
  );
}
