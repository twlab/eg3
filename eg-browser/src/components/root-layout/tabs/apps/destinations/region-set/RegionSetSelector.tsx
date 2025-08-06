import React, { useState } from "react";

// Local Component
import RegionSetConfig from "./RegionSetConfig";

// wuepgg3-track-test Imports
import {
  RegionSet,
  GenomeSerializer,
  DisplayedRegionModel,
} from "wuepgg3-track-test";

// Redux Imports
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  selectCurrentSession,
  updateCurrentSession,
} from "@/lib/redux/slices/browserSlice";

// Custom Hooks
import useCurrentGenome from "@/lib/hooks/useCurrentGenome";
const RegionSetSelector: React.FC = ({}) => {
  const [indexBeingConfigured, setIndexBeingConfigured] = useState(0);
  const currentSession = useAppSelector(selectCurrentSession);
  const dispatch = useAppDispatch();
  const _genomeConfig = useCurrentGenome();
  const selectedRegionSet = currentSession?.selectedRegionSet;
  if (!currentSession || !_genomeConfig) {
    return "";
  }
  const genomeConfig = _genomeConfig
    ? GenomeSerializer.deserialize(_genomeConfig)
    : null;
  const genome = genomeConfig?.genome || null;
  if (!genome) {
    return "";
  }
  const sets = currentSession?.regionSets
    ? currentSession?.regionSets.map((item) => {
        if (typeof item === "object") {
          const newRegionSet = RegionSet.deserialize(item);

          return newRegionSet;
        } else {
          return item;
        }
      })
    : [];

  const setConfigured = (newSet: RegionSet) => {
    if (indexBeingConfigured < 0 || indexBeingConfigured >= sets.length) {
      addSet(newSet);
    } else {
      replaceSet(indexBeingConfigured, newSet);
    }
  };

  const addSet = (newSet: RegionSet) => {
    newSet["id"] = crypto.randomUUID();
    dispatch(
      updateCurrentSession({
        regionSets: [...currentSession?.regionSets, newSet],
      })
    );
  };
  function onSetSelected(set: RegionSet | null) {
    let start;
    let end;
    if (set) {
      const newVisData: any = new DisplayedRegionModel(set.makeNavContext());
      start = newVisData._startBase;
      end = newVisData._endBase;
    } else {
      start = genomeConfig?.defaultRegion.start;
      end = genomeConfig?.defaultRegion.end;
    }

    dispatch(
      updateCurrentSession({
        selectedRegionSet: set,
        userViewRegion: { start, end },
      })
    );
  }
  function onSetsChanged(newSets: Array<RegionSet>) {
    dispatch(
      updateCurrentSession({
        regionSets: newSets,
      })
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
    }
  };

  const handleSetChangeSideEffects = (
    changedIndex: number,
    newSet: RegionSet | null
  ) => {
    const oldSet = sets[changedIndex];
    if (selectedRegionSet) {
      if (oldSet.id === selectedRegionSet.id) {
        onSetSelected(newSet);
      }
    }
  };
  const buttonStyle = {
    padding: "8px 12px",
    margin: "4px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    display: "inline-block",
    disabled: {
      backgroundColor: "#E1EBEE", // Lightened color for disabled buttons if necessary
    },
  };
  const renderItemForSet = (set, index) => {
    let isBackingView = false;
    if (selectedRegionSet) {
      isBackingView = set.id === selectedRegionSet.id;
    }

    const numRegions = set.features.length;
    const name = set.name || `Unnamed set of ${numRegions} region(s)`;
    const text = `${name} (${numRegions} regions)`;

    let useSetButton;
    if (isBackingView) {
      useSetButton = (
        <button
          style={{
            ...smallerButtonStyle,
            backgroundColor: "#17a2b8",
            cursor: "not-allowed",
          }}
          disabled={true}
        >
          Is current view
        </button>
      );
    } else {
      useSetButton = (
        <button
          style={{ ...smallerButtonStyle, backgroundColor: "#28a745" }}
          onClick={() => onSetSelected(set)}
          disabled={numRegions <= 0}
        >
          Enter view
        </button>
      );
    }

    const deleteButton = (
      <button
        style={{ ...smallerButtonStyle, backgroundColor: "#dc3545" }}
        onClick={() => deleteSet(index)}
      >
        Delete
      </button>
    );

    return (
      <div
        key={index}
        style={{
          backgroundColor: isBackingView ? "#d4edda" : "#fff",
          border: "1px solid #ccc",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "16px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <button
            title="Click to edit"
            style={{
              background: "none",
              border: "none",
              color: "#007bff",
              cursor: "pointer",
              textAlign: "left",
              paddingLeft: "0",
              textDecoration: "underline",
              marginBottom: "8px",
            }}
            onClick={() => setIndexBeingConfigured(index)}
          >
            {text}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {useSetButton}
            {deleteButton}
          </div>
        </div>
      </div>
    );
  };

  const smallerButtonStyle = {
    padding: "6px 8px",
    fontSize: "12px",
    margin: "4px",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        margin: "16px",
      }}
    >
      <h3>Select a gene/region set</h3>
      {selectedRegionSet ? (
        <button
          style={{ ...buttonStyle, backgroundColor: "#FFC107" }}
          onClick={() => onSetSelected(null)}
        >
          Exit region set view
        </button>
      ) : (
        ""
      )}

      {sets.length > 0
        ? sets.map((set, index) => renderItemForSet(set, index))
        : ""}
      <button
        style={{ ...buttonStyle, backgroundColor: "#205781" }}
        onClick={() => setIndexBeingConfigured(sets.length)}
      >
        Add new set
      </button>
      <div style={{ display: "flex", alignItems: "center", margin: "20px 0" }}>
        <div
          style={{ flex: 1, height: "1px", backgroundColor: "#205781" }}
        ></div>

        <div
          style={{ flex: 1, height: "1px", backgroundColor: "#205781" }}
        ></div>
      </div>
      <RegionSetConfig
        set={sets[indexBeingConfigured]}
        onSetConfigured={setConfigured}
        genome={genome}
      />
    </div>
  );
};

export default RegionSetSelector;
