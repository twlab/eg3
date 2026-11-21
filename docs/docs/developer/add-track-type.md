---
sidebar_position: 2
---

# Add a new track type

A track type is known to several parts of the code: the list of supported types, the configuration menu, the default options, the data source, the drawing code and the pickers in the interface. This page lists each place, in the order to work through them. The `hammock` track type is a small, complete example to copy from; its files are named at each step.

All paths below start at `eg-tracks/src/` unless they begin with `eg-browser/`.

## 1. Name the type

Add the type name, in lower case, to `SUPPORTED_TRACK_TYPES` in `models/trackTypes.ts`.

This list is the single place that says which types the Browser can display. Data is not fetched for a type that is missing from it (the track shows "This track type is currently not supported"), and the track pickers of the interface only offer types that are on it.

## 2. Configuration menu

Create a class that extends `TrackConfig` in `trackConfigs/config-menu-models.tsx/`. It does two things:

- sets the default options of the type with `setDefaultOptions`;
- returns, from `getMenuComponents()`, the items of the menu shown when the track is right-clicked. Ready-made menu items (label, colors, height, display mode, y-axis scale and so on) are in `trackConfigs/config-menu-components.tsx/`.

Then register the class in `TYPE_NAME_TO_CONFIG` in `trackConfigs/config-menu-models.tsx/getTrackConfig.tsx`.

*Example:* `HammockTrackConfig.tsx`.

## 3. Default options

Add an entry for the type to `trackOptionMap` in `components/GenomeView/TrackComponents/defaultOptionsMap.tsx`:

- `defaultOptions`: the options used when the track does not set them;
- `getGenePadding`: for tracks drawn item by item, the room to keep free around an item (used when items are arranged in rows);
- `ROW_HEIGHT`: the height of one row of items.

## 4. Data source

In `getRemoteData/fetchTypeMap.tsx`, add the type to the set that matches how its file is read: `BED_OR_TABIX` for bgzip-compressed, tabix-indexed text files, `BIG` for bigWig-like files, `BIGBED`, `HIC`, `BAM`, `VCF` and so on. If the file can also be loaded from the user's computer, do the same in `getLocalData/localFetchTypeMap.tsx`.

A new kind of file needs a new source class next to the existing ones in `getRemoteData/`.

## 5. Reading the records

Tracks that draw one shape per record (annotation tracks) are drawn straight from the raw records, without building an object for each one. The functions that read a record's name, strand, score and color are in `models/Feature.ts` (`getFeatureName`, `getFeatureStrand`, `getFeatureScore`, `getFeatureColor`). If your records keep these somewhere unusual, add a case for your type there.

*Example:* `models/Hammock.ts` parses the 4th column of a hammock line, and `Feature.ts` uses it for the `hammock` case.

## 6. Drawing

Drawing is organized in `components/GenomeView/TrackComponents/displayModeComponentMap.tsx`.

- For an annotation-style track, add an entry for the type to the map built by `makeAnnotationElementMap`. It receives a group of placed items and returns the SVG elements for them. Also add the type to `rawRenderTracks`, and add a formatter to `formatFunctions`.
- For a numerical, interaction or other kind of track, see how `getDisplayModeFunction` routes the existing types to their components, and add your type to the matching branch.

Put the components that draw the items in a folder under `components/GenomeView/TrackComponents/`.

*Example:* the `hammock` entry of `makeAnnotationElementMap`, and `bedComponents/HammockBar.tsx`, which draws the bars and computes their scale.

## 7. Click tooltip

Add an entry for the type to `geneClickToolTipMap` in `components/GenomeView/TrackComponents/renderClickTooltipMap.tsx`. It returns what is shown when an item of the track is clicked.

*Example:* the `hammock` entry, which shows `commonComponents/annotation/HammockDetail.tsx`.

## 8. Track pickers

So that users can choose the type when adding a track, add it in `eg-browser/src/components/root-layout/tabs/tracks/destinations/`:

- `RemoteTracks.tsx`: the group in `TRACK_TYPES`, a description in `TYPES_DESC`, and `TYPES_NEED_INDEX` if the file needs an index file next to it;
- `LocalTracks.tsx`, if the type can be loaded from the user's computer.

## 9. Tests and documentation

Run the tests from the `eg-tracks` folder:

```sh
yarn test
```

`models/__tests__/trackTypes.test.ts` fails when a type on the supported list is missing its configuration class, default options or data source, so a type cannot be left half added. Add tests for any parsing or calculation of your own next to the code.

Finally, describe the file format in [Track file formats](../tracks/file-tracks.md) and add the type to the list in [Track properties](../datahub/track_properties.md).
