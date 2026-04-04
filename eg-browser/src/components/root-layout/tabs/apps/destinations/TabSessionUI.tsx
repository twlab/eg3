import React, { useState, ChangeEvent } from "react";
import {
  BookmarkIcon,
  ArrowPathIcon,
  ArrowTurnDownLeftIcon,
} from "@heroicons/react/24/outline";

import JSZip from "jszip";
import _, { random } from "lodash";
import { motion, AnimatePresence } from "framer-motion";
import { generateUUID, Genome, GenomeCoordinate } from "wuepgg3-track";
import { child, get, getDatabase, ref, remove, set } from "firebase/database";
import {
  AppStateSaver,
  ITrackModel,
  DisplayedRegionModel,
  OpenInterval,
  getGenomeConfig,
  readFileAsText,
  HELP_LINKS,
  TrackModel,
  RegionSet,
} from "wuepgg3-track";
// Using shared Tailwind classes instead of a separate CSS file
import { getFunName } from "./SessionUI";
import Button from "../../../../ui/button/Button";
import FileInput from "@/components/ui/input/FileInput";
import { BrowserSession, upsertSession } from "@/lib/redux/slices/browserSlice";

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

const TabSessionUI: React.FC<SessionUIProps> = ({
  onRestoreSession,
  onRetrieveBundle,
  withGenomePicker,
  updateBundle,

  state,
  curBundle,
  bundleId,
}) => {
  const [retrieveId, setRetrieveId] = useState<string>("");
  const [newSessionLabel, setNewSessionLabel] = useState<string>(
    state?.title && !bundleId && state.title !== "Untitled Session"
      ? state.title
      : "",
  );

  const [lastBundleId, setLastBundleId] = useState<string>(bundleId);
  const [sortSession, setSortSession] = useState<string>("date"); // or label
  const [bundle, setBundle] = useState<{ [key: string]: any }>(
    curBundle ? curBundle : {},
  );
  const [showCreateInput, setShowCreateInput] = useState<boolean>(false);
  const [showFullUI, setShowFullUI] = useState<boolean>(() => !!bundleId);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [codeHover, setCodeHover] = useState<boolean>(false);
  const [saveCurveActive, setSaveCurveActive] = useState<boolean>(false);

  const handleCopyBundleId = async () => {
    const id = bundle && bundle.bundleId ? bundle.bundleId : "";
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1500);
      console.log("Bundle ID copied to clipboard", "success", 1500);
    } catch (e) {
      console.error("Failed to copy bundle ID", e);
    }
  };
  const saveSession = async (): Promise<boolean> => {
    const newSessionObj = {
      label: newSessionLabel ? newSessionLabel : getFunName(),
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
      return false;
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
      setNewSessionLabel("");
      setLastBundleId(curBundleId);
      console.log("Session saved!", "success", 2000);
      return true;
    } catch (error) {
      console.error(error);
      console.log("Error while saving session", "error", 2000);

      return false;
    }
  };

  const handleAttemptSave = async () => {
    const ok = await saveSession();
    if (ok) {
      setShowFullUI(true);
      setShowCreateInput(false);
      setSaveCurveActive(true);
      setTimeout(() => setSaveCurveActive(false), 800);
    } else {
      console.log("Failed to save session", "error", 2000);
    }
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
        return (
          <div className={classes.emptyState}>
            {/* <div style={{ fontSize: "48px", marginBottom: "12px" }}>📝</div> */}
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "18px",
                color: "#333",
                fontWeight: "600",
              }}
            >
              No Sessions Saved
            </h3>
            <p
              style={{
                margin: "0 0 16px 0",
                fontSize: "14px",
                lineHeight: "1.4",
              }}
            >
              Save your sessions and restore them with the "Session Bundle ID".
            </p>
            <div
              style={{
                fontSize: "12px",
                fontStyle: "italic",
                opacity: 0.8,
              }}
            >
              Each session saves your current browser state and view.
            </div>
          </div>
        );
      }
      if (sortSession === "date") {
        sessions.sort(([, a]: any, [, b]: any) => b.date - a.date);
      }
      if (sortSession === "label") {
        sessions.sort(([, a]: any, [, b]: any) =>
          a.label > b.label ? 1 : b.label > a.label ? -1 : 0,
        );
      }
      const buttons = sessions.map(([id, session]: any, index: number) => (
        <li key={id} className={classes.sessionItem}>
          <span className="text-sm font-medium text-black mr-1 ml-6 shrink-0">{index + 1}.</span>
          <span className="flex-1 text-sm">
            <>{session.label}</> -{" "}
            {new Date(session.date).toLocaleString()}
          </span>
          <div className="flex gap-2">
            {lastBundleId === bundle.bundleId && id === bundle.currentId ? (
              <Button
                disabled
                style={{
                  width: "fit-content",
                  padding: "8px 16px",
                  backgroundColor: "#E5E7EB",
                  color: "#6B7280",
                  borderRadius: "6px",
                }}
              >
                Restored
              </Button>
            ) : (
              <Button
                onClick={() => restoreSession(id)}
                style={{
                  width: "fit-content",
                  padding: "8px 16px",
                  backgroundColor: "#E6F7EA",
                  color: "#1F6E3A",
                  borderRadius: "6px",
                }}
              >
                Restore
              </Button>
            )}

            <Button
              onClick={() => deleteSession(id)}
              style={{
                width: "fit-content",
                padding: "8px 16px",
                backgroundColor: "#FDE8E8",
                color: "#8B1C1C",
                borderRadius: "6px",
              }}
            >
              Delete
            </Button>
          </div>
        </li>
      ));
      return (
        <div>
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 mt-3">
            <h1 className="text-md">Sessions In Bundle ({sessions.length}) </h1>

            <div className="flex items-center gap-3">
              <span className="text-md">Sort by:</span>
              <label className="flex items-center gap-1 cursor-pointer text-sm">
                <input
                  type="radio"
                  value="date"
                  name="sort"
                  checked={sortSession === "date"}
                  onChange={(e) => setSortSession(e.target.value)}
                />
                <span>Date</span>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                <input
                  type="radio"
                  name="sort"
                  value="label"
                  checked={sortSession === "label"}
                  onChange={(e) => setSortSession(e.target.value)}
                />
                <span>Name</span>
              </label>
            </div>
          </div>

          {/* Table Body */}
          <ol className=" flex flex-col">
            {buttons}
          </ol>
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
  const handleUploadFile = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BrowserSession;
      if (parsed && parsed.id) {
        dispatch(upsertSession(parsed));
      }
    } catch (err) {
      console.error("Failed to upload session file", err);
    }
  };
  const retrieveBundle = async (retrieveBundleId: string) => {
    const bundleRes = await onRetrieveSession(retrieveBundleId);

    if (bundleRes) {
      bundleRes["currentId"] = null;
      setLastBundleId(bundleRes.bundleId);
      setBundle(bundleRes);
      onRetrieveBundle(bundleRes);
    }
  };
  const classes: any = {

    emptyState:
      "border-2 border-dashed rounded-lg p-8 text-center bg-white text-gray-600 mt-2",
    sessionItem:
      "outline outline-gray-100 rounded-md text-xs flex justify-between items-center bg-white",
    bundleCode:
      "flex-1 text-xs text-gray-900 font-mono overflow-hidden truncate",
    label: "block mb-2",
    row: "flex flex-wrap items-center gap-2",
    additionalActions: "flex flex-wrap gap-2 mt-2",
    disclaimer: "p-3 bg-gray-50 rounded",
    emphasis: "font-semibold",
    link: "text-blue-600 hover:text-blue-800",
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-dark-surface rounded-lg p-3 shadow-sm">
      <div className={classes.inputContainer}>
        {!withGenomePicker && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <input
                type="text"

                className="w-70 h-9 px-2  outline outline-gray-300 rounded-md bg-white text-sm truncate"
                placeholder="Session Bundle ID"
                value={retrieveId}
                onChange={(e) => setRetrieveId(e.target.value.trim())}
              />
              <Button style={{
                width: "fit-content",
                padding: "8px 16px",
                backgroundColor: "#5E7AC4",
                color: "white",
                borderRadius: "6px",
              }} onClick={() => retrieveBundle(retrieveId)}>
                Retrieve
              </Button>
              <FileInput
                accept=".json"
                onFileChange={handleUploadFile}
                dragMessage="Drop / Click file to upload session"
                clickMessage=""
                orMessage=""
                containerClassName=""
                className="!h-9 px-3 border border-gray-300 rounded-lg text-sm whitespace-nowrap w-auto"
              />
            </div>
            <div className="w-full dark:bg-white bg-black" style={{ height: "1px" }} />
            <AnimatePresence initial={false}>
              {showFullUI ? (
                <motion.div
                  key="fullUI"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <>
                    <div className={classes.inputContainer}>
                      <div className={classes.label}>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            columnGap: "12px",
                            rowGap: "0px",
                            width: "100%",
                            marginTop: "10px"
                          }}
                        >
                          <h1 className="text-mdshrink-0">Add New Session To Bundle</h1>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",

                              padding: "2px",
                              backgroundColor: "#f8f9fa",
                              borderRadius: "4px",

                            }}
                          >
                            <code
                              onClick={handleCopyBundleId}
                              onMouseEnter={() => setCodeHover(true)}
                              onMouseLeave={() => setCodeHover(false)}
                              title={
                                bundle && bundle.bundleId
                                  ? "Click to copy bundle ID"
                                  : "Save a session to generate ID"
                              }
                              className={classes.bundleCode}
                              style={{
                                color:
                                  bundle && bundle.bundleId
                                    ? "#0b5cff"
                                    : "#8b949e",
                                textDecoration: codeHover
                                  ? "underline"
                                  : "none",
                                cursor:
                                  bundle && bundle.bundleId
                                    ? "pointer"
                                    : "default",
                              }}
                            >
                              {bundle && bundle.bundleId
                                ? bundle.bundleId
                                : "ID will generate after saving a session"}
                            </code>
                            {copiedId && (
                              <span style={{ fontSize: 12, color: "#2b8a3e" }}>
                                Copied
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={classes.row}>
                          <div
                            style={{
                              position: "relative",
                              flex: "1",
                              // marginTop: "4px",
                            }}
                          >
                            <input
                              type="text"
                              value={newSessionLabel}
                              className="w-full pr-20 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm h-9"
                              placeholder="Enter new session name (optional)"
                              onChange={(e) =>
                                setNewSessionLabel(e.target.value.trim())
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  saveSession();
                                }
                              }}
                            />
                            <button
                              type="button"
                              style={{
                                position: "absolute",
                                right: "48px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "black",
                                padding: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.color = "grey")
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.color = "black")
                              }
                              onClick={saveSession}
                              title="Save session (Enter)"
                            >
                              <ArrowTurnDownLeftIcon
                                className="w-4 h-4"
                                style={{
                                  backgroundColor: "transparent",
                                  border: "none",
                                  outline: "none",
                                }}
                              />
                            </button>
                            <div
                              style={{
                                position: "absolute",
                                right: "38px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: "1px",
                                height: "60%",
                                backgroundColor: "#ccc",
                              }}
                            />
                            <button
                              type="button"
                              style={{
                                position: "absolute",
                                right: "8px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#F0AD4E",
                                padding: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.color = "#EC971F")
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.color = "#F0AD4E")
                              }
                              onClick={() => setNewSessionLabel(getFunName())}
                              title="Generate random name"
                            >
                              <ArrowPathIcon
                                className="w-4 h-4"
                                style={{
                                  backgroundColor: "transparent",
                                  border: "none",
                                  outline: "none",
                                }}
                              />
                            </button>
                          </div>
                          <Button
                            onClick={saveSession}
                            style={{
                              width: "fit-content",
                              padding: "8px 16px",
                              backgroundColor: "#5E7AC4",
                              color: "white",
                              borderRadius: "6px",
                            }}
                          >
                            Save session
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Saved Sessions */}
                    {renderSavedSessions()}
                    <div className={classes.additionalActions}>
                      <Button
                        onClick={downloadAsSession}
                        backgroundColor="tint"
                        style={{ width: "175px", fontSize: "14px" }}
                      >
                        Download current session
                      </Button>

                      <Button
                        onClick={downloadAsHub}
                        backgroundColor="tint"
                        style={{ width: "175px", fontSize: "14px" }}
                      >
                        Download as datahub
                      </Button>

                      <Button
                        onClick={downloadWholeBundle}
                        backgroundColor="tint"
                        style={{ width: "175px", fontSize: "14px" }}
                      >
                        Download whole bundle
                      </Button>
                    </div>
                  </>
                </motion.div>
              ) : (
                <motion.div
                  key="compact"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <AnimatePresence initial={false} mode="wait">
                      {!showCreateInput ? (
                        <motion.div
                          key="create-button"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.18 }}
                          className="w-full flex justify-center"
                        >
                          <Button
                            onClick={() => {
                              setShowCreateInput(true);

                              setNewSessionLabel(
                                state?.title &&
                                  !bundleId &&
                                  state.title !== "Untitled Session"
                                  ? state.title
                                  : "",
                              );
                            }}
                            style={{


                              backgroundColor: "#5E7AC4",
                              color: "white",
                              width: "fit-content", padding: "8px 16px"
                            }}
                          >
                            Create remote bundle and save session
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="create-input"
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.18 }}
                          className="flex items-center gap-2 w-full justify-start"
                        >
                          <input
                            type="text"
                            value={newSessionLabel}
                            onChange={(e) => setNewSessionLabel(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAttemptSave();
                              }
                            }}
                            placeholder="Enter new session name (optional)"
                            className="flex-1 h-9 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                          />
                          <Button
                            onClick={handleAttemptSave}
                            style={{
                              padding: "12px 16px",
                              width: "fit-content",

                              background: "white",
                              borderRadius: "6px",
                              backgroundColor: "#5E7AC4",
                              color: "white",
                            }}
                          >
                            Save
                          </Button>
                          <motion.div
                            initial={false}
                            animate={{
                              borderRadius: saveCurveActive ? 20 : 8,
                              borderColor: saveCurveActive
                                ? "#4285F4"
                                : "transparent",
                              boxShadow: saveCurveActive
                                ? "0 6px 18px rgba(66,133,244,0.12)"
                                : "none",
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                            }}
                            style={{
                              display: "inline-block",
                              marginLeft: "8px",
                              //   padding: "2px",
                              //   borderStyle: "solid",
                              //   borderWidth: "1px",
                              borderRadius: 8,
                            }}
                          >
                            <Button
                              onClick={() => {
                                setShowCreateInput(false);
                                setNewSessionLabel(
                                  state?.title &&
                                    !bundleId &&
                                    state.title !== "Untitled Session"
                                    ? state.title
                                    : "",
                                );
                              }}
                              outlined={true}
                              style={{

                                padding: "12px 16px",
                                width: "fit-content",

                                background: "white",
                                borderRadius: "6px",


                              }}
                            >
                              Cancel
                            </Button>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        <div className={classes.disclaimer}>
          Disclaimer: please use{" "}
          <span className={classes.emphasis}>sessionFile</span> or{" "}
          <span className={classes.emphasis}>hub</span> URL for publishing using
          the Browser. Session id is supposed to be shared with trusted people
          only. Please check our docs for{" "}
          <a
            href={HELP_LINKS.publish}
            target="_blank"
            rel="noopener noreferrer"
            className={classes.link}
          >
            Publish with the browser
          </a>
          . Thank you!
        </div>
      </div>
    </div>
  );
};

export default TabSessionUI;
function dispatch(arg0: any) {
  throw new Error("Function not implemented.");
}

