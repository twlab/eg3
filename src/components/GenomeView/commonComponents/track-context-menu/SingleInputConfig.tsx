import { useState } from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import aggregateOptions from "./aggregateOptions";
import { ITEM_PROP_TYPES } from "./TrackContextMenu";

import "./TrackContextMenu.css";

const DEBOUNCE_INTERVAL = 250;

const SingleInputConfig = ({
  optionsObjects,
  optionName,
  label,
  defaultValue = "",
  multiValue = "[multiple values]",
  hasSetButton,
  getInputElement,
  onOptionSet,
}) => {
  const [inputValue, setInputValue] = useState(
    aggregateOptions(optionsObjects, optionName, defaultValue, multiValue)
  );

  const handleInputChange = (newValue) => {
    if (!hasSetButton) {
      makeOptionSetRequest(newValue);
    }
    setInputValue(newValue);
  };

  const makeOptionSetRequest = _.debounce((newValue) => {
    onOptionSet(optionName, newValue);
  }, DEBOUNCE_INTERVAL);

  const inputElement = getInputElement(inputValue, handleInputChange);

  const setButton = hasSetButton ? (
    <button onClick={() => makeOptionSetRequest(inputValue)}>Set</button>
  ) : null;

  return (
    <div className="TrackContextMenu-item">
      <label style={{ margin: 0 }}>
        {label} {inputElement} {setButton}
      </label>
    </div>
  );
};

SingleInputConfig.propTypes = {
  ...ITEM_PROP_TYPES,
  optionName: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  defaultValue: PropTypes.any,
  multiValue: PropTypes.any,
  hasSetButton: PropTypes.bool,
  getInputElement: PropTypes.func,
  optionsObjects: PropTypes.any,
  onOptionSet: PropTypes.any,
};

SingleInputConfig.defaultProps = {
  defaultValue: "",
  multiValue: "[multiple values]",
  getInputElement: (inputValue, setNewValue) => (
    <input
      type="text"
      value={inputValue}
      onChange={(event) => setNewValue(event.target.value)}
    />
  ),
};

export default SingleInputConfig;
