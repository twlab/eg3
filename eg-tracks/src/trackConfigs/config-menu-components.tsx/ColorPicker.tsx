import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Manager, Reference, Popper } from "react-popper";
import { SketchPicker } from "react-color";
import parseColor from "parse-color";

import OutsideClickDetector from "../../components/GenomeView/TrackComponents/commonComponents/OutsideClickDetector";
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
  anchorPosition?: { left: number; top: number; pageX?: number; pageY?: number };
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  label,
  onChange,
  disableAlpha = true, // Set default here
  anchorPosition,
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
            {label || parsedColor.hex}
          </span>
        )}
      </Reference>
      {anchorPosition ? (
        // If anchorPosition provided, render the picker as a fixed-position popup
        isOpen && (
          (() => {
            const winW = typeof window !== "undefined" ? window.innerWidth : 1024;
            const calcLeft = Math.max(
              8,
              Math.min(anchorPosition.left + 120, winW - 220),
            );
            return (
              <div style={{ position: "fixed", left: calcLeft, top: anchorPosition.top + 8, transform: "translateY(-100%)", zIndex: 9999 }}>
                <OutsideClickDetector onOutsideClick={closePicker}>
                  <SketchPicker color={color} onChangeComplete={onChange} disableAlpha={disableAlpha} />
                </OutsideClickDetector>
              </div>
            );
          })()
        )
      ) : (
        <Popper placement="bottom" modifiers={[{ name: "flip", enabled: false }]}>
          {({ ref, style, placement, arrowProps }) => (
            <div ref={ref} style={{ zIndex: 2 }}>
              {isOpen && (
                <OutsideClickDetector onOutsideClick={closePicker}>
                  <SketchPicker color={color} onChangeComplete={onChange} disableAlpha={disableAlpha} />
                </OutsideClickDetector>
              )}
            </div>
          )}
        </Popper>
      )}
    </Manager>
  );
};

export default ColorPicker;
