import SelectConfig from "./SelectConfig";
import { SortItemsOptions } from "@/models/SortItemsOptions";

function SortItemsConfig(props) {
  return (
    <SelectConfig
      optionName="sortItems"
      label="Sort items order"
      defaultValue={SortItemsOptions.NONE}
      choices={SortItemsOptions}
      {...props}
    />
  );
}

export default SortItemsConfig;
