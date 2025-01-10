import React, { useState, useEffect, useContext, ChangeEvent } from "react";
import _ from "lodash";
import RegionSetSelector from "../RegionSetSelector/RegionSetSelector";
import { getTrackConfig } from "../../../../trackConfigs/config-menu-models.tsx/getTrackConfig";
import NavigationContext from "@eg/core/src/eg-lib/models/NavigationContext";
import DisplayedRegionModel from "@eg/core/src/eg-lib/models/DisplayedRegionModel";
import { NUMERRICAL_TRACK_TYPES } from "../../../../trackConfigs/config-menu-components.tsx/TrackContextMenu";
import { HELP_LINKS, pcorr } from "@eg/core/src/eg-lib/models/util";
import ColorPicker from "../../../../trackConfigs/config-menu-components.tsx/ColorPicker";
import Plot from "react-plotly.js";
import trackFetchFunction from "../../../../getRemoteData/fetchTrackData";
import ChromosomeInterval from "@eg/core/src/eg-lib/models/ChromosomeInterval";
import { NumericalFeature } from "@eg/core/src/eg-lib/models/Feature";

interface Props {
  genomeConfig: any;
  tracks: any[];
  sets: any[];
  selectedSet: any;
}

const ScatterPlot: React.FC<Props> = ({ sets, tracks, genomeConfig }) => {
  const [setName, setSetName] = useState("");
  const [trackNameX, setTrackNameX] = useState("");
  const [trackNameY, setTrackNameY] = useState("");
  const [plotMsg, setPlotMsg] = useState("");
  const [data, setData] = useState<any>({});
  const [layout, setLayout] = useState<any>({});
  const [markerColor, setMarkerColor] = useState("blue");
  const [markerSize, setMarkerSize] = useState(12);

  useEffect(() => {
    const debounceChangeMarkerColor = _.debounce(changeMarkerColor, 250);
    const debounceChangeMarkerSize = _.debounce(changeMarkerSize, 250);

    return () => {
      debounceChangeMarkerColor.cancel();
      debounceChangeMarkerSize.cancel();
    };
  }, []);

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
      .filter((item) => NUMERRICAL_TRACK_TYPES.includes(item.type))
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
      .filter((item) => NUMERRICAL_TRACK_TYPES.includes(item.type))
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
        return new NumericalFeature("", newChrInt).withValue(record.score);
      });
    });

    const dataX = dataXall.map((all) => _.meanBy(all, "value"));

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
        return new NumericalFeature("", newChrInt).withValue(record.score);
      });
    });

    const dataY = dataYall.map((all) => _.meanBy(all, "value"));

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
      <label>
        Marker size:{" "}
        <input
          type="number"
          id="markerSize"
          step="1"
          min="1"
          max="100"
          value={markerSize}
          onChange={handleMarkerChangeRequest}
        />
      </label>
    );
  };

  return (
    <div>
      {sets.length === 0 ? (
        <div>
          <p className="alert alert-warning">
            There is no region set yet, please submit a region set below.
          </p>
          <RegionSetSelector genome={genomeConfig} sets={[]} />
        </div>
      ) : (
        <>
          <p className="lead">1. Choose a region set</p>
          <div>{renderRegionList()}</div>
          <p className="lead">
            2. Choose a{" "}
            <a
              href={HELP_LINKS.numerical}
              target="_blank"
              rel="noopener noreferrer"
            >
              numerical track
            </a>{" "}
            for X-axis:
          </p>
          <div>{renderTrackXList()}</div>
          <p className="lead">3. Choose a numerical track for Y-axis:</p>
          <div>{renderTrackYList()}</div>
          <p className="lead">4. Plot configuration:</p>
          <div>
            {renderMarkerColorPicker()}
            {renderMarkerSizeInput()}
          </div>
          <div>
            <button
              onClick={getScatterPlotData}
              className="btn btn-sm btn-success"
            >
              Plot
            </button>{" "}
            {plotMsg}
          </div>
          <div>
            <Plot data={[data]} layout={layout} />
          </div>
        </>
      )}
    </div>
  );
};

export default ScatterPlot;
