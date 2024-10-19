import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
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
    static propTypes: {
        startX: PropTypes.Validator<number>;
        endX: PropTypes.Validator<number>;
        y: PropTypes.Requireable<number>;
        height: PropTypes.Validator<number>;
        isToRight: PropTypes.Requireable<boolean>;
        color: PropTypes.Requireable<string>;
        /**
         * Id for a clipPath element.  If valid, arrows will only appear in the clipPath's region.
         */
        clipId: PropTypes.Requireable<string>;
        opacity: PropTypes.Requireable<number>;
    };
    static defaultProps: {
        y: number;
        opacity: number;
    };
    render(): any[] | null;
}
export default AnnotationArrows;
