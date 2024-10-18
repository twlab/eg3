import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
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
}
/**
 * A component that renders SVG elements in a flexible way: in a <svg>, in a <canvas>, etc.
 *
 * @author Silas Hsu
 */
export declare class DesignRenderer extends React.PureComponent<DesignRendererProps> {
    static propTypes: {
        type: PropTypes.Requireable<number>;
        style: PropTypes.Requireable<object>;
    };
    static defaultProps: {
        type: number;
    };
    render(): import("react/jsx-runtime").JSX.Element | null;
}
export default DesignRenderer;
