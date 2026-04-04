import React, { useState, ChangeEvent } from "react";

import JSZip from "jszip";
import _ from "lodash";
import { generateUUID, GenomeCoordinate } from "wuepgg3-track";
import { child, get, getDatabase, ref, remove, set } from "firebase/database";
import {
  AppStateSaver,
  ITrackModel,
  DisplayedRegionModel,
  getGenomeConfig,
  readFileAsText,
  HELP_LINKS,
  CopyToClip,
  TrackModel,
  RegionSet,
} from "wuepgg3-track";
import "./SessionUI.css";
import useExpandedNavigationTab from "@/lib/hooks/useExpandedNavigationTab";

export interface BundleProps {
  bundleId: string | null;
  customTracksPool: any[]; // use appropriate types if you know specifics, or use unknown[] for any type
  darkTheme: boolean;
  genomeName: string;
  highlights: Array<any>;
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
  title?: string;
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
  if (!retrieveId || retrieveId.length === 0) {
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
            genomeId: object.genomeId
              ? object.genomeId
              : object.genomeName
                ? object.genomeName
                : object.name
                  ? object.name
                  : object.id
                    ? object.id
                    : null,
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
            title: object.title ? object.title : "Untitled Session",
          };

          // Replace the state key with the newBundle in the session.
          res.sessionsInBundle[curId].state = newBundle;
        }
      }

      return res;
    } else {
      console.log(
        "No data available for the provided Session Bundle ID.",
        "error",
        2000,
      );
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
  useExpandedNavigationTab()
  const [newSessionLabel, setNewSessionLabel] = useState<string>(
    curBundle.title && curBundle.title !== "Untitled Session"
      ? curBundle.title
      : getFunName(),
  );
  const [retrieveId, setRetrieveId] = useState<string>("");
  const [lastBundleId, setLastBundleId] = useState<string>(bundleId);
  const [sortSession, setSortSession] = useState<string>("date"); // or label
  const [bundle, setBundle] = useState<{ [key: string]: any }>(
    curBundle ? curBundle : {},
  );
  const saveSession = async () => {
    const newSessionObj = {
      label: newSessionLabel ? newSessionLabel : "Untitled Session",
      date: Date.now(),
      state: state ? state : {},
    };

    const sessionId = generateUUID();
    let curBundleId;
    if (!bundle || !bundle.bundleId) {
      curBundleId = generateUUID();
    } else {
      curBundleId = bundle.bundleId;
    }

    if (!curBundleId || curBundleId.length === 0) {
      console.log("Session bundle ID cannot be empty.", "error", 2000);
      return null;
    }
    let newBundle = {
      bundleId: curBundleId,
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
      // Get all existing sessions before setting the new one
      // for checking most recent session update for those
      // that didn't save their id

      // const dbRef = ref(db, `sessions/`);
      // const snapshot = await get(dbRef);

      // let existingSessions = null;
      // if (snapshot.exists()) {
      //   existingSessions = snapshot.val();

      //   // Convert to array for sorting
      //   const sessionsArray = Object.entries(existingSessions).map(
      //     ([bundleId, bundleData]: [string, any]) => {
      //       let mostRecentDate = 0;

      //       // Find the most recent date in this bundle's sessionsInBundle
      //       if (
      //         bundleData.sessionsInBundle &&
      //         typeof bundleData.sessionsInBundle === "object"
      //       ) {
      //         mostRecentDate = Math.max(
      //           ...Object.values(bundleData.sessionsInBundle).map(
      //             (session: any) => session.date || 0
      //           )
      //         );
      //       }

      //       return {
      //         bundleId,
      //         bundleData,
      //         mostRecentDate,
      //       };
      //     }
      //   );

      //   // Sort by most recent date (newest first)
      //   sessionsArray.sort((a, b) => b.mostRecentDate - a.mostRecentDate);

      //   console.log(
      //     "Existing sessions sorted bsy most recent date:",
      //     sessionsArray.map((s) => ({
      //       bundleId: s.bundleId,
      //       mostRecentDate: new Date(s.mostRecentDate).toLocaleString("en-US", {
      //         month: "long",
      //         day: "numeric",
      //         hour: "numeric",
      //         minute: "2-digit",
      //         year: "numeric",
      //       }),
      //       sessions: Object.entries(s.bundleData.sessionsInBundle || {}).map(
      //         ([sessionId, session]: [string, any]) => ({
      //           sessionId,
      //           label: session.label,
      //           trackCount: session.state?.tracks?.length || 0,
      //         })
      //       ),
      //       data: s,
      //     }))
      //   );

      //   console.log(
      //     "Bundle IDs in sorted order:",
      //     sessionsArray.map((s) => s.bundleId)
      //   );
      // } else {
      //   console.log("No existing sessions found");
      // }

      // Now set the new bundle
      await set(
        ref(db, `sessions/${curBundleId}`),
        JSON.parse(JSON.stringify(newBundle)),
      );

      console.log("Session saved!", "success", 2000);
    } catch (error) {
      console.error(error);
      console.log("Error while saving session", "error", 2000);
    }

    setNewSessionLabel(getFunName());
    setLastBundleId(curBundleId);
  };

  const downloadSession = (asHub = false) => {
    if (state) {
      state["bundleId"] = bundle.bundleId;

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
        `eg-${descriptor}-${bundle.currentId}-${bundle.bundleId}.json`,
      );
      dl.click();
      console.log("Session downloaded!", "success", 2000);
    }
  };

  const downloadAsSession = () => {
    downloadSession(false);
  };

  const downloadAsHub = () => {
    downloadSession(true);
  };

  const downloadWholeBundle = () => {
    const { sessionsInBundle } = bundle;
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
        JSON.stringify(session.state) + "\n",
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
      const sessionBundle = {
        ...newBundle.sessionsInBundle[`${curSessionId}`].state,
      };

      sessionBundle["title"] = newBundle.sessionsInBundle[curSessionId].label;

      onRestoreSession(sessionBundle);
      onRetrieveBundle(newBundle);
      const db = getDatabase();
      if (!bundle.bundleId || bundle.bundleId.length === 0) {
        console.log("Session bundle ID cannot be empty.", "error", 2000);
        return null;
      }
      try {
        await set(
          ref(db, `sessions/${bundle.bundleId}`),
          JSON.parse(JSON.stringify(newBundle)),
        );

        setNewSessionLabel("");

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

    if (bundle) {
      if (!bundle.bundleId || bundle.bundleId.length === 0) {
        console.log("Session bundle ID cannot be empty.", "error", 2000);
        return null;
      }
    }
    try {
      await remove(
        ref(db, `sessions/${bundle.bundleId}/sessionsInBundle/${sessionId}`),
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
          a.label > b.label ? 1 : b.label > a.label ? -1 : 0,
        );
      }
      const buttons = sessions.map(([id, session]: any) => {
        let button;
        if (lastBundleId === bundle.bundleId && id === bundle.currentId) {
          button = (
            <button className="SessionUI btn btn-secondary btn-sm" disabled={true}>
              Restored
            </button>
          );
        } else {
          button = (
            <button className="SessionUI btn btn-success btn-sm" onClick={() => restoreSession(id)}>
              Restore
            </button>
          );
        }
        const deleteButton = (
          <button onClick={() => deleteSession(id)} className="SessionUI btn btn-danger btn-sm">
            Delete
          </button>
        );
        return (
          <li key={id}>
            <span style={{ marginRight: "1ch" }}>{session.label}</span>(
            {new Date(session.date).toLocaleString()}){button}
            {deleteButton}
          </li>
        );
      });
      return (
        <div className="SessionUI-sessionlist">
          Sort session by: <label>
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
        }
        if (viewInterval) {
          bundleSession["viewRegion"] = new DisplayedRegionModel(
            genomeConfig.navContext,
            viewInterval.start,
            viewInterval.end,
          );
        }
        onRestoreSession(bundleSession);
      } else {
        console.log("Genome not found in session upload");
      }
    }
  };

  // function _restoreViewRegion(object: any, regionSetView: RegionSet) {
  //   const genomeConfig = getGenomeConfig(object.genomeName);
  //   if (!genomeConfig) {
  //     return null;
  //   }

  //   let viewInterval;
  //   if ("viewRegion" in object) {
  //     viewInterval = OpenInterval.deserialize(object.viewRegion);
  //   } else {
  //     viewInterval = genomeConfig.navContext.parse(object.displayRegion);
  //   }
  //   if (regionSetView) {
  //     return new DisplayedRegionModel(
  //       regionSetView.makeNavContext(),
  //       ...viewInterval,
  //     );
  //   } else {
  //     return new DisplayedRegionModel(genomeConfig.navContext, ...viewInterval);
  //   }
  // }

  const retrieveBundle = async (retrieveBundleId: string) => {
    const bundleRes = await onRetrieveSession(retrieveBundleId);

    if (bundleRes) {
      bundleRes["currentId"] = null;
      setLastBundleId(bundleRes.bundleId);
      setBundle(bundleRes);
      onRetrieveBundle(bundleRes);
    }
  };


  return (
    <div className="px-2 py-4 " style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div>
        <label htmlFor="retrieveId">
          <input
            type="text"
            size={30}
            placeholder="Session bundle Id"
            value={retrieveId}
            onChange={(e) => setRetrieveId(e.target.value.trim())}
            className="SessionUI-input"
          />
        </label>
        <button className="SessionUI btn btn-info" onClick={() => retrieveBundle(retrieveId)}>
          Retrieve
        </button>

      </div>
      <div className="SessionUI-upload-btn-wrapper">
        Or use a session file: <button className="SessionUI btn btn-success">Upload</button>
        <input type="file" name="sessionfile" onChange={uploadSession} />
      </div>
      {
        !withGenomePicker && (
          <React.Fragment>
            <div>
              <p>
                Session bundle Id:{" "}
                {bundle && bundle.bundleId
                  ? <><span>{bundle.bundleId}</span>{" "}<CopyToClip value={bundle.bundleId} /></>
                  : <span className="font-italic" style={{ color: "#888" }}>Save a session and a bundle ID will generate here.</span>
                }
              </p>
              <label htmlFor="sessionLabel">
                Name your session:{" "}
                <input
                  type="text"
                  value={newSessionLabel}
                  size={15}
                  onChange={(e) => setNewSessionLabel(e.target.value.trim())}
                  className="SessionUI-input"
                />{" "}
                or use a{" "}
                <button
                  type="button"
                  className="SessionUI btn btn-warning btn-sm"
                  onClick={() => setNewSessionLabel(getFunName())}
                >
                  {" "}
                  Random name
                </button>
              </label>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", marginTop: "4px" }}>
              <button className="SessionUI btn btn-primary" onClick={saveSession}>
                Save session
              </button>
              <button className="SessionUI btn btn-success" onClick={downloadAsSession}>
                Download current session
              </button>
              <button className="SessionUI btn btn-info" onClick={downloadAsHub}>
                Download as datahub
              </button>
              <button className="SessionUI btn btn-warning" onClick={downloadWholeBundle}>
                Download whole bundle
              </button>
            </div>
          </React.Fragment>
        )
      }
      {renderSavedSessions()}
      <div className="font-italic" style={{ maxWidth: "600px" }}>
        Disclaimer: please use <span className="font-weight-bold">sessionFile</span> or{" "}
        <span className="font-weight-bold">hub</span> URL for publishing using the Browser. Session id is
        supposed to be shared with trusted people only. Please check our docs for{" "}
        <a href={HELP_LINKS.publish} target="_blank" rel="noopener noreferrer">
          Publish with the browser
        </a>
        . Thank you!
      </div>
    </div >
  );
};

export function getFunName() {
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
    colors,
  )}-${getRandomElement(nouns)}`;
}

export default SessionUI;
