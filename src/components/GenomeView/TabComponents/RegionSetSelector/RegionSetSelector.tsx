import React, { useState } from "react";
import PropTypes from "prop-types";

import RegionSetConfig from "./RegionSetConfig";

import RegionSet from "@/models/RegionSet";
import Genome from "@/models/Genome";

interface RegionSetSelectorProps {
  genome: Genome;
  sets: RegionSet[];
  selectedSet?: RegionSet;
  onSetsChanged?: (newSets: RegionSet[]) => void;
  onSetSelected?: (set: RegionSet | null) => void;
}

const RegionSetSelector: React.FC<RegionSetSelectorProps> = ({
  genome,
  sets,
  selectedSet,
  onSetsChanged = () => undefined,
  onSetSelected = () => undefined,
}) => {
  const [indexBeingConfigured, setIndexBeingConfigured] = useState(0);

  const setConfigured = (newSet: RegionSet) => {
    if (indexBeingConfigured < 0 || indexBeingConfigured >= sets.length) {
      addSet(newSet);
    } else {
      replaceSet(indexBeingConfigured, newSet);
    }
  };

  const addSet = (newSet: RegionSet) => {
    const nextSets = sets.slice();
    nextSets.push(newSet);
    onSetsChanged(nextSets);
  };

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

  const setBeingConfigured = sets[indexBeingConfigured];

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
      {sets.map((set, index) => renderItemForSet(set, index))}
      <button
        className="btn btn-sm btn-primary"
        onClick={() => setIndexBeingConfigured(sets.length)}
      >
        Add new set
      </button>
      <RegionSetConfig
        genome={genome}
        set={setBeingConfigured}
        onSetConfigured={setConfigured}
      />
    </div>
  );
};

RegionSetSelector.propTypes = {
  genome: PropTypes.instanceOf(Genome).isRequired,
  sets: PropTypes.any.isRequired,
  selectedSet: PropTypes.instanceOf(RegionSet),
  onSetsChanged: PropTypes.func,
  onSetSelected: PropTypes.func,
};

RegionSetSelector.defaultProps = {
  onSetsChanged: () => undefined,
  onSetSelected: () => undefined,
};

export default RegionSetSelector;
