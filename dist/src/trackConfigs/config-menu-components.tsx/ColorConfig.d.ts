import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
/**
 * A context menu item that configures tracks' colors in general.
 *
 * @author Silas Hsu
 */
interface ColorConfigProps {
    color: any;
    label: string;
    optionName: string;
}
export declare class ColorConfig extends React.PureComponent<ColorConfigProps> {
    static propTypes: {
        optionName: PropTypes.Validator<string>;
        label: PropTypes.Validator<string>;
        defaultValue: PropTypes.Requireable<any>;
        multiValue: PropTypes.Requireable<any>;
        hasSetButton: PropTypes.Requireable<boolean>;
        getInputElement: PropTypes.Requireable<(...args: any[]) => any>;
        optionsObjects: PropTypes.Requireable<any>;
        onOptionSet: PropTypes.Requireable<any>;
    } & {
        optionName: PropTypes.Validator<string>;
        label: PropTypes.Requireable<string>;
    };
    constructor(props: any);
    /**
     * Renders a color picker.  For the shape of the `color` parameter in the onChange handler, see
     * http://casesandberg.github.io/react-color/#api-onChange
     *
     * @param {*} inputValue
     * @param {*} setNewValue
     * @return {JSX.Element}
     */
    renderColorPicker(inputValue: any, setNewValue: any): import("react/jsx-runtime").JSX.Element;
    render(): import("react/jsx-runtime").JSX.Element;
}
/**
 * A menu item that configures `trackModel.options.color`
 *
 * @param {Object} props - object with shape ITEM_PROP_TYPES from TrackContextMenu
 * @return {JSX.Element} element to render
 */
export declare function PrimaryColorConfig(props: any): import("react/jsx-runtime").JSX.Element;
/**
 * A menu item that configures `trackModel.options.color2`
 *
 * @param {Object} props - object with shape ITEM_PROP_TYPES from TrackContextMenu
 * @return {JSX.Element} element to render
 */
export declare function SecondaryColorConfig(props: any): import("react/jsx-runtime").JSX.Element;
/**
 * A menu item that configures `trackModel.options.backgroundColor`
 *
 * @param {Object} props - object with shape ITEM_PROP_TYPES from TrackContextMenu
 * @return {JSX.Element} element to render
 */
export declare function BackgroundColorConfig(props: any): import("react/jsx-runtime").JSX.Element;
/**
 * A menu item that configures `trackModel.options.colorAboveMax`
 *
 * @param {Object} props - object with shape ITEM_PROP_TYPES from TrackContextMenu
 * @return {JSX.Element} element to render
 */
export declare function PrimaryAboveColorConfig(props: any): import("react/jsx-runtime").JSX.Element;
/**
 * A menu item that configures `trackModel.options.color2BelowMin`
 *
 * @param {Object} props - object with shape ITEM_PROP_TYPES from TrackContextMenu
 * @return {JSX.Element} element to render
 */
export declare function SecondaryBelowColorConfig(props: any): import("react/jsx-runtime").JSX.Element;
/**
 * A menu item that configures `trackModel.options.primaryColor`
 *
 * @param {Object} props - object with shape ITEM_PROP_TYPES from TrackContextMenu
 * @return {JSX.Element} element to render
 */
export declare function primaryGenomeColorConfig(props: any): import("react/jsx-runtime").JSX.Element;
/**
 * A menu item that configures `trackModel.options.queryColor`
 *
 * @param {Object} props - object with shape ITEM_PROP_TYPES from TrackContextMenu
 * @return {JSX.Element} element to render
 */
export declare function queryGenomeColorConfig(props: any): import("react/jsx-runtime").JSX.Element;
/**
 * A menu item that configures `trackModel.options.highValueColor`
 *
 * @param {Object} props - object with shape ITEM_PROP_TYPES from TrackContextMenu
 * @return {JSX.Element} element to render
 */
export declare function highValueColorConfig(props: any): import("react/jsx-runtime").JSX.Element;
/**
 * A menu item that configures `trackModel.options.lowValueColor`
 *
 * @param {Object} props - object with shape ITEM_PROP_TYPES from TrackContextMenu
 * @return {JSX.Element} element to render
 */
export declare function lowValueColorConfig(props: any): import("react/jsx-runtime").JSX.Element;
/**
 * A menu item that configures `trackModel.options.boxColor`
 *
 * @param {Object} props - object with shape ITEM_PROP_TYPES from TrackContextMenu
 * @return {JSX.Element} element to render
 */
export declare function BoxColorConfig(props: any): import("react/jsx-runtime").JSX.Element;
/**
 * A menu item that configures `trackModel.options.lineColor`
 *
 * @param {Object} props - object with shape ITEM_PROP_TYPES from TrackContextMenu
 * @return {JSX.Element} element to render
 */
export declare function LineColorConfig(props: any): import("react/jsx-runtime").JSX.Element;
export {};
