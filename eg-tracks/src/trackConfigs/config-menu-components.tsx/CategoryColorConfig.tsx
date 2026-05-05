import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import ColorPicker from "./ColorPicker";

import "./CategoryColorConfig.css";

const OPTION_NAME = "category";
const COLOR_PROP_NAMES = ["color"];
interface CategoricalColorConfigProps {
  optionsObjects: any;
  onOptionSet: any;
  anchorPosition?: {
    left: number;
    top: number;
    pageX?: number;
    pageY?: number;
  };
}
export class CategoryColorConfig extends React.PureComponent<CategoricalColorConfigProps> {
  state = {
    categoryColors: null,
  };

  static propTypes = {
    optionsObjects: PropTypes.arrayOf(PropTypes.object).isRequired,
    onOptionSet: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state.categoryColors = this.getCategoryColors();
  }

  componentDidUpdate(prevProps) {
    // Update local state when props change
    if (prevProps.optionsObjects !== this.props.optionsObjects) {
      this.setState({ categoryColors: this.getCategoryColors() });
    }
  }

  getCategoryColors() {
    if (this.props.optionsObjects.length === 1) {
      // Only return something if there is one track.
      const options = this.props.optionsObjects[0];
      return options ? options[OPTION_NAME] : null;
    } else {
      return null;
    }
  }

  handleColorChange = (categoryName, colorPropName, newColor) => {
    const { categoryColors } = this.state;
    const onOptionSet = this.props.onOptionSet;
    if (categoryColors && onOptionSet) {
      const newColors = _.cloneDeep(categoryColors);
      newColors[categoryName][colorPropName] = newColor;
      // Update local state immediately for visual feedback
      this.setState({ categoryColors: newColors });
      // Notify parent
      onOptionSet(OPTION_NAME, newColors);
    }
  };

  render() {
    // Will only return something if there is one and only one track selected
    const categoryColors = this.state.categoryColors;
    if (!categoryColors) {
      return null;
    }

    let configs: Array<any> = [];
    for (let categoryName in categoryColors) {
      const config = categoryColors[categoryName];
      const colorPickers = COLOR_PROP_NAMES.map((colorPropName) => (
        <div>
          <ColorPicker
            key={`${categoryName}-${colorPropName}`}
            color={config[colorPropName]}
            anchorPosition={this.props.anchorPosition}
            onChange={(color) => {
              this.handleColorChange(categoryName, colorPropName, color.hex);
            }}
          />
        </div>
      ));
      configs.push(
        <React.Fragment key={categoryName}>
          {config.name || categoryName}
          {colorPickers}
        </React.Fragment>,
      );
    }
    return (
      <div className="TrackContextMenu-item">
        <div className="CategoryColorConfig-table">
          <span className="MethylColorConfig-header">Category</span>
          <span className="MethylColorConfig-header">Color</span>
          {configs}
        </div>
        <i>Specify default color for each category in a data hub.</i>
      </div>
    );
  }
}

export default CategoryColorConfig;
