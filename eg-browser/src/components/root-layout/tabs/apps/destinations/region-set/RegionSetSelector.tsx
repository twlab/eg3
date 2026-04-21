import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

// Local Component
import RegionSetConfig from "./RegionSetConfig";
import Button from "@/components/ui/button/Button";
import EmptyView from "@/components/ui/empty/EmptyView";
import { generateUUID, GenomeCoordinate } from "wuepgg3-track";
// wuepgg3-track Imports
import {
  RegionSet,
  GenomeSerializer,
  DisplayedRegionModel,
} from "wuepgg3-track";

// Redux Imports
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  selectCurrentSession,
  updateCurrentSession,
} from "@/lib/redux/slices/browserSlice";

// Custom Hooks
import useCurrentGenome from "@/lib/hooks/useCurrentGenome";



import useMidSizeNavigationTab from "@/lib/hooks/useMidSizeNavigationTab";
const RegionSetSelector: React.FC = () => {
  useMidSizeNavigationTab()
  const [showCreate, setShowCreate] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const createSectionRef = useRef<HTMLDivElement>(null);

  const currentSession = useAppSelector(selectCurrentSession);
  const dispatch = useAppDispatch();
  const _genomeConfig = useCurrentGenome();

  if (!currentSession || !_genomeConfig) {
    return null;
  }
  const genomeConfig = GenomeSerializer.deserialize(_genomeConfig);
  const genome = genomeConfig?.genome || null;
  if (!genome) {
    return null;
  }

  // Deserialize sets and restore custom `id` that doesn't survive RegionSet.deserialize
  const sets: RegionSet[] = currentSession?.regionSets
    ? currentSession.regionSets.map((item: any) => {
      if (typeof item === "object") {
        const rs = RegionSet.deserialize(item);
        if (item.id) (rs as any).id = item.id;
        return rs;
      }
      return item;
    })
    : [];

  // Use the raw stored id for comparison to avoid object-reference issues
  const selectedId = (currentSession?.selectedRegionSet as any)?.id ?? null;

  const setConfigured = (newSet: RegionSet) => {
    if (editingIndex !== null && editingIndex >= 0 && editingIndex < sets.length) {
      replaceSet(editingIndex, newSet);
      setEditingIndex(null);
    } else {
      addSet(newSet);
      setShowCreate(false);
    }
  };

  const addSet = (newSet: RegionSet) => {
    (newSet as any).id = generateUUID();
    dispatch(
      updateCurrentSession({
        regionSets: [...(currentSession?.regionSets ?? []), newSet],
      }),
    );
  };
  function onSetSelected(set: RegionSet | null) {
    let coordinate: GenomeCoordinate | null = null;
    if (set) {
      const newVisData: any = new DisplayedRegionModel(set.makeNavContext());
      coordinate =
        newVisData.currentRegionAsString() as GenomeCoordinate | null;
    } else {
      if (genomeConfig) {
        coordinate = genomeConfig.defaultRegion;
      }
    }
    dispatch(
      updateCurrentSession({
        selectedRegionSet: set,
        userViewRegion: coordinate,
      }),
    );
  }
  function onSetsChanged(newSets: Array<RegionSet>) {
    dispatch(
      updateCurrentSession({
        regionSets: newSets,
      }),
    );
  }
  const replaceSet = (index: number, replacement: RegionSet) => {
    const nextSets: Array<any> = sets.slice();
    nextSets[index] = replacement;
    onSetsChanged(nextSets);
    handleSetChangeSideEffects(index, replacement);
  };

  const deleteSet = (index: number) => {
    const nextSets = sets.filter((_, i) => i !== index);
    if (nextSets.length !== sets.length) {
      onSetsChanged(nextSets);
      handleSetChangeSideEffects(index, null);
      setConfirmDeleteIndex(null);
      if (editingIndex === index) setEditingIndex(null);
    }
  };

  const handleSetChangeSideEffects = (
    changedIndex: number,
    newSet: RegionSet | null,
  ) => {
    const oldSet = sets[changedIndex];
    if (selectedId && (oldSet as any).id === selectedId) {
      onSetSelected(newSet);
    }
  };

  const handleAddNewSet = () => {
    setEditingIndex(null);
    setShowCreate(true);
    setTimeout(() => {
      createSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  };

  const handleEditToggle = (index: number) => {
    setShowCreate(false);
    setEditingIndex(editingIndex === index ? null : index);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3 p-4">

      <p className="text-base font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
        Gene / Region Sets
      </p>

      {selectedId && (
        <button
          onClick={() => onSetSelected(null)}
          className="w-full text-base py-2 px-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
        >
          Exit region set view
        </button>
      )}


      {sets.length === 0 && !showCreate && (

        <EmptyView
          title="No Region Sets"
          description="Create a new set to apply a gene or region set view."
        />

      )}

      {/* region sets  */}
      <AnimatePresence initial={false}>
        {sets.map((set, index) => {
          const isCurrentView = !!selectedId && (set as any).id === selectedId;
          const isEditing = editingIndex === index;
          const numRegions = set.features.length;
          const name = set.name || `Unnamed set of ${numRegions} region(s)`;

          return (
            <motion.div
              key={(set as any).id ?? index}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className={`bg-white dark:bg-dark-surface border ring-1 rounded-xl overflow-hidden ${isCurrentView
                ? "border-green-500 dark:border-green-400 ring-2 ring-green-500 dark:ring-green-400"
                : isEditing
                  ? "border-blue-400 dark:border-blue-500 ring-2 ring-blue-400 dark:ring-blue-500"
                  : "border-gray-200 dark:border-gray-700"
                }`}
            >

              <div className="flex items-center justify-between py-1 px-4">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-primary dark:text-dark-primary font-medium text-base truncate">
                    {name}
                  </p>
                  <p className="text-primary/60 dark:text-dark-primary/60 text-base">
                    {numRegions} region{numRegions !== 1 ? "s" : ""}
                  </p>
                  {isCurrentView && (
                    <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 font-medium mt-0.5">
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                      Active view
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">

                  {isCurrentView ? (
                    <span className="text-base px-2 py-3 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                      Current view
                    </span>
                  ) : (
                    <Button
                      backgroundColor="tint"
                      onClick={() => onSetSelected(set)}
                      disabled={numRegions <= 0}
                      style={{ fontSize: "16px", width: "fit-content", padding: "4px 6px" }}
                    >
                      Enter View
                    </Button>
                  )}

                  <button
                    onClick={() => handleEditToggle(index)}
                    className={`p-1.5 rounded-md transition-colors ${isEditing
                      ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                      : "text-primary/60 dark:text-dark-primary/60 hover:bg-gray-100 dark:hover:bg-dark-surface"
                      }`}
                    title={isEditing ? "Close edit" : "Edit set"}
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>


                  <button
                    onClick={() => deleteSet(index)}
                    className="p-1.5 rounded-md transition-colors text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                    title="Delete set"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>


              <AnimatePresence initial={false}>
                {isEditing && (
                  <motion.div
                    key="edit-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-base font-semibold uppercase tracking-wider">
                          <span className="text-blue-500 dark:text-blue-400">Editing</span>
                          <span className="text-primary dark:text-dark-primary"> &ldquo;{name}&rdquo;</span>
                        </p>
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="p-1 rounded-md text-primary/60 dark:text-dark-primary/60 hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
                          aria-label="Close"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <RegionSetConfig
                        set={set}
                        onSetConfigured={setConfigured}
                        onClose={() => setEditingIndex(null)}
                        genome={genome}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* ADD NEW SETS BUTTON*/}

      <Button
        onClick={handleAddNewSet}
        leftIcon={<PlusIcon className="w-4 h-4" />}
        style={{ backgroundColor: "#5E7AC4", color: "#fff", width: "fit-content", padding: "4px 6px" }}
      >
        Add New Set
      </Button>

      <AnimatePresence initial={false}>
        {showCreate && (
          <motion.div
            ref={createSectionRef}
            key="create-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
          >

            <div className="flex items-center justify-between px-4 py-1 border-b border-gray-200 dark:border-gray-700">
              <p className="text-base font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
                Create New Set
              </p>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 rounded-md text-primary/60 dark:text-dark-primary/60 hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
                aria-label="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <RegionSetConfig
              onSetConfigured={setConfigured}
              onClose={() => setShowCreate(false)}
              genome={genome}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegionSetSelector;
