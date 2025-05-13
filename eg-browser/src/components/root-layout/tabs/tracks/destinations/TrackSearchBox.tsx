import React, { useState, useCallback } from "react";
import Autosuggest from "react-autosuggest";

import "./autosuggest.css";

// Constants
const HIERARCHY_DELIMITER = " > ";

const TrackSearchBox: React.FC<TrackSearchBoxProps> = ({
  tracks = [],
  metadataPropToSearch,
  onChange,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>("");

  const _isSameArray = useCallback(
    (array1: any[], array2: any[], numElementsToCompare: number) => {
      for (let i = 0; i < numElementsToCompare; i++) {
        if (array1[i] !== array2[i]) {
          return false;
        }
      }
      return true;
    },
    []
  );

  const getSuggestions = useCallback(
    ({ value }: { value: string }) => {
      let inputHierarchy = value.split(HIERARCHY_DELIMITER);
      let newSuggestions = new Set<string>();
      for (let track of tracks) {
        let trackHierarchy = track.getMetadataAsArray(metadataPropToSearch);
        if (!trackHierarchy) continue;

        if (
          !_isSameArray(
            trackHierarchy,
            inputHierarchy,
            inputHierarchy.length - 1
          )
        )
          continue;

        let rightmostInputCategory = inputHierarchy[inputHierarchy.length - 1];
        let matchingTrackCategory = trackHierarchy[inputHierarchy.length - 1];
        if (!matchingTrackCategory) continue;

        if (
          matchingTrackCategory
            .toLowerCase()
            .startsWith(rightmostInputCategory.toLowerCase())
        ) {
          if (matchingTrackCategory === rightmostInputCategory) {
            continue; // Exclude exact matches
          } else if (inputHierarchy.length < trackHierarchy.length) {
            newSuggestions.add(matchingTrackCategory + HIERARCHY_DELIMITER);
          } else {
            newSuggestions.add(matchingTrackCategory);
          }
        }
      }
      setSuggestions(Array.from(newSuggestions.values()));
    },
    [_isSameArray, metadataPropToSearch, tracks]
  );

  const getSuggestionValue = useCallback(
    (suggestion: string) => {
      let lastIndexOfSplit = inputValue.lastIndexOf(HIERARCHY_DELIMITER);
      if (lastIndexOfSplit < 0) {
        return suggestion;
      }
      let startReplaceIndex = lastIndexOfSplit + HIERARCHY_DELIMITER.length;
      return inputValue.substring(0, startReplaceIndex) + suggestion;
    },
    [inputValue]
  );

  const renderSuggestion = useCallback((suggestion: string) => {
    return suggestion;
  }, []);

  const handleChange = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement>,
      { newValue }: Autosuggest.ChangeEvent
    ) => {
      if (onChange) {
        onChange(newValue);
      }
      setInputValue(newValue);
    },
    [onChange]
  );

  return (
    <Autosuggest
      suggestions={suggestions}
      onSuggestionsFetchRequested={getSuggestions}
      onSuggestionsClearRequested={() => setSuggestions([])}
      getSuggestionValue={getSuggestionValue}
      alwaysRenderSuggestions={true}
      renderSuggestion={renderSuggestion}
      inputProps={{
        placeholder: "Filter...",
        value: inputValue,
        onChange: handleChange,
        style: { width: "100%" },
      }}
      shouldRenderSuggestions={() => true}
    />
  );
};

TrackSearchBox.defaultProps = {
  tracks: [],
};

export default TrackSearchBox;

// Define TypeScript interfaces
interface TrackSearchBoxProps {
  tracks: Array<{ getMetadataAsArray: (prop: string) => any[] | undefined }>;
  metadataPropToSearch: any;
  onChange?: (value: string) => void;
}
