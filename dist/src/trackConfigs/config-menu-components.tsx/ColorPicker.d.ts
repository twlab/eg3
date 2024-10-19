import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
interface ColorPickerProps {
    color: any;
    label: any;
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
declare class ColorPicker extends React.PureComponent<ColorPickerProps, MyState> {
    static propTypes: {
        color: PropTypes.Validator<any>;
        label: PropTypes.Requireable<string>;
        /**
         * Called when the user picks a color.  See http://casesandberg.github.io/react-color/#api-onChange
         */
        onChange: PropTypes.Requireable<(...args: any[]) => any>;
        disableAlpha: PropTypes.Requireable<boolean>;
    };
    static defaultProps: {
        disableAlpha: boolean;
    };
    constructor(props: any);
    /**
     * Opens the picker UI.
     */
    openPicker(): void;
    /**
     * Closes the picker UI.
     */
    closePicker(): void;
    /**
     * @inheritdoc
     */
    render(): import("react/jsx-runtime").JSX.Element;
}
export default ColorPicker;
