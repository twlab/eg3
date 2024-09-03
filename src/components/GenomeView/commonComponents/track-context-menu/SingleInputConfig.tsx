import React, { PureComponent, useEffect, useState } from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import aggregateOptions from "./aggregateOptions";
// import { ITEM_PROP_TYPES } from "./TrackContextMenu";

import "./TrackContextMenu.css";

interface SingleInputConfigProps {
  onOptionSet?: any;
  optionsObjects?: any;
  optionName?: string;
  label: any;
  defaultValue?: any;
  multiValue?: any;
  hasSetButton?: boolean;

  getInputElement: (
    inputValue: any,
    setNewValue: (newValue: any) => void
  ) => JSX.Element;
}

function SingleInputConfig(props: SingleInputConfigProps) {
  const [inputValue, setInputValue] = useState<any>(
    aggregateOptions(
      props.optionsObjects,
      props.optionName,
      props.defaultValue,
      props.multiValue
    )
  );

  useEffect(() => {
    setInputValue(
      aggregateOptions(
        props.optionsObjects,
        props.optionName,
        props.defaultValue,
        props.multiValue
      )
    );
  }, [
    props.optionsObjects,
    props.optionName,
    props.defaultValue,
    props.multiValue,
  ]);

  function handleInputChange(newValue: any) {
    console.log(newValue);
    if (!props.hasSetButton) {
      makeOptionSetRequest(newValue);
    }
    setInputValue(newValue);
  }

  function makeOptionSetRequest(newValue: any) {
    props.onOptionSet(props.optionName, newValue);
  }

  const inputElement =
    props.getInputElement !== undefined
      ? props.getInputElement(inputValue, handleInputChange)
      : "";
  const setButton = props.hasSetButton ? (
    <button onClick={() => makeOptionSetRequest(inputValue)}>Set</button>
  ) : null;

  return (
    <div className="TrackContextMenu-item">
      <label style={{ margin: 0 }}>
        {props.label} {inputElement} {setButton}
      </label>
    </div>
  );
}

export default SingleInputConfig;
