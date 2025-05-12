import React from "react";
/**
 * A menu option that configures some integer-based property.
 *
 * @author Silas Hsu
 */
interface NumberConfigProps {
    optionsObjects: any;
    optionName: string;
    label?: any;
    minValue?: number;
    defaultValue?: any;
    isFloat?: boolean;
    step?: number;
    width?: string;
    hasSetButton?: boolean;
    onOptionSet: (optionName: string, value: number) => void;
}
declare class NumberConfig extends React.PureComponent<NumberConfigProps> {
    static propTypes: any;
    static defaultProps: {
        label: string;
        width: string;
    };
    constructor(props: any);
    /**
     * Renders the <input> element.
     *
     * @param {string} inputValue - value of the input
     * @param {function} setNewValue - function to call when input value changes
     * @return {JSX.Element} <input> to render
     */
    renderInputElement(inputValue: any, setNewValue: any): import("react/jsx-runtime").JSX.Element;
    /**
     * Parses the string containing number from the <input> element.
     *
     * @param {string} optionName - track option prop name to modify
     * @param {string} value - string containing number from <input> element
     */
    handleOptionSet(optionName: any, value: any): void;
    render(): import("react/jsx-runtime").JSX.Element;
}
export default NumberConfig;
