import { default as PropTypes } from 'prop-types';
declare const SingleInputConfig: {
    ({ optionsObjects, optionName, label, defaultValue, multiValue, hasSetButton, getInputElement, onOptionSet, }: {
        optionsObjects: any;
        optionName: any;
        label: any;
        defaultValue?: string | undefined;
        multiValue?: string | undefined;
        hasSetButton: any;
        getInputElement?: ((inputValue: any, setNewValue: any) => import("react/jsx-runtime").JSX.Element) | undefined;
        onOptionSet: any;
    }): import("react/jsx-runtime").JSX.Element;
    propTypes: {
        optionName: PropTypes.Validator<string>;
        label: PropTypes.Validator<string>;
        defaultValue: PropTypes.Requireable<any>;
        multiValue: PropTypes.Requireable<any>;
        hasSetButton: PropTypes.Requireable<boolean>;
        getInputElement: PropTypes.Requireable<(...args: any[]) => any>;
        optionsObjects: PropTypes.Requireable<any>;
        onOptionSet: PropTypes.Requireable<any>;
    };
};
export default SingleInputConfig;
