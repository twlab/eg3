import React, { useState } from "react";
import JSON5 from "json5";
import Json5Fetcher from "@eg/core/src/eg-lib/models/Json5Fetcher";
import DataHubParser from "@eg/core/src/eg-lib/models/DataHubParser";
import { readFileAsText, HELP_LINKS } from "@eg/core/src/eg-lib/models/util";
import TrackModel, { mapUrl } from "@eg/core/src/eg-lib/models/TrackModel";

interface CustomHubAdderProps {
  onTracksAdded: (tracks: TrackModel[]) => void;
  onHubUpdated: any;
}

/**
 * custom hub add UI
 */
const CustomHubAdder: React.FC<CustomHubAdderProps> = ({
  onTracksAdded,
  onHubUpdated,
}) => (
  <div>
    <RemoteHubAdder onTracksAdded={onTracksAdded} onHubUpdated={onHubUpdated} />
    <FileHubAdder onTracksAdded={onTracksAdded} onHubUpdated={onHubUpdated} />
  </div>
);

interface RemoteHubAdderProps {
  onTracksAdded: (tracks: TrackModel[]) => void;
  onHubUpdated: any;
}

const RemoteHubAdder: React.FC<RemoteHubAdderProps> = ({
  onTracksAdded,
  onHubUpdated,
}) => {
  const [inputUrl, setInputUrl] = useState<any>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHub = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!onTracksAdded) {
      return;
    }

    setIsLoading(true);
    let json;
    try {
      json = await new Json5Fetcher().get(mapUrl(inputUrl)!);
      if (!Array.isArray(json)) {
        setIsLoading(false);
        setError("Error: data hub should be an array of JSON object.");
        return;
      }
    } catch (error) {
      setIsLoading(false);
      setError("Cannot load the hub. Error: ");
      return;
    }

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
        onTracksAdded(tracksToShow);
      }
      setIsLoading(false);
      setError("");

      onHubUpdated([], [...tracks], "custom");
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

interface FileHubAdderProps {
  onTracksAdded: (tracks: TrackModel[]) => void;
  onHubUpdated: any;
}

const FileHubAdder: React.FC<FileHubAdderProps> = ({
  onTracksAdded,
  onHubUpdated,
}) => {
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!onTracksAdded) {
      return;
    }

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const contents: any = await readFileAsText(file);
      const json = JSON5.parse(contents);
      const parser = new DataHubParser();

      const tracks = parser.getTracksInHub(json, "Custom hub");

      if (tracks) {
        const tracksToShow = tracks.filter((track) => track.showOnHubLoad);
        if (tracksToShow.length > 0) {
          onTracksAdded(tracksToShow);
        }

        onHubUpdated([], [...tracks], "custom");
      }
    } catch (error) {
      console.error(error);
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

export default CustomHubAdder;
