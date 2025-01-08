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

    return (
      <div key={index} className="mb-2">
        <button
          title="Click to edit"
          className="text-black text-sm hover:text-gray-700"
          onClick={() => setIndexBeingConfigured(index)}
        >
          {text}
        </button>
      </div>
    );
  };

  const setBeingConfigured = sets[indexBeingConfigured];

  return (
    <div className="text-black">
      <h1 className="text-base font-medium mb-4">Select a gene/region set</h1>

      <button
        className="bg-tint text-white px-4 py-2 rounded-md text-sm mb-4"
        onClick={() => setIndexBeingConfigured(sets.length)}
      >
        Add new set
      </button>

      {selectedSet && (
        <button
          className="bg-yellow-500 text-white px-4 py-2 rounded-md ml-2 text-sm"
          onClick={() => onSetSelected(null)}
        >
          Exit region set view
        </button>
      )}

      <div className="mb-4">
        {sets.map((set, index) => renderItemForSet(set, index))}
      </div>

      {indexBeingConfigured === sets.length && (
        <>
          <h2 className="text-base font-medium mb-2">Create a new set</h2>
          <h3 className="text-base mb-1">Enter a list of regions</h3>
          <p className="text-sm mb-4">
            Enter a list of gene names or coordinates to make a gene set one item per line.
            Gene names and coordinates can be mixed for input.
            Coordinate string must be in the form of "chr1:345-678" fields can be joined by space/tab/comma/colon/hyphen.
          </p>
        </>
      )}

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
