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
import { useAppDispatch } from "@/lib/redux/hooks";
import { setSessionPanelOpen } from "@/lib/redux/slices/navigationSlice";
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

  const dispatch = useAppDispatch();

  return (
    <NavigationStack
      destinations={destinations}
      rootOptions={{ title: "Apps" }}
    >
      <div className="flex flex-col gap-4">
        <DescriptiveNavigationLink
          path="region-set-view"
          title="Region Set View"
          description="View and analyze sets of genomic regions"
        />
        <DescriptiveNavigationLink
          path="gene-plot"
          title="Gene Plot"
          description="Create and customize gene-centric visualizations"
        />
        <DescriptiveNavigationLink
          path="scatter-plot"
          title="Scatter Plot"
          description="Generate scatter plots for genomic data analysis"
        />
        {/* <DescriptiveNavigationLink
          title="Session"
          description="Manage and share your browser sessions"
          onClick={() => dispatch(setSessionPanelOpen(true))}
        />
        <DescriptiveNavigationLink
          path="go-live"
          title="Go Live"
          description="Share your browser view in real-time with others"
        /> */}
        <DescriptiveNavigationLink
          path="screenshot"
          title="Screenshot"
          description="Capture and export browser views as images"
        />
        {/* <DescriptiveNavigationLink
          path="dynamic-record"
          title="Dynamic Record"
          description="Record and replay browser interactions"
        />
        <DescriptiveNavigationLink
          path="fetch-sequence"
          title="Fetch Sequence"
          description="Retrieve and analyze genomic sequences"
        /> */}
      </div>
    </NavigationStack>
  );
}
