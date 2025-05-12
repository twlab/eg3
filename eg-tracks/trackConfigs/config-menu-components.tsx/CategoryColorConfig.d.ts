import React from "react";
interface CategoricalColorConfigProps {
    optionsObjects: any;
    onOptionSet: any;
}
export declare class CategoryColorConfig extends React.Component<CategoricalColorConfigProps> {
    static propTypes: {
        optionsObjects: any;
        onOptionSet: any;
    };
    getCategoryColors(): any;
    handleColorChange(categoryName: any, colorPropName: any, newColor: any): void;
    render(): import("react/jsx-runtime").JSX.Element | null;
}
export default CategoryColorConfig;
