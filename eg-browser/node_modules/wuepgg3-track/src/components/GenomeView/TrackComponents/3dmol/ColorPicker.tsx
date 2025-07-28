import React, { useState, useCallback } from "react";
import reactCSS from "reactcss";
import { SketchPicker, ColorResult } from "react-color";
import colorParse from "color-parse";

interface ColorPickerProps {
  onUpdateLegendColor?: (colorKey: any, colorHex: string) => void;
  colorKey?: any;
  getChangedColor?: (colorHex: string) => void;
  clickDisabled?: boolean;
  fullWidth?: boolean;
  label?: string;
  initColor?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  onUpdateLegendColor,
  colorKey,
  getChangedColor,
  clickDisabled = false,
  fullWidth = false,
  label = "",
  initColor = "",
}) => {
  const parsed = colorParse(initColor);
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [color, setColor] = useState({
    r: parsed.values[0] || 0,
    g: parsed.values[1] || 0,
    b: parsed.values[2] || 0,
    a: parsed.alpha || 1,
  });

  const handleClick = useCallback(() => {
    if (!clickDisabled) {
      setDisplayColorPicker((prev) => !prev);
    }
  }, [clickDisabled]);

  const handleClose = useCallback(() => {
    setDisplayColorPicker(false);
  }, []);

  const handleChange = useCallback(
    (colorResult: ColorResult) => {
      setColor(colorResult.rgb);
      if (onUpdateLegendColor) {
        onUpdateLegendColor(colorKey, colorResult.hex);
      }
      if (getChangedColor) {
        getChangedColor(colorResult.hex);
      }
    },
    [colorKey, getChangedColor, onUpdateLegendColor]
  );

  const brightness = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
  const textColor = brightness < 0.5 ? "white" : "black";
  const width = fullWidth ? "unset" : "24px";

  const styles = reactCSS({
    default: {
      color: {
        color: textColor,
        width,
        height: "24px",
        borderRadius: "2px",
        textAlign: "center",
        border: "1px solid black",
        background: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
      },
      swatch: {
        padding: "5px",
        background: "#fff",
        borderRadius: "1px",
        cursor: clickDisabled ? "auto" : "pointer",
      },
      popover: {
        position: "absolute",
        zIndex: 2,
        display: "inline-block",
      },
      cover: {
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    },
  });

  return (
    <div>
      <div style={styles.swatch} onClick={handleClick}>
        <div style={styles.color}>{label}</div>
      </div>
      {displayColorPicker && (
        <div style={styles.popover}>
          <div style={styles.cover} onClick={handleClose} />
          <SketchPicker color={color} onChangeComplete={handleChange} />
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
