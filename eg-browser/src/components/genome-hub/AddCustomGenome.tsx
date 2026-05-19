import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { useEffect, useRef, useState } from "react";
import Button from "../ui/button/Button";

import {
  addCustomGenome,
  deleteCustomGenome,
  clearAllGenomes,
  refreshLocalGenomes,
} from "@/lib/redux/thunk/genome-hub";
import { ArrowUpTrayIcon, PlusIcon } from "@heroicons/react/24/outline";
import {
  ChevronRightIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import FileInput from "../ui/input/FileInput";
import { GenomeSerializer, type IGenome } from "wuepgg3-track";
import GenomeSchemaView from "./GenomeSchemaView";
import { selectCustomGenomesLoadStatus } from "@/lib/redux/slices/genomeHubSlice";
import { motion, AnimatePresence } from "framer-motion";
import {
  addCustomCollection,
  removeCustomCollection,
  addGenomeToCollection,
  removeGenomeFromCollection,
  removeAssemblyFromCollection,
  removeAssembliesFromAllCollections,
  selectCustomCollections,
  type CustomGenomeEntry,
} from "@/lib/redux/slices/settingsSlice";
import {
  selectOpenNewCollectionForm,
  setOpenNewCollectionForm,
  setGenomePickerTab,
  setFocusCollection,
} from "@/lib/redux/slices/navigationSlice";
import { selectCustomGenomes } from "@/lib/redux/slices/genomeHubSlice";
import GenomePicker from "../genome-picker/GenomePicker";
import { type SpeciesInfo } from "wuepgg3-track";

export default function AddCustomGenome() {
  const dispatch = useAppDispatch();
  const customCollections = useAppSelector(selectCustomCollections) ?? {};
  const collectionKeys = Object.keys(customCollections);
  const hasCollections = collectionKeys.length > 0;
  const openNewCollectionForm = useAppSelector(selectOpenNewCollectionForm);
  const customGenomes = useAppSelector(selectCustomGenomes) ?? [];
  const customGenomesLoadStatus = useAppSelector(selectCustomGenomesLoadStatus);

  const [file, setFile] = useState<File | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ReturnType<
    typeof GenomeSerializer.validateGenomeObject
  > | null>(null);
  const [fieldWarnings, setFieldWarnings] = useState<
    { label: string; missing: string[] }[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSchema, setShowSchema] = useState(false);

  // Collection management
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    collectionKeys[0] ?? null,
  );
  const [collectionDropdownOpen, setCollectionDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Add genome panel mode
  const [activePanel, setActivePanel] = useState<"upload" | "existing">(
    "upload",
  );
  const [genomesExpanded, setGenomesExpanded] = useState(false);
  const [hubPanelOpen, setHubPanelOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ visible: boolean; collection: string }>({
    visible: false,
    collection: "",
  });
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

  // Refresh custom genomes from IndexedDB when panel opens
  useEffect(() => {
    if (hubPanelOpen && customGenomesLoadStatus === "idle") {
      dispatch(refreshLocalGenomes());
    }
  }, [hubPanelOpen, customGenomesLoadStatus]);

  // Reset confirm-delete when panel closes
  useEffect(() => {
    if (!hubPanelOpen) setConfirmDeleteId(null);
  }, [hubPanelOpen]);

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
      const genomes = validationErrors.normalizedData as IGenome[];
      dispatch(addCustomGenome(genomes));
      if (selectedCollection) {
        for (const genome of genomes) {
          const entry: CustomGenomeEntry = {
            name: genome.name || genome.id,
            logoUrl: "",
            assemblies: [],
            color: "white",
          };
          dispatch(
            addGenomeToCollection({
              collectionName: selectedCollection,
              genome: entry,
              assemblyName: genome.id,
            }),
          );
        }
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast({ visible: true, collection: selectedCollection });
        toastTimerRef.current = setTimeout(
          () => setToast((t) => ({ ...t, visible: false })),
          4000,
        );
      }
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
              <span className="font-semibold text-tint">
                "{toast.collection}"
              </span>
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
            className="relative bg-white dark:bg-dark-background rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto p-4"
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
        <div className="w-full max-w-2xl bg-white dark:bg-dark-surface rounded-lg p-4 shadow-sm">
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
                        New collection
                      </Button>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                        No genome collections yet.
                      </p>
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="flex flex-col gap-4"
              >
                {/* Title row: collection selector inline */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    Current collection:
                  </span>

                  {/* Inline collection dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setCollectionDropdownOpen((o) => !o)}
                      className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 h-7 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-surface text-sm font-semibold text-tint focus:outline-none focus:ring-2 focus:ring-tint cursor-pointer"
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

                  {/* Genomes in collection toggle button */}
                  {selectedCollection && (
                    <button
                      onClick={() => setGenomesExpanded((e) => !e)}
                      className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 h-7 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-surface text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-background focus:outline-none cursor-pointer transition-colors"
                    >
                      <span>Genomes in collection</span>
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-tint/15 text-tint text-xs font-semibold">
                        {(customCollections[selectedCollection] ?? []).reduce(
                          (sum, g) => sum + (g.assemblies?.length ?? 1),
                          0,
                        )}
                      </span>
                      <motion.div
                        animate={{ rotate: genomesExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />
                      </motion.div>
                    </button>
                  )}

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
                            padding: "0px 6px",
                            height: "28px",
                            fontSize: "14px",
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
                {/* Genomes in collection — animated list */}
                {selectedCollection && (
                  <AnimatePresence initial={false}>
                    {genomesExpanded && (
                      <motion.div
                        key="genome-list"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="py-3 flex flex-col gap-1.5">
                          {(customCollections[selectedCollection]?.length ??
                            0) === 0 ? (
                            <p className="text-xs text-gray-400 py-2">
                              No genomes in this collection yet.
                            </p>
                          ) : (
                            <>
                              {(
                                customCollections[selectedCollection] ?? []
                              ).map((genome) => (
                                <div
                                  key={genome.name}
                                  className="flex flex-col gap-1 px-3 py-2 rounded-md bg-gray-50 dark:bg-dark-background border border-gray-100 dark:border-gray-700"
                                >
                                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    {genome.name}
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {genome.assemblies.map((assembly) => (
                                      <span
                                        key={assembly}
                                        className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-tint/10 text-tint text-xs font-medium"
                                      >
                                        {assembly}
                                        <button
                                          onClick={() =>
                                            dispatch(
                                              removeAssemblyFromCollection({
                                                collectionName:
                                                  selectedCollection,
                                                genomeName: genome.name,
                                                assemblyName: assembly,
                                              }),
                                            )
                                          }
                                          className="text-tint/60 hover:text-red-500 transition-colors"
                                          aria-label={`Remove ${assembly}`}
                                        >
                                          <XMarkIcon className="w-3 h-3" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              <button
                                onClick={() =>
                                  (
                                    customCollections[selectedCollection] ?? []
                                  ).forEach((genome) =>
                                    dispatch(
                                      removeGenomeFromCollection({
                                        collectionName: selectedCollection,
                                        genomeName: genome.name,
                                      }),
                                    ),
                                  )
                                }
                                className="mt-1 text-xs text-red-400 hover:text-red-500 cursor-pointer text-left"
                              >
                                Clear all
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
                <div
                  className="w-full dark:bg-white bg-black"
                  style={{ height: "1px" }}
                />
                {selectedCollection && (
                  <div className="flex flex-col gap-3">
                    {/* Panel switcher */}
                    <div className="flex justify-center py-1">
                      <div
                        className="flex items-center p-1 rounded-full bg-gray-200 dark:bg-dark-background cursor-pointer"
                        onClick={() =>
                          setActivePanel(
                            activePanel === "upload" ? "existing" : "upload",
                          )
                        }
                      >
                        {(["upload", "existing"] as const).map((panel) => (
                          <button
                            key={panel}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePanel(panel);
                            }}
                            className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium"
                          >
                            {activePanel === panel && (
                              <motion.div
                                layoutId="panel-thumb"
                                className="absolute inset-0 rounded-full bg-white dark:bg-dark-surface shadow"
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 35,
                                }}
                              />
                            )}
                            <span
                              className={`relative z-10 flex items-center gap-1.5 transition-colors duration-200 ${
                                activePanel === panel
                                  ? "text-gray-900 dark:text-white"
                                  : "text-gray-400 dark:text-gray-500"
                              }`}
                            >
                              {panel === "upload" ? (
                                <ArrowUpTrayIcon className="w-4 h-4" />
                              ) : (
                                <PlusIcon className="w-4 h-4" />
                              )}
                              {panel === "upload"
                                ? "Upload Custom Genome to Collection"
                                : "Add Existing Genome to Collection"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Active panel content */}
                    <AnimatePresence mode="wait" initial={false}>
                      {activePanel === "upload" ? (
                        <motion.div
                          key="upload-panel"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.18, ease: "easeInOut" }}
                          className="flex flex-col gap-4"
                        >
                          <div className="flex gap-4 items-stretch">
                            {/* Left: drag-and-drop */}
                            <div className="flex-1 flex flex-col">
                              <FileInput
                                accept=".json"
                                onFileChange={setFile}
                                dragMessage="Drag and drop a .json genome file here"
                                containerClassName="w-full h-full"
                                className="!h-full"
                              />
                            </div>
                            {/* Right: description */}
                            <div className="flex-1 flex flex-col justify-center gap-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                              <p>
                                Add your own custom genome by providing a JSON
                                file. For each genome in the array, make sure to
                                have a unique
                                <span className="font-mono text-xs bg-gray-100 dark:bg-dark-background px-1 rounded">
                                  id
                                </span>
                                , a{" "}
                                <span className="font-mono text-xs bg-gray-100 dark:bg-dark-background px-1 rounded">
                                  defaultRegion
                                </span>{" "}
                                to position tracks on first view , and a{" "}
                                <span className="font-mono text-xs bg-gray-100 dark:bg-dark-background px-1 rounded">
                                  chromosomes
                                </span>{" "}
                                array.
                              </p>
                              <p>
                                See how to build the JSON at{" "}
                                <button
                                  onClick={() => setShowSchema(true)}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-surface text-sm font-medium text-blue-500 underline hover:text-blue-400 focus:outline-none cursor-pointer"
                                >
                                  View Schema
                                </button>
                                You can also{" "}
                                <button
                                  onClick={() => {
                                    const link = document.createElement("a");
                                    link.href =
                                      import.meta.env.BASE_URL +
                                      "/example_hg19.json";
                                    link.download = "example_hg19.json";
                                    link.click();
                                  }}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-sm font-medium bg-tint dark:bg-dark-tint text-white focus:outline-none cursor-pointer transition-opacity hover:opacity-90"
                                >
                                  download an example JSON file
                                </button>
                              </p>
                            </div>
                          </div>
                          {isLoading ? (
                            <p className="text-sm text-gray-500 text-center">
                              Validating...
                            </p>
                          ) : (
                            <>
                              {renderFieldWarnings()}
                              {renderValidationErrors()}
                            </>
                          )}
                          {/* Genome Hub Panel accordion */}
                          <div>
                            <button
                              onClick={() => setHubPanelOpen((o) => !o)}
                              className="flex items-center justify-between w-full py-3 text-sm text-gray-800 dark:text-gray-100 hover:text-tint dark:hover:text-tint border-b border-gray-200 dark:border-gray-700"
                            >
                              <span className="flex items-center gap-2">
                                Uploaded Custom Genomes
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-tint/15 text-tint text-xs font-semibold">
                                  {customGenomes.length}
                                </span>
                              </span>
                              <motion.div
                                animate={{ rotate: hubPanelOpen ? 90 : 0 }}
                                transition={{
                                  duration: 0.2,
                                  ease: "easeInOut",
                                }}
                              >
                                <ChevronRightIcon className="w-5 h-5" />
                              </motion.div>
                            </button>
                            <AnimatePresence initial={false}>
                              {hubPanelOpen && (
                                <motion.div
                                  key="hub-panel"
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{
                                    duration: 0.22,
                                    ease: "easeInOut",
                                  }}
                                  style={{ overflow: "hidden" }}
                                >
                                  <div className="py-3 flex flex-col gap-2">
                                    {/* Header: clear all */}
                                    {customGenomes.length > 0 && (
                                      <div className="flex justify-end">
                                        <button
                                          onClick={() => {
                                            dispatch(
                                              removeAssembliesFromAllCollections(
                                                customGenomes.map((g) => g.id),
                                              ),
                                            );
                                            dispatch(clearAllGenomes());
                                          }}
                                          className="text-xs text-red-400 hover:text-red-500 cursor-pointer"
                                        >
                                          Clear all custom genomes
                                        </button>
                                      </div>
                                    )}

                                    {customGenomes.length === 0 ? (
                                      <div className="flex flex-col items-center gap-2 py-6 text-gray-400">
                                        <ExclamationTriangleIcon className="w-8 h-8 opacity-40" />
                                        <p className="text-sm font-medium">
                                          No Custom Genomes
                                        </p>
                                        <p className="text-xs text-center max-w-xs">
                                          Custom genomes are stored locally in
                                          your browser. Upload a genome file
                                          above and it will appear here.
                                        </p>
                                      </div>
                                    ) : (
                                      customGenomes.map((genome) => {
                                        const isInCollection =
                                          selectedCollection
                                            ? (
                                                customCollections[
                                                  selectedCollection
                                                ] ?? []
                                              ).some((entry) =>
                                                entry.assemblies.includes(
                                                  genome.id,
                                                ),
                                              )
                                            : false;
                                        const isConfirming =
                                          confirmDeleteId === genome.id;
                                        return (
                                          <div
                                            key={genome.id}
                                            onClick={() => {
                                              if (
                                                isInCollection ||
                                                !selectedCollection
                                              )
                                                return;
                                              const entry: CustomGenomeEntry = {
                                                name: genome.name || genome.id,
                                                logoUrl: "",
                                                assemblies: [],
                                                color: "white",
                                              };
                                              dispatch(
                                                addGenomeToCollection({
                                                  collectionName:
                                                    selectedCollection,
                                                  genome: entry,
                                                  assemblyName: genome.id,
                                                }),
                                              );
                                              if (toastTimerRef.current)
                                                clearTimeout(
                                                  toastTimerRef.current,
                                                );
                                              setToast({
                                                visible: true,
                                                collection: selectedCollection,
                                              });
                                              toastTimerRef.current =
                                                setTimeout(
                                                  () =>
                                                    setToast((t) => ({
                                                      ...t,
                                                      visible: false,
                                                    })),
                                                  4000,
                                                );
                                            }}
                                            className={`flex flex-row justify-between items-center p-3 rounded-xl border transition-colors ${
                                              isInCollection
                                                ? "bg-tint/5 border-tint/20 cursor-default"
                                                : selectedCollection
                                                  ? "bg-secondary dark:bg-dark-secondary border-transparent hover:border-tint/30 cursor-pointer"
                                                  : "bg-secondary dark:bg-dark-secondary border-transparent cursor-default opacity-60"
                                            }`}
                                          >
                                            {/* Left: genome info */}
                                            <div className="flex flex-col gap-1">
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">
                                                  {genome.name}
                                                </span>
                                                {isInCollection && (
                                                  <span className="inline-flex items-center gap-1 text-xs text-tint font-semibold">
                                                    <CheckIcon className="w-3.5 h-3.5" />
                                                    In collection
                                                  </span>
                                                )}
                                              </div>
                                              <span className="text-xs text-gray-400">
                                                {genome.chromosomes.length > 0
                                                  ? genome.chromosomes
                                                      .slice(0, 3)
                                                      .map((c) => c.name)
                                                      .join(", ") +
                                                    (genome.chromosomes.length >
                                                    3
                                                      ? ` +${
                                                          genome.chromosomes
                                                            .length - 3
                                                        } more`
                                                      : "")
                                                  : "No chromosomes"}
                                              </span>
                                            </div>

                                            {/* Right: delete button */}
                                            <button
                                              onClick={async (e) => {
                                                e.stopPropagation();
                                                if (!isConfirming) {
                                                  setConfirmDeleteId(genome.id);
                                                  setTimeout(
                                                    () =>
                                                      setConfirmDeleteId(
                                                        (id) =>
                                                          id === genome.id
                                                            ? null
                                                            : id,
                                                      ),
                                                    2000,
                                                  );
                                                  return;
                                                }
                                                setConfirmDeleteId(null);
                                                await dispatch(
                                                  deleteCustomGenome(genome.id),
                                                ).unwrap();
                                                dispatch(
                                                  removeAssembliesFromAllCollections(
                                                    [genome.id],
                                                  ),
                                                );
                                              }}
                                              className={`p-1 rounded-md transition-colors ${
                                                isConfirming
                                                  ? "bg-red-500 text-white"
                                                  : "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                              }`}
                                              aria-label={
                                                isConfirming
                                                  ? `Confirm delete ${genome.name}`
                                                  : `Delete ${genome.name}`
                                              }
                                              title={
                                                isConfirming
                                                  ? "Click again to confirm"
                                                  : "Delete genome"
                                              }
                                            >
                                              {isConfirming ? (
                                                <ExclamationTriangleIcon className="w-4 h-4" />
                                              ) : (
                                                <XMarkIcon className="w-4 h-4" />
                                              )}
                                            </button>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="picker-panel"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.18, ease: "easeInOut" }}
                        >
                          <GenomePicker
                            variant="tab"
                            currentCollection={selectedCollection ?? undefined}
                            onSelectGenome={(genome, assemblyName) => {
                              handleAddGenome(genome, assemblyName);
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* (genome list moved above divider) */}
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
