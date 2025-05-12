import React from "react";
export declare function Handle({ handle: { id, value, percent }, getHandleProps }: {
    handle: {
        id: any;
        value: any;
        percent: any;
    };
    getHandleProps: any;
}): import("react/jsx-runtime").JSX.Element;
interface SliderConfigProps {
    optionName: string;
    label: string;
    mode: number;
    step: number;
    domain: number[];
    values: number[];
    onUpdate?: (update: number[]) => void;
    onChange?: (values: number[]) => void;
    onOptionSet: (optionName: string, values: number[]) => void;
}
interface SliderConfigState {
    values: number[];
    update: number[];
}
/**
 * A context menu item that renders a slider element for inputting data.
 *
 * @author Arnav Moudgil
 */
declare class SliderConfig extends React.PureComponent<SliderConfigProps, SliderConfigState> {
    static propTypes: {
        optionName: any;
        label: any;
        mode: any;
        step: any;
        domain: any;
        values: any;
    };
    static defaultProps: {
        label: string;
        mode: number;
        step: number;
        domain: number[];
        values: never[];
    };
    constructor(props: any);
    onUpdate: (update: any) => void;
    onChange: (values: any) => void;
    render(): import("react/jsx-runtime").JSX.Element;
}
export default SliderConfig;
