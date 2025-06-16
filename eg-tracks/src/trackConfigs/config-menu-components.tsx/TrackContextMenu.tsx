import _ from "lodash";
import Collapsible from "./Collapsible";
import "./TrackContextMenu.css";
import { CopyToClip } from "../../components/GenomeView/TrackComponents/commonComponents/CopyToClipboard";
import React from "react";
import { niceCount, variableIsObject } from "../../models/util";
import SelectConfig from "./SelectConfig";
import { getTrackConfig } from "../config-menu-models.tsx/getTrackConfig";
export const NUMERRICAL_TRACK_TYPES = ["bigwig", "bedgraph"]; // the front UI we allow any case of types, in TrackModel only lower case

export function MenuTitle(props) {
  const text =
    props.title !== undefined
      ? props.title
      : `${props.numTracks} tracks selected`;
  return <div style={{ paddingLeft: 5, fontWeight: "bold" }}>{text}</div>;
}
export function MatplotMenu(props) {
  const numTracks = props.tracks.length;
  if (numTracks === 1) {
    return null;
  }
  const trackTypes = props.tracks.map((tk) => tk.type);
  if (trackTypes.some((type) => !NUMERRICAL_TRACK_TYPES.includes(type))) {
    return null;
  }
  return (
    <div className="TrackContextMenu-item">
      <button
        className="btn btn-info btn-sm btn-tight"
        onClick={() => props.onApplyMatplot(props.tracks, "matplot")}
      >
        Apply matplot
      </button>
    </div>
  );
}
export function RemoveOption(props) {
  return (
    <div
      onClick={() => props.onClick(props.trackId)}
      className="TrackContextMenu-item TrackContextMenu-hoverable-item-danger"
    >
      {/* eslint-disable-next-line jsx-a11y/accessible-emoji */}❌{" "}
      {props.numTracks > 1 ? `Remove ${props.numTracks} tracks` : "Remove"}
    </div>
  );
}

export function HicBinSizeNormOptionConfig(props) {
  const { tracks, fileInfos, onOptionSet } = props;
  const trackConfigs = tracks.map(getTrackConfig);
  const optionsObjects = trackConfigs.map((config) => config.getOptions());
  const isHicTracks = trackConfigs.map((config) => config.isHicTrack());
  if (!_.every(isHicTracks, Boolean)) {
    return null;
  }
  const allResolutions: Array<any> = [],
    allNormOptions: Array<any> = [];

  Object.keys(fileInfos).forEach((trackId) => {
    allResolutions.push(fileInfos[trackId].resolutions);
    allNormOptions.push(fileInfos[trackId].normOptions);
  });
  const commonResolutions = _.intersection(...allResolutions);
  const commonNormOptions = _.intersection(...allNormOptions);
  const commonResolutionsObj = { AUTO: 0 },
    commonNormOptionsObj = { NONE: "NONE" };
  commonResolutions.forEach(
    (r) => (commonResolutionsObj[niceCount(r as number)] = r)
  );
  commonNormOptions.forEach((r) => (commonNormOptionsObj[r as string] = r));
  return (
    <>
      <SelectConfig
        optionName="binSize"
        label="Bin size:"
        defaultValue={commonResolutionsObj.AUTO}
        choices={commonResolutionsObj}
        optionsObjects={optionsObjects}
        onOptionSet={onOptionSet}
      />
      <SelectConfig
        optionName="normalization"
        label="Normalization"
        defaultValue={commonNormOptionsObj.NONE}
        choices={commonNormOptionsObj}
        optionsObjects={optionsObjects}
        onOptionSet={onOptionSet}
      />
    </>
  );
}
export function ObjectAsTable(props) {
  const { title, content } = props;
  if (typeof content === "string") {
    return <div>{content}</div>;
  }
  const rows = Object.entries(content).map((values, idx) => {
    let tdContent;
    if (React.isValidElement(values[1])) {
      tdContent = values[1];
    } else if (variableIsObject(values[1])) {
      tdContent = <ObjectAsTable content={values[1]} />;
    } else {
      tdContent = Array.isArray(values[1]) ? values[1].join(" > ") : values[1];
    }
    return (
      <tr key={idx}>
        <td>{values[0]}</td>
        <td>{tdContent}</td>
      </tr>
    );
  });
  const tableTitle = title ? <h6>{title}</h6> : "";
  return (
    <React.Fragment>
      {tableTitle}
      <table className="table table-sm table-striped">
        <tbody>{rows}</tbody>
      </table>
    </React.Fragment>
  );
}
export function TrackMoreInfo(props) {
  const track = props.track;
  let info: Array<any> = [];
  if (track.details) {
    info.push(
      <div key="details">
        <ObjectAsTable title="Details" content={track.details} />
      </div>
    );
  }
  if (track.url) {
    info.push(
      <div key="url">
        <h6>
          URL <CopyToClip value={track.url} />
        </h6>
        <p className="TrackContextMenu-URL">{track.url}</p>
      </div>
    );
  }
  if (track.indexUrl) {
    info.push(
      <div key="indexUrl">
        <h6>
          Index URL <CopyToClip value={track.indexUrl} />
        </h6>
        <p className="TrackContextMenu-URL">{track.indexUrl}</p>
      </div>
    );
  }
  if (track.metadata) {
    info.push(
      <div key="metadata">
        <ObjectAsTable title="Metadata" content={track.metadata} />
      </div>
    );
  }
  return (
    <Collapsible trigger="More information">
      <div className="TrackContextMenu-item">{info}</div>
    </Collapsible>
  );
}
