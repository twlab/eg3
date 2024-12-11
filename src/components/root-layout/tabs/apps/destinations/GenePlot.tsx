import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";
import { useGenome } from "@/lib/contexts/GenomeContext";
import Geneplot from "@/components/GenomeView/TabComponents/Geneplot/Geneplot";

export default function GenePlotView({ params }: NavigationComponentProps) {
    const {
        genomeConfig,
        regionSets,
        selectedSet,
        state,
        onSetsSelected,
        onSetsChanged,
    } = useGenome();

    return (
        <Geneplot
            genome={genomeConfig.genome}
            sets={regionSets}
            selectedSet={selectedSet}
            tracks={state.tracks}
            onSetSelected={onSetsSelected}
            onSetsChanged={onSetsChanged}
        />
    );
} 