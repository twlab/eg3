import { AnnotationDisplayModes } from "./DisplayModes";

/* The default options of the track configs whose own files also build
   their config menus - kept apart so that a track's defaults can be read
   without loading the menus. */

export const ANNOTATION_DEFAULT_OPTIONS = {
  displayMode: AnnotationDisplayModes.FULL,
  color: "blue",
  color2: "red",
  maxRows: 20,
  height: 40, // For density display mode
  hideMinimalItems: false,
  sortItems: false,
  aggregateMethod: "COUNT",
};

export const CATEGORICAL_DEFAULT_OPTIONS = {
  height: 20,
  color: "blue",
  maxRows: 1,
  hiddenPixels: 0.5,
  alwaysDrawLabel: false,
  category: {},
};
