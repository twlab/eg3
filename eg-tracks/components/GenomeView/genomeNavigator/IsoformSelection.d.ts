import React from "react";
interface IsoformSelectionProps {
    genomeConfig: any;
    geneName: string;
    onGeneSelected: any;
    simpleMode: boolean;
    color: string;
    background: string;
}
declare const IsoformSelection: React.FC<IsoformSelectionProps>;
export default IsoformSelection;
