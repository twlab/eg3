import React, { useState } from "react";

interface CopyToClipProps {
  value: any;
}

export const CopyToClip: React.FC<CopyToClipProps> = ({ value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      // Reset the "Copied" message after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <span>
      <button
        className="btn btn-sm btn-info"
        title="Copy to clipboard"
        onClick={handleCopy}
      >
        Copy
      </button>{" "}
      {copied ? <span style={{ color: "red" }}>Copied</span> : null}
    </span>
  );
};
