import PropTypes from "prop-types";
import _ from "lodash";

import "./TrackContextMenu.css";
export const NUMERRICAL_TRACK_TYPES = ["bigwig", "bedgraph"]; // the front UI we allow any case of types, in TrackModel only lower case
/**
 * Props that menu items will recieve.
 */
export const ITEM_PROP_TYPES = {
  /**
   * Track option objects to configure.
   */
  optionsObjects: PropTypes.arrayOf(PropTypes.object).isRequired,

  /**
   * Callback for when an option is set.  Signature (optionName: string, value: any): void
   *     `optionName` - key of options objects to set
   *     `value` - new value for the option
   */
  onOptionSet: PropTypes.func.isRequired,
};

/**
 * Context menu specialized for managing track options and metadata.
 *
 * @author Silas Hsu
 */
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
      onClick={() => props.onClick(props.numTracks)}
      className="TrackContextMenu-item TrackContextMenu-hoverable-item-danger"
    >
      {/* eslint-disable-next-line jsx-a11y/accessible-emoji */}❌{" "}
      {props.numTracks >= 0 ? "Remove" : `Remove ${props.numTracks} tracks`}
    </div>
  );
}
