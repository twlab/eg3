import React from "react";
interface ColorPickerProps {
    color: any;
    label?: string;
    onChange: (color: any) => void;
    disableAlpha?: boolean;
}
declare const ColorPicker: React.FC<ColorPickerProps>;
export default ColorPicker;
