import NavigationStack, { NavigationDestination } from "@/components/core-navigation/NavigationStack";
import NavigationLink from "@/components/ui/navigation/NavigationLink";
import { useMemo } from "react";
import RegionSetView from "./destinations/RegionSetView";
import GenePlotView from "./destinations/GenePlot";
import ScatterPlotView from "./destinations/ScatterPlot";
import Session from "./destinations/Session";

export default function AppsTab() {
    const destinations: NavigationDestination[] = useMemo(() => [
        {
            path: 'region-set-view',
            component: RegionSetView,
            options: {
                title: "Region Set View"
            }
        },
        {
            path: 'gene-plot',
            component: GenePlotView,
            options: {
                title: "Gene Plot"
            }
        },
        {
            path: 'scatter-plot',
            component: ScatterPlotView,
            options: {
                title: "Scatter Plot"
            }
        },
        {
            path: 'session',
            component: Session,
            options: {
                title: "Session"
            }
        }
    ], []);

    return (
        <NavigationStack destinations={destinations} rootOptions={{ title: 'Apps' }}>
            <div className="flex flex-col gap-4">
                <NavigationLink
                    path="region-set-view"
                    title="Region Set View"
                    description="View and manage sets of genomic regions"
                />
                <NavigationLink
                    path="gene-plot"
                    title="Gene Plot"
                    description="Visualize gene expression data"
                />
                <NavigationLink
                    path="scatter-plot"
                    title="Scatter Plot"
                    description="Create scatter plots from genomic data"
                />
                <NavigationLink
                    path="session"
                    title="Session"
                    description="Manage browser sessions and configurations"
                />
            </div>
        </NavigationStack>
    )
}
