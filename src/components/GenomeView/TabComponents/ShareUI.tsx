import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import queryString from "query-string";
import pako from "pako";
import { CopyToClip } from "../TrackComponents/commonComponents/CopyToClipboard";

interface ShareUIProps {
  color: string;
  background: string;
  browser: any;
}

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

const compressString = (str: string): string => {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  const compressedBytes = pako.deflate(bytes); // Compressed Uint8Array
  const compressedString = String.fromCharCode.apply(null, [
    ...compressedBytes,
  ]); // Convert to string
  let enc = btoa(compressedString);
  return enc.replace(/\+/g, ".").replace(/\//g, "_").replace(/=/g, "-");
};

const uncompressString = (enc: string): string => {
  enc = enc.replace(/\./g, "+").replace(/_/g, "/").replace(/-/g, "=");
  const compressedString = atob(enc);
  const compressedBytes = new Uint8Array(compressedString.length);
  for (let i = 0; i < compressedString.length; i++) {
    compressedBytes[i] = compressedString.charCodeAt(i);
  }
  const bytes = pako.inflate(compressedBytes);
  return String.fromCharCode(...bytes);
};

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  if (value !== index) {
    return null;
  }
  return <div style={{ padding: "16px" }}>{children}</div>;
};

const ShareUI: React.FC<ShareUIProps> = ({ color, background, browser }) => {
  const [link, setLink] = useState("");
  const { url } = queryString.parseUrl(window.location.href);
  const url2 = url.replace(/\/$/, "");
  const json = JSON.stringify(browser);
  const compressed = compressString(json);
  const full = `${url2}/?blob=${compressed}`;
  const emailLink = `mailto:?subject=browser%20view&body=${link}`;
  const iframeContent = `<iframe src="${link}" width="100%" height="1200" frameborder="0" style="border:0" allowfullscreen></iframe>`;

  useEffect(() => {
    fetch(`https://api.tinyurl.com/create`, {
      method: `POST`,
      headers: {
        accept: `application/json`,
        authorization: `Bearer ${import.meta.env.REACT_APP_TINYURL_BEARER}`,
        "content-type": `application/json`,
      },
      body: JSON.stringify({
        url: full,
        domain: `tiny.one`,
      }),
    })
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(
            `error with the tiny-url fetch operation. Status Code: ${response.status}`
          );
        }
        return response.json();
      })
      .then((data) => {
        setLink(data.data.tiny_url);
      })
      .catch((error) => {
        setLink(full);
        console.error(error);
      });
  }, [full]);

  return (
    <div style={{ backgroundColor: background, color: color }}>
      <div>
        <h2 className="text-xl font-medium mb-1 bg-white py-2">
          Email Share
        </h2>
        <div className="bg-white p-4">
          <p>
            Click{" "}
            <a href={emailLink} target="_blank" rel="noopener noreferrer">
              here
            </a>{" "}
            to email the current browser view.
          </p>
          <p>
            Or <CopyToClip value={link} /> current link and send it via chat
            software.
          </p>
        </div>
      </div>

      <hr className="border-gray-200 my-8" />

      <div>
        <h2 className="text-xl font-medium mb-1 bg-white py-2">
          Embed
        </h2>
        <div className="bg-white p-4">
          <div>
            <textarea
              style={{ color, backgroundColor: background }}
              defaultValue={iframeContent}
              className="w-full p-2 border rounded"
              rows={10}
            />
          </div>
          <div className="mt-2">
            <CopyToClip value={iframeContent} />
          </div>
        </div>
      </div>

      <hr className="border-gray-200 my-8" />

      <div>
        <h2 className="text-xl font-medium mb-1 bg-white py-2">
          QR Code
        </h2>
        <div className="bg-white p-4">
          <QRCodeSVG
            value={link}
            className="mx-auto"
            size={256}
          />
        </div>
      </div>
    </div>
  );
};

export default ShareUI;
