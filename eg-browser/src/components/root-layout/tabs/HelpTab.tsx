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
                    title="Legacy Browser"
                    description="Visit the classic version of WashU Epigenome Browser"
                    href="http://epigenomegateway.wustl.edu/legacy"
                />

                <ExternalLink
                    title="Google Groups"
                    description="Join our community discussions and get support"
                    href="https://groups.google.com/d/forum/epgg"
                />

                <ExternalLink
                    title="Slack Community"
                    description="Join our Slack workspace for real-time discussions and support"
                    href="https://join.slack.com/t/epgg/shared_invite/enQtNTA5NDY5MDIwNjc4LTlhYjJlZWM4MmRlMTcyODEzMDI0ZTlmNmM2ZjIyYmY2NTU5ZTY2MWRmOWExMDg1N2U5ZWE3NzhkMjVkZDVhNTc"
                />

                <ExternalLink
                    title="GitHub Repository"
                    description="View and contribute to our source code on GitHub"
                    href="https://github.com/lidaof/eg-react"
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
