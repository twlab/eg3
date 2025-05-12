import React from "react";
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
        setGeneCallback: any;
    };
    /**
     * @param {Gene} gene
     */
    setGene: (gene: any) => void;
    render(): import("react/jsx-runtime").JSX.Element;
}
export default GeneSearchBox3D;
