import React from "react";
import PropTypes from "prop-types";
import FlankingStrategy from "@/models/FlankingStrategy";

interface FlankingStratConfigProps {
  strategy: FlankingStrategy;
  onNewStrategy?: (newStrat: FlankingStrategy) => void;
}

const FlankingStratConfig: React.FC<FlankingStratConfigProps> = ({
  strategy,
  onNewStrategy = () => undefined,
}) => {
  const inputChanged = (
    propToChange: keyof FlankingStrategy,
    value: number | string
  ) => {
    const newStrat = strategy.cloneAndSetProp(propToChange, value);
    onNewStrategy(newStrat);
  };

  return (
    <div>
      <h6>3. Set flanking region</h6>
      <label>
        Upstream bases:{" "}
        <input
          type="number"
          min={0}
          value={strategy.upstream}
          onChange={(event) =>
            inputChanged(
              "upstream",
              Number.parseInt(event.target.value, 10) || 0
            )
          }
        />
      </label>{" "}
      <label>
        Downstream bases:{" "}
        <input
          type="number"
          min={0}
          value={strategy.downstream}
          onChange={(event) =>
            inputChanged(
              "downstream",
              Number.parseInt(event.target.value, 10) || 0
            )
          }
        />
      </label>{" "}
      <label>
        Surrounding:{" "}
        <select
          value={strategy.type}
          onChange={(event) =>
            inputChanged("type", Number.parseInt(event.target.value, 10))
          }
        >
          <option value={FlankingStrategy.SURROUND_ALL}>Whole region</option>
          <option value={FlankingStrategy.SURROUND_START}>Region start</option>
          <option value={FlankingStrategy.SURROUND_END}>Region end</option>
        </select>
      </label>
    </div>
  );
};

FlankingStratConfig.propTypes = {
  strategy: PropTypes.instanceOf(FlankingStrategy).isRequired,
  onNewStrategy: PropTypes.func,
};

FlankingStratConfig.defaultProps = {
  onNewStrategy: () => undefined,
};

export default FlankingStratConfig;
