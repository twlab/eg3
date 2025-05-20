import useDebounce from "@/lib/hooks/useDebounce";
import useSmallScreen from "@/lib/hooks/useSmallScreen";
import {
  BrowserSession,
  createSession,
  selectSessions,
  setCurrentSession,
} from "@/lib/redux/slices/browserSlice";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import placeholder from "../../assets/placeholder.png";
import { useAppDispatch, useAppSelector } from "../../lib/redux/hooks";
import NavigationStack from "../core-navigation/NavigationStack";
import SessionList from "../sessions/SessionList";
import Progress from "../ui/progress/Progress";
import { GENOME_LIST } from "./genome-list";
import TabView from "../ui/tab-view/TabView";
import GenomeHubPanel from "../genome-hub/GenomeHubPanel";
import AddCustomGenome from "../genome-hub/AddCustomGenome";
import GenomeSchemaView from "../genome-hub/GenomeSchemaView";
import { getGenomeConfig } from "@eg/tracks";
import GenomeSerializer from "@eg/tracks/src/genome-hub/GenomeSerializer";
import ImportSession from "../sessions/ImportSession";

type GenomeName = string;
type AssemblyName = string;

const CURL_RADIUS = 15;

export default function GenomePicker() {
  const dispatch = useAppDispatch();
  const sessions = useAppSelector(selectSessions);

  const isSmallScreen = useSmallScreen();

  const [selectedPath, setSelectedPath] = useState<
    [GenomeName, AssemblyName] | null
  >(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    let timeout: any;

    if (selectedPath !== null) {
      // TODO:
      // 1. preload the genome from indexedDB and store it in memory
      // 2. preload the track data
      // finally, show the session

      const genomeConfig = getGenomeConfig(selectedPath[1]);

      timeout = setTimeout(() => {
        dispatch(
          createSession({
            genome: GenomeSerializer.serialize(genomeConfig),
          })
        );
      }, 0);
    }

    return () => clearTimeout(timeout);
  }, [selectedPath]);

  const handleSessionClick = (session: BrowserSession) => {
    dispatch(setCurrentSession(session.id));
  };

  const filteredGenomes = useMemo(() => {
    return GENOME_LIST.filter((genome) => {
      if (!debouncedSearchQuery) return true;

      const searchLower = debouncedSearchQuery.toLowerCase();
      return (
        genome.name.toLowerCase().includes(searchLower) ||
        genome.versions.some((version) =>
          version.toLowerCase().includes(searchLower)
        )
      );
    });
  }, [debouncedSearchQuery]);

  return (
    <div className="h-full flex flex-row bg-black">
      {!isSmallScreen && (
        <div
          className="h-full w-[25vw] min-w-96 overflow-hidden"
          style={{
            borderTopRightRadius: CURL_RADIUS,
            borderBottomRightRadius: CURL_RADIUS,
          }}
        >
          <NavigationStack
            destinations={[
              {
                component: AddCustomGenome,
                path: "add-custom-genome",
                options: {
                  title: "Add Custom Genome",
                },
              },
              {
                component: GenomeSchemaView,
                path: "genome-schema",
                options: {
                  title: "Genome Schema",
                },
              },
              {
                component: ImportSession,
                path: "import-session",
                options: {
                  title: "Import Session",
                },
              },
            ]}
          >
            <TabView<"sessions" | "genomes">
              initialTab={sessions.length > 0 ? "sessions" : "genomes"}
              tabs={[
                {
                  label: "Sessions",
                  value: "sessions",
                  component: (
                    <SessionList
                      onSessionClick={handleSessionClick}
                      showImportSessionButton
                    />
                  ),
                },
                {
                  label: "Genomes",
                  value: "genomes",
                  component: <GenomeHubPanel />,
                },
              ]}
            />
          </NavigationStack>
        </div>
      )}
      <div
        className="flex-1 overflow-y-scroll px-4 bg-white dark:bg-dark-background"
        style={{
          borderTopLeftRadius: !isSmallScreen ? CURL_RADIUS : 0,
          borderBottomLeftRadius: !isSmallScreen ? CURL_RADIUS : 0,
          marginLeft: !isSmallScreen ? 5 : 0,
        }}
      >
        <div className="max-w-2xl mx-auto py-4 h-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-3xl">Select a Genome</h2>
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
            {(selectedPath === null
              ? filteredGenomes
              : filteredGenomes.filter((g) => g.name === selectedPath[0])
            ).map((genome) => (
              <motion.div
                key={genome.name}
                className={`rounded-2xl shadow-md dark:bg-dark-surface ${
                  selectedPath !== null ? "col-start-2" : ""
                }`}
                layout
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                }}
                exit={{ opacity: 0 }}
              >
                <motion.img
                  layout
                  src={
                    import.meta.env.BASE_URL + (genome.logoUrl ?? placeholder)
                  }
                  alt={genome.name}
                  className="rounded-2xl h-28 w-full object-cover object-top"
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
                    ? genome.versions
                    : genome.versions.filter((v) => v === selectedPath[1])
                  ).map((version) => (
                    <motion.div
                      layout
                      key={version}
                      className="flex items-center gap-2 cursor-pointer"
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
                  {selectedPath !== null && (
                    <div className="flex justify-center pt-4">
                      <Progress size={36} />
                    </div>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>
          {selectedPath && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-primary"
              onClick={() => setSelectedPath(null)}
            >
              ← Cancel
            </motion.button>
          )}
          {filteredGenomes.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-16">
              <p className="text-xl text-gray-500">
                No genomes found matching "{debouncedSearchQuery}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
