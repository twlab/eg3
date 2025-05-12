import React from "react";
import NavigationContext from "../../../models/NavigationContext";
interface SnpSearchBoxProps {
    genomeConfig: any;
    navContext: NavigationContext;
    onRegionSelected: (newStart: number, newEnd: number, toolTitle: number | string, highlightSearch: boolean) => void;
    handleCloseModal: () => void;
    onNewHighlight?: (start: number, end: number, text: string) => void;
    doHighlight: boolean;
    color?: string;
    background?: string;
}
declare const SnpSearchBox: React.FC<SnpSearchBoxProps>;
export default SnpSearchBox;
