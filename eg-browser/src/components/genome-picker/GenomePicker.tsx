import useDebounce from "@/lib/hooks/useDebounce";
import useSmallScreen from "@/lib/hooks/useSmallScreen";
import {
  BrowserSession,
  createSession,
  setCurrentSession,
} from "@/lib/redux/slices/browserSlice";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import placeholder from "../../assets/placeholder.png";
import { useAppDispatch } from "../../lib/redux/hooks";

import {
  DEFAULT_GENOME_LIST,
  allDefaultGenomeSets,
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
  const [selectedSetKey, setSelectedSetKey] = useState<string>("DEFAULT_GENOME_LIST");

  const setKeys = Object.keys(allDefaultGenomeSets);

  const activeGenomeList: Genome[] = selectedSetKey === "ALL"
    ? Object.values(allDefaultGenomeSets).flat()
    : (allDefaultGenomeSets as Record<string, Genome[]>)[selectedSetKey] ?? DEFAULT_GENOME_LIST;

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

  const filteredGenomes = useMemo(() => {
    return activeGenomeList.filter((genome) => {
      if (!debouncedSearchQuery) return true;

      const searchLower = debouncedSearchQuery.toLowerCase();
      return (
        genome.name.toLowerCase().includes(searchLower) ||
        genome.assemblies.some((version) =>
          version.toLowerCase().includes(searchLower),
        )
      );
    });
  }, [debouncedSearchQuery, activeGenomeList]);

  return (
    <div className="max-w-2xl mx-auto py-4 h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="relative">
          <select
            value={selectedSetKey}
            onChange={(e) => {
              setSelectedSetKey(e.target.value);
              setSelectedPath(null);
            }}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-surface text-base font-medium focus:outline-none focus:ring-2 focus:ring-tint cursor-pointer"
          >
            <option value="ALL">All</option>
            {setKeys.map((key) => (
              <option key={key} value={key}>
                {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
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
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${
          selectedPath !== null ? "items-center" : ""
        }`}
      >
        {filteredGenomes
          // selectedPath === null
          // ?
          // : filteredGenomes.filter((g) => g.name === selectedPath[0])
          .map((genome) => (
            <motion.div
              key={genome.name}
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow:
                  "0 0 0 1px rgba(0,0,0,0.15), 0 6px 20px rgba(0,0,0,0.25)",
              }}
              className={`dark:bg-dark-surface ${
                selectedPath !== null ? "col-start-2" : ""
              }`}
              layout
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
              }}
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
                  className={`mb-2`}
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
                    {selectedPath === null && (
                      <ChevronRightIcon className="w-4 h-4" />
                    )}
                    <motion.p
                      className={`${
                        selectedPath !== null
                          ? "text-center text-xl w-full"
                          : ""
                      }`}
                    >
                      {version}
                    </motion.p>
                  </motion.div>
                ))}
                {/* {selectedPath !== null && (
                    <div className="flex justify-center pt-4">
                      <Progress size={36} />
                    </div>
                  )} */}
              </motion.div>
            </motion.div>
          ))}
      </div>
      {/* {selectedPath && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-primary"
              onClick={() => setSelectedPath(null)}
            >
              ← Cancel
            </motion.button>
          )} */}
      {filteredGenomes.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-16">
          <p className="text-xl text-gray-500">
            No genomes found matching "{debouncedSearchQuery}"
          </p>
        </div>
      )}
    </div>
  );
}
