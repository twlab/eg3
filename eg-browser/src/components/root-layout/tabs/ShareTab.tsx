import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import { selectNavigationTab } from "@/lib/redux/slices/navigationSlice";
import { selectShortLink, setShortLink, selectFullUrlForShortLink } from "@/lib/redux/slices/utilitySlice";
import TabView from "@/components/ui/tab-view/TabView";
import Button from "@/components/ui/button/Button";
import { QRCodeSVG } from "qrcode.react";
import { useState, useEffect } from "react";

function compressString(str: string): string {
    const bytes = new TextEncoder().encode(str);
    const compressedBytes = new Uint8Array(bytes.buffer);
    const compressedString = String.fromCharCode.apply(null, Array.from(compressedBytes));
    const enc = btoa(compressedString);
    return enc.replace(/\+/g, ".").replace(/\//g, "_").replace(/=/g, "-");
}

export default function ShareTab() {
    const session = useAppSelector(selectCurrentSession);
    const currentTab = useAppSelector(selectNavigationTab);
    const shortLink = useAppSelector(selectShortLink);
    const storedFullUrl = useAppSelector(selectFullUrlForShortLink);
    const dispatch = useAppDispatch();
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const json = JSON.stringify(session);
    const compressed = compressString(json);
    const url = window.location.href.replace(/\/$/, "");
    const fullUrl = `${url}/?blob=${compressed}`;

    const generateShortLink = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch('https://api.tinyurl.com/create', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'authorization': `Bearer 2nLQGpsuegHP8l8J0Uq1TsVkCzP3un3T23uQ5YovVf5lvvGOucGmFOYRVj6L`,
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    url: fullUrl,
                    domain: 'tiny.one',
                }),
            });

            if (response.status !== 200) {
                throw new Error(`Error with the tiny-url fetch operation. Status Code: ${response.status}`);
            }

            const data = await response.json();
            dispatch(setShortLink({ shortLink: data.data.tiny_url, fullUrl }));
        } catch (error) {
            console.error('URL shortening failed:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        if (shortLink === "" && currentTab === 'share') {
            generateShortLink();
        }
    }, [currentTab, fullUrl, dispatch, shortLink]);

    const isLinkOutdated = shortLink && storedFullUrl !== fullUrl;
    const linkToShare = shortLink || fullUrl;
    const emailLink = `mailto:?subject=Browser%20View&body=${encodeURIComponent(linkToShare)}`;
    const iframeContent = `<iframe src="${linkToShare}" width="100%" height="1200" frameborder="0" style="border:0" allowfullscreen></iframe>`;

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const OutdatedLinkWarning = () => (
        isLinkOutdated ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <div className="flex items-center gap-2">
                    <p className="text-yellow-800">
                        The shortened link is for an older version of this view.
                    </p>
                    <Button
                        onClick={generateShortLink}
                        disabled={isGenerating}
                        style={{ marginLeft: '0.5rem' }}
                    >
                        {isGenerating ? "Generating..." : "Generate New Link"}
                    </Button>
                </div>
            </div>
        ) : null
    );

    const EmailTab = () => (
        <div className="flex flex-col gap-4 p-4">
            <OutdatedLinkWarning />
            <p>
                <a href={emailLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                    Click here
                </a>
                {" "}to email current browser view.
            </p>
            <div className="flex items-center gap-2">
                <p>Or copy the {isLinkOutdated ? "outdated " : ""}shortened link:</p>
                <Button onClick={() => copyToClipboard(linkToShare)}>
                    {copied ? "Copied!" : "Copy Link"}
                </Button>
            </div>
        </div>
    );

    const EmbedTab = () => (
        <div className="flex flex-col gap-4 p-4">
            <OutdatedLinkWarning />
            <textarea
                className="w-full h-32 p-2 border rounded bg-gray-50"
                value={iframeContent}
                readOnly
            />
            <Button onClick={() => copyToClipboard(iframeContent)}>
                {copied ? "Copied!" : "Copy Embed Code"}
            </Button>
        </div>
    );

    const QRTab = () => (
        <div className="flex flex-col items-center p-4">
            <OutdatedLinkWarning />
            <QRCodeSVG value={shortLink} size={256} />
        </div>
    );

    const tabs = [
        { label: "Email", value: "email", component: <EmailTab /> },
        { label: "Embed", value: "embed", component: <EmbedTab /> },
        { label: "QR Code", value: "qr", component: <QRTab /> }
    ];

    return (
        <div className="p-4">
            <h1 className="text-2xl mb-4">Share</h1>
            <TabView tabs={tabs} />
        </div>
    );
}
