import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import { ColorConfig } from "./ColorConfig";
import ColorPicker from "./ColorPicker";

import "./MethylColorConfig.css";

const OPTION_NAME = "colorsForContext";
const COLOR_PROP_NAMES = ["color", "background"];
interface MethylColorConfigProps {
  optionsObjects: any;
  onOptionSet: any;
}
export class MethylColorConfig extends React.Component<MethylColorConfigProps> {
  static propTypes = {
    optionsObjects: PropTypes.arrayOf(PropTypes.object).isRequired,
    onOptionSet: PropTypes.func.isRequired,
  };

  getContextColors() {
    if (this.props.optionsObjects.length === 1) {
      // Only return something if there is one track.
      const options = this.props.optionsObjects[0];
      return options ? options[OPTION_NAME] : null;
    } else {
      return null;
    }
  }

  handleColorChange(contextName, colorPropName, newColor) {
    const contextColors = this.getContextColors();
    const onOptionSet = this.props.onOptionSet;
    if (contextColors && onOptionSet) {
      const newColors = _.cloneDeep(contextColors);
      newColors[contextName][colorPropName] = newColor;
      onOptionSet(OPTION_NAME, newColors);
    }
  }

  render() {
    // Will only return something if there is one and only one track selected
    const contextColors = this.getContextColors();
    if (!contextColors) {
      return null;
    }

    let configs: Array<any> = [];
    for (let contextName in contextColors) {
      const config = contextColors[contextName];
      const colorPickers = COLOR_PROP_NAMES.map((colorPropName) => (
        <div>
          <ColorPicker
            key={colorPropName}
            color={config[colorPropName]}
            onChange={(newColor) =>
              this.handleColorChange(contextName, colorPropName, newColor.hex)
            }
          />
        </div>
      ));

      configs.push(
        <React.Fragment key={contextName}>
          {contextName}
          {colorPickers}
        </React.Fragment>
      );
    }
    return (
      <div className="TrackContextMenu-item">
        <div className="MethylColorConfig-table">
          <span className="MethylColorConfig-header">Context</span>
          <span className="MethylColorConfig-header">Color</span>
          <span className="MethylColorConfig-header">Background</span>
          {configs}
        </div>
        <i>Add other contexts by specifying them in a data hub.</i>
      </div>
    );
  }
}

export function ReadDepthColorConfig(props) {
  return (
    <ColorConfig
      {...props}
      optionName="depthColor"
      label="Read depth line color"
    />
  );
}

export default MethylColorConfig;
