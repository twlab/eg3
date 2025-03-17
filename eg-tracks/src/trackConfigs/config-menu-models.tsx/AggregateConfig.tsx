import SelectConfig from "../config-menu-components.tsx/SelectConfig";
import { AggregatorTypes } from "../../models/FeatureAggregator";

/**
 * the options to control data aggregate for numerical track, default is mean
 *
 */

function AggregateConfig(props) {
  return (
    <SelectConfig
      {...props}
      optionName="aggregateMethod"
      label="Aggregate method:"
      choices={AggregatorTypes}
      defaultValue={AggregatorTypes.MEAN}
    />
  );
}

export default AggregateConfig;
