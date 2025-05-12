import React from "react";
interface ColorPickerProps {
    onUpdateLegendColor?: (colorKey: any, colorHex: string) => void;
    colorKey?: any;
    getChangedColor?: (colorHex: string) => void;
    clickDisabled?: boolean;
    fullWidth?: boolean;
    label?: string;
    initColor?: string;
}
declare const ColorPicker: React.FC<ColorPickerProps>;
export default ColorPicker;
