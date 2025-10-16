import { useState } from "react";
import RootLayout from "./RootLayout";
import App from "@/App";

interface TracksProps {
  url?: string;
  name?: string;
  options?: { [key: string]: any };
  type: string;
  showOnHubLoad?: boolean;
  metadata?: { [key: string]: any };
}

export default function RootLayoutTest() {
  // Input values (what user is typing)
  const [viewRegionInput, setViewRegionInput] = useState<string>(
    "chr7:27053397-27373765"
  );

  // Applied values (what gets passed to RootLayout)
  const [viewRegion, setViewRegion] = useState<string | null | undefined>(
    "chr7:27053397-27373765"
  );
  const [genomeName, setGenomeName] = useState<string>("hg19");
  const [showGenomeNavigator, setShowGenomeNavigator] = useState<boolean>(true);
  const [showNavBar, setShowNavBar] = useState<boolean>(true);
  const [showToolBar, setShowToolBar] = useState<boolean>(true);

  // Define track sets
  const trackSet1: TracksProps[] = [
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
  ];

  const trackSet2: TracksProps[] = [
    {
      type: "bed",
      name: "mm10 bed",
      url: "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz",
    },
    {
      type: "dynseq",
      name: "example dynseq",
      url: "https://target.wustl.edu/dli/tmp/deeplift.example.bw",
      options: {
        color: "blue",
        height: 100,
      },
    },
    {
      type: "methylc",
      name: "H1",
      url: "https://vizhub.wustl.edu/public/hg19/methylc2/h1.liftedtohg19.gz",
      options: {
        label: "Methylation",
        colorsForContext: {
          CG: { color: "#648bd8", background: "#d9d9d9" },
          CHG: { color: "#ff944d", background: "#ffe0cc" },
          CHH: { color: "#ff00ff", background: "#ffe5ff" },
        },
        depthColor: "#01E9FE",
      },
    },
  ];

  const [selectedTrackSet, setSelectedTrackSet] = useState<string>("trackSet1");
  const [tracks, setTracks] = useState<TracksProps[]>(trackSet1);

  // Handle track set change
  const handleTrackSetChange = (value: string) => {
    setSelectedTrackSet(value);
    if (value === "trackSet1") {
      setTracks(trackSet1);
    } else if (value === "trackSet2") {
      setTracks(trackSet2);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Control Panel - Above */}
      <div
        style={{
          width: "100%",
          padding: "16px 20px",
          backgroundColor: "#f5f5f5",
          borderBottom: "2px solid #ddd",
          maxHeight: "25vh",
          overflowY: "auto",
          fontFamily: "sans-serif",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            fontSize: "16px",
            marginBottom: "12px",
            textAlign: "center",
          }}
        >
          🧪 RootLayout Test Controls
        </h2>

        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* View Region */}
          <div style={{ flex: "0 1 250px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "4px",
                fontSize: "12px",
              }}
            >
              View Region:
            </label>
            <div style={{ display: "flex", gap: "4px" }}>
              <input
                type="text"
                value={viewRegionInput}
                onChange={(e) => setViewRegionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setViewRegion(viewRegionInput);
                  }
                }}
                style={{
                  flex: 1,
                  padding: "6px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  fontSize: "11px",
                }}
                placeholder="chr7:27053397-27373765"
              />
              <button
                onClick={() => setViewRegion(viewRegionInput)}
                title="Apply this view region"
                style={{
                  padding: "6px 10px",
                  fontSize: "11px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                ✓
              </button>
              <button
                onClick={() => {
                  setViewRegion(null);
                  setViewRegionInput("");
                }}
                title="Set to null"
                style={{
                  padding: "6px 8px",
                  fontSize: "11px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Genome Name */}
          <div style={{ flex: "0 1 150px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "4px",
                fontSize: "12px",
              }}
            >
              Genome:
            </label>
            <select
              value={genomeName}
              onChange={(e) => setGenomeName(e.target.value)}
              style={{
                width: "100%",
                padding: "6px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "11px",
              }}
            >
              <option value="hg19">hg19</option>
              <option value="hg38">hg38</option>
              <option value="mm10">mm10</option>
              <option value="dm6">dm6</option>
            </select>
          </div>

          {/* Track Set Selector */}
          <div style={{ flex: "0 1 150px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "4px",
                fontSize: "12px",
              }}
            >
              Track Set:
            </label>
            <select
              value={selectedTrackSet}
              onChange={(e) => handleTrackSetChange(e.target.value)}
              style={{
                width: "100%",
                padding: "6px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "11px",
              }}
            >
              <option value="trackSet1">Track Set 1 (HIC/BAM)</option>
              <option value="trackSet2">Track Set 2 (BED/MethylC)</option>
            </select>
          </div>

          {/* Visibility Controls - Horizontal */}
          <div
            style={{
              flex: "1 1 auto",
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Show Genome Navigator */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 10px",
                backgroundColor: showGenomeNavigator ? "#d4edda" : "#f8d7da",
                borderRadius: "4px",
                border: `2px solid ${
                  showGenomeNavigator ? "#28a745" : "#dc3545"
                }`,
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              <input
                type="checkbox"
                checked={showGenomeNavigator}
                onChange={(e) => setShowGenomeNavigator(e.target.checked)}
                style={{
                  marginRight: "6px",
                  cursor: "pointer",
                }}
              />
              Navigator
            </label>

            {/* Show NavBar */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 10px",
                backgroundColor: showNavBar ? "#d4edda" : "#f8d7da",
                borderRadius: "4px",
                border: `2px solid ${showNavBar ? "#28a745" : "#dc3545"}`,
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              <input
                type="checkbox"
                checked={showNavBar}
                onChange={(e) => setShowNavBar(e.target.checked)}
                style={{
                  marginRight: "6px",
                  cursor: "pointer",
                }}
              />
              NavBar
            </label>

            {/* Show ToolBar */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 10px",
                backgroundColor: showToolBar ? "#d4edda" : "#f8d7da",
                borderRadius: "4px",
                border: `2px solid ${showToolBar ? "#28a745" : "#dc3545"}`,
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              <input
                type="checkbox"
                checked={showToolBar}
                onChange={(e) => setShowToolBar(e.target.checked)}
                style={{
                  marginRight: "6px",
                  cursor: "pointer",
                }}
              />
              ToolBar
            </label>
          </div>

          {/* Quick Actions */}
          <div style={{ flex: "0 1 auto", display: "flex", gap: "6px" }}>
            <button
              onClick={() => {
                setShowGenomeNavigator(false);
                setShowNavBar(false);
                setShowToolBar(false);
              }}
              style={{
                padding: "6px 12px",
                fontSize: "11px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Hide All
            </button>

            <button
              onClick={() => {
                setShowGenomeNavigator(true);
                setShowNavBar(true);
                setShowToolBar(true);
              }}
              style={{
                padding: "6px 12px",
                fontSize: "11px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Show All
            </button>

            <button
              onClick={() => {
                setShowGenomeNavigator(!showGenomeNavigator);
                setShowNavBar(!showNavBar);
                setShowToolBar(!showToolBar);
              }}
              style={{
                padding: "6px 12px",
                fontSize: "11px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Toggle
            </button>
          </div>
        </div>
      </div>

      {/* RootLayout Display */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <App
          viewRegion={viewRegion}
          genomeName={genomeName}
          tracks={tracks}
          showGenomeNavigator={showGenomeNavigator}
          showNavBar={showNavBar}
          showToolBar={showToolBar}
        />
      </div>
    </div>
  );
}
