import React, { useState, useRef, useCallback, useEffect } from "react";
import Autosuggest from "react-autosuggest";
import { Manager, Popper } from "react-popper";
// import SpeechRecognition from "react-speech-recognition";
import IsoformSelection from "./IsoformSelection";
import OutsideClickDetector from "../TrackComponents/commonComponents/OutsideClickDetector";

import Gene from "../../../models/Gene";
import _ from "lodash";

export const AWS_API = "https://lambda.epigenomegateway.org/v3";

import "./autosuggest.css";
import "./GeneSearchBox.css";

const MIN_CHARS_FOR_SUGGESTIONS = 3; // Minimum characters to type before displaying suggestions
const ENTER_KEY_CODE = 13;
const ISOFORM_POPOVER_STYLE: React.CSSProperties = {
  zIndex: 10,
  border: "2px solid grey",
  maxHeight: "800px",
  overflow: "auto",
};
const DEBOUNCE_INTERVAL = 50;
// const options = {
//     autoStart: false,
// };

interface GeneSearchBoxBaseProps {
  genomeConfig: any;
  onGeneSelected: (gene: Gene) => void;
  voiceInput?: boolean;
  simpleMode?: boolean;
  color: string;
  background: string;
  transcript?: string; // Example prop, adjust according to your app's usage
  resetTranscript?: () => void;
  startListening?: () => void;
  stopListening?: () => void;
  browserSupportsSpeechRecognition?: boolean;
}

const GeneSearchBoxBase: React.FC<GeneSearchBoxBaseProps> = ({
  genomeConfig,
  onGeneSelected,
  color,
  background,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Gene[]>([]);
  const [isShowingIsoforms, setIsShowingIsoforms] = useState(false);
  const inputRef = useRef<Autosuggest<any, any, any>>(null);

  const getSuggestions = useCallback(
    _.debounce(async (changeData) => {
      const genomeName = genomeConfig.genome.getName();

      const params = {
        q: changeData.value.trim(),
        getOnlyNames: true,
      };
      const url = new URL(`${AWS_API}/${genomeName}/genes/queryName`);
      Object.keys(params).forEach((key) =>
        url.searchParams.append(key, params[key])
      );

      const response = await fetch(url.toString(), {
        method: "GET",
      });
      const data = await response.json();

      setSuggestions(data);
    }, DEBOUNCE_INTERVAL),
    [genomeConfig.genome]
  );

  const handleInputChange = (event, { newValue }) => {
    setInputValue(newValue);
    setIsShowingIsoforms(false);
  };

  const shouldSuggest = (value: string) => {
    return (
      !isShowingIsoforms && value.trim().length >= MIN_CHARS_FOR_SUGGESTIONS
    );
  };

  const showIsoforms = () => {
    setSuggestions([]);
    setIsShowingIsoforms(true);
  };

  const showIsoformsIfEnterPressed = (event: React.KeyboardEvent) => {
    if (event.keyCode === ENTER_KEY_CODE) {
      showIsoforms();
    }
  };

  const setSelectedGene = (gene: Gene) => {
    if (onGeneSelected) {
      onGeneSelected(gene);
    }
    setIsShowingIsoforms(false);
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.input.focus();
    }
  }, [inputValue]);

  let isoformPane;
  if (isShowingIsoforms) {
    isoformPane = (
      <OutsideClickDetector onOutsideClick={() => setIsShowingIsoforms(false)}>
        <IsoformSelection
          geneName={inputValue}
          onGeneSelected={setSelectedGene}
          simpleMode={false}
          color={color}
          background={background}
          genomeConfig={genomeConfig}
        />
      </OutsideClickDetector>
    );
  }

  // dark theme css hack
  const theme = {
    container: `react-autosuggest__container`,
    containerOpen: `react-autosuggest__container--open`,
    input: "react-autosuggest__input",
    inputOpen: "react-autosuggest__input--open",
    inputFocused: "react-autosuggest__input--focused",
    suggestionsContainer: "react-autosuggest__suggestions-container",
    suggestionsContainerOpen: "react-autosuggest__suggestions-container--open",
    suggestionsList: `react-autosuggest__suggestions-list-${color.replace(
      "#",
      ""
    )}`,
    suggestion: "react-autosuggest__suggestion",
    suggestionFirst: "react-autosuggest__suggestion--first",
    suggestionHighlighted: "react-autosuggest__suggestion--highlighted",
    sectionContainer: "react-autosuggest__section-container",
    sectionContainerFirst: "react-autosuggest__section-container--first",
    sectionTitle: "react-autosuggest__section-title",
  };

  return (
    <div>
      {/* {speechSearchBox} */}
      {/* <label style={{ marginBottom: 0 }}>Gene search</label> */}

      <Manager>
        <Autosuggest
          suggestions={suggestions}
          shouldRenderSuggestions={shouldSuggest}
          onSuggestionsFetchRequested={getSuggestions}
          onSuggestionsClearRequested={() => setSuggestions([])}
          getSuggestionValue={_.identity}
          renderSuggestion={_.identity}
          inputProps={{
            placeholder: "Gene symbol",
            value: inputValue,
            onChange: handleInputChange,
            onKeyUp: showIsoformsIfEnterPressed,
            style: {
              width: "100%",
              padding: "6px 8px",
              border: "1px solid #e2e8f0",
              borderRadius: "4px",
            },
          }}
          ref={inputRef}
          onSuggestionSelected={showIsoforms}
          theme={theme}
        />

        {isoformPane}
      </Manager>
    </div>
  );
};

export default GeneSearchBoxBase;
