import TrackModel from "../../models/TrackModel";
import {
  BackgroundColorConfig,
  SecondaryColorConfig,
  ColorConfig,
} from "../config-menu-components.tsx/ColorConfig";
import SmoothConfig from "../config-menu-components.tsx/SmoothConfig";
import YscaleConfig from "../config-menu-components.tsx/YscaleConfig";
import { AnnotationTrackConfig } from "./AnnotationTrackConfig";
import { AnnotationDisplayModes } from "./DisplayModes";

export class BamTrackConfig extends AnnotationTrackConfig {
  constructor(trackModel: TrackModel) {
    super(trackModel);
    this.setDefaultOptions({
      mismatchColor: "yellow",
      deletionColor: "black",
      insertionColor: "green",
      color: "red",
      color2: "blue",
      smooth: 0, // for density mode
    });
  }

  getMenuComponents() {
    const menu = super.getMenuComponents();
    if (this.getOptions().displayMode === AnnotationDisplayModes.FULL) {
      menu.splice(
        menu.findIndex((component) => component === BackgroundColorConfig),
        0,
        MismatchColorConfig
      );
    } else {
      menu.splice(
        menu.findIndex((component) => component === SecondaryColorConfig),
        1,
        YscaleConfig,
        SmoothConfig
      );
    }
    return menu;
  }
}

function MismatchColorConfig(props: any) {
  return (
    <ColorConfig
      {...props}
      optionName="mismatchColor"
      label="Mismatched base color"
    />
  );
}
