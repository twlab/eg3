import { useState } from "react";
import { useAppDispatch } from "@/lib/redux/hooks";
import {
  setCurrentSession,
  upsertSession,
} from "@/lib/redux/slices/browserSlice";
import Button from "../ui/button/Button";
import FileInput from "../ui/input/FileInput";

import { convertSession } from "@/lib/redux/thunk/session";
import { importOneSession } from "@/lib/redux/thunk/session";
import { onRetrieveSession } from "@/components/root-layout/tabs/apps/destinations/TabSessionUI";
import { getDatabase, ref, remove } from "firebase/database";
import { generateUUID } from "wuepgg3-track";
export default function ImportSession() {
  const dispatch = useAppDispatch();

  const [error, setError] = useState<string | null>(null);
  const [bundleId, setBundleId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [bundle, setBundle] = useState<{ [key: string]: any } | null>(null);
  const [sortSession, setSortSession] = useState<string>("date");

  const handleFileChange = async (file: File | null) => {
    setError(null);

    if (!file) return;

    let session: any;
    try {
      const content = await file.text();
      session = JSON.parse(content);
    } catch (e) {
      setError("Invalid session file. Please check the file format.");
      return;
    }

    if (session?.bundleId) {
      try {
        const res = await onRetrieveSession(session.bundleId);
        if (res) {
          setBundle(res);
          return;
        }
        // no bundle found -> fall through to the single-session import logic
      } catch (e) {
        // retrieve failed -> fall through to the single-session import logic
      }
    }

    try {
      session = convertSession(session, dispatch);

      if (!session.id || !session.genomeId || !session.viewRegion) {
        console.error("Invalid session file format", session);
        throw new Error("Invalid session file format");
      }

      if (!session.createdAt) session.createdAt = Date.now();
      if (!session.updatedAt) session.updatedAt = Date.now();

      session.id = generateUUID();

      dispatch(upsertSession(session));
      dispatch(setCurrentSession(session.id));
    } catch (e) {
      setError("Invalid session file. Please check the file format.");
    }
  };

  return (
    <div className="w-full flex justify-center mb-30">
      <div className="w-full max-w-2xl bg-white dark:bg-dark-surface gap-4   mt-4">
        <h1 className="text-base  font-semibold">
          Import by Session Bundle ID:
        </h1>
        <div className="flex flex-row gap-2 w-full mb-4">
          <input
            type="text"
            className="flex-1 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Session bundle Id"
            value={bundleId}
            onChange={(e) => setBundleId(e.target.value)}
          />
          <Button
            onClick={async () => {
              if (!bundleId.trim()) {
                setError("Please enter a Session Bundle ID");
                return;
              }
              setError(null);
              setIsLoading(true);
              try {
                // await dispatch(addSessionsFromBundleId(bundleId)).unwrap();
                // retrieve bundle to display sessions below
                try {
                  const res = await onRetrieveSession(bundleId);

                  if (res) {
                    setBundle(res);
                  }
                } catch (e) {
                  // ignore
                }
              } catch (e) {
                setError(
                  "Failed to import session bundle. Please check the Session Bundle ID.",
                );
              } finally {
                setIsLoading(false);
              }
            }}
            style={{
              width: "fit-content",
              padding: "4px 6px",
              fontSize: "16px",
              backgroundColor: "#5E7AC4",
              color: "white",
              borderRadius: "6px",
            }}
            disabled={isLoading}
          >
            {isLoading ? "Importing..." : "Import"}
          </Button>
        </div>
        <h1 className="text-base font-semibold">Import by File:</h1>
        <div className="flex gap-4 items-stretch">
          {/* Left: drag-and-drop */}
          <div className="flex-1 flex flex-col">
            <FileInput
              accept=".json"
              onFileChange={handleFileChange}
              dragMessage="Drag and drop a session file here"
              containerClassName="w-full h-full"
              className="!h-full"
            />
          </div>
          {/* Right: description */}
          <div className="flex-1 flex flex-col justify-center gap-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            <p>
              Reload a previously saved session state by uploading a previously
              saved JSON file. Check the example JSON to make sure you have the
              correct format.
            </p>
            <p>
              You can also{" "}
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href =
                    import.meta.env.BASE_URL + "/example_session.json";
                  link.download = "example_session.json";
                  link.click();
                }}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-sm font-medium bg-tint dark:bg-dark-tint text-white focus:outline-none cursor-pointer transition-opacity hover:opacity-90"
              >
                download an example JSON file
              </button>
            </p>
          </div>
        </div>

        {error && <div className="text-red-500 text-sm mt-4">{error}</div>}
        {/* Sessions list from bundle (if available) */}
        {bundle && bundle.sessionsInBundle && (
          <div className="mt-6">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 mt-3">
              <h1 className="text-md text-primary dark:text-dark-primary">
                Sessions In Bundle (
                {Object.keys(bundle.sessionsInBundle).length})
              </h1>

              <div className="flex items-center gap-3">
                <span className="text-sm text-primary dark:text-dark-primary">
                  Sort by:
                </span>
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
                    fontSize: "16px",
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

            <ol className="flex flex-col mt-3">
              {(() => {
                const sessions = Object.entries(bundle.sessionsInBundle || {});
                if (sortSession === "date") {
                  sessions.sort(([, a]: any, [, b]: any) => b.date - a.date);
                }
                if (sortSession === "label") {
                  sessions.sort(([, a]: any, [, b]: any) =>
                    a.label > b.label ? 1 : b.label > a.label ? -1 : 0,
                  );
                }

                return sessions.map(([id, session]: any, index: number) => (
                  <li
                    key={id}
                    className="mb-2 p-2 rounded-md bg-secondary dark:bg-dark-secondary"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-primary dark:text-dark-primary mr-2">
                          {index + 1}.
                        </span>
                        <span className="text-sm text-primary dark:text-dark-primary">
                          {session.label} -{" "}
                          {new Date(session.date).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={async () => {
                            // restore this session into the browser
                            try {
                              const sess = session.state;
                              sess["bundleId"] = bundle?.bundleId;
                              sess["title"] = session?.label;

                              await dispatch(
                                importOneSession({
                                  session: sess,
                                  navigatingToSession: true,
                                }) as any,
                              ).unwrap();
                              // console.log("Session restored.");
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          style={{
                            width: "fit-content",
                            padding: "4px 6px",
                            fontSize: "16px",
                            backgroundColor: "#E6F7EA",
                            color: "#1F6E3A",
                            borderRadius: "6px",
                          }}
                        >
                          Restore
                        </Button>
                        <Button
                          onClick={async () => {
                            // delete session from remote bundle
                            try {
                              const db = getDatabase();
                              await remove(
                                ref(
                                  db,
                                  `sessions/${bundle.bundleId}/sessionsInBundle/${id}`,
                                ),
                              );
                              const newBundle = { ...bundle };
                              delete newBundle.sessionsInBundle[id];

                              // console.log("Session deleted.");
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          style={{
                            width: "fit-content",
                            padding: "4px 6px",
                            fontSize: "16px",
                            backgroundColor: "#FDE8E8",
                            color: "#8B1C1C",
                            borderRadius: "6px",
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </li>
                ));
              })()}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
