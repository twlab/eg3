import React, { useState, CSSProperties } from "react";
import PropTypes from "prop-types";
import "./MetadataSelectionMenu.css";

interface MetadataSelectionMenuProps {
  terms?: string[];
  style?: CSSProperties;
  onNewTerms?: (newTerms: string[]) => void;
  suggestedMetaSets?: Set<string>;
  onRemoveTerm?: (termToRemove: string[]) => void;
}

const MetadataSelectionMenu: React.FC<MetadataSelectionMenuProps> = ({
  terms = [],
  style = {},
  onNewTerms = () => undefined,
  suggestedMetaSets = new Set<string>(),
  onRemoveTerm = () => undefined,
}) => {
  const [customTerm, setCustomTerm] = useState("");

  /**
   * Requests that an additional metadata term be added to the UI
   * @param term - term to add
   */
  const addTerm = (term: string) => {
    onNewTerms([term]);
  };

  /**
   * Requests that a metadata term be removed from the UI
   * @param termToRemove
   */
  const removeTerm = (termToRemove: string) => {
    onRemoveTerm([termToRemove]);
  };

  /**
   * Handles request to add a custom metadata term.
   */
  const handleAddCustomTerm = () => {
    if (customTerm.length > 0 && !terms.includes(customTerm)) {
      addTerm(customTerm);
    }
    setCustomTerm("");
  };

  /**
   * UI that displays list of currently displayed terms
   * @return {JSX.Element}
   */
  const renderTerms = (): any => {
    return (
      <ul>
        {terms.map((term) => (
          <li key={term}>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => removeTerm(term)}
            >
              -
            </button>
            {term}
          </li>
        ))}
      </ul>
    );
  };

  /**
   * UI that displays list of suggested terms to add
   * @return {JSX.Element}
   */
  const renderSuggestedTerms = (): any => {
    const currentTerms = new Set(terms);
    return (
      <ul>
        {Array.from(suggestedMetaSets).map(
          (term) =>
            !currentTerms.has(term) && (
              <li key={term}>
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => addTerm(term)}
                >
                  +
                </button>
                {term}
              </li>
            )
        )}
      </ul>
    );
  };

  return (
    <div className="MetadataSelectionMenu" style={style}>
      <h5>Current terms</h5>
      {renderTerms()}
      <h5>Suggested terms</h5>
      {renderSuggestedTerms()}
      <h5>Custom term</h5>
      <input
        type="text"
        value={customTerm}
        onChange={(event) => setCustomTerm(event.target.value)}
      />
      <button className="btn btn-sm" onClick={handleAddCustomTerm}>+</button>
    </div>
  );
};

MetadataSelectionMenu.propTypes = {
  terms: PropTypes.arrayOf(PropTypes.string),
  style: PropTypes.object,
  onNewTerms: PropTypes.func,
  suggestedMetaSets: PropTypes.instanceOf(Set),
};

export default MetadataSelectionMenu;
