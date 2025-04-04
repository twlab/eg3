import SingleInputConfig from "./SingleInputConfig";

/**
 * Returns a checkbox that controls play/pause of a dynamic track.
 *
 * @param {Object} props - props from track context menu component
 * @return {JSX.Element} the menu item to render
 */
function PlayingConfig(props) {
  return (
    <SingleInputConfig
      {...props}
      optionName="playing"
      label="Play"
      getInputElement={(inputValue, setNewValue) => (
        <input
          type="checkbox"
          checked={inputValue}
          onChange={(event) => setNewValue(event.target.checked)}
        />
      )}
    />
  );
}

export default PlayingConfig;
