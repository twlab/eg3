import { default as PropTypes } from 'prop-types';
export declare const NUMERRICAL_TRACK_TYPES: string[];
/**
 * Props that menu items will recieve.
 */
export declare const ITEM_PROP_TYPES: {
    /**
     * Track option objects to configure.
     */
    optionsObjects: PropTypes.Validator<(object | null | undefined)[]>;
    /**
     * Callback for when an option is set.  Signature (optionName: string, value: any): void
     *     `optionName` - key of options objects to set
     *     `value` - new value for the option
     */
    onOptionSet: PropTypes.Validator<(...args: any[]) => any>;
};
export declare function MenuTitle(props: any): import("react/jsx-runtime").JSX.Element;
export declare function RemoveOption(props: any): import("react/jsx-runtime").JSX.Element;
