import React, { useState } from "react";
import PropTypes from "prop-types";
import JSON5 from "json5";

import { readFileAsText, HELP_LINKS } from "@/models/util";
import { mapUrl } from "@/models/TrackModel";
import DataHubParser from "@/models/DataHubParser";

/**
 * custom hub add UI
 */
const CustomHubAdder = ({ onTracksAdded }) => (
  <div>
    <RemoteHubAdder onTracksAdded={onTracksAdded} />
    <FileHubAdder onTracksAdded={onTracksAdded} />
  </div>
);

const RemoteHubAdder = ({ onTracksAdded }) => {
  const [inputUrl, setInputUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHub = async (e) => {
    e.preventDefault();
    if (!onTracksAdded) return;

    setIsLoading(true);
    let json;

    const lastSlashIndex = inputUrl.lastIndexOf("/");
    const hubBase = inputUrl.substring(0, lastSlashIndex).trimEnd();
    const parser = new DataHubParser();
    const tracks = await parser.getTracksInHub(
      json,
      "Custom hub",
      "",
      false,
      0,
      hubBase
    );

    if (tracks) {
      const tracksToShow = tracks.filter((track) => track.showOnHubLoad);
      if (tracksToShow.length > 0) {
        onTracksAdded([tracksToShow]);
      }
      setIsLoading(false);
      setError("");
    }
  };

  return (
    <form>
      <h1>Add remote data hub</h1>
      <div className="form-group">
        <label>Remote hub URL</label>
        <span style={{ marginLeft: "10px", fontStyle: "italic" }}>
          <a
            href={HELP_LINKS.datahub}
            target="_blank"
            rel="noopener noreferrer"
          >
            data hub documentation
          </a>
        </span>
        <input
          type="text"
          className="form-control"
          value={inputUrl}
          onChange={(event) => setInputUrl(event.target.value)}
        />
      </div>
      <button
        onClick={loadHub}
        disabled={isLoading || !inputUrl}
        className="btn btn-success"
      >
        Load from URL
      </button>
      <p style={{ color: "red" }}>{error}</p>
    </form>
  );
};

RemoteHubAdder.propTypes = {
  onTracksAdded: PropTypes.func,
};

const FileHubAdder = ({ onTracksAdded }) => {
  const handleFileUpload = async (event) => {
    if (!onTracksAdded) return;

    const contents: any = await readFileAsText(event.target.files[0]);
    const json = JSON5.parse(contents);
    const parser = new DataHubParser();
    const tracks = parser.getTracksInHub(json, "Custom hub", "");
    if (tracks) {
      const tracksToShow = tracks.filter((track) => track.showOnHubLoad);
      if (tracksToShow.length > 0) {
        onTracksAdded([tracksToShow]);
      }
    }
  };

  return (
    <div>
      Or <br />
      <div className="custom-file">
        <input
          type="file"
          className="custom-file-input"
          id="inputGroupFile01"
          onChange={handleFileUpload}
        />
        <label className="custom-file-label" htmlFor="inputGroupFile01">
          Choose datahub file
        </label>
      </div>
    </div>
  );
};

FileHubAdder.propTypes = {
  onTracksAdded: PropTypes.func,
};

export default CustomHubAdder;
