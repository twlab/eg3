import { ChevronRightIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import placeholder from "../../assets/images/icon.png";
import { useGenome } from "../../lib/contexts/GenomeContext";
import Progress from "../ui/progress/Progress";
import useSmallScreen from "@/lib/hooks/useSmallScreen";

export default function GenomePicker() {
  const isSmallScreen = useSmallScreen();
  const { treeOfLife, allGenome, addGenomeView } = useGenome();
  const [selectedPath, setSelectedPath] = useState<[string, string] | null>(
    null
  );
  const [searchText, setSearchText] = useState("");

  const genomeList = useMemo(
    () =>
      Object.entries(treeOfLife).map(([name, data]: [string, any]) => ({
        name,
        versions: data.assemblies,
        logoUrl: data.logoUrl,
      })),
    [treeOfLife]
  );

  const filteredGenomeList = useMemo(() => {
    return genomeList.filter(
      (genome) =>
        genome.name.toLowerCase().includes(searchText.toLowerCase()) ||
        genome.versions.some((version) =>
          version.toLowerCase().includes(searchText.toLowerCase())
        )
    );
  }, [genomeList, searchText]);

  useEffect(() => {
    let timeout: any;

    if (selectedPath !== null) {
      // TODO: instead of a fixed timeout duration, wait for the first page of data to load into the browser
      // timeout = setTimeout(() => {
        const genomeName = selectedPath[1];
        const genomeData = allGenome[genomeName];

        if (genomeData) {
          addGenomeView(genomeData);
        }
      // }, 1000);
    }

    return () => clearTimeout(timeout);
  }, [selectedPath, allGenome, addGenomeView]);

  return (
    <div className="max-w-2xl mx-auto pt-4 h-full">
      <div className={`${isSmallScreen ? 'flex flex-col gap-2' : 'flex justify-between items-center'} mb-6`}>
        <h2 className="text-3xl text-tint">Select a Genome</h2>
        
        <div className={`${isSmallScreen ? 'flex-1' : 'w-64'}`}>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for a genome..."
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div
        className={`grid ${isSmallScreen ? 'grid-cols-1' : 'grid-cols-3'
          } gap-4 ${selectedPath !== null ? "items-center" : ""
          }`}
      >
        <AnimatePresence>
          {(selectedPath === null
            ? filteredGenomeList
            : filteredGenomeList.filter((g) => g.name === selectedPath[0])
          ).map((genome) => (
            <motion.div
              key={genome.name}
              className={`rounded-2xl shadow-md ${selectedPath !== null && !isSmallScreen ? "col-start-2" : ""
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
                src={genome.logoUrl || placeholder}
                alt={genome.name}
                className="rounded-2xl h-24 w-full object-cover"
              />
              <motion.div className="p-4 pb-6">
                <motion.h2
                  layout
                  className={`text-primary mb-2`}
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
                    className="flex items-center gap-2 text-primary cursor-pointer"
                    onClick={() => setSelectedPath([genome.name, version])}
                  >
                    {selectedPath === null && (
                      <ChevronRightIcon className="w-4 h-4" />
                    )}
                    <motion.p
                      className={`${selectedPath !== null ? "text-center text-xl w-full" : ""
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
        </AnimatePresence>
      </div>
      {filteredGenomeList.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <img
            src={placeholder}
            alt="No results"
            className="w-24 h-24 mx-auto mb-4"
          />
          <h3 className="text-xl text-gray-600 mb-2">No results found</h3>
          <p className="text-gray-500">
            Try searching for a different genome or assembly name
          </p>
        </motion.div>
      )}
      {selectedPath && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-primary"
          onClick={() => setSelectedPath(null)}
        >
          ← Back to all genomes
        </motion.button>
      )}
    </div>
  );
}
