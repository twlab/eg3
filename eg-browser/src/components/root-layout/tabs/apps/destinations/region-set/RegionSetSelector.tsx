import React, { useState } from "react";

import RegionSetConfig from "./RegionSetConfig";

import RegionSet from "@eg/tracks/src/models/RegionSet";
import Genome from "@eg/tracks/src/models/Genome";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  selectCurrentSession,
  updateCurrentSession,
} from "@/lib/redux/slices/browserSlice";
import useCurrentGenome from "@/lib/hooks/useCurrentGenome";
import GenomeSerializer from "@eg/tracks/src/genome-hub/GenomeSerializer";

interface RegionSetSelectorProps {
  genome: Genome;
  selectedSet?: RegionSet;
  onSetsChanged?: (newSets: RegionSet[]) => void;
}

const RegionSetSelector: React.FC<RegionSetSelectorProps> = ({
  selectedSet,
  onSetsChanged = () => undefined,
}) => {
  const [indexBeingConfigured, setIndexBeingConfigured] = useState(0);
  const currentSession = useAppSelector(selectCurrentSession);
  const dispatch = useAppDispatch();
  const _genomeConfig = useCurrentGenome();

  if (!currentSession || !_genomeConfig) {
    return "";
  }
  const genomeName = currentSession?.genomeId || "";
  const genomeConfig = _genomeConfig
    ? GenomeSerializer.deserialize(_genomeConfig)
    : null;
  const genome = genomeConfig?.genome || null;
  if (!genome) {
    return "";
  }
  const sets = currentSession?.regionSets.map((item) => {
    if (typeof item === "object") {
      const newRegionSet = RegionSet.deserialize(item);
      newRegionSet["genome"] = genome;
      return newRegionSet;
    } else {
      return item;
    }
  });

  const setConfigured = (newSet: RegionSet) => {
    if (indexBeingConfigured < 0 || indexBeingConfigured >= sets.length) {
      addSet(newSet);
    } else {
      replaceSet(indexBeingConfigured, newSet);
    }
  };

  const addSet = (newSet: RegionSet) => {
    dispatch(
      updateCurrentSession({
        regionSets: [...currentSession?.regionSets, newSet],
      })
    );
  };
  function onSetSelected(set: RegionSet) {}
  const replaceSet = (index: number, replacement: RegionSet) => {
    const nextSets = sets.slice();
    nextSets[index] = replacement;
    onSetsChanged(nextSets);
    handleSetChangeSideEffects(index, replacement);
  };

  const deleteSet = (index: number) => {
    const nextSets = sets.filter((_, i) => i !== index);
    if (nextSets.length !== sets.length) {
      onSetsChanged(nextSets);
      handleSetChangeSideEffects(index, null);
    }
  };

  const handleSetChangeSideEffects = (
    changedIndex: number,
    newSet: RegionSet | null
  ) => {
    const oldSet = sets[changedIndex];
    if (oldSet === selectedSet) {
      onSetSelected(newSet);
    }
  };

  const renderItemForSet = (set: RegionSet, index: number) => {
    const isBackingView = set === selectedSet;

    const numRegions = set.features.length;
    const name = set.name || `Unnamed set of ${numRegions} region(s)`;
    const text = `${name} (${numRegions} regions)`;

    let useSetButton;
    if (isBackingView) {
      useSetButton = (
        <button className="btn btn-sm btn-info" disabled={true}>
          Is current view
        </button>
      );
    } else {
      useSetButton = (
        <button
          className="btn btn-sm btn-success"
          onClick={() => onSetSelected(set)}
          disabled={numRegions <= 0}
        >
          Enter region set view
        </button>
      );
    }

    const deleteButton = (
      <button
        className="btn btn-sm btn-danger"
        onClick={() => deleteSet(index)}
      >
        DELETE
      </button>
    );

    return (
      <div
        key={index}
        style={{ backgroundColor: isBackingView ? "lightgreen" : undefined }}
      >
        <button
          title="Click to edit"
          className="btn btn-link"
          onClick={() => setIndexBeingConfigured(index)}
        >
          {text}
        </button>{" "}
        {useSetButton} {deleteButton}
      </div>
    );
  };
  console.log(sets, indexBeingConfigured, sets[indexBeingConfigured]);
  return (
    <div>
      <h3>Select a gene/region set</h3>
      {selectedSet ? (
        <button
          className="btn btn-sm btn-warning"
          onClick={() => onSetSelected(null)}
        >
          Exit region set view
        </button>
      ) : null}

      {sets.length > 0
        ? sets.map((set, index) => renderItemForSet(set, index))
        : ""}
      <button
        className="btn btn-sm btn-primary"
        onClick={() => setIndexBeingConfigured(sets.length)}
      >
        Add new set
      </button>

      <RegionSetConfig
        set={sets[indexBeingConfigured]}
        onSetConfigured={setConfigured}
        genome={genome}
      />
    </div>
  );
};

export default RegionSetSelector;
