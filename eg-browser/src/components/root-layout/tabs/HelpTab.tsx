import NavigationStack from "@/components/core-navigation/NavigationStack";
import ExternalLink from "@/components/ui/navigation/ExternalLink";

export default function HelpTab({ panelCounter, onNavigationPathChange }: { panelCounter?: number; onNavigationPathChange?: (path: any) => void }) {
  return (
    <NavigationStack destinations={[]} panelCounter={panelCounter} onPathChange={onNavigationPathChange}>
      <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-800">
        <ExternalLink compact title="Documentation" description="Read our comprehensive documentation and user guides" href="https://epgg.github.io/" />
        <ExternalLink compact title="GitHub Repository" description="View and contribute to our source code on GitHub" href="https://github.com/twlab/eg3" />
        <ExternalLink compact title="2nd Gen Browser" description="Visit the 2nd generation of WashU Epigenome Browser" href="https://epigenomegateway.wustl.edu/browser2022" />
        <ExternalLink compact title="1st Gen Browser" description="Visit the classic version of WashU Epigenome Browser" href="https://epigenomegateway.wustl.edu/legacy" />
        <ExternalLink compact title="Discord Server" description="Join our Discord server for real-time discussions and support" href="https://discord.gg/2PHxAEJFf7" />
        <ExternalLink compact title="Google Groups" description="Join our community discussions and get support" href="https://groups.google.com/d/forum/epgg" />
        <ExternalLink compact title="YouTube Channel" description="Watch tutorials and demonstrations of the browser" href="https://www.youtube.com/channel/UCnGVWbxJv-DPDCAFDQ1oFQA" />
      </div>
    </NavigationStack>
  );
}
