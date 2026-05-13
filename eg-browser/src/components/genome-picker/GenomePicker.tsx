import useDebounce from "@/lib/hooks/useDebounce";
import { createSession } from "@/lib/redux/slices/browserSlice";
import { ChevronRightIcon, CheckIcon } from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import placeholder from "../../assets/placeholder.png";
import { useAppDispatch } from "../../lib/redux/hooks";

import {
  allDefaultGenomeCollections,
  GenomeSerializer,
  getGenomeConfig,
  type SpeciesInfo,
} from "wuepgg3-track";

type GenomeName = string;
type AssemblyName = string;

export default function GenomePicker() {
  const dispatch = useAppDispatch();

  const [selectedPath, setSelectedPath] = useState<
    [GenomeName, AssemblyName] | null
  >(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const setKeys = Object.keys(allDefaultGenomeCollections);

  const [selectedSetKeys, setSelectedSetKeys] = useState<Set<string>>(
    () => new Set([setKeys[0] ?? "DEFAULT_GENOME_LIST"]),
  );

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleCollection = (key: string) => {
    setSelectedSetKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
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
        label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        genomes:
          (allDefaultGenomeCollections as Record<string, SpeciesInfo[]>)[key] ??
          [],
      }));
  }, [selectedSetKeys]);

  useEffect(() => {
    let timeout: any;

    if (selectedPath !== null) {
      // TODO:
      // 1. preload the genome from indexedDB and store it in memory
      // 2. preload the track data
      // finally, show the session

      const genomeConfig = getGenomeConfig(selectedPath[1]);

      // timeout = setTimeout(() => {
      if (genomeConfig) {
        dispatch(
          createSession({
            genome: GenomeSerializer.serialize(genomeConfig),
          }),
        );
      }
      // }, 10000);
    }

    return () => clearTimeout(timeout);
  }, [selectedPath]);

  const filteredCollections = useMemo(() => {
    return activeCollections
      .map((collection) => ({
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
      }))
      .filter((c) => c.genomes.length > 0);
  }, [debouncedSearchQuery, activeCollections]);

  const isMultiCollection = selectedSetKeys.size > 1;
  const totalFilteredCount = filteredCollections.reduce(
    (acc, c) => acc + c.genomes.length,
    0,
  );

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
          backgroundImage: `url(${(() => {
            const url = genome.logoUrl ?? placeholder;
            if (url.startsWith("http")) return url;
            return (
              (!import.meta || !import.meta.env
                ? "/browser/"
                : import.meta.env.BASE_URL) + url
            );
          })()})`,
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
            onClick={() => setSelectedPath([genome.name, version])}
          >
            {selectedPath === null && <ChevronRightIcon className="w-4 h-4" />}
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
    <div className="max-w-2xl mx-auto py-4 h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        {/* Collection dropdown with checkboxes */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-surface text-base font-medium focus:outline-none focus:ring-2 focus:ring-tint cursor-pointer"
          >
            <span>
              {selectedSetKeys.size === 1
                ? (() => {
                    const k = [...selectedSetKeys][0];
                    return k
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase());
                  })()
                : `${selectedSetKeys.size} Collections`}
            </span>
            <motion.div
              animate={{ rotate: dropdownOpen ? 90 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <ChevronRightIcon className="w-4 h-4 text-gray-500" />
            </motion.div>
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute z-20 mt-1 min-w-max rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-surface shadow-lg py-1"
              >
                {setKeys.map((key) => {
                  const isSelected = selectedSetKeys.has(key);
                  const label = key
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <button
                      key={key}
                      onClick={() => toggleCollection(key)}
                      className="flex items-center justify-between w-full gap-6 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                    >
                      <span>{label}</span>
                      {isSelected && (
                        <CheckIcon className="w-4 h-4 text-tint flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search */}
        <div className="relative mt-2 sm:mt-0 flex-1 w-full">
          <input
            type="text"
            placeholder="Search for a genome..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-tint focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {isMultiCollection ? (
        // Sectioned view when multiple collections are selected
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
        // Flat grid for a single collection
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
            {debouncedSearchQuery
              ? `No genomes found matching "${debouncedSearchQuery}"`
              : "No genomes found"}
          </p>
        </div>
      )}
    </div>
  );
}
