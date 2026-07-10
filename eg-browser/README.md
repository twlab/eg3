# wuepgg

[WashU Epigenome Browser](https://epigenomegateway.wustl.edu/) can now be used directly in your app as a React component. Create an interactable component and visualize your genome data.

> **Try it:** An example app is available at [twlab/embed-eg3](https://github.com/twlab/embed-eg3). Clone it to see `GenomeHub` being integrated in different scenarios.

## Installation

```bash
npm install wuepgg
```

> **Note:** React 18 or 19 is required (declared as a peer dependency).

## Quick start

Import GenomeHub component and its stylesheet, and render it in your app:

```tsx
import { GenomeHub } from "wuepgg";
import "wuepgg/style.css";

export default function App() {
  return (
    <GenomeHub
      storeConfig={{ storeId: "genome-1" }}
      genomeName="hg38"
      viewRegion={{ genomeCoordinate: "chr7:27053397-27373765" }}
    />
  );
}
```

> **Note:** `import "wuepgg/style.css"` is required for the browser to render correctly. Import it once, typically at your app's entry point.

## Usage

### Full example

```tsx
import { GenomeHub } from "wuepgg";
import "wuepgg/style.css";

const tracks = [
  {
    type: "ruler",
    name: "Ruler",
  },
  {
    type: "geneAnnotation",
    name: "gencodeV47",
    genome: "hg19",
    options: {
      maxRows: 10,
    },
  },
  {
    type: "geneAnnotation",
    name: "refGene",
    genome: "hg19",
    options: {
      maxRows: 10,
    },
  },
];
const viewRegion = { genomeCoordinate: "chr7:27053397-27373765" };
const genomeName = "hg19";
const storeConfig = { storeId: "genome-1" };
export default function Browser() {
  return (
    <GenomeHub
      storeConfig={storeConfig}
      viewRegion={viewRegion}
      genomeName={genomeName}
      tracks={tracks}
      showGenomeNavigator={true}
      showNavBar={true}
      showToolBar={true}
      darkMode={false}
      onSessionUpdate={(session) => {
        console.log(session);
      }}
    />
  );
}
```

### Getting the current session state of GenomeHub

`onSessionUpdate` fires whenever the active session changes (title, view region, or tracks). The callback receives a `SessionData` object, or `null` when no session is active. User can use this data to
update their own app based on the state in GenomeHub.

```tsx
<GenomeHub
  genomeName="hg38"
  onSessionUpdate={(session) => {
    if (!session) return;
    console.log("Region:", session.userViewRegion);
    console.log("Tracks:", session.tracks);
  }}
/>
```

### Multiple isolated instances

Give each instance a unique `storeId` to let user have multiple
GenomeHub component maintaining their own state.

```tsx
<GenomeHub storeConfig={{ storeId: "hub-1" }} genomeName="hg38" />
<GenomeHub storeConfig={{ storeId: "hub-2" }} genomeName="mm10" />
```

Each `storeId` is namespaced separately in `localStorage`. To clean up an instance's persisted state, remove its key:

```ts
localStorage.removeItem("persist:hub-2");
```

### Disabling persistence

By default, enablePersistence is true. Set `enablePersistence: false` for an instance that resets on every prop update.

```tsx
<GenomeHub
  storeConfig={{ storeId: "preview", enablePersistence: false }}
  genomeName="hg38"
/>
```

## Schema

### `GenomeHubProps`

Props accepted by `<GenomeHub />`. Props marked with <span style="color:red">\*</span> are required; all others are optional.

#### Required props <span style="color:red">\*</span>

| Prop                                            | Type                                                                 | Description                                                         |
| ----------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `storeConfig` <span style="color:red">\*</span> | `StoreConfig`                                                        | State configuration for this instance (id, persistence). See below. |
| `viewRegion` <span style="color:red">\*</span>  | `string \| { genomeCoordinate: string \| GenomeCoordinate } \| null` | Initial region to display, e.g. `"chr7:27053397-27373765"`.         |
| `genomeName` <span style="color:red">\*</span>  | `string`                                                             | Genome assembly to load, e.g. `"hg38"`, `"mm10"`.                   |
| `tracks` <span style="color:red">\*</span>      | `Array<TrackConfig>`                                                 | Track configurations to render. See [Track config](#track-config).  |

#### Optional props

| Prop                  | Type                                  | Default | Description                                          |
| --------------------- | ------------------------------------- | ------- | ---------------------------------------------------- |
| `chromosomes`         | `any`                                 | —       | Needed if you want to use a custom genome.           |
| `showGenomeNavigator` | `boolean`                             | `false` | Show the genome navigator (ideogram/overview) panel. |
| `showNavBar`          | `boolean`                             | `false` | Show the top navigation bar.                         |
| `showToolBar`         | `boolean`                             | `false` | Show the toolbar controls.                           |
| `showDisclosure`      | `boolean`                             | `false` | Show the disclosure/legal panel.                     |
| `width`               | `number`                              | —       | Desired app width in pixels.                         |
| `height`              | `number`                              | —       | Desired app height in pixels.                        |
| `windowWidth`         | `number`                              | —       | Window width in pixels for responsive layout.        |
| `darkMode`            | `boolean`                             | `false` | Render in dark mode.                                 |
| `onSessionUpdate`     | `(data: SessionData \| null) => void` | —       | Called when the active session changes.              |

### Track config

Each entry in the `tracks` array describes a single track. Common fields:

| Field      | Type     | Description                                                       |
| ---------- | -------- | ----------------------------------------------------------------- |
| `name`     | `string` | Display name of the track.                                        |
| `type`     | `string` | Track type, e.g. `"bigwig"`, `"geneAnnotation"`, `"genomealign"`. |
| `url`      | `string` | Data file URL (for data-backed track types).                      |
| `genome`   | `string` | Genome assembly for annotation tracks, e.g. `"hg38"`.             |
| `metadata` | `object` | Arbitrary key/value metadata (e.g. `{ cell, assay }`).            |
| `options`  | `object` | Display options, e.g. `{ color, label, group }`.                  |

## Requirements

- React 19 (peer dependency)
- A bundler that supports importing CSS (Vite, webpack, etc.)
- A browser environment — the component relies on `localStorage` and `sessionStorage` for persistence.

## License

See the repository for license details.

```

```
