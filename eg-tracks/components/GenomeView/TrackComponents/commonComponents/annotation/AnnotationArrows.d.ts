import React from "react";
/**
 * A series of evenly-spaced arrows on a horizontal axis.  Renders SVG elements.
 *
 * @author Silas Hsu
 */
interface ArrowProps {
    startX: number;
    endX: number;
    y?: number;
    height: number;
    isToRight?: boolean;
    color?: string;
    /**
     * Id for a clipPath element. If valid, arrows will only appear in the clipPath's region.
     */
    clipId?: string;
    opacity?: number;
    separation?: number;
}
declare class AnnotationArrows extends React.PureComponent<ArrowProps> {
    static defaultProps: {
        y: number;
        opacity: number;
    };
    render(): any[] | null;
}
export default AnnotationArrows;
