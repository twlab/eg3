import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";
import { useGenome } from "@/lib/contexts/GenomeContext";
import RegionSetSelector from "@/components/GenomeView/TabComponents/RegionSetSelector/RegionSetSelector";

export default function RegionSetView({ params }: NavigationComponentProps) {
    const {
        genomeConfig,
        regionSets,
        selectedSet,
        onSetsSelected,
        onSetsChanged,
    } = useGenome();

    return (
        <RegionSetSelector
            genome={genomeConfig.genome}
            sets={regionSets}
            selectedSet={selectedSet}
            onSetSelected={onSetsSelected}
            onSetsChanged={onSetsChanged}
        />
    );
} 
