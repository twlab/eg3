import React from "react";
import DisplayedRegionModel from "../../../models/DisplayedRegionModel";
export declare class HighlightInterval {
    start: number;
    end: number;
    display: boolean;
    color: string;
    tag: string;
    constructor(start: number, end: number, tag?: string, color?: string, display?: boolean);
}
interface HighlightMenuProps {
    highlights: HighlightInterval[];
    viewRegion: DisplayedRegionModel;
    showHighlightMenuModal: boolean;
    onNewRegion: (start: number, end: number, toolTitle: number | string) => void;
    onSetHighlights: any;
    selectedTool: any;
}
declare const HighlightMenu: React.FC<HighlightMenuProps>;
export default HighlightMenu;
