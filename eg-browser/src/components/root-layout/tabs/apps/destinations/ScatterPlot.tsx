import React, { useState, useEffect, ChangeEvent, useMemo } from "react";
import _ from "lodash";
import {
  HELP_LINKS,
  pcorr,
  ColorPicker,
  trackFetchFunction,
  ChromosomeInterval,
  NumericalFeature,
  RegionSet,
  GenomeSerializer,
} from "wuepgg3-track";

// React-Plotly
import Plot from "react-plotly.js";

import Button from "@/components/ui/button/Button";

// Local Imports
import RegionSetSelector from "./region-set/RegionSetSelector";
import { NUMERICAL_TRACK_TYPES } from "./GenePlot";

// Custom Hooks
import useCurrentGenome from "@/lib/hooks/useCurrentGenome";
import useExpandedNavigationTab from "../../../../../lib/hooks/useExpandedNavigationTab";

// Redux
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import { useAppSelector } from "@/lib/redux/hooks";

const ScatterPlot: React.FC = () => {
  useExpandedNavigationTab();
  const [setName, setSetName] = useState("");
  const [trackIdX, setTrackIdX] = useState("");
  const [trackIdY, setTrackIdY] = useState("");
  const [plotMsg, setPlotMsg] = useState("");
  const [data, setData] = useState<any>({});
  const [layout, setLayout] = useState<any>({});
  const [markerColor, setMarkerColor] = useState("blue");
  const [markerSize, setMarkerSize] = useState(12);
  const [showModal, setShowModal] = useState(true);

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
      <select
        value={setName}
        onChange={handleSetChange}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-dark-surface text-primary dark:text-dark-primary text-base focus:outline-none focus:ring-2 focus:ring-secondary"
      >
        <option value="">-- Select region set --</option>
        {setList}
      </select>
    );
  };

  const renderTrackXList = () => {
    const trackList = tracks
      .filter((item) =>
        NUMERICAL_TRACK_TYPES.includes(item.type ? item.type : ""),
      )
      .map((item, index) => (
        <option key={item.id ?? index} value={item.id}>
          {item.label
            ? item.label
            : item.options && item.options.label
              ? item.options.label
              : item.name
                ? item.name
                : "track position " + index}
        </option>
      ));
    return (
      <select
        value={trackIdX}
        onChange={handleTrackXChange}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-dark-surface text-primary dark:text-dark-primary text-base focus:outline-none focus:ring-2 focus:ring-secondary"
      >
        <option value="">-- Select track --</option>
        {trackList}
      </select>
    );
  };

  const renderTrackYList = () => {
    const trackList = tracks
      .filter((item) =>
        NUMERICAL_TRACK_TYPES.includes(item.type ? item.type : ""),
      )
      .map((item, index) => (
        <option key={item.id ?? index} value={item.id}>
          {item.label
            ? item.label
            : item.options && item.options.label
              ? item.options.label
              : item.name
                ? item.name
                : "track position " + index}
        </option>
      ));
    return (
      <select
        value={trackIdY}
        onChange={handleTrackYChange}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-dark-surface text-primary dark:text-dark-primary text-base focus:outline-none focus:ring-2 focus:ring-secondary"
      >
        <option value="">-- Select track --</option>
        {trackList}
      </select>
    );
  };

  const getScatterPlotData = async () => {
    if (!setName && !trackIdX && !trackIdY) {
      setPlotMsg("Please select a region set and both tracks before plotting.");
      return;
    }
    if (!setName) {
      setPlotMsg("Please select a region set before plotting.");
      return;
    }
    if (!trackIdX || !trackIdY) {
      setPlotMsg("Please select both X and Y tracks before plotting.");
      return;
    }
    setPlotMsg("Loading...");

    const trackX = getTrackById(trackIdX);
    const trackY = getTrackById(trackIdY);
    if (!trackX || !trackY) {
      setPlotMsg("Track not found. Please re-select your tracks.");
      return;
    }

    const set = getSetByName(setName);
    const flankedFeatures = set!.features.map((feature) =>
      set!.flankingStrategy.makeFlankedFeature(feature, set!.genome),
    );

    const rawDataX = await Promise.all(
      flankedFeatures.map((item, index) =>
        trackFetchFunction[trackX.type]({
          nav: [
            {
              chr: item.locus.chr,
              start: item.locus.start,
              end: item.locus.end,
            },
          ],
          trackModel: trackX,
        }),
      ),
    );
    let dataXall = rawDataX.map((item, index) => {
      return item.map((record) => {
        let newChrInt = new ChromosomeInterval(
          record.chr,
          record.start,
          record.end,
        );
        return new NumericalFeature("", newChrInt).withValue(
          record.score ? record.score : record["3"],
        );
      });
    });

    const dataX = dataXall.map((all: any) =>
      _.meanBy(all, (item) => Number(item.value)),
    );

    const rawDataY = await Promise.all(
      flankedFeatures.map((item, index) =>
        trackFetchFunction[trackY.type]({
          nav: [
            {
              chr: item.locus.chr,
              start: item.locus.start,
              end: item.locus.end,
            },
          ],
          trackModel: trackY,
        }),
      ),
    );

    let dataYall = rawDataY.map((item, index) => {
      return item.map((record) => {
        let newChrInt = new ChromosomeInterval(
          record.chr,
          record.start,
          record.end,
        );
        return new NumericalFeature("", newChrInt).withValue(
          record.score ? record.score : record["3"],
        );
      });
    });

    const dataY = dataYall.map((all: any) =>
      _.meanBy(all, (item) => Number(item.value)),
    );
    const featureNames = flankedFeatures.map((feature) => feature.getName());
    const pcor = pcorr(dataX, dataY);

    const labelX =
      trackX.label || trackX.options?.label || trackX.name || trackIdX;
    const labelY =
      trackY.label || trackY.options?.label || trackY.name || trackIdY;

    const newLayout = {
      width: 900,
      height: 600,
      xaxis: {
        title: {
          text: labelX,
          font: {
            family: "Helvetica, Courier New, monospace",
            size: 12,
            color: trackX.options ? trackX.options.color : "blue",
          },
        },
      },
      yaxis: {
        title: {
          text: labelY,
          font: {
            family: "Helvetica, Courier New, monospace",
            size: 12,
            color: trackY.options ? trackY.options.color : "blue",
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

  const getTrackById = (id: string) => {
    return tracks.find((track) => track.id === id);
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
    setTrackIdX(event.target.value);
  };

  const handleTrackYChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setTrackIdY(event.target.value);
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
      <label className="flex items-center gap-2 text-base text-primary dark:text-dark-primary">
        Marker size:
        <input
          type="number"
          id="markerSize"
          step="1"
          min="1"
          max="100"
          value={markerSize}
          onChange={handleMarkerChangeRequest}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-dark-surface text-primary dark:text-dark-primary text-base focus:outline-none w-16"
        />
      </label>
    );
  };
  return (
    <div className="flex flex-col">
      {currentSession && sets && sets.length === 0 ? (
        <>
          <p className="text-base text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mx-4 mt-4 mb-2">
            There is no region set yet, please submit a region set below.
          </p>
          <RegionSetSelector />
        </>
      ) : currentSession && showModal ? (
        <>
          <div className="px-4 py-4 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
                1. Region Set
              </p>
              {renderRegionList()}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
                2.{" "}
                <a
                  href={HELP_LINKS.numerical}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline underline-offset-2 normal-case font-normal"
                >
                  Numerical Track
                </a>{" "}
                (X-axis)
              </p>
              {renderTrackXList()}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
                3. Numerical Track (Y-axis)
              </p>
              {renderTrackYList()}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
                4. Plot Configuration
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                {renderMarkerColorPicker()}
                {renderMarkerSizeInput()}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={getScatterPlotData}>Plot</Button>
              {plotMsg && (
                <span
                  className={`text-base ${plotMsg === "Loading..."
                      ? "text-primary dark:text-dark-primary"
                      : "text-red-600 dark:text-red-400"
                    }`}
                >
                  {plotMsg}
                </span>
              )}
            </div>
          </div>
          <div style={{ marginLeft: "-150px" }}>
            <Plot data={[data]} layout={layout} />
          </div>
        </>
      ) : (
        ""
      )}
    </div>
  );
};

export default ScatterPlot;
