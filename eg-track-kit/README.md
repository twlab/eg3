# wuepgg-tracks

The WashU Epigenome Browser's tracks on their own: fetch a track's data,
format it and draw it, without the browser around them (no navigator, track
manager, menus, genome hub or redux). For the whole browser, use `wuepgg`.

```sh
npm install wuepgg-tracks
```

React 18 or 19 is a peer dependency.

## Import paths

| Path | What it has |
| --- | --- |
| `wuepgg-tracks` | The models a track and a region are described with: `TrackModel`, `DisplayedRegionModel`, `NavigationContext`, `ChromosomeInterval`, `Feature`, `OpenInterval`, `LinearDrawingModel`. |
| `wuepgg-tracks/draw` | `drawTrack`, and underneath it `formatDataByType`, `getDisplayModeFunction`, `displayModeComponentMap`, `trackOptionMap` (each type's defaults). |
| `wuepgg-tracks/fetch` | `fetchTracks`, `regionRequest`, and underneath them `fetchTypeMap`, `fetchGenomicData`, `fetchGenomeAlignData`. |
| `wuepgg-tracks/fetch-local` | `localFetchTypeMap`, `textFetchTypeMap`, for files the user picked. |
| `wuepgg-tracks/workers` | `createFetchWorker`, `createGenomeAlignWorker`, `askWorker` - the browser's fetch workers, inlined. |
| `wuepgg-tracks/style.css` | The tracks' styles. |

A page that only draws data it already has imports nothing from `fetch`; one
that fetches on a worker loads the fetching code only into the worker.

## Fetch and draw a track

```tsx
import {
  ChromosomeInterval,
  DisplayedRegionModel,
  Feature,
  NavigationContext,
  TrackModel,
} from "wuepgg-tracks";
import { fetchTracks } from "wuepgg-tracks/fetch";
import { drawTrack } from "wuepgg-tracks/draw";
import "wuepgg-tracks/style.css";

// The chromosomes the region is on.
const nav = new NavigationContext("hg19", [
  new Feature("chr7", new ChromosomeInterval("chr7", 0, 159138663)),
]);
const at = nav.parse("chr7:27053397-27373765")!;
const region = new DisplayedRegionModel(nav, at.start, at.end);

const track = new TrackModel({
  type: "bigwig",
  name: "GSM429321",
  url: "https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig",
  options: {},
});

const [fetched] = await fetchTracks([track], region, 900, "hg19");
const element = drawTrack({ trackModel: track, data: fetched.data, region, width: 900 });
```

## On a worker

```ts
import { createFetchWorker, askWorker } from "wuepgg-tracks/workers";
import { regionRequest } from "wuepgg-tracks/fetch";

const worker = createFetchWorker();
const [batch] = await askWorker(worker, [regionRequest([track], region, 900, "hg19")]);
const data = batch.fetchResults[0].result; // then drawTrack({ ..., data })
```

hic, dynamichic and vcf data are class instances that a worker's answer
would strip, so fetch those with `fetchTracks` on the main thread.

## Genome alignment tracks

`genomealign` is not fetched by `fetchTracks`: its fetch also lays the query
genome out against the region, and in fine mode it changes the region's own
coordinates for the other tracks. Use `fetchGenomeAlignData` (or
`createGenomeAlignWorker`) with the request the browser builds in
`TrackManager` (`trackToFetch`, `visData`, `genomicLoci`,
`viewWindowGenomicLoci`, `regionExpandLoci`, `useFineModeNav`, `windowWidth`,
`primaryGenName`).

## Building

```sh
npm run build   # dist/
npm run report  # also writes modules.json: what each built file carries
```

The tracks' sources are eg-tracks' own; this package only chooses which of
them to export and bundles them.
