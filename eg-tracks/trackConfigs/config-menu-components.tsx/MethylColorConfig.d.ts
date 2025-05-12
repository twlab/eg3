import React from "react";
interface MethylColorConfigProps {
    optionsObjects: any;
    onOptionSet: any;
}
export declare class MethylColorConfig extends React.Component<MethylColorConfigProps> {
    static propTypes: {
        optionsObjects: any;
        onOptionSet: any;
    };
    getContextColors(): any;
    handleColorChange(contextName: any, colorPropName: any, newColor: any): void;
    render(): import("react/jsx-runtime").JSX.Element | null;
}
export declare function ReadDepthColorConfig(props: any): import("react/jsx-runtime").JSX.Element;
export default MethylColorConfig;
