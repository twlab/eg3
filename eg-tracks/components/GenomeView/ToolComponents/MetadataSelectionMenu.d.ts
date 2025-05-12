import React, { CSSProperties } from "react";
interface MetadataSelectionMenuProps {
    terms?: string[];
    style?: CSSProperties;
    onNewTerms?: (newTerms: string[]) => void;
    suggestedMetaSets?: Set<string>;
    onRemoveTerm?: (termToRemove: string[]) => void;
}
declare const MetadataSelectionMenu: React.FC<MetadataSelectionMenuProps>;
export default MetadataSelectionMenu;
