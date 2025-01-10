import SelectConfig from "./SelectConfig";
import { ArrayAggregatorTypes } from "@eg/core/src/eg-lib/models/FeatureAggregator";

/**
 * the options to control data aggregate for dynamic numerical track, default is mean
 *
 */

function ArrayAggregateConfig(props) {
  return (
    <SelectConfig
      {...props}
      optionName="arrayAggregateMethod"
      label="Array Aggregate method:"
      choices={ArrayAggregatorTypes}
      defaultValue={ArrayAggregatorTypes.MEAN}
    />
  );
}

export default ArrayAggregateConfig;
