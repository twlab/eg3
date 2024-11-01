import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import aggregateOptions from "../config-menu-models.tsx/aggregateOptions";
import { ITEM_PROP_TYPES } from "./TrackContextMenu";
import { v4 as uuidv4 } from "uuid";
import "./TrackContextMenu.css";
interface SingleInputConfigProps {
  // Extend with ItemProps
  optionName: string;
  label: string;
  defaultValue?: any;
  multiValue?: any;
  hasSetButton?: boolean;
  getInputElement?: any;
  optionsObjects?: any;
  onOptionSet?: any;
}
const DEBOUNCE_INTERVAL = 250;

const SingleInputConfig: React.FC<SingleInputConfigProps> = ({
  optionsObjects,
  optionName,
  label,
  defaultValue = "",
  multiValue = "[multiple values]",
  hasSetButton,
  getInputElement,
  onOptionSet,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (newValue: any) => {
    if (!hasSetButton) {
      makeOptionSetRequest(newValue);
    }
    setInputValue(newValue);
  };

  const makeOptionSetRequest = _.debounce((newValue) => {
    if (onOptionSet) {
      onOptionSet(optionName, newValue);
    }
  }, DEBOUNCE_INTERVAL);

  const inputElement = getInputElement ? (
    getInputElement(inputValue, handleInputChange)
  ) : (
    <input
      type="text"
      value={inputValue}
      onChange={(event) => handleInputChange(event.target.value)}
    />
  );

  const setButton = hasSetButton ? (
    <button onClick={() => makeOptionSetRequest(inputValue)}>Set</button>
  ) : null;
  useEffect(() => {
    let init = aggregateOptions(
      optionsObjects,
      optionName,
      defaultValue,
      multiValue
    );

    setInputValue(init);
  }, []);
  return (
    <div className="TrackContextMenu-item">
      <label style={{ margin: 0 }}>
        {label} {inputElement} {setButton}
      </label>
    </div>
  );
};

export default SingleInputConfig;
