---
sidebar_position: 6
---

# Run your own copy

Most users only need the public Browser at [https://epigenomegateway.wustl.edu/browser/](https://epigenomegateway.wustl.edu/browser/). This page is for people who want to run the Browser on their own computer or server, or use it inside their own web application.

The Browser is a static web application: once built, it is a folder of files that any web server can serve. There is no server-side program to install.

## Run the Browser locally

You need [Node.js](https://nodejs.org/) (version 20 or above) and the [yarn](https://classic.yarnpkg.com/) package manager.

1. Get the code:

    ```sh
    git clone https://github.com/twlab/eg3.git
    cd eg3
    ```

2. Install the packages from the root folder:

    ```sh
    yarn install
    ```

3. Start the Browser from the `eg-browser` folder:

    ```sh
    cd eg-browser
    yarn dev
    ```

4. Open the address printed in the terminal, [http://localhost:5173/browser/](http://localhost:5173/browser/):

    ```sh
      VITE v5.4.21  ready in 370 ms

      ➜  Local:   http://localhost:5173/browser/
      ➜  Network: use --host to expose
    ```

The repository holds three packages: `eg-browser` (the web application), `eg-tracks` (the track rendering library it is built on) and `docs` (this documentation).

## Build and deploy

In the `eg-browser` folder, run:

```sh
yarn build
```

The result is written to `eg-browser/dist`. Copy the contents of that folder to your web server so that they are served at `/browser/`, for example into a `browser` folder inside the web server's document root.

:::info note

The build expects to be served from the path `/browser/`. This is set by `base` in `eg-browser/vite.config.ts`.
:::

Each build includes a `version.json` file. A Browser page that is already open checks this file every few minutes and offers to reload when a newer build has been deployed, so users do not stay on an old version.

## Optional settings

### Firebase

Sharing a session through a session bundle Id stores the session in a [Firebase](https://firebase.google.com/) Realtime Database. The database is configured with four variables in the file `eg-browser/.env`, read when the Browser is started or built:

```sh
VITE_FIREBASE_KEY=...
VITE_FIREBASE_DOMAIN=...
VITE_FIREBASE_DATABASE=...
VITE_FIREBASE_STORAGE_BUCKET=...
```

To use your own database, create a Firebase project with a Realtime Database and put its values here. Without these settings the Browser still starts and displays tracks; only saving and retrieving session bundles is unavailable. Sessions are always kept in your web browser's own storage, and can be downloaded to and loaded from a file, without Firebase.

### Links to the retired 1st-generation browser

Links published for the 1st-generation browser use the path `/legacy/`. To keep them working on your server, send requests for `/legacy/` to `/browser/` with the same parameters. Either add a redirect rule to your web server or proxy, or serve the file `legacy-redirect.html` (part of every build) as the index page of `/legacy/`. The Browser then converts the legacy parameters itself, see [legacy links](url-params.md#legacy-links-datahub-coordinate).

## Use the Browser in your own web application

The Browser is published on the NPM registry as the React component [`wuepgg`](https://www.npmjs.com/package/wuepgg). An example application is available at [twlab/embed-eg3](https://github.com/twlab/embed-eg3).

Install the package (React 18 or 19 is required):

```sh
npm install wuepgg
```

Import the `GenomeHub` component and its style sheet, and render it:

```jsx
import { GenomeHub } from "wuepgg";
import "wuepgg/style.css";

const tracks = [
  { type: "ruler", name: "Ruler" },
  { type: "geneAnnotation", name: "refGene", genome: "hg19" },
];

export default function Browser() {
  return (
    <GenomeHub
      storeConfig={{ storeId: "genome-1" }}
      genomeName="hg19"
      viewRegion={{ genomeCoordinate: "chr7:27053397-27373765" }}
      tracks={tracks}
      showGenomeNavigator={true}
      showNavBar={true}
      showToolBar={true}
    />
  );
}
```

The main properties of `GenomeHub` are:

| Property | Description |
| --- | --- |
| `storeConfig` | State settings of this instance. `storeId` names the instance; give each instance on a page its own id. By default the state is kept in the web browser's storage; set `enablePersistence: false` to start fresh every time. |
| `genomeName` | Genome assembly to load, for example `"hg38"` or `"mm10"`. |
| `viewRegion` | Region to display first, for example `"chr7:27053397-27373765"`. |
| `tracks` | Tracks to display, written the same way as tracks in a [datahub](datahub/datahub.md). |
| `showGenomeNavigator`, `showNavBar`, `showToolBar` | Show the genome navigator, the navigation bar and the toolbar. |
| `width`, `height` | Size of the component in pixels. |
| `darkMode` | Use the dark theme. |
| `onSessionUpdate` | Function called whenever the session changes (title, view region or tracks), with the session data, or `null` when no session is active. |

The full list of properties is in the [package description](https://www.npmjs.com/package/wuepgg).

## Run the tests

The track library has unit tests. Run them from the `eg-tracks` folder:

```sh
yarn test
```

## Build this documentation

The documentation is a [Docusaurus](https://docusaurus.io/) site in the `docs` folder. From that folder:

```sh
yarn start      # preview at http://localhost:3000 while editing
yarn build      # build the static site into docs/build
```
