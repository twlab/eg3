import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";
import NavigationLink from "@/components/ui/navigation/NavigationLink";
import { useGenome } from "@/lib/contexts/GenomeContext";

export default function SelectGenome({ params }: NavigationComponentProps) {
    const { genomeConfig, secondaryGenomes } = useGenome();

    const destination = params?.destination ?? "not-found";

    return (
        <div className="flex flex-col gap-4">
            <NavigationLink
                path={destination}
                params={{ genome: genomeConfig.genome.getName() }}
                title={genomeConfig.genome.getName()}
            />
            {secondaryGenomes.map((g) => (
                <NavigationLink
                    key={g.genome.getName()}
                    path={destination}
                    params={{ genome: g.genome.getName() }}
                    title={g.genome.getName()}
                />
            ))}
        </div>
    )
}
