import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";

export default function Documentation({ params }: NavigationComponentProps) {
    return (
        <div className="flex flex-col gap-4">
            <a
                href="https://epigenomegateway.readthedocs.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
            >
                Documentation
            </a>
            <a
                href="http://epigenomegateway.wustl.edu/legacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
            >
                The 'old' browser
            </a>
            <a
                href="https://groups.google.com/d/forum/epgg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
            >
                Google groups
            </a>
            <a
                href="https://join.slack.com/t/epgg/shared_invite/enQtNTA5NDY5MDIwNjc4LTlhYjJlZWM4MmRlMTcyODEzMDI0ZTlmNmM2ZjIyYmY2NTU5ZTY2MWRmOWExMDg1N2U5ZWE3NzhkMjVkZDVhNTc"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
            >
                Join our Slack
            </a>
            <a
                href="https://github.com/lidaof/eg-react"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
            >
                Source code @ Github
            </a>
            <a
                href="https://www.youtube.com/channel/UCnGVWbxJv-DPDCAFDQ1oFQA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
            >
                YouTube channel
            </a>
        </div>
    );
} 