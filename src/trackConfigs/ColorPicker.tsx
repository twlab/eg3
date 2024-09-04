import React from "react";
import PropTypes from "prop-types";
import { Manager, Reference, Popper } from "react-popper";
import { SketchPicker } from "react-color";
import parseColor from "parse-color";

import OutsideClickDetector from "../components/GenomeView/commonComponents/OutsideClickDetector";
import { getContrastingColor } from "../models/util";

const PICKER_OPENER_STYLE = {
  border: "1px solid grey",
  borderRadius: "0.3em",
  margin: "0.25em",
  padding: "0 5px",
  minWidth: 50,
  minHeight: "1em",
};
interface ColorPickerProps {
  color: any;
  label: any; // Predefined color palette
  onChange: (color: any) => void;
  disableAlpha: any;
}
/**
 * A color picker.
 *
 * @author Silas Hsu
 */

interface MyState {
  isOpen?: boolean;
}

class ColorPicker extends React.PureComponent<ColorPickerProps, MyState> {
  static propTypes = {
    color: PropTypes.any.isRequired, // The color for the picker to display
    label: PropTypes.string, // Label of the picker opener.  If not provided, then displays the color's hex value.

    /**
     * Called when the user picks a color.  See http://casesandberg.github.io/react-color/#api-onChange
     */
    onChange: PropTypes.func,
    disableAlpha: PropTypes.bool,
  };

  static defaultProps = {
    disableAlpha: true,
  };

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    };
    this.openPicker = this.openPicker.bind(this);
    this.closePicker = this.closePicker.bind(this);
  }

  /**
   * Opens the picker UI.
   */
  openPicker() {
    this.setState({ isOpen: true });
  }

  /**
   * Closes the picker UI.
   */
  closePicker() {
    this.setState({ isOpen: false });
  }

  /**
   * @inheritdoc
   */
  render() {
    const { color, label, onChange, disableAlpha } = this.props;

    const parsedColor = parseColor(color);
    let openerStyle = {
      backgroundColor: color,
      color: getContrastingColor(color),
    };
    Object.assign(openerStyle, PICKER_OPENER_STYLE);

    let pickerElement;
    if (this.state.isOpen) {
      pickerElement = (
        <OutsideClickDetector onOutsideClick={this.closePicker}>
          <SketchPicker
            color={color}
            onChangeComplete={onChange}
            disableAlpha={disableAlpha}
          />
        </OutsideClickDetector>
      );
    } else {
      pickerElement = null;
    }

    return (
      <Manager>
        <Reference>
          {({ ref }) => (
            <span ref={ref} style={openerStyle} onClick={this.openPicker}>
              {label || parsedColor.keyword.hex}
            </span>
          )}
        </Reference>
        <Popper
          placement="bottom"
          modifiers={[{ name: "flip", enabled: false }]}
        >
          {({ ref, style, placement, arrowProps }) => (
            <div ref={ref} style={{ zIndex: 2 }}>
              {pickerElement}
            </div>
          )}
        </Popper>
      </Manager>
    );
  }
}

export default ColorPicker;
