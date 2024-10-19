import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
/**
 * gene search box for 3d module.
 *
 * @author Daofeng Li
 */
interface GeneSearchBox3DProps {
    color?: any;
    background?: any;
    setGeneCallback?: any;
}
declare class GeneSearchBox3D extends React.PureComponent<GeneSearchBox3DProps> {
    static propTypes: {
        setGeneCallback: PropTypes.Validator<(...args: any[]) => any>;
    };
    /**
     * @param {Gene} gene
     */
    setGene: (gene: any) => void;
    render(): import("react/jsx-runtime").JSX.Element;
}
export default GeneSearchBox3D;
