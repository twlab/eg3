import React, { useState } from "react";
import PropTypes from "prop-types";
import SingleInputConfig from "./SingleInputConfig";

const UNKNOWN_VALUE = "Wat is this"; // Special value for unknown selection

interface Option {
  label: string;
  value: string;
}

interface SelectConfigProps {
  choices: any;
  defaultValue?: string | number;
  optionName: string;
  optionsObjects: any[]; // You can replace 'any' with a more specific type if needed
  label: string;
  onOptionSet: (optionName: string, value: string | number) => void;
}

const SelectConfig: React.FC<SelectConfigProps> = ({
  choices,
  defaultValue = UNKNOWN_VALUE,
  optionName,
  optionsObjects,
  label,
  onOptionSet = () => undefined,
}) => {
  const renderInputElement = (
    inputValue: string | number,
    setNewValue: (value: string | number) => void
  ) => {
    let optionElements: Array<JSX.Element> = [];
    if (inputValue === UNKNOWN_VALUE) {
      optionElements.push(<option key={UNKNOWN_VALUE} value={UNKNOWN_VALUE} />);
    }
    for (let choiceName in choices) {
      const choiceValue = choices[choiceName];
      optionElements.push(
        <option key={choiceName} value={choiceValue}>
          {choiceName}
        </option>
      );
    }

    return (
      <select
        value={inputValue}
        onChange={(event) => setNewValue(event.target.value)}
      >
        {optionElements}
      </select>
    );
  };

  const handleOptionSet = (optionName: string, newValue: string | number) => {
    if (newValue === UNKNOWN_VALUE) {
      return;
    } else {
      onOptionSet(optionName, newValue);
    }
  };

  return (
    <SingleInputConfig
      defaultValue={defaultValue}
      optionName={optionName}
      optionsObjects={optionsObjects}
      label={label}
      multiValue={UNKNOWN_VALUE}
      onOptionSet={handleOptionSet}
      getInputElement={renderInputElement}
    />
  );
};
export default SelectConfig;
