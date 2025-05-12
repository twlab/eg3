import React from "react";
export declare const RenderTypes: {
    CANVAS: number;
    SVG: number;
};
interface DesignRendererProps {
    children: React.ReactNode;
    type: any;
    style: any;
    width: any;
    height: number;
    viewWindow?: any;
    forceSvg?: boolean;
}
/**
 * A component that renders SVG elements in a flexible way: in a <svg>, in a <canvas>, etc.
 *
 * @author Silas Hsu
 */
export declare class DesignRenderer extends React.PureComponent<DesignRendererProps> {
    static propTypes: {
        type: any;
        style: any;
    };
    static defaultProps: {
        type: number;
    };
    render(): import("react/jsx-runtime").JSX.Element | null;
}
export default DesignRenderer;
