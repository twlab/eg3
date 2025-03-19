import NavigationStack from "@/components/core-navigation/NavigationStack";
import ExternalLink from "@/components/ui/navigation/ExternalLink";

export default function HelpTab() {
    return (
        <NavigationStack destinations={[]} rootOptions={{ title: 'Help' }}>
            <div className="flex flex-col gap-4">
                <ExternalLink
                    title="Documentation"
                    description="Read our comprehensive documentation and user guides"
                    href="https://epigenomegateway.readthedocs.io/"
                />
                <ExternalLink
                    title="GitHub Repository"
                    description="View and contribute to our source code on GitHub"
                    href="https://github.com/twlab/eg3"
                />
                <ExternalLink
                    title="2nd Gen Browser"
                    description="Visit the 2nd generation of WashU Epigenome Browser"
                    href="http://epigenomegateway.wustl.edu/browser2022"
                />
                <ExternalLink
                    title="1st Gen Browser"
                    description="Visit the classic version of WashU Epigenome Browser"
                    href="http://epigenomegateway.wustl.edu/legacy"
                />
                <ExternalLink
                    title="Discord Server"
                    description="Join our Discord server for real-time discussions and support"
                    href="https://discord.gg/2PHxAEJFf7"
                />
                <ExternalLink
                    title="Google Groups"
                    description="Join our community discussions and get support"
                    href="https://groups.google.com/d/forum/epgg"
                />
                <ExternalLink
                    title="YouTube Channel"
                    description="Watch tutorials and demonstrations of the browser"
                    href="https://www.youtube.com/channel/UCnGVWbxJv-DPDCAFDQ1oFQA"
                />
            </div>
        </NavigationStack>
    );
}
