import React, { PureComponent } from "react";
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

interface Option {
  label: string;
  value: string;
}

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

interface SingleInputConfigState {
  inputValue: any;
}

class SingleInputConfig extends PureComponent<
  SingleInputConfigProps,
  SingleInputConfigState
> {
  static defaultProps = {
    defaultValue: "",
    multiValue: "[multiple values]",
  };
  state: { inputValue: any };

  constructor(props: SingleInputConfigProps) {
    super(props);
    const { optionsObjects, optionName, defaultValue, multiValue } = props;
    this.state = {
      inputValue: aggregateOptions(
        optionsObjects,
        optionName,
        defaultValue,
        multiValue
      ),
    };
  }

  componentDidUpdate(prevProps: SingleInputConfigProps) {
    if (this.props.optionsObjects !== prevProps.optionsObjects) {
      const { optionsObjects, optionName, defaultValue, multiValue } =
        this.props;
      this.setState({
        inputValue: aggregateOptions(
          optionsObjects,
          optionName,
          defaultValue,
          multiValue
        ),
      });
    }
  }

  handleInputChange = (newValue: any) => {
    if (!this.props.hasSetButton) {
      this.makeOptionSetRequest(newValue);
    }
    this.setState({ inputValue: newValue });
  };

  makeOptionSetRequest = (newValue: any) => {
    this.props.onOptionSet(this.props.optionName, newValue);
  };

  render() {
    const { label, hasSetButton, getInputElement } = this.props;
    const inputElement = getInputElement(
      this.state.inputValue,
      this.handleInputChange
    );
    const setButton = hasSetButton ? (
      <button onClick={() => this.makeOptionSetRequest(this.state.inputValue)}>
        Set
      </button>
    ) : null;

    return (
      <div
        className="TrackContextMenu-item"
        onClick={(e) => {
          console.log("child");
          e.stopPropagation();
        }}
      >
        <label style={{ margin: 0 }}>
          {label} {inputElement} {setButton}
        </label>
      </div>
    );
  }
}

export default SingleInputConfig;
