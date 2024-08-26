import React, { PureComponent, useEffect, useState } from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import aggregateOptions from "./aggregateOptions";
// import { ITEM_PROP_TYPES } from "./TrackContextMenu";
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

import "./TrackContextMenu.css";

interface SingleInputConfigProps {
  onOptionSet: any;
  optionsObjects: any;
  optionName: string;
  label: string;
  defaultValue?: any;
  multiValue?: any;
  hasSetButton?: boolean;
  getInputElement: (
    inputValue: any,
    setNewValue: (newValue: any) => void
  ) => JSX.Element;
}

function SingleInputConfig({
  optionsObjects,
  optionName,
  defaultValue = "",
  multiValue = "[multiple values]",
  hasSetButton,
  label,
  getInputElement,
  onOptionSet,
}: SingleInputConfigProps) {
  const [inputValue, setInputValue] = useState<any>(
    aggregateOptions(optionsObjects, optionName, defaultValue, multiValue)
  );

  useEffect(() => {
    setInputValue(
      aggregateOptions(optionsObjects, optionName, defaultValue, multiValue)
    );
  }, [optionsObjects, optionName, defaultValue, multiValue]);

  function handleInputChange(newValue: any) {
    if (!hasSetButton) {
      makeOptionSetRequest(newValue);
    }
    setInputValue(newValue);
  }

  function makeOptionSetRequest(newValue: any) {
    onOptionSet(optionName, newValue);
  }

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
}

export default SingleInputConfig;
