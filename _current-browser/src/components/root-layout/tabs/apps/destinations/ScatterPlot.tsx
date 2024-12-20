import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";
import { useGenome } from "@/lib/contexts/GenomeContext";
import ScatterPlot from "@/components/GenomeView/TabComponents/Geneplot/ScatterPlot";

export default function ScatterPlotView({ params }: NavigationComponentProps) {
    const {
        genomeConfig,
        regionSets,
        selectedSet,
        state,
    } = useGenome();

    return (
        <ScatterPlot
            genomeConfig={genomeConfig.genome}
            sets={regionSets}
            selectedSet={selectedSet}
            tracks={state.tracks}
        />
    );
} 