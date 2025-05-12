import { FC } from "react";
import NavigationContext from "../../../models/NavigationContext";
import Genome from "../../../models/Genome";
interface GeneSearchBoxProps {
    navContext: NavigationContext;
    onRegionSelected: (newStart: number, newEnd: number, toolTitle: number | string, highlightSearch: boolean) => void;
    handleCloseModal: () => void;
    onNewHighlight?: (newStart: number, newEnd: number, geneName: string) => void;
    doHighlight: boolean;
    color: string;
    background: string;
    genomeConfig: Genome;
}
declare const GeneSearchBox: FC<GeneSearchBoxProps>;
export default GeneSearchBox;
