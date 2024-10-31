import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Manager, Reference, Popper } from "react-popper";
import { SketchPicker } from "react-color";
import parseColor from "parse-color";

import OutsideClickDetector from "../../components/GenomeView/commonComponents/OutsideClickDetector";
import { getContrastingColor } from "../../models/util";

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
  label?: string; // Predefined color palette
  onChange: (color: any) => void;
  disableAlpha?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  label,
  onChange,
  disableAlpha = true, // Set default here
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const openPicker = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePicker = useCallback(() => {
    setIsOpen(false);
  }, []);

  const parsedColor = parseColor(color);
  const openerStyle = {
    ...PICKER_OPENER_STYLE,
    backgroundColor: color,
    color: getContrastingColor(color),
  };

  return (
    <Manager>
      <Reference>
        {({ ref }) => (
          <span ref={ref} style={openerStyle} onClick={openPicker}>
            {label || parsedColor.keyword.hex}
          </span>
        )}
      </Reference>
      <Popper placement="bottom" modifiers={[{ name: "flip", enabled: false }]}>
        {({ ref, style, placement, arrowProps }) => (
          <div ref={ref} style={{ zIndex: 2 }}>
            {isOpen && (
              <OutsideClickDetector onOutsideClick={closePicker}>
                <SketchPicker
                  color={color}
                  onChangeComplete={onChange}
                  disableAlpha={disableAlpha}
                />
              </OutsideClickDetector>
            )}
          </div>
        )}
      </Popper>
    </Manager>
  );
};

export default ColorPicker;
