import React, { useState, ChangeEvent } from "react";

import JSZip from "jszip";
import _ from "lodash";
import { generateUUID, Genome, GenomeCoordinate } from "wuepgg3-track";
import { child, get, getDatabase, ref, remove, set } from "firebase/database";
import {
  AppStateSaver,
  ITrackModel,
  HighlightInterval,
  DisplayedRegionModel,
  OpenInterval,
  getGenomeConfig,
  readFileAsText,
  HELP_LINKS,
  CopyToClip,
  TrackModel,
  RegionSet,
} from "wuepgg3-track";
import "./SessionUI.css";

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
  viewRegion: GenomeCoordinate | null;
  trackLegendWidth: number;
  tracks: Array<TrackModel> | Array<ITrackModel>;
  chromosomes: Array<any> | null;
  customGenome: any | null;
  genomeId: string | null;
  viewInterval: { start: number; end: number } | null;
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
    console.log("Session bundle ID cannot be empty.", "error", 2000);
    return null;
  }

  const dbRef = ref(getDatabase());
  try {
    const snapshot = await get(child(dbRef, `sessions/${retrieveId}`));
    if (snapshot.exists()) {
      let res = snapshot.val();

      for (let curId in res.sessionsInBundle) {
        if (res.sessionsInBundle.hasOwnProperty(curId)) {
          let object = res.sessionsInBundle[curId].state;

          const regionSets = object.regionSets
            ? object.regionSets.map(RegionSet.deserialize)
            : [];
          const regionSetView = regionSets[object.regionSetViewIndex] || null;

          // Create the newBundle object based on the existing object.

          let viewInterval;
          if (object.viewInterval) {
            viewInterval = object.viewInterval;
          } else {
            viewInterval = {
              start: 0,
              end: 1,
            };
          }
          let newBundle = {
            genomeId: object.genomeId,
            viewInterval,
            chromosomes: object.chromosomes || null,
            tracks: object.tracks,
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
            viewRegion: object.viewRegion,
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
  const [bundle, setBundle] = useState<{ [key: string]: any }>(
    curBundle ? curBundle : {}
  );
  const saveSession = async () => {
    const newSessionObj = {
      label: newSessionLabel,
      date: Date.now(),
      state: state ? state : {},
    };

    const sessionId = generateUUID();

    let newBundle = {
      bundleId: bundle.bundleId,
      currentId: sessionId,
      sessionsInBundle: {
        ...bundle.sessionsInBundle,
        [sessionId]: newSessionObj,
      },
    };

    setBundle(newBundle);
    updateBundle(newBundle);
    const db = getDatabase();
    try {
      await set(
        ref(db, `sessions/${bundle.bundleId}`),
        JSON.parse(JSON.stringify(newBundle))
      );
      setNewSessionLabel(getFunName());
      console.log("Session saved!", "success", 2000);
    } catch (error) {
      console.error(error);
      console.log("Error while saving session", "error", 2000);
    }

    setRandomLabel();
    setLastBundleId(bundle.bundleId);
  };

  const downloadSession = (asHub = false) => {
    const sessionInJSON = new AppStateSaver().toObject(state);
    const content = asHub ? (sessionInJSON as any).tracks : sessionInJSON;
    const descriptor = asHub ? "hub" : "session";
    const sessionString =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(content));
    const dl = document.createElement("a");
    document.body.appendChild(dl); // This line makes it work in Firefox.
    dl.setAttribute("href", sessionString);
    dl.setAttribute(
      "download",
      `eg-${descriptor}-${bundle.currentId}-${bundle.bundleId}.json`
    );
    dl.click();
    console.log("Session downloaded!", "success", 2000);
  };

  const downloadAsSession = () => {
    downloadSession(false);
  };

  const downloadAsHub = () => {
    downloadSession(true);
  };

  const downloadWholeBundle = () => {
    const { sessionsInBundle, bundleId } = bundle;
    if (_.isEmpty(sessionsInBundle)) {
      console.log("Session bundle is empty, skipping...", "error", 2000);
      return;
    }
    const zip = new JSZip();
    const zipName = `${bundle.bundleId}.zip`;
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
    if (sessionId) {
      const newBundle: any = {
        ...bundle,
        currentId: sessionId,
      };

      setBundle(newBundle);
      setLastBundleId(bundle.bundleId);

      const curSessionId = newBundle.currentId;
      const sessionBundle = newBundle.sessionsInBundle[`${curSessionId}`].state;

      onRestoreSession(sessionBundle);
      onRetrieveBundle(newBundle);
      const db = getDatabase();
      try {
        await set(
          ref(db, `sessions/${bundle.bundleId}`),
          JSON.parse(JSON.stringify(newBundle))
        );

        setNewSessionLabel(getFunName());

        console.log("Session restored.", "success", 2000);
      } catch (error) {
        console.error(error);
        console.log("Error while restoring session", "error", 2000);
      }
    }
  };

  const deleteSession = async (sessionId: string) => {
    const db = getDatabase();
    let newBundle = _.cloneDeep(bundle);
    if (
      newBundle &&
      newBundle.sessionsInBundle &&
      sessionId in newBundle.sessionsInBundle
    ) {
      delete newBundle.sessionsInBundle[`${sessionId}`];
      setBundle(newBundle);
    }

    if (bundle)
      try {
        await remove(
          ref(db, `sessions/${bundle.bundleId}/sessionsInBundle/${sessionId}`)
        );
        console.log("Session deleted.", "success", 2000);
      } catch (error) {
        console.error(error);
        console.log("Error while deleting session", "error", 2000);
      }
  };

  const renderSavedSessions = () => {
    if (bundle) {
      const sessions = Object.entries(bundle.sessionsInBundle || {});
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
          {lastBundleId === bundle.bundleId && id === bundle.currentId ? (
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
    }
  };
  // fix because when download as current session we get back bundleSession which as viewinterval instead of viewregion
  const uploadSession = async (event: ChangeEvent<HTMLInputElement>) => {
    const contents: any = (await readFileAsText(event.target.files![0])) as {
      [key: string]: any;
    };
    const bundleSession = JSON.parse(contents as string);
    const bundleRes = await onRetrieveSession(bundleSession.bundleId);

    if (bundleRes) {
      onRetrieveBundle(bundleRes);
      setBundle(bundleRes);
      const genomeConfig = getGenomeConfig(bundleSession.genomeName);
      if (genomeConfig) {
        let viewInterval;
        if (bundleSession.viewInterval) {
          viewInterval = bundleSession.viewInterval;
        } else {
          viewInterval = {
            start: genomeConfig.defaultRegion.start,
            end: genomeConfig.defaultRegion.end,
          };
        }
        if (viewInterval) {
          bundleSession["viewRegion"] = new DisplayedRegionModel(
            genomeConfig.navContext,
            viewInterval.start,
            viewInterval.end
          );
        }
        onRestoreSession(bundleSession);
      } else {
        console.log("Genome not found in session upload");
      }
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
    const bundleRes = await onRetrieveSession(retrieveId);
    if (bundleRes) {
      setBundle(bundleRes);
      onRetrieveBundle(bundleRes);
    }
  };
  const styles = {
    container: {
      width: "100%",
      maxWidth: "800px",
      margin: "0 auto",
      padding: "20px",
      background: "#fff",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      borderRadius: "8px",
    },
    inputContainer: {
      marginBottom: "20px",
    },
    label: {
      display: "block",
      fontWeight: "bold",
      marginBottom: "8px",
    },
    row: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    input: {
      padding: "10px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      flex: "1",
    },
    button: {
      padding: "10px 15px",
      border: "none",
      borderRadius: "4px",
      backgroundColor: "#007bff",
      color: "white",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "5px",
    },
    buttonHover: {
      backgroundColor: "#0056b3",
    },
    uploadContainer: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginTop: "20px",
    },
    uploadButtonWrapper: {
      position: "relative",
    },
    uploadButton: {
      padding: "10px 15px",
      border: "1px solid",
      borderRadius: "4px",
      backgroundColor: "#5cb85c",
      color: "white",
      cursor: "pointer",
    },
    uploadButtonHover: {
      backgroundColor: "#4ca84c",
    },
    uploadInput: {
      position: "absolute",
      left: "0",
      top: "0",
      opacity: "0",
      width: "100%",
      height: "100%",
      cursor: "pointer",
    },
    separator: {
      borderTop: "1px solid #eee",
      margin: "20px 0",
    },
    additionalActions: {
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      marginTop: "20px",
    },
    actionButton: {
      padding: "10px 15px",
      border: "1px solid",
      borderRadius: "4px",
      background: "white",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "5px",
    },
    actionButtonColors: {
      save: {
        borderColor: "#4285F4",
        color: "#4285F4",
        hover: {
          backgroundColor: "#4285F4",
          color: "white",
        },
      },
      downloadSession: {
        borderColor: "#5CB85C",
        color: "#5CB85C",
        hover: {
          backgroundColor: "#5CB85C",
          color: "white",
        },
      },
      downloadHub: {
        borderColor: "#5BA4CF",
        color: "#5BA4CF",
        hover: {
          backgroundColor: "#5BA4CF",
          color: "white",
        },
      },
      downloadBundle: {
        borderColor: "#F0AD4E",
        color: "#F0AD4E",
        hover: {
          backgroundColor: "#F0AD4E",
          color: "white",
        },
      },
    },
    disclaimer: {
      marginTop: "20px",
      padding: "10px",
      background: "#f8f9fa",
      borderRadius: "4px",
    },
    emphasis: {
      fontWeight: "bold",
    },
    link: {
      color: "#007bff",
      textDecoration: "none",
    },
    linkHover: {
      color: "#0056b3",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.inputContainer}>
        <label style={styles.label}>Session Bundle ID</label>
        <div style={styles.row}>
          <input
            type="text"
            style={styles.input}
            placeholder="Session Bundle ID"
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
        </div>
        <div style={styles.uploadContainer}>
          <span>Or use a session file:</span>
          <div style={styles.uploadButtonWrapper}>
            <button
              style={styles.uploadButton}
              onMouseOver={(e) =>
              (e.target.style.backgroundColor =
                styles.uploadButtonHover.backgroundColor)
              }
              onMouseOut={(e) =>
              (e.target.style.backgroundColor =
                styles.uploadButton.backgroundColor)
              }
            >
              Upload
              <input
                type="file"
                style={styles.uploadInput}
                onChange={uploadSession}
              />
            </button>
          </div>
        </div>
        <div style={styles.separator}></div>
        {!withGenomePicker && (
          <>
            <div style={styles.inputContainer}>
              <div style={styles.row}>
                <p style={styles.label}>
                  Session bundle Id:{" "}
                  {bundle && bundle.bundleId ? bundle.bundleId : ""}{" "}
                  <CopyToClip
                    value={bundle && bundle.bundleId ? bundle.bundleId : ""}
                  />
                </p>
              </div>
              <div style={styles.label}>
                <span>Name your session</span>
                <div style={styles.row}>
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
                </div>
              </div>
            </div>
            <div style={styles.additionalActions}>
              <button
                style={{
                  ...styles.actionButton,
                  ...styles.actionButtonColors.save,
                }}
                onMouseOver={(e) => (
                  (e.target.style.backgroundColor =
                    styles.actionButtonColors.save.hover.backgroundColor),
                  (e.target.style.color =
                    styles.actionButtonColors.save.hover.color)
                )}
                onMouseOut={(e) => (
                  (e.target.style.backgroundColor = "white"),
                  (e.target.style.color = styles.actionButtonColors.save.color)
                )}
                onClick={saveSession}
              >
                💾 Save session
              </button>
              <button
                style={{
                  ...styles.actionButton,
                  ...styles.actionButtonColors.downloadSession,
                }}
                onMouseOver={(e) => (
                  (e.target.style.backgroundColor =
                    styles.actionButtonColors.downloadSession.hover.backgroundColor),
                  (e.target.style.color =
                    styles.actionButtonColors.downloadSession.hover.color)
                )}
                onMouseOut={(e) => (
                  (e.target.style.backgroundColor = "white"),
                  (e.target.style.color =
                    styles.actionButtonColors.downloadSession.color)
                )}
                onClick={downloadAsSession}
              >
                ⬇ Download current session
              </button>
              <button
                style={{
                  ...styles.actionButton,
                  ...styles.actionButtonColors.downloadHub,
                }}
                onMouseOver={(e) => (
                  (e.target.style.backgroundColor =
                    styles.actionButtonColors.downloadHub.hover.backgroundColor),
                  (e.target.style.color =
                    styles.actionButtonColors.downloadHub.hover.color)
                )}
                onMouseOut={(e) => (
                  (e.target.style.backgroundColor = "white"),
                  (e.target.style.color =
                    styles.actionButtonColors.downloadHub.color)
                )}
                onClick={downloadAsHub}
              >
                ⬇ Download as datahub
              </button>
              <button
                style={{
                  ...styles.actionButton,
                  ...styles.actionButtonColors.downloadBundle,
                }}
                onMouseOver={(e) => (
                  (e.target.style.backgroundColor =
                    styles.actionButtonColors.downloadBundle.hover.backgroundColor),
                  (e.target.style.color =
                    styles.actionButtonColors.downloadBundle.hover.color)
                )}
                onMouseOut={(e) => (
                  (e.target.style.backgroundColor = "white"),
                  (e.target.style.color =
                    styles.actionButtonColors.downloadBundle.color)
                )}
                onClick={downloadWholeBundle}
              >
                ⬇ Download whole bundle
              </button>
            </div>
          </>
        )}
        {renderSavedSessions()}
        <div style={styles.disclaimer}>
          Disclaimer: please use{" "}
          <span style={styles.emphasis}>sessionFile</span> or{" "}
          <span style={styles.emphasis}>hub</span> URL for publishing using the
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
