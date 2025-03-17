import { useAppSelector } from "@/lib/redux/hooks";
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
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
    const [copied, setCopied] = useState(false);
    const [shortLink, setShortLink] = useState<string>("https://api.tinyurl.com/create");

    const json = JSON.stringify(session);
    const compressed = compressString(json);
    const url = window.location.href.replace(/\/$/, "");
    const fullUrl = `${url}/?blob=${compressed}`;

    useEffect(() => {
        fetch('https://api.tinyurl.com/create', {
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
        })
            .then(response => {
                if (response.status !== 200) {
                    throw new Error(`Error with the tiny-url fetch operation. Status Code: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                setShortLink(data.data.tiny_url);
            })
            .catch(error => {
                // setShortLink(fullUrl);
                console.error('URL shortening failed:', error);
            });
    }, [fullUrl]);

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

    const EmailTab = () => (
        <div className="flex flex-col gap-4 p-4">
            <p>
                <a href={emailLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                    Click here
                </a>
                {" "}to email current browser view.
            </p>
            <div className="flex items-center gap-2">
                <p>Or copy the shortened link:</p>
                <Button onClick={() => copyToClipboard(linkToShare)}>
                    {copied ? "Copied!" : "Copy Link"}
                </Button>
            </div>
        </div>
    );

    const EmbedTab = () => (
        <div className="flex flex-col gap-4 p-4">
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
        <div className="flex justify-center p-4">
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