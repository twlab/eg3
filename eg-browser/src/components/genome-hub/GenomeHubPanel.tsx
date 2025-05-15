import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { createSession } from "@/lib/redux/slices/browserSlice";
import {
  selectCustomGenomes,
  selectCustomGenomesLoadStatus,
} from "@/lib/redux/slices/genomeHubSlice";
import {
  clearAllGenomes,
  refreshLocalGenomes,
} from "@/lib/redux/thunk/genome-hub";
import { IGenome } from "wuepgg3-track";
import { ChevronRightIcon } from "@heroicons/react/16/solid";
import { PlusIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { useNavigation } from "../core-navigation/NavigationStack";

import Button from "../ui/button/Button";
import EmptyView from "../ui/empty/EmptyView";
import Progress from "../ui/progress/Progress";

type GroupedGenomes = {
  [key: string]: IGenome[];
};

type SortedGroupEntry = [string, IGenome[]];

export default function GenomeHubPanel() {
  const dispatch = useAppDispatch();
  const customGenomes = useAppSelector(selectCustomGenomes);
  const customGenomesLoadStatus = useAppSelector(selectCustomGenomesLoadStatus);

  const navigation = useNavigation();

  const { hasGroups, groupedGenomes } = useMemo(() => {
    const hasGroups = customGenomes.some(
      (genome) => genome.group !== undefined
    );

    if (!hasGroups) {
      return { hasGroups: false, groupedGenomes: {} };
    }

    const grouped = customGenomes.reduce<GroupedGenomes>((acc, genome) => {
      const groupName = genome.group || "Other";
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(genome);
      return acc;
    }, {});

    return { hasGroups: true, groupedGenomes: grouped };
  }, [customGenomes]);

  const sortedGroups = useMemo<SortedGroupEntry[]>(() => {
    if (!hasGroups) return [];

    return Object.entries(groupedGenomes).sort(([groupNameA], [groupNameB]) => {
      if (groupNameA === "Other") return 1;
      if (groupNameB === "Other") return -1;
      return groupNameA.localeCompare(groupNameB);
    });
  }, [hasGroups, groupedGenomes]);

  useEffect(() => {
    if (customGenomesLoadStatus === "idle") {
      dispatch(refreshLocalGenomes());
    }
  }, [dispatch, customGenomesLoadStatus]);

  const handleClearAll = () => {
    dispatch(clearAllGenomes());
  };

  return (
    <div className="flex flex-col pt-2 h-full">
      <div className="flex flex-row gap-2 w-full justify-start items-center">
        <Button
          leftIcon={<PlusIcon className="w-4 h-4" />}
          active
          onClick={() => {
            navigation.push({
              path: "add-custom-genome",
            });
          }}
        >
          Add Custom Genome
        </Button>
      </div>
      {customGenomes.length === 0 ? (
        <EmptyView
          title="No Custom Genomes"
          description="Custom genomes are stored locally in your browser. Add a custom genome and it will appear here."
        />
      ) : hasGroups ? (
        <div className="flex flex-col gap-6 mt-4">
          {sortedGroups.map(([groupName, genomes]) => (
            <div key={groupName} className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">{groupName}</h2>
              {genomes.map((genome) => (
                <GenomeHubItem key={genome.id} genome={genome} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4 mt-4">
          {customGenomes.map((genome) => (
            <GenomeHubItem key={genome.id} genome={genome} />
          ))}
        </div>
      )}
    </div>
  );
}

function GenomeHubItem({ genome }: { genome: IGenome }) {
  const dispatch = useAppDispatch();
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => {
      // TODO: preload the genome
      dispatch(createSession({ genome }));
    }, 0);
  };

  const shouldExpand = isHovered && !loading;

  return (
    <motion.div
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="flex flex-col bg-secondary dark:bg-dark-secondary p-4 rounded-2xl cursor-pointer overflow-hidden"
      initial={{ height: "auto" }}
      animate={{ height: shouldExpand ? "auto" : "auto" }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl">{genome.name}</h1>
          <p className="text-sm">
            Chromosomes:{" "}
            {genome.chromosomes.length > 0
              ? genome.chromosomes
                  .slice(0, 3)
                  .map((chr) => chr.name)
                  .join(", ") +
                (genome.chromosomes.length > 3
                  ? ` +${genome.chromosomes.length - 3} more`
                  : "")
              : "None"}
          </p>
        </div>
        {loading ? (
          <div>
            <Progress size={36} />
          </div>
        ) : (
          <motion.div
            animate={{ rotate: shouldExpand ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRightIcon className="size-6" />
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: shouldExpand ? 1 : 0,
          height: shouldExpand ? "auto" : 0,
          marginTop: shouldExpand ? "1rem" : 0,
        }}
        transition={{ duration: 0.2 }}
        className="text-sm text-primary dark:text-dark-primary"
      >
        <div className="flex flex-col gap-2 pt-2 border-t border-primary">
          <p>Default region: {genome.defaultRegion}</p>
          <p>Chromosomes: {genome.chromosomes.length}</p>
          <p>Default tracks: {genome.defaultTracks?.length || 0}</p>
          {genome.chromosomes.length > 0 && (
            <div>
              <p>Chromosomes:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {genome.chromosomes.slice(0, 5).map((chr, i) => (
                  <span
                    key={i}
                    className="bg-primary/10 px-2 py-1 rounded-md text-xs"
                  >
                    {chr.name} ({(chr.length / 1000000).toFixed(1)}Mb)
                  </span>
                ))}
                {genome.chromosomes.length > 5 && (
                  <span className="bg-primary/10 px-2 py-1 rounded-md text-xs">
                    +{genome.chromosomes.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
          <p>Unique ID:</p>
          <p>{genome.id}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
