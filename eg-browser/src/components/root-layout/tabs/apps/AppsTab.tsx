import { useMemo } from "react";
import NavigationStack, {
  NavigationDestination,
} from "../../../core-navigation/NavigationStack";
import DescriptiveNavigationLink from "../../../ui/navigation/DescriptiveNavigationLink";
import GenePlot from "./destinations/GenePlot";
import ScatterPlot from "./destinations/ScatterPlot";
import Session from "./destinations/Session";
import GoLive from "./destinations/GoLive";
import Screenshot from "./destinations/Screenshot";
import DynamicRecord from "./destinations/DynamicRecord";
import FetchSequence from "./destinations/FetchSequence";
import RegionSetSelector from "./destinations/region-set/RegionSetSelector";

export default function AppsTab() {
  const destinations: NavigationDestination[] = useMemo(
    () => [
      {
        path: "region-set-view",
        component: RegionSetSelector,
        options: {
          title: "Region Set View",
        },
      },
      {
        path: "gene-plot",
        component: GenePlot,
        options: {
          title: "Gene Plot",
        },
      },
      {
        path: "scatter-plot",
        component: ScatterPlot,
        options: {
          title: "Scatter Plot",
        },
      },
      {
        path: "session",
        component: Session,
        options: {
          title: "Session",
        },
      },
      {
        path: "go-live",
        component: GoLive,
        options: {
          title: "Go Live",
        },
      },
      {
        path: "screenshot",
        component: Screenshot,
        options: {
          title: "Screenshot",
        },
      },
      {
        path: "dynamic-record",
        component: DynamicRecord,
        options: {
          title: "Dynamic Record",
        },
      },
      {
        path: "fetch-sequence",
        component: FetchSequence,
        options: {
          title: "Fetch Sequence",
        },
      },
    ],
    []
  );

  return (
    <NavigationStack destinations={destinations}>
      <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-800">
        <DescriptiveNavigationLink compact path="region-set-view" title="Region Set View" description="View and analyze sets of genomic regions" />
        <DescriptiveNavigationLink compact path="gene-plot" title="Gene Plot" description="Create and customize gene-centric visualizations" />
        <DescriptiveNavigationLink compact path="scatter-plot" title="Scatter Plot" description="Generate scatter plots for genomic data analysis" />
        <DescriptiveNavigationLink compact path="session" title="Session" description="Manage and share your browser sessions" />
        {/* <DescriptiveNavigationLink compact path="go-live" title="Go Live" description="Share your browser view in real-time with others" /> */}
        <DescriptiveNavigationLink compact path="screenshot" title="Screenshot" description="Capture and export browser views as images" />
        <DescriptiveNavigationLink compact path="fetch-sequence" title="Fetch Sequence" description="Retrieve and analyze genomic sequences" />
      </div>
    </NavigationStack>
  );
}
