import React, { useState, useEffect, ChangeEvent, useMemo } from "react";
import _ from "lodash";
import RegionSetSelector from "./region-set/RegionSetSelector";
import { getTrackConfig } from "@eg/tracks/src/trackConfigs/config-menu-models.tsx/getTrackConfig";

import { HELP_LINKS, pcorr } from "@eg/tracks/src/models/util";
import ColorPicker from "@eg/tracks/src/trackConfigs/config-menu-components.tsx/ColorPicker";
import Plot from "react-plotly.js";
import trackFetchFunction from "@eg/tracks/src/getRemoteData/fetchTrackData";
import ChromosomeInterval from "@eg/tracks/src/models/ChromosomeInterval";
import { NumericalFeature } from "@eg/tracks/src/models/Feature";
import { NUMERICAL_TRACK_TYPES } from "./GenePlot";
import { getGenomeConfig } from "@eg/tracks";
import RegionSet from "@eg/tracks/src/models/RegionSet";
import ReactModal from "react-modal";
import useCurrentGenome from "@/lib/hooks/useCurrentGenome";
import GenomeSerializer from "@eg/tracks/src/genome-hub/GenomeSerializer";
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import { useAppSelector } from "@/lib/redux/hooks";

const ScatterPlot: React.FC = () => {
  const [setName, setSetName] = useState("");
  const [trackNameX, setTrackNameX] = useState("");
  const [trackNameY, setTrackNameY] = useState("");
  const [plotMsg, setPlotMsg] = useState("");
  const [data, setData] = useState<any>({});
  const [layout, setLayout] = useState<any>({});
  const [markerColor, setMarkerColor] = useState("blue");
  const [markerSize, setMarkerSize] = useState(12);
  const [showModal, setShowModal] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const currentSession = useAppSelector(selectCurrentSession);
  const _genomeConfig = useCurrentGenome();
  const genomeConfig = _genomeConfig
    ? GenomeSerializer.deserialize(_genomeConfig)
    : null;
  const genome = genomeConfig?.genome || null;
  const tracks = useMemo(() => {
    if (currentSession) {
      return currentSession.tracks;
    } else {
      return [];
    }
  }, [currentSession]);

  const sets = useMemo(() => {
    if (currentSession) {
      return currentSession?.regionSets.map((item) => {
        if (typeof item === "object") {
          const newRegionSet = RegionSet.deserialize(item);
          newRegionSet["genome"] = genome
            ? genome
            : getGenomeConfig(item.genomeName).genome;
          newRegionSet["id"] = item.id;
          return newRegionSet;
        } else {
          return item;
        }
      });
    } else {
      return [];
    }
  }, [currentSession]);
  useEffect(() => {
    const debounceChangeMarkerColor = _.debounce(changeMarkerColor, 250);
    const debounceChangeMarkerSize = _.debounce(changeMarkerSize, 250);

    return () => {
      debounceChangeMarkerColor.cancel();
      debounceChangeMarkerSize.cancel();
    };
  }, []);

  function handleCloseModal() {
    setShowModal(false);
  }
  function handleOpenModal() {
    setShowModal(true);
  }
  const renderRegionList = () => {
    const setList = sets.map((item, index) => (
      <option key={index} value={item.name}>
        {item.name}
      </option>
    ));
    return (
      <label>
        Pick your set:{" "}
        <select value={setName} onChange={handleSetChange}>
          <option key={0} value="">
            --
          </option>
          {setList}
        </select>
      </label>
    );
  };

  const renderTrackXList = () => {
    const trackList = tracks
      .filter((item) => NUMERICAL_TRACK_TYPES.includes(item.type))
      .map((item, index) => (
        <option key={index} value={item.name}>
          {item.label}
        </option>
      ));
    return (
      <label>
        Pick your track:{" "}
        <select value={trackNameX} onChange={handleTrackXChange}>
          <option key={0} value="">
            --
          </option>
          {trackList}
        </select>
      </label>
    );
  };

  const renderTrackYList = () => {
    const trackList = tracks
      .filter((item) => NUMERICAL_TRACK_TYPES.includes(item.type))
      .map((item, index) => (
        <option key={index} value={item.name}>
          {item.label}
        </option>
      ));
    return (
      <label>
        Pick your track:{" "}
        <select value={trackNameY} onChange={handleTrackYChange}>
          <option key={0} value="">
            --
          </option>
          {trackList}
        </select>
      </label>
    );
  };

  const getScatterPlotData = async () => {
    if (!setName || !trackNameX || !trackNameY) {
      setPlotMsg("Please choose both a set and 2 tracks");
      return;
    }
    setPlotMsg("Loading...");

    const trackX = getTrackByName(trackNameX);
    const trackY = getTrackByName(trackNameY);
    const trackConfigX = getTrackConfig(trackX);
    const trackConfigY = getTrackConfig(trackY);

    const set = getSetByName(setName);
    const flankedFeatures = set!.features.map((feature) =>
      set!.flankingStrategy.makeFlankedFeature(feature, set!.genome)
    );

    const rawDataX = await Promise.all(
      flankedFeatures.map((item, index) =>
        trackFetchFunction[trackConfigX.trackModel.type]({
          nav: [
            {
              chr: item.locus.chr,
              start: item.locus.start,
              end: item.locus.end,
            },
          ],
          trackModel: trackX,
        })
      )
    );
    let dataXall = rawDataX.map((item, index) => {
      return item.map((record) => {
        let newChrInt = new ChromosomeInterval(
          record.chr,
          record.start,
          record.end
        );
        return new NumericalFeature("", newChrInt).withValue(
          record.score ? record.score : record["3"]
        );
      });
    });

    const dataX = dataXall.map((all: any) =>
      _.meanBy(all, (item) => Number(item.value))
    );

    const rawDataY = await Promise.all(
      flankedFeatures.map((item, index) =>
        trackFetchFunction[trackConfigY.trackModel.type]({
          nav: [
            {
              chr: item.locus.chr,
              start: item.locus.start,
              end: item.locus.end,
            },
          ],
          trackModel: trackY,
        })
      )
    );

    let dataYall = rawDataY.map((item, index) => {
      return item.map((record) => {
        let newChrInt = new ChromosomeInterval(
          record.chr,
          record.start,
          record.end
        );
        return new NumericalFeature("", newChrInt).withValue(
          record.score ? record.score : record["3"]
        );
      });
    });

    const dataY = dataYall.map((all: any) =>
      _.meanBy(all, (item) => Number(item.value))
    );
    const featureNames = flankedFeatures.map((feature) => feature.getName());
    const pcor = pcorr(dataX, dataY);

    const newLayout = {
      width: 900,
      height: 600,
      xaxis: {
        title: {
          text: trackNameX,
          font: {
            family: "Helvetica, Courier New, monospace",
            size: 12,
            color: trackX.options ? trackX.options.color : "blue",
          },
        },
      },
      yaxis: {
        title: {
          text: trackNameY,
          font: {
            family: "Helvetica, Courier New, monospace",
            size: 12,
            color: trackY!.options ? trackY!.options.color : "blue",
          },
        },
      },
      annotations: [
        {
          xref: "paper",
          yref: "paper",
          x: 0.7,
          xanchor: "right",
          y: 1,
          yanchor: "bottom",
          text: `R = ${pcor.toFixed(4)}`,
          showarrow: false,
          font: {
            family: "Helvetica, Courier New, monospace",
            size: 16,
            color: markerColor,
          },
        },
      ],
    };

    setData({
      x: dataX,
      y: dataY,
      mode: "markers",
      type: "scatter",
      name: setName,
      text: featureNames,
      marker: { size: markerSize, color: markerColor },
    });
    setPlotMsg("");
    setLayout(newLayout);
  };

  const getTrackByName = (name: string) => {
    return tracks.find((track) => track.name === name);
  };

  const getSetByName = (name: string) => {
    const curSet = sets.find((set) => set.name === name);
    curSet.genome = genome;
    return sets.find((set) => set.name === name);
  };

  const handleSetChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSetName(event.target.value);
  };

  const handleTrackXChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setTrackNameX(event.target.value);
  };

  const handleTrackYChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setTrackNameY(event.target.value);
  };

  const changeMarkerColor = (color: { hex: string }) => {
    const updatedData = {
      ...data,
      marker: { ...data.marker, color: color.hex },
    };
    setMarkerColor(color.hex);
    setData(updatedData);
  };

  const renderMarkerColorPicker = () => {
    return (
      <ColorPicker
        color={markerColor}
        label="Marker color"
        onChange={changeMarkerColor}
      />
    );
  };

  const changeMarkerSize = (size: number) => {
    const updatedData = { ...data, marker: { ...data.marker, size } };
    setMarkerSize(size);
    setData(updatedData);
  };

  const handleMarkerChangeRequest = (e: ChangeEvent<HTMLInputElement>) => {
    changeMarkerSize(Number.parseInt(e.target.value) || 1);
  };

  const renderMarkerSizeInput = () => {
    return (
      <label style={styles.inputBox}>
        Marker size:
        <input
          type="number"
          id="markerSize"
          step="1"
          min="1"
          max="100"
          value={markerSize}
          onChange={handleMarkerChangeRequest}
          style={styles.input}
        />
      </label>
    );
  };
  const styles = {
    container: {
      color: "#333",

      margin: "0 auto",
      padding: "20px",
      backgroundColor: "#fdfdfd",
      borderRadius: "10px",
      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    },
    inputBox: {
      display: "flex",
      alignItems: "center",
      margin: "10px 0",
    },
    input: {
      border: "1px solid #ccc",
      borderRadius: "4px",
      padding: "5px",
      width: "60px",
    },
    lead: {
      fontSize: "1.25rem",
      marginBottom: "1rem",
    },
    link: {
      color: "#1a73e8",
      textDecoration: "none",
    },
    configContainer: {
      display: "flex",

      alignItems: "center",
      marginBottom: "1rem",
    },
    buttonContainer: {
      display: "flex",
      alignItems: "center",
    },
    button: {
      backgroundColor: "#28a745",
      color: "#fff",
      padding: "1px 10px",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
  };

  return (
    <div>
      {currentSession && sets && sets.length === 0 ? (
        <div>
          <p className="alert alert-warning">
            There is no region set yet, please submit a region set below.
          </p>
          <RegionSetSelector />
        </div>
      ) : currentSession ? (
        <>
          <button
            style={{
              width: "100%",
              marginTop: "10px",
              color: isHovered ? "white" : "black",
              backgroundColor: isHovered ? "#C7D9DD" : "#ADB2D4",
              transition: "all 0.3s ease",
              cursor: "pointer",
              border: "none",
              padding: "10px 20px",
              borderRadius: "20px",
              outline: "none",
              fontSize: "16px",
            }}
            onClick={handleOpenModal}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            Open scatterplot menu
          </button>
          <ReactModal
            isOpen={showModal}
            contentLabel="Gene & Region search"
            ariaHideApp={false}
            onRequestClose={handleCloseModal}
            shouldCloseOnOverlayClick={true}
          >
            {" "}
            <span
              className="text-right"
              style={{
                cursor: "pointer",
                color: "red",
                fontSize: "2em",
                position: "absolute",
                top: "-5px",
                right: "15px",
              }}
              onClick={handleCloseModal}
            >
              ×
            </span>
            <div style={styles.container}>
              <p style={styles.lead}>1. Choose a region set</p>
              <div>{renderRegionList()}</div>

              <p style={styles.lead}>
                2. Choose a{" "}
                <a
                  href={HELP_LINKS.numerical}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                >
                  numerical track
                </a>{" "}
                for X-axis:
              </p>
              <div>{renderTrackXList()}</div>

              <p style={styles.lead}>3. Choose a numerical track for Y-axis:</p>
              <div>{renderTrackYList()}</div>

              <p style={styles.lead}>4. Plot configuration:</p>
              <div style={styles.configContainer}>
                {renderMarkerColorPicker()}
                {renderMarkerSizeInput()}
              </div>

              <div style={styles.buttonContainer}>
                <button onClick={getScatterPlotData} style={styles.button}>
                  Plot
                </button>{" "}
                <span>{plotMsg}</span>
              </div>
            </div>
            <div>
              <Plot data={[data]} layout={layout} />
            </div>
          </ReactModal>
        </>
      ) : (
        ""
      )}
    </div>
  );
};

export default ScatterPlot;
