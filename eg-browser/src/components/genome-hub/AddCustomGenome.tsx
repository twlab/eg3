import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { useEffect, useRef, useState } from "react";
import Button from "../ui/button/Button";

import { addCustomGenome } from "@/lib/redux/thunk/genome-hub";
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import FileInput from "../ui/input/FileInput";
import {
  GenomeSerializer,
  GenomeHubManager,
  type IGenome,
} from "wuepgg3-track";
import GenomeHubPanel from "./GenomeHubPanel";
import GenomeSchemaView from "./GenomeSchemaView";
import { motion, AnimatePresence } from "framer-motion";
import {
  addCustomCollection,
  removeCustomCollection,
  addGenomeToCollection,
  removeGenomeFromCollection,
  selectCustomCollections,
  type CustomGenomeEntry,
} from "@/lib/redux/slices/settingsSlice";
import {
  selectOpenNewCollectionForm,
  setOpenNewCollectionForm,
  setGenomePickerTab,
  setFocusCollection,
} from "@/lib/redux/slices/navigationSlice";
import GenomePicker from "../genome-picker/GenomePicker";
import { type SpeciesInfo } from "wuepgg3-track";

export default function AddCustomGenome() {
  const dispatch = useAppDispatch();
  const customCollections = useAppSelector(selectCustomCollections) ?? {};
  const collectionKeys = Object.keys(customCollections);
  const hasCollections = collectionKeys.length > 0;
  const openNewCollectionForm = useAppSelector(selectOpenNewCollectionForm);

  const [file, setFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<ReturnType<
    typeof GenomeSerializer.validateGenomeObject
  > | null>(null);
  const [duplicateIds, setDuplicateIds] = useState<string[]>([]);
  const [fieldWarnings, setFieldWarnings] = useState<
    { label: string; missing: string[] }[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSchema, setShowSchema] = useState(false);

  // Collection management
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null,
  );
  const [collectionDropdownOpen, setCollectionDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Add genome panel mode
  const [uploadOpen, setUploadOpen] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [genomesExpanded, setGenomesExpanded] = useState(true);

  // Toast notification
  const [toast, setToast] = useState<{ visible: boolean; collection: string }>(
    { visible: false, collection: "" },
  );
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync selectedCollection when collections change
  useEffect(() => {
    if (
      collectionKeys.length > 0 &&
      (selectedCollection === null || !customCollections[selectedCollection])
    ) {
      setSelectedCollection(collectionKeys[0]);
    } else if (collectionKeys.length === 0) {
      setSelectedCollection(null);
    }
  }, [customCollections]);

  // Consume the "open new collection form" flag dispatched from GenomePicker
  useEffect(() => {
    if (openNewCollectionForm) {
      setShowCreateInput(true);
      dispatch(setOpenNewCollectionForm(false));
    }
  }, [openNewCollectionForm]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setCollectionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (file) {
      (async () => {
        setIsLoading(true);
        setDuplicateIds([]);
        setFieldWarnings([]);
        try {
          const json = await file.text();
          const parsedJson = JSON.parse(json);

          // Normalize to array and auto-fill name from id if missing
          const items: any[] = Array.isArray(parsedJson)
            ? parsedJson
            : [parsedJson];
          items.forEach((item) => {
            if (item && !item.name && item.id) {
              item.name = item.id;
            }
          });

          // Check required fields per genome and collect warnings
          const REQUIRED = ["id", "chromosomes", "defaultRegion"] as const;
          const warnings: { label: string; missing: string[] }[] = [];
          items.forEach((item, i) => {
            const missing = REQUIRED.filter((f) => !item[f]);
            if (missing.length > 0) {
              const label = item.name || item.id || `Genome #${i + 1}`;
              warnings.push({ label, missing });
            }
          });
          setFieldWarnings(warnings);

          const errors = GenomeSerializer.validateGenomeObject(items);
          setValidationErrors(errors);

          if (errors.valid && errors.normalizedData) {
            const manager = GenomeHubManager.getInstance();
            const duplicates: string[] = [];
            for (const genome of errors.normalizedData) {
              if (await manager.genomeExists(genome.id)) {
                duplicates.push(genome.id);
              }
            }
            setDuplicateIds(duplicates);
          }
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
            ] as any,
            normalizedData: [],
          });
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [file]);

  useEffect(() => {
    if (file && validationErrors?.valid && validationErrors.normalizedData) {
      dispatch(addCustomGenome(validationErrors.normalizedData as IGenome[]));
    }
  }, [file, validationErrors]);

  const handleCreateCollection = () => {
    const name = newCollectionName.trim();
    if (!name) return;
    dispatch(addCustomCollection(name));
    setSelectedCollection(name);
    setNewCollectionName("");
    setShowCreateInput(false);
  };

  const handleAddGenome = (genome: SpeciesInfo, assemblyName: string) => {
    if (!selectedCollection) return;
    const entry: CustomGenomeEntry = {
      name: genome.name,
      logoUrl: genome.logoUrl ?? "",
      assemblies: [],
      color: genome.color ?? "white",
    };
    dispatch(
      addGenomeToCollection({
        collectionName: selectedCollection,
        genome: entry,
        assemblyName,
      }),
    );
    // Show toast
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, collection: selectedCollection });
    toastTimerRef.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      4000,
    );
  };

  const renderFieldWarnings = () => {
    if (fieldWarnings.length === 0) return null;
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mt-4">
        <h3 className="text-orange-800 font-medium mb-2">
          Missing Required Fields:
        </h3>
        <ul className="list-disc pl-5 text-orange-700 text-sm">
          {fieldWarnings.map(({ label, missing }, i) => (
            <li key={i} className="mb-1">
              <span className="font-mono text-xs">{label}</span> is missing:{" "}
              {missing.map((f) => (
                <span
                  key={f}
                  className="font-mono text-xs bg-orange-100 px-1 rounded mr-1"
                >
                  {f}
                </span>
              ))}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderDuplicateWarnings = () => {
    if (duplicateIds.length === 0) return null;
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-4">
        <h3 className="text-yellow-800 font-medium mb-2">
          Duplicate Genome IDs:
        </h3>
        <ul className="list-disc pl-5 text-yellow-700 text-sm">
          {duplicateIds.map((id) => (
            <li key={id} className="mb-1">
              A genome with id <span className="font-mono text-xs">{id}</span>{" "}
              already exists and will be overwritten.
            </li>
          ))}
        </ul>
      </div>
    );
  };

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
      {/* Toast notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            key="genome-toast"
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed top-4 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-lg bg-gray-900 dark:bg-dark-surface text-white text-sm font-medium"
          >
            <span>
              Added to{" "}
              <span className="font-semibold text-tint">"{toast.collection}"</span>
            </span>
            <button
              onClick={() => {
                setToast((t) => ({ ...t, visible: false }));
                dispatch(setFocusCollection(toast.collection));
                dispatch(setGenomePickerTab("picker"));
              }}
              className="underline text-blue-300 hover:text-blue-200 cursor-pointer"
            >
              View
            </button>
            <button
              onClick={() => setToast((t) => ({ ...t, visible: false }))}
              className="text-gray-400 hover:text-white ml-1"
              aria-label="Dismiss"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Schema Modal */}
      {showSchema && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20"
          onClick={() => setShowSchema(false)}
        >
          <div
            className="relative bg-white dark:bg-dark-background rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
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
          <AnimatePresence mode="wait">
            {!hasCollections ? (
              /* ── Empty state: no collections yet ── */
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {!showCreateInput ? (
                    <motion.div
                      key="create-button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="flex flex-col items-center gap-3 py-12"
                    >
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                        No genome collections yet.
                      </p>
                      <Button
                        leftIcon={<PlusIcon className="w-4 h-4" />}
                        onClick={() => setShowCreateInput(true)}
                        style={{
                          backgroundColor: "#5E7AC4",
                          color: "white",
                          fontSize: "16px",
                          width: "fit-content",
                          padding: "6px 16px",
                          borderRadius: "6px",
                        }}
                      >
                        Create a new collection
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="create-input"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center gap-2 w-full max-w-sm py-12"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateCollection();
                          if (e.key === "Escape") {
                            setShowCreateInput(false);
                            setNewCollectionName("");
                          }
                        }}
                        placeholder="Collection name"
                        className="flex-1 h-8 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-secondary dark:bg-dark-secondary text-primary dark:text-dark-primary text-sm"
                      />
                      <Button
                        onClick={handleCreateCollection}
                        style={{
                          padding: "4px 12px",
                          width: "fit-content",
                          backgroundColor: "#5E7AC4",
                          color: "white",
                          borderRadius: "6px",
                        }}
                      >
                        Create
                      </Button>
                      <motion.div
                        initial={false}
                        style={{ display: "inline-block", borderRadius: 8 }}
                      >
                        <Button
                          outlined
                          onClick={() => {
                            setShowCreateInput(false);
                            setNewCollectionName("");
                          }}
                          style={{
                            padding: "4px 10px",
                            width: "fit-content",
                            borderRadius: "6px",
                          }}
                        >
                          Cancel
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* ── Full UI: collections exist ── */
              <motion.div
                key="full-ui"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="flex flex-col gap-4"
              >
                {/* Title row: collection selector inline */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                    Adding Genome to Collection:
                  </span>

                  {/* Inline collection dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setCollectionDropdownOpen((o) => !o)}
                      className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-surface text-sm font-semibold text-tint focus:outline-none focus:ring-2 focus:ring-tint cursor-pointer"
                    >
                      <span>{selectedCollection ?? "Select collection"}</span>
                      <motion.div
                        animate={{ rotate: collectionDropdownOpen ? 90 : 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <ChevronRightIcon className="w-3.5 h-3.5 text-tint" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {collectionDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute z-20 mt-1 min-w-max rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-surface shadow-lg py-1"
                        >
                          {collectionKeys.map((key) => (
                            <div
                              key={key}
                              className="flex items-center group hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <button
                                onClick={() => {
                                  setSelectedCollection(key);
                                  setCollectionDropdownOpen(false);
                                }}
                                className="flex-1 flex items-center gap-2 px-4 py-2 text-sm text-gray-800 dark:text-gray-200"
                              >
                                <span>{key}</span>
                                {key === selectedCollection && (
                                  <span className="text-tint text-xs font-bold">
                                    ✓
                                  </span>
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dispatch(removeCustomCollection(key));
                                  if (key === selectedCollection)
                                    setCollectionDropdownOpen(false);
                                }}
                                className="pr-3 pl-1 py-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label={`Remove ${key}`}
                              >
                                <XMarkIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* New collection button / input — inline */}
                  <AnimatePresence mode="wait" initial={false}>
                    {!showCreateInput ? (
                      <motion.div
                        key="add-btn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Button
                          leftIcon={<PlusIcon className="w-3 h-3" />}
                          onClick={() => setShowCreateInput(true)}
                          style={{
                            width: "fit-content",
                            padding: "4px 6px",
                            fontSize: "16px",
                            backgroundColor: "#5E7AC4",
                            color: "white",
                            borderRadius: "6px",
                          }}
                        >
                          New collection
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="add-input"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.18 }}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          autoFocus
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateCollection();
                            if (e.key === "Escape") {
                              setShowCreateInput(false);
                              setNewCollectionName("");
                            }
                          }}
                          placeholder="Collection name"
                          className="h-7 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-secondary dark:bg-dark-secondary text-primary dark:text-dark-primary text-sm"
                        />
                        <Button
                          onClick={handleCreateCollection}
                          style={{
                            padding: "4px 10px",
                            width: "fit-content",
                            backgroundColor: "#5E7AC4",
                            color: "white",
                            borderRadius: "6px",
                            fontSize: "13px",
                          }}
                        >
                          Create
                        </Button>
                        <Button
                          outlined
                          onClick={() => {
                            setShowCreateInput(false);
                            setNewCollectionName("");
                          }}
                          style={{
                            padding: "4px 8px",
                            fontSize: "13px",
                            borderRadius: "6px",
                          }}
                        >
                          Cancel
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div
                  className="w-full dark:bg-white bg-black"
                  style={{ height: "1px" }}
                />
                {selectedCollection && (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col">
                      {/* Upload Custom Genome accordion */}
                      <div>
                        <button
                          onClick={() => setUploadOpen((o) => !o)}
                          className="flex items-center justify-between w-full py-3 text-base font-semibold text-gray-800 dark:text-gray-100 hover:text-tint dark:hover:text-tint border-b border-gray-200 dark:border-gray-700 group"
                        >
                          <span className="flex items-center gap-2">
                            <ArrowUpTrayIcon className="w-4 h-4" />
                            Upload Custom Genome
                          </span>
                          <motion.div
                            animate={{ rotate: uploadOpen ? 90 : 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                          >
                            <ChevronRightIcon className="w-5 h-5" />
                          </motion.div>
                        </button>
                        <AnimatePresence initial={false}>
                          {uploadOpen && (
                            <motion.div
                              key="upload-panel"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: "easeInOut" }}
                              style={{ overflow: "hidden" }}
                            >
                              <div className="py-4 flex flex-col gap-4">
                                <div className="flex items-center gap-2">
                                  <Button
                                    leftIcon={<PlusIcon className="w-4 h-4" />}
                                    outlined
                                    onClick={() => setShowSchema(true)}
                                    style={{ width: "130px", fontSize: "13px" }}
                                  >
                                    View Schema
                                  </Button>
                                  <Button
                                    leftIcon={
                                      <ArrowDownTrayIcon className="w-4 h-4" />
                                    }
                                    onClick={() => {
                                      const link = document.createElement("a");
                                      link.href =
                                        import.meta.env.BASE_URL +
                                        "/example_hg19.json";
                                      link.download = "example_hg19.json";
                                      link.click();
                                    }}
                                    outlined
                                    disabled={false}
                                    backgroundColor="tint"
                                    style={{ width: "170px", fontSize: "13px" }}
                                  >
                                    Download Example
                                  </Button>
                                </div>
                                <FileInput
                                  accept=".json"
                                  onFileChange={setFile}
                                  dragMessage="Drag and drop a .json genome file here"
                                  className="w-full"
                                />
                                {isLoading ? (
                                  <p className="text-sm text-gray-500 text-center">
                                    Validating...
                                  </p>
                                ) : (
                                  <>
                                    {renderFieldWarnings()}
                                    {renderDuplicateWarnings()}
                                    {renderValidationErrors()}
                                  </>
                                )}
                                <GenomeHubPanel />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Add Existing Genome accordion */}
                      <div>
                        <button
                          onClick={() => setPickerOpen((o) => !o)}
                          className="flex items-center justify-between w-full py-3 text-base font-semibold text-gray-800 dark:text-gray-100 hover:text-tint dark:hover:text-tint border-b border-gray-200 dark:border-gray-700"
                        >
                          <span className="flex items-center gap-2">
                            <PlusIcon className="w-4 h-4" />
                            Existing Genome
                          </span>
                          <motion.div
                            animate={{ rotate: pickerOpen ? 90 : 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                          >
                            <ChevronRightIcon className="w-5 h-5" />
                          </motion.div>
                        </button>
                        <AnimatePresence initial={false}>
                          {pickerOpen && (
                            <motion.div
                              key="picker-panel"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: "easeInOut" }}
                              style={{ overflow: "hidden" }}
                            >
                              <div className="py-2">
                                <GenomePicker
                                  variant="tab"
                                  onSelectGenome={(genome, assemblyName) => {
                                    handleAddGenome(genome, assemblyName);
                                  }}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Collapsible genome list — kept in its own card */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setGenomesExpanded((e) => !e)}
                        className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-background border-t border-gray-200 dark:border-gray-700"
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-tint/15 text-tint text-xs font-semibold">
                            {customCollections[selectedCollection]?.length ?? 0}
                          </span>
                          <span>
                            Genome
                            {(customCollections[selectedCollection]?.length ??
                              0) !== 1
                              ? "s"
                              : ""}{" "}
                            in collection
                          </span>
                        </span>
                        <motion.div
                          animate={{ rotate: genomesExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                        >
                          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                        </motion.div>
                      </button>
                      <AnimatePresence initial={false}>
                        {genomesExpanded && (
                          <motion.div
                            key="genome-list"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            style={{ overflow: "hidden" }}
                          >
                            <div className="px-4 pb-4 pt-2">
                              {(customCollections[selectedCollection]?.length ??
                                0) === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-4">
                                  No genomes in this collection yet.
                                </p>
                              ) : (
                                <div className="flex flex-col gap-1.5">
                                  {(
                                    customCollections[selectedCollection] ?? []
                                  ).map((genome) => (
                                    <div
                                      key={genome.name}
                                      className="flex items-center justify-between px-3 py-1.5 rounded-md text-sm bg-gray-50 dark:bg-dark-background border border-gray-100 dark:border-gray-700"
                                    >
                                      <div>
                                        <span className="font-medium">
                                          {genome.name}
                                        </span>
                                        <span className="ml-2 text-xs text-gray-400">
                                          {genome.assemblies.join(", ")}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() =>
                                          dispatch(
                                            removeGenomeFromCollection({
                                              collectionName:
                                                selectedCollection,
                                              genomeName: genome.name,
                                            }),
                                          )
                                        }
                                        className="text-gray-400 hover:text-red-500"
                                      >
                                        <XMarkIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
