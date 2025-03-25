import React, { useState, ChangeEvent } from "react";

import JSZip from "jszip";
import _ from "lodash";

import { child, get, getDatabase, ref, set } from "firebase/database";
import { readFileAsText, HELP_LINKS } from "../../../models/util";
import { CopyToClip } from "../TrackComponents/commonComponents/CopyToClipboard";
import "./SessionUI.css";
import TrackModel from "../../../models/TrackModel";
import RegionSet from "../../../models/RegionSet";
import { getGenomeConfig } from "../../../models/genomes/allGenomes";
import OpenInterval from "../../../models/OpenInterval";
import DisplayedRegionModel from "../../../models/DisplayedRegionModel";
import { HighlightInterval } from "../ToolComponents/HighlightMenu";
import { ITrackModel } from "../../../types";
export interface BundleProps {
  bundleId: string;
  customTracksPool: any[]; // use appropriate types if you know specifics, or use unknown[] for any type
  darkTheme: boolean;
  genomeName: string;
  highlights: HighlightInterval[];
  isShowingNavigator: boolean;
  layout: any;
  metadataTerms: any[]; // use appropriate types if you know specifics, or use unknown[] for any type
  regionSetView: any | null; // use appropriate type if you know it
  regionSets: any[]; // use appropriate types if you know specifics, or use unknown[] for any type
  viewRegion: DisplayedRegionModel | null;
  trackLegendWidth: number;
  tracks: Array<TrackModel> | Array<ITrackModel>;
}

interface SessionBundle {
  bundleId: string;
  currentId: string;
  sessionsInBundle: { [id: string]: Session };
}

interface Session {
  // (serialized)
  label: string;
  date: number;
  state: object;
}

interface HasBundleId {
  bundleId: string;
}

interface SessionUIProps extends HasBundleId {
  onRestoreSession: (session: object) => void;
  onRetrieveBundle: (newBundle: any) => void;
  updateBundle: (bundle: any) => void;
  withGenomePicker?: boolean;
  state?: BundleProps;
  curBundle: any;
}

export const onRetrieveSession = async (retrieveId: string) => {
  if (retrieveId.length === 0) {
    console.log("Session bundle Id cannot be empty.", "error", 2000);
    return null;
  }
  console.log(retrieveId);
  const dbRef = ref(getDatabase());
  try {
    const snapshot = await get(child(dbRef, `sessions/${retrieveId}`));
    console.log(snapshot);
    if (snapshot.exists()) {
      let res = snapshot.val();
      console.log(res);
      for (let curId in res.sessionsInBundle) {
        if (res.sessionsInBundle.hasOwnProperty(curId)) {
          let object = res.sessionsInBundle[curId].state;

          const regionSets = object.regionSets
            ? object.regionSets.map(RegionSet.deserialize)
            : [];
          const regionSetView = regionSets[object.regionSetViewIndex] || null;

          // Create the newBundle object based on the existing object.
          let newBundle = {
            genomeName: object.genomeName,
            viewRegion: new DisplayedRegionModel(
              getGenomeConfig(object.genomeName).navContext,
              object.viewInterval.start,
              object.viewInterval.end
            ),

            tracks: object.tracks.map((data) => TrackModel.deserialize(data)),
            metadataTerms: object.metadataTerms || [],
            regionSets,
            regionSetView,
            trackLegendWidth: object.trackLegendWidth || 120,
            bundleId: object.bundleId,
            isShowingNavigator: object.isShowingNavigator,
            isShowingVR: object.isShowingVR,
            layout: object.layout || {},
            highlights: object.highlights || [],
            darkTheme: object.darkTheme || false,
          };

          // Replace the state key with the newBundle in the session.
          res.sessionsInBundle[curId].state = newBundle;
        }
      }

      return res;
    } else {
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

const SessionUI: React.FC<SessionUIProps> = ({
  onRestoreSession,
  onRetrieveBundle,
  withGenomePicker,
  updateBundle,
  state,
  curBundle,
  bundleId,
}) => {
  const [newSessionLabel, setNewSessionLabel] = useState<string>(getFunName());
  const [retrieveId, setRetrieveId] = useState<string>("");
  const [lastBundleId, setLastBundleId] = useState<string>(bundleId);
  const [sortSession, setSortSession] = useState<string>("date"); // or label

  const saveSession = async () => {
    const newSessionObj = {
      label: newSessionLabel,
      date: Date.now(),
      state: state,
    };

    const sessionId = crypto.randomUUID();

    let newBundle = {
      bundleId: curBundle.bundleId,
      currentId: sessionId,
      sessionsInBundle: {
        ...curBundle.sessionsInBundle,
        [sessionId]: newSessionObj,
      },
    };
    updateBundle(newBundle);
    const db = getDatabase();
    try {
      await set(
        ref(db, `sessions/${curBundle.bundleId}`),
        JSON.parse(JSON.stringify(newBundle))
      );
      setNewSessionLabel(getFunName());
      console.log("Session saved!", "success", 2000);
    } catch (error) {
      console.error(error);
      console.log("Error while saving session", "error", 2000);
    }

    setRandomLabel();
    setLastBundleId(curBundle.bundleId);
  };

  const downloadSession = (asHub = false) => {
    // Add your session saving logic here
  };

  const downloadAsSession = () => {
    downloadSession(false);
  };

  const downloadAsHub = () => {
    downloadSession(true);
  };

  const downloadWholeBundle = () => {
    const { sessionsInBundle, bundleId } = curBundle;
    if (_.isEmpty(sessionsInBundle)) {
      console.log("Session bundle is empty, skipping...", "error", 2000);
      return;
    }
    const zip = new JSZip();
    const zipName = `${curBundle.bundleId}.zip`;
    Object.keys(sessionsInBundle).forEach((k) => {
      const session = sessionsInBundle[k];
      zip.file(
        `${session.label}-${k}.json`,
        JSON.stringify(session.state) + "\n"
      );
    });
    zip.generateAsync({ type: "base64" }).then((content) => {
      const dl = document.createElement("a");
      document.body.appendChild(dl); // This line makes it work in Firefox.
      dl.setAttribute("href", "data:application/zip;base64," + content);
      dl.setAttribute("download", zipName);
      dl.click();
      console.log("Whole bundle downloaded!", "success", 2000);
    });
  };

  const restoreSession = async (sessionId: string) => {
    const newBundle = {
      ...curBundle,
      currentId: sessionId,
    };
    setLastBundleId(curBundle.bundleId);
    onRestoreSession(newBundle);
    const db = getDatabase();
    try {
      await set(
        ref(db, `sessions/${curBundle.bundleId}`),
        JSON.parse(JSON.stringify(newBundle))
      );

      setNewSessionLabel(getFunName());

      console.log("Session restored.", "success", 2000);
    } catch (error) {
      console.error(error);
      console.log("Error while restoring session", "error", 2000);
    }
  };

  const deleteSession = async (sessionId: string) => {
    // Uncomment the following section if you're using a backend to store sessions
    // try {
    //   await firebase.remove(`sessions/${bundleId}/sessionsInBundle/${sessionId}`);
    //   console.log("Session deleted.", "success", 2000);
    // } catch (error) {
    //   console.error(error);
    //   console.log("Error while deleting session", "error", 2000);
    // }
  };

  const renderSavedSessions = () => {
    const sessions = Object.entries(curBundle.sessionsInBundle || {});
    if (!sessions.length) {
      return null;
    }
    if (sortSession === "date") {
      sessions.sort(([, a]: any, [, b]: any) => b.date - a.date);
    }
    if (sortSession === "label") {
      sessions.sort(([, a]: any, [, b]: any) =>
        a.label > b.label ? 1 : b.label > a.label ? -1 : 0
      );
    }
    const buttons = sessions.map(([id, session]: any) => (
      <li key={id}>
        <span style={{ marginRight: "1ch" }}>{session.label}</span>(
        {new Date(session.date).toLocaleString()})
        {lastBundleId === curBundle.bundleId && id === curBundle.currentId ? (
          <button className="SessionUI btn btn-secondary btn-sm" disabled>
            Restored
          </button>
        ) : (
          <button
            className="SessionUI btn btn-success btn-sm"
            onClick={() => restoreSession(id)}
          >
            Restore
          </button>
        )}
        <button
          onClick={() => deleteSession(id)}
          className="SessionUI btn btn-danger btn-sm"
        >
          Delete
        </button>
      </li>
    ));
    return (
      <div className="SessionUI-sessionlist">
        Sort session by:
        <label>
          <input
            type="radio"
            value="date"
            name="sort"
            checked={sortSession === "date"}
            onChange={(e) => setSortSession(e.target.value)}
          />
          <span>Date</span>
        </label>
        <label>
          <input
            type="radio"
            name="sort"
            value="label"
            checked={sortSession === "label"}
            onChange={(e) => setSortSession(e.target.value)}
          />
          <span>Label</span>
        </label>
        <ol>{buttons}</ol>
      </div>
    );
  };

  const uploadSession = async (event: ChangeEvent<HTMLInputElement>) => {
    const contents = await readFileAsText(event.target.files![0]);
    onRestoreSession(JSON.parse(contents as string));
    if (!withGenomePicker) {
      console.log("Session uploaded and restored.", "success", 2000);
    }
  };
  const setRandomLabel = () => {
    setNewSessionLabel(getFunName());
  };
  function _restoreViewRegion(object: any, regionSetView: RegionSet) {
    const genomeConfig = getGenomeConfig(object.genomeName);
    if (!genomeConfig) {
      return null;
    }

    let viewInterval;
    if ("viewRegion" in object) {
      viewInterval = OpenInterval.deserialize(object.viewRegion);
    } else {
      viewInterval = genomeConfig.navContext.parse(object.displayRegion);
    }
    if (regionSetView) {
      return new DisplayedRegionModel(
        regionSetView.makeNavContext(),
        ...viewInterval
      );
    } else {
      return new DisplayedRegionModel(genomeConfig.navContext, ...viewInterval);
    }
  }

  const retrieveSession = async (retrieveId: string) => {
    console.log(retrieveId);
    const bundleRes = await onRetrieveSession(retrieveId);
    console.log(bundleRes);
    onRetrieveBundle(bundleRes);
  };
  const styles = {
    container: {
      padding: "20px",
      display: withGenomePicker ? "flex" : "block",
      flexDirection: withGenomePicker ? "column" : "unset",
      alignItems: withGenomePicker ? "center" : "unset",
    },
    inputContainer: {
      marginBottom: "1rem",
    },
    label: {
      display: "flex",
      gap: "0.5rem",
      alignItems: "center",
    },
    input: {
      padding: "10px",
      border: "1px solid #ccc",
      borderRadius: "5px",
      width: "400px",
      color: "#4B5563",
    },
    button: {
      backgroundColor: "#5BA4CF",
      color: "white",
      padding: "10px 20px",
      borderRadius: "5px",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    buttonHover: {
      backgroundColor: "#4A93BE",
    },
    uploadContainer: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      marginTop: "1rem",
    },
    uploadButtonContainer: {
      position: "relative",
    },
    uploadButton: {
      backgroundColor: "#5CB85C",
      color: "white",
      padding: "10px 20px",
      borderRadius: "5px",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    uploadInput: {
      position: "absolute",
      inset: 0,
      opacity: 0,
      cursor: "pointer",
    },
    additionalActions: {
      flexDirection: "column",
      gap: "0.5rem",
    },
    actionButton: {
      padding: "10px 20px",
      borderRadius: "5px",
      color: "white",
      cursor: "pointer",
    },
    disclaimer: {
      marginTop: "1rem",
      maxWidth: "600px",
      fontStyle: "italic",
    },
    emphasis: {
      fontWeight: "bold",
    },
    link: {
      color: "#3B82F6",
      textDecoration: "none",
      transition: "color 0.2s",
    },
    linkHover: {
      color: "#1D4ED8",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.inputContainer}>
        <label style={styles.label}>
          <input
            type="text"
            style={styles.input}
            placeholder="Session bundle Id"
            value={retrieveId}
            onChange={(e) => setRetrieveId(e.target.value.trim())}
          />
          <button
            style={styles.button}
            onMouseOver={(e) =>
              (e.target.style.backgroundColor =
                styles.buttonHover.backgroundColor)
            }
            onMouseOut={(e) =>
              (e.target.style.backgroundColor = styles.button.backgroundColor)
            }
            onClick={() => retrieveSession(retrieveId)}
          >
            Retrieve
          </button>
        </label>
        <div style={styles.uploadContainer}>
          <span>Or use a session file:</span>
          <div style={styles.uploadButtonContainer}>
            <button
              style={styles.uploadButton}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#4CA84C")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#5CB85C")}
            >
              Upload
            </button>
            <input
              type="file"
              style={styles.uploadInput}
              onChange={uploadSession}
            />
          </div>
        </div>
      </div>
      {!withGenomePicker && (
        <>
          <div style={styles.inputContainer}>
            <p style={styles.label}>
              Session bundle Id: {curBundle.bundleId}
              <CopyToClip value={curBundle.bundleId} />
            </p>
            <label
              style={{
                ...styles.label,
                flexDirection: "column",
                alignItems: "start",
              }}
            >
              Name your session:
              <input
                type="text"
                value={newSessionLabel}
                style={{ ...styles.input, width: "auto", flex: "1" }}
                onChange={(e) => setNewSessionLabel(e.target.value.trim())}
              />
              <span>or use a</span>
              <button
                type="button"
                style={{ ...styles.button, backgroundColor: "#F0AD4E" }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#EC971F")
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor =
                    styles.button.backgroundColor)
                }
                onClick={() => setNewSessionLabel(getFunName())}
              >
                Random name
              </button>
            </label>
          </div>
          <div style={styles.additionalActions}>
            <button
              style={{ ...styles.actionButton, backgroundColor: "#4285F4" }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#3367D6")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#4285F4")}
              onClick={saveSession}
            >
              Save session
            </button>
            <button
              style={{ ...styles.actionButton, backgroundColor: "#5CB85C" }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#4CA84C")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#5CB85C")}
              onClick={downloadAsSession}
            >
              Download current session
            </button>
            <button
              style={{ ...styles.actionButton, backgroundColor: "#5BA4CF" }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#4A93BE")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#5BA4CF")}
              onClick={downloadAsHub}
            >
              Download as datahub
            </button>
            <button
              style={{ ...styles.actionButton, backgroundColor: "#F0AD4E" }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#EC971F")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#F0AD4E")}
              onClick={downloadWholeBundle}
            >
              Download whole bundle
            </button>
          </div>
        </>
      )}
      {renderSavedSessions()}
      <div style={styles.disclaimer}>
        Disclaimer: please use <span style={styles.emphasis}>sessionFile</span>{" "}
        or <span style={styles.emphasis}>hub</span> URL for publishing using the
        Browser. Session id is supposed to be shared with trusted people only.
        Please check our docs for{" "}
        <a
          href={HELP_LINKS.publish}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.link}
          onMouseOver={(e) => (e.target.style.color = styles.linkHover.color)}
          onMouseOut={(e) => (e.target.style.color = styles.link.color)}
        >
          Publish with the browser
        </a>
        . Thank you!
      </div>
    </div>
  );
};

function getFunName() {
  const adjectives = [
    "Crazy",
    "Excited",
    "Amazing",
    "Adventurous",
    "Acrobatic",
    "Adorable",
    "Arctic",
    "Astonished",
    "Awkward",
    "Awesome",
    "Beautiful",
    "Boring",
    "Bossy",
    "Bright",
    "Clever",
    "Confused",
    "Crafty",
    "Enchanted",
    "Evil",
    "Exhausted",
    "Small",
    "Large",
    "Fabulous",
    "Funny",
    "Glamorous",
    "Glistening",
    "Glittering",
    "Great",
    "Handsome",
    "Happy",
    "Honest",
    "Humongous",
    "Hungry",
    "Incredible",
    "Intelligent",
    "Jumbo",
    "Lazy",
    "Lonely",
    "Lucky",
    "Magnificent",
    "Majestic",
    "Marvelous",
    "Memorable",
    "Mysterious",
    "Nervous",
    "Outstanding",
    "Peaceful",
    "Perfect",
    "Pesky",
    "Playful",
    "Powerful",
    "Quarrelsome",
    "Radiant",
    "Scholarly",
    "Scientific",
    "Silly",
    "Smart",
    "Splendid",
    "Spotted",
    "Strange",
    "Terrific",
    "Unlucky",
    "Vibrant",
    "Whimsical",
  ];

  const colors = [
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "indigo",
    "violet",
    "brown",
    "gray",
    "black",
    "white",
    "turquiose",
    "amber",
    "apricot",
    "aquamarine",
    "beige",
    "bronze",
    "silver",
    "gold",
    "carmine",
    "charcoal",
    "chartreuse",
    "copper",
    "cyan",
    "eggplant",
    "emerald",
    "pink",
    "lavendar",
    "lilac",
    "lime",
    "lemon",
    "peach",
    "periwinkle",
    "rose",
    "rainbow",
    "magenta",
    "salmon",
    "sapphire",
    "scarlet",
    "slate",
    "tangerine",
    "teal",
    "topaz",
  ];

  const nouns = [
    "elephant",
    "buffalo",
    "squirrel",
    "otter",
    "dragon",
    "unicorn",
    "hippo",
    "hippogriff",
    "phoenix",
    "centaur",
    "octopus",
    "squid",
    "platypus",
    "niffler",
    "troll",
    "griffin",
    "slug",
    "eagle",
    "owl",
    "horse",
    "rhino",
    "lion",
    "lynx",
    "porcupine",
    "snake",
    "bull",
    "dog",
    "wolf",
    "lizard",
    "wallaby",
    "opossum",
    "alligator",
    "badger",
    "beaver",
    "bison",
    "goose",
    "turtle",
    "turtoise",
    "turkey",
    "pelican",
    "walrus",
    "anteater",
    "bandicoot",
    "fox",
    "whale",
    "dolphin",
    "bat",
    "dog",
    "cat",
    "bear",
    "moose",
    "swan",
    "spider",
    "monkey",
    "lemur",
    "marmoset",
    "kangaroo",
    "deer",
    "flamingo",
    "ferret",
    "stork",
    "deer",
    "macaw",
    "duck",
    "shark",
    "chinchilla",
    "python",
    "aardvark",
    "toad",
    "frog",
    "lizard",
    "ant",
    "bear",
    "buffalo",
    "caterpillar",
    "dingo",
    "mouse",
    "rat",
    "donkey",
    "dragonfly",
    "duck",
    "crocodile",
    "penguin",
    "leopard",
    "tiger",
    "jaguar",
    "coyote",
    "crab",
    "eel",
    "tamarin",
    "seal",
    "gharial",
    "clam",
    "panda",
    "beetle",
    "goat",
    "hyena",
    "jellyfish",
    "iguana",
    "liger",
    "tigon",
    "llama",
    "lobster",
    "lynx",
    "manatee",
    "newt",
    "ostrich",
    "oyster",
    "puma",
    "rabbit",
    "scorpion",
    "sloth",
    "stingray",
    "zonkey",
  ];

  const getRandomElement = (array: string[]) =>
    array[Math.floor(Math.random() * array.length)];

  return `${getRandomElement(adjectives)}-${getRandomElement(
    colors
  )}-${getRandomElement(nouns)}`;
}

export default SessionUI;
