import { useAppDispatch } from "@/lib/redux/hooks";
import { useEffect, useState } from "react";
import Button from "../ui/button/Button";

import { addCustomGenome } from "@/lib/redux/thunk/genome-hub";
import { ArrowDownTrayIcon, PlusIcon } from "@heroicons/react/24/outline";
import FileInput from "../ui/input/FileInput";
import { GenomeSerializer } from "wuepgg3-track";
import GenomeHubPanel from "./GenomeHubPanel";
import GenomeSchemaView from "./GenomeSchemaView";
import { XMarkIcon } from "@heroicons/react/24/outline";
export default function AddCustomGenome() {
  const dispatch = useAppDispatch();

  const [file, setFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<ReturnType<
    typeof GenomeSerializer.validateGenomeObject
  > | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSchema, setShowSchema] = useState(false);

  useEffect(() => {
    if (file) {
      (async () => {
        setIsLoading(true);
        try {
          const json = await file.text();
          const parsedJson = JSON.parse(json);
          const errors = GenomeSerializer.validateGenomeObject(parsedJson);
          setValidationErrors(errors);
        } catch (error) {
          console.error(error);
          setValidationErrors({
            valid: false,
            errors: [
              {
                keyword: "parse",
                instancePath: "",
                schemaPath: "#",
                params: {},
                message: "Invalid JSON format",
              },
            ],
          });
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [file]);

  useEffect(() => {
    if (file && validationErrors?.valid) {

      dispatch(addCustomGenome(file));
    }
  }, [file, validationErrors]);

  const renderValidationErrors = () => {
    if (
      !validationErrors ||
      validationErrors.valid ||
      !validationErrors.errors
    ) {
      return null;
    }

    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
        <h3 className="text-red-800 font-medium mb-2">Validation Errors:</h3>
        <ul className="list-disc pl-5 text-red-700 text-sm">
          {validationErrors.errors.map((error: any, index: number) => (
            <li key={index} className="mb-1">
              {error.instancePath && (
                <span className="font-mono text-xs">{error.instancePath}</span>
              )}{" "}
              {error.message}
              {error.params?.missingProperty && (
                <span className="font-mono text-xs">
                  {" "}
                  (missing: '{error.params.missingProperty}')
                </span>
              )}
              {error.params?.additionalProperty && (
                <span className="font-mono text-xs">
                  {" "}
                  (extra: '{error.params.additionalProperty}')
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 relative mb-30">
      {/* Modal Overlay for GenomeSchemaView */}
      {showSchema && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20"
          onClick={() => setShowSchema(false)}
        >
          <div
            className="relative bg-white dark:bg-dark-background rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white"
              onClick={() => setShowSchema(false)}
              aria-label="Close"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <GenomeSchemaView />
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">

        <div className="w-full max-w-2xl bg-white dark:bg-dark-surface rounded-lg p-6 shadow-sm">
          <h1 className="text-xl">Upload Custom Genome file</h1>
          <div className="flex flex-row gap-2 w-full justify-start items-center mb-4">
            <Button
              leftIcon={<PlusIcon className="w-4 h-4" />}
              outlined
              onClick={() => setShowSchema(true)}
              style={{ width: "140px" }}

            >
              View Schema
            </Button>
            <Button
              leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
              onClick={() => {
                const link = document.createElement("a");
                link.href = import.meta.env.BASE_URL + "/example_hg19.json";
                link.download = "example_hg19.json";
                link.click();
              }}
              outlined
              disabled={false}
              style={{ width: "180px" }}
            >
              Download Example
            </Button>
          </div>

          <div className="w-full">
            <div className="flex justify-center">
              <div className="w-full max-w-md mx-auto">
                <FileInput
                  accept=".json"
                  onFileChange={setFile}
                  dragMessage="Drag and drop a .json genome file here"
                  className="mx-auto w-full"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              {isLoading ? (
                <div className="text-center text-sm text-gray-600">Validating...</div>
              ) : (
                <div className="w-full max-w-md mx-auto">{renderValidationErrors()}</div>
              )}
            </div>


            <GenomeHubPanel />

          </div>
        </div>
      </div>
    </div>
  );
}
