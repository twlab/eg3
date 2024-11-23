import React, { useState, useEffect } from "react";
import _ from "lodash";
// import RegionSetSelector from "../RegionSetSelector";
import { getTrackConfig } from "@/trackConfigs/config-menu-models.tsx/getTrackConfig";
import NavigationContext from "@/models/NavigationContext";
import DisplayedRegionModel from "@/models/DisplayedRegionModel";
import { NUMERRICAL_TRACK_TYPES } from "@/trackConfigs/config-menu-components.tsx/TrackContextMenu";
import { COLORS } from "../../TrackComponents/commonComponents/MetadataIndicator";
import { HELP_LINKS } from "@/models/util";
import ColorPicker from "@/trackConfigs/config-menu-components.tsx/ColorPicker";
import Plot from "react-plotly.js";
import RegionSetSelector from "../RegionSetSelector/RegionSetSelector";
import trackFetchFunction from "@/getRemoteData/fetchTrackData";
import ChromosomeInterval from "@/models/ChromosomeInterval";
import { NumericalFeature } from "@/models/Feature";

interface StateProps {
  genome: any;
  tracks: any[];
  sets: any[];
  selectedSet: any;
  onSetSelected: any;
  onSetsChanged: any;
}

type GeneplotProps = StateProps;

const PLOT_TYPE_DESC = {
  box: "All genes and genomic intervals are tiled together, genes are always from 5' to 3' end, relative to their strands. Track data of each gene are summarized into fixed length vectors, and median value over each data point is plotted.",
  line: "One line is plotted for each gene or item, genes are always from 5' to 3', relative to their strands. Track data of each gene and item are summarized into equal length vectors.",
  heatmap:
    "Each row is plotted for each gene or item, genes are always from 5' to 3', relative to their strands. Track data of each gene and item are summarized into equal length vectors.",
};

const Geneplot: React.FC<GeneplotProps> = ({
  tracks,
  sets,
  genome,
  selectedSet,
  onSetSelected,
  onSetsChanged,
}) => {
  const [setName, setSetName] = useState("");
  const [trackName, setTrackName] = useState("");
  const [plotType, setPlotType] = useState("box");
  const [plotMsg, setPlotMsg] = useState("");
  const [dataPoints, setDataPoints] = useState(50);
  const [data, setData] = useState<{ [key: string]: any }>({});
  const [showlegend, setShowLegend] = useState(false);
  const [boxColor, setBoxColor] = useState("rgb(214,12,140)");

  useEffect(() => {
    const debouncedChangeBoxColor = _.debounce(changeBoxColor, 250);
    return () => {
      debouncedChangeBoxColor.cancel();
    };
  }, [boxColor]);

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

  const renderTrackList = () => {
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
        <select value={trackName} onChange={handleTrackChange}>
          <option key={0} value="">
            --
          </option>
          {trackList}
        </select>
      </label>
    );
  };

  const renderPlotTypes = () => {
    return (
      <label>
        Pick your plot type:{" "}
        <select value={plotType} onChange={handlePlotTypeChange}>
          <option value="box">box</option>
          <option value="line">line</option>
          <option value="heatmap">heatmap</option>
        </select>
      </label>
    );
  };

  const renderDataPoints = () => {
    return (
      <label>
        data points:{" "}
        <select value={dataPoints} onChange={handleDataPointsChange}>
          <option value="50">50</option>
          <option value="60">60</option>
          <option value="70">70</option>
          <option value="80">80</option>
          <option value="90">90</option>
          <option value="100">100</option>
        </select>
      </label>
    );
  };

  const getPlotData = async () => {
    const track = getTrackByName(trackName);

    const trackConfig = getTrackConfig(track);

    const set = getSetByName(setName);
    const flankedFeatures = set.features.map((feature) =>
      set.flankingStrategy.makeFlankedFeature(feature, set.genome)
    );

    const rawData = await Promise.all(
      flankedFeatures.map((item, index) =>
        trackFetchFunction[trackConfig.trackModel.type]({
          nav: [
            {
              chr: item.locus.chr,
              start: item.locus.start,
              end: item.locus.end,
            },
          ],
          trackModel: track,
        })
      )
    );

    let data = rawData.map((item, index) => {
      return item.map((record) => {
        let newChrInt = new ChromosomeInterval(
          record.chr,
          record.start,
          record.end
        );
        return new NumericalFeature("", newChrInt).withValue(record.score);
      });
    });

    // const data = rawData.map((raw) => trackConfig.formatData(raw));
    const binned = flankedFeatures.map((feature, idx) => {
      const step = Math.round(
        (feature.locus.end - feature.locus.start) / dataPoints
      );
      const lefts = _.range(
        feature.locus.start,
        feature.locus.end - step / 2,
        step
      );
      const rights = [
        ...lefts.slice(0, -1).map((x) => x + step),
        feature.locus.end,
      ];
      const bins = _.unzip([lefts, rights]);
      return groupDataToBins(data[idx], bins, rights);
    });

    const adjusted = binned.map((d, i) =>
      flankedFeatures[i].getIsForwardStrand() ? d.slice() : _.reverse(d.slice())
    );
    const featureNames = flankedFeatures.map((feature) => feature.getName());
    const plotData = _.zip(...adjusted);
    const boxData = plotData.map((d, i) => ({
      y: d,
      type: "box",
      name: `${i + 1}`,
      marker: {
        color: boxColor,
      },
    }));
    const lineData = adjusted.map((d, i) => ({
      type: "scatter",
      x: _.range(1, d.length + 1),
      y: d,
      mode: "lines",
      name: featureNames[i],
      line: {
        dash: "solid",
        width: 2,
        color: COLORS[i],
      },
    }));
    const heatmapData = [
      {
        z: adjusted,
        x: _.range(1, adjusted[0].length + 1),
        y: featureNames,
        type: "heatmap",
      },
    ];

    setData({
      box: boxData,
      line: lineData,
      heatmap: heatmapData,
    });
    setPlotMsg("");
  };

  const groupDataToBins = (data, bins, rights) => {
    const indexes = data.map((d) =>
      Math.min(_.sortedIndex(rights, d.locus.end), bins.length - 1)
    );
    let results = Array.from({ length: bins.length }, () => 0);
    data.forEach(
      (d, i) => (results[indexes[i]] += d.locus.getLength() * d.value)
    );
    return results.map((d, i) => d / (bins[i][1] - bins[i][0]));
  };

  const getTrackByName = (name) => {
    return tracks.find((track) => track.name === name);
  };

  const getSetByName = (name) => {
    return sets.find((set) => set.name === name);
  };

  const handleSetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSetName(event.target.value);
  };

  const handleTrackChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTrackName(event.target.value);
  };

  const handlePlotTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setPlotType(event.target.value);
    setShowLegend(event.target.value === "line");
  };

  const handleDataPointsChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setDataPoints(Number.parseInt(event.target.value));
  };

  const changeBoxColor = (color) => {
    const boxData = data.box.map((d) => ({
      ...d,
      marker: { color: color.hex },
    }));
    setData({ ...data, box: boxData });
    setBoxColor(color.hex);
  };

  const renderBoxColorPicker = () => {
    return (
      <ColorPicker
        color={boxColor}
        label="box color"
        onChange={changeBoxColor}
      />
    );
  };

  if (sets.length === 0) {
    return (
      <div>
        <p className="alert alert-warning">
          There is no region set yet, please submit a region set below.
        </p>
        <RegionSetSelector
          genome={genome}
          sets={sets}
          selectedSet={selectedSet}
          onSetSelected={onSetSelected}
          onSetsChanged={onSetsChanged}
        />
      </div>
    );
  }
  const layout = {
    width: 900,
    height: 600,
    showlegend,
    margin: {
      l: 180,
    },
  };
  const config = {
    toImageButtonOptions: {
      format: "svg",
      filename: "gene_plot",
      height: 600,
      width: 900,
      scale: 1,
    },
    displaylogo: false,
    responsive: true,
    modeBarButtonsToRemove: ["select2d", "lasso2d", "toggleSpikelines"],
  };

  return (
    <div>
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
        </a>
        :
      </p>
      <div>{renderTrackList()}</div>
      <p className="lead">3. Choose a plot type:</p>
      <div>
        {renderPlotTypes()} {renderDataPoints()}{" "}
        {plotType === "box" && renderBoxColorPicker()}
      </div>
      <div className="font-italic">{PLOT_TYPE_DESC[plotType]}</div>
      <div>
        <button onClick={getPlotData} className="btn btn-sm btn-success">
          Plot
        </button>{" "}
        {plotMsg}
      </div>
      <div>
        <Plot data={data[plotType]} layout={layout} config={config} />
      </div>
    </div>
  );
};

export default Geneplot;
