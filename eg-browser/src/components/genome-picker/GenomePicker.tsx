import useDebounce from "@/lib/hooks/useDebounce";
import { createSession } from "@/lib/redux/slices/browserSlice";
import {
  setExpandNavigationTab,
  setGenomePickerTab,
  setOpenNewCollectionForm,
  selectFocusCollection,
  setFocusCollection,
} from "@/lib/redux/slices/navigationSlice";
import {
  selectCustomCollections,
  selectSelectedCollections,
  setSelectedCollections,
} from "@/lib/redux/slices/settingsSlice";
import { selectCustomGenomes } from "@/lib/redux/slices/genomeHubSlice";
import {
  CheckIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import placeholder from "../../assets/placeholder.png";
import { useAppDispatch, useAppSelector } from "../../lib/redux/hooks";
import {
  allDefaultGenomeCollections,
  GenomeSerializer,
  getGenomeConfig,
  type SpeciesInfo,
} from "wuepgg3-track";

type GenomeName = string;
type AssemblyName = string;

type Props = {
  variant?: "root" | "tab";
  onClose?: () => void;
  /** When provided, clicking an assembly calls this instead of creating a session */
  onSelectGenome?: (genome: SpeciesInfo, assemblyName: string) => void;
  /** Collection name that is currently active in the parent — shown as non-interactive in the dropdown */
  currentCollection?: string;
};

export default function GenomePicker({
  variant = "tab",
  onClose,
  onSelectGenome,
  currentCollection,
}: Props) {
  const dispatch = useAppDispatch();
  const customCollections = useAppSelector(selectCustomCollections) ?? {};
  const focusCollection = useAppSelector(selectFocusCollection);
  const savedSelectedCollections = useAppSelector(selectSelectedCollections);
  const customGenomes = useAppSelector(selectCustomGenomes);

  // Only expand the navigation tab in navbar (tab) mode — inlined to avoid a conditional hook call
  useEffect(() => {
    if (variant !== "tab") return;
    dispatch(setExpandNavigationTab(true));
    return () => {
      dispatch(setExpandNavigationTab(false));
    };
  }, [variant, dispatch]);

  // Map custom genomes (IGenome[]) to SpeciesInfo[] for display
  const customGenomeSpecies = useMemo<SpeciesInfo[]>(
    () =>
      customGenomes.map((g) => ({
        name: g.name,
        assemblies: [g.id],
        logoUrl: "",
        color: "white",
      })),
    [customGenomes],
  );

  // Merge default + custom collections, injecting CUSTOM_GENOMES when non-empty
  const allCollections = useMemo<Record<string, SpeciesInfo[]>>(() => {
    const merged: Record<string, SpeciesInfo[]> = {};
    if (customGenomeSpecies.length > 0) {
      merged["CUSTOM_GENOMES"] = customGenomeSpecies;
    }
    Object.assign(
      merged,
      allDefaultGenomeCollections as Record<string, SpeciesInfo[]>,
    );
    for (const [key, genomes] of Object.entries(customCollections)) {
      merged[key] = genomes as SpeciesInfo[];
    }
    return merged;
  }, [customCollections, customGenomeSpecies]);

  const setKeys = useMemo(() => Object.keys(allCollections), [allCollections]);

  // Keys that are built-in (default collections + CUSTOM_GENOMES) vs user-created
  const builtinKeys = useMemo(
    () =>
      new Set(["CUSTOM_GENOMES", ...Object.keys(allDefaultGenomeCollections)]),
    [],
  );

  // Longest possible label — used to lock the button & menu width so they never shrink
  const longestLabel = useMemo(() => {
    const labels = setKeys.map((k) => k.replace(/_/g, " "));
    if (setKeys.length > 1) labels.push(`${setKeys.length} Collections`);
    return labels.reduce((a, b) => (b.length > a.length ? b : a), "");
  }, [setKeys]);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        !dropdownRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [selectedSetKeys, setSelectedSetKeysLocal] = useState<Set<string>>(
    () => {
      const valid = savedSelectedCollections?.filter((k) =>
        Object.keys(allCollections).includes(k),
      );
      return new Set(valid?.length ? valid : [setKeys[0] ?? "Tree_of_Life"]);
    },
  );

  const setSelectedSetKeys = (updater: (prev: Set<string>) => Set<string>) => {
    setSelectedSetKeysLocal((prev) => {
      const next = updater(prev);
      dispatch(setSelectedCollections([...next]));
      return next;
    });
  };

  // When a focusCollection is dispatched, switch to showing only that collection
  useEffect(() => {
    if (!focusCollection) return;
    setSelectedSetKeysLocal(new Set([focusCollection]));
    dispatch(setSelectedCollections([focusCollection]));
    dispatch(setFocusCollection(null));
  }, [focusCollection]);

  // Auto-remove CUSTOM_GENOMES from selection when it becomes empty
  useEffect(() => {
    if (customGenomeSpecies.length === 0) {
      setSelectedSetKeysLocal((prev) => {
        if (!prev.has("CUSTOM_GENOMES")) return prev;
        const next = new Set(prev);
        next.delete("CUSTOM_GENOMES");
        if (next.size === 0) next.add(setKeys[0] ?? "Tree_of_Life");
        dispatch(setSelectedCollections([...next]));
        return next;
      });
    }
  }, [customGenomeSpecies.length]);

  // Keep local state in sync when Redux selectedCollections changes (e.g. after collection deleted)
  // Also cleans up stale persisted Redux state on mount/collection change.
  // Skip when focusCollection is pending — that effect will set the correct selection.
  useEffect(() => {
    if (focusCollection) return;
    const valid = (savedSelectedCollections ?? []).filter((k) =>
      setKeys.includes(k),
    );
    const cleaned = valid.length > 0 ? valid : ["Tree_of_Life"];
    const current = savedSelectedCollections ?? [];
    if (
      cleaned.length !== current.length ||
      cleaned.some((k, i) => k !== current[i])
    ) {
      dispatch(setSelectedCollections(cleaned));
    }
    setSelectedSetKeysLocal(new Set(cleaned));
  }, [setKeys.join(","), focusCollection]);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(),
  );

  // Root mode: track selected assembly for zoom-in animation
  const [selectedPath, setSelectedPath] = useState<
    [GenomeName, AssemblyName] | null
  >(null);

  const toggleCollection = (key: string) => {
    setSelectedSetKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    setSelectedPath(null);
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const activeCollections = useMemo(() => {
    return setKeys
      .filter((key) => selectedSetKeys.has(key))
      .map((key) => ({
        key,
        label: key.replace(/_/g, " "),
        genomes: allCollections[key] ?? [],
      }));
  }, [selectedSetKeys, allCollections, setKeys]);

  // Root mode: create session via selectedPath state (skipped if onSelectGenome is provided)
  useEffect(() => {
    if (variant !== "root" || selectedPath === null) return;
    if (onSelectGenome) return;
    let timeout: any;
    const genomeConfig = getGenomeConfig(selectedPath[1]);
    if (genomeConfig) {
      dispatch(
        createSession({ genome: GenomeSerializer.serialize(genomeConfig) }),
      );
    } else {
      const iGenome = customGenomes.find((g) => g.id === selectedPath[1]);
      if (iGenome) dispatch(createSession({ genome: iGenome }));
    }
    return () => clearTimeout(timeout);
  }, [selectedPath]);

  // Tab mode: directly create session and close panel
  const handlePickAssembly = (genome: SpeciesInfo, assemblyName: string) => {
    if (onSelectGenome) {
      onSelectGenome(genome, assemblyName);
      return;
    }
    const config = getGenomeConfig(assemblyName);
    if (config) {
      dispatch(createSession({ genome: GenomeSerializer.serialize(config) }));
    } else {
      const iGenome = customGenomes.find((g) => g.id === assemblyName);
      if (iGenome) dispatch(createSession({ genome: iGenome }));
    }
    if (onClose) onClose();
  };

  const filteredCollections = useMemo(() => {
    return activeCollections.map((collection) => ({
      ...collection,
      genomes: collection.genomes.filter((genome) => {
        if (!debouncedSearchQuery) return true;
        const searchLower = debouncedSearchQuery.toLowerCase();
        return (
          genome.name.toLowerCase().includes(searchLower) ||
          genome.assemblies.some((version) =>
            version.toLowerCase().includes(searchLower),
          )
        );
      }),
    }));
  }, [debouncedSearchQuery, activeCollections]);

  const isMultiCollection = selectedSetKeys.size > 1;
  const totalFilteredCount = filteredCollections.reduce(
    (acc, c) => acc + c.genomes.length,
    0,
  );

  const resolveUrl = (url?: string | null): string => {
    if (!url) return placeholder;
    if (url.startsWith("http")) return url;
    const base = import.meta?.env?.BASE_URL ?? "/browser/";
    return base + url;
  };

  // Shared collection dropdown (used in both variants)
  const collectionDropdown = (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          if (!dropdownOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + 4, left: rect.left });
          }
          setDropdownOpen((o) => !o);
        }}
        className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-surface text-base font-medium focus:outline-none focus:ring-2 focus:ring-tint cursor-pointer"
      >
        {/* Ghost span locks the button width to the longest possible label */}
        <span className="relative">
          <span aria-hidden="true" className="invisible whitespace-nowrap">
            {longestLabel}
          </span>
          <span className="absolute left-0 top-0 whitespace-nowrap">
            {selectedSetKeys.size === 1
              ? [...selectedSetKeys][0].replace(/_/g, " ")
              : `${selectedSetKeys.size} Collections`}
          </span>
        </span>
        <motion.div
          animate={{ rotate: dropdownOpen ? 90 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <ChevronRightIcon className="w-4 h-4 text-gray-500" />
        </motion.div>
      </button>

      {createPortal(
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position: "fixed",
                top: dropdownPos.top,
                left: dropdownPos.left,
                zIndex: 9999,
              }}
              className="min-w-max rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-surface shadow-lg py-1"
            >
              {/* Ghost row locks the menu width to longest label + right-side indicator */}
              <div
                aria-hidden="true"
                className="invisible h-0 overflow-hidden flex items-center justify-between gap-6 px-4 text-sm whitespace-nowrap"
              >
                <span>{longestLabel}</span>
                <CheckIcon className="w-4 h-4 flex-shrink-0" />
              </div>
              {setKeys.map((key, i) => {
                const isSelected = selectedSetKeys.has(key);
                const isCurrent = key === currentCollection;
                const isBuiltin = builtinKeys.has(key);
                const prevIsBuiltin =
                  i === 0 || builtinKeys.has(setKeys[i - 1]);
                const showDivider = !isBuiltin && prevIsBuiltin;
                const label = key.replace(/_/g, " ");
                return (
                  <div key={key}>
                    {showDivider && (
                      <div className="my-1 border-t border-gray-200 dark:border-gray-600" />
                    )}
                    <button
                      onClick={() => {
                        if (isCurrent) return;
                        toggleCollection(key);
                      }}
                      disabled={isCurrent}
                      className={`flex items-center justify-between w-full gap-6 px-4 py-2 text-sm ${
                        isCurrent
                          ? "text-tint font-semibold cursor-default"
                          : isBuiltin
                            ? "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      <span>{label}</span>
                      {isCurrent ? (
                        <span className="text-xs text-tint opacity-70 font-normal">
                          current
                        </span>
                      ) : isSelected ? (
                        <CheckIcon className="w-4 h-4 text-tint flex-shrink-0" />
                      ) : null}
                    </button>
                  </div>
                );
              })}
              <div className="my-1 border-t border-gray-200 dark:border-gray-600" />
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  dispatch(setOpenNewCollectionForm(true));
                  dispatch(setGenomePickerTab("add"));
                }}
                className="flex items-center w-full gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="text-base leading-none">+</span>
                <span>Create New Collection</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );

  // ── ROOT VARIANT ─────────────────────────────────────────────────────────────
  if (variant === "root") {
    const renderGenomeCard = (genome: SpeciesInfo) => (
      <motion.div
        key={genome.name}
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.15), 0 6px 20px rgba(0,0,0,0.25)",
        }}
        className={`dark:bg-dark-surface ${
          selectedPath !== null ? "col-start-2" : ""
        }`}
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          layout
          style={{
            backgroundImage: `url(${resolveUrl(genome.logoUrl)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            borderRadius: "12px 12px 0 0",
          }}
          className="h-8 w-full"
        />
        <motion.div className="p-4 pb-6">
          <motion.h2
            layout
            className="mb-2"
            initial={{
              textAlign: "left",
              fontSize: "24px",
              lineHeight: "32px",
            }}
            animate={{
              textAlign: selectedPath !== null ? "center" : "left",
              fontSize: selectedPath !== null ? "30px" : "24px",
              lineHeight: selectedPath !== null ? "36px" : "32px",
            }}
          >
            {genome.name}
          </motion.h2>
          {(selectedPath === null
            ? genome.assemblies
            : genome.assemblies.filter((v) => v === selectedPath[1])
          ).map((version) => (
            <motion.div
              layout
              key={version}
              className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-0.5 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
              onClick={() => {
                if (onSelectGenome) {
                  onSelectGenome(genome, version);
                } else {
                  setSelectedPath([genome.name, version]);
                }
              }}
            >
              {selectedPath === null && (
                <ChevronRightIcon className="w-4 h-4" />
              )}
              <motion.p
                className={`${
                  selectedPath !== null ? "text-center text-xl w-full" : ""
                }`}
              >
                {version}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );

    return (
      <div className="max-w-2xl mx-auto h-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 mb-3 gap-4">
          {collectionDropdown}
          <div className="relative sm:mt-0 flex-1 w-full">
            <input
              type="text"
              placeholder="Search for a genome..."
              className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-tint focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {isMultiCollection ? (
          <div>
            {filteredCollections.map((collection) => (
              <div key={collection.key} className="mb-6">
                <button
                  onClick={() => toggleSection(collection.key)}
                  className="flex items-center gap-2 mb-3 w-full text-left"
                >
                  <motion.div
                    animate={{
                      rotate: expandedSections.has(collection.key) ? 90 : 0,
                    }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </motion.div>
                  <span className="font-semibold text-base text-gray-800 dark:text-gray-100">
                    {collection.label}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">
                    ({collection.genomes.length})
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {expandedSections.has(collection.key) && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div
                        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-2 ${
                          selectedPath !== null ? "items-center" : ""
                        }`}
                      >
                        {collection.genomes.map((genome) =>
                          renderGenomeCard(genome),
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${
              selectedPath !== null ? "items-center" : ""
            }`}
          >
            {filteredCollections[0]?.genomes.map((genome) =>
              renderGenomeCard(genome),
            )}
          </div>
        )}

        {totalFilteredCount === 0 && (
          <div className="flex flex-col items-center justify-center mt-16">
            <p className="text-xl text-gray-500">
              {activeCollections.length === 0
                ? "No collection selected"
                : debouncedSearchQuery
                  ? `No genomes found matching "${debouncedSearchQuery}"`
                  : "No genomes found"}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── TAB VARIANT (navbar compact grid) ────────────────────────────────────────
  const renderTabCard = (genome: SpeciesInfo) => {
    const resolved = resolveUrl(genome.logoUrl) || placeholder;
    return (
      <div key={genome.name} className="flex flex-col gap-2 p-2 rounded">
        <div className="flex items-center w-full">
          <div
            style={{
              backgroundImage: resolved ? `url(${resolved})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              opacity: resolved ? 0.8 : 1,
              width: "140px",
              height: "36px",
            }}
            onMouseEnter={(e) => {
              if (resolved)
                (e.currentTarget as HTMLElement).style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              if (resolved)
                (e.currentTarget as HTMLElement).style.opacity = "0.8";
            }}
            className={
              "z-10 rounded-sm transition-opacity relative overflow-hidden cursor-pointer flex-shrink-0 " +
              (resolved ? "outline outline-gray-200" : "")
            }
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="leading-tight text-center break-words w-full"
                style={{
                  color: resolved && genome?.color ? genome.color : "white",
                  fontSize: "16px",
                }}
              >
                <span
                  className={
                    resolved ? "" : "text-gray-700 dark:text-dark-primary"
                  }
                >
                  <i>{genome.name}</i>
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-1" style={{ width: "140px" }}>
          {genome.assemblies.map((v) => (
            <button
              key={v}
              onClick={() => handlePickAssembly(genome, v)}
              className="w-full text-left text-xs italic px-2 py-1 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-dark-secondary border border-gray-200 dark:border-gray-600 rounded transition-colors"
              title={v}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 w-full">
      <div className="p-2 border-b border-gray-200 dark:border-gray-600 flex gap-2 items-center">
        {collectionDropdown}
        <div className="relative flex-1">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search genomes..."
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-dark-background text-gray-800 dark:text-dark-primary outline-none focus:border-blue-400"
            autoFocus
          />
        </div>
      </div>

      <div>
        {isMultiCollection ? (
          <div>
            {filteredCollections.map((collection) => (
              <div key={collection.key} className="mb-4">
                <button
                  onClick={() => toggleSection(collection.key)}
                  className="flex items-center gap-1 px-2 pt-2 pb-1 w-full text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  <motion.div
                    animate={{
                      rotate: expandedSections.has(collection.key) ? 90 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRightIcon className="w-3 h-3" />
                  </motion.div>
                  <span>{collection.label}</span>
                  <span className="text-gray-400 ml-1">
                    ({collection.genomes.length})
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {expandedSections.has(collection.key) && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div
                        className="grid gap-4 p-2"
                        style={{
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(150px, 1fr))",
                        }}
                      >
                        {collection.genomes.map((genome) =>
                          renderTabCard(genome),
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="grid gap-4 p-2"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            }}
          >
            {filteredCollections[0]?.genomes.map((genome) =>
              renderTabCard(genome),
            )}
          </div>
        )}
      </div>

      {totalFilteredCount === 0 && (
        <div className="p-4 text-center text-sm text-gray-500">
          {activeCollections.length === 0
            ? "No collection selected"
            : debouncedSearchQuery
              ? `No genomes matching "${debouncedSearchQuery}"`
              : "No genomes found"}
        </div>
      )}
    </div>
  );
}
