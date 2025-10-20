import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import { selectNavigationTab } from "@/lib/redux/slices/navigationSlice";
import {
  selectShortLink,
  setShortLink,
  selectFullUrlForShortLink,
} from "@/lib/redux/slices/utilitySlice";
import TabView from "@/components/ui/tab-view/TabView";
import Button from "@/components/ui/button/Button";
import { QRCodeSVG } from "qrcode.react";
import { useState, useEffect } from "react";

function compressString(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const compressedBytes = new Uint8Array(bytes.buffer);
  const compressedString = String.fromCharCode.apply(
    null,
    Array.from(compressedBytes)
  );
  const enc = btoa(compressedString);
  return enc.replace(/\+/g, ".").replace(/\//g, "_").replace(/=/g, "-");
}

export default function ShareTab() {
  const session = useAppSelector(selectCurrentSession);
  const currentTab = useAppSelector(selectNavigationTab);
  const shortLink = useAppSelector(selectShortLink);
  const storedFullUrl = useAppSelector(selectFullUrlForShortLink);
  const dispatch = useAppDispatch();
  const [copiedShortLink, setCopiedShortLink] = useState(false);
  const [copiedFullLink, setCopiedFullLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const json = JSON.stringify(session);
  const compressed = compressString(json);
  const baseUrl = window.location.origin + window.location.pathname;
  const url = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
  const fullUrl = `${url}?blob=${compressed}`;

  const generateShortLink = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch("https://api.tinyurl.com/create", {
        method: "POST",
        headers: {
          accept: "application/json",
          authorization: `Bearer 2nLQGpsuegHP8l8J0Uq1TsVkCzP3un3T23uQ5YovVf5lvvGOucGmFOYRVj6L`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          url: fullUrl,
          domain: "tiny.one",
        }),
      });

      if (response.status !== 200) {
        throw new Error(
          `Error with the tiny-url fetch operation. Status Code: ${response.status}`
        );
      }

      const data = await response.json();
      dispatch(setShortLink({ shortLink: data.data.tiny_url, fullUrl }));
    } catch (error) {
      console.error("URL shortening failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (shortLink === "" && currentTab === "share") {
      generateShortLink();
    }
  }, [currentTab, fullUrl, dispatch, shortLink]);

  const isLinkOutdated = shortLink && storedFullUrl !== fullUrl;
  const linkToShare = shortLink || fullUrl;
  const fullLinkToShare = fullUrl;
  const emailLink = `mailto:?subject=Browser%20View&body=${encodeURIComponent(
    linkToShare
  )}`;
  const iframeContent = `<iframe src="${linkToShare}" width="100%" height="1200" frameborder="0" style="border:0" allowfullscreen></iframe>`;

  const copyToClipboard = async (
    text: string,
    setStateFn: (val: boolean) => void
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setStateFn(true);
      setTimeout(() => setStateFn(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const OutdatedLinkWarning = () =>
    isLinkOutdated ? (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
        <div className="flex items-center gap-2">
          <p className="text-yellow-800">
            The shortened link is for an older version of this view.
          </p>
          <Button
            onClick={generateShortLink}
            disabled={isGenerating}
            style={{
              marginLeft: "0.5rem",
              color: "#5F6368",
              border: "1px solid #3b82f6",
              borderRadius: "0.25rem",
            }}
          >
            {isGenerating ? "Generating..." : "Generate New Link"}
          </Button>
        </div>
      </div>
    ) : null;

  const UrlTab = () => (
    <div className="flex flex-col gap-6 p-4">
      <OutdatedLinkWarning />

      {/* Shortened Link Section */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Shortened Link{" "}
          {isLinkOutdated && (
            <span className="text-yellow-600">(outdated)</span>
          )}
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={linkToShare}
            readOnly
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
          />
          <Button
            style={{
              border: "1px solid #3b82f6",
              borderRadius: "0.375rem",
              padding: "0.5rem 1rem",
              minWidth: "100px",
            }}
            onClick={() => copyToClipboard(linkToShare, setCopiedShortLink)}
          >
            {copiedShortLink ? "✓ Copied!" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Full Link Section */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Full Link{" "}
          {isLinkOutdated && (
            <span className="text-yellow-600">(outdated)</span>
          )}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Use this if the shortened link doesn't work
        </p>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={fullLinkToShare}
            readOnly
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
          />
          <Button
            style={{
              border: "1px solid #3b82f6",
              borderRadius: "0.375rem",
              padding: "0.5rem 1rem",
              minWidth: "100px",
            }}
            onClick={() => copyToClipboard(fullLinkToShare, setCopiedFullLink)}
          >
            {copiedFullLink ? "✓ Copied!" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Email Section */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Email Link
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <a
            href={emailLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            Click here
          </a>{" "}
          to email the current browser view.
        </p>
      </div>
    </div>
  );

  const EmbedTab = () => (
    <div className="flex flex-col gap-4 p-4">
      <OutdatedLinkWarning />
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Embed Code
        </h3>
        <textarea
          className="w-full h-32 p-3 text-sm border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 font-mono"
          value={iframeContent}
          readOnly
        />
        <Button
          style={{
            border: "1px solid #3b82f6",
            borderRadius: "0.375rem",
            padding: "0.5rem 1rem",
            alignSelf: "flex-start",
          }}
          onClick={() => copyToClipboard(iframeContent, setCopiedEmbed)}
        >
          {copiedEmbed ? "✓ Copied!" : "Copy Embed Code"}
        </Button>
      </div>
    </div>
  );

  const QRTab = () => (
    <div className="flex flex-col items-center p-4">
      <OutdatedLinkWarning />
      <QRCodeSVG value={shortLink} size={256} />
    </div>
  );

  const tabs = [
    { label: "URL", value: "url", component: <UrlTab /> },
    { label: "Embed", value: "embed", component: <EmbedTab /> },
    { label: "QR Code", value: "qr", component: <QRTab /> },
  ];

  return (
    <div className="p-4 bg-white dark:bg-dark-background h-full">
      <TabView tabs={tabs} />
    </div>
  );
}
