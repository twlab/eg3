import _ from "lodash";
import Collapsible from "./Collapsible";
import "./TrackContextMenu.css";
import { CopyToClip } from "../../components/GenomeView/TrackComponents/commonComponents/CopyToClipboard";
import React from "react";
import { variableIsObject } from "../../models/util";
export const NUMERRICAL_TRACK_TYPES = ["bigwig", "bedgraph"]; // the front UI we allow any case of types, in TrackModel only lower case
export const ITEM_PROP_TYPES = {};

export function MenuTitle(props) {
  const text =
    props.title !== undefined
      ? props.title
      : `${props.numTracks} tracks selected`;
  return <div style={{ paddingLeft: 5, fontWeight: "bold" }}>{text}</div>;
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
