import { useState } from "react";
import { useAppDispatch } from "@/lib/redux/hooks";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { BrowserSession, upsertSession } from "@/lib/redux/slices/browserSlice";
import Button from "../ui/button/Button";
import FileInput from "../ui/input/FileInput";
import { useNavigation } from "../core-navigation/NavigationStack";

import {
  addSessionsFromBundleId,
  convertSession,
} from "@/lib/redux/thunk/session";
import { generateUUID } from "wuepgg3-track";
export default function ImportSession() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bundleId, setBundleId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileChange = async (file: File | null) => {
    setError(null);
    setFile(file);

    if (!file) return;

    try {
      const content = await file.text();
      let session = JSON.parse(content);
      session = convertSession(session);

      if (!session.id || !session.genomeId || !session.viewRegion) {
        console.error("Invalid session file format", session);
        throw new Error("Invalid session file format");
      }

      if (!session.createdAt) session.createdAt = Date.now();
      if (!session.updatedAt) session.updatedAt = Date.now();

      session.id = generateUUID();

      dispatch(upsertSession(session));
      navigation.pop();
    } catch (e) {
      setError("Invalid session file. Please check the file format.");
      setFile(null);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <h1 className="text-xl">Import by Session Bundle ID</h1>
      <div className="flex flex-row gap-2 w-full">
        <input
          type="text"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              await dispatch(addSessionsFromBundleId(bundleId)).unwrap();
              navigation.pop();
            } catch (e) {
              setError(
                "Failed to import session bundle. Please check the Session Bundle ID."
              );
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
        >
          {isLoading ? "Importing..." : "Import"}
        </Button>
      </div>
      <h1 className="text-xl">Import by File</h1>
      <div className="flex flex-row gap-2 w-full justify-start items-center">
        <Button
          leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
          onClick={() => {
            const link = document.createElement("a");
            link.href = import.meta.env.BASE_URL + "/example_session.json";
            link.download = "example_session.json";
            link.click();
          }}
          outlined
        >
          Download Example
        </Button>
      </div>
      <FileInput
        accept=".json"
        onFileChange={handleFileChange}
        dragMessage="Drag and drop a session file here"
      />

      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
}
