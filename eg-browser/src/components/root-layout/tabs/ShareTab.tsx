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

import useMidSizeNavigationTab from "@/lib/hooks/useMidSizeNavigationTab";
import useExpandedNavigationTab from "@/lib/hooks/useExpandedNavigationTab";

function compressString(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const compressedBytes = new Uint8Array(bytes.buffer);
  const compressedString = String.fromCharCode.apply(
    null,
    Array.from(compressedBytes),
  );
  const enc = btoa(compressedString);
  return enc.replace(/\+/g, ".").replace(/\//g, "_").replace(/=/g, "-");
}

export default function ShareTab({
  panelCounter,
  onNavigationPathChange,
}: {
  panelCounter?: number;
  onNavigationPathChange?: (path: any) => void;
}) {
  // useExpandedNavigationTab()
  useMidSizeNavigationTab();
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
          `Error with the tiny-url fetch operation. Status Code: ${response.status}`,
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
    linkToShare,
  )}`;
  const iframeContent = `<iframe src="${linkToShare}" width="100%" height="1200" frameborder="0" style="border:0" allowfullscreen></iframe>`;

  const copyToClipboard = async (
    text: string,
    setStateFn: (val: boolean) => void,
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
      <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
        <p className="flex-1 text-sm text-amber-800 dark:text-amber-300">
          The shortened link is for an older version of this view.
        </p>
        <Button onClick={generateShortLink} disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Refresh link"}
        </Button>
      </div>
    ) : null;

  const inputCls =
    "flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-surface text-primary dark:text-dark-primary focus:outline-none font-mono";
  const sectionHeading =
    "text-xs font-semibold text-primary dark:text-dark-primary uppercase tracking-wider";

  const UrlTab = () => (
    <div className="flex flex-col gap-5 p-4">
      <OutdatedLinkWarning />

      {/* Shortened Link */}
      <div className="flex flex-col gap-2">
        <p className={sectionHeading}>
          Shortened link
          {isLinkOutdated && (
            <span className="text-amber-500 normal-case ml-1">(outdated)</span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={linkToShare}
            readOnly
            className={inputCls}
          />
          <Button
            onClick={() => copyToClipboard(linkToShare, setCopiedShortLink)}
          >
            {copiedShortLink ? "✓ Copied" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Full Link */}
      <div className="flex flex-col gap-2">
        <p className={sectionHeading}>
          Full link
          {isLinkOutdated && (
            <span className="text-amber-500 normal-case ml-1">(outdated)</span>
          )}
        </p>
        <p className="text-xs text-primary/60 dark:text-dark-primary/60">
          Use this if the shortened link doesn't work
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={fullLinkToShare}
            readOnly
            className={inputCls}
          />
          <Button
            onClick={() => copyToClipboard(fullLinkToShare, setCopiedFullLink)}
          >
            {copiedFullLink ? "✓ Copied" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1">
        <p className={sectionHeading}>Email link</p>
        <p className="text-sm text-primary dark:text-dark-primary">
          <a
            href={emailLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 underline underline-offset-2"
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
        <p className={sectionHeading}>Embed code</p>
        <textarea
          className="w-full h-32 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-surface text-primary dark:text-dark-primary font-mono focus:outline-none resize-none"
          value={iframeContent}
          readOnly
        />
        <div>
          <Button
            onClick={() => copyToClipboard(iframeContent, setCopiedEmbed)}
          >
            {copiedEmbed ? "✓ Copied" : "Copy embed code"}
          </Button>
        </div>
      </div>
    </div>
  );

  const QRTab = () => (
    <div className="flex flex-col items-center gap-4 p-6">
      <OutdatedLinkWarning />
      <div className="p-4 bg-white dark:bg-white rounded-xl shadow-sm border border-gray-200">
        <QRCodeSVG value={shortLink} size={220} />
      </div>
      <p className="text-xs text-primary/60 dark:text-dark-primary/60">
        Scan to open the current view
      </p>
    </div>
  );

  const tabs = [
    { label: "URL", value: "url", component: <UrlTab /> },
    { label: "Embed", value: "embed", component: <EmbedTab /> },
    { label: "QR Code", value: "qr", component: <QRTab /> },
  ];

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-dark-background">
      <TabView tabs={tabs} />
    </div>
  );
}
