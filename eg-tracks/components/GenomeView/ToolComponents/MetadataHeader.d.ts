import React from "react";
interface MetadataHeaderProps {
    terms?: string[];
    onNewTerms?: (newTerms: string[]) => void;
    suggestedMetaSets?: Set<string>;
    onRemoveTerm?: (newTerms: string[]) => void;
}
declare const MetadataHeader: React.FC<MetadataHeaderProps>;
export default MetadataHeader;
