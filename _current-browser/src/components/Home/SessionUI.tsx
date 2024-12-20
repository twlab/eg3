import React, { useState, useEffect, ChangeEvent, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import JSZip from "jszip";
import _ from "lodash";
import { child, get, getDatabase, ref, set } from "firebase/database";
import { readFileAsText, HELP_LINKS } from "@/models/util";
import { CopyToClip } from "../GenomeView/TrackComponents/commonComponents/CopyToClipboard";
import "./SessionUI.css";
import { TrackState } from "../GenomeView/TrackComponents/CommonTrackStateChangeFunctions.tsx/createNewTrackState";
import TrackModel from "@/models/TrackModel";
import RegionSet from "@/models/RegionSet";
import { getGenomeConfig } from "@/models/genomes/allGenomes";
import OpenInterval from "@/models/OpenInterval";
import DisplayedRegionModel from "@/models/DisplayedRegionModel";

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
  withGenomePicker?: boolean;
  state?: TrackState;
  curBundle?: any;
  addSessionState: any;
}

const SessionUI: React.FC<SessionUIProps> = ({
  onRestoreSession,
  onRetrieveBundle,
  withGenomePicker,
  state,
  curBundle,
  addSessionState,
}) => {
  const [newSessionLabel, setNewSessionLabel] = useState<string>(getFunName());
  const [retrieveId, setRetrieveId] = useState<string>("");
  const [lastBundleId, setLastBundleId] = useState<string>(
    curBundle.currentId !== "none" ? state!.bundleId : "none"
  );
  const [sortSession, setSortSession] = useState<string>("date"); // or label

  const saveSession = async () => {
    const newSessionObj = {
      label: newSessionLabel,
      date: Date.now(),
      state: state, // Replace with actual state
    };
    const sessionId = uuidv4();
    console.log(state);
    let newBundle = {
      bundleId: curBundle.bundleId,
      currentId: sessionId,
      sessionsInBundle: {
        ...curBundle.sessionsInBundle,
        [sessionId]: newSessionObj,
      },
    };
    addSessionState(newBundle);

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
    console.log("ASDASDASDASD");
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
  const retrieveSession = () => {
    if (retrieveId.length === 0) {
      console.log("Session bundle Id cannot be empty.", "error", 2000);
      return null;
    }
    console.log(retrieveId);
    const dbRef = ref(getDatabase());
    get(child(dbRef, `sessions/${retrieveId}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          let res = snapshot.val();
          for (let curId in res.sessionsInBundle) {
            if (res.sessionsInBundle.hasOwnProperty(curId)) {
              let object = res.sessionsInBundle[curId].state;
              console.log(object);

              const regionSets = object.regionSets
                ? object.regionSets.map(RegionSet.deserialize)
                : [];
              const regionSetView =
                regionSets[object.regionSetViewIndex] || null;

              // Create the newBundle object based on the existing object.
              let newBundle = {
                genomeName: object.genomeName,
                viewRegion: new DisplayedRegionModel(
                  getGenomeConfig(object.genomeName).navContext,
                  object.viewRegion._startBase,
                  object.viewRegion._endBase
                ),

                tracks: object.tracks.map((data) =>
                  TrackModel.deserialize(data)
                ),
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
          onRetrieveBundle(res);
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <div className={`p-5 ${withGenomePicker ? 'flex flex-col items-center' : 'block'}`}>
      <div className="mb-4">
        <label className="flex gap-2 items-center">
          <input
            type="text"
            className="px-3 py-2 border rounded-md w-[400px] text-gray-600 placeholder-gray-400"
            placeholder="Session bundle Id"
            value={retrieveId}
            onChange={(e) => setRetrieveId(e.target.value.trim())}
          />
          <button 
            className="bg-[#5BA4CF] text-white px-6 py-2 rounded-md hover:bg-[#4A93BE]"
            onClick={retrieveSession}
          >
            Retrieve
          </button>
        </label>

        <div className="mt-4 flex items-center gap-2">
          <span>Or use a session file:</span>
          <div className="relative">
            <button className="bg-[#5CB85C] text-white px-6 py-2 rounded-md hover:bg-[#4CA84C]">
              Upload
            </button>
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={uploadSession}
            />
          </div>
        </div>
      </div>

      {!withGenomePicker && (
        <>
          <div className="mb-4">
            <p className="flex items-center gap-2 mb-4">
              Session bundle Id: {curBundle.bundleId}
              <CopyToClip value={curBundle.bundleId} />
            </p>
            
            <label className="flex flex-col items-start gap-2">
              Name your session:
              <input
                type="text"
                value={newSessionLabel}
                className="px-3 py-2 border rounded-md flex-1"
                onChange={(e) => setNewSessionLabel(e.target.value.trim())}
              />
              <span>or use a</span>
              <button
                type="button"
                className="bg-[#F0AD4E] text-white px-4 py-2 rounded-md hover:bg-[#EC971F]"
                onClick={() => setNewSessionLabel(getFunName())}
              >
                Random name
              </button>
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <button 
              className="bg-[#4285F4] text-white px-6 py-2 rounded-md hover:bg-[#3367D6]"
              onClick={saveSession}
            >
              Save session
            </button>
            
            <button
              className="bg-[#5CB85C] text-white px-6 py-2 rounded-md hover:bg-[#4CA84C]"
              onClick={downloadAsSession}
            >
              Download current session
            </button>
            
            <button 
              className="bg-[#5BA4CF] text-white px-6 py-2 rounded-md hover:bg-[#4A93BE]"
              onClick={downloadAsHub}
            >
              Download as datahub
            </button>
            
            <button
              className="bg-[#F0AD4E] text-white px-6 py-2 rounded-md hover:bg-[#EC971F]"
              onClick={downloadWholeBundle}
            >
              Download whole bundle
            </button>
          </div>
        </>
      )}

      {renderSavedSessions()}

      <div className="mt-4 max-w-[600px] italic">
        Disclaimer: please use{" "}
        <span className="font-bold">sessionFile</span> or{" "}
        <span className="font-bold">hub</span> URL for publishing using
        the Browser. Session id is supposed to be shared with trusted people
        only. Please check our docs for{" "}
        <a 
          href={HELP_LINKS.publish} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700"
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
